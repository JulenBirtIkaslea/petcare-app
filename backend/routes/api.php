<?php

use App\Http\Controllers\{ControladorMascotas, ControladorSesion, ControladorColaboraciones, ControladorHistorial, ControladorTratamientos, ControladorAgenda, ControladorCalendario};
use App\Http\Middleware\{ExigirBaseDeDatos, ComprobarSesion};
use App\Models\Especie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/estado', fn () => ['aplicacion' => 'PetCare', 'estado' => 'disponible', 'base_de_datos_habilitada' => config('petcare.bd_habilitada')]);

Route::middleware(['web', ExigirBaseDeDatos::class, 'throttle:180,1'])->group(function () {
    Route::post('/registro', [ControladorSesion::class, 'registro'])->middleware('throttle:5,1');
    Route::post('/inicio-sesion', [ControladorSesion::class, 'inicio'])->middleware('throttle:5,1');
    Route::middleware(['auth:sanctum', ComprobarSesion::class])->group(function () {
        Route::get('/yo', fn (Request $r) => $r->user());
        Route::patch('/yo', [ControladorSesion::class, 'actualizar']);
        Route::delete('/yo', [ControladorSesion::class, 'eliminar']);
        Route::post('/contrasena', [ControladorSesion::class, 'contrasena'])->middleware('throttle:5,1');
        Route::post('/cierre-sesion', [ControladorSesion::class, 'cierre']);
        Route::get('/especies', fn () => Especie::where('habilitada', true)->orderBy('id')->get());
        Route::apiResource('mascotas', ControladorMascotas::class)->except('destroy')->parameters(['mascotas' => 'mascota']);
        Route::delete('/mascotas/{mascota}', [ControladorMascotas::class, 'destroy'])->middleware('throttle:5,1');
        Route::get('/mascotas/{mascota}/fotografia', [ControladorMascotas::class, 'fotografia']);
        Route::post('/mascotas/{mascota}/fotografia', [ControladorMascotas::class, 'guardarFotografia']);
        Route::delete('/mascotas/{mascota}/fotografia', [ControladorMascotas::class, 'eliminarFotografia']);
        Route::get('/mascotas/{mascota}/auditoria', [ControladorMascotas::class, 'auditoria']);
        Route::post('/compartir/consultar', [ControladorColaboraciones::class, 'consultar'])->middleware('throttle:5,1');
        Route::post('/compartir/aceptar', [ControladorColaboraciones::class, 'aceptar'])->middleware('throttle:5,1');
        Route::get('/mascotas/{mascota}/colaboradores', [ControladorColaboraciones::class, 'index']);
        Route::get('/mascotas/{mascota}/codigos', [ControladorColaboraciones::class, 'codigos']);
        Route::post('/mascotas/{mascota}/codigos', [ControladorColaboraciones::class, 'generar'])->middleware('throttle:5,1');
        Route::delete('/mascotas/{mascota}/codigos/{codigo}', [ControladorColaboraciones::class, 'cancelar']);
        Route::delete('/mascotas/{mascota}/colaboradores/{usuario}', [ControladorColaboraciones::class, 'revocar']);
        Route::get('/mascotas/{mascota}/historial', [ControladorHistorial::class, 'index']);
        Route::post('/mascotas/{mascota}/historial/{tipo}', [ControladorHistorial::class, 'crear']);
        Route::patch('/mascotas/{mascota}/historial/{tipo}/{registro}', [ControladorHistorial::class, 'actualizar']);
        Route::delete('/mascotas/{mascota}/historial/{tipo}/{registro}', [ControladorHistorial::class, 'eliminar']);
        Route::post('/mascotas/{mascota}/historial/{tipo}/{registro}/siguiente', [ControladorHistorial::class, 'siguiente']);
        Route::get('/mascotas/{mascota}/tratamientos', [ControladorTratamientos::class, 'index']);
        Route::post('/mascotas/{mascota}/tratamientos', [ControladorTratamientos::class, 'crear']);
        Route::patch('/mascotas/{mascota}/tratamientos/{tratamiento}', [ControladorTratamientos::class, 'actualizar']);
        Route::post('/mascotas/{mascota}/tratamientos/{tratamiento}/cerrar', [ControladorTratamientos::class, 'cerrar']);
        Route::get('/mascotas/{mascota}/tratamientos/{tratamiento}/dosis', [ControladorTratamientos::class, 'dosis']);
        Route::post('/mascotas/{mascota}/tratamientos/{tratamiento}/dosis', [ControladorTratamientos::class, 'resolver']);
        Route::patch('/mascotas/{mascota}/tratamientos/{tratamiento}/dosis/{dosis}', [ControladorTratamientos::class, 'corregir']);
        Route::get('/calendario', [ControladorCalendario::class, 'index']);
        Route::get('/mascotas/{mascota}/agenda/{tipo}', [ControladorAgenda::class, 'index']);
        Route::post('/mascotas/{mascota}/agenda/{tipo}', [ControladorAgenda::class, 'crear']);
        Route::patch('/mascotas/{mascota}/agenda/{tipo}/{registro}', [ControladorAgenda::class, 'actualizar']);
        Route::delete('/mascotas/{mascota}/agenda/{tipo}/{registro}', [ControladorAgenda::class, 'eliminar']);
        Route::post('/mascotas/{mascota}/agenda/{tipo}/{registro}/resolver', [ControladorAgenda::class, 'resolver']);
    });
});
