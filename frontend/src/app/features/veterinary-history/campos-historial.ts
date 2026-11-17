import { Campo } from '../../shared/components/formulario-campos.component';
import { opciones } from '../pets/campos-mascota';
export const tiposHistorial=[{valor:'consultas',etiqueta:'Consultas'},{valor:'vacunas',etiqueta:'Vacunas'},{valor:'desparasitaciones',etiqueta:'Desparasitaciones'},{valor:'alergias',etiqueta:'Alergias'}];
export function camposHistorial(tipo:string):Campo[]{
  const comunes:Campo[]=[{clave:'observaciones',etiqueta:'Observaciones',tipo:'textarea'}];
  const clinica:Campo={clave:'clinica_veterinario',etiqueta:'Clínica o veterinario',max:200};
  switch(tipo){
    case 'consultas':return [{clave:'fecha_consulta',etiqueta:'Fecha de consulta',tipo:'date',requerido:true},{clave:'motivo',etiqueta:'Motivo de consulta',requerido:true,max:500},clinica,{clave:'diagnostico',etiqueta:'Diagnóstico',tipo:'textarea'},{clave:'recomendaciones',etiqueta:'Recomendaciones',tipo:'textarea'},...comunes];
    case 'vacunas':return [{clave:'nombre',etiqueta:'Nombre de la vacuna',requerido:true,max:150},{clave:'fecha_administracion',etiqueta:'Fecha de administración',tipo:'date',requerido:true},{clave:'proxima_dosis_fecha',etiqueta:'Próxima dosis',tipo:'date'},clinica,{clave:'numero_lote',etiqueta:'Número de lote',max:100},...comunes];
    case 'desparasitaciones':return [{clave:'producto',etiqueta:'Producto',requerido:true,max:150},{clave:'fecha_aplicacion',etiqueta:'Fecha de aplicación',tipo:'date',requerido:true},{clave:'tipo',etiqueta:'Tipo',tipo:'select',requerido:true,opciones:opciones(['interna','externa','ambas'])},{clave:'proxima_aplicacion_fecha',etiqueta:'Próxima aplicación',tipo:'date'},...comunes];
    default:return [{clave:'alergeno',etiqueta:'Alérgeno',requerido:true,max:150},{clave:'tipo',etiqueta:'Tipo de alergia',max:100},{clave:'sintomas',etiqueta:'Síntomas',tipo:'textarea'},{clave:'gravedad',etiqueta:'Gravedad',tipo:'select',opciones:opciones(['leve','moderada','grave'])},{clave:'fecha_deteccion',etiqueta:'Fecha de detección',tipo:'date'},...comunes];
  }
}
