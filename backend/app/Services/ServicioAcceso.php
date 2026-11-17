<?php

namespace App\Services;

use App\Models\Mascota;
use App\Models\Usuario;
use Closure;
use Illuminate\Support\Facades\DB;

class ServicioAcceso
{
    public function permiso(Usuario $usuario, Mascota $mascota): ?string
    {
        if ((int) $mascota->propietario_id === (int) $usuario->id) return 'propietario';
        if ($mascota->trashed()) return null;
        return DB::table('colaboradores_mascota')->where('mascota_id', $mascota->id)
            ->where('usuario_id', $usuario->id)->whereNull('revocado_en')->value('permiso');
    }

    public function obtener(Usuario $usuario, int $id, bool $papelera = false): Mascota
    {
        $mascota = ($papelera ? Mascota::withTrashed() : Mascota::query())->findOrFail($id);
        abort_unless($this->permiso($usuario, $mascota), 404, 'Mascota no encontrada.');
        return $mascota;
    }

    /** Todas las escrituras y revocaciones de una mascota comparten el mismo bloqueo. */
    public function modificar(Usuario $usuario, int $id, string $nivel, Closure $operacion, bool $papelera = false): mixed
    {
        return DB::transaction(function () use ($usuario, $id, $nivel, $operacion, $papelera) {
            $mascota = ($papelera ? Mascota::withTrashed() : Mascota::query())->lockForUpdate()->findOrFail($id);
            $permiso = $this->permiso($usuario, $mascota);
            abort_unless($permiso, 404, 'Mascota no encontrada.');
            abort_unless(self::permite($permiso, $nivel), 403, 'No tienes permiso para realizar esta acción.');
            $actual = Usuario::lockForUpdate()->findOrFail($usuario->id);
            abort_if($actual->eliminado_en || (int) $actual->version_sesion !== (int) $usuario->version_sesion, 401, 'La sesión ha caducado.');
            return $operacion($mascota, $permiso);
        }, 3);
    }

    public static function permite(?string $permiso, string $nivel): bool
    {
        return $permiso === 'propietario' || ($nivel === 'ver' && $permiso === 'ayudante');
    }

    public function exigirAutor(Usuario $usuario, Mascota $mascota, object $registro): void
    {
        abort_unless($this->permiso($usuario, $mascota) === 'propietario',
            403, 'Solo los propietarios pueden modificar los registros.');
    }

    public function auditar(string $entidad, int $id, Usuario $usuario, string $accion, mixed $antes, mixed $despues, ?string $motivo = null, ?int $mascota = null): void
    {
        DB::table('auditoria_cambios')->insert([
            'entidad_tipo' => $entidad, 'entidad_id' => $id, 'usuario_id' => $usuario->id,
            'accion' => $accion, 'motivo' => $motivo, 'mascota_id' => $mascota,
            'valores_anteriores' => $antes === null ? null : json_encode($antes, JSON_THROW_ON_ERROR),
            'valores_nuevos' => $despues === null ? null : json_encode($despues, JSON_THROW_ON_ERROR),
        ]);
    }
}
