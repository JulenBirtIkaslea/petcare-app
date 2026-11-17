# Contrato de la API Laravel

Fuente: `backend/routes/api.php` y sus controladores/servicios. Revisión: 17 de noviembre de 2026. Prefijo de las rutas de las tablas: `/api`. La API real usa PostgreSQL y cookies; el modo de prueba local del frontend no crea usuarios ni datos en ella.

## Convenciones

Enviar `Accept: application/json` y, salvo fotografías, JSON. Antes de una escritura, obtener la cookie con `GET /sanctum/csrf-cookie`; enviar cookies y cabecera `X-XSRF-TOKEN`. El proxy Angular evita mezclar orígenes. No se requieren tokens personales ni cabecera Bearer.

Todas las rutas salvo `/estado` exigen BD habilitada. Registro e inicio son públicos; las demás requieren `auth:sanctum` y una sesión vigente. En las tablas: **sesión** significa usuario autenticado, **lectura** significa propietario o ayudante de la mascota, **propietario** incluye copropietarios. Un ID de mascota no accesible devuelve 404.

Altas: normalmente 201; lecturas y modificaciones: 200; operaciones sin contenido: 204. Las colecciones son arrays salvo calendario (`{eventos, limitado}`), colaboradores (`{propietario, colaboradores}`) y auditoría (paginador Laravel con 30 filas/página). Fechas de calendario sanitario: `YYYY-MM-DD`; instantes: ISO 8601 con zona, preferiblemente UTC; el usuario/mascota/versiones mantienen su zona IANA.

Límite general: 180 peticiones/minuto. Límite adicional de cinco/minuto para registro, inicio, cambio de contraseña, eliminación de mascota, generación de códigos y consulta/aceptación de códigos. No asumir que todos los endpoints comparten exactamente el mismo contador.

## Estado y cuenta

| Método | Ruta | Acceso | Entrada y resultado |
| --- | --- | --- | --- |
| GET | `/estado` | Público, sin BD | `{aplicacion, estado, base_de_datos_habilitada}` |
| POST | `/registro` | Público | `nombre`, `correo`, `contrasena`, `contrasena_confirmation`; 201 `{usuario}` y abre sesión |
| POST | `/inicio-sesion` | Público | `correo`, `contrasena`; devuelve usuario y regenera sesión |
| POST | `/cierre-sesion` | Sesión | Invalida sesión y regenera CSRF; 204 |
| GET | `/yo` | Sesión | Usuario actual, sin contraseña/token/hash/versión de sesión |
| PATCH | `/yo` | Sesión + contraseña | `nombre`, `correo`, `zona_horaria`, `contrasena_actual`; devuelve usuario |
| POST | `/contrasena` | Sesión + contraseña | `contrasena_actual`, `contrasena`, `contrasena_confirmation`; incrementa versión de sesión y conserva la sesión actual; 204 |
| DELETE | `/yo` | Sesión + contraseña | `contrasena_actual`; 409 si conserva propiedades; anonimiza cuenta, revoca colaboraciones, desasigna tareas y cierra sesión; 204 |

El login real exige correo válido; `prueba` es únicamente el identificador del modo local. Registro y contraseña nueva exigen al menos diez caracteres, letras y números. Correo normalizado a minúsculas y sin espacios exteriores; debe ser único.

```json
{"correo":"persona@example.test","contrasena":"UnaClaveDeEjemplo123."}
```

Ejemplo de cuerpo para registro: añadir `nombre: "Persona de ejemplo"` y `contrasena_confirmation` idéntica. Estos valores no son una cuenta existente.

## Mascotas, imágenes y auditoría

