<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ArranqueSinBaseDeDatosTest extends TestCase
{
    public function test_estado_disponible_sin_abrir_conexion(): void
    {
        config(['petcare.bd_habilitada' => false]);
        DB::shouldReceive('connection')->never();
        $this->getJson('/api/estado')->assertOk()
            ->assertJsonPath('aplicacion', 'PetCare')
            ->assertJsonPath('base_de_datos_habilitada', false);
    }

    public function test_rutas_persistentes_bloqueadas_sin_base_de_datos(): void
    {
        config(['petcare.bd_habilitada' => false]);
        DB::shouldReceive('connection')->never();
        $this->getJson('/api/mascotas')->assertStatus(503)->assertJsonPath('codigo', 'BD_NO_CONFIGURADA');
        $this->postJson('/api/registro', [])->assertStatus(503);
        $this->postJson('/api/inicio-sesion', [])->assertStatus(503);
    }

    public function test_mascotas_exigen_sesion_cuando_se_habilita_la_base(): void
    {
        config(['petcare.bd_habilitada' => true]);
        DB::shouldReceive('connection')->never();
        $this->getJson('/api/mascotas')->assertUnauthorized();
    }

    public function test_no_se_exponen_los_flujos_antiguos(): void
    {
        $rutas = collect(\Illuminate\Support\Facades\Route::getRoutes())->map(fn ($r) => $r->uri())->all();
        foreach (['api/recuperar-cuenta', 'api/codigo-recuperacion', 'api/papelera', 'api/mascotas/{mascota}/transferencias'] as $ruta) {
            $this->assertNotContains($ruta, $rutas);
        }
    }
}
