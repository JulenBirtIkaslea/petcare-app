import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Campo, FormularioCamposComponent } from '../../shared/components/formulario-campos.component';
import { EstadoPaginaComponent } from '../../shared/components/estado-pagina.component';
import { SelectorMascotaComponent } from '../../shared/components/selector-mascota.component';
import { PaginaApi } from '../../shared/components/pagina-api';
import { DatosFormulario, fechaLocal, formularioDe, RegistroSanitario } from '../../shared/models/api';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';
import { camposHistorial, tiposHistorial } from './campos-historial';
@Component({imports:[FormsModule,FormularioCamposComponent,EstadoPaginaComponent,SelectorMascotaComponent,TraducirPipe],template:`
  <div class="titulo-pagina"><div><h1>{{ 'Historial veterinario' | traducir }}</h1><p>{{ 'Consultas, vacunas, desparasitaciones y alergias en una misma historia.' | traducir }}</p></div></div>
  <app-selector-mascota [ocupado]="ocupado()" (cambio)="cambiarMascota()" /><app-estado [error]="error()" [aviso]="aviso()" [ocupado]="ocupado()" />
  @if(app.mascota()){<div class="filtros"><label>{{ 'Tipo de registro' | traducir }}<select [ngModel]="filtro()" (ngModelChange)="filtro.set($event)"><option value="">{{ 'Todos' | traducir }}</option>@for(t of tipos;track t.valor){<option [value]="t.valor">{{ t.etiqueta | traducir }}</option>}</select></label>@if(app.mascota()!.permiso==='propietario'){<div class="pestanas">@for(t of tipos;track t.valor){<button class="boton" (click)="nuevo(t.valor)">+ {{ t.etiqueta | traducir }}</button>}</div>}</div>}
  @if(editando()){<section class="panel bloque" id="formulario-historial"><h2>{{ (siguienteId?'Registrar siguiente administración':registroId?'Corregir registro':'Nuevo registro') | traducir }}</h2><app-formulario [campos]="campos" [valores]="valores" [ocupado]="ocupado()" (guardar)="guardar($event)" (cancelar)="editando.set(false)" /></section>}
  @if(borrando()){<section class="panel confirmacion"><h2>{{ 'Eliminar registro' | traducir }}</h2><p>{{ 'El registro se ocultará y la corrección quedará auditada.' | traducir }}</p><app-formulario [campos]="campoMotivo" [valores]="motivoVacio" [ocupado]="ocupado()" etiquetaGuardar="Eliminar" (guardar)="eliminar($event)" (cancelar)="borrando.set(null)" /></section>}
  <section class="panel bloque">@for(r of filtrados();track r.clase+':'+r.id){<article class="registro-historial"><div class="titulo-seccion"><div><span class="insignia">{{ etiqueta(r.clase) | traducir }}</span><h2>{{ r.titulo }}</h2><small>{{ r.fecha || ('Sin fecha' | traducir) }} · {{ r.autor }}</small></div><div class="pestanas">@if(r.puede_editar){<button class="boton pequeno" (click)="editar(r)">{{ 'Corregir' | traducir }}</button><button class="boton pequeno peligro" (click)="borrando.set(r)">{{ 'Eliminar' | traducir }}</button>}@if(puedeSiguiente(r)){<button class="boton pequeno" (click)="siguiente(r)">{{ 'Registrar administración' | traducir }}</button>}</div></div><dl class="ficha">@for(c of detalles(r);track c.clave){<div><dt>{{ c.etiqueta | traducir }}</dt><dd class="texto-libre">{{ valor(r,c.clave) }}</dd></div>}</dl></article>}@empty{<p class="vacio">{{ 'No hay registros para este filtro.' | traducir }}</p>}</section>
`})
export class HistorialComponent extends PaginaApi implements OnInit{
  private readonly ruta=inject(ActivatedRoute);readonly registros=signal<RegistroSanitario[]>([]);readonly filtro=signal('');readonly filtrados=computed(()=>this.registros().filter(r=>!this.filtro()||r.clase===this.filtro()));
  readonly editando=signal(false);readonly borrando=signal<RegistroSanitario|null>(null);readonly tipos=tiposHistorial;tipo='consultas';registroId=0;siguienteId=0;campos:Campo[]=[];valores:DatosFormulario={};readonly motivoVacio={};
  readonly campoMotivo:Campo[]=[{clave:'motivo_correccion',etiqueta:'Motivo de la corrección',tipo:'textarea',requerido:true,max:1000}];
  ngOnInit(){const p=this.ruta.snapshot.queryParamMap;if(p.has('mascota'))this.app.mascotaSeleccionada.set(Number(p.get('mascota')));void this.ejecutar(async()=>{await this.cargar();const r=this.registros().find(r=>r.id===Number(p.get('siguiente'))&&r.clase===p.get('tipo'));if(r)this.siguiente(r);});}
  async cargar(){this.registros.set(this.app.conectado()&&this.app.mascotaSeleccionada()?await this.api.get<RegistroSanitario[]>(`mascotas/${this.app.mascotaSeleccionada()}/historial`):[]);}
  cambiarMascota(){this.editando.set(false);this.borrando.set(null);void this.ejecutar(()=>this.cargar());}
  etiqueta(tipo:string){return this.tipos.find(t=>t.valor===tipo)?.etiqueta??tipo;}
  nuevo(tipo:string){this.tipo=tipo;this.registroId=0;this.siguienteId=0;this.campos=camposHistorial(tipo);this.valores={fecha_consulta:fechaLocal(),fecha_administracion:fechaLocal(),fecha_aplicacion:fechaLocal()};this.editando.set(true);this.error.set('');}
  editar(r:RegistroSanitario){this.nuevo(r.clase);this.registroId=r.id;this.valores=formularioDe(r);this.campos=[...this.campos,...this.campoMotivo];}
  siguiente(r:RegistroSanitario){this.nuevo(r.clase);this.siguienteId=r.id;this.valores={...formularioDe(r),fecha_administracion:fechaLocal(),fecha_aplicacion:fechaLocal(),proxima_dosis_fecha:null,proxima_aplicacion_fecha:null};}
  puedeSiguiente(r:RegistroSanitario){return this.app.mascota()?.permiso==='propietario'&&['vacunas','desparasitaciones'].includes(r.clase)&&!r.prevision_atendida_en&&Boolean(r['proxima_dosis_fecha']||r['proxima_aplicacion_fecha']);}
  detalles(r:RegistroSanitario){return camposHistorial(r.clase).filter(c=>r[c.clave]!==null&&r[c.clave]!==undefined&&r[c.clave]!=='');}valor(r:RegistroSanitario,c:string){return String(r[c]??'');}
  guardar(d:DatosFormulario){void this.ejecutar(async()=>{let ruta=`mascotas/${this.app.mascotaSeleccionada()}/historial/${this.tipo}`;if(this.siguienteId)ruta+=`/${this.siguienteId}/siguiente`;else if(this.registroId)ruta+=`/${this.registroId}`;await this.api.enviar(this.registroId?'PATCH':'POST',ruta,d);this.editando.set(false);await this.cargar();},'Registro guardado.');}
  eliminar(d:DatosFormulario){const r=this.borrando()!;void this.ejecutar(async()=>{await this.api.enviar('DELETE',`mascotas/${this.app.mascotaSeleccionada()}/historial/${r.clase}/${r.id}`,d);this.borrando.set(null);await this.cargar();},'Registro eliminado.');}
}
