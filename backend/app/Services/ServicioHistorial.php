<?php

namespace App\Services;

use App\Models\Mascota;
use App\Models\Usuario;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ServicioHistorial
{
    public const TIPOS = [
        'consultas' => ['consultas_veterinarias', 'fecha_consulta', 'motivo'],
        'vacunas' => ['vacunas', 'fecha_administracion', 'nombre'],
        'desparasitaciones' => ['desparasitaciones', 'fecha_aplicacion', 'producto'],
        'alergias' => ['alergias', 'fecha_deteccion', 'alergeno'],
    ];

    public function meta(string $tipo): array
    {
        abort_unless(isset(self::TIPOS[$tipo]), 404);
        return self::TIPOS[$tipo];
    }

    public function validar(string $tipo, array $entrada, Mascota $mascota): array
    {
        [, $fecha, $titulo] = $this->meta($tipo);
        $reglas = [$titulo => 'required|string|max:'.($tipo === 'consultas' ? 500 : 150),
            $fecha => ($tipo === 'alergias' ? 'nullable' : 'required').'|date_format:Y-m-d|before_or_equal:'.CarbonImmutable::now($mascota->zona_horaria)->toDateString(),
            'observaciones' => 'nullable|string|max:5000'];
        $reglas += match ($tipo) {
            'consultas' => ['clinica_veterinario' => 'nullable|string|max:200', 'diagnostico' => 'nullable|string|max:5000', 'recomendaciones' => 'nullable|string|max:5000'],
            'vacunas' => ['clinica_veterinario' => 'nullable|string|max:200', 'numero_lote' => 'nullable|string|max:100', 'proxima_dosis_fecha' => 'nullable|date_format:Y-m-d|after:fecha_administracion'],
            'desparasitaciones' => ['tipo' => 'required|in:interna,externa,ambas', 'proxima_aplicacion_fecha' => 'nullable|date_format:Y-m-d|after:fecha_aplicacion'],
            'alergias' => ['tipo' => 'nullable|string|max:100', 'sintomas' => 'nullable|string|max:5000', 'gravedad' => 'nullable|in:leve,moderada,grave'],
        };
        return Validator::make($entrada, $reglas)->validate();
    }

    public function listar(Mascota $mascota, Usuario $usuario, ServicioAcceso $acceso, ?string $filtro): array
    {
        if ($filtro) $this->meta($filtro);
        $filas = collect();
        foreach (self::TIPOS as $tipo => [$tabla, $fecha, $titulo]) {
            if ($filtro && $filtro !== $tipo) continue;
            $registros = DB::table($tabla.' as r')->join('usuarios as u', 'u.id', '=', 'r.creado_por_id')
                ->where('r.mascota_id', $mascota->id)->whereNull('r.eliminado_en')->select('r.*', 'u.nombre as autor')->get();
            foreach ($registros as $r) {
                $filas->push([... (array) $r, 'clase' => $tipo, 'fecha' => $r->$fecha, 'titulo' => $r->$titulo,
                    'puede_editar' => ServicioAcceso::permite($acceso->permiso($usuario, $mascota), 'editar')]);
            }
        }
        return $filas->sortByDesc(fn ($fila) => $fila['fecha'] ?? $fila['creado_en'])->values()->all();
    }
}
