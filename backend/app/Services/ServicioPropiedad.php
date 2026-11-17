<?php

namespace App\Services;

use App\Models\Mascota;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

class ServicioPropiedad
{
    /** Se llama dentro del bloqueo de la mascota. propietario_id es solo el anclaje interno. */
    public function abandonar(Mascota $mascota, Usuario $usuario): ?string
    {
        $otros = DB::table('colaboradores_mascota')->where('mascota_id', $mascota->id)
            ->where('permiso', 'propietario')->whereNull('revocado_en')->where('usuario_id', '!=', $usuario->id);

        // Los códigos del propietario que sale no deben seguir concediendo acceso.
        DB::table('codigos_colaboracion')->where('mascota_id', $mascota->id)->where('creado_por_id', $usuario->id)
            ->whereNull('usado_en')->whereNull('cancelado_en')->update(['cancelado_en' => now()]);

        if ((int) $mascota->propietario_id !== (int) $usuario->id || ($sucesor = $otros->orderBy('id')->first())) {
            if ((int) $mascota->propietario_id === (int) $usuario->id) {
                $mascota->propietario_id = $sucesor->usuario_id;
                $mascota->save();
                DB::table('colaboradores_mascota')->where('id', $sucesor->id)->update(['revocado_en' => now(), 'revocado_por_id' => $usuario->id]);
            } else {
                DB::table('colaboradores_mascota')->where('mascota_id', $mascota->id)->where('usuario_id', $usuario->id)
                    ->whereNull('revocado_en')->update(['revocado_en' => now(), 'revocado_por_id' => $usuario->id]);
            }
            DB::table('tareas')->where('mascota_id', $mascota->id)->where('responsable_id', $usuario->id)->update(['responsable_id' => null]);
            return null;
        }

        // Último propietario: eliminación definitiva, incluidos registros ya archivados.
        $tratamientos = DB::table('tratamientos')->where('mascota_id', $mascota->id)->pluck('id');
        DB::table('resoluciones_dosis')->whereIn('tratamiento_id', $tratamientos)->delete();
        DB::table('versiones_tratamiento')->whereIn('tratamiento_id', $tratamientos)->delete();
        foreach (['citas', 'tareas', 'tratamientos', 'vacunas', 'desparasitaciones', 'consultas_veterinarias',
            'alergias', 'codigos_colaboracion', 'transferencias_propiedad', 'colaboradores_mascota', 'auditoria_cambios'] as $tabla) {
            DB::table($tabla)->where('mascota_id', $mascota->id)->delete();
        }
        $foto = $mascota->foto_ruta;
        $mascota->forceDelete();
        return $foto;
    }
}
