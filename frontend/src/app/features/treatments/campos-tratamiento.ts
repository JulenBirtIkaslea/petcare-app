import { Campo } from '../../shared/components/formulario-campos.component';
import { opciones } from '../pets/campos-mascota';
export function camposTratamiento(edicion:boolean):Campo[]{return [
  {clave:'nombre',etiqueta:'Nombre del tratamiento',requerido:true,max:150},
  ...(!edicion?[{clave:'tipo',etiqueta:'Tipo',tipo:'select',requerido:true,opciones:opciones(['medicamento','cuidado'])} as Campo]:[]),
  {clave:'indicaciones',etiqueta:'Indicaciones',tipo:'textarea',requerido:true},
  {clave:'cantidad',etiqueta:'Cantidad por dosis',tipo:'number',min:0.001,paso:0.001,ayuda:'Obligatoria para medicamentos.'},
  {clave:'unidad',etiqueta:'Unidad',max:50},{clave:'fecha_inicio',etiqueta:'Fecha de inicio',tipo:'date',requerido:true},{clave:'fecha_fin',etiqueta:'Fecha de fin (opcional)',tipo:'date'},
  {clave:'tipo_frecuencia',etiqueta:'Frecuencia',tipo:'select',requerido:true,opciones:opciones(['diaria','cada_horas','dias_semana','unica'])},
  {clave:'intervalo_horas',etiqueta:'Intervalo en horas',tipo:'number',requerido:true,min:1,max:720,visible:d=>d['tipo_frecuencia']==='cada_horas'},
  {clave:'hora_inicio',etiqueta:'Hora inicial del intervalo',tipo:'time',requerido:true,visible:d=>d['tipo_frecuencia']==='cada_horas'},
  {clave:'dias_semana',etiqueta:'Días de la semana',tipo:'dias',visible:d=>d['tipo_frecuencia']==='dias_semana'},
  {clave:'horarios',etiqueta:'Horarios',tipo:'horarios',visible:d=>d['tipo_frecuencia']!=='cada_horas'},
  {clave:'prescriptor',etiqueta:'Profesional que indicó la pauta',max:200},{clave:'observaciones',etiqueta:'Observaciones',tipo:'textarea'},
  ...(edicion?[{clave:'motivo_cambio',etiqueta:'Motivo del cambio de pauta',tipo:'textarea',requerido:true,max:1000} as Campo]:[]),
];}
export const camposDosis:Campo[]=[
  {clave:'estado',etiqueta:'Resultado',tipo:'select',requerido:true,opciones:opciones(['administrada','omitida'])},
  {clave:'fecha_hora_real',etiqueta:'Fecha y hora real',tipo:'datetime-local',requerido:true,visible:d=>d['estado']==='administrada'},
  {clave:'cantidad_real',etiqueta:'Cantidad real',tipo:'number',min:0.001,paso:0.001,visible:d=>d['estado']==='administrada'},
  {clave:'unidad_real',etiqueta:'Unidad',max:50,visible:d=>d['estado']==='administrada'},
  {clave:'realizado_por_nombre',etiqueta:'Otra persona que lo realizó (opcional)',max:100,visible:d=>d['estado']==='administrada',ayuda:'Déjalo vacío si lo has realizado tú.'},
  {clave:'motivo_omision',etiqueta:'Motivo de omisión (opcional)',tipo:'textarea',max:1000,visible:d=>d['estado']==='omitida'},
  {clave:'observaciones',etiqueta:'Observaciones',tipo:'textarea'},
];
