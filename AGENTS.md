# Guía para trabajar en PetCare

## Empezar aquí

1. Leer `README.md` para arrancar y `doc/README.md` para navegar por la documentación.
2. Consultar `doc/ARQUITECTURA.md` y el mapa del área que se vaya a cambiar.
3. Revisar el código actual antes de editar: la documentación histórica en `docs/` y `Propuesta-Inicial/` puede describir estados anteriores.

## Estructura y fuentes de verdad

- `frontend/`: Angular standalone, TypeScript, signals, rutas diferidas, Tailwind y PrimeNG. El contrato compartido está en `frontend/src/app/shared/models/api.ts`.
- `backend/`: Laravel, Sanctum SPA, controladores y servicios de dominio en castellano. Rutas efectivas: `backend/routes/api.php`.
- `database/sql/01_crear_esquema.sql`: esquema completo para instalaciones nuevas. `03_roles_compartidos.sql`: actualización manual de instalaciones antiguas; no forma parte del arranque normal.
- `doc/`: documentación técnica actual, diccionario de datos y guías de mantenimiento.
- No editar dependencias ni resultados generados: `node_modules`, `vendor`, `.angular`, `dist`, `.cache`, `storage`, `bootstrap/cache`.

## Dos modos explícitos

- `npm start` en `frontend/`: demo local, usuario `prueba`, contraseña `Birtlh123.`. Los datos se guardan en el navegador.
- `npm run start:api`: API real con Laravel/PostgreSQL. `npm run build` también desactiva la demo.
- La selección se hace en `angular.json` y `src/environments/`. No usar fallos HTTP como señal para cambiar automáticamente a datos demo.
- `ServicioApi` conserva la misma interfaz en ambos modos. No conectar directamente los componentes a HTTP o almacenamiento salvo acciones explícitas de administración de la demo.
- La demo no es un mecanismo de seguridad ni sustituye las políticas del servidor. No habilitar las credenciales públicas de prueba en Laravel.

## Reglas de dominio

- Permisos vigentes: `propietario` y `ayudante`. El ayudante es de solo lectura. No reintroducir `editor`/`visor`.
- Una mascota puede tener varios propietarios. Revisar `ServicioPropiedad` antes de tocar eliminación, revocación o cuenta.
- No inventar recuperación por correo, papelera o transferencias: hay archivos/modelos históricos que no tienen ruta activa.
- SQL primero: no ejecutar `artisan migrate`, `migrate:fresh`, `db:wipe` ni `db:seed`.
- No ejecutar scripts SQL ni modificar una BD existente sin una instrucción que autorice ese cambio concreto. Las pruebas PostgreSQL son opt-in sobre una BD de pruebas.
- Mantener marcas temporales castellanas y separar fecha de calendario de instante UTC. No convertir cumpleaños o próximas dosis de día completo a UTC por accidente.
- Preservar versiones de tratamientos, resolución de dosis y motivos de corrección/auditoría.

## Convenciones de implementación

- Negocio, tablas y propiedades en castellano; carpetas de funcionalidades en inglés y nombres de framework convencionales.
- Reutilizar `PaginaApi`, `FormularioCamposComponent`, `EstadoPaginaComponent` y `SelectorMascotaComponent`.
- Todo texto nuevo de interfaz debe pasar por `TraducirPipe` y añadirse a `shared/i18n/eu.ts`. No traducir nombres introducidos por usuarios.
- Validación y permisos en servidor; la ocultación de botones y el guard de Angular solo mejoran la navegación.
- Usar los mecanismos existentes de cookies, CSRF y confirmación de contraseña. No exportar hashes, contraseñas o códigos secretos junto a los datos.
- Mantener accesibilidad de formularios, foco visible y mensajes de error. Confirmar acciones destructivas en la interfaz.
- No sobrescribir `.env` existente ni imprimir sus credenciales. No añadir secretos a documentación o fixtures.
- Respetar cambios previos del usuario. No asumir que esta carpeta es un repositorio Git.

## Búsquedas y comprobaciones

Buscar dentro del área, evitando árboles de dependencias: `rg -n "texto" frontend/src backend/app backend/routes database/sql doc`.

Desde `frontend/`:

```text
npm ci
npm run build
npm test -- --watch=false
```

Desde `backend/`:

```text
php artisan test
php artisan route:list --path=api
```

Ejecutar las comprobaciones pertinentes al cambio; documentar qué se probó y qué quedó pendiente. Para cambios de demo probar también `npm run build -- --configuration development`. Para validar permisos nuevos, probar propietario, ayudante y usuario sin acceso. No confundir pruebas con mocks con verificación real de PostgreSQL.

En Windows, ejecutar `npm.cmd` si PowerShell bloquea `npm.ps1`. Un error `spawn EPERM` del entorno restringido no justifica cambiar dependencias ni desactivar controles. Si se arranca un servidor, mantenerlo en segundo plano sin abrir ventanas visibles innecesarias.

Actualizar los documentos afectados y los enlaces del índice cuando cambien rutas, contratos, tablas o comandos. Véase `doc/GUIA_CAMBIOS.md` para recorridos por funcionalidad.
