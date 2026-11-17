import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Campo, FormularioCamposComponent } from '../../shared/components/formulario-campos.component';
import { EstadoPaginaComponent } from '../../shared/components/estado-pagina.component';
import { PaginaApi } from '../../shared/components/pagina-api';
import { DatosFormulario, Usuario } from '../../shared/models/api';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';

@Component({imports:[FormularioCamposComponent,EstadoPaginaComponent,TraducirPipe],template:`
  <div class="titulo-pagina"><div><p class="sobrelinea">PETCARE</p><h1>{{ 'Tu cuenta, tus cuidados' | traducir }}</h1><p>{{ 'Accede a tus mascotas y a las que comparten contigo.' | traducir }}</p></div></div>
  <app-estado [error]="error()" [aviso]="aviso()" [ocupado]="ocupado()" />
  <div class="acceso-distribucion"><section class="panel formulario"><div class="pestanas" role="group" [attr.aria-label]="'Acceso a la cuenta' | traducir">
    <button class="boton" [disabled]="ocupado()" [attr.aria-pressed]="modo()==='inicio'" [class.primario]="modo()==='inicio'" (click)="cambiar('inicio')">{{ 'Iniciar sesión' | traducir }}</button>
    <button class="boton" [disabled]="ocupado()" [attr.aria-pressed]="modo()==='registro'" [class.primario]="modo()==='registro'" (click)="cambiar('registro')">{{ 'Crear cuenta' | traducir }}</button>
  </div><app-formulario [campos]="campos" [valores]="valores" [ocupado]="ocupado()" [mostrarCancelar]="false" [etiquetaGuardar]="modo()==='inicio'?'Entrar':'Crear cuenta'" (guardar)="guardar($event)" />
  @if(modo()==='registro'){<p class="ayuda">{{ 'No hay recuperación de contraseña. Guarda tus credenciales en un lugar seguro.' | traducir }}</p>}
  </section>
  @if(app.demo){<aside class="panel acceso-prueba"><span class="insignia">{{ 'Demostración local' | traducir }}</span><h2>{{ 'Empieza a explorar' | traducir }}</h2><p>{{ 'Prueba todas las secciones con mascotas y cuidados de ejemplo.' | traducir }}</p><dl class="credenciales-prueba"><div><dt>{{ 'Correo o usuario' | traducir }}</dt><dd>prueba</dd></div><div><dt>{{ 'Contraseña' | traducir }}</dt><dd>Birtlh123.</dd></div></dl><button class="boton" [disabled]="ocupado()" (click)="rellenarPrueba()">{{ 'Rellenar acceso de prueba' | traducir }}</button><p class="ayuda">{{ 'Las cuentas, los códigos y los cambios de esta demostración solo existen en este navegador.' | traducir }}</p></aside>}
  </div>
`})
export class AccesoComponent extends PaginaApi {
  private readonly ruta = inject(ActivatedRoute);
  readonly modo=signal<'inicio'|'registro'>('inicio'); valores:DatosFormulario={}; campos:Campo[]=[];
  constructor(){super();this.cambiar('inicio');}
  cambiar(modo:'inicio'|'registro'){
    this.modo.set(modo);this.error.set('');this.aviso.set('');this.valores={};
    this.campos=[...(modo==='registro'?[{clave:'nombre',etiqueta:'Nombre',requerido:true,max:100,autocomplete:'name'} as Campo]:[]),
      {clave:'correo',etiqueta:this.app.demo&&modo==='inicio'?'Correo o usuario':'Correo electrónico',tipo:this.app.demo&&modo==='inicio'?'text':'email',requerido:true,max:254,autocomplete:'username'},
      {clave:'contrasena',etiqueta:'Contraseña',tipo:'password',requerido:true,autocomplete:modo==='inicio'?'current-password':'new-password',ayuda:modo==='registro'?'Al menos 10 caracteres, con letras y números.':undefined},
      ...(modo==='registro'?[{clave:'contrasena_confirmation',etiqueta:'Repetir contraseña',tipo:'password',requerido:true,autocomplete:'new-password'} as Campo]:[]),
      ...(this.app.demo&&modo==='inicio'?[{clave:'recordar',etiqueta:'Mantener la sesión en este navegador',tipo:'checkbox',ayuda:'Actívalo solo en un dispositivo personal.'} as Campo]:[])];
  }
  rellenarPrueba(){this.cambiar('inicio');this.valores={correo:'prueba',contrasena:'Birtlh123.',recordar:false};}
  guardar(datos:DatosFormulario){void this.ejecutar(async()=>{
    const usuario=this.modo()==='inicio'?await this.api.enviar<Usuario>('POST','inicio-sesion',datos)
      :(await this.api.enviar<{usuario:Usuario}>('POST','registro',datos)).usuario;
    await this.app.sesion(usuario);
    const volver=this.ruta.snapshot.queryParamMap.get('volver');
    const destino=volver&&volver.startsWith('/')&&!volver.startsWith('//')&&!volver.includes('\\')&&!/^\/acceso(?:[/?#]|$)/.test(volver)?volver:'/inicio';
    await this.router.navigateByUrl(destino);
  });}
}
