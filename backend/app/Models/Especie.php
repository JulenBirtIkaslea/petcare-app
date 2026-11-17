<?php

namespace App\Models;

class Especie extends ModeloBase
{
    protected $table = 'especies';
    public $timestamps = false;

    protected function casts(): array
    {
        return ['habilitada' => 'boolean'];
    }
}
