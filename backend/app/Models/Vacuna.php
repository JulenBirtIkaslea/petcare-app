<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

/** Mapeo database first. Las escrituras se incorporarán con sus políticas y servicios. */
class Vacuna extends ModeloBase
{
    use SoftDeletes;

    protected $table = 'vacunas';
}
