import { Component, inject, OnInit, signal } from '@angular/core';
import { ServicioDemoLocal } from '../../core/services/servicio-demo-local';
import { Campo, FormularioCamposComponent } from '../../shared/components/formulario-campos.component';
import { EstadoPaginaComponent } from '../../shared/components/estado-pagina.component';
import { PaginaApi } from '../../shared/components/pagina-api';
import { DatosFormulario, formularioDe, Usuario } from '../../shared/models/api';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';

@Component({imports:[FormularioCamposComponent,EstadoPaginaComponent,TraducirPipe],template:`
  <div class="titulo-pagina"><div><h1>{{ 'Mi cuenta' | traducir }}</h1><p>{{ 'Gestiona tu perfil y el acceso a tu cuenta.' | traducir }}</p></div></div><app-estado [error]="error()" [aviso]="aviso()" [ocupado]="ocupado()" />
  <div class="pestanas">@for (opcion of opciones;track opcion.clave){<button class="boton" [disabled]="ocupado()" [attr.aria-pressed]="seccion()===opcion.clave" [class.primario]="seccion()===opcion.clave" (click)="seleccionar(opcion.clave)">{{ opcion.titulo | traducir }}</button>}</div>
  <section class="panel formulario"><h2>{{ titulo | traducir }}</h2>
    @if(seccion()==='eliminar'){<p class="error">{{ 'Primero elimina tus mascotas de tu cuenta. Las que tengan otros propietarios se conservarán.' | traducir }}</p>}
    <app-formulario [campos]="campos" [valores]="valores" [ocupado]="ocupado()" (guardar)="guardar($event)" (cancelar)="seleccionar('perfil')" />
  </section>
  @if(app.demo){<section class="panel bloque gestion-demo"><h2>{{ 'Tus datos de prueba' | traducir }}</h2><p>{{ 'Se guardan en este navegador al recargar y al cerrar sesión. Exporta una copia antes de borrar los datos del navegador.' | traducir }}</p><div class="acciones-formulario"><button class="boton" [disabled]="ocupado()" (click)="exportar()">{{ 'Exportar mis datos (JSON)' | traducir }}</button><button class="boton peligro" [disabled]="ocupado()" (click)="confirmandoRestablecer.set(true)">{{ 'Restablecer demostración' | traducir }}</button></div>
    @if(confirmandoRestablecer()){<div class="confirmacion" role="alert"><h3>{{ '¿Restablecer los datos de prueba?' | traducir }}</h3><p>{{ 'Se borrarán todas las cuentas y cambios locales de este navegador y se recuperarán los ejemplos iniciales. Tu sesión se cerrará.' | traducir }}</p><div class="acciones-formulario"><button class="boton" [disabled]="ocupado()" (click)="confirmandoRestablecer.set(false)">{{ 'Cancelar' | traducir }}</button><button class="boton peligro" [disabled]="ocupado()" (click)="restablecer()">{{ 'Confirmar restablecimiento' | traducir }}</button></div></div>}
  </section>}
  <section class="panel bloque"><h2>{{ 'Sesión actual' | traducir }}</h2><p>{{ app.usuario()?.correo }}</p><button class="boton" [disabled]="ocupado()" (click)="cerrarSesion()">{{ 'Cerrar sesión' | traducir }}</button></section>
`})
export class CuentaComponent extends PaginaApi implements OnInit {
  private readonly demoLocal=inject(ServicioDemoLocal);
  readonly confirmandoRestablecer=signal(false);
  readonly seccion=signal('perfil');valores:DatosFormulario={};campos:Campo[]=[];titulo='';
  readonly opciones=[{clave:'perfil',titulo:'Perfil'},{clave:'contrasena',titulo:'Cambiar contraseña'},{clave:'eliminar',titulo:'Eliminar cuenta'}];
  ngOnInit(){this.seleccionar('perfil');}
  seleccionar(seccion:string){this.seccion.set(seccion);this.error.set('');this.titulo=this.opciones.find(o=>o.clave===seccion)!.titulo;this.valores=seccion==='perfil'&&this.app.usuario()?formularioDe(this.app.usuario()!):{};
    const actual:Campo={clave:'contrasena_actual',etiqueta:'Contraseña actual',tipo:'password',requerido:true};
    this.campos=seccion==='perfil'?[{clave:'nombre',etiqueta:'Nombre',requerido:true,max:100,autocomplete:'name'},{clave:'correo',etiqueta:this.app.demo?'Correo o usuario':'Correo electrónico',tipo:this.app.demo?'text':'email',requerido:true,max:254,autocomplete:'username'},{clave:'zona_horaria',etiqueta:'Zona horaria',requerido:true,ayuda:'Ejemplo: Europe/Madrid'},actual]:seccion==='contrasena'?[actual,{clave:'contrasena',etiqueta:'Nueva contraseña',tipo:'password',requerido:true,ayuda:'Al menos 10 caracteres, con letras y números.'},{clave:'contrasena_confirmation',etiqueta:'Repetir contraseña',tipo:'password',requerido:true}]:[actual];
  }
  cerrarSesion(){void this.ejecutar(()=>this.app.salir());}
  exportar(){void this.ejecutar(async()=>{
    const contenido=this.demoLocal.exportarDatos();
    const url=URL.createObjectURL(new Blob([contenido],{type:'application/json'}));
    const enlace=document.createElement('a');enlace.href=url;enlace.download='petcare-datos-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(enlace);enlace.click();enlace.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },'Copia de datos descargada.');}
  restablecer(){if(!this.confirmandoRestablecer())return;void this.ejecutar(async()=>{
    this.demoLocal.restablecer();this.app.limpiar();this.api.reiniciarCsrf();await this.router.navigate(['/acceso']);
  });}
  guardar(datos:DatosFormulario){void this.ejecutar(async()=>{
    if(this.seccion()==='perfil')this.app.usuario.set(await this.api.enviar<Usuario>('PATCH','yo',datos));
    if(this.seccion()==='contrasena')await this.api.enviar('POST','contrasena',datos);
    if(this.seccion()==='eliminar'){await this.api.enviar('DELETE','yo',datos);this.app.limpiar();await this.router.navigate(['/acceso']);}
    this.valores=this.seccion()==='perfil'?formularioDe(this.app.usuario()!):{};
  },'Cambios guardados.');}
}
