<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExigirBaseDeDatos
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('petcare.bd_habilitada')) {
            return response()->json(['mensaje' => 'La base de datos todavía no está habilitada.', 'codigo' => 'BD_NO_CONFIGURADA'], 503);
        }

        return $next($request);
    }
}
