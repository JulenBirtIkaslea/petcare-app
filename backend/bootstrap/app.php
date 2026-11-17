<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Las rutas API usan el grupo web: sesión y CSRF incluso en fotos sin cabecera Origin.
        $middleware->prependToPriorityList(
            \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
            \App\Http\Middleware\ExigirBaseDeDatos::class,
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn ($request) => $request->is('api/*') || $request->expectsJson());
        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            if (!$request->is('api/*')) return null;
            $codigo = $e->errorInfo[0] ?? (string) $e->getCode();
            if ($codigo === '23505') return response()->json(['message' => 'El registro ya existe o la acción ya se ha realizado.'], 409);
            if (in_array($codigo, ['23503', '23514', '22008', '22007'])) return response()->json(['message' => 'Los datos no cumplen las reglas del registro. Revisa las fechas y relaciones.'], 422);
            if (str_starts_with($codigo, '08') || str_contains($e->getMessage(), 'could not find driver')) {
                return response()->json(['message' => 'No se puede conectar con la base de datos.', 'codigo' => 'BD_NO_DISPONIBLE'], 503);
            }
            return null;
        });
    })->create();
