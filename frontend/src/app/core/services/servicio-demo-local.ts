import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Auditoria, Dosis, Evento, MascotaApi, RegistroSanitario, Tratamiento, Usuario, VersionTratamiento, fechaLocal } from '../../shared/models/api';
import { AgendaLocal, CuentaLocal, DatosDemo, ESPECIES_DEMO, crearDatosDemo, mascotaVacia } from './demo-local-datos';

type Entrada = Record<string, unknown>;
const DATOS = 'petcare.demo.v1';
const SESION = 'petcare.demo.sesion.v1';
const copiar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;
const ahora = () => new Date().toISOString();
const texto = (valor: unknown) => String(valor ?? '').trim();
function fallo(mensaje: string, status = 422): never { throw new HttpErrorResponse({ status, error: { message: mensaje } }); }
function requerido(d: Entrada, campo: string): string { const v = texto(d[campo]); if (!v) fallo(`El campo ${campo} es obligatorio.`); return v; }
function fecha(valor: unknown): string {
  const s = texto(valor); const d = new Date(`${s}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) fallo('La fecha no es válida.');
  return s;
}
function zona(valor: unknown): string { const z = texto(valor) || 'Europe/Madrid'; try { new Intl.DateTimeFormat('es', { timeZone: z }).format(); } catch { fallo('La zona horaria no es válida.'); } return z; }
function instante(valor: unknown): string { const d = new Date(texto(valor)); if (Number.isNaN(d.getTime())) fallo('La fecha y hora no son válidas.'); return d.toISOString(); }
function fechaZona(d: Date, z: string): string { return new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
/** Convierte una hora de pared de la mascota; los intervalos posteriores usan tiempo transcurrido. */
function horaZona(dia: string, hora: string, z: string): string {
  const objetivo = Date.parse(`${dia}T${hora}:00Z`); let valor = objetivo;
  for (let i = 0; i < 3; i++) {
    const partes = new Intl.DateTimeFormat('en-CA', { timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(valor));
    const p = Object.fromEntries(partes.map(x => [x.type, x.value]));
    const representado = Date.parse(`${p['year']}-${p['month']}-${p['day']}T${p['hour']}:${p['minute']}:${p['second']}Z`);
    valor += objetivo - representado;
  }
  return new Date(valor).toISOString();
}

/** Simulación exclusiva del navegador. No sustituye la autorización ni la persistencia de Laravel. */
@Injectable({ providedIn: 'root' })
export class ServicioDemoLocal {
  private cola: Promise<unknown> = Promise.resolve();
  private leer(): DatosDemo {
    let raw: string | null;
    try { raw = localStorage.getItem(DATOS); } catch { return fallo('Permite el almacenamiento local para usar la demostración.'); }
    if (!raw) return crearDatosDemo();
    try {
      const d = JSON.parse(raw) as DatosDemo;
      if (d.version !== 1 || !Array.isArray(d.cuentas) || !Array.isArray(d.mascotas) || !Array.isArray(d.agenda)) throw new Error();
      return d;
    } catch { return fallo('Los datos locales no se pueden leer. Restablece la demostración desde Mi cuenta o borra los datos del sitio.'); }
  }
  private guardar(d: DatosDemo): void {
    try { localStorage.setItem(DATOS, JSON.stringify(d)); } catch { fallo('No se han guardado los cambios: el almacenamiento está lleno o bloqueado. Prueba con una fotografía más pequeña.'); }
  }
  private cerrar(): void { sessionStorage.removeItem(SESION); localStorage.removeItem(SESION); }
  private abrir(id: number, recordar = false): void {
    this.cerrar(); const s = JSON.stringify({ id, caduca: Date.now() + (recordar ? 30 * 86400000 : 8 * 3600000) });
    try { (recordar ? localStorage : sessionStorage).setItem(SESION, s); } catch { fallo('No se puede guardar la sesión en este navegador.'); }
  }
  private usuario(d: DatosDemo): Usuario {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESION) ?? localStorage.getItem(SESION) ?? 'null');
      const u = s && s.caduca > Date.now() && d.cuentas.find(c => c.usuario.id === s.id)?.usuario;
      if (u) return u;
    } catch { /* Una sesión inválida se trata como cerrada. */ }
    this.cerrar(); return fallo('Inicia sesión para acceder a tus mascotas.', 401);
  }
  private permiso(d: DatosDemo, m: MascotaApi, u: Usuario) {
    return m.propietario_id === u.id ? 'propietario' : d.colaboradores.find(c => c.mascota_id === m.id && c.usuario_id === u.id)?.permiso;
  }
  private mascota(d: DatosDemo, id: number, u: Usuario, editar = false, eliminada = false): MascotaApi {
    const m = d.mascotas.find(m => m.id === id && (eliminada || !m.eliminado_en));
    if (!m || !this.permiso(d, m, u)) return fallo('Mascota no encontrada.', 404);
    if (editar && this.permiso(d, m, u) !== 'propietario') fallo('Solo los propietarios pueden realizar este cambio.', 403);
    return m;
  }
  private presentar(d: DatosDemo, m: MascotaApi, u: Usuario): MascotaApi {
    return { ...m, especie: ESPECIES_DEMO.find(e => e.id === m.especie_id)!, permiso: this.permiso(d, m, u)!, numero_propietarios: 1 + d.colaboradores.filter(c => c.mascota_id === m.id && c.permiso === 'propietario').length, restaurable: !!m.eliminado_en };
  }
  private async hash(valor: string, sal: string): Promise<string> {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sal + ':' + valor));
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  }
  private async verificar(c: CuentaLocal | undefined, contrasena: unknown): Promise<boolean> {
    if (!c) return false;
    if (!c.hash && c.usuario.id === 1) return contrasena === 'Birtlh123.';
    return await this.hash(String(contrasena ?? ''), c.sal) === c.hash;
  }
  private async confirmar(d: DatosDemo, u: Usuario, entrada: Entrada): Promise<void> {
    if (!await this.verificar(d.cuentas.find(c => c.usuario.id === u.id), entrada['contrasena_actual'])) fallo('La contraseña actual no es correcta.');
  }
  private async credencial(c: CuentaLocal, clave: string): Promise<void> {
    c.sal = crypto.randomUUID(); c.hash = await this.hash(clave, c.sal);
  }
  private clave(d: Entrada): string {
    const clave = requerido(d, 'contrasena');
    if (clave.length < 10 || !/[A-Za-z]/.test(clave) || !/\d/.test(clave)) fallo('La contraseña necesita al menos 10 caracteres, letras y números.');
    if (clave !== d['contrasena_confirmation']) fallo('Las contraseñas no coinciden.');
    return clave;
  }
  private auditar(d: DatosDemo, u: Usuario, mascota: number, tipo: string, id: number, accion: string, anterior: unknown, nuevo: unknown, motivo: unknown = null): void {
    d.auditoria.unshift({ id: d.siguienteId++, mascota_id: mascota, entidad_tipo: tipo, entidad_id: id, accion, autor: u.nombre, motivo: texto(motivo) || null, ocurrido_en: ahora(), valores_anteriores: copiar(anterior), valores_nuevos: copiar(nuevo) });
  }

  async get<T>(ruta: string): Promise<T> {
    await this.cola;
    const d = this.leer(); const url = new URL(ruta, 'https://demo.invalid/'); const p = url.pathname.split('/').filter(Boolean); const q = url.searchParams;
    if (p[0] === 'estado') return { aplicacion: 'PetCare', estado: 'disponible', base_de_datos_habilitada: true, modo: 'demo' } as T;
    const u = this.usuario(d); let resultado: unknown;
    if (p[0] === 'yo') resultado = u;
    else if (p[0] === 'especies') resultado = ESPECIES_DEMO;
    else if (p[0] === 'calendario') resultado = this.calendario(d, u, q);
    else if (p[0] === 'mascotas' && !p[1]) resultado = d.mascotas.filter(m => !m.eliminado_en && this.permiso(d, m, u)).map(m => this.presentar(d, m, u));
    else if (p[0] === 'mascotas') {
      const m = this.mascota(d, Number(p[1]), u);
      if (!p[2]) resultado = this.presentar(d, m, u);
      else if (p[2] === 'historial') resultado = d.historial.filter(r => r.mascota_id === m.id && !r['eliminado_en'] && (!q.get('tipo') || r.clase === q.get('tipo'))).map(r => ({ ...r, puede_editar: this.permiso(d, m, u) === 'propietario' })).sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
      else if (p[2] === 'tratamientos') {
        if (p[4] === 'dosis') { const t = d.tratamientos.find(t => t.id === Number(p[3]) && t.mascota_id === m.id); if (!t) fallo('Tratamiento no encontrado.', 404); resultado = this.dosis(d, t, q); }
        else resultado = d.tratamientos.filter(t => t.mascota_id === m.id);
      } else if (p[2] === 'agenda') resultado = d.agenda.filter(a => a.mascota_id === m.id && a.tipo === p[3] && !a['eliminado_en']);
      else if (p[2] === 'colaboradores') resultado = { propietario: { usuario_id: m.propietario_id, nombre: d.cuentas.find(c => c.usuario.id === m.propietario_id)?.usuario.nombre ?? 'Propietario', permiso: 'propietario' }, colaboradores: d.colaboradores.filter(c => c.mascota_id === m.id).map(c => ({ ...c, nombre: d.cuentas.find(a => a.usuario.id === c.usuario_id)?.usuario.nombre ?? c.nombre })) };
      else if (p[2] === 'codigos') { this.mascota(d, m.id, u, true); resultado = d.codigos.filter(c => c.mascota_id === m.id).map(({ codigo, ...c }) => c); }
      else if (p[2] === 'auditoria') {
        this.mascota(d, m.id, u, true); const filas = d.auditoria.filter(a => a.mascota_id === m.id); const pagina = Math.max(1, Number(q.get('page')) || 1);
        resultado = { data: filas.slice((pagina - 1) * 20, pagina * 20), last_page: Math.max(1, Math.ceil(filas.length / 20)) };
      } else fallo('Recurso no disponible en la demostración.', 404);
    } else fallo('Recurso no encontrado.', 404);
    return copiar(resultado) as T;
  }

  enviar<T>(metodo: 'POST' | 'PATCH' | 'DELETE', ruta: string, datos: unknown = {}): Promise<T> {
    const tarea = this.cola.then(() => this.escribir(metodo, ruta, datos));
    this.cola = tarea.catch(() => undefined);
    return tarea as Promise<T>;
  }
  private async escribir(metodo: string, ruta: string, datos: unknown): Promise<unknown> {
    const d = this.leer(); const p = ruta.split('?')[0].split('/'); const entrada = (datos instanceof FormData ? {} : datos ?? {}) as Entrada;
    if (ruta === 'cierre-sesion') { this.cerrar(); return {}; }
    if (ruta === 'inicio-sesion') {
      const c = d.cuentas.find(c => c.usuario.correo.toLowerCase() === texto(entrada['correo']).toLowerCase());
      if (!await this.verificar(c, entrada['contrasena'])) fallo('El correo o la contraseña no son correctos.');
      this.guardar(d); this.abrir(c!.usuario.id, entrada['recordar'] === true); return copiar(c!.usuario);
    }
    if (ruta === 'registro') {
      const correo = requerido(entrada, 'correo').toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) fallo('Introduce un correo electrónico válido.');
      if (d.cuentas.some(c => c.usuario.correo.toLowerCase() === correo)) fallo('Ya existe una cuenta local con este correo.');
      const c: CuentaLocal = { usuario: { id: d.siguienteId++, nombre: requerido(entrada, 'nombre'), correo, zona_horaria: 'Europe/Madrid' }, sal: '', hash: '' };
      await this.credencial(c, this.clave(entrada)); d.cuentas.push(c); this.guardar(d); this.abrir(c.usuario.id); return { usuario: copiar(c.usuario) };
    }
    const u = this.usuario(d); let resultado: unknown = {};
    if (ruta === 'yo') {
      await this.confirmar(d, u, entrada);
      if (metodo === 'DELETE') {
        if (d.mascotas.some(m => !m.eliminado_en && this.permiso(d, m, u) === 'propietario')) fallo('Elimina primero las mascotas de tu cuenta.');
        d.cuentas = d.cuentas.filter(c => c.usuario.id !== u.id); d.colaboradores = d.colaboradores.filter(c => c.usuario_id !== u.id); this.guardar(d); this.cerrar(); return {};
      }
      const correo = requerido(entrada, 'correo').toLowerCase();
      if (correo !== 'prueba' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) fallo('Introduce un correo electrónico válido.');
      if (d.cuentas.some(c => c.usuario.id !== u.id && c.usuario.correo.toLowerCase() === correo)) fallo('Este correo ya está en uso.');
      u.nombre = requerido(entrada, 'nombre'); u.correo = correo; u.zona_horaria = zona(entrada['zona_horaria']); resultado = u;
    } else if (ruta === 'contrasena') {
      await this.confirmar(d, u, entrada); await this.credencial(d.cuentas.find(c => c.usuario.id === u.id)!, this.clave(entrada));
    } else if (p[0] === 'compartir') {
      const c = d.codigos.find(c => c.codigo === texto(entrada['codigo']).toUpperCase());
      if (!c || c.usado_en || c.cancelado_en || c.caduca_en < ahora()) fallo('El código no existe en este navegador, ha caducado o ya se ha usado.');
      const m = d.mascotas.find(m => m.id === c.mascota_id && !m.eliminado_en); if (!m) fallo('Mascota no encontrada.', 404);
      if (p[1] === 'consultar') return { nombre: m.nombre, permiso: c.permiso, caduca_en: c.caduca_en };
      if (this.permiso(d, m, u)) fallo('Ya tienes acceso a esta mascota.');
      d.colaboradores.push({ mascota_id: m.id, usuario_id: u.id, nombre: u.nombre, permiso: c.permiso }); c.usado_en = ahora(); resultado = { mascota_id: m.id };
    } else if (p[0] === 'mascotas' && !p[1]) {
      const m = this.validarMascota(entrada, mascotaVacia(d.siguienteId++, u.id)); d.mascotas.push(m); resultado = this.presentar(d, m, u);
      this.auditar(d, u, m.id, 'mascotas', m.id, 'crear', null, m);
    } else if (p[0] === 'mascotas') {
      const abandonar = p[2] === 'colaboradores' && Number(p[3]) === u.id;
      const m = this.mascota(d, Number(p[1]), u, !abandonar);
      if (!p[2]) {
        const anterior = copiar(m);
        if (metodo === 'DELETE') {
          await this.confirmar(d, u, entrada);
          const otros = d.colaboradores.filter(c => c.mascota_id === m.id && c.permiso === 'propietario' && c.usuario_id !== u.id);
          if (m.propietario_id !== u.id) d.colaboradores = d.colaboradores.filter(c => !(c.mascota_id === m.id && c.usuario_id === u.id));
          else if (otros.length) { m.propietario_id = otros[0].usuario_id; d.colaboradores = d.colaboradores.filter(c => !(c.mascota_id === m.id && c.usuario_id === m.propietario_id)); }
          else {
            const tratamientos = d.tratamientos.filter(t => t.mascota_id === m.id).map(t => t.id);
            d.mascotas = d.mascotas.filter(a => a.id !== m.id);
            d.historial = d.historial.filter(a => a.mascota_id !== m.id);
            d.tratamientos = d.tratamientos.filter(a => a.mascota_id !== m.id);
            d.resoluciones = d.resoluciones.filter(a => !tratamientos.includes(a.tratamiento_id));
            d.agenda = d.agenda.filter(a => a.mascota_id !== m.id);
            d.colaboradores = d.colaboradores.filter(a => a.mascota_id !== m.id);
            d.codigos = d.codigos.filter(a => a.mascota_id !== m.id);
            d.auditoria = d.auditoria.filter(a => a.mascota_id !== m.id);
            this.guardar(d); return {};
          }
        } else { Object.assign(m, this.validarMascota(entrada, m)); resultado = this.presentar(d, m, u); }
        this.auditar(d, u, m.id, 'mascotas', m.id, metodo === 'DELETE' ? 'eliminar' : 'actualizar', anterior, m);
      } else if (p[2] === 'fotografia') {
        if (metodo === 'DELETE') m.foto_url = null;
        else {
          const foto = datos instanceof FormData ? datos.get('fotografia') : null;
          if (!(foto instanceof Blob) || !['image/jpeg', 'image/png', 'image/webp'].includes(foto.type)) fallo('Selecciona una imagen JPEG, PNG o WebP.');
          if (foto.size > 2 * 1024 * 1024) fallo('En la demostración la fotografía no puede superar 2 MB.');
          m.foto_url = await new Promise<string>((resolve, reject) => { const lector = new FileReader(); lector.onload = () => resolve(String(lector.result)); lector.onerror = () => reject(new Error('No se pudo leer la fotografía.')); lector.readAsDataURL(foto); });
        }
        resultado = this.presentar(d, m, u);
      } else if (p[2] === 'historial') resultado = this.escribirHistorial(d, u, m, p, metodo, entrada);
      else if (p[2] === 'agenda') resultado = this.escribirAgenda(d, u, m, p, metodo, entrada);
      else if (p[2] === 'tratamientos') resultado = this.escribirTratamiento(d, u, m, p, metodo, entrada);
      else if (p[2] === 'codigos') {
        if (metodo === 'DELETE') { const c = d.codigos.find(c => c.id === Number(p[3]) && c.mascota_id === m.id); if (!c) fallo('Código no encontrado.', 404); c.cancelado_en = ahora(); }
        else {
          await this.confirmar(d, u, entrada); const permiso = entrada['permiso']; if (permiso !== 'propietario' && permiso !== 'ayudante') fallo('Permiso no válido.');
          const codigo = crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase().match(/.{4}/g)!.join('-');
          d.codigos.push({ id: d.siguienteId++, mascota_id: m.id, codigo, permiso, caduca_en: new Date(Date.now() + 20 * 60000).toISOString(), usado_en: null, cancelado_en: null }); resultado = { codigo };
        }
      } else if (p[2] === 'colaboradores') {
        const c = d.colaboradores.find(c => c.mascota_id === m.id && c.usuario_id === Number(p[3]));
        if (!c || c.permiso === 'propietario') fallo('Solo se puede retirar el acceso de ayudantes.');
        d.colaboradores = d.colaboradores.filter(a => a !== c);
      } else fallo('Operación no disponible en la demostración.', 404);
    } else fallo('Operación no encontrada.', 404);
    this.guardar(d); return copiar(resultado);
  }

  private validarMascota(e: Entrada, previa: MascotaApi): MascotaApi {
    const m = { ...previa }; const campos = ['nombre', 'especie_id', 'otra_especie', 'raza', 'sexo', 'precision_nacimiento', 'anio_nacimiento', 'mes_nacimiento', 'dia_nacimiento', 'peso_actual_kg', 'esterilizacion', 'microchip', 'color_caracteristicas', 'observaciones', 'zona_horaria'];
    for (const c of campos) if (c in e) (m as unknown as Entrada)[c] = e[c] === '' ? null : e[c];
    m.nombre = requerido(m as unknown as Entrada, 'nombre'); if (m.nombre.length > 60) fallo('El nombre no puede superar 60 caracteres.');
    m.especie_id = Number(m.especie_id); const especie = ESPECIES_DEMO.find(e => e.id === m.especie_id); if (!especie) fallo('Selecciona una especie.'); m.especie = especie;
    if (especie.codigo === 'otra' && !texto(m.otra_especie)) fallo('Indica la especie.');
    m.zona_horaria = zona(m.zona_horaria);
    if (m.peso_actual_kg !== null && !(Number(m.peso_actual_kg) > 0)) fallo('El peso debe ser mayor que cero.');
    if (!['desconocida', 'anio', 'mes_anio', 'exacta'].includes(m.precision_nacimiento)) fallo('Precisión de nacimiento no válida.');
    if (m.precision_nacimiento !== 'desconocida') {
      const anio = Number(m.anio_nacimiento); const mes = m.precision_nacimiento === 'anio' ? 1 : Number(m.mes_nacimiento); const dia = m.precision_nacimiento === 'exacta' ? Number(m.dia_nacimiento) : 1;
      const nacimiento = fecha(`${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
      if (nacimiento > fechaLocal()) fallo('El nacimiento no puede estar en el futuro.');
    }
    return m;
  }

  private escribirHistorial(d: DatosDemo, u: Usuario, m: MascotaApi, p: string[], metodo: string, e: Entrada): RegistroSanitario | object {
    const metadatos: Record<string, [string, string]> = { consultas: ['fecha_consulta', 'motivo'], vacunas: ['fecha_administracion', 'nombre'], desparasitaciones: ['fecha_aplicacion', 'producto'], alergias: ['fecha_deteccion', 'alergeno'] };
    const meta = metadatos[p[3]]; if (!meta) fallo('Tipo de historial no válido.');
    const previo = p[4] ? d.historial.find(r => r.id === Number(p[4]) && r.mascota_id === m.id && r.clase === p[3] && !r['eliminado_en']) : undefined;
    if (p[4] && !previo) fallo('Registro no encontrado.', 404);
    const anterior = previo ? copiar(previo) : null;
    if (metodo === 'DELETE') {
      requerido(e, 'motivo_correccion'); previo!['eliminado_en'] = ahora(); this.auditar(d, u, m.id, p[3], previo!.id, 'eliminar', anterior, previo, e['motivo_correccion']); return {};
    }
    if (metodo === 'PATCH') requerido(e, 'motivo_correccion');
    const titulo = requerido(e, meta[1]); const f = e[meta[0]] ? fecha(e[meta[0]]) : null;
    if (p[3] !== 'alergias' && !f) fallo('La fecha es obligatoria.'); if (f && f > fechaZona(new Date(), m.zona_horaria)) fallo('Un registro realizado no puede tener fecha futura.');
    const proxima = e['proxima_dosis_fecha'] || e['proxima_aplicacion_fecha']; if (proxima && fecha(proxima) <= (f ?? '')) fallo('La próxima administración debe ser posterior.');
    if (p[5] === 'siguiente') { if (!['vacunas', 'desparasitaciones'].includes(p[3]) || previo!.prevision_atendida_en) fallo('Esta previsión ya está atendida o no admite administraciones.'); previo!.prevision_atendida_en = ahora(); }
    const r: RegistroSanitario = { ...e, id: metodo === 'PATCH' ? previo!.id : d.siguienteId++, mascota_id: m.id, clase: p[3], titulo, fecha: f, creado_por_id: previo?.creado_por_id ?? u.id, autor: previo?.autor ?? u.nombre, puede_editar: true, prevision_atendida_en: metodo === 'PATCH' ? previo?.prevision_atendida_en : null };
    delete r['contrasena_actual']; delete r['motivo_correccion']; delete r['eliminado_en'];
    if (metodo === 'PATCH') Object.assign(previo!, r); else d.historial.push(r);
    this.auditar(d, u, m.id, p[3], r.id, metodo === 'PATCH' ? 'corregir' : 'crear', anterior, r, e['motivo_correccion']); return r;
  }

  private escribirAgenda(d: DatosDemo, u: Usuario, m: MascotaApi, p: string[], metodo: string, e: Entrada): unknown {
    const tipo = p[3]; if (tipo !== 'citas' && tipo !== 'tareas') fallo('Tipo de agenda no válido.');
    const a = p[4] ? d.agenda.find(a => a.id === Number(p[4]) && a.mascota_id === m.id && a.tipo === tipo && !a['eliminado_en']) : undefined;
    if (p[4] && !a) fallo('Evento no encontrado.', 404); const anterior = a ? copiar(a) : null;
    if (metodo === 'DELETE') { requerido(e, 'motivo'); a!['eliminado_en'] = ahora(); }
    else if (p[5] === 'resolver') {
      if (!['pendiente', 'programada'].includes(a!.estado)) fallo('El evento ya está resuelto.');
      const estados = tipo === 'citas' ? ['realizada', 'cancelada'] : ['completada', 'cancelada']; if (!estados.includes(texto(e['estado']))) fallo('Resultado no válido.');
      if (e['consulta_veterinaria_id'] && !d.historial.some(r => r.id === Number(e['consulta_veterinaria_id']) && r.mascota_id === m.id && r.clase === 'consultas' && !r['eliminado_en'])) fallo('La consulta debe pertenecer a esta mascota.');
      a!.estado = texto(e['estado']); a!['resuelto_en'] = ahora(); a!['consulta_veterinaria_id'] = e['consulta_veterinaria_id'] ?? null;
    } else {
      if (a && !['pendiente', 'programada'].includes(a.estado)) fallo('No se puede editar un evento resuelto.');
      const campo = tipo === 'citas' ? 'fecha_hora_inicio' : 'fecha_hora_programada'; const f = instante(requerido(e, campo));
      const responsable = Number(e['responsable_id']) || null;
      if (responsable && responsable !== m.propietario_id && !d.colaboradores.some(c => c.mascota_id === m.id && c.usuario_id === responsable && c.permiso === 'propietario')) fallo('El responsable debe ser propietario de esta mascota.');
      const nuevo: AgendaLocal = { titulo: requerido(e, 'titulo'), descripcion: texto(e['descripcion']), lugar: texto(e['lugar']), responsable_id: responsable, [campo]: f, id: a?.id ?? d.siguienteId++, mascota_id: m.id, tipo, estado: a?.estado ?? (tipo === 'citas' ? 'programada' : 'pendiente') };
      if (a) Object.assign(a, nuevo); else d.agenda.push(nuevo);
      this.auditar(d, u, m.id, tipo, nuevo.id, a ? 'actualizar' : 'crear', anterior, nuevo); return nuevo;
    }
    this.auditar(d, u, m.id, tipo, a!.id, metodo === 'DELETE' ? 'eliminar' : 'resolver', anterior, a, e['motivo']); return a;
  }

  private escribirTratamiento(d: DatosDemo, u: Usuario, m: MascotaApi, p: string[], metodo: string, e: Entrada): unknown {
    const t = p[3] ? d.tratamientos.find(t => t.id === Number(p[3]) && t.mascota_id === m.id) : undefined;
    if (p[3] && !t) fallo('Tratamiento no encontrado.', 404);
    if (p[4] === 'cerrar') {
      requerido(e, 'motivo'); if (!['finalizado', 'cancelado'].includes(texto(e['estado']))) fallo('Estado no válido.');
      if (t!.estado !== 'en_curso') fallo('El tratamiento ya está cerrado.');
      t!.estado = texto(e['estado']); t!.version_actual.vigor_hasta_en = ahora(); t!.versiones.find(v => v.id === t!.version_actual.id)!.vigor_hasta_en = t!.version_actual.vigor_hasta_en;
      this.auditar(d, u, m.id, 'tratamientos', t!.id, 'cerrar', null, t, e['motivo']); return t;
    }
    if (p[4] === 'dosis') {
      const f = instante(requerido(e, 'fecha_hora_programada')); const version = Number(e['version_tratamiento_id']);
      const dia = fechaZona(new Date(f), m.zona_horaria); const dosis = this.dosis(d, t!, new URLSearchParams({ desde: dia, hasta: dia })).find(a => a.fecha_hora_programada === f && a.version_tratamiento_id === version);
      if (!dosis || (dosis.cancelado && !dosis.resolucion)) fallo('La dosis no pertenece a una pauta vigente.');
      const anterior = d.resoluciones.find(r => r.tratamiento_id === t!.id && r.version_tratamiento_id === version && r.fecha_hora_programada === f);
      if (metodo === 'PATCH') { if (!anterior || anterior.id !== Number(p[5])) fallo('Resolución no encontrada.', 404); requerido(e, 'motivo_correccion'); }
      else if (anterior) fallo('La dosis ya está registrada.');
      if (!['administrada', 'omitida'].includes(texto(e['estado']))) fallo('Resultado no válido.');
      const real = e['estado'] === 'administrada' ? instante(requerido(e, 'fecha_hora_real')) : null;
      if (real && real > ahora()) fallo('La administración no puede estar en el futuro.');
      const r = { id: anterior?.id ?? d.siguienteId++, tratamiento_id: t!.id, version_tratamiento_id: version, fecha_hora_programada: f, registrado_por_id: anterior?.registrado_por_id ?? u.id, estado: texto(e['estado']), fecha_hora_real: real, cantidad_real: e['cantidad_real'] ? texto(e['cantidad_real']) : null, unidad_real: texto(e['unidad_real']) || null, realizado_por_nombre: texto(e['realizado_por_nombre']) || null, realizado_por_usuario_id: e['realizado_por_nombre'] ? null : u.id, observaciones: texto(e['observaciones']) || null, motivo_omision: texto(e['motivo_omision']) || null };
      this.auditar(d, u, m.id, 'dosis', r.id, anterior ? 'corregir' : 'resolver', anterior ?? null, r, e['motivo_correccion']); if (anterior) Object.assign(anterior, r); else d.resoluciones.push(r); return r;
    }
    if (t && t.estado !== 'en_curso') fallo('El tratamiento está cerrado.'); if (t) requerido(e, 'motivo_cambio');
    const nombre = requerido(e, 'nombre'); const inicio = fecha(requerido(e, 'fecha_inicio')); const fin = e['fecha_fin'] ? fecha(e['fecha_fin']) : null;
    if (fin && fin < inicio) fallo('La fecha final debe ser posterior al inicio.');
    const frecuencia = requerido(e, 'tipo_frecuencia'); if (!['diaria', 'cada_horas', 'dias_semana', 'unica'].includes(frecuencia)) fallo('Frecuencia no válida.');
    const horarios = Array.isArray(e['horarios']) ? [...new Set(e['horarios'].map(String))].sort() : [];
    if (frecuencia !== 'cada_horas' && (!horarios.length || horarios.some(h => !/^([01]\d|2[0-3]):[0-5]\d$/.test(h)))) fallo('Añade al menos un horario válido.');
    if (frecuencia === 'unica' && (horarios.length !== 1 || fin !== inicio)) fallo('Una dosis única necesita un horario y la misma fecha de inicio y fin.');
    const intervalo = Number(e['intervalo_horas']); const hora = texto(e['hora_inicio']);
    if (frecuencia === 'cada_horas' && (!Number.isInteger(intervalo) || intervalo < 1 || intervalo > 720 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora))) fallo('Indica un intervalo de 1 a 720 horas y una hora inicial.');
    const dias = Array.isArray(e['dias_semana']) ? e['dias_semana'].map(Number) : [];
    if (frecuencia === 'dias_semana' && (!dias.length || dias.some(n => !Number.isInteger(n) || n < 1 || n > 7))) fallo('Selecciona los días de la semana.');
    const tipo = t?.tipo ?? texto(e['tipo']); if (!['medicamento', 'cuidado'].includes(tipo)) fallo('Tipo de tratamiento no válido.');
    if (tipo === 'medicamento' && (!(Number(e['cantidad']) > 0) || !texto(e['unidad']))) fallo('Un medicamento requiere cantidad y unidad.');
    const v: VersionTratamiento = { id: d.siguienteId++, numero_version: (t?.version_actual.numero_version ?? 0) + 1, indicaciones: requerido(e, 'indicaciones'), cantidad: e['cantidad'] ? texto(e['cantidad']) : null, unidad: texto(e['unidad']) || null, fecha_inicio: inicio, fecha_fin: frecuencia === 'unica' ? inicio : fin, tipo_frecuencia: frecuencia, horarios: frecuencia === 'cada_horas' ? null : horarios, dias_semana: frecuencia === 'dias_semana' ? dias : null, intervalo_horas: frecuencia === 'cada_horas' ? intervalo : null, ancla_en: frecuencia === 'cada_horas' ? horaZona(inicio, hora, m.zona_horaria) : null, hora_inicio: frecuencia === 'cada_horas' ? hora : null, zona_horaria: m.zona_horaria, vigor_desde_en: t ? ahora() : horaZona(inicio, '00:00', m.zona_horaria), vigor_hasta_en: null, prescriptor: texto(e['prescriptor']) || null, observaciones: texto(e['observaciones']) || null, motivo_cambio: texto(e['motivo_cambio']) || null };
    if (t) { t.versiones.find(a => a.id === t.version_actual.id)!.vigor_hasta_en = v.vigor_desde_en; t.version_actual = v; t.versiones.push(v); t.nombre = nombre; this.auditar(d, u, m.id, 'tratamientos', t.id, 'cambiar_pauta', null, v, e['motivo_cambio']); return t; }
    const nuevo: Tratamiento = { id: d.siguienteId++, mascota_id: m.id, nombre, tipo, estado: 'en_curso', creado_por_id: u.id, version_actual: v, versiones: [v] }; d.tratamientos.push(nuevo); return nuevo;
  }

  private rango(q: URLSearchParams): [string, string] {
    const desde = fecha(q.get('desde') ?? fechaLocal()); const hasta = fecha(q.get('hasta') ?? desde);
    if (hasta < desde || Date.parse(hasta) - Date.parse(desde) > 366 * 86400000) fallo('Selecciona un intervalo de hasta 366 días y con fin posterior al inicio.'); return [desde, hasta];
  }
  private dosis(d: DatosDemo, t: Tratamiento, q: URLSearchParams): Dosis[] {
    const [desde, hasta] = this.rango(q); const resultado: Dosis[] = [];
    for (const v of t.versiones) {
      const principio = desde > v.fecha_inicio ? desde : v.fecha_inicio; const final = v.fecha_fin && v.fecha_fin < hasta ? v.fecha_fin : hasta;
      const instantes: string[] = [];
      if (v.tipo_frecuencia === 'cada_horas') {
        const paso = Number(v.intervalo_horas) * 3600000; const ancla = Date.parse(v.ancla_en!); const inicio = Date.parse(horaZona(principio, '00:00', v.zona_horaria));
        if (paso > 0 && Number.isFinite(ancla)) for (let n = ancla + Math.max(0, Math.ceil((inicio - ancla) / paso)) * paso; fechaZona(new Date(n), v.zona_horaria) <= final && instantes.length < 10000; n += paso) instantes.push(new Date(n).toISOString());
      } else {
        for (let dia = principio; dia <= final; ) {
          const n = new Date(`${dia}T12:00:00Z`); const semana = n.getUTCDay() || 7;
          if (v.tipo_frecuencia !== 'dias_semana' || v.dias_semana?.includes(semana)) for (const hora of v.horarios ?? []) instantes.push(horaZona(dia, hora, v.zona_horaria));
          n.setUTCDate(n.getUTCDate() + 1); dia = n.toISOString().slice(0, 10);
        }
      }
      for (const f of instantes) {
        if (f < v.vigor_desde_en) continue;
        const resolucion = d.resoluciones.find(r => r.tratamiento_id === t.id && r.version_tratamiento_id === v.id && r.fecha_hora_programada === f) ?? null;
        const cancelado = !!v.vigor_hasta_en && f >= v.vigor_hasta_en;
        if (cancelado && t.estado === 'en_curso' && !resolucion) continue;
        resultado.push({ tratamiento_id: t.id, version_tratamiento_id: v.id, dosis_clave: `${t.id}:${v.id}:${f}`, fecha_hora_programada: f, estado: resolucion?.estado ?? (cancelado ? 'cancelada' : f < ahora() ? 'atrasada' : 'pendiente'), nombre: t.nombre, cantidad: v.cantidad, unidad: v.unidad, resolucion, cancelado });
      }
    }
    return resultado.sort((a, b) => a.fecha_hora_programada.localeCompare(b.fecha_hora_programada));
  }
  private calendario(d: DatosDemo, u: Usuario, q: URLSearchParams): { eventos: Evento[]; limitado: boolean } {
    const [desde, hasta] = this.rango(q); const eventos: Evento[] = [];
    const mascotas = d.mascotas.filter(m => !m.eliminado_en && this.permiso(d, m, u) && (!q.get('mascota_id') || m.id === Number(q.get('mascota_id'))));
    for (const m of mascotas) {
      const escribir = this.permiso(d, m, u) === 'propietario';
      for (const a of d.agenda.filter(a => a.mascota_id === m.id && !a['eliminado_en'])) {
        const f = String(a.fecha_hora_inicio ?? a.fecha_hora_programada); eventos.push({ clave: `${a.tipo}:${a.id}`, id: a.id, mascota_id: m.id, mascota_nombre: m.nombre, titulo: a.titulo, tipo: a.tipo === 'citas' ? 'cita' : 'tarea', fecha: fechaZona(new Date(f), m.zona_horaria), instante: f, estado: ['pendiente', 'programada'].includes(a.estado) && f < ahora() ? 'atrasada' : a.estado, puede_editar: escribir, puede_resolver: escribir, datos: a });
      }
      for (const r of d.historial.filter(r => r.mascota_id === m.id && !r['eliminado_en'] && !r.prevision_atendida_en && ['vacunas', 'desparasitaciones'].includes(r.clase))) {
        const f = texto(r['proxima_dosis_fecha'] || r['proxima_aplicacion_fecha']); if (!f) continue;
        eventos.push({ clave: `${r.clase}:${r.id}`, id: r.id, mascota_id: m.id, mascota_nombre: m.nombre, titulo: r.titulo, tipo: r.clase === 'vacunas' ? 'vacuna' : 'desparasitacion', fecha: f, instante: null, estado: f < fechaZona(new Date(), m.zona_horaria) ? 'atrasada' : 'pendiente', puede_editar: false, puede_resolver: escribir, datos: r });
      }
      for (const t of d.tratamientos.filter(t => t.mascota_id === m.id)) for (const dosis of this.dosis(d, t, q)) eventos.push({ clave: dosis.dosis_clave, id: t.id, mascota_id: m.id, mascota_nombre: m.nombre, titulo: t.nombre, tipo: 'dosis', fecha: fechaZona(new Date(dosis.fecha_hora_programada), m.zona_horaria), instante: dosis.fecha_hora_programada, estado: dosis.estado, puede_editar: false, puede_resolver: escribir && !dosis.cancelado, datos: { ...dosis } });
    }
    const filtrados = eventos.filter(e => (!q.get('tipo') || q.get('tipo') === e.tipo) && e.fecha <= hasta && (e.fecha >= desde || (q.get('incluir_atrasados') === '1' && ['pendiente', 'programada', 'atrasada'].includes(e.estado)))).sort((a, b) => (a.instante ?? a.fecha).localeCompare(b.instante ?? b.fecha));
    return { eventos: filtrados.slice(0, 1000), limitado: filtrados.length > 1000 };
  }

  exportarDatos(): string {
    const d = this.leer(); const u = this.usuario(d); const ids = d.mascotas.filter(m => this.permiso(d, m, u)).map(m => m.id);
    return JSON.stringify({ formato: 'petcare-demo-exportacion', version: 1, exportado_en: ahora(), usuario: u, mascotas: d.mascotas.filter(m => ids.includes(m.id)), historial: d.historial.filter(r => ids.includes(r.mascota_id)), tratamientos: d.tratamientos.filter(t => ids.includes(t.mascota_id)), agenda: d.agenda.filter(a => ids.includes(a.mascota_id)), resoluciones: d.resoluciones.filter(r => d.tratamientos.some(t => t.id === r.tratamiento_id && ids.includes(t.mascota_id))), auditoria: d.auditoria.filter(a => d.mascotas.some(m => m.id === a.mascota_id && this.permiso(d, m, u) === 'propietario')) }, null, 2);
  }
  restablecer(): void { this.guardar(crearDatosDemo()); this.cerrar(); }
}
