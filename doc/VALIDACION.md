# Validación y alcance

Revisión del 17 de noviembre de 2026.

## Comprobaciones realizadas

- Compilación Angular de producción correcta.
- Compilación y ejecución de tests Angular: **39 pruebas correctas en 8 archivos**. Incluyen acceso/registro/cierre, mostrar contraseña, recordar sesión, formularios, colaboración, navegación, idioma, exportación CSV y persistencia de la demo.
- El adaptador local comprueba credenciales incorrectas, acceso privado sin sesión, conservación de cambios después de cerrar y volver a entrar, exportación sin credenciales y restablecimiento.
- Flujos completos del adaptador: registro y nuevo acceso, aislamiento entre usuarios, código de un uso, ayudante de solo lectura, salida de copropietario, eliminación definitiva de datos vinculados, tarea completada sin doble resolución, pauta única con resolución y caducidad de sesión. La exportación respeta la restricción de auditoría para ayudantes.
- Servidor local en `http://127.0.0.1:4200`: respuesta HTTP 200.
- Revisión de interfaz por código: menú móvil desplegable con estado accesible y cierre con Escape, controles táctiles ampliados, texto más legible, ajuste de tarjetas y contenido largo, indicador de carga respetando movimiento reducido y búsqueda sin coincidencias con acción para limpiarla. Pruebas de menú y recuperación de resultados correctas. La revisión visual real sigue pendiente por la conexión del navegador.

## Límites de estas comprobaciones

La herramienta del navegador no pudo iniciar la conexión por un error de infraestructura (`missing field sandboxPolicy`). No se afirma una revisión visual o prueba manual completa en navegador. Las pruebas de componentes utilizan DOM simulado.

No se ha creado ni modificado ninguna BD ni ejecutado SQL. No se han verificado las operaciones de la API contra un PostgreSQL real en esta tarea. Los cambios de funcionalidad de esta entrega se concentran en el frontend y su adaptador local; Laravel mantiene su autenticación y sus políticas.

## Funciones disponibles

- Modo demo explícito para desarrollo: acceso con `prueba` / `Birtlh123.`, sesión local opcionalmente recordada, cierre, registro local, perfil y contraseña.
- Datos iniciales de mascotas, historial, tratamientos y agenda; edición y conservación en navegador.
- Flujos de colaboración locales entre cuentas del mismo navegador.
- Exportación de datos demo en JSON, restablecimiento con confirmación y agenda CSV.
- Ayuda dentro de la aplicación y documentación técnica en `doc/`.

## Trabajo que requiere otra infraestructura

- Validar despliegue, HTTPS, cookies, CSRF y políticas con una BD de pruebas.
- Concurrencia real entre varias personas/dispositivos y límites de consultas.
- Correo transaccional y recuperación de contraseña; notificaciones externas.
- Revisión visual en móvil/escritorio y accesibilidad con lector de pantalla.

El modo demo no ofrece seguridad frente a quien controla el navegador ni conservación garantizada. No debe emplearse para almacenar información sensible de uso real.
