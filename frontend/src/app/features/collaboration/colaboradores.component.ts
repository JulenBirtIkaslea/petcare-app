import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Campo, FormularioCamposComponent } from '../../shared/components/formulario-campos.component';
import { EstadoPaginaComponent } from '../../shared/components/estado-pagina.component';
import { SelectorMascotaComponent } from '../../shared/components/selector-mascota.component';
import { PaginaApi } from '../../shared/components/pagina-api';
import { Codigo, Colaborador, DatosFormulario, Permiso } from '../../shared/models/api';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';
import { FechaLocalizadaPipe } from '../../shared/pipes/fecha-localizada.pipe';

@Component({imports:[FormsModule,FormularioCamposComponent,EstadoPaginaComponent,SelectorMascotaComponent,TraducirPipe,FechaLocalizadaPipe],template:`
  <div class="titulo-pagina"><div><h1>{{ 'Colaboradores' | traducir }}</h1><p>{{ 'Comparte tus mascotas con propietarios o ayudantes de solo lectura.' | traducir }}</p></div></div>
  <app-estado [error]="error()" [aviso]="aviso()" [ocupado]="ocupado()" />
  <section class="panel bloque"><h2>{{ 'Introducir código' | traducir }}</h2><p>{{ 'Introduce el código que te ha dado el propietario para añadir la mascota a tu cuenta.' | traducir }}</p>
    <app-formulario [campos]="campoCodigo" [valores]="valoresCodigo" [ocupado]="ocupado()" etiquetaGuardar="Consultar invitación" (guardar)="consultar($event)" (cancelar)="cancelarInvitacion()" />
    @if(invitacion();as i){<div class="confirmacion"><h3>{{ i.nombre }}</h3><p>{{ 'Permiso' | traducir }}: {{ i.permiso | traducir }} · {{ 'Caduca' | traducir }}: {{ i.caduca_en | fechaLocalizada:'medium' }}</p>
      @if(i.permiso==='propietario'){<p>{{ 'Tendrás los mismos permisos que los demás propietarios, incluido compartir y editar el historial.' | traducir }}</p>}
      @else{<p>{{ 'Solo podrás consultar la ficha y sus cuidados.' | traducir }}</p>}
      <button class="boton primario" [disabled]="ocupado()" (click)="aceptar()">{{ 'Aceptar invitación' | traducir }}</button><button class="boton" [disabled]="ocupado()" (click)="cancelarInvitacion()">{{ 'Cancelar' | traducir }}</button>
    </div>}
  </section>
  <app-selector-mascota [ocupado]="ocupado()" (cambio)="cambiarMascota()" />
  @if(app.mascota();as m){
    @if(m.permiso==='propietario'){<section class="panel bloque"><h2>{{ 'Compartir mascota' | traducir }} · {{ m.nombre }}</h2><p>{{ 'El código es de un solo uso y caduca a los 20 minutos.' | traducir }}</p>
      <p class="ayuda">{{ 'Otro propietario tendrá los mismos permisos que tú. No podrás revocar su acceso.' | traducir }}</p>
      <app-formulario [campos]="camposCompartir" [valores]="valoresCompartir" [ocupado]="ocupado()" etiquetaGuardar="Generar código" (guardar)="generar($event)" (cancelar)="limpiarCompartir()" />
      @if(codigoGenerado()){<div class="codigo-panel" role="status"><code class="codigo-grande">{{ codigoGenerado() }}</code><button class="boton" (click)="copiar()">{{ 'Copiar código' | traducir }}</button></div>}
      @for(c of codigos();track c.id){<article class="actividad"><div class="actividad-texto"><strong>#{{ c.id }} · {{ c.permiso | traducir }}</strong><small>{{ 'Caduca' | traducir }}: {{ c.caduca_en | fechaLocalizada:'medium' }} · {{ estadoCodigo(c) | traducir }}</small></div>@if(estadoCodigo(c)==='Disponible'){<button class="boton pequeno" [disabled]="ocupado()" (click)="cancelarCodigo(c.id)">{{ 'Cancelar código' | traducir }}</button>}</article>}
    </section>}
    <section class="panel bloque"><h2>{{ 'Personas con acceso' | traducir }}</h2>
      @for(c of personas();track c.usuario_id){<article class="actividad"><div class="actividad-texto"><strong>{{ c.nombre }}</strong><small>{{ c.permiso | traducir }}</small></div>
        @if(m.permiso==='propietario'&&c.permiso==='ayudante'){<button class="boton pequeno peligro" [disabled]="ocupado()" (click)="revocando.set(c)">{{ 'Revocar' | traducir }}</button>}
      </article>}
      @if(m.permiso==='ayudante'){<button class="boton peligro bloque" (click)="revocando.set({usuario_id:app.usuario()!.id,nombre:app.usuario()!.nombre,permiso:'ayudante'})">{{ 'Abandonar colaboración' | traducir }}</button>}
    </section>
    @if(revocando();as c){<section class="panel confirmacion"><h2>{{ '¿Retirar el acceso?' | traducir }} {{ c.nombre }}</h2><p>{{ 'El acceso se revoca inmediatamente. Se conservan los registros y su autoría.' | traducir }}</p><button class="boton" (click)="revocando.set(null)">{{ 'Cancelar' | traducir }}</button><button class="boton peligro" [disabled]="ocupado()" (click)="revocar(c.usuario_id)">{{ 'Confirmar' | traducir }}</button></section>}
  }
`})
export class ColaboradoresComponent extends PaginaApi implements OnInit {
  readonly personas=signal<Colaborador[]>([]);readonly codigos=signal<Codigo[]>([]);readonly codigoGenerado=signal('');readonly revocando=signal<Colaborador|null>(null);
  readonly invitacion=signal<{nombre:string;permiso:Permiso;caduca_en:string}|null>(null);
  private codigoAceptado='';valoresCodigo:DatosFormulario={};valoresCompartir:DatosFormulario={permiso:'ayudante'};
  readonly campoCodigo:Campo[]=[{clave:'codigo',etiqueta:'Código para compartir',requerido:true,max:30}];
  readonly camposCompartir:Campo[]=[{clave:'permiso',etiqueta:'Permiso',tipo:'select',requerido:true,opciones:[{valor:'ayudante',etiqueta:'Ayudante: solo consultar'},{valor:'propietario',etiqueta:'Propietario: acceso completo'}]},{clave:'contrasena_actual',etiqueta:'Contraseña actual',tipo:'password',requerido:true}];
  ngOnInit(){void this.ejecutar(()=>this.cargar());}
  async cargar(){const m=this.app.mascota();this.personas.set([]);this.codigos.set([]);if(!m||!this.app.conectado())return;
    const [p,c]=await Promise.all([this.api.get<{propietario:Colaborador;colaboradores:Colaborador[]}>(`mascotas/${m.id}/colaboradores`),m.permiso==='propietario'?this.api.get<Codigo[]>(`mascotas/${m.id}/codigos`):Promise.resolve([])]);
    this.personas.set([p.propietario,...p.colaboradores]);this.codigos.set(c);
  }
  limpiarCompartir(){this.valoresCompartir={permiso:'ayudante'};this.codigoGenerado.set('');}
  cambiarMascota(){this.limpiarCompartir();this.revocando.set(null);void this.ejecutar(()=>this.cargar());}
  cancelarInvitacion(){this.invitacion.set(null);this.codigoAceptado='';this.valoresCodigo={};}
  consultar(d:DatosFormulario){this.invitacion.set(null);this.codigoAceptado='';void this.ejecutar(async()=>{const i=await this.api.enviar<{nombre:string;permiso:Permiso;caduca_en:string}>('POST','compartir/consultar',d);this.codigoAceptado=String(d['codigo']);this.invitacion.set(i);});}
  aceptar(){void this.ejecutar(async()=>{const r=await this.api.enviar<{mascota_id:number}>('POST','compartir/aceptar',{codigo:this.codigoAceptado});await this.app.recargarMascotas();this.app.mascotaSeleccionada.set(r.mascota_id);this.cancelarInvitacion();this.limpiarCompartir();await this.cargar();},'Mascota compartida añadida.');}
  generar(d:DatosFormulario){this.codigoGenerado.set('');void this.ejecutar(async()=>{try{const r=await this.api.enviar<{codigo:string}>('POST',`mascotas/${this.app.mascotaSeleccionada()}/codigos`,d);this.codigoGenerado.set(r.codigo);await this.cargar();}finally{this.valoresCompartir={permiso:d['permiso']};}});}
  cancelarCodigo(id:number){void this.ejecutar(async()=>{await this.api.enviar('DELETE',`mascotas/${this.app.mascotaSeleccionada()}/codigos/${id}`);this.codigoGenerado.set('');await this.cargar();},'Código cancelado.');}
  copiar(){void this.ejecutar(async()=>{await navigator.clipboard.writeText(this.codigoGenerado());},'Código copiado.');}
  estadoCodigo(c:Codigo){return c.usado_en?'Utilizado':c.cancelado_en?'Cancelado':new Date(c.caduca_en).getTime()<=Date.now()?'Caducado':'Disponible';}
  revocar(id:number){void this.ejecutar(async()=>{await this.api.enviar('DELETE',`mascotas/${this.app.mascotaSeleccionada()}/colaboradores/${id}`);this.revocando.set(null);await this.app.recargarMascotas();await this.cargar();},'Acceso retirado.');}
}
