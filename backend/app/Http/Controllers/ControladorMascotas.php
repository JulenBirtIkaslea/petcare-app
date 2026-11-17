<?php

namespace App\Http\Controllers;

use App\Models\Mascota;
use App\Services\ServicioAcceso;
use App\Services\ValidarMascota;
use App\Services\ConfirmarContrasena;
use App\Services\ServicioPropiedad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ControladorMascotas extends Controller
{
    public function __construct(private ServicioAcceso $acceso) {}

    public function presentar(Mascota $mascota, Request $r): array
    {
        return [...$mascota->load('especie')->toArray(), 'permiso' => $this->acceso->permiso($r->user(), $mascota),
            'numero_propietarios' => 1 + $mascota->colaboradores()->where('permiso', 'propietario')->whereNull('revocado_en')->count(),
            'foto_url' => $mascota->foto_ruta ? '/api/mascotas/'.$mascota->id.'/fotografia?v='.urlencode((string) $mascota->actualizado_en) : null];
    }

    public function index(Request $r)
    {
        return Mascota::accesiblesPor($r->user())->with('especie')->orderBy('nombre')->get()->map(fn ($m) => $this->presentar($m, $r));
    }

    public function show(Request $r, int $mascota)
    {
        return $this->presentar($this->acceso->obtener($r->user(), $mascota), $r);
    }

    public function store(Request $r)
    {
        $datos = ValidarMascota::datos($r->all());
        $m = DB::transaction(function () use ($datos, $r) {
            $usuario = \App\Models\Usuario::lockForUpdate()->findOrFail($r->user()->id);
            abort_if($usuario->eliminado_en, 401);
            $m = new Mascota($datos);
            $m->propietario_id = $r->user()->id; $m->creador_id = $r->user()->id; $m->save();
            $this->acceso->auditar('mascotas', $m->id, $r->user(), 'creacion', null, $m->toArray(), null, $m->id);
            return $m;
        });
        return response()->json($this->presentar($m, $r), 201);
    }

    public function update(Request $r, int $mascota)
    {
        return $this->acceso->modificar($r->user(), $mascota, 'propietario', function ($m) use ($r) {
            $datos = ValidarMascota::datos(array_replace($m->toArray(), $r->all()));
            $antes = $m->toArray(); $m->fill($datos)->save();
            $this->acceso->auditar('mascotas', $m->id, $r->user(), 'edicion', $antes, $m->toArray(), null, $m->id);
            return $this->presentar($m, $r);
        });
    }

    public function destroy(Request $r, int $mascota)
    {
        $r->validate(['contrasena_actual' => 'required|string']);
        $foto = $this->acceso->modificar($r->user(), $mascota, 'propietario', function ($m) use ($r) {
            ConfirmarContrasena::comprobar(\App\Models\Usuario::findOrFail($r->user()->id), $r->input('contrasena_actual'));
            return app(ServicioPropiedad::class)->abandonar($m, $r->user());
        });
        if ($foto) Storage::disk('local')->delete($foto);
        return response()->noContent();
    }

    public function fotografia(Request $r, int $mascota)
    {
        $m = $this->acceso->obtener($r->user(), $mascota);
        abort_unless($m->foto_ruta && Storage::disk('local')->exists($m->foto_ruta), 404);
        return Storage::disk('local')->response($m->foto_ruta, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function guardarFotografia(Request $r, int $mascota)
    {
        $r->validate(['fotografia' => 'required|file|image|mimes:jpg,jpeg,png,webp|max:5120|dimensions:max_width=10000,max_height=10000']);
        $nueva = null; $anterior = null;
        try {
            $resultado = $this->acceso->modificar($r->user(), $mascota, 'propietario', function ($m) use ($r, &$nueva, &$anterior) {
                $nueva = $r->file('fotografia')->store('pets/'.$m->id, 'local');
                abort_unless($nueva, 500, 'No se ha podido guardar la fotografía.');
                $anterior = $m->foto_ruta; $m->foto_ruta = $nueva; $m->save();
                return $this->presentar($m, $r);
            });
        } catch (\Throwable $e) {
            if ($nueva) Storage::disk('local')->delete($nueva);
            throw $e;
        }
        if ($anterior) Storage::disk('local')->delete($anterior);
        return $resultado;
    }

    public function eliminarFotografia(Request $r, int $mascota)
    {
        $ruta = $this->acceso->modificar($r->user(), $mascota, 'propietario', function ($m) {
            $ruta = $m->foto_ruta; $m->foto_ruta = null; $m->save(); return $ruta;
        });
        if ($ruta) Storage::disk('local')->delete($ruta);
        return response()->noContent();
    }

    public function auditoria(Request $r, int $mascota)
    {
        $m = $this->acceso->obtener($r->user(), $mascota);
        abort_unless($this->acceso->permiso($r->user(), $m) === 'propietario', 403);
        return DB::table('auditoria_cambios')->leftJoin('usuarios', 'usuarios.id', '=', 'auditoria_cambios.usuario_id')
            ->where('mascota_id', $mascota)->select('auditoria_cambios.*', 'usuarios.nombre as autor')
            ->orderByDesc('ocurrido_en')->paginate(30)->through(function ($fila) {
                foreach (['valores_anteriores', 'valores_nuevos'] as $campo) $fila->$campo = $fila->$campo ? json_decode($fila->$campo) : null;
                return $fila;
            });
    }
}
