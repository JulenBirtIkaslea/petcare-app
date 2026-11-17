import { Campo } from '../../shared/components/formulario-campos.component';
import { DatosFormulario, Especie } from '../../shared/models/api';
export const opciones=(valores:string[])=>valores.map(valor=>({valor,etiqueta:valor}));
export function camposMascota(especies:Especie[]):Campo[]{return [
  {clave:'nombre',etiqueta:'Nombre',requerido:true,max:60},
  {clave:'especie_id',etiqueta:'Especie',tipo:'select',requerido:true,opciones:especies.map(e=>({valor:e.id,etiqueta:e.nombre}))},
  {clave:'otra_especie',etiqueta:'¿Qué especie es?',requerido:true,max:80,visible:d=>especies.find(e=>e.id===Number(d['especie_id']))?.codigo==='otra'},
  {clave:'raza',etiqueta:'Raza',max:100},{clave:'sexo',etiqueta:'Sexo',tipo:'select',opciones:opciones(['macho','hembra','desconocido'])},
  {clave:'precision_nacimiento',etiqueta:'Precisión del nacimiento',tipo:'select',requerido:true,opciones:opciones(['desconocida','anio','mes_anio','exacta'])},
  {clave:'anio_nacimiento',etiqueta:'Año de nacimiento',tipo:'number',requerido:true,min:1,max:9999,visible:d=>d['precision_nacimiento']!=='desconocida'},
  {clave:'mes_nacimiento',etiqueta:'Mes de nacimiento',tipo:'number',requerido:true,min:1,max:12,visible:d=>['mes_anio','exacta'].includes(String(d['precision_nacimiento']))},
  {clave:'dia_nacimiento',etiqueta:'Día de nacimiento',tipo:'number',requerido:true,min:1,max:31,visible:d=>d['precision_nacimiento']==='exacta'},
  {clave:'peso_actual_kg',etiqueta:'Peso actual (kg)',tipo:'number',min:0.001,paso:0.001,max:9999999},
  {clave:'esterilizacion',etiqueta:'Esterilización',tipo:'select',requerido:true,opciones:opciones(['si','no','desconocido'])},
  {clave:'microchip',etiqueta:'Microchip',max:30},{clave:'color_caracteristicas',etiqueta:'Color y características',max:150},
  {clave:'zona_horaria',etiqueta:'Zona horaria',requerido:true,ayuda:'Ejemplo: Europe/Madrid'},
  {clave:'observaciones',etiqueta:'Observaciones',tipo:'textarea',max:1000},
];}
export function normalizarMascota(datos:DatosFormulario):DatosFormulario{
  const d={...datos};const p=d['precision_nacimiento'];
  if(p==='desconocida')d['anio_nacimiento']=null;
  if(p==='desconocida'||p==='anio')d['mes_nacimiento']=null;
  if(p!=='exacta')d['dia_nacimiento']=null;
  return d;
}
