<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Mascota extends ModeloBase
{
    use SoftDeletes;

    protected $table = 'mascotas';
    protected $fillable = ['nombre', 'especie_id', 'otra_especie', 'raza', 'sexo',
        'precision_nacimiento', 'anio_nacimiento', 'mes_nacimiento', 'dia_nacimiento',
        'peso_actual_kg', 'esterilizacion', 'microchip', 'color_caracteristicas', 'observaciones', 'zona_horaria'];
    protected $hidden = ['foto_ruta'];

    protected function casts(): array
    {
        return ['peso_actual_kg' => 'decimal:3', 'eliminado_en' => 'datetime'];
    }

    public function especie(): BelongsTo
    {
        return $this->belongsTo(Especie::class, 'especie_id');
    }

    public function colaboradores(): HasMany
    {
        return $this->hasMany(ColaboradorMascota::class, 'mascota_id');
    }

    public function scopeAccesiblesPor(Builder $consulta, Usuario $usuario): Builder
    {
        return $consulta->where(fn (Builder $q) => $q->where('propietario_id', $usuario->id)
            ->orWhereHas('colaboradores', fn (Builder $c) => $c->where('usuario_id', $usuario->id)->whereNull('revocado_en')));
    }
}
