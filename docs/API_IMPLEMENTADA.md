# API implementada

Prefijo `/api`, JSON y errores Laravel (`message`, `errors`). La UI utiliza las cookies de sesión Sanctum y CSRF, no tokens personales. `/estado` no consulta PostgreSQL. Con `PETCARE_BD_HABILITADA=false`, las operaciones persistentes responden 503.

## Sesión

- `POST /registro`: `nombre`, `correo`, `contrasena`, `contrasena_confirmation`. Contraseña de al menos 10 caracteres, con letras y números. Abre sesión y devuelve `{usuario}`.
- `POST /inicio-sesion`: `correo`, `contrasena`. Devuelve el usuario y abre sesión.
- `POST /cierre-sesion`: invalida la sesión, 204.
- `GET /yo`, `PATCH /yo`, `POST /contrasena`, `DELETE /yo`: identidad y mantenimiento de cuenta. Cambios sensibles exigen `contrasena_actual`. Antes de eliminar la cuenta hay que retirar sus propiedades de mascotas.
- **Sin recuperación de contraseña**, ni por correo ni mediante código privado.

Antes de escribir: `GET /sanctum/csrf-cookie`. Angular envía `X-XSRF-TOKEN` mediante el proxy del mismo origen. Registro, login, generación de códigos y eliminación de mascota están limitados a cinco peticiones/minuto; el grupo general, a 180.

## Roles por mascota

Un usuario puede ser propietario de una mascota y ayudante de otra.

| Acción | Propietario | Ayudante |
|---|---|---|
| Consultar ficha, fotografía, historial, tratamientos y calendario | Sí | Sí |
| Editar ficha y gestionar cuidados e historial de cualquier autor | Sí | No |
| Generar/cancelar invitaciones y ver códigos pendientes | Sí | No |
| Revocar ayudantes | Sí | No |
| Revocar o degradar otro propietario | No | No |
| Salir de su propia colaboración | Sí, mediante DELETE de mascota y contraseña | Sí, mediante revocación propia |

`mascotas.propietario_id` conserva un propietario como anclaje interno, sin privilegios adicionales. Los demás propietarios se almacenan como colaboraciones activas con `permiso=propietario`. Al salir el propietario de anclaje se reasigna automáticamente a otro propietario bajo bloqueo de la mascota.

## Ficha e historial

- `GET /especies`: catálogo.
- `GET /mascotas`: array de mascotas accesibles, no paginador. Cada ficha incluye `permiso`, `numero_propietarios` y `foto_url` privada.
- `POST /mascotas`: obligatorios `nombre`, `especie_id`; `otra_especie` si se elige Otra. Propietario y creador se asignan desde la sesión, nunca desde el cliente.
- `GET`, `PATCH/PUT /mascotas/{id}`: consultar/editar. Opcionales: raza, sexo, nacimiento parcial, peso, esterilización, microchip, características, observaciones y zona horaria (por defecto Europe/Madrid).
- `GET/POST/DELETE /mascotas/{id}/fotografia`: imagen privada JPG/PNG/WebP de hasta 5 MB.
- `GET /mascotas/{id}/historial`: registros con autor, fecha, `creado_por_id`, `creado_en` y `puede_editar`.
- `POST /mascotas/{id}/historial/{tipo}`; `PATCH/DELETE /mascotas/{id}/historial/{tipo}/{registro}`; `POST .../{registro}/siguiente`. Correcciones/eliminaciones sanitarias exigen `motivo_correccion`.

Tipos sanitarios: consultas, vacunas, desparasitaciones y alergias. Vacuna: nombre y fecha de administración obligatorios; próxima dosis, clínica/veterinario, lote y observaciones opcionales. Desparasitación: producto, fecha de aplicación y tipo (interna/externa/ambas); próxima aplicación y observaciones opcionales. No se admiten actuaciones futuras ni próximas aplicaciones anteriores a la administración.

Se conservan los endpoints de tratamientos, versiones de pautas y dosis, agenda de citas/tareas, calendario mensual/agregado y auditoría. Todas las escrituras requieren ser propietario, también al corregir registros creados por otra persona. La auditoría es solo para propietarios.

## Compartir

- `GET /mascotas/{id}/colaboradores`: `{propietario, colaboradores}`; ambas listas pueden contener propietarios.
- `POST /mascotas/{id}/codigos`: `permiso` (`propietario` o `ayudante`) y `contrasena_actual`. Devuelve código **solo al generarlo** y `caduca_en`. Se almacena SHA-256, no el secreto.
- `GET /mascotas/{id}/codigos`: metadatos, nunca el código original.
- `DELETE /mascotas/{id}/codigos/{codigo}`: cancelar.
- `POST /compartir/consultar`: `codigo`; muestra nombre, permiso y caducidad antes de aceptar, sin consumirlo.
- `POST /compartir/aceptar`: `codigo`; añade acceso a la cuenta autenticada. Un ayudante puede aceptar una nueva invitación como propietario.
- `DELETE /mascotas/{id}/colaboradores/{usuario}`: revocar ayudante o abandonar la propia colaboración de ayudante. Nunca permite retirar un propietario.

El código queda inutilizado al primer uso, al cancelarlo o al cumplirse **20 minutos desde su creación**. Consulta y aceptación validan la caducidad en servidor; la aceptación vuelve a comprobarla dentro de una transacción con bloqueo de mascota y código. Intentos inválidos y aceptación están limitados. No existe un endpoint de cambio libre de rol ni el flujo antiguo de transferencias.

## Eliminar mascota

`DELETE /mascotas/{id}` exige `contrasena_actual` y devuelve 204:

- Con otros propietarios: retira únicamente la propiedad del usuario conectado. Conserva mascota, historial y acceso de los demás propietarios y ayudantes.
- Si es el último propietario: elimina **físicamente** mascota e historial relacionado, colaboraciones, códigos y auditoría vinculada; elimina también su fotografía privada. Los ayudantes dejan de tener acceso. No hay papelera ni restauración.
- Se cancelan los códigos pendientes creados por el propietario que sale. Las operaciones de colaboración, escritura y salida se serializan bloqueando la misma mascota.

## Verificación

Compilación y pruebas Angular con API simulada; pruebas PHP de permisos, códigos, contraseña y rutas sin BD. La integración real requiere PostgreSQL y no se ha ejecutado en este entorno.

Para ejecutar `PropiedadCompartidaPostgresTest`: configurar las credenciales de una base **dedicada de pruebas** cuyo nombre termine en `_pruebas`, habilitar `pdo_pgsql` y establecer `PETCARE_PRUEBAS_POSTGRES=true` antes de `php artisan test`. `phpunit.xml` usa `gestion_mascotas_pruebas` por defecto. Cada prueba crea un esquema único dentro de una transacción y lo revierte completo, sin migraciones ni modificaciones de tablas existentes. No se prueban todavía carreras mediante conexiones concurrentes reales.
