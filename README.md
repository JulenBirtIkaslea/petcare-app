# PetCare

Proyecto DAW para gestionar de forma compartida los cuidados de mascotas. Monorepo con **Angular 21 + TypeScript + Tailwind CSS + PrimeNG**, **Laravel 12 + Sanctum** y esquema para **PostgreSQL 17+**.

La propuesta original está en [`Propuesta-Inicial/`](Propuesta-Inicial/README.md). La decisión posterior del proyecto es **database first**: PostgreSQL se crea mediante SQL revisado y Eloquent se adapta al esquema. **No se utilizan migraciones.**

## Arrancar la aplicación

Para probar el frontend solo necesitas Node.js compatible con Angular 21 (probado con Node 22.13.1) y npm. `npm ci` instala las dependencias fijadas en `package-lock.json`; no necesitas ejecutar antes `npm install`.

```powershell
cd frontend
npm ci
npm start
```

Abrir **http://127.0.0.1:4200**. `npm start` utiliza el **modo de prueba local**, sin PHP ni base de datos.

| Acceso de prueba | Valor |
| --- | --- |
| Correo o usuario | `prueba` |
| Contraseña | `Birtlh123.` |

El punto final forma parte de la contraseña. Los datos de ejemplo y los cambios se guardan en este navegador. Cerrar sesión conserva los datos; desde **Mi cuenta** puedes exportarlos o restablecer la demostración. Estas credenciales públicas son exclusivas de la demostración: no crean una cuenta en PostgreSQL ni permiten acceder a la API real.

Para usar Laravel y PostgreSQL, arranca el frontend con `npm run start:api`. `npm run build` genera la versión de producción con el modo de prueba desactivado.

La API requiere PHP 8.2 o superior y Composer 2, además de PostgreSQL configurado para las operaciones persistentes.

En otra terminal, para arrancar la API:

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
php artisan serve --host=127.0.0.1 --port=8000
```

Si Composer no está instalado globalmente, en este entorno se ha descargado una copia local: desde `backend`, sustituir `composer` por `php ../.tools/composer.phar`. Esa herramienta queda fuera de Git; otros equipos deben instalar Composer.

`GET http://127.0.0.1:8000/api/estado` permite comprobar la API sin consultar PostgreSQL. `PETCARE_BD_HABILITADA=false` mantiene deshabilitadas las operaciones persistentes, con respuesta `503 BD_NO_CONFIGURADA`. Sesiones y caché usan archivos; la cola es síncrona.

## SQL para cuando se vaya a crear PostgreSQL

**No se ha creado ninguna base de datos ni ejecutado el SQL.**

Desde la raíz, con `psql` instalado y un usuario con permiso de creación:

```powershell
psql -h 127.0.0.1 -U postgres -d postgres -f database/sql/crear_todo.psql
```

El lanzador pide la contraseña mediante PostgreSQL y ejecuta estos archivos:

1. [`00_crear_base_de_datos.sql`](database/sql/00_crear_base_de_datos.sql): crea `gestion_mascotas` sin eliminar nada.
2. [`01_crear_esquema.sql`](database/sql/01_crear_esquema.sql): tablas, relaciones, restricciones, funciones e índices dentro de una transacción.
3. [`02_catalogo_especies.sql`](database/sql/02_catalogo_especies.sql): catálogo inicial, sin cuentas ni mascotas ficticias.

En pgAdmin se ejecuta el primer archivo conectado a `postgres`, fuera de una transacción; después hay que abrir el Query Tool conectado a `gestion_mascotas` y ejecutar los otros dos, en orden. El lanzador `.psql` solo funciona con psql. Si ya existe la base vacía, omitir el primer archivo. El esquema inicial se ejecuta **una sola vez**; no es un script de actualización.

**Si ya tenías el esquema anterior:** hacer una copia de seguridad y ejecutar manualmente [`03_roles_compartidos.sql`](database/sql/03_roles_compartidos.sql), no volver a ejecutar `01`. Convierte editores/visores en ayudantes de solo lectura, invalida los códigos antiguos y prepara la auditoría por mascota. No se ha ejecutado este script automáticamente. Las bases nuevas ya incluyen los cambios en `01`.

Después, configurar las credenciales de un usuario propio de aplicación, habilitar `pdo_pgsql` en PHP y poner `PETCARE_BD_HABILITADA=true` en `backend/.env`. Ejecutar `php artisan config:clear`. El PHP de XAMPP detectado tiene el controlador PostgreSQL disponible como DLL pero deshabilitado en su `php.ini`; no se ha modificado esa configuración global.

No ejecutar `artisan migrate`, `migrate:fresh`, `db:wipe` ni `db:seed`. No hay scripts de instalación que creen SQLite o ejecuten migraciones.

## Qué queda preparado

| Área | Estado de esta base de proyecto |
|---|---|
| Frontend | Rutas con carga diferida, estilos responsive, interfaz bilingüe y conexión a la API |
| API | Registro, inicio/cierre de sesión, cuenta, ficha completa, historial, tratamientos y calendario |
| Seguridad | Sanctum SPA con cookies/CSRF; roles por mascota; confirmación de contraseña para compartir y eliminar |
| Datos | SQL de todas las entidades de la propuesta y modelos Eloquent adaptados a tablas y marcas temporales castellanas |
| Colaboración | Propietarios con iguales permisos, ayudantes de consulta y códigos de 20 minutos de un solo uso |
| Eliminación | Se retira el acceso del propietario que sale; solo el último elimina definitivamente mascota e historial |

El adaptador HTTP está en `frontend/src/app/core/services/servicio-api.ts`. No hay recuperación de contraseña, perfil clínico, transferencias exclusivas de propiedad ni papelera en el flujo actual. El veterinario puede usar una cuenta normal con acceso de ayudante. Véase el [contrato actual](docs/API_IMPLEMENTADA.md).

## Estructura

La documentación técnica actual empieza en [`doc/README.md`](doc/README.md): arquitectura, mapas del frontend y backend, contrato API, diccionario de tablas con tipos y ejemplos, operación y guía de cambios. Las instrucciones para agentes están en [`AGENTS.md`](AGENTS.md).

```text
frontend/              Angular y presentación
backend/               API Laravel y modelos database first
database/sql/          Fuente de verdad del esquema PostgreSQL
docs/                  Decisiones, contrato implementado y puesta en marcha
doc/                   Documentación técnica actual y guía para agentes
.github/workflows/     Comprobaciones en main y development
Propuesta-Inicial/     Documentación y referencias visuales originales
```

Carpetas en inglés; entidades, clases de negocio, propiedades, tablas y rutas en castellano. Los identificadores fijos del framework conservan su nombre técnico.

## Comprobaciones

```powershell
cd frontend
npm run build
npm test -- --watch=false
```

```powershell
cd backend
php artisan test
php artisan route:list --path=api
```

Las pruebas normales no crean bases ni usan migraciones. Las pruebas de integración PostgreSQL requieren activación explícita y una base de pruebas; sin ello se omiten. Consultar [`docs/DECISIONES.md`](docs/DECISIONES.md) y [`docs/API_IMPLEMENTADA.md`](docs/API_IMPLEMENTADA.md). Las pruebas de concurrencia real siguen pendientes.

Repositorio: [JulenBirtIkaslea/petcare-app](https://github.com/JulenBirtIkaslea/petcare-app). Flujo de equipo: `development` para integración y `main` para versiones estables.
