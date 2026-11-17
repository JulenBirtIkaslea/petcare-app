<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ValidarMascota
{
    public static function datos(array $entrada): array
    {
        $datos = Validator::make($entrada, [
            'nombre' => 'required|string|max:60', 'especie_id' => ['required', 'integer', Rule::exists('especies', 'id')->where('habilitada', true)],
            'otra_especie' => 'nullable|string|max:80', 'raza' => 'nullable|string|max:100',
            'sexo' => 'nullable|in:macho,hembra,desconocido', 'precision_nacimiento' => 'required|in:exacta,mes_anio,anio,desconocida',
            'anio_nacimiento' => 'nullable|integer|min:1|max:9999', 'mes_nacimiento' => 'nullable|integer|between:1,12',
            'dia_nacimiento' => 'nullable|integer|between:1,31', 'peso_actual_kg' => 'nullable|numeric|gt:0|max:9999999',
            'esterilizacion' => 'required|in:si,no,desconocido', 'microchip' => 'nullable|string|max:30',
            'color_caracteristicas' => 'nullable|string|max:150', 'observaciones' => 'nullable|string|max:1000',
            'zona_horaria' => 'required|timezone',
        ])->validate();
        self::nacimiento($datos);
        $especie = \App\Models\Especie::findOrFail($datos['especie_id']);
        if ($especie->codigo === 'otra' && empty($datos['otra_especie'])) {
            throw ValidationException::withMessages(['otra_especie' => 'Indica la especie de tu mascota.']);
        }
        if ($especie->codigo !== 'otra') $datos['otra_especie'] = null;
        return $datos;
    }

    public static function nacimiento(array $datos): void
    {
        $precision = $datos['precision_nacimiento'];
        $anio = $datos['anio_nacimiento'] ?? null; $mes = $datos['mes_nacimiento'] ?? null; $dia = $datos['dia_nacimiento'] ?? null;
        $valido = match ($precision) {
            'desconocida' => $anio === null && $mes === null && $dia === null,
            'anio' => $anio !== null && $mes === null && $dia === null,
            'mes_anio' => $anio !== null && $mes !== null && $dia === null,
            'exacta' => $anio !== null && $mes !== null && $dia !== null,
            default => false,
        };
        if (!$valido || ($anio !== null && !checkdate((int) ($mes ?? 1), (int) ($dia ?? 1), (int) $anio))) {
            throw ValidationException::withMessages(['precision_nacimiento' => 'Revisa los componentes de la fecha de nacimiento.']);
        }
        if ($anio !== null && sprintf('%04d-%02d-%02d', $anio, $mes ?? 1, $dia ?? 1) > CarbonImmutable::now($datos['zona_horaria'])->toDateString()) {
            throw ValidationException::withMessages(['anio_nacimiento' => 'El nacimiento no puede ser futuro.']);
        }
    }
}
