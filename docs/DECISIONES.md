# Decisiones del proyecto

## Reglas actuales de propiedad compartida

Prevalecen sobre los apartados históricos de abajo: dos roles por mascota, propietario y ayudante de solo consulta. Todos los propietarios tienen iguales permisos; ninguno puede revocar o degradar a otro. Compartir exige contraseña y genera un código de un solo uso con 20 minutos de vigencia. Eliminar también exige contraseña: con otros propietarios solo se retira el acceso propio; sin ellos se elimina físicamente la mascota y sus datos. Sin recuperación de contraseña, papelera ni transferencias exclusivas.

Se conserva `propietario_id` como anclaje obligatorio para no romper el esquema existente; las copropiedades son colaboraciones con rol propietario. Todas las operaciones sensibles bloquean primero la mascota. Al salir el anclaje, otro propietario ocupa ese campo sin cambiar sus permisos. La eliminación final borra las dependencias en orden dentro de la misma transacción, respetando las FK restrictivas.

Las bases nuevas usan `01_crear_esquema.sql`; las existentes se actualizan manualmente con `03_roles_compartidos.sql`, previa copia de seguridad. El script convierte los roles antiguos en ayudantes y cancela invitaciones y transferencias antiguas, sin borrar mascotas. Los campos/tablas heredados de recuperación y transferencia no se usan en las rutas actuales. Las antiguas mascotas en papelera no se restauran ni purgan automáticamente: requieren revisión manual antes de actualizar una instalación con esos datos.

Ficha e historial existentes se reutilizan: nombre/especie obligatorios, datos descriptivos opcionales y registros de vacunas/desparasitaciones con fechas y autoría. Véase `API_IMPLEMENTADA.md` para el contrato actual.

## Contexto de la creación inicial

## Database first

La instrucción del promotor sustituye las referencias a migraciones en la propuesta inicial. La fuente de verdad es `database/sql/`; no se generan tablas desde Eloquent. Se han retirado las migraciones, la fábrica y el seeder de ejemplo de Laravel y los comandos automáticos que creaban SQLite o ejecutaban migraciones.

Los modelos declaran expresamente sus tablas. `ModeloBase` adapta `creado_en`, `actualizado_en` y `eliminado_en`; `Usuario` adapta `correo`, `contrasena` y `token_recuerdo`. Los modelos de módulos futuros bloquean asignación masiva por defecto y sirven de mapeo inicial; sus relaciones, casts y servicios deben completarse al implementar cada módulo.

El SQL inicial es de instalación sobre base vacía. Los futuros cambios serán scripts SQL independientes revisados, con su procedimiento y respaldo, sin migraciones Laravel. No volver a ejecutar el esquema para actualizar una instalación.

## Compatibilidad

Se ha elegido Angular 21 para el Node 22.13 disponible y Laravel 12 para el PHP 8.2 disponible. Los archivos lock fijan las dependencias efectivamente instaladas. Antes de producción se deben revisar soporte y actualizaciones de runtime.

Referencias oficiales consultadas: [compatibilidad Angular](https://angular.dev/reference/versions), [versiones Laravel](https://laravel.com/docs/12.x/releases). PostgreSQL objetivo: 17 o superior.

## Detalles concretados para el SQL

- Instantes en `timestamptz`; API en UTC; zona local inicial `Europe/Madrid` por usuario/mascota. Fechas sanitarias en `date`.
- Especies identificadas por `codigo` estable, evitando suponer el ID de «Otra».
- Correos normalizados a minúsculas y sin espacios exteriores; unicidad en PostgreSQL.
- Alergias normalizadas en columna generada: trim, espacios agrupados y minúsculas. **Los acentos se conservan.**
- Nacimiento parcial en componentes; validación de fecha real y futuro en trigger. El día 1 usado para comparar la parte conocida no se almacena como nacimiento real.
- Frecuencias: días ISO 1–7 (`smallint[]`), horas locales (`time[]`); `cada_horas` usa intervalo y `vigor_desde_en` como ancla. Dosis única: mismo inicio/fin y una hora.
- Una versión abierta por tratamiento, y una resolución por `(tratamiento_id, fecha_hora_programada)`, además de `dosis_clave` única. El servicio futuro validará ocurrencias, solapamientos, vigencia y cambios no retroactivos.
- Relaciones «anterior» sanitarias y versión/resolución usan claves compuestas para impedir cruces de mascotas o tratamientos. Una actuación anterior solo admite una siguiente, incluso tras corrección lógica.
- Las FK de negocio usan restricción por defecto al borrar físicamente. La papelera no elimina hijos. No se incorpora una tarea destructiva de purga sin una política de retención definida.
- Las restricciones temporales que dependen del momento actual se implementan en triggers de escritura.
- Auditoría preparada como almacenamiento; no hay una afirmación de auditoría automática. Los servicios sanitarios deberán registrar autor, motivo y antes/después en la misma transacción, excluyendo secretos.

## Autenticación

Sanctum para SPA mediante sesión de archivos y cookie CSRF. No se usan tokens personales ni su tabla. En local, Angular utiliza un proxy para que las solicitudes y el token XSRF compartan origen. Mantener `127.0.0.1` en ambos servidores para evitar diferencias de cookies con `localhost`. En producción se deben configurar HTTPS, cookie segura, dominios y CORS según el despliegue real.

El SQL reserva `tokens_recuperacion` en castellano, pero no se utiliza el repositorio estándar de Laravel (sus columnas técnicas no coinciden). La recuperación y verificación de correo se implementarán con un repositorio/notificaciones adaptados; no hay rutas públicas anunciadas para esos flujos.

## Alcance y validación

Esta fase crea un proyecto arrancable sin BD y una base de implementación. La persistencia permanece deshabilitada por configuración hasta la creación manual del esquema. No se ha creado PostgreSQL, provisionado servicios, publicado la aplicación ni probado la persistencia.

La documentación original se conserva como propuesta; en caso de discrepancia prevalecen la instrucción database first, el README de raíz, estos acuerdos y el código actual.
