# Validación de la base de proyecto

Comprobaciones realizadas sin crear, conectar ni ejecutar bases de datos:

- Compilación de producción Angular correcta; rutas y plantillas comprobadas por el compilador.
- Cinco pruebas de frontend: alta y ficha de mascota, acceso a mascota inexistente, cambio castellano/euskera con filtros estables, recuperación del idioma y búsqueda por especie traducida, y preferencia inválida con respaldo en castellano.
- Cinco pruebas de Laravel: arranque/estado sin conexión, bloqueo con BD deshabilitada, exigencia de sesión y permisos básicos del propietario frente a otro usuario. Dieciséis aserciones.
- Inventario de once rutas de API comprobado con Artisan.
- Arranque HTTP de Angular y Laravel comprobado: frontend 200, estado de API disponible con BD deshabilitada y proxy Angular → Laravel operativo.
- Sintaxis de los archivos PHP del proyecto comprobada.
- Los tres archivos SQL superan el análisis sintáctico PostgreSQL (`pgsql-parser`); esta comprobación no ejecuta funciones PL/pgSQL ni verifica restricciones contra un servidor.

La inspección visual con navegador no ha podido realizarse porque la herramienta de navegador de esta sesión no ha conseguido conectarse. El diseño responsive requiere esa revisión manual.

Pendiente cuando se habilite una BD de pruebas: ejecutar el SQL sobre PostgreSQL 17+, comprobar los triggers y restricciones con datos de prueba, y verificar autenticación/CSRF, persistencia, revocación, concurrencia y las siguientes funcionalidades del MVP.

La instalación ha informado de 16 avisos moderados transitivos en las herramientas de Angular CLI (`glob`/`minimatch` y sus dependientes), sin avisos altos ni críticos en ese análisis. La corrección automática propuesta cambia Angular CLI a una versión anterior incompatible; no se ha aplicado `npm audit fix --force`. Revisar las actualizaciones compatibles antes de publicar.
