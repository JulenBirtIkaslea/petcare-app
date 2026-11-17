export interface Usuario { id: number; nombre: string; correo: string; zona_horaria: string; }
export interface Especie { id: number; nombre: string; codigo: string; }
export type Permiso = 'propietario' | 'ayudante';
export interface MascotaApi {
  id: number; nombre: string; especie_id: number; especie: Especie; otra_especie: string | null;
  propietario_id: number; permiso: Permiso; numero_propietarios: number; foto_url: string | null;
  raza: string | null; sexo: string | null; precision_nacimiento: string;
  anio_nacimiento: number | null; mes_nacimiento: number | null; dia_nacimiento: number | null;
  peso_actual_kg: string | null; esterilizacion: string; microchip: string | null;
  color_caracteristicas: string | null; observaciones: string | null; zona_horaria: string;
  eliminado_en: string | null; restaurable?: boolean;
}
export type ValorCampo = string | number | boolean | null | (string | number)[];
export type DatosFormulario = Record<string, ValorCampo>;
export interface RegistroSanitario {
  id: number; mascota_id: number; clase: string; titulo: string; fecha: string | null;
  creado_por_id: number; autor: string; puede_editar: boolean; prevision_atendida_en?: string | null;
  [campo: string]: unknown;
}
export interface VersionTratamiento {
  id: number; numero_version: number; indicaciones: string; cantidad: string | null; unidad: string | null;
  fecha_inicio: string; fecha_fin: string | null; tipo_frecuencia: string;
  horarios: string[] | null; dias_semana: number[] | null; intervalo_horas: number | null;
  ancla_en: string | null; hora_inicio: string | null; zona_horaria: string; vigor_desde_en: string; vigor_hasta_en: string | null;
  prescriptor: string | null; observaciones: string | null; motivo_cambio: string | null;
}
export interface Tratamiento {
  id: number; mascota_id: number; nombre: string; tipo: string; estado: string; creado_por_id: number;
  version_actual: VersionTratamiento; versiones: VersionTratamiento[];
}
export interface Resolucion {
  id: number; registrado_por_id: number; estado: string; fecha_hora_real: string | null;
  cantidad_real: string | null; unidad_real: string | null; realizado_por_nombre: string | null;
  realizado_por_usuario_id: number | null; observaciones: string | null; motivo_omision: string | null;
}
export interface Dosis {
  tratamiento_id: number; version_tratamiento_id: number; dosis_clave: string;
  fecha_hora_programada: string; estado: string; nombre: string; cantidad: string | null;
  unidad: string | null; resolucion: Resolucion | null; cancelado: boolean;
}
export interface Evento {
  clave: string; id: number; mascota_id: number; mascota_nombre: string; titulo: string;
  tipo: 'cita' | 'tarea' | 'vacuna' | 'desparasitacion' | 'dosis'; fecha: string; instante: string | null;
  estado: string; puede_editar: boolean; puede_resolver: boolean;
  datos: Record<string, unknown>;
}
export interface Colaborador { usuario_id: number; nombre: string; permiso: Permiso; }
export interface Codigo { id: number; permiso: Permiso; caduca_en: string; usado_en: string | null; cancelado_en: string | null; }
export interface Transferencia { id: number; propietario_origen_id: number; propietario_destino_id: number; destinatario: string; }
export interface Auditoria { id: number; entidad_tipo: string; entidad_id: number; accion: string; autor: string; motivo: string | null; ocurrido_en: string; valores_anteriores: unknown; valores_nuevos: unknown; }

export function formularioDe(valor: object): DatosFormulario {
  return Object.fromEntries(Object.entries(valor).filter(([, v]) => v === null || ['string', 'number', 'boolean'].includes(typeof v) || Array.isArray(v))) as DatosFormulario;
}
export function fechaLocal(fecha = new Date()): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}
export function instanteLocal(valor: string | null = null): string {
  const fecha = valor ? new Date(valor) : new Date();
  return `${fechaLocal(fecha)}T${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}
export function instanteUtc(valor: ValorCampo): string | null {
  return valor ? new Date(String(valor)).toISOString() : null;
}
