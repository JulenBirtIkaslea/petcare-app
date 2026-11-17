<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use InvalidArgumentException;

/** Cálculo puro: horas transcurridas para intervalos, horas locales para rutinas. */
class GeneradorDosis
{
    public function generar(array $version, CarbonImmutable $desde, CarbonImmutable $hasta): array
    {
        if ($hasta->lt($desde) || $desde->diffInDays($hasta) > 94) throw new InvalidArgumentException('La ventana máxima es de 93 días.');
        $zona = $version['zona_horaria'];
        $inicio = CarbonImmutable::parse($version['fecha_inicio'], $zona)->startOfDay();
        $fin = empty($version['fecha_fin']) ? $hasta : CarbonImmutable::parse($version['fecha_fin'], $zona)->addDay()->startOfDay();
        $vigor = CarbonImmutable::parse($version['vigor_desde_en']);
        $cierre = empty($version['vigor_hasta_en']) ? $hasta : CarbonImmutable::parse($version['vigor_hasta_en']);
        $minimo = $desde->max($inicio)->max($vigor);
        $maximo = $hasta->min($fin)->min($cierre);
        if ($maximo->lte($minimo)) return [];
        $instantes = [];
        if ($version['tipo_frecuencia'] === 'cada_horas') {
            $ancla = CarbonImmutable::parse($version['ancla_en'])->utc();
            $segundos = (int) $version['intervalo_horas'] * 3600;
            if ($segundos < 3600) throw new InvalidArgumentException('Intervalo no válido.');
            $saltos = max(0, (int) ceil(($minimo->getTimestamp() - $ancla->getTimestamp()) / $segundos));
            for ($instante = $ancla->addSeconds($saltos * $segundos); $instante->lt($maximo); $instante = $instante->addSeconds($segundos)) {
                $instantes[] = $instante;
            }
        } else {
            $horarios = array_unique($version['horarios'] ?? []);
            for ($dia = $minimo->setTimezone($zona)->startOfDay(); $dia->lt($maximo); $dia = $dia->addDay()) {
                if ($version['tipo_frecuencia'] === 'dias_semana' && !in_array($dia->dayOfWeekIso, $version['dias_semana'] ?? [], true)) continue;
                if ($version['tipo_frecuencia'] === 'unica' && $dia->toDateString() !== $version['fecha_inicio']) continue;
                foreach ($horarios as $hora) {
                    $texto = $dia->toDateString().' '.substr($hora, 0, 5);
                    $instante = CarbonImmutable::createFromFormat('!Y-m-d H:i', $texto, $zona);
                    // La hora inexistente en el salto de primavera se omite; no se desplaza silenciosamente.
                    if ($instante->format('Y-m-d H:i') !== $texto) continue;
                    if ($instante->gte($minimo) && $instante->lt($maximo)) $instantes[] = $instante->utc();
                }
            }
        }
        usort($instantes, fn ($a, $b) => $a->getTimestamp() <=> $b->getTimestamp());
        return array_map(fn ($i) => ['version_tratamiento_id' => (int) $version['id'],
            'fecha_hora_programada' => $i->utc()->toIso8601String(),
            'dosis_clave' => $version['id'].':'.$i->utc()->format('Y-m-d\TH:i:s\Z')], $instantes);
    }
}
