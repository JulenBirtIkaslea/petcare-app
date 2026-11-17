<?php

namespace App\Services;

use App\Models\Mascota;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ServicioTratamientos
{
    public function __construct(private GeneradorDosis $generador) {}

    public function validar(array $datos, string $tipo, string $zona): array
    {
        $r = Validator::make($datos, [
            'indicaciones' => 'required|string|max:5000', 'cantidad' => ($tipo === 'medicamento' ? 'required' : 'nullable').'|numeric|gt:0|max:9999999',
            'unidad' => 'nullable|required_with:cantidad|string|max:50', 'prescriptor' => 'nullable|string|max:200', 'observaciones' => 'nullable|string|max:5000',
            'fecha_inicio' => 'required|date_format:Y-m-d', 'fecha_fin' => 'nullable|date_format:Y-m-d|after_or_equal:fecha_inicio',
            'tipo_frecuencia' => 'required|in:diaria,cada_horas,dias_semana,unica',
            'intervalo_horas' => 'nullable|required_if:tipo_frecuencia,cada_horas|integer|between:1,720',
            'dias_semana' => 'nullable|required_if:tipo_frecuencia,dias_semana|array|min:1|max:7', 'dias_semana.*' => 'integer|between:1,7|distinct',
            'horarios' => 'nullable|array|min:1|max:24', 'horarios.*' => 'required|date_format:H:i|distinct',
            'hora_inicio' => 'nullable|required_if:tipo_frecuencia,cada_horas|date_format:H:i',
        ])->validate();
        if ($r['tipo_frecuencia'] !== 'cada_horas' && empty($r['horarios'])) throw ValidationException::withMessages(['horarios' => 'Indica al menos un horario.']);
        if ($r['tipo_frecuencia'] === 'unica' && (count($r['horarios']) !== 1 || ($r['fecha_fin'] ?? null) !== $r['fecha_inicio'])) {
            throw ValidationException::withMessages(['fecha_fin' => 'Una dosis única necesita un horario y la misma fecha de inicio y fin.']);
        }
        $r['zona_horaria'] = $zona;
        $r['ancla_en'] = $r['tipo_frecuencia'] === 'cada_horas' ? CarbonImmutable::parse($r['fecha_inicio'].' '.$r['hora_inicio'], $zona)->utc()->toIso8601String() : null;
        unset($r['hora_inicio']);
        $r['intervalo_horas'] = $r['tipo_frecuencia'] === 'cada_horas' ? $r['intervalo_horas'] : null;
        $r['dias_semana'] = $r['tipo_frecuencia'] === 'dias_semana' ? array_map('intval', $r['dias_semana']) : null;
        $r['horarios'] = $r['tipo_frecuencia'] === 'cada_horas' ? null : $r['horarios'];
        return $r;
    }

    public function escribirVersion(array $datos): int
    {
        foreach (['dias_semana', 'horarios'] as $campo) $datos[$campo] = $datos[$campo] === null ? null : json_encode($datos[$campo]);
        return DB::table('versiones_tratamiento')->insertGetId($datos);
    }

    public function version(object $v): array
    {
        $datos = (array) $v;
        foreach (['dias_semana', 'horarios'] as $campo) $datos[$campo] = is_string($datos[$campo]) ? json_decode($datos[$campo], true) : $datos[$campo];
        $datos['hora_inicio'] = empty($datos['ancla_en']) ? null : CarbonImmutable::parse($datos['ancla_en'])->setTimezone($datos['zona_horaria'])->format('H:i');
        return $datos;
    }

    public function detalle(int $id): array
    {
        $t = DB::table('tratamientos')->find($id); abort_unless($t, 404);
        $versiones = DB::table('versiones_tratamiento')->where('tratamiento_id', $id)->orderBy('numero_version')->get()->map(fn ($v) => $this->version($v));
        $ultima = $versiones->last();
        $estado = $t->estado;
        if ($estado === 'en_curso' && $ultima && !empty($ultima['fecha_fin']) && CarbonImmutable::now($ultima['zona_horaria'])->toDateString() > $ultima['fecha_fin']) $estado = 'finalizado';
        return [...(array) $t, 'estado' => $estado, 'versiones' => $versiones, 'version_actual' => $ultima];
    }

    public function dosis(int $id, CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        $t = DB::table('tratamientos')->find($id); abort_unless($t, 404);
        $versiones = DB::table('versiones_tratamiento')->where('tratamiento_id', $id)->orderBy('numero_version')->get();
        $resueltas = DB::table('resoluciones_dosis')->where('tratamiento_id', $id)->whereBetween('fecha_hora_programada', [$desde, $hasta])->get()->keyBy('dosis_clave');
        $resultado = [];
        foreach ($versiones as $v) {
            $limite = $hasta;
            if ($t->cancelado_en) $limite = $limite->min(CarbonImmutable::parse($t->cancelado_en));
            if ($t->finalizado_en) $limite = $limite->min(CarbonImmutable::parse($t->finalizado_en));
            if ($limite->lte($desde)) continue;
            foreach ($this->generador->generar($this->version($v), $desde, $limite) as $dosis) {
                $resuelta = $resueltas->get($dosis['dosis_clave']);
                $resultado[] = [...$dosis, 'tratamiento_id' => $id, 'nombre' => $t->nombre, 'cantidad' => $v->cantidad, 'unidad' => $v->unidad,
                    'estado' => $resuelta?->estado ?? (CarbonImmutable::parse($dosis['fecha_hora_programada'])->lt(now()) ? 'atrasada' : 'pendiente'),
                    'resolucion' => $resuelta, 'cancelado' => $t->estado === 'cancelado'];
            }
        }
        // Conservar también las resoluciones cuyo tratamiento se cerró tras administrarlas con antelación.
        $claves = array_column($resultado, 'dosis_clave');
        foreach ($resueltas as $r) if (!in_array($r->dosis_clave, $claves, true)) $resultado[] = [...(array) $r,
            'nombre' => $t->nombre, 'resolucion' => $r, 'cancelado' => $t->estado === 'cancelado'];
        usort($resultado, fn ($a, $b) => strcmp($a['fecha_hora_programada'], $b['fecha_hora_programada']));
        return $resultado;
    }

    public function ventana(array $entrada, string $zona = 'Europe/Madrid'): array
    {
        $datos = Validator::make($entrada, ['desde' => 'required|date_format:Y-m-d', 'hasta' => 'required|date_format:Y-m-d|after_or_equal:desde'])->validate();
        $desde = CarbonImmutable::parse($datos['desde'], $zona)->startOfDay();
        $hasta = CarbonImmutable::parse($datos['hasta'], $zona)->addDay()->startOfDay();
        if ($desde->diffInDays($hasta) > 93) throw ValidationException::withMessages(['hasta' => 'Selecciona un intervalo de hasta 93 días.']);
        return [$desde, $hasta];
    }
}
