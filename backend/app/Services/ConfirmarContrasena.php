<?php

namespace App\Services;

use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ConfirmarContrasena
{
    public static function comprobar(Usuario $usuario, string $contrasena): void
    {
        if (!Hash::check($contrasena, $usuario->contrasena)) {
            throw ValidationException::withMessages(['contrasena_actual' => 'La contraseña actual no es correcta.']);
        }
    }
}