| Método | Ruta | Acceso | Entrada y resultado |
| --- | --- | --- | --- |
| GET | `/especies` | Sesión | Catálogo habilitado ordenado por ID |
| GET | `/mascotas` | Sesión | Array de mascotas accesibles ordenadas por nombre |
| POST | `/mascotas` | Sesión | Ficha validada; propietario y creador se asignan en servidor; 201 |
| GET | `/mascotas/{mascota}` | Lectura | Ficha con `especie`, `permiso`, `numero_propietarios`, `foto_url` |
| PUT/PATCH | `/mascotas/{mascota}` | Propietario | Campos de ficha; se combinan con el registro existente y se revalidan |
| DELETE | `/mascotas/{mascota}` | Propietario + contraseña | `contrasena_actual`; salida propia o borrado definitivo del último propietario; 204 |
| GET | `/mascotas/{mascota}/fotografia` | Lectura | Archivo privado; `Cache-Control: private, no-store`; 404 si no existe |
| POST | `/mascotas/{mascota}/fotografia` | Propietario | `multipart/form-data`, campo `fotografia`; JPG/JPEG/PNG/WebP, máximo 5120 KB y 10000×10000; devuelve ficha |
| DELETE | `/mascotas/{mascota}/fotografia` | Propietario | Retira referencia y archivo; 204 |
| GET | `/mascotas/{mascota}/auditoria?page=1` | Propietario | Paginador, autor y snapshots JSON; 30 filas por página |

Cuerpo mínimo de creación conforme a `ValidarMascota` (los defaults SQL no sustituyen campos requeridos por HTTP):

```json
{
  "nombre": "Luna",
  "especie_id": 1,
  "precision_nacimiento": "desconocida",
  "esterilizacion": "desconocido",
  "zona_horaria": "Europe/Madrid"
}
```

El ID 1 sólo ilustra una especie existente; consultar `/especies`, sin asumir IDs. Opcionales: `otra_especie`, `raza`, `sexo`, componentes del nacimiento, `peso_actual_kg`, `microchip`, `color_caracteristicas`, `observaciones`. La especie `otra` exige `otra_especie`. El nacimiento admite `exacta`, `mes_anio`, `anio`, `desconocida`; los componentes no aplicables deben ser nulos. Peso positivo, fechas reales y no futuras.

Al eliminar: con otros propietarios conserva mascota/historial y retira al solicitante; si era el anclaje, reasigna otro. Sin otros propietarios elimina físicamente mascota, dependencias, auditoría y fotografía. La contraseña es obligatoria en ambos casos. No hay endpoint de restauración.

## Historial veterinario

`{tipo}` es `consultas`, `vacunas`, `desparasitaciones` o `alergias`.

| Método | Ruta | Acceso | Entrada y resultado |
| --- | --- | --- | --- |
| GET | `/mascotas/{mascota}/historial?tipo=vacunas` | Lectura | Filtro opcional; lista cronológica descendente con `clase`, `fecha`, `titulo`, `autor`, `puede_editar` |
| POST | `/mascotas/{mascota}/historial/{tipo}` | Propietario | Datos sanitarios; 201 registro |
| PATCH | `/mascotas/{mascota}/historial/{tipo}/{registro}` | Propietario | Cambios + `motivo_correccion`; revalida registro combinado y audita |
| DELETE | `/mascotas/{mascota}/historial/{tipo}/{registro}` | Propietario | `motivo_correccion`; borrado lógico con autor; 204 |
| POST | `/mascotas/{mascota}/historial/{tipo}/{registro}/siguiente` | Propietario | Sólo vacunas/desparasitaciones: nueva administración y enlace a la anterior; 201 |

| Tipo | Requeridos | Opcionales |
| --- | --- | --- |
| consultas | `motivo`, `fecha_consulta` | `clinica_veterinario`, `diagnostico`, `recomendaciones`, `observaciones` |
| vacunas | `nombre`, `fecha_administracion` | `proxima_dosis_fecha`, `clinica_veterinario`, `numero_lote`, `observaciones` |
| desparasitaciones | `producto`, `fecha_aplicacion`, `tipo` (`interna`, `externa`, `ambas`) | `proxima_aplicacion_fecha`, `observaciones` |
| alergias | `alergeno` | `fecha_deteccion`, `tipo`, `sintomas`, `gravedad` (`leve`, `moderada`, `grave`), `observaciones` |

```json
{"nombre":"Vacuna de ejemplo","fecha_administracion":"2026-10-01","proxima_dosis_fecha":"2027-10-01","observaciones":"Registro ficticio para probar el formulario."}
```

Las actuaciones realizadas no admiten fecha futura en la zona de la mascota. La previsión debe ser posterior a la actuación. `siguiente` exige previsión pendiente; la nueva actuación no puede ser anterior a la original y marca `prevision_atendida_en`. Si ya se atendió, no se puede cambiar su fecha de previsión. Motivos de corrección/eliminación: hasta 1000 caracteres. No se generan recomendaciones médicas.

