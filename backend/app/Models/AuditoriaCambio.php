<?php

namespace App\Models;


/** Mapeo database first. Las escrituras se incorporarán con sus políticas y servicios. */
class AuditoriaCambio extends ModeloBase
{
    protected $table = 'auditoria_cambios';
    public $timestamps = false;
}
