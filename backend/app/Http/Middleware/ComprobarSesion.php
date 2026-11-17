<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ComprobarSesion
{
    public function handle(Request $request, Closure $next)
    {
        $usuario = $request->user();
        if ($usuario->eliminado_en || (int) $request->session()->get('version_sesion', 0) !== (int) $usuario->version_sesion) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            abort(401, 'La sesión ha caducado. Inicia sesión de nuevo.');
        }
        return $next($request);
    }
}
