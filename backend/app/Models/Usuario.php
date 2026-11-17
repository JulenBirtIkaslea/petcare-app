<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Usuario extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuarios';
    public const CREATED_AT = 'creado_en';
    public const UPDATED_AT = 'actualizado_en';
    protected $fillable = ['nombre', 'correo', 'contrasena'];
    protected $hidden = ['contrasena', 'token_recuerdo', 'recuperacion_hash', 'version_sesion'];

    protected function casts(): array
    {
        return ['contrasena' => 'hashed', 'correo_verificado_en' => 'datetime', 'eliminado_en' => 'datetime', 'version_sesion' => 'integer'];
    }

    public function getAuthPasswordName(): string
    {
        return 'contrasena';
    }

    public function getRememberTokenName(): string
    {
        return 'token_recuerdo';
    }
}
