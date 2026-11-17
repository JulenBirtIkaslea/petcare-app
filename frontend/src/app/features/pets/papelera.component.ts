import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaginaApi } from '../../shared/components/pagina-api';
import { EstadoPaginaComponent } from '../../shared/components/estado-pagina.component';
import { MascotaApi } from '../../shared/models/api';
import { TraducirPipe } from '../../shared/pipes/traducir.pipe';
import { FechaLocalizadaPipe } from '../../shared/pipes/fecha-localizada.pipe';
@Component({imports:[RouterLink,EstadoPaginaComponent,TraducirPipe,FechaLocalizadaPipe],template:`
  <a class="volver" routerLink="/mascotas">{{ '← Mis mascotas' | traducir }}</a><h1>{{ 'Papelera' | traducir }}</h1><p>{{ 'Puedes restaurar la mascota durante 30 días.' | traducir }}</p><app-estado [error]="error()" [aviso]="aviso()" [ocupado]="ocupado()" />
  <section class="panel">@for(m of mascotas();track m.id){<article class="actividad"><div class="actividad-texto"><strong>{{ m.nombre }}</strong><small>{{ m.eliminado_en! | fechaLocalizada:'medium' }}</small></div><button class="boton" [disabled]="!m.restaurable || ocupado()" (click)="restaurar(m.id)">{{ (m.restaurable?'Restaurar':'Plazo agotado') | traducir }}</button></article>}@empty{<p class="vacio">{{ 'La papelera está vacía.' | traducir }}</p>}</section>
`})
export class PapeleraComponent extends PaginaApi implements OnInit{readonly mascotas=signal<MascotaApi[]>([]);ngOnInit(){if(this.app.conectado())void this.ejecutar(()=>this.cargar());}async cargar(){this.mascotas.set(await this.api.get<MascotaApi[]>('papelera'));}restaurar(id:number){void this.ejecutar(async()=>{await this.api.enviar('POST',`mascotas/${id}/restaurar`);await Promise.all([this.cargar(),this.app.recargarMascotas()]);},'Mascota restaurada.');}}
