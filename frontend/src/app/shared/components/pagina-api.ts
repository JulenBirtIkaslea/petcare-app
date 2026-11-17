import { Directive, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ServicioAplicacion } from '../../core/services/servicio-aplicacion';
import { mensajeError } from '../../core/services/servicio-api';

@Directive()
export abstract class PaginaApi {
  readonly app = inject(ServicioAplicacion); readonly api = this.app.api; readonly router = inject(Router);
  readonly ocupado = signal(false); readonly error = signal(''); readonly aviso = signal('');
  async ejecutar(operacion: () => Promise<void>, mensaje = ''): Promise<void> {
    if (this.ocupado()) return;
    this.ocupado.set(true); this.error.set(''); this.aviso.set('');
    try { await operacion(); if (mensaje) this.aviso.set(mensaje); }
    catch (e) {
      this.error.set(mensajeError(e));
      if (e instanceof HttpErrorResponse && e.status === 401 && this.app.usuario()) {
        this.app.limpiar(); await this.router.navigate(['/acceso']);
      }
    } finally { this.ocupado.set(false); }
  }
}
