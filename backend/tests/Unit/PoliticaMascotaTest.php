<?php

namespace Tests\Unit;

use App\Models\Mascota;
use App\Models\Usuario;
use App\Policies\MascotaPolicy;
use Tests\TestCase;
use Mockery;

class PoliticaMascotaTest extends TestCase
{
    public function test_un_ayudante_no_puede_modificar_la_ficha(): void
    {
        $usuario = new Usuario;
        $usuario->id = 2;
        $mascota = Mockery::mock(Mascota::class)->makePartial();
        $mascota->propietario_id = 1;
        $relacion = Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $mascota->shouldReceive('colaboradores')->andReturn($relacion);
        $relacion->shouldReceive('where', 'whereNull')->andReturnSelf();
        $relacion->shouldReceive('exists')->andReturnFalse();
        $politica = new MascotaPolicy;
        $this->assertFalse($politica->update($usuario, $mascota));
        $this->assertFalse($politica->delete($usuario, $mascota));
    }

    public function test_un_copropietario_tiene_los_mismos_permisos(): void
    {
        $usuario = new Usuario; $usuario->id = 2;
        $mascota = Mockery::mock(Mascota::class)->makePartial(); $mascota->propietario_id = 1;
        $relacion = Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $mascota->shouldReceive('colaboradores')->andReturn($relacion);
        $relacion->shouldReceive('where', 'whereNull')->andReturnSelf();
        $relacion->shouldReceive('exists')->andReturnTrue();
        $politica = new MascotaPolicy;
        $this->assertTrue($politica->view($usuario, $mascota));
        $this->assertTrue($politica->update($usuario, $mascota));
        $this->assertTrue($politica->delete($usuario, $mascota));
    }

    public function test_el_propietario_puede_consultar_modificar_y_eliminar(): void
    {
        $usuario = new Usuario;
        $usuario->id = 1;
        $mascota = new Mascota;
        $mascota->propietario_id = 1;
        $politica = new MascotaPolicy;
        $this->assertTrue($politica->view($usuario, $mascota));
        $this->assertTrue($politica->update($usuario, $mascota));
        $this->assertTrue($politica->delete($usuario, $mascota));
    }
}
