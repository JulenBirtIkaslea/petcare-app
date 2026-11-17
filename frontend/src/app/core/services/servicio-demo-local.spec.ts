import { ServicioDemoLocal } from './servicio-demo-local';
import { Dosis, Evento, MascotaApi, Tratamiento, Usuario } from '../../shared/models/api';
import { vi } from 'vitest';

describe('Demostración local persistente', () => {
  let demo: ServicioDemoLocal;
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); demo = new ServicioDemoLocal(); });
  const entrar = (d: ServicioDemoLocal, recordar = false) => d.enviar<Usuario>('POST', 'inicio-sesion', { correo: 'prueba', contrasena: 'Birtlh123.', recordar });
  const registrar = (correo = 'otra@example.test') => demo.enviar<{usuario: Usuario}>('POST', 'registro', { nombre: 'Otra persona', correo, contrasena: 'OtraClave123.', contrasena_confirmation: 'OtraClave123.' });
  afterEach(() => vi.useRealTimers());
  it('registra sin acceso a mascotas ajenas y permite volver a iniciar sesión', async () => {
    await registrar();
    expect(await demo.get('mascotas')).toEqual([]);
    await expect(demo.get('mascotas/1')).rejects.toMatchObject({status: 404});
    await demo.enviar('POST', 'cierre-sesion');
    const usuario = await demo.enviar<Usuario>('POST', 'inicio-sesion', {correo: 'otra@example.test', contrasena: 'OtraClave123.'});
    expect(usuario.nombre).toBe('Otra persona');
    expect(localStorage.getItem('petcare.demo.v1')).not.toContain('OtraClave123.');
  });
  it('comparte como ayudante de solo lectura y el código se consume una vez', async () => {
    await entrar(demo);
    await demo.enviar('PATCH','mascotas/1',{nombre:'Luna revisada'});
    const {codigo} = await demo.enviar<{codigo:string}>('POST', 'mascotas/1/codigos', {permiso:'ayudante', contrasena_actual:'Birtlh123.'});
    await registrar();
    await demo.enviar('POST', 'compartir/aceptar', {codigo});
    expect((await demo.get<MascotaApi>('mascotas/1')).permiso).toBe('ayudante');
    await expect(demo.enviar('PATCH','mascotas/1',{nombre:'Cambio indebido'})).rejects.toMatchObject({status:403});
    await expect(demo.get('mascotas/1/auditoria')).rejects.toMatchObject({status:403});
    expect(JSON.parse(demo.exportarDatos()).auditoria).toEqual([]);
    await registrar('tercera@example.test');
    await expect(demo.enviar('POST','compartir/aceptar',{codigo})).rejects.toMatchObject({status:422});
  });
  it('la salida de un copropietario conserva mascota y cuidados para el otro', async () => {
    await entrar(demo);
    const {codigo} = await demo.enviar<{codigo:string}>('POST','mascotas/1/codigos',{permiso:'propietario',contrasena_actual:'Birtlh123.'});
    const {usuario} = await registrar();
    await demo.enviar('POST','compartir/aceptar',{codigo});
    await entrar(demo);
    await demo.enviar('DELETE','mascotas/1',{contrasena_actual:'Birtlh123.'});
    await expect(demo.get('mascotas/1')).rejects.toMatchObject({status:404});
    await demo.enviar('POST','inicio-sesion',{correo:usuario.correo,contrasena:'OtraClave123.'});
    expect((await demo.get<MascotaApi>('mascotas/1')).numero_propietarios).toBe(1);
    expect((await demo.get<Tratamiento[]>('mascotas/1/tratamientos')).length).toBeGreaterThan(0);
  });
  it('la eliminación por el último propietario purga datos vinculados', async () => {
    await entrar(demo);
    await expect(demo.enviar('DELETE','mascotas/1',{contrasena_actual:'incorrecta'})).rejects.toMatchObject({status:422});
    await demo.enviar('DELETE','mascotas/1',{contrasena_actual:'Birtlh123.'});
    const datos = JSON.parse(localStorage.getItem('petcare.demo.v1')!);
    for(const tabla of ['historial','tratamientos','agenda','colaboradores','codigos','auditoria']) expect(datos[tabla].some((r: {mascota_id:number}) => r.mascota_id===1)).toBe(false);
    expect(datos.mascotas.some((r: {id:number}) => r.id===1)).toBe(false);
    await expect(demo.enviar('POST','mascotas/1/restaurar')).rejects.toMatchObject({status:404});
  });
  it('crea, filtra y resuelve una tarea sin permitir doble resolución', async () => {
    await entrar(demo);
    const tarea = await demo.enviar<{id:number}>('POST','mascotas/1/agenda/tareas',{titulo:'Paseo de prueba',fecha_hora_programada:'2026-11-17T10:00:00Z'});
    await demo.enviar('POST',`mascotas/1/agenda/tareas/${tarea.id}/resolver`,{estado:'completada'});
    const agenda = await demo.get<{eventos:Evento[]}>('calendario?desde=2026-11-17&hasta=2026-11-17&tipo=tarea&mascota_id=1');
    expect(agenda.eventos.find(e=>e.id===tarea.id)?.estado).toBe('completada');
    await expect(demo.enviar('POST',`mascotas/1/agenda/tareas/${tarea.id}/resolver`,{estado:'completada'})).rejects.toMatchObject({status:422});
  });
  it('una pauta única genera una dosis y rechaza varios horarios', async () => {
    await entrar(demo);
    const pauta = {nombre:'Cepillado',tipo:'cuidado',indicaciones:'Ejemplo',fecha_inicio:'2026-11-16',fecha_fin:'2026-11-16',tipo_frecuencia:'unica',horarios:['09:00']};
    await expect(demo.enviar('POST','mascotas/1/tratamientos',{...pauta,horarios:['09:00','10:00']})).rejects.toMatchObject({status:422});
    const t = await demo.enviar<Tratamiento>('POST','mascotas/1/tratamientos',pauta);
    const dosis = await demo.get<Dosis[]>(`mascotas/1/tratamientos/${t.id}/dosis?desde=2026-11-16&hasta=2026-11-18`);
    expect(dosis).toHaveLength(1);
    const resolucion = {estado:'omitida',motivo_omision:'Ejemplo',version_tratamiento_id:t.version_actual.id,fecha_hora_programada:dosis[0].fecha_hora_programada};
    await demo.enviar('POST',`mascotas/1/tratamientos/${t.id}/dosis`,resolucion);
    await expect(demo.enviar('POST',`mascotas/1/tratamientos/${t.id}/dosis`,resolucion)).rejects.toMatchObject({status:422});
  });
  it('caduca una sesión sin recordar y conserva la recordada dentro de su plazo', async () => {
    vi.useFakeTimers();
    await entrar(demo);
    vi.setSystemTime(Date.now()+9*3600000);
    await expect(demo.get('yo')).rejects.toMatchObject({status:401});
    await entrar(demo,true);
    sessionStorage.clear();
    vi.setSystemTime(Date.now()+9*3600000);
    expect((await demo.get<Usuario>('yo')).correo).toBe('prueba');
  });
  it('rechaza acceso privado y credenciales incorrectas', async () => {
    await expect(demo.get('yo')).rejects.toMatchObject({ status: 401 });
    await expect(demo.enviar('POST', 'inicio-sesion', { correo: 'prueba', contrasena: 'incorrecta' })).rejects.toMatchObject({ status: 422 });
    expect((await entrar(demo)).correo).toBe('prueba');
  });
  it('conserva modificaciones al reconstruir el servicio y cerrar sesión', async () => {
    await entrar(demo, true);
    const mascotas = await demo.get<MascotaApi[]>('mascotas');
    await demo.enviar('PATCH', `mascotas/${mascotas[0].id}`, { ...mascotas[0], nombre: 'Luna actualizada' });
    await demo.enviar('POST', 'cierre-sesion');
    demo = new ServicioDemoLocal();
    await expect(demo.get('yo')).rejects.toMatchObject({ status: 401 });
    await entrar(demo);
    expect((await demo.get<MascotaApi[]>('mascotas'))[0].nombre).toBe('Luna actualizada');
  });
  it('exporta sin secretos y restablece datos y sesión', async () => {
    await entrar(demo);
    const json = JSON.parse(demo.exportarDatos());
    expect(json.mascotas.length).toBeGreaterThan(0);
    expect(json.cuentas).toBeUndefined();
    expect(demo.exportarDatos()).not.toContain('Birtlh123.');
    demo.restablecer();
    await expect(demo.get('yo')).rejects.toMatchObject({ status: 401 });
    expect((await entrar(demo)).correo).toBe('prueba');
  });
});
