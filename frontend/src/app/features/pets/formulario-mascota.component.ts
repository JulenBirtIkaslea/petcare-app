import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormularioCamposComponent } from '../../shared/components/formulario-campos.component';
import { EstadoPaginaComponent } from '../../shared/components/estado-pagina.component';
import { PaginaApi } from '../../shared/components/pagina-api';
import { DatosFormulario, MascotaApi } from '../../shared/models/api';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';
import { camposMascota, normalizarMascota } from './campos-mascota';
@Component({imports:[RouterLink,FormularioCamposComponent,EstadoPaginaComponent,TraducirPipe],template:`
  <a class="volver" routerLink="/mascotas">{{ '← Mis mascotas' | traducir }}</a><div class="titulo-pagina"><div><h1>{{ 'Presenta a tu mascota' | traducir }}</h1><p>{{ 'Nombre y especie son lo esencial. Completa el resto cuando quieras.' | traducir }}</p></div></div>
  <app-estado [error]="error()" [ocupado]="ocupado()" /><section class="panel"><app-formulario [campos]="campos" [valores]="valores" [ocupado]="ocupado()" etiquetaGuardar="Añadir mascota" (guardar)="guardar($event)" (cancelar)="router.navigate(['/mascotas'])" /></section>
`})
export class FormularioMascotaComponent extends PaginaApi implements OnInit{
  valores:DatosFormulario={precision_nacimiento:'desconocida',esterilizacion:'desconocido',sexo:'desconocido',zona_horaria:'Europe/Madrid'};
  get campos(){return camposMascota(this.app.especies());}
  ngOnInit(){this.valores={...this.valores,zona_horaria:this.app.usuario()?.zona_horaria??'Europe/Madrid'};}
  guardar(d:DatosFormulario){void this.ejecutar(async()=>{const m=await this.api.enviar<MascotaApi>('POST','mascotas',normalizarMascota(d));await this.app.recargarMascotas();this.app.mascotaSeleccionada.set(m.id);await this.router.navigate(['/mascotas',m.id]);});}
}
