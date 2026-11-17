import { TraducirPipe } from '../shared/pipes/traducir.pipe';
import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { ServicioIdioma } from '../core/services/servicio-idioma';
import { PaginaApi } from '../shared/components/pagina-api';
import { EstadoPaginaComponent } from '../shared/components/estado-pagina.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-estructura',
  imports: [TraducirPipe, RouterLink, RouterLinkActive, RouterOutlet, EstadoPaginaComponent],
  template: `
    <a class="salto" href="#contenido">{{ 'Saltar al contenido' | traducir }}</a>
    <aside class="barra" [class.menu-abierto]="menuAbierto()" (keydown.escape)="cerrarMenu(true)">
      <a class="marca" routerLink="/inicio"
        ><span class="simbolo">✣</span> PetCare<span class="punto">.</span></a
      >
      <button #botonMenu type="button" class="boton menu-movil" aria-controls="navegacion-principal" [attr.aria-expanded]="menuAbierto()" (click)="menuAbierto.set(!menuAbierto())">{{ (menuAbierto()?'Cerrar menú':'Menú') | traducir }} <span aria-hidden="true">{{ menuAbierto()?'×':'☰' }}</span></button>
      <p class="etiqueta-nav">{{ 'ESPACIO DE CUIDADOS' | traducir }}</p>
      <nav id="navegacion-principal" [attr.aria-label]="'Navegación principal' | traducir">
        @if(app.usuario()){@for (enlace of enlaces; track enlace.ruta) {
          <a
            [routerLink]="enlace.ruta"
            (click)="cerrarMenu()"
            routerLinkActive="seleccionado"
            ariaCurrentWhenActive="page"
          >
            <span aria-hidden="true" class="icono-nav">{{ enlace.icono }}</span
            >{{ enlace.nombre | traducir }}
          </a>
        }}@else{<a routerLink="/acceso" routerLinkActive="seleccionado" ariaCurrentWhenActive="page"><span aria-hidden="true" class="icono-nav">♧</span>{{ 'Iniciar sesión' | traducir }}</a>}
      </nav>
      <div class="selector-idioma">
        <label for="idioma">{{ 'Idioma' | traducir }}</label>
        <select
          id="idioma"
          #selector
          [value]="idiomas.idioma()"
          (change)="idiomas.cambiar(selector.value)"
        >
          <option value="es" lang="es">Castellano</option>
          <option value="eu" lang="eu">Euskara</option>
        </select>
      </div>
      <div class="perfil">
        <span class="avatar" aria-hidden="true">{{ iniciales }}</span>
        <div>
          @if(app.usuario()){<a class="nombre-perfil" routerLink="/cuenta">{{ app.usuario()?.nombre }}</a>}@else{<strong>{{ 'Mi espacio' | traducir }}</strong>}
          @if(app.usuario()){<button class="enlace-boton" [disabled]="ocupado()" (click)="salir()">{{ 'Cerrar sesión' | traducir }}</button>}
          @else{<a routerLink="/acceso">{{ 'Iniciar sesión' | traducir }}</a>}
        </div>
      </div>
    </aside>
    <div class="zona-principal">
      <header class="cabecera">
        <span>{{ 'Un hogar para sus cuidados' | traducir }}</span
        ><span class="insignia">{{ (app.conectado()?'Sesión iniciada':'PetCare') | traducir }}</span>
      </header>
      @if(app.demo){<div class="aviso-demo" role="status"><strong>{{ 'Demostración local' | traducir }}</strong> · {{ 'Los cambios se guardan solo en este navegador.' | traducir }} @if(app.usuario()){<a routerLink="/cuenta">{{ 'Gestionar mis datos' | traducir }}</a>}</div>}
      @if(app.estado()==='pendiente'||app.estado()==='sin_conexion'){
        <div class="aviso-demo" role="status">{{ (app.estado()==='pendiente'?'La base de datos está pendiente. Puedes explorar las pantallas, pero los cambios requieren conexión.':'No se puede conectar con la API. Comprueba que Laravel está arrancado.') | traducir }} <button class="enlace-boton" (click)="reintentar()">{{ 'Reintentar conexión' | traducir }}</button></div>
      }
      <app-estado [error]="error()" />
      <main id="contenido" tabindex="-1"><router-outlet /></main>
      <footer>{{ 'PetCare · Cuidar es mejor en compañía' | traducir }}</footer>
    </div>
  `,
})
export class EstructuraComponent extends PaginaApi implements OnInit {
  readonly menuAbierto = signal(false);
  private readonly botonMenu = viewChild<ElementRef<HTMLButtonElement>>('botonMenu');
  cerrarMenu(devolverFoco = false){this.menuAbierto.set(false);if(devolverFoco)this.botonMenu()?.nativeElement.focus();}
  readonly idiomas = inject(ServicioIdioma);
  readonly enlaces = [
    { ruta: '/inicio', nombre: 'Panel de inicio', icono: '⌂' },
    { ruta: '/mascotas', nombre: 'Mis mascotas', icono: '♧' },
    { ruta: '/historial', nombre: 'Historial veterinario', icono: '▤' },
    { ruta: '/tratamientos', nombre: 'Tratamientos', icono: '⊕' },
    { ruta: '/calendario', nombre: 'Calendario', icono: '▦' },
    { ruta: '/colaboradores', nombre: 'Colaboradores', icono: '♧' },
    { ruta: '/cuenta', nombre: 'Mi cuenta', icono: '⚙' },
    { ruta: '/ayuda', nombre: 'Ayuda', icono: '?' },
  ];
  get iniciales(){return (this.app.usuario()?.nombre??'Pet Care').trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();}
  ngOnInit(){void this.app.inicializar();}
  salir(){void this.ejecutar(()=>this.app.salir());}
  reintentar(){void this.ejecutar(async()=>{await this.app.reintentar();window.location.reload();});}
}
