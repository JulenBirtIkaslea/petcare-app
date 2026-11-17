<?php

namespace Tests\Feature;

use App\Models\Mascota;
use App\Models\Usuario;
use App\Services\ServicioCodigos;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Integración opt-in: esquema aislado en una transacción, nunca sobre tablas existentes. */
class PropiedadCompartidaPostgresTest extends TestCase
{
    private bool $transaccion = false;
    private Usuario $primero;
    private Usuario $segundo;
    private Usuario $ayudante;
    private Mascota $mascota;

    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('PETCARE_PRUEBAS_POSTGRES') !== 'true') $this->markTestSkipped('Activa PETCARE_PRUEBAS_POSTGRES=true con una BD PostgreSQL de pruebas.');
        $this->assertStringEndsWith('_pruebas', config('database.connections.pgsql.database'), 'Solo se permiten bases de pruebas.');
        DB::beginTransaction(); $this->transaccion = true;
        $esquema = 'petcare_test_'.bin2hex(random_bytes(8));
        DB::statement('CREATE SCHEMA '.$esquema);
        DB::statement('SET LOCAL search_path TO '.$esquema);
        $sql = file_get_contents(base_path('../database/sql/01_crear_esquema.sql'));
        DB::unprepared(preg_replace('/^(BEGIN;|COMMIT;)\s*$/m', '', $sql));
        config(['petcare.bd_habilitada' => true]);
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        $this->primero = $this->usuario('Primero'); $this->segundo = $this->usuario('Segundo'); $this->ayudante = $this->usuario('Ayudante');
        $especie = DB::table('especies')->insertGetId(['codigo' => 'perro', 'nombre' => 'Perro']);
        $this->mascota = new Mascota(['nombre' => 'Luna', 'especie_id' => $especie]);
        $this->mascota->propietario_id = $this->primero->id; $this->mascota->creador_id = $this->primero->id; $this->mascota->save(); $this->mascota->refresh();
    }

    protected function tearDown(): void
    {
        if ($this->transaccion) DB::rollBack();
        parent::tearDown();
    }

    private function usuario(string $nombre): Usuario
    {
        return Usuario::create(['nombre' => $nombre, 'correo' => strtolower($nombre).'@example.test', 'contrasena' => 'Segura12345'])->refresh();
    }

    private function sesion(Usuario $u): static
    {
        return $this->actingAs($u)->withSession(['version_sesion' => $u->version_sesion]);
    }

    private function colaborar(Usuario $u, string $permiso): void
    {
        DB::table('colaboradores_mascota')->insert(['mascota_id' => $this->mascota->id, 'usuario_id' => $u->id,
            'permiso' => $permiso, 'concedido_por_id' => $this->primero->id]);
    }

    private function ruta(): string { return '/api/mascotas/'.$this->mascota->id; }

    public function test_codigo_de_veinte_minutos_con_contrasena_y_un_solo_uso(): void
    {
        $this->sesion($this->primero)->postJson($this->ruta().'/codigos', ['permiso' => 'propietario'])->assertUnprocessable();
        $this->postJson($this->ruta().'/codigos', ['permiso' => 'propietario', 'contrasena_actual' => 'incorrecta'])->assertUnprocessable();
        $this->freezeTime();
        $r = $this->postJson($this->ruta().'/codigos', ['permiso' => 'propietario', 'contrasena_actual' => 'Segura12345'])->assertCreated();
        $this->assertTrue(now()->addMinutes(20)->equalTo($r->json('caduca_en')));
        $codigo = $r->json('codigo');
        $this->sesion($this->segundo)->postJson('/api/compartir/consultar', ['codigo' => $codigo])->assertOk()->assertJsonPath('permiso', 'propietario');
        $this->postJson('/api/compartir/aceptar', ['codigo' => $codigo])->assertOk();
        $this->sesion($this->ayudante)->postJson('/api/compartir/aceptar', ['codigo' => $codigo])->assertUnprocessable();
        $this->assertSame(1, DB::table('colaboradores_mascota')->whereNull('revocado_en')->count());
    }

    public function test_codigo_caducado_y_cancelado_no_conceden_acceso(): void
    {
        $codigo = ServicioCodigos::generar();
        DB::table('codigos_colaboracion')->insert(['mascota_id' => $this->mascota->id, 'creado_por_id' => $this->primero->id,
            'permiso' => 'ayudante', 'codigo_hash' => ServicioCodigos::hash($codigo), 'creado_en' => now()->subMinutes(20), 'caduca_en' => now()]);
        $this->sesion($this->segundo)->postJson('/api/compartir/aceptar', ['codigo' => $codigo])->assertUnprocessable();
        DB::table('codigos_colaboracion')->update(['caduca_en' => now()->addMinutes(1), 'cancelado_en' => now()]);
        $this->postJson('/api/compartir/aceptar', ['codigo' => $codigo])->assertUnprocessable();
    }

    public function test_ayudante_solo_consulta_y_no_puede_revocar_propietarios(): void
    {
        $this->colaborar($this->ayudante, 'ayudante'); $this->colaborar($this->segundo, 'propietario');
        $this->sesion($this->ayudante)->getJson($this->ruta())->assertOk()->assertJsonPath('permiso', 'ayudante');
        $this->patchJson($this->ruta(), ['nombre' => 'Cambio'])->assertForbidden();
        $this->postJson($this->ruta().'/historial/vacunas', ['nombre' => 'Rabia', 'fecha_administracion' => now()->toDateString()])->assertForbidden();
        $this->postJson($this->ruta().'/codigos', ['permiso' => 'ayudante', 'contrasena_actual' => 'Segura12345'])->assertForbidden();
        $this->sesion($this->primero)->deleteJson($this->ruta().'/colaboradores/'.$this->segundo->id)->assertForbidden();
        $this->deleteJson($this->ruta().'/colaboradores/'.$this->ayudante->id)->assertNoContent();
        $this->sesion($this->ayudante)->getJson($this->ruta())->assertNotFound();
    }

    public function test_copropietario_edita_registros_de_otro_y_comparte(): void
    {
        $this->colaborar($this->segundo, 'propietario');
        $id = DB::table('vacunas')->insertGetId(['mascota_id' => $this->mascota->id, 'nombre' => 'Rabia',
            'fecha_administracion' => now()->toDateString(), 'creado_por_id' => $this->primero->id]);
        $this->sesion($this->segundo)->patchJson($this->ruta(), ['nombre' => 'Luna nueva'])->assertOk();
        $this->patchJson($this->ruta().'/historial/vacunas/'.$id, ['nombre' => 'Rabia revisada', 'fecha_administracion' => now()->toDateString(), 'motivo_correccion' => 'Corrección'])->assertOk();
        $this->postJson($this->ruta().'/codigos', ['permiso' => 'ayudante', 'contrasena_actual' => 'Segura12345'])->assertCreated();
    }

    public function test_salir_el_propietario_inicial_conserva_mascota_historial_y_ayudantes(): void
    {
        $this->colaborar($this->segundo, 'propietario'); $this->colaborar($this->ayudante, 'ayudante');
        DB::table('vacunas')->insert(['mascota_id' => $this->mascota->id, 'nombre' => 'Rabia', 'fecha_administracion' => now()->toDateString(), 'creado_por_id' => $this->primero->id]);
        $this->sesion($this->primero)->deleteJson($this->ruta(), ['contrasena_actual' => 'incorrecta'])->assertUnprocessable();
        $this->deleteJson($this->ruta(), ['contrasena_actual' => 'Segura12345'])->assertNoContent();
        $this->getJson($this->ruta())->assertNotFound();
        $this->sesion($this->segundo)->getJson($this->ruta())->assertOk()->assertJsonPath('numero_propietarios', 1);
        $this->assertSame(1, DB::table('vacunas')->count());
        $this->sesion($this->ayudante)->getJson($this->ruta())->assertOk();
    }

    public function test_salir_un_copropietario_no_elimina_la_mascota(): void
    {
        $this->colaborar($this->segundo, 'propietario');
        $this->sesion($this->segundo)->deleteJson($this->ruta(), ['contrasena_actual' => 'Segura12345'])->assertNoContent();
        $this->getJson($this->ruta())->assertNotFound();
        $this->sesion($this->primero)->getJson($this->ruta())->assertOk()->assertJsonPath('numero_propietarios', 1);
    }

    public function test_ultimo_propietario_elimina_fisicamente_y_los_ayudantes_pierden_acceso(): void
    {
        $this->colaborar($this->ayudante, 'ayudante');
        DB::table('vacunas')->insert(['mascota_id' => $this->mascota->id, 'nombre' => 'Rabia', 'fecha_administracion' => now()->toDateString(), 'creado_por_id' => $this->primero->id]);
        $this->sesion($this->primero)->deleteJson($this->ruta(), ['contrasena_actual' => 'Segura12345'])->assertNoContent();
        $this->assertSame(0, DB::table('mascotas')->count()); $this->assertSame(0, DB::table('vacunas')->count());
        $this->assertSame(0, DB::table('colaboradores_mascota')->count());
        $this->sesion($this->ayudante)->getJson($this->ruta())->assertNotFound();
    }
}
