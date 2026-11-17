# 10 · Despliegue, configuración, privacidad y costes

> **Estado:** estrategia de despliegue aceptada como parte del plan general; proveedores y configuración final pendientes de verificación. **No se han verificado precios, planes ni disponibilidad actuales**; consultar los proveedores antes de contratar. No hay despliegue realizado con este documento.

## 1. Arquitectura de despliegue sugerida

| Componente | Opción sugerida | Observaciones |
|---|---|---|
| Frontend Angular | Cloudflare Pages | Publicar ficheros estáticos compilados |
| API Laravel | Railway | Servicio PHP accesible por HTTPS; configurar ejecución y tareas |
| Base de datos | PostgreSQL gestionado de Railway | Copias de seguridad y región elegida |
| Fotos | Almacenamiento privado compatible con S3 | Acceso a través de backend/autorización |
| Automatización | GitHub Actions | Construcción y tests de las dos partes |
| Correo de verificación | Proveedor transaccional a seleccionar | Solo autenticación/verificación; invitaciones se comparten manualmente |

Se puede sustituir un proveedor por otro si su coste o limitaciones resultan mejores. No depender de características exclusivas de un proveedor al desarrollar el núcleo.

## 2. Entornos

- **Local:** Angular y Laravel en equipo; PostgreSQL local o contenedor de desarrollo.
- **Pruebas/integración:** rama `development`, datos ficticios y configuraciones separadas de producción.
- **Demo/entrega:** rama `main`, acceso HTTPS, datos ficticios y copias de seguridad.

No conectar desarrollo a una base de datos de producción. No compartir credenciales entre entornos.

## 3. Variables de entorno

Ejemplos conceptuales, **sin valores reales**:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.ejemplo.test
DB_CONNECTION=pgsql
DB_HOST=...
DB_PORT=5432
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
SESSION_SECURE_COOKIE=true
```

Estas claves de configuración son nombres técnicos estándar de Laravel; **no son tablas ni campos de negocio**. Guardarlas como secretos del proveedor, nunca en Git.

También configurar: origen permitido de Angular, cookies/CSRF de Sanctum, correo, almacenamiento privado, zona horaria de negocio y claves criptográficas.

## 4. Publicación de Angular

1. Configurar URL pública de API por entorno (dato público, no un secreto).
2. Ejecutar pruebas y compilación de producción.
3. Publicar artefactos estáticos en hosting elegido.
4. Configurar fallback de rutas SPA.
5. Comprobar acceso a API, HTTPS y política de orígenes.

## 5. Publicación de Laravel

1. Preparar versión de PHP y extensiones compatibles.
2. Instalar dependencias de producción.
3. Definir secretos y claves de aplicación.
4. Configurar base de datos PostgreSQL, almacenamiento, sesión y correo.
5. Ejecutar **migraciones aprobadas** y cargar catálogo de especies.
6. Configurar servidor web para servir la API.
7. Configurar tareas programadas de Laravel: limpieza de papelera, finalizaciones previstas u otras.
8. Revisar logs, límites y estado de salud.

No ejecutar operaciones destructivas de migración automáticamente en producción sin revisar impacto y tener respaldo.

## 6. Fotografías privadas

- Subir a contenedor/bucket privado, no a una carpeta pública accesible permanentemente.
- Guardar únicamente una referencia en `mascotas.foto_ruta`.
- Comprobar permisos antes de entregar foto; URL firmada breve cuando proceda.
- Eliminar/reemplazar archivos huérfanos mediante proceso controlado.
- Aplicar límites de formato, tamaño y validación de contenido.

## 7. Copias de seguridad

- Programar backups de PostgreSQL y verificar que se pueden **restaurar**, no solo crear.
- Considerar respaldos/versionado del almacenamiento privado de fotos.
- Documentar ubicación, frecuencia y responsable.
- Mantener copias durante periodo definido y controlar su acceso.
- Alinear retención de backups y eliminación definitiva de datos según la política de privacidad.

## 8. Papelera y limpieza automática

- Una mascota eliminada lógicamente pasa a papelera con `eliminado_en`.
- La tarea programada selecciona mascotas cuyo plazo de 30 días ha vencido.
- Revalida que no fueron restauradas; impide carreras con otras operaciones.
- Aplica eliminación de datos relacionados y archivos conforme a política.
- Registra resultados y permite reintentar fallos de limpieza sin eliminar información de otras mascotas.

## 9. Costes

No se establece una tarifa numérica porque los precios y cuotas cambian. Estimar antes de la demo:

| Coste | Qué medir |
|---|---|
| Hosting de API | Tiempo activo, CPU, RAM y tráfico |
| PostgreSQL | Tamaño, almacenamiento y backups |
| Storage | Número de fotos, GB y transferencias |
| Correo | Verificaciones/recuperaciones enviadas |
| Dominio | Opcional; usar subdominios para demo |
| CI | Minutos de automatización y límites del plan |

**Objetivo orientativo:** gasto muy bajo durante la fase académica, pero no prometer gratuidad ni un importe hasta revisar el plan y los límites actuales.

## 10. Seguridad y normativa

- HTTPS obligatorio.
- Autenticación y autorización por mascota.
- Secretos protegidos en variables de entorno del proveedor.
- Cookies seguras y política de CORS/CSRF bien configurada.
- Limitación de intentos de inicio de sesión e invitaciones.
- Política de privacidad, información de responsables y derechos sobre datos personales, a redactar según el contexto real del proyecto.
- Plan para borrar/anonymizar cuentas y registros respetando obligaciones aplicables y autoría histórica necesaria.
- Nunca incluir datos privados reales en una demostración pública.

## 11. Lista de verificación de salida

- [ ] Se puede acceder por HTTPS.
- [ ] Frontend llama correctamente a la API.
- [ ] BD y migraciones coinciden con versión desplegada.
- [ ] No hay errores de CORS o cookie de sesión.
- [ ] Usuario no autorizado no accede a mascotas ni fotografías.
- [ ] Recuperación/verificación de correo funciona.
- [ ] La tarea programada se ejecuta en el entorno real.
- [ ] Existe un backup probado.
- [ ] Tests críticos pasan antes de fusionar a `main`.
- [ ] Demo utiliza datos ficticios.
- [ ] Se ha revisado el coste real de cada proveedor.

[Índice](README.md) · [Arquitectura](05_ARQUITECTURA.md) · [Pruebas](09_PRUEBAS.md)
