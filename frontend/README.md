# Frontend PetCare

Angular standalone con rutas diferidas, Tailwind y PrimeNG. Arranque: `npm ci` y `npm start`.

Interfaz disponible en castellano y euskera desde el selector de idioma de la navegación. La preferencia se guarda localmente (`petcare.idioma`); el cambio actualiza textos, fechas, accesibilidad y título de página sin recargar ni perder los datos en memoria. Los nombres introducidos por el usuario se conservan. Las traducciones se mantienen en `src/app/shared/i18n/eu.ts`; el castellano es el idioma inicial y de respaldo.

`npm start` utiliza `ServicioDemoLocal`: usuario `prueba`, contraseña `Birtlh123.`. Los datos ficticios y los cambios se conservan en localStorage al recargar y al cerrar sesión. Desde Mi cuenta se pueden exportar y restablecer. La sesión dura ocho horas, o treinta días al marcar recordar.

`npm run start:api` usa Laravel mediante el proxy de desarrollo. `npm run build` genera producción con la demo desactivada. La selección está en `src/environments/` y `angular.json`; no se cambia automáticamente de modo cuando falla la API. Las credenciales demo no crean una cuenta en PostgreSQL.

La documentación de navegación y contratos está en [doc/](../doc/README.md), especialmente el [mapa frontend](../doc/MAPA_FRONTEND.md).

El punto de entrada es `src/app/app.ts`; los módulos de negocio se organizan en `src/app/features/`. Los detalles de instalación, estado y límites están en el [README principal](../README.md).
