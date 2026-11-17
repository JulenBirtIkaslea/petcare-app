import { TraducirPipe } from '../pipes/traducir.pipe';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  imports: [TraducirPipe, RouterLink],
  template: `<section class="panel vacio">
    <p class="sobrelinea">404</p>
    <h1>{{ 'Página no encontrada' | traducir }}</h1>
    <a class="boton primario" routerLink="/inicio">{{ 'Volver al inicio' | traducir }}</a>
  </section>`,
})
export class NoEncontradoComponent {}
