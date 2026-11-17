<?php

namespace App\Policies;

use App\Models\Mascota;
use App\Models\Usuario;

class MascotaPolicy
{
    public function view(Usuario $usuario, Mascota $mascota): bool
    {
        return $this->update($usuario, $mascota) || $mascota->colaboradores()
            ->where('usuario_id', $usuario->id)->whereNull('revocado_en')->exists();
    }

    public function update(Usuario $usuario, Mascota $mascota): bool
    {
        return (int) $mascota->propietario_id === (int) $usuario->id || $mascota->colaboradores()
            ->where('usuario_id', $usuario->id)->where('permiso', 'propietario')->whereNull('revocado_en')->exists();
    }

    public function delete(Usuario $usuario, Mascota $mascota): bool
    {
        return $this->update($usuario, $mascota);
    }
}
