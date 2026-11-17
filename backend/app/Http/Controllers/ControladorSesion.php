<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class ControladorSesion extends Controller
{
    public function registro(Request $r)
    {
        $r->merge(['correo' => mb_strtolower(trim((string) $r->input('correo')))]);
        $datos = $r->validate(['nombre' => 'required|string|max:100', 'correo' => 'required|email|max:254|unique:usuarios,correo',
            'contrasena' => ['required', 'confirmed', Password::min(10)->letters()->numbers()]]);
        $usuario = Usuario::create($datos)->refresh();
        $this->abrirSesion($r, $usuario);
        return response()->json(['usuario' => $usuario], 201)->header('Cache-Control', 'no-store');
    }

    public function inicio(Request $r)
    {
        $datos = $r->validate(['correo' => 'required|email', 'contrasena' => 'required|string']);
        if (!Auth::attempt(['correo' => mb_strtolower(trim($datos['correo'])), 'password' => $datos['contrasena'], 'eliminado_en' => null])) {
            throw ValidationException::withMessages(['correo' => 'Las credenciales no son correctas.']);
        }
        $this->abrirSesion($r, $r->user());
        return response()->json($r->user());
    }

    private function abrirSesion(Request $r, Usuario $usuario): void
    {
        Auth::login($usuario);
        $r->session()->regenerate();
        $r->session()->put('version_sesion', (int) $usuario->version_sesion);
    }

    public function cierre(Request $r)
    {
        Auth::guard('web')->logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();
        return response()->noContent();
    }

    public function actualizar(Request $r)
    {
        $r->merge(['correo' => mb_strtolower(trim((string) $r->input('correo')))]);
        $datos = $r->validate(['nombre' => 'required|string|max:100',
            'correo' => ['required', 'email', 'max:254', Rule::unique('usuarios', 'correo')->ignore($r->user()->id)],
            'zona_horaria' => 'required|timezone', 'contrasena_actual' => 'required|string']);
        $usuario = $r->user();
        $this->comprobarContrasena($usuario, $datos['contrasena_actual']);
        unset($datos['contrasena_actual']);
        $usuario->forceFill($datos)->save();
        return $usuario;
    }

    public function contrasena(Request $r)
    {
        $datos = $r->validate(['contrasena_actual' => 'required|string',
            'contrasena' => ['required', 'confirmed', Password::min(10)->letters()->numbers()]]);
        $usuario = DB::transaction(function () use ($r, $datos) {
            $u = Usuario::lockForUpdate()->findOrFail($r->user()->id);
            $this->comprobarContrasena($u, $datos['contrasena_actual']);
            $u->contrasena = $datos['contrasena'];
            $u->version_sesion++;
            $u->save();
            return $u;
        });
        $this->abrirSesion($r, $usuario);
        return response()->noContent();
    }

    public function eliminar(Request $r)
    {
        $r->validate(['contrasena_actual' => 'required|string']);
        DB::transaction(function () use ($r) {
            // El orden mascota → usuario coincide con las operaciones del resto de módulos.
            $mascotas = \App\Models\Mascota::withTrashed()->where(fn ($q) => $q->where('propietario_id', $r->user()->id)
                ->orWhereHas('colaboradores', fn ($c) => $c->where('usuario_id', $r->user()->id)->where('permiso', 'propietario')->whereNull('revocado_en')))
                ->orderBy('id')->lockForUpdate()->get();
            abort_if($mascotas->isNotEmpty(), 409, 'Elimina primero tus mascotas de tu cuenta. Las que tengan otros propietarios se conservarán.');
            $u = Usuario::lockForUpdate()->findOrFail($r->user()->id);
            $this->comprobarContrasena($u, $r->input('contrasena_actual'));
            $u->forceFill(['nombre' => 'Cuenta eliminada', 'correo' => 'eliminado-'.$u->id.'@petcare.invalid',
                'contrasena' => bin2hex(random_bytes(32)), 'recuperacion_hash' => null,
                'eliminado_en' => now(), 'version_sesion' => $u->version_sesion + 1])->save();
            DB::table('colaboradores_mascota')->where('usuario_id', $u->id)->whereNull('revocado_en')->update(['revocado_en' => now(), 'revocado_por_id' => $u->id]);
            DB::table('tareas')->where('responsable_id', $u->id)->update(['responsable_id' => null]);
        });
        return $this->cierre($r);
    }

    private function comprobarContrasena(Usuario $usuario, string $contrasena): void
    {
        if (!Hash::check($contrasena, $usuario->contrasena)) {
            throw ValidationException::withMessages(['contrasena_actual' => 'La contraseña actual no es correcta.']);
        }
    }
}
