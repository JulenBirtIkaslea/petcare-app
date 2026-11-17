<?php

namespace App\Http\Controllers;

use App\Services\GeneradorDosis;
use App\Services\ServicioAcceso;
use App\Services\ServicioTratamientos;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ControladorTratamientos extends Controller
{
    public function __construct(private ServicioAcceso $acceso, private ServicioTratamientos $servicio, private GeneradorDosis $generador) {}

    public function index(Request $r, int $mascota)
    {
        $m = $this->acceso->obtener($r->user(), $mascota);
        return DB::table('tratamientos')->where('mascota_id', $m->id)->whereNull('eliminado_en')->orderByDesc('creado_en')->pluck('id')
            ->map(fn ($id) => $this->servicio->detalle($id));
    }

    public function crear(Request $r, int $mascota)
    {
        $r->validate(['nombre' => 'required|string|max:150', 'tipo' => 'required|in:medicamento,cuidado']);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r) {
            $pauta = $this->servicio->validar($r->all(), $r->input('tipo'), $m->zona_horaria);
            $id = DB::table('tratamientos')->insertGetId(['mascota_id' => $m->id, 'nombre' => $r->input('nombre'), 'tipo' => $r->input('tipo'), 'creado_por_id' => $r->user()->id]);
            $this->servicio->escribirVersion([...$pauta, 'tratamiento_id' => $id, 'numero_version' => 1,
                'vigor_desde_en' => CarbonImmutable::parse($pauta['fecha_inicio'], $m->zona_horaria)->utc(), 'creado_por_id' => $r->user()->id]);
            $nuevo = $this->servicio->detalle($id);
            $this->acceso->auditar('tratamientos', $id, $r->user(), 'creacion', null, $nuevo, null, $m->id);
            return response()->json($nuevo, 201);
        });
    }

    public function actualizar(Request $r, int $mascota, int $tratamiento)
    {
        $r->validate(['nombre' => 'required|string|max:150', 'motivo_cambio' => 'required|string|max:1000']);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tratamiento) {
            $t = $this->buscar($m->id, $tratamiento); $this->acceso->exigirAutor($r->user(), $m, $t);
            $antes = $this->servicio->detalle($t->id);
            abort_unless($antes['estado'] === 'en_curso', 409, 'El tratamiento ya está cerrado.');
            $instante = CarbonImmutable::now()->startOfSecond();
            abort_if(DB::table('resoluciones_dosis')->where('tratamiento_id', $t->id)->where('fecha_hora_programada', '>=', $instante)->exists(), 409, 'Hay dosis futuras ya resueltas. Corrige esas resoluciones antes de cambiar la pauta.');
            $pauta = $this->servicio->validar($r->all(), $t->tipo, $m->zona_horaria);
            abort_if(!empty($pauta['fecha_fin']) && $pauta['fecha_fin'] < $instante->setTimezone($m->zona_horaria)->toDateString(), 422, 'La nueva pauta debe afectar al presente o al futuro.');
            $ultima = $antes['version_actual'];
            // Una pauta todavía futura se conserva como versión sin ocurrencias efectivas.
            $cierre = $instante->max(CarbonImmutable::parse($ultima['vigor_desde_en']));
            DB::table('versiones_tratamiento')->where('id', $ultima['id'])->update(['vigor_hasta_en' => $cierre]);
            $this->servicio->escribirVersion([...$pauta, 'tratamiento_id' => $t->id, 'numero_version' => $ultima['numero_version'] + 1,
                'vigor_desde_en' => $instante, 'creado_por_id' => $r->user()->id, 'motivo_cambio' => $r->input('motivo_cambio')]);
            DB::table('tratamientos')->where('id', $t->id)->update(['nombre' => $r->input('nombre')]);
            $nuevo = $this->servicio->detalle($t->id);
            $this->acceso->auditar('tratamientos', $t->id, $r->user(), 'correccion', $antes, $nuevo, $r->input('motivo_cambio'), $m->id);
            return $nuevo;
        });
    }

    public function cerrar(Request $r, int $mascota, int $tratamiento)
    {
        $r->validate(['estado' => 'required|in:finalizado,cancelado', 'motivo' => 'required|string|max:1000']);
        $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tratamiento) {
            $t = $this->buscar($m->id, $tratamiento); $this->acceso->exigirAutor($r->user(), $m, $t);
            abort_unless($t->estado === 'en_curso', 409, 'El tratamiento ya está cerrado.');
            $estado = $r->input('estado');
            DB::table('tratamientos')->where('id', $t->id)->update(['estado' => $estado,
                $estado === 'cancelado' ? 'cancelado_en' : 'finalizado_en' => now(), 'motivo_cancelacion' => $r->input('motivo')]);
            $this->acceso->auditar('tratamientos', $t->id, $r->user(), $estado, $t, $this->servicio->detalle($t->id), $r->input('motivo'), $m->id);
        });
        return response()->noContent();
    }

    public function dosis(Request $r, int $mascota, int $tratamiento)
    {
        $m = $this->acceso->obtener($r->user(), $mascota); $this->buscar($m->id, $tratamiento);
        [$desde, $hasta] = $this->servicio->ventana($r->query(), $m->zona_horaria);
        return $this->servicio->dosis($tratamiento, $desde, $hasta);
    }

    public function resolver(Request $r, int $mascota, int $tratamiento)
    {
        $r->validate(['version_tratamiento_id' => 'required|integer', 'fecha_hora_programada' => 'required|date']);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tratamiento) {
            $t = $this->buscar($m->id, $tratamiento);
            abort_if($t->estado === 'cancelado', 409, 'El tratamiento está cancelado.');
            $v = DB::table('versiones_tratamiento')->where('tratamiento_id', $t->id)->find($r->input('version_tratamiento_id')); abort_unless($v, 404);
            $instante = CarbonImmutable::parse($r->input('fecha_hora_programada'))->utc();
            $candidatas = $this->generador->generar($this->servicio->version($v), $instante, $instante->addSecond());
            abort_unless(count($candidatas) === 1 && CarbonImmutable::parse($candidatas[0]['fecha_hora_programada'])->eq($instante), 422, 'La dosis no pertenece a esta pauta.');
            abort_if($t->finalizado_en && $instante->gte(CarbonImmutable::parse($t->finalizado_en)), 422, 'La dosis es posterior al cierre.');
            $datos = $this->validarResolucion($r, $m, $t->tipo);
            $id = DB::table('resoluciones_dosis')->insertGetId([...$datos, ...$candidatas[0], 'tratamiento_id' => $t->id, 'registrado_por_id' => $r->user()->id]);
            $nuevo = DB::table('resoluciones_dosis')->find($id);
            $this->acceso->auditar('resoluciones_dosis', $id, $r->user(), 'creacion', null, $nuevo, null, $m->id);
            return response()->json($nuevo, 201);
        });
    }

    public function corregir(Request $r, int $mascota, int $tratamiento, int $dosis)
    {
        $r->validate(['motivo_correccion' => 'required|string|max:1000']);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tratamiento, $dosis) {
            $t = $this->buscar($m->id, $tratamiento);
            $antes = DB::table('resoluciones_dosis')->where('tratamiento_id', $t->id)->find($dosis); abort_unless($antes, 404);
            abort_unless($this->acceso->permiso($r->user(), $m) === 'propietario', 403);
            $datos = $this->validarResolucion($r, $m, $t->tipo);
            DB::table('resoluciones_dosis')->where('id', $dosis)->update([...$datos, 'motivo_correccion' => $r->input('motivo_correccion')]);
            $nuevo = DB::table('resoluciones_dosis')->find($dosis);
            $this->acceso->auditar('resoluciones_dosis', $dosis, $r->user(), 'correccion', $antes, $nuevo, $r->input('motivo_correccion'), $m->id);
            return $nuevo;
        });
    }

    private function buscar(int $mascota, int $id): object
    {
        $t = DB::table('tratamientos')->where('mascota_id', $mascota)->whereNull('eliminado_en')->find($id); abort_unless($t, 404); return $t;
    }

    private function validarResolucion(Request $r, $mascota, string $tipo): array
    {
        $datos = $r->validate(['estado' => 'required|in:administrada,omitida', 'fecha_hora_real' => 'nullable|required_if:estado,administrada|date|before_or_equal:now',
            'cantidad_real' => 'nullable|numeric|gt:0|max:9999999', 'unidad_real' => 'nullable|required_with:cantidad_real|string|max:50',
            'realizado_por_usuario_id' => 'nullable|integer', 'realizado_por_nombre' => 'nullable|string|max:100',
            'observaciones' => 'nullable|string|max:5000', 'motivo_omision' => 'nullable|string|max:1000']);
        if ($datos['estado'] === 'administrada' && $tipo === 'medicamento') $r->validate(['cantidad_real' => 'required|numeric|gt:0', 'unidad_real' => 'required|string|max:50']);
        if (!empty($datos['realizado_por_usuario_id'])) {
            $id = (int) $datos['realizado_por_usuario_id'];
            abort_unless($id === (int) $mascota->propietario_id || DB::table('colaboradores_mascota')->where('mascota_id', $mascota->id)->where('usuario_id', $id)->whereNull('revocado_en')->exists(), 422, 'La persona indicada no tiene acceso a la mascota.');
            $datos['realizado_por_nombre'] = null;
        } elseif (empty($datos['realizado_por_nombre'])) $datos['realizado_por_usuario_id'] = $r->user()->id;
        if ($datos['estado'] === 'omitida') {
            foreach (['fecha_hora_real', 'cantidad_real', 'unidad_real', 'realizado_por_usuario_id', 'realizado_por_nombre'] as $campo) $datos[$campo] = null;
        } else $datos['fecha_hora_real'] = CarbonImmutable::parse($datos['fecha_hora_real'])->utc();
        return $datos;
    }
}
