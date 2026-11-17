import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { Campo, FormularioCamposComponent } from '../../shared/components/formulario-campos.component';
import { EstadoPaginaComponent } from '../../shared/components/estado-pagina.component';
import { PaginaApi } from '../../shared/components/pagina-api';
import { Auditoria, DatosFormulario, formularioDe, MascotaApi } from '../../shared/models/api';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';
import { FechaLocalizadaPipe } from '../../shared/pipes/fecha-localizada.pipe';
import { camposMascota, normalizarMascota } from './campos-mascota';
@Component({imports:[RouterLink,JsonPipe,FormularioCamposComponent,EstadoPaginaComponent,TraducirPipe,FechaLocalizadaPipe],template:`
  <a class="volver" routerLink="/mascotas">{{ '← Mis mascotas' | traducir }}</a><app-estado [error]="error()" [aviso]="aviso()" [ocupado]="ocupado()" />
  @if(mascota();as m){<div class="titulo-pagina"><div><p class="sobrelinea">{{ 'FICHA DE MASCOTA' | traducir }}</p><h1>{{ m.nombre }}</h1><p>{{ (m.otra_especie||m.especie.nombre) | traducir }} · {{ m.permiso | traducir }}</p></div>@if(m.permiso==='propietario'){<button class="boton" (click)="editar()">{{ 'Editar ficha' | traducir }}</button>}</div>
    @if(editando()){<section class="panel"><app-formulario [campos]="campos" [valores]="valores" [ocupado]="ocupado()" (guardar)="guardar($event)" (cancelar)="editando.set(false)" /></section>}
    @else{<div class="rejilla-panel"><section class="panel"><div class="retrato detalle">@if(m.foto_url){<img [src]="m.foto_url" [alt]="m.nombre">}@else{<span aria-hidden="true">🐾</span>}</div>
      @if(m.permiso==='propietario'){<label class="boton cargar-foto">{{ 'Cambiar fotografía' | traducir }}<input type="file" accept="image/jpeg,image/png,image/webp" [disabled]="ocupado()" (change)="foto($event)"></label>@if(m.foto_url){<button class="boton" (click)="quitarFoto()" [disabled]="ocupado()">{{ 'Quitar fotografía' | traducir }}</button>}<small>JPG / PNG / WebP · 5 MB</small>}
      <dl class="ficha">@for(c of ficha;track c.clave){<div><dt>{{ c.etiqueta | traducir }}</dt><dd>{{ valor(c.clave) | traducir }}</dd></div>}</dl>
    </section><section class="panel"><h2>{{ 'Sus cuidados' | traducir }}</h2><div class="enlaces-modulo"><a class="boton" routerLink="/historial">{{ 'Historial veterinario' | traducir }}</a><a class="boton" routerLink="/tratamientos">{{ 'Tratamientos' | traducir }}</a><a class="boton" routerLink="/calendario">{{ 'Calendario' | traducir }}</a><a class="boton" routerLink="/colaboradores">{{ 'Colaboradores' | traducir }}</a></div><h3>{{ 'Observaciones' | traducir }}</h3><p class="texto-libre">{{ m.observaciones || ('Sin especificar' | traducir) }}</p>
      @if(m.permiso==='propietario'){<button class="boton peligro" (click)="confirmarBorrado.set(true)">{{ (m.numero_propietarios>1?'Eliminar de mi cuenta':'Eliminar mascota') | traducir }}</button>}
    </section></div>}
    @if(confirmarBorrado()){<section class="panel confirmacion"><h2>{{ (m.numero_propietarios>1?'¿Eliminar de tu cuenta?':'¿Eliminar definitivamente esta mascota?') | traducir }}</h2>
      <p>{{ (m.numero_propietarios>1?'Perderás tu acceso. Los demás propietarios y ayudantes conservarán la mascota y su historial.':'Eres el último propietario. Se eliminarán definitivamente la mascota, su historial y el acceso de todos los ayudantes. Esta acción no se puede deshacer.') | traducir }}</p>
      <app-formulario [campos]="camposBorrado" [valores]="valoresBorrado" [ocupado]="ocupado()" etiquetaGuardar="Confirmar eliminación" (guardar)="eliminar($event)" (cancelar)="confirmarBorrado.set(false);valoresBorrado={}" />
    </section>}
    @if(m.permiso==='propietario'){<section class="panel bloque"><h2>{{ 'Auditoría de cambios' | traducir }}</h2><button class="boton" (click)="verAuditoria(1)">{{ 'Consultar auditoría' | traducir }}</button>@for(a of auditoria();track a.id){<details class="registro-auditoria"><summary>{{ a.ocurrido_en | fechaLocalizada:'medium' }} · {{ a.accion | traducir }} · {{ a.autor }}</summary><p>{{ a.entidad_tipo }} #{{ a.entidad_id }} · {{ a.motivo }}</p><strong>{{ 'Antes' | traducir }}</strong><pre>{{ a.valores_anteriores | json }}</pre><strong>{{ 'Después' | traducir }}</strong><pre>{{ a.valores_nuevos | json }}</pre></details>}@if(paginas>1){<div class="pestanas"><button class="boton" [disabled]="pagina===1" (click)="verAuditoria(pagina-1)">{{ 'Anterior' | traducir }}</button><span>{{ pagina }} / {{ paginas }}</span><button class="boton" [disabled]="pagina===paginas" (click)="verAuditoria(pagina+1)">{{ 'Siguiente' | traducir }}</button></div>}</section>}
  }@else if(!ocupado()){<section class="panel vacio"><h1>{{ 'Mascota no encontrada' | traducir }}</h1><a routerLink="/mascotas">{{ 'Volver a mis mascotas' | traducir }}</a></section>}
`})
export class DetalleMascotaComponent extends PaginaApi implements OnInit{
  private readonly ruta=inject(ActivatedRoute);readonly mascota=signal<MascotaApi|null>(null);readonly editando=signal(false);readonly confirmarBorrado=signal(false);readonly auditoria=signal<Auditoria[]>([]);valores:DatosFormulario={};pagina=1;paginas=1;
  readonly ficha=[{clave:'raza',etiqueta:'Raza'},{clave:'sexo',etiqueta:'Sexo'},{clave:'nacimiento',etiqueta:'Nacimiento'},{clave:'peso_actual_kg',etiqueta:'Peso actual (kg)'},{clave:'esterilizacion',etiqueta:'Esterilización'},{clave:'microchip',etiqueta:'Microchip'},{clave:'color_caracteristicas',etiqueta:'Color y características'},{clave:'zona_horaria',etiqueta:'Zona horaria'}];
  valoresBorrado:DatosFormulario={};readonly camposBorrado:Campo[]=[{clave:'contrasena_actual',etiqueta:'Contraseña actual',tipo:'password',requerido:true}];
  get campos(){return camposMascota(this.app.especies());}
  ngOnInit(){if(this.app.conectado())void this.ejecutar(async()=>{const m=await this.api.get<MascotaApi>(`mascotas/${this.ruta.snapshot.paramMap.get('id')}`);this.mascota.set(m);this.app.mascotaSeleccionada.set(m.id);});}
  valor(clave:string){const m=this.mascota()!;if(clave==='nacimiento')return m.anio_nacimiento?[m.dia_nacimiento,m.mes_nacimiento,m.anio_nacimiento].filter(v=>v!==null).join('/'):'Desconocido';return String((m as unknown as Record<string,unknown>)[clave]??'Sin especificar');}
  editar(){this.valores=formularioDe(this.mascota()!);this.editando.set(true);}
  guardar(datos:DatosFormulario){void this.ejecutar(async()=>{this.mascota.set(await this.api.enviar<MascotaApi>('PATCH',`mascotas/${this.mascota()!.id}`,normalizarMascota(datos)));await this.app.recargarMascotas();this.editando.set(false);},'Cambios guardados.');}
  foto(evento:Event){const archivo=(evento.target as HTMLInputElement).files?.[0];if(!archivo)return;void this.ejecutar(async()=>{if(archivo.size>5*1024*1024){this.error.set('La fotografía no puede superar 5 MB.');return;}const datos=new FormData();datos.append('fotografia',archivo);this.mascota.set(await this.api.enviar<MascotaApi>('POST',`mascotas/${this.mascota()!.id}/fotografia`,datos));await this.app.recargarMascotas();});}
  quitarFoto(){void this.ejecutar(async()=>{await this.api.enviar('DELETE',`mascotas/${this.mascota()!.id}/fotografia`);this.mascota.update(m=>({...m!,foto_url:null}));await this.app.recargarMascotas();});}
  eliminar(datos:DatosFormulario){void this.ejecutar(async()=>{try{await this.api.enviar('DELETE',`mascotas/${this.mascota()!.id}`,datos);await this.app.recargarMascotas();await this.router.navigate(['/mascotas']);}finally{this.valoresBorrado={};}});}
  verAuditoria(pagina:number){void this.ejecutar(async()=>{const a=await this.api.get<{data:Auditoria[];last_page:number}>(`mascotas/${this.mascota()!.id}/auditoria?page=${pagina}`);this.auditoria.set(a.data);this.pagina=pagina;this.paginas=a.last_page;});}
}
