<?php

namespace App\Http\Controllers;

use App\Models\Mascota;
use App\Models\Usuario;
use App\Services\ConfirmarContrasena;
use App\Services\ServicioAcceso;
use App\Services\ServicioCodigos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ControladorColaboraciones extends Controller
{
    public function __construct(private ServicioAcceso $acceso) {}

    public function index(Request $r, int $mascota)
    {
        $m = $this->acceso->obtener($r->user(), $mascota);
        $lista = DB::table('colaboradores_mascota as c')->join('usuarios as u', 'u.id', '=', 'c.usuario_id')
            ->where('c.mascota_id', $mascota)->whereNull('c.revocado_en')->get(['c.usuario_id', 'c.permiso', 'u.nombre', 'c.concedido_en']);
        $propietario = Usuario::findOrFail($m->propietario_id);
        return ['propietario' => ['usuario_id' => $propietario->id, 'nombre' => $propietario->nombre, 'permiso' => 'propietario'], 'colaboradores' => $lista];
    }

    public function codigos(Request $r, int $mascota)
    {
        return $this->acceso->modificar($r->user(), $mascota, 'propietario', fn () => DB::table('codigos_colaboracion')
            ->where('mascota_id', $mascota)->orderByDesc('creado_en')->get(['id', 'permiso', 'creado_en', 'caduca_en', 'usado_en', 'cancelado_en']));
    }

    public function generar(Request $r, int $mascota)
    {
        $r->validate(['permiso' => 'required|in:propietario,ayudante', 'contrasena_actual' => 'required|string']);
        return $this->acceso->modificar($r->user(), $mascota, 'propietario', function ($m) use ($r) {
            ConfirmarContrasena::comprobar(Usuario::findOrFail($r->user()->id), $r->input('contrasena_actual'));
            abort_if(DB::table('codigos_colaboracion')->where('mascota_id', $m->id)->whereNull('usado_en')->whereNull('cancelado_en')->where('caduca_en', '>', now())->count() >= 10,
                409, 'Cancela alguno de los códigos pendientes antes de generar otro.');
            $codigo = ServicioCodigos::generar(); $caduca = now()->addMinutes(20);
            $id = DB::table('codigos_colaboracion')->insertGetId(['mascota_id' => $m->id, 'creado_por_id' => $r->user()->id,
                'codigo_hash' => ServicioCodigos::hash($codigo), 'permiso' => $r->input('permiso'), 'caduca_en' => $caduca]);
            $this->acceso->auditar('codigos_colaboracion', $id, $r->user(), 'creacion', null, ['permiso' => $r->input('permiso')], null, $m->id);
            return response()->json(['id' => $id, 'codigo' => $codigo, 'permiso' => $r->input('permiso'), 'caduca_en' => $caduca], 201)->header('Cache-Control', 'no-store');
        });
    }

    public function cancelar(Request $r, int $mascota, int $codigo)
    {
        $this->acceso->modificar($r->user(), $mascota, 'propietario', function () use ($mascota, $codigo) {
            $actualizados = DB::table('codigos_colaboracion')->where('mascota_id', $mascota)->where('id', $codigo)->whereNull('usado_en')->whereNull('cancelado_en')->update(['cancelado_en' => now()]);
            abort_unless($actualizados, 409, 'El código ya se usó o se canceló.');
        });
        return response()->noContent();
    }

    private function buscarCodigo(Request $r): object
    {
        $r->validate(['codigo' => 'required|string|max:30']);
        $c = DB::table('codigos_colaboracion')->where('codigo_hash', ServicioCodigos::hash($r->input('codigo')))->first();
        abort_unless($c && !$c->usado_en && !$c->cancelado_en && now()->lt($c->caduca_en), 422, 'El código no es válido o ha caducado.');
        return $c;
    }

    public function consultar(Request $r)
    {
        $c = $this->buscarCodigo($r);
        $m = Mascota::find($c->mascota_id);
        abort_unless($m, 422, 'El código no es válido o ha caducado.');
        return response()->json(['nombre' => $m->nombre, 'permiso' => $c->permiso, 'caduca_en' => $c->caduca_en])->header('Cache-Control', 'no-store');
    }

    public function aceptar(Request $r)
    {
        $referencia = $this->buscarCodigo($r);
        return DB::transaction(function () use ($referencia, $r) {
            $m = Mascota::lockForUpdate()->find($referencia->mascota_id);
            $c = DB::table('codigos_colaboracion')->where('id', $referencia->id)->lockForUpdate()->first();
            abort_unless($m && $c && !$c->usado_en && !$c->cancelado_en && now()->lt($c->caduca_en), 422, 'El código no es válido o ha caducado.');
            $u = Usuario::lockForUpdate()->findOrFail($r->user()->id);
            abort_if($u->eliminado_en || (int) $u->version_sesion !== (int) $r->user()->version_sesion, 401);
            $actual = $this->acceso->permiso($u, $m);
            abort_if($actual === 'propietario' || ($actual === 'ayudante' && $c->permiso === 'ayudante'), 409, 'Ya tienes este acceso a la mascota.');
            // Un ayudante puede aceptar una invitación de propietario sin perder su historial de acceso.
            if ($actual) DB::table('colaboradores_mascota')->where('mascota_id', $m->id)->where('usuario_id', $u->id)
                ->whereNull('revocado_en')->update(['revocado_en' => now(), 'revocado_por_id' => $u->id]);
            DB::table('colaboradores_mascota')->insert(['mascota_id' => $m->id, 'usuario_id' => $u->id,
                'permiso' => $c->permiso, 'concedido_por_id' => $c->creado_por_id]);
            DB::table('codigos_colaboracion')->where('id', $c->id)->update(['usado_en' => now(), 'usado_por_id' => $u->id]);
            $this->acceso->auditar('colaboradores_mascota', $u->id, $u, 'acceso_por_codigo', null, ['permiso' => $c->permiso], null, $m->id);
            return ['mascota_id' => $m->id, 'nombre' => $m->nombre, 'permiso' => $c->permiso];
        }, 3);
    }

    public function revocar(Request $r, int $mascota, int $usuario)
    {
        $nivel = $usuario === (int) $r->user()->id ? 'ver' : 'propietario';
        $this->acceso->modificar($r->user(), $mascota, $nivel, function ($m) use ($usuario, $r) {
            abort_if((int) $m->propietario_id === $usuario, 409, 'Un propietario debe salir mediante la eliminación de su mascota.');
            $c = DB::table('colaboradores_mascota')->where('mascota_id', $m->id)->where('usuario_id', $usuario)->whereNull('revocado_en')->first();
            abort_unless($c, 404);
            abort_unless($c->permiso === 'ayudante', 403, 'No se puede revocar el acceso de un propietario.');
            DB::table('colaboradores_mascota')->where('id', $c->id)->update(['revocado_en' => now(), 'revocado_por_id' => $r->user()->id]);
            DB::table('tareas')->where('mascota_id', $m->id)->where('responsable_id', $usuario)->update(['responsable_id' => null]);
            $this->acceso->auditar('colaboradores_mascota', $c->id, $r->user(), 'revocacion', ['usuario_id' => $usuario], null, null, $m->id);
        });
        return response()->noContent();
    }
}
