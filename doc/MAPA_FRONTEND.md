# Mapa del frontend

Raíz: `frontend/`. Entrada: `src/main.ts` → `app.config.ts` → `app.ts` → `app.routes.ts`. Todos los paths de este documento son relativos a `frontend/src/app/`, salvo indicación.

## Rutas y pantallas

| Ruta | Componente | Responsabilidad |
| --- | --- | --- |
| `/acceso` | `features/auth/acceso.component.ts` | Inicio de sesión, registro, credenciales demo, recordar y mostrar contraseña |
| `/inicio` | `features/dashboard/inicio.component.ts` | Resumen de mascotas, cuidados próximos y tratamientos activos |
| `/mascotas` | `features/pets/lista-mascotas.component.ts` | Listado, búsqueda por nombre/especie y accesos a alta/códigos |
| `/mascotas/nueva` | `features/pets/formulario-mascota.component.ts` | Alta con validación de campos |
| `/mascotas/:id` | `features/pets/detalle-mascota.component.ts` | Ficha, edición, foto, eliminación y auditoría |
| `/historial` | `features/veterinary-history/historial.component.ts` | Consulta, vacuna, desparasitación, alergia y próxima actuación |
| `/tratamientos` | `features/treatments/tratamientos.component.ts` | Pautas/versiones, dosis, resolución/corrección y cierre |
| `/calendario` | `features/calendar/calendario.component.ts` | Agenda/mes, filtros, citas/tareas, resolución y exportación CSV |
| `/colaboradores` | `features/collaboration/colaboradores.component.ts` | Códigos, aceptación, propietarios/ayudantes y revocación |
| `/cuenta` | `features/auth/cuenta.component.ts` | Perfil, contraseña, eliminación y administración de datos demo |
| `/ayuda` | `features/help/ayuda.component.ts` | Primeros pasos y preguntas frecuentes con enlaces a cada módulo |
| Otras | `shared/components/no-encontrado.component.ts` | Página no encontrada |

La ruta raíz redirige a `/inicio`; las rutas privadas comparten `canActivateChild: [sesionGuard]`. `EstructuraComponent` contiene menú, idioma, perfil y cierre de sesión. `features/pets/papelera.component.ts` es un archivo histórico sin ruta activa; no anunciar una papelera basándose en su existencia.

En móvil (hasta 760 px), el botón Menú despliega la navegación en dos columnas. Expone `aria-expanded`/`aria-controls`, se cierra al elegir un enlace y con Escape devuelve el foco al botón. En escritorio permanece la barra lateral. La búsqueda de mascotas distingue lista vacía de ausencia de coincidencias y permite limpiar el filtro.

## Servicios y contratos

| Archivo | Uso |
| --- | --- |
| `core/services/servicio-aplicacion.ts` | Usuario, estado de conexión, mascotas, especies, mascota seleccionada, inicialización y cierre |
| `core/services/servicio-api.ts` | Entrada común `get<T>` y `enviar<T>`, delegación demo o HTTP, CSRF y mensajes de error |
| `core/services/servicio-demo-local.ts` | Simulación local persistente de las operaciones, sesión demo, exportación y restablecimiento |
| `core/services/demo-local-datos.ts` | Estructura de almacenamiento y datos iniciales de la demostración |
| `core/services/servicio-idioma.ts` | Idioma reactivo, persistencia de preferencia y título del documento |
| `core/guards/sesion.guard.ts` | Redirección al acceso si no hay usuario, conservando la ruta de vuelta |
| `shared/models/api.ts` | Tipos Usuario, MascotaApi, RegistroSanitario, Tratamiento, Dosis, Evento, Codigo y Auditoria; utilidades de fechas |
| `shared/utils/exportar-agenda.ts` | CSV de eventos visibles; escapa celdas y neutraliza fórmulas |

`ServicioAplicacion.conectado()` expresa que el adaptador elegido está disponible y hay un usuario; no significa necesariamente que exista conexión a un servidor.

## Componentes reutilizables

| Archivo en `shared/components/` | Contrato y función |
| --- | --- |
| `pagina-api.ts` | Clase base con `app`, `api`, `router`, signals de estado y `ejecutar()` |
| `formulario-campos.component.ts` | Campos declarativos, valores, ocupado, eventos guardar/cancelar; tipos y validación nativa |
| `estado-pagina.component.ts` | Mensajes de carga, error y éxito |
| `selector-mascota.component.ts` | Selección compartida de mascota y evento cambio |
| `no-encontrado.component.ts` | Recuperación de navegación desde una URL inexistente |

Definiciones de campos: `features/pets/campos-mascota.ts`, `features/veterinary-history/campos-historial.ts`, `features/treatments/campos-tratamiento.ts`. Antes de añadir otro formulario, revisar estas estructuras.

## Flujo de una modificación

1. El componente prepara `DatosFormulario` y usa `PaginaApi.ejecutar()`.
2. Convierte fechas/identificadores según el contrato y llama a `ServicioApi`.
3. El adaptador devuelve datos o un error HTTP; los mensajes se muestran en `EstadoPaginaComponent`.
4. La pantalla recarga la lista pertinente. Si cambia la ficha, `ServicioAplicacion.recargarMascotas()` actualiza los selectores globales.

Los permisos de botones se basan en `permiso === 'propietario'` y campos de capacidades devueltos por el adaptador. Cualquier endpoint nuevo debe verificar permisos también en Laravel.

## Configuración y presentación

- `frontend/angular.json`: builds production/development/api, rutas de recursos y presupuestos de compilación.
- `frontend/src/environments/`: selección explícita de modo.
- `frontend/proxy.conf.json`: `/api/**` y `/sanctum/**` → `http://127.0.0.1:8000` en desarrollo.
- `frontend/src/styles.css`: diseño compartido, paneles, formularios, calendario y adaptación a móvil.
- `shared/i18n/eu.ts`: diccionario castellano → euskera. Los pipes `traducir` y `fechaLocalizada` aplican la preferencia.
- `frontend/package-lock.json`: versiones fijadas para `npm ci`.

## Pruebas

Fixtures API: `testing/datos-prueba.ts`. Suites de pantallas junto a `features/` y `layouts/`; suites de servicios/utilidades junto a su implementación. Los tests que sustituyen `ServicioApi` comprueban UI y navegación, no conectividad ni políticas de PostgreSQL. Añadir tests del adaptador cuando se cambien sus validaciones, persistencia o permisos.
