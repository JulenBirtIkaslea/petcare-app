# Guía de cambios para agentes

## Recorridos rápidos

| Cambio | Archivos/pasos principales |
| --- | --- |
| Campo nuevo de mascota | SQL → modelo/`ValidarMascota` → controlador → `MascotaApi` → `campos-mascota.ts`/ficha → demo → pruebas → diccionario |
| Pantalla nueva | `features/<area>/` → ruta diferida con guard → menú si procede → traducciones → mapa frontend |
| Endpoint nuevo | `routes/api.php` → controlador → política/servicio → validación → tests backend → `ServicioApi`/pantalla → demo si aplica → API.md |
| Cambiar permisos | `MascotaPolicy`, `ServicioAcceso`, `ServicioPropiedad` → controladores → SQL → capacidades frontend → demo → pruebas con distintos usuarios |
| Cambiar inicio/cierre | `ControladorSesion`, `ComprobarSesion` → `ServicioAplicacion`/guard → `AccesoComponent` → demo y pruebas de navegación |
| Cambiar pauta/dosis | `ServicioTratamientos`, `GeneradorDosis` → versiones/resoluciones SQL → `campos-tratamiento.ts` y componente → simulación local y pruebas de fechas |
| Idioma o texto | Componente + `shared/i18n/eu.ts`; revisar `ServicioIdioma` si cambia el comportamiento de idioma |
| Modificar calendario | `ControladorCalendario`/`ControladorAgenda` → tipo `Evento` → componente → exportación → demo |

## Secuencia de trabajo

1. Delimitar el comportamiento observable, leer su mapa y localizar la ruta que lo activa.
2. Seguir la llamada del componente al adaptador y, si aplica, del endpoint al servicio/modelo.
3. Comprobar permisos, errores, valores nulos, fechas y comportamiento sin datos.
4. Editar el contrato y sus consumidores de manera coherente; documentar diferencias intencionadas entre demo y API.
5. Probar el caso correcto y los fallos relevantes. Para permisos: propietario, ayudante y usuario sin acceso. Para sesión: credencial incorrecta, recarga, cierre y URL privada.
6. Compilar, ejecutar las pruebas pertinentes y actualizar documentación con resultados reales.

## Fuente de verdad por pregunta

| Pregunta | Fuente |
| --- | --- |
| ¿Existe una página? | `frontend/src/app/app.routes.ts` |
| ¿Existe un endpoint? | `backend/routes/api.php` y `php artisan route:list --path=api` |
| ¿Qué valida el servidor? | Controlador, servicios, política y restricciones SQL |
| ¿Cuál es el tipo almacenado? | `database/sql/01_crear_esquema.sql` |
| ¿Es demo o API? | Configuración Angular seleccionada y `src/environments/` |
| ¿La función está probada con PostgreSQL? | Suite ejecutada y `doc/VALIDACION.md`, no solo existencia de tests |

## Deuda y límites conocidos

- Algunas pantallas existentes concentran plantilla y lógica en líneas extensas; evitar reformatear todo el proyecto al corregir una función.
- El modelo `TransferenciaPropiedad` y la pantalla histórica de papelera no representan funcionalidades activas del flujo actual.
- El diccionario de euskera usa respaldo castellano para claves ausentes; ese respaldo evita roturas, pero no sustituye añadir traducciones.
- El adaptador local es una simulación; cambios en validaciones o reglas del backend deben revisarse también en él.
- Recuperación por correo, notificaciones externas, concurrencia entre clientes reales y despliegue requieren tareas específicas.

## Búsquedas acotadas

```text
rg -n "inicio-sesion|cierre-sesion" frontend/src backend/routes backend/app
rg -n "permiso|authorize|propietario" backend/app frontend/src/app/features
rg -n "CREATE TABLE|FOREIGN KEY|CHECK" database/sql/01_crear_esquema.sql
rg --files frontend/src/app -g '*.spec.ts'
rg --files backend/tests
```

Evitar búsquedas desde la raíz sin excluir `.cache`, `node_modules`, `vendor` y compilados: pueden ocultar los resultados útiles entre cientos de miles de entradas.
