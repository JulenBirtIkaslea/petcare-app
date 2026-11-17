<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

class ServicioCodigos
{
    public static function generar(): string
    {
        $alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $codigo = '';
        for ($i = 0; $i < 16; $i++) $codigo .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
        return implode('-', str_split($codigo, 4));
    }

    public static function normalizar(string $codigo): string
    {
        return strtoupper(preg_replace('/[\s-]+/', '', $codigo));
    }

    public static function hash(string $codigo): string
    {
        $normalizado = self::normalizar($codigo);
        if (!preg_match('/^[A-HJ-NP-Z2-9]{16}$/', $normalizado)) {
            throw ValidationException::withMessages(['codigo' => 'El código debe contener 16 letras o números.']);
        }
        return hash('sha256', $normalizado);
    }
}
