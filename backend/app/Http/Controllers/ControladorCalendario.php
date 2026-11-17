<?php

namespace App\Http\Controllers;

use App\Models\Mascota;
use App\Services\ServicioAcceso;
use App\Services\ServicioTratamientos;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ControladorCalendario extends Controller
{
    public function __construct(private ServicioAcceso $acceso, private ServicioTratamientos $tratamientos) {}

    public function index(Request $r)
    {
        $r->validate(['mascota_id' => 'nullable|integer', 'tipo' => 'nullable|in:cita,tarea,vacuna,desparasitacion,dosis', 'incluir_atrasados' => 'nullable|boolean']);
        [$desde, $hasta] = $this->tratamientos->ventana($r->query(), $r->user()->zona_horaria);
        $mascotas = Mascota::accesiblesPor($r->user())->when($r->filled('mascota_id'), fn ($q) => $q->where('id', $r->query('mascota_id')))->get();
        $eventos = []; $filtro = $r->query('tipo'); $atrasados = $r->boolean('incluir_atrasados', true);
        foreach ($mascotas as $m) {
            $permiso = $this->acceso->permiso($r->user(), $m);
            foreach (['citas' => ['cita', 'fecha_hora_inicio'], 'tareas' => ['tarea', 'fecha_hora_programada']] as $tabla => [$tipo, $fecha]) {
                if ($filtro && $filtro !== $tipo) continue;
                $filas = DB::table($tabla)->where('mascota_id', $m->id)->whereNull('eliminado_en')->where(function ($q) use ($fecha, $desde, $hasta, $atrasados) {
                    $q->where(fn ($q) => $q->where($fecha, '>=', $desde)->where($fecha, '<', $hasta));
                    if ($atrasados) $q->orWhere(fn ($q) => $q->where($fecha, '<', $desde)->whereIn('estado', ['pendiente', 'programada']));
                })->get();
                foreach ($filas as $f) $eventos[] = ['clave' => $tipo.':'.$f->id, 'id' => $f->id, 'mascota_id' => $m->id, 'mascota_nombre' => $m->nombre,
                    'tipo' => $tipo, 'titulo' => $f->titulo, 'fecha' => CarbonImmutable::parse($f->$fecha)->setTimezone($r->user()->zona_horaria)->toDateString(),
                    'instante' => CarbonImmutable::parse($f->$fecha)->toIso8601String(), 'estado' => $f->estado, 'datos' => $f,
                    'puede_editar' => ServicioAcceso::permite($permiso, 'editar') && ($permiso === 'propietario' || (int) $f->creado_por_id === (int) $r->user()->id),
                    'puede_resolver' => ServicioAcceso::permite($permiso, 'editar') && ($tipo === 'tarea' || $permiso === 'propietario' || (int) $f->creado_por_id === (int) $r->user()->id)];
            }
            foreach (['vacunas' => ['vacuna', 'proxima_dosis_fecha', 'nombre'], 'desparasitaciones' => ['desparasitacion', 'proxima_aplicacion_fecha', 'producto']] as $tabla => [$tipo, $fecha, $titulo]) {
                if ($filtro && $filtro !== $tipo) continue;
                $filas = DB::table($tabla)->where('mascota_id', $m->id)->whereNull('eliminado_en')->whereNull('prevision_atendida_en')
                    ->whereNotNull($fecha)->where($fecha, '<', $hasta->toDateString())->when(!$atrasados, fn ($q) => $q->where($fecha, '>=', $desde->toDateString()))->get();
                foreach ($filas as $f) $eventos[] = ['clave' => $tipo.':'.$f->id, 'id' => $f->id, 'mascota_id' => $m->id, 'mascota_nombre' => $m->nombre,
                    'tipo' => $tipo, 'titulo' => $f->$titulo, 'fecha' => $f->$fecha, 'instante' => null, 'datos' => $f,
                    'estado' => $f->$fecha < CarbonImmutable::now($m->zona_horaria)->toDateString() ? 'atrasada' : 'pendiente',
                    'puede_editar' => false, 'puede_resolver' => ServicioAcceso::permite($permiso, 'editar')];
            }
            if (!$filtro || $filtro === 'dosis') {
                $tratamientos = DB::table('tratamientos')->where('mascota_id', $m->id)->whereNull('eliminado_en')->pluck('id');
                foreach ($tratamientos as $id) foreach ($this->tratamientos->dosis($id, $desde, $hasta) as $d) {
                    $eventos[] = ['clave' => 'dosis:'.$d['dosis_clave'], 'id' => $id, 'mascota_id' => $m->id, 'mascota_nombre' => $m->nombre,
                        'tipo' => 'dosis', 'titulo' => $d['nombre'], 'fecha' => CarbonImmutable::parse($d['fecha_hora_programada'])->setTimezone($r->user()->zona_horaria)->toDateString(),
                        'instante' => $d['fecha_hora_programada'], 'estado' => $d['estado'], 'datos' => $d,
                        'puede_editar' => false, 'puede_resolver' => ServicioAcceso::permite($permiso, 'editar') && !$d['cancelado']];
                }
            }
        }
        usort($eventos, fn ($a, $b) => strcmp($a['fecha'].($a['instante'] ?? ''), $b['fecha'].($b['instante'] ?? '')));
        return ['eventos' => array_slice($eventos, 0, 5000), 'limitado' => count($eventos) > 5000];
    }
}
