import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { EstadoApi, ServicioApi } from './servicio-api';
import { Especie, MascotaApi, Usuario } from '../../shared/models/api';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServicioAplicacion {
  readonly demo = environment.demo;
  readonly api = inject(ServicioApi);
  private readonly router = inject(Router);
  readonly usuario = signal<Usuario | null>(null);
  readonly mascotas = signal<MascotaApi[]>([]);
  readonly especies = signal<Especie[]>([]);
  readonly estado = signal<'cargando' | 'disponible' | 'pendiente' | 'sin_conexion'>('cargando');
  readonly conectado = computed(() => this.estado() === 'disponible' && this.usuario() !== null);
  readonly mascotaSeleccionada = signal(0);
  readonly mascota = computed(() => this.mascotas().find(m => m.id === this.mascotaSeleccionada()) ?? null);
  private inicializacion: Promise<void> | null = null;

  inicializar(): Promise<void> { return this.inicializacion ??= this.cargar(); }
  async reintentar(): Promise<void> { this.inicializacion = null; await this.inicializar(); }
  private async cargar(): Promise<void> {
    this.estado.set('cargando');
    try {
      const estado = await this.api.get<EstadoApi>('estado');
      if (!estado.base_de_datos_habilitada) { this.estado.set('pendiente'); this.limpiar(); return; }
      this.estado.set('disponible');
      try { this.usuario.set(await this.api.get<Usuario>('yo')); await this.recargarMascotas(); }
      catch (e) {
        this.limpiar();
        if (!(e instanceof HttpErrorResponse && e.status === 401)) throw e;
      }
    } catch { this.estado.set('sin_conexion'); this.limpiar(); }
  }
  async recargarMascotas(): Promise<void> {
    if (!this.conectado()) return;
    const [mascotas, especies] = await Promise.all([this.api.get<MascotaApi[]>('mascotas'), this.api.get<Especie[]>('especies')]);
    this.mascotas.set(mascotas); this.especies.set(especies);
    if (!mascotas.some(m => m.id === this.mascotaSeleccionada())) this.mascotaSeleccionada.set(mascotas[0]?.id ?? 0);
  }
  async sesion(usuario: Usuario): Promise<void> {
    this.usuario.set(usuario); this.estado.set('disponible'); this.api.reiniciarCsrf();
    await this.recargarMascotas();
  }
  async salir(): Promise<void> {
    try { await this.api.enviar('POST', 'cierre-sesion'); }
    catch (e) { if (!(e instanceof HttpErrorResponse && e.status === 401)) throw e; }
    this.limpiar(); this.api.reiniciarCsrf();
    await this.router.navigate(['/acceso']);
  }
  limpiar(): void { this.usuario.set(null); this.mascotas.set([]); this.especies.set([]); this.mascotaSeleccionada.set(0); }
}
