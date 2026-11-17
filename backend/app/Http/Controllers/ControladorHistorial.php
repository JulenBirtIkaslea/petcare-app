<?php

namespace App\Http\Controllers;

use App\Services\ServicioAcceso;
use App\Services\ServicioHistorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ControladorHistorial extends Controller
{
    public function __construct(private ServicioAcceso $acceso, private ServicioHistorial $historial) {}

    public function index(Request $r, int $mascota)
    {
        $m = $this->acceso->obtener($r->user(), $mascota);
        return $this->historial->listar($m, $r->user(), $this->acceso, $r->query('tipo'));
    }

    public function crear(Request $r, int $mascota, string $tipo)
    {
        [$tabla] = $this->historial->meta($tipo);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tipo, $tabla) {
            $datos = $this->historial->validar($tipo, $r->all(), $m);
            $id = DB::table($tabla)->insertGetId([...$datos, 'mascota_id' => $m->id, 'creado_por_id' => $r->user()->id]);
            $nuevo = DB::table($tabla)->find($id);
            $this->acceso->auditar($tabla, $id, $r->user(), 'creacion', null, $nuevo, null, $m->id);
            return response()->json($nuevo, 201);
        });
    }

    public function actualizar(Request $r, int $mascota, string $tipo, int $registro)
    {
        [$tabla] = $this->historial->meta($tipo);
        $r->validate(['motivo_correccion' => 'required|string|max:1000']);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tipo, $tabla, $registro) {
            $antes = DB::table($tabla)->where('mascota_id', $m->id)->whereNull('eliminado_en')->find($registro); abort_unless($antes, 404);
            $this->acceso->exigirAutor($r->user(), $m, $antes);
            $datos = $this->historial->validar($tipo, array_replace((array) $antes, $r->all()), $m);
            $proxima = $tipo === 'vacunas' ? 'proxima_dosis_fecha' : ($tipo === 'desparasitaciones' ? 'proxima_aplicacion_fecha' : null);
            if ($proxima && $antes->prevision_atendida_en) abort_if(($datos[$proxima] ?? null) !== $antes->$proxima, 409, 'La previsión ya está atendida y conserva su fecha original.');
            DB::table($tabla)->where('id', $registro)->update([...$datos, 'actualizado_por_id' => $r->user()->id]);
            $nuevo = DB::table($tabla)->find($registro);
            $this->acceso->auditar($tabla, $registro, $r->user(), 'correccion', $antes, $nuevo, $r->input('motivo_correccion'), $m->id);
            return $nuevo;
        });
    }

    public function eliminar(Request $r, int $mascota, string $tipo, int $registro)
    {
        [$tabla] = $this->historial->meta($tipo);
        $r->validate(['motivo_correccion' => 'required|string|max:1000']);
        $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tabla, $registro) {
            $antes = DB::table($tabla)->where('mascota_id', $m->id)->whereNull('eliminado_en')->find($registro); abort_unless($antes, 404);
            $this->acceso->exigirAutor($r->user(), $m, $antes);
            DB::table($tabla)->where('id', $registro)->update(['eliminado_en' => now(), 'eliminado_por_id' => $r->user()->id]);
            $this->acceso->auditar($tabla, $registro, $r->user(), 'eliminacion', $antes, null, $r->input('motivo_correccion'), $m->id);
        });
        return response()->noContent();
    }

    public function siguiente(Request $r, int $mascota, string $tipo, int $registro)
    {
        abort_unless(in_array($tipo, ['vacunas', 'desparasitaciones']), 404);
        [$tabla, $fecha] = $this->historial->meta($tipo);
        return $this->acceso->modificar($r->user(), $mascota, 'editar', function ($m) use ($r, $tabla, $tipo, $registro, $fecha) {
            $anterior = DB::table($tabla)->where('mascota_id', $m->id)->whereNull('eliminado_en')->find($registro); abort_unless($anterior, 404);
            $proxima = $tipo === 'vacunas' ? 'proxima_dosis_fecha' : 'proxima_aplicacion_fecha';
            $fk = $tipo === 'vacunas' ? 'vacuna_anterior_id' : 'desparasitacion_anterior_id';
            abort_unless($anterior->$proxima && !$anterior->prevision_atendida_en, 409, 'La previsión ya se ha atendido o no existe.');
            $datos = $this->historial->validar($tipo, $r->all(), $m);
            abort_if($datos[$fecha] < $anterior->$fecha, 422, 'La nueva administración no puede ser anterior a la original.');
            $id = DB::table($tabla)->insertGetId([...$datos, 'mascota_id' => $m->id, $fk => $registro, 'creado_por_id' => $r->user()->id]);
            DB::table($tabla)->where('id', $registro)->update(['prevision_atendida_en' => now()]);
            $nuevo = DB::table($tabla)->find($id);
            $this->acceso->auditar($tabla, $id, $r->user(), 'administracion_siguiente', null, $nuevo, null, $m->id);
            $this->acceso->auditar($tabla, $registro, $r->user(), 'prevision_atendida', $anterior, DB::table($tabla)->find($registro), null, $m->id);
            return response()->json($nuevo, 201);
        });
    }
}
