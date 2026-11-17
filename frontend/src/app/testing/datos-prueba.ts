import { vi } from 'vitest';
import { Especie, MascotaApi, Usuario } from '../shared/models/api';

export const usuarioPrueba:Usuario={id:1,nombre:'Julen',correo:'julen@example.test',zona_horaria:'Europe/Madrid'};
export const especiesPrueba:Especie[]=[{id:1,codigo:'perro',nombre:'Perro'},{id:2,codigo:'gato',nombre:'Gato'}];
export function mascotaPrueba(cambios:Partial<MascotaApi>={}):MascotaApi{return {
  id:1,nombre:'Luna',especie_id:1,especie:especiesPrueba[0],otra_especie:null,propietario_id:1,
  permiso:'propietario',numero_propietarios:1,foto_url:null,raza:null,sexo:null,precision_nacimiento:'desconocida',
  anio_nacimiento:null,mes_nacimiento:null,dia_nacimiento:null,peso_actual_kg:null,esterilizacion:'desconocido',
  microchip:null,color_caracteristicas:null,observaciones:null,zona_horaria:'Europe/Madrid',eliminado_en:null,...cambios,
};}
export function apiPrueba(mascotas:MascotaApi[]=[mascotaPrueba()]){
  const get=vi.fn(async(ruta:string):Promise<unknown>=>{
    if(ruta==='estado')return {base_de_datos_habilitada:true};
    if(ruta==='yo')return usuarioPrueba;
    if(ruta==='mascotas')return mascotas;
    if(ruta==='especies')return especiesPrueba;
    if(/^mascotas\/\d+$/.test(ruta))return mascotas.find(m=>m.id===Number(ruta.split('/')[1]))??null;
    if(ruta.endsWith('/colaboradores'))return {propietario:{usuario_id:1,nombre:'Julen',permiso:'propietario'},colaboradores:[]};
    if(ruta.startsWith('calendario'))return {eventos:[],limitado:false};
    return [];
  });
  return {get,enviar:vi.fn(async(..._args:unknown[]):Promise<unknown>=>undefined),reiniciarCsrf:vi.fn(),mascotas};
}
