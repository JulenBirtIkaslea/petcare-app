import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioAplicacion } from '../services/servicio-aplicacion';

export const sesionGuard: CanActivateFn = async (_ruta, estado) => {
  const app = inject(ServicioAplicacion); const router = inject(Router);
  await app.inicializar();
  return app.usuario() !== null || router.createUrlTree(['/acceso'], { queryParams: { volver: estado.url } });
};
