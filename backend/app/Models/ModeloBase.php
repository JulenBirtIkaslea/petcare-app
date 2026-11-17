<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

abstract class ModeloBase extends Model
{
    public const CREATED_AT = 'creado_en';
    public const UPDATED_AT = 'actualizado_en';
    public const DELETED_AT = 'eliminado_en';

    // Cada servicio debe habilitar explícitamente los campos que recibe del cliente.
    protected $guarded = ['*'];
}