## Tratamientos y dosis

| Método | Ruta | Acceso | Entrada y resultado |
| --- | --- | --- | --- |
| GET | `/mascotas/{mascota}/tratamientos` | Lectura | Array con `versiones` y `version_actual` |
| POST | `/mascotas/{mascota}/tratamientos` | Propietario | `nombre`, `tipo` (`medicamento`/`cuidado`) y pauta; 201 |
| PATCH | `/mascotas/{mascota}/tratamientos/{tratamiento}` | Propietario | `nombre`, `motivo_cambio` y pauta completa; cierra versión anterior y crea otra |
| POST | `/mascotas/{mascota}/tratamientos/{tratamiento}/cerrar` | Propietario | `estado` (`finalizado`/`cancelado`) y `motivo`; 204 |
| GET | `/mascotas/{mascota}/tratamientos/{tratamiento}/dosis?desde=2026-11-01&hasta=2026-11-30` | Lectura | Dosis calculadas con resolución opcional |
| POST | `/mascotas/{mascota}/tratamientos/{tratamiento}/dosis` | Propietario | Resolución de una ocurrencia válida; 201 |
| PATCH | `/mascotas/{mascota}/tratamientos/{tratamiento}/dosis/{dosis}` | Propietario | Corrección de resolución + `motivo_correccion` |

Pauta: `indicaciones`, `fecha_inicio`, `tipo_frecuencia`; opcionales `fecha_fin`, `cantidad`, `unidad`, `prescriptor`, `observaciones`. Los medicamentos exigen cantidad positiva y unidad. Frecuencias:

| Frecuencia | Campos adicionales |
| --- | --- |
| diaria | `horarios`, array de 1–24 horas `HH:mm` distintas |
| dias_semana | `horarios` y `dias_semana`, enteros ISO 1–7 distintos |
| cada_horas | `intervalo_horas` (1–720), `hora_inicio`; el servidor calcula `ancla_en` |
| unica | Un horario y `fecha_fin` igual a `fecha_inicio` |

```json
{"nombre":"Cepillado","tipo":"cuidado","indicaciones":"Cepillado de ejemplo","fecha_inicio":"2026-11-17","tipo_frecuencia":"diaria","horarios":["19:00"]}
```

El listado calcula `estado=finalizado` cuando ya pasó la fecha final aunque no haya una escritura de cierre. Modificar una pauta no cambia el pasado: crea versión con vigencia desde el instante actual. Un tratamiento cerrado no admite edición; dosis futuras ya resueltas pueden bloquear el cambio de pauta con 409.

Resolución: `version_tratamiento_id`, `fecha_hora_programada`, `estado` (`administrada`/`omitida`). Para administrada: `fecha_hora_real` no futura; si es medicamento, `cantidad_real` y `unidad_real`. Opcionales: `realizado_por_usuario_id` con acceso a la mascota o `realizado_por_nombre`, `observaciones`, `motivo_omision`. Si no se especifica ejecutor, usa al usuario conectado. Para omitida, se anulan instante/cantidad/unidad y ejecutor. No enviar una `dosis_clave` inventada: el servidor valida la ocurrencia contra la pauta y calcula su clave.

## Agenda y calendario

En agenda, `{tipo}` es `citas` o `tareas`.

| Método | Ruta | Acceso | Entrada y resultado |
| --- | --- | --- | --- |
| GET | `/mascotas/{mascota}/agenda/{tipo}` | Lectura | Array de eventos no eliminados, ordenados por fecha |
| POST | `/mascotas/{mascota}/agenda/{tipo}` | Propietario | Título/fecha y opcionales; 201 |
| PATCH | `/mascotas/{mascota}/agenda/{tipo}/{registro}` | Propietario | Datos completos requeridos; sólo evento pendiente/programado |
| DELETE | `/mascotas/{mascota}/agenda/{tipo}/{registro}` | Propietario | `motivo`; borrado lógico y auditoría; 204 |
| POST | `/mascotas/{mascota}/agenda/{tipo}/{registro}/resolver` | Propietario | `estado`; citas: `realizada`/`cancelada`; tareas: `completada`/`cancelada` |
| GET | `/calendario?desde=2026-11-01&hasta=2026-11-30` | Sesión | Eventos de mascotas accesibles y bandera `limitado` |

