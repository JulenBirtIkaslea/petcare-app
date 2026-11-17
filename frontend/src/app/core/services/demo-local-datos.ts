import { Auditoria, Codigo, Colaborador, Especie, MascotaApi, RegistroSanitario, Resolucion, Tratamiento, Usuario, fechaLocal } from '../../shared/models/api';

export interface CuentaLocal { usuario: Usuario; sal: string; hash: string; }
export interface AgendaLocal { id: number; mascota_id: number; tipo: 'citas' | 'tareas'; titulo: string; estado: string; fecha_hora_inicio?: string; fecha_hora_programada?: string; [campo: string]: unknown; }
export interface CodigoLocal extends Codigo { mascota_id: number; codigo: string; }
export interface ResolucionLocal extends Resolucion { tratamiento_id: number; version_tratamiento_id: number; fecha_hora_programada: string; }
export interface DatosDemo {
  version: 1; siguienteId: number; cuentas: CuentaLocal[]; mascotas: MascotaApi[];
  historial: RegistroSanitario[]; tratamientos: Tratamiento[]; agenda: AgendaLocal[];
  resoluciones: ResolucionLocal[]; codigos: CodigoLocal[];
  colaboradores: (Colaborador & { mascota_id: number })[];
  auditoria: (Auditoria & { mascota_id: number })[];
}
export const ESPECIES_DEMO: Especie[] = [
  { id: 1, nombre: 'Perro', codigo: 'perro' }, { id: 2, nombre: 'Gato', codigo: 'gato' },
  { id: 3, nombre: 'Conejo', codigo: 'conejo' }, { id: 4, nombre: 'Ave', codigo: 'ave' },
  { id: 5, nombre: 'Roedor', codigo: 'roedor' }, { id: 6, nombre: 'Reptil', codigo: 'reptil' },
  { id: 7, nombre: 'Otra', codigo: 'otra' },
];
export function mascotaVacia(id: number, propietario: number): MascotaApi {
  return { id, nombre: '', especie_id: 1, especie: ESPECIES_DEMO[0], otra_especie: null,
    propietario_id: propietario, permiso: 'propietario', numero_propietarios: 1, foto_url: null,
    raza: null, sexo: null, precision_nacimiento: 'desconocida', anio_nacimiento: null,
    mes_nacimiento: null, dia_nacimiento: null, peso_actual_kg: null, esterilizacion: 'desconocido',
    microchip: null, color_caracteristicas: null, observaciones: null, zona_horaria: 'Europe/Madrid', eliminado_en: null };
}
export function crearDatosDemo(): DatosDemo {
  const dia = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return fechaLocal(d); };
  const hora = (n: number, h: string) => new Date(`${dia(n)}T${h}:00`).toISOString();
  const luna = { ...mascotaVacia(1, 1), nombre: 'Luna', raza: 'Mestiza', sexo: 'hembra', peso_actual_kg: '18.5', esterilizacion: 'si', precision_nacimiento: 'anio', anio_nacimiento: new Date().getFullYear() - 4, observaciones: 'Datos de ejemplo. Le encantan los paseos tranquilos.' };
  const milo = { ...mascotaVacia(2, 1), nombre: 'Milo', especie_id: 2, especie: ESPECIES_DEMO[1], raza: 'Europeo', sexo: 'macho', peso_actual_kg: '4.2', observaciones: 'Datos de ejemplo. Llevar su manta en las visitas.' };
  const version = { id: 10, numero_version: 1, indicaciones: 'Ejemplo de cuidado: cepillado suave. Adaptar las pautas reales a las instrucciones del veterinario.', cantidad: null, unidad: null, fecha_inicio: dia(-2), fecha_fin: dia(14), tipo_frecuencia: 'diaria', horarios: ['19:00'], dias_semana: null, intervalo_horas: null, ancla_en: null, hora_inicio: null, zona_horaria: 'Europe/Madrid', vigor_desde_en: hora(-2, '00:00'), vigor_hasta_en: null, prescriptor: null, observaciones: 'Demostración', motivo_cambio: null };
  return { version: 1, siguienteId: 100, cuentas: [{ usuario: { id: 1, nombre: 'Usuario de prueba', correo: 'prueba', zona_horaria: 'Europe/Madrid' }, sal: '', hash: '' }],
    mascotas: [luna, milo], colaboradores: [], codigos: [], resoluciones: [], auditoria: [],
    historial: [
      { id: 3, mascota_id: 1, clase: 'consultas', titulo: 'Revisión anual de ejemplo', fecha: dia(-14), fecha_consulta: dia(-14), motivo: 'Revisión anual de ejemplo', diagnostico: 'Registro ficticio para explorar la ficha.', creado_por_id: 1, autor: 'Usuario de prueba', puede_editar: true },
      { id: 4, mascota_id: 1, clase: 'vacunas', titulo: 'Vacuna de ejemplo', nombre: 'Vacuna de ejemplo', fecha: dia(-180), fecha_administracion: dia(-180), proxima_dosis_fecha: dia(5), creado_por_id: 1, autor: 'Usuario de prueba', puede_editar: true },
      { id: 5, mascota_id: 2, clase: 'alergias', titulo: 'Sensibilidad de ejemplo', alergeno: 'Sensibilidad de ejemplo', gravedad: 'leve', fecha: dia(-30), fecha_deteccion: dia(-30), observaciones: 'Registro ficticio.', creado_por_id: 1, autor: 'Usuario de prueba', puede_editar: true },
    ], tratamientos: [{ id: 9, mascota_id: 1, nombre: 'Cepillado de Luna', tipo: 'cuidado', estado: 'en_curso', creado_por_id: 1, version_actual: version, versiones: [version] }],
    agenda: [
      { id: 6, mascota_id: 1, tipo: 'tareas', titulo: 'Paseo de la tarde', estado: 'pendiente', fecha_hora_programada: hora(0, '18:00'), descripcion: 'Paseo tranquilo y agua al volver.', responsable_id: 1 },
      { id: 7, mascota_id: 2, tipo: 'citas', titulo: 'Revisión de Milo', estado: 'programada', fecha_hora_inicio: hora(2, '10:30'), lugar: 'Clínica de ejemplo', descripcion: 'Cita ficticia para probar la agenda.' },
    ],
  };
}
