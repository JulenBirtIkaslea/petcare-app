<?php

namespace Tests\Unit;

use App\Models\Usuario;
use App\Services\ConfirmarContrasena;
use App\Services\ServicioAcceso;
use App\Services\ServicioCodigos;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PermisosYCodigosTest extends TestCase
{
    public function test_solo_los_propietarios_pueden_escribir(): void
    {
        foreach (['ver', 'editar', 'propietario'] as $nivel) $this->assertTrue(ServicioAcceso::permite('propietario', $nivel));
        $this->assertTrue(ServicioAcceso::permite('ayudante', 'ver'));
        foreach (['editar', 'propietario'] as $nivel) $this->assertFalse(ServicioAcceso::permite('ayudante', $nivel));
        foreach ([null, 'editor', 'visor'] as $permiso) $this->assertFalse(ServicioAcceso::permite($permiso, 'editar'));
    }

    public function test_codigos_aleatorios_normalizados_y_almacenados_como_hash(): void
    {
        $codigo = ServicioCodigos::generar();
        $this->assertMatchesRegularExpression('/^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/', $codigo);
        $this->assertNotSame($codigo, ServicioCodigos::generar());
        $this->assertSame(ServicioCodigos::hash($codigo), ServicioCodigos::hash(strtolower(str_replace('-', ' ', $codigo))));
        $this->assertSame(64, strlen(ServicioCodigos::hash($codigo)));
    }

    public function test_rechaza_codigos_malformados(): void
    {
        $this->expectException(ValidationException::class);
        ServicioCodigos::hash('123');
    }

    public function test_la_confirmacion_comprueba_la_contrasena_real(): void
    {
        $u = new Usuario; $u->contrasena = 'Segura12345';
        ConfirmarContrasena::comprobar($u, 'Segura12345');
        $this->expectException(ValidationException::class);
        ConfirmarContrasena::comprobar($u, 'incorrecta');
    }
}
