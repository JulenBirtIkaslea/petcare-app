import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServicioAplicacion } from '../../core/services/servicio-aplicacion';
import { TraducirPipe } from '../pipes/traducir.pipe';
@Component({selector:'app-selector-mascota',imports:[TraducirPipe,RouterLink],template:`
  <div class="filtros"><label>{{ 'Mascota' | traducir }}<select [disabled]="ocupado()" [value]="app.mascotaSeleccionada()" (change)="seleccionar(+$any($event.target).value)"><option value="0" disabled>{{ 'Selecciona una mascota' | traducir }}</option>@for (m of app.mascotas(); track m.id) {<option [value]="m.id">{{ m.nombre }} · {{ m.permiso | traducir }}</option>}</select></label><a class="boton" routerLink="/mascotas/nueva">{{ '+ Añadir mascota' | traducir }}</a></div>
  @if (!app.mascotas().length) { <p class="ayuda">{{ 'Añade una mascota o introduce un código en Colaboradores para empezar.' | traducir }}</p> }
`})
export class SelectorMascotaComponent { readonly app=inject(ServicioAplicacion); readonly ocupado=input(false); readonly cambio=output<number>(); seleccionar(id:number){this.app.mascotaSeleccionada.set(id);this.cambio.emit(id);} }
