import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ServicioIdioma } from '../../core/services/servicio-idioma';
import { PaginaApi } from '../../shared/components/pagina-api';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';
import { EstadoPaginaComponent } from '../../shared/components/estado-pagina.component';
@Component({imports:[FormsModule,RouterLink,TraducirPipe,EstadoPaginaComponent],template:`
  <div class="titulo-pagina"><div><p class="sobrelinea">{{ 'CADA COMPAÑERO, SU HISTORIA' | traducir }}</p><h1>{{ 'Mis mascotas' | traducir }}</h1><p>{{ 'Su información y sus cuidados, siempre cerca.' | traducir }}</p></div><div class="pestanas"><a class="boton" routerLink="/colaboradores">{{ 'Introducir código' | traducir }}</a><a class="boton primario" routerLink="/mascotas/nueva">{{ '+ Añadir mascota' | traducir }}</a></div></div>
  <app-estado [error]="error()" [ocupado]="ocupado()" /><div class="filtros"><label>{{ 'Buscar mascota' | traducir }}<input type="search" [placeholder]="'Nombre o especie…' | traducir" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)"></label><span>{{ filtradas().length }} {{ 'mascotas' | traducir }}</span></div>
  <div class="tarjetas-mascotas">@for(m of filtradas();track m.id){<a class="tarjeta-mascota" [routerLink]="['/mascotas',m.id]"><div class="retrato">@if(m.foto_url){<img [src]="m.foto_url" [alt]="m.nombre">}@else{<span aria-hidden="true">🐾</span>}<span class="insignia clara">{{ m.permiso | traducir }}</span></div><div class="cuerpo-tarjeta"><span class="sobrelinea">{{ (m.otra_especie || m.especie.nombre) | traducir }}</span><h2>{{ m.nombre }} <span>↗</span></h2><p>{{ m.raza || ('Sin especificar' | traducir) }}</p></div></a>}
  @empty{<section class="panel vacio estado-vacio" role="status"><span class="vacio-icono" aria-hidden="true">{{ app.mascotas().length?'⌕':'🐾' }}</span>@if(app.mascotas().length){<h2>{{ 'No hay coincidencias' | traducir }}</h2><p>{{ 'Prueba con otro nombre o especie, o borra la búsqueda para ver todas tus mascotas.' | traducir }}</p><button class="boton" (click)="busqueda.set('')">{{ 'Limpiar búsqueda' | traducir }}</button>}@else{<h2>{{ 'Todavía no hay mascotas' | traducir }}</h2><p>{{ 'Añade una mascota o introduce un código en Colaboradores para empezar.' | traducir }}</p><div class="pestanas"><a class="boton primario" routerLink="/mascotas/nueva">{{ '+ Añadir mascota' | traducir }}</a><a class="boton" routerLink="/colaboradores">{{ 'Introducir código' | traducir }}</a></div>}</section>}</div>
`})
export class ListaMascotasComponent extends PaginaApi{
  readonly idiomas=inject(ServicioIdioma);readonly busqueda=signal('');readonly filtradas=computed(()=>this.app.mascotas().filter(m=>`${m.nombre} ${m.especie.nombre} ${this.idiomas.traducir(m.especie.nombre)} ${m.otra_especie??''}`.toLocaleLowerCase().includes(this.busqueda().trim().toLocaleLowerCase())));
}
