<?php

namespace App\Models;

class CodigoColaboracion extends ModeloBase
{
    protected $table = 'codigos_colaboracion';
    public $timestamps = false;
    protected $hidden = ['codigo_hash'];
    protected function casts(): array
    {
        return ['creado_en' => 'datetime', 'caduca_en' => 'datetime', 'usado_en' => 'datetime', 'cancelado_en' => 'datetime'];
    }
}