Citas: `titulo`, `fecha_hora_inicio`; opcionales `descripcion`, `lugar`. Tareas: `titulo`, `fecha_hora_programada`; opcionales `descripcion`, `responsable_id` (debe ser propietario). Una cita resuelta puede enlazar `consulta_veterinaria_id` de la misma mascota. Los eventos cerrados no se vuelven a resolver.

```json
{"titulo":"Revisión anual","fecha_hora_inicio":"2026-12-01T09:00:00Z","lugar":"Clínica de ejemplo"}
```

Calendario y dosis exigen `desde`/`hasta`, ambos días incluidos para el usuario, máximo 93 días. Filtros de calendario: `mascota_id`, `tipo` (`cita`, `tarea`, `vacuna`, `desparasitacion`, `dosis`), `incluir_atrasados` booleano (en query, usar `0`/`1`; por defecto verdadero). Devuelve hasta 5000 eventos. Los atrasados de citas/tareas/previsiones pueden preceder al intervalo; las dosis se calculan en la ventana indicada. Campos de evento: `clave`, `id`, `mascota_id`, `mascota_nombre`, `tipo`, `titulo`, `fecha`, `instante`, `estado`, `datos`, `puede_editar`, `puede_resolver`.

## Compartir

| Método | Ruta | Acceso | Entrada y resultado |
| --- | --- | --- | --- |
| GET | `/mascotas/{mascota}/colaboradores` | Lectura | `{propietario, colaboradores}`; anclaje y accesos activos |
| GET | `/mascotas/{mascota}/codigos` | Propietario | Metadatos; no devuelve el código original |
| POST | `/mascotas/{mascota}/codigos` | Propietario + contraseña | `permiso` y `contrasena_actual`; 201 `{id, codigo, permiso, caduca_en}` |
| DELETE | `/mascotas/{mascota}/codigos/{codigo}` | Propietario | Cancela código no utilizado/cancelado; 204 |
| POST | `/compartir/consultar` | Sesión | `codigo`; nombre de mascota, permiso y caducidad, sin consumirlo |
| POST | `/compartir/aceptar` | Sesión | `codigo`; consume invitación y devuelve `mascota_id`, `nombre`, `permiso` |
| DELETE | `/mascotas/{mascota}/colaboradores/{usuario}` | Propietario, o ayudante que sale | Revoca sólo ayudante; desasigna tareas; 204 |

Roles válidos: `propietario`, `ayudante`. Un propietario no puede retirar a otro. El ayudante puede aceptar una invitación de propietario. Los códigos tienen 16 caracteres alfanuméricos sin caracteres ambiguos, agrupados con guiones; la comparación normaliza mayúsculas, espacios y guiones. Caducidad de 20 minutos, uso único y máximo diez vigentes por mascota. La consulta no concede acceso. La respuesta con código tiene `Cache-Control: no-store`; el listado nunca permite recuperarlo.

## Errores

| HTTP | Caso |
| --- | --- |
| 401 | Sin sesión, cuenta eliminada o versión de sesión caducada |
| 403 | Rol insuficiente o intento de revocar propietario |
| 404 | Recurso inexistente/no accesible; tipo sanitario o de agenda desconocido |
| 409 | Conflicto: duplicado, evento cerrado, previsión ya atendida, propiedad pendiente al eliminar cuenta, etc. |
| 419 | Cookie/token CSRF ausente o caducado; obtener nueva cookie antes de reintentar |
| 422 | Validación, contraseña incorrecta, código inválido/caducado o restricciones de datos |
| 429 | Límite de peticiones |
| 503 | BD deshabilitada (`BD_NO_CONFIGURADA`) o conexión reconocida como no disponible (`BD_NO_DISPONIBLE`) |

```json
{"message":"Los datos proporcionados no son válidos.","errors":{"correo":["Las credenciales no son correctas."]}}
```

El texto exacto puede depender de la excepción/traducción. La BD deshabilitada usa `{mensaje, codigo}`. Los consumidores deben tratar el estado HTTP y los campos estructurados, no comparar el texto completo. Consultar [mapa del backend](MAPA_BACKEND.md) para pruebas y [diccionario SQL](BASE_DE_DATOS.md) para restricciones. Este inventario verifica el código; no afirma que se haya ejecutado la integración PostgreSQL.
