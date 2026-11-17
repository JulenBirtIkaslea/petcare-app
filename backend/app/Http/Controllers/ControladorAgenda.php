<?php

namespace App\Http\Controllers;

use App\Services\ServicioAcceso;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ControladorAgenda extends Controller
{
    public function __construct(private ServicioAcceso $acceso) {}

    private function tabla(string $tipo): string
    {
        abort_unless(in_array($tipo, ['citas', 'tareas'], true), 404); return $tipo;
    }

    public function index(Request $r, int $mascota, string $tipo)
    {
        $this->acceso->obtener($r->user(), $mascota); $this->tabla($tipo);
        return DB::table($tipo)->where('mascota_id', $mascota)->whereNull('eliminado_en')->orderBy($tipo === 'citas' ? 'fecha_hora_inicio' : 'fecha_hora_programada')->get();
    }

    public function crear(Request $r, int $mascota, string $tipo)
    {
        $this->tabla($tipo);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tipo) {
            $datos = $this->validar($r, $tipo, $m);
            $id = DB::table($tipo)->insertGetId([...$datos, 'mascota_id' => $m->id, 'creado_por_id' => $r->user()->id]);
            $nuevo = DB::table($tipo)->find($id);
            $this->acceso->auditar($tipo, $id, $r->user(), 'creacion', null, $nuevo, null, $m->id);
            return response()->json($nuevo, 201);
        });
    }

    public function actualizar(Request $r, int $mascota, string $tipo, int $registro)
    {
        $this->tabla($tipo);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tipo, $registro) {
            $antes = DB::table($tipo)->where('mascota_id', $m->id)->whereNull('eliminado_en')->find($registro); abort_unless($antes, 404);
            $this->acceso->exigirAutor($r->user(), $m, $antes);
            abort_unless(in_array($antes->estado, ['pendiente', 'programada']), 409, 'El evento ya está cerrado.');
            $datos = $this->validar($r, $tipo, $m);
            DB::table($tipo)->where('id', $registro)->update($datos);
            $nuevo = DB::table($tipo)->find($registro);
            $this->acceso->auditar($tipo, $registro, $r->user(), 'edicion', $antes, $nuevo, null, $m->id);
            return $nuevo;
        });
    }

    public function eliminar(Request $r, int $mascota, string $tipo, int $registro)
    {
        $this->tabla($tipo); $r->validate(['motivo' => 'required|string|max:1000']);
        $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tipo, $registro) {
            $antes = DB::table($tipo)->where('mascota_id', $m->id)->whereNull('eliminado_en')->find($registro); abort_unless($antes, 404);
            $this->acceso->exigirAutor($r->user(), $m, $antes);
            DB::table($tipo)->where('id', $registro)->update(['eliminado_en' => now()]);
            $this->acceso->auditar($tipo, $registro, $r->user(), 'eliminacion', $antes, null, $r->input('motivo'), $m->id);
        });
        return response()->noContent();
    }

    public function resolver(Request $r, int $mascota, string $tipo, int $registro)
    {
        $this->tabla($tipo);
        $r->validate(['estado' => $tipo === 'citas' ? 'required|in:realizada,cancelada' : 'required|in:completada,cancelada', 'consulta_veterinaria_id' => 'nullable|integer']);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tipo, $registro) {
            $antes = DB::table($tipo)->where('mascota_id', $m->id)->whereNull('eliminado_en')->find($registro); abort_unless($antes, 404);
            abort_unless(in_array($antes->estado, ['pendiente', 'programada']), 409, 'El evento ya está cerrado.');
            if ($tipo === 'citas' || $r->input('estado') === 'cancelada') $this->acceso->exigirAutor($r->user(), $m, $antes);
            $datos = ['estado' => $r->input('estado')];
            if ($tipo === 'tareas') {
                if ($datos['estado'] === 'completada') $datos += ['completado_por_id' => $r->user()->id, 'completado_en' => now()];
                else $datos['cancelado_en'] = now();
            } elseif ($r->filled('consulta_veterinaria_id')) {
                abort_unless(DB::table('consultas_veterinarias')->where('id', $r->input('consulta_veterinaria_id'))->where('mascota_id', $m->id)->whereNull('eliminado_en')->exists(), 422, 'La consulta debe pertenecer a esta mascota.');
                $datos['consulta_veterinaria_id'] = $r->input('consulta_veterinaria_id');
            }
            DB::table($tipo)->where('id', $registro)->update($datos);
            $nuevo = DB::table($tipo)->find($registro);
            $this->acceso->auditar($tipo, $registro, $r->user(), 'resolucion', $antes, $nuevo, null, $m->id);
            return $nuevo;
        });
    }

    private function validar(Request $r, string $tipo, $m): array
    {
        $fecha = $tipo === 'citas' ? 'fecha_hora_inicio' : 'fecha_hora_programada';
        $reglas = ['titulo' => 'required|string|max:150', 'descripcion' => 'nullable|string|max:5000', $fecha => 'required|date'];
        $reglas += $tipo === 'citas' ? ['lugar' => 'nullable|string|max:200'] : ['responsable_id' => 'nullable|integer'];
        $datos = $r->validate($reglas);
        $datos[$fecha] = CarbonImmutable::parse($datos[$fecha])->utc();
        if ($tipo === 'tareas' && !empty($datos['responsable_id'])) {
            $id = (int) $datos['responsable_id'];
            abort_unless($id === (int) $m->propietario_id || DB::table('colaboradores_mascota')->where('mascota_id', $m->id)->where('usuario_id', $id)->where('permiso', 'propietario')->whereNull('revocado_en')->exists(), 422, 'El responsable debe ser propietario de la mascota.');
        }
        return $datos;
    }
}
