# Arranque y operación

## Demo local

Desde la raíz, con Node/npm instalados:

```powershell
cd frontend
npm ci
npm start
```

Abrir `http://127.0.0.1:4200`. Usuario **`prueba`**, contraseña **`Birtlh123.`** (incluido el punto). No requiere Laravel ni PostgreSQL. Para siguientes arranques basta `npm start`; repetir `npm ci` cuando cambie el lockfile o falten dependencias.

Los cambios pertenecen al origen actual del navegador. La sesión se guarda por pestaña salvo que se marque recordar; cerrar sesión conserva las mascotas y cuidados. **Mi cuenta** permite exportar y restablecer con confirmación. El restablecimiento recupera la semilla y las credenciales originales. La exportación excluye credenciales y secretos de sesión.

## Desarrollo con API real

En una terminal, desde `backend/`:

```powershell
composer install
if (!(Test-Path .env)) { Copy-Item .env.example .env; php artisan key:generate }
php artisan serve --host=127.0.0.1 --port=8000
```

En otra, desde `frontend/`:

```powershell
npm run start:api
```

Consultar `/api/estado` para diagnosticar si la BD está habilitada. Configurar PostgreSQL y `PETCARE_BD_HABILITADA=true` para usar cuentas reales. No sobrescribir un `.env` ya configurado ni generar una nueva APP_KEY para una instalación existente sin evaluar su impacto. El modo API conserva registro real; la cuenta `prueba` de demo no existe automáticamente en él.

## PostgreSQL

Consultar el [README principal](../README.md) y [diccionario](BASE_DE_DATOS.md). En una instalación nueva, `crear_todo.psql` ejecuta creación, esquema y catálogo; es una operación explícita, no un requisito de la demo. El parche `03_roles_compartidos.sql` se reserva a esquemas antiguos. Configurar `pdo_pgsql`, usuario de aplicación y credenciales locales; limpiar configuración Laravel después de cambios.

## Compilación y pruebas

```powershell
# En frontend/
npm run build
npm test -- --watch=false
npm run build -- --configuration development
```

```powershell
# En backend/
php artisan test
php artisan route:list --path=api
```

Producción y demo usan la misma carpeta de salida: la última compilación la reemplaza. Para desplegar la API real, volver a ejecutar `npm run build`; no publicar por accidente una compilación development. Configurar en el hosting el fallback SPA y el encaminamiento del mismo origen para `/api` y `/sanctum`; `proxy.conf.json` solo opera con el servidor de desarrollo.

La suite PostgreSQL exige `PETCARE_PRUEBAS_POSTGRES=true` y una BD cuyo nombre termine en `_pruebas`. Crea un esquema aislado dentro de una transacción; necesita permisos apropiados. No activarla apuntando a datos de uso real.

## Diagnóstico

| Síntoma | Revisar |
| --- | --- |
| `npm` bloqueado por PowerShell | Ejecutar `npm.cmd ci` / `npm.cmd start` |
| Falta `@angular/build:dev-server` | Dependencias incompletas; ejecutar `npm ci` en frontend |
| `spawn EPERM` | Restricciones del entorno de ejecución o antivirus; no cambiar las dependencias a ciegas |
| Puerto ocupado | Reutilizar el servidor existente o elegir otro puerto; cambiar puerto crea otro origen para datos demo |
| La demo no muestra mis cambios | Comprobar navegador, host y puerto; almacenamiento privado/borrado o restablecimiento |
| Usuario o contraseña incorrectos | El punto final forma parte de `Birtlh123.`; una contraseña modificada ya no es la inicial |
| Error de almacenamiento local | Liberar espacio/exportar antes de borrar; fotos grandes pueden agotar la cuota |
| 503 `BD_NO_CONFIGURADA` | Modo API y BD deshabilitada; configurar servidor o arrancar deliberadamente la demo |
| 401 | Volver a iniciar sesión; se limpia el estado privado de la SPA |
| 419 | Cookies/CSRF, proxy y origen; el cliente renueva CSRF una vez |
| 422 | Campos o regla de dominio inválidos; leer errores específicos |
| 429 | Esperar al restablecimiento del límite de intentos |

## Límites de la entrega

La demo permite recorrer funcionalidades y conservar ejemplos en el navegador; no sincroniza dispositivos. Los códigos no invitan a personas por correo. No hay recuperación de contraseña por correo, notificaciones push ni modo clínico específico. La configuración real y las pruebas de PostgreSQL siguen siendo un paso separado.
