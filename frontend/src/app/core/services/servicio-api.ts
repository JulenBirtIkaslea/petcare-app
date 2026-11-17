import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServicioDemoLocal } from './servicio-demo-local';

export interface EstadoApi { aplicacion: string; estado: string; base_de_datos_habilitada: boolean; }

@Injectable({ providedIn: 'root' })
export class ServicioApi {
  private readonly http = inject(HttpClient);
  private readonly demo = environment.demo ? inject(ServicioDemoLocal) : null;
  private readonly opciones = { withCredentials: true, headers: new HttpHeaders({ Accept: 'application/json' }) };
  private csrf: Promise<unknown> | null = null;

  get<T>(ruta: string): Promise<T> {
    if (this.demo) return this.demo.get<T>(ruta);
    return firstValueFrom(this.http.get<T>('/api/' + ruta, this.opciones));
  }
  async enviar<T>(metodo: 'POST' | 'PATCH' | 'DELETE', ruta: string, datos: unknown = {}): Promise<T> {
    if (this.demo) return this.demo.enviar<T>(metodo, ruta, datos);
    await this.prepararCsrf();
    const ejecutar = () => firstValueFrom(this.http.request<T>(metodo, '/api/' + ruta, { ...this.opciones, body: datos }));
    try { return await ejecutar(); }
    catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 419) {
        this.csrf = null; await this.prepararCsrf(); return ejecutar();
      }
      throw e;
    }
  }
  private prepararCsrf(): Promise<unknown> {
    this.csrf ??= firstValueFrom(this.http.get('/sanctum/csrf-cookie', this.opciones)).catch(e => { this.csrf = null; throw e; });
    return this.csrf;
  }
  reiniciarCsrf(): void { this.csrf = null; }
}

export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0 || error.status === 502) return 'No se puede conectar con la API. Comprueba que Laravel está arrancado.';
    if (error.status === 503) return 'La base de datos todavía no está disponible. Los cambios no se han guardado.';
    if (error.status === 401) return error.error?.message ?? 'La sesión ha caducado. Inicia sesión de nuevo.';
    if (error.status === 429) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
    if (error.error?.errors) return Object.values(error.error.errors).flat().join(' ');
    return error.error?.message ?? error.error?.mensaje ?? 'No se ha podido completar la operación.';
  }
  return 'No se ha podido completar la operación.';
}
