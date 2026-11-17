# 06 · Contrato inicial de API REST

> **Estado:** inventario de recursos aceptado a nivel de plan; rutas y formatos concretos son un borrador a validar entre Angular, BBDD y backend.  
> **Idioma:** rutas de negocio, propiedades de JSON y nombres de recursos en **castellano**. Las cabeceras HTTP y convenciones estándar conservan su forma técnica.

## 1. Convenciones

- Prefijo: `/api`.
- Formato de intercambio: JSON UTF-8, salvo subida de imagen.
- Autenticación: sesión segura mediante Laravel Sanctum para SPA (**propuesta**).
- IDs enteros estables, fechas `AAAA-MM-DD`, instantes ISO 8601 con zona horaria.
- Paginación en listados; respuesta uniforme de error; `422` para errores de campos.
- Códigos estándar: `200` consulta, `201` creación, `204` eliminación/cambio sin cuerpo, `401`, `403`, `404`, `409`, `422`.
- Ocultar recursos sin autorización; comprobar propiedad/autoría en todas las rutas.
- Preferir verbos HTTP (`GET`, `POST`, `PATCH`, `DELETE`) y rutas de recursos en plural.

## 2. Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/registro` | Crear usuario |
| `POST` | `/api/inicio-sesion` | Iniciar sesión |
| `POST` | `/api/cierre-sesion` | Cerrar sesión |
| `GET` | `/api/yo` | Identidad actual y estado de verificación |
| `POST` | `/api/recuperacion-contrasena` | Solicitar recuperación |
| `POST` | `/api/restablecimiento-contrasena` | Establecer nueva contraseña |
| `POST` | `/api/verificacion-correo` | Iniciar/reiterar verificación (diseño pendiente) |

> Las rutas exactas de verificación y recuperación dependerán de la implementación de seguridad elegida. No exponer tokens en logs.

## 3. Mascotas

| Método | Ruta | Permiso |
|---|---|---|
| `GET` | `/api/mascotas` | Usuario: solo mascotas accesibles |
| `POST` | `/api/mascotas` | Usuario autenticado; será propietario |
| `GET` | `/api/mascotas/{id}` | Propietario/editor/lector |
| `PATCH` | `/api/mascotas/{id}` | Propietario |
| `POST` | `/api/mascotas/{id}/fotografia` | Propietario |
| `DELETE` | `/api/mascotas/{id}` | Propietario; papelera |
| `GET` | `/api/papelera` | Mascotas borradas del propietario |
| `POST` | `/api/mascotas/{id}/restaurar` | Propietario |
| `GET` | `/api/especies` | Autenticado |

### Ejemplo: crear mascota

`POST /api/mascotas`

```json
{
  "nombre": "Khea",
  "especie_id": 1
}
```

Si se selecciona la especie «Otra», se añade `otra_especie` con texto válido. La fotografía se puede subir después mediante `multipart/form-data`.

**Respuesta `201`:**

```json
{
  "id": 42,
  "nombre": "Khea",
  "especie": { "id": 1, "nombre": "Perro" },
  "propietario_id": 7,
  "precision_nacimiento": "desconocida",
  "foto_url": null,
  "eliminado_en": null
}
```

### Ejemplo: nacimiento aproximado

`PATCH /api/mascotas/42`

```json
{
  "precision_nacimiento": "mes_anio",
  "anio_nacimiento": 2021,
  "mes_nacimiento": 4,
  "dia_nacimiento": null
}
```

## 4. Historial veterinario

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/api/mascotas/{id}/historial` | Cronología unificada y filtrable |
| `GET/POST` | `/api/mascotas/{id}/consultas` | Consultar/crear consulta |
| `GET/POST` | `/api/mascotas/{id}/vacunas` | Consultar/crear vacuna |
| `GET/POST` | `/api/mascotas/{id}/desparasitaciones` | Consultar/crear desparasitación |
| `GET/POST` | `/api/mascotas/{id}/alergias` | Consultar/crear alergia |
| `PATCH/DELETE` | `/api/consultas/{id}` | Corregir/eliminar lógicamente |
| `PATCH/DELETE` | `/api/vacunas/{id}` | Corregir/eliminar lógicamente |
| `PATCH/DELETE` | `/api/desparasitaciones/{id}` | Corregir/eliminar lógicamente |
| `PATCH/DELETE` | `/api/alergias/{id}` | Corregir/eliminar lógicamente |
| `POST` | `/api/vacunas/{id}/registrar-siguiente` | Crear nueva dosis y atender previsión |
| `POST` | `/api/desparasitaciones/{id}/registrar-siguiente` | Crear nueva aplicación y atender previsión |

`GET /api/mascotas/42/historial?tipo=vacuna&pagina=1`

Respuesta de ejemplo:

```json
{
  "datos": [
    {
      "tipo": "vacuna",
      "id": 51,
      "mascota_id": 42,
      "titulo": "Vacuna polivalente",
      "fecha": "2026-09-15",
      "proxima_fecha": "2027-09-15",
      "autor": { "id": 7, "nombre": "Usuario de ejemplo" }
    }
  ],
  "pagina": 1,
  "total": 1
}
```

**Conflictos:** alergia duplicada -> `409` o `422` con código interno documentado; previsión atendida anteriormente -> `409`.

**Correcciones:** petición incluye `motivo_correccion` y cambios; el backend conserva valores anteriores en auditoría.

## 5. Colaboración

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/api/mascotas/{id}/colaboradores` | Listar colaboradores |
| `POST` | `/api/mascotas/{id}/invitaciones` | Generar enlace |
| `GET` | `/api/mascotas/{id}/invitaciones` | Invitaciones enviadas |
| `POST` | `/api/invitaciones/{token}/aceptar` | Aceptar con correo autorizado |
| `POST` | `/api/invitaciones/{token}/rechazar` | Rechazar |
| `POST` | `/api/invitaciones/{id}/cancelar` | Cancelar envío pendiente |
| `PATCH` | `/api/mascotas/{id}/colaboradores/{usuario_id}` | Cambiar permiso |
| `DELETE` | `/api/mascotas/{id}/colaboradores/{usuario_id}` | Revocar inmediatamente |
| `POST` | `/api/mascotas/{id}/abandonar` | Salir de colaboración |
| `POST` | `/api/mascotas/{id}/transferencias` | Solicitar transferencia |
| `POST` | `/api/transferencias/{id}/aceptar` | Aceptar transferencia |
| `POST` | `/api/transferencias/{id}/rechazar` | Rechazar transferencia |

> Los tokens no deben aparecer en informes de error, registros de servidor ni analíticas.

## 6. Tratamientos y dosis **[Propuesta]**

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/api/mascotas/{id}/tratamientos` | Listar |
| `POST` | `/api/mascotas/{id}/tratamientos` | Crear pauta |
| `GET` | `/api/tratamientos/{id}` | Detalle y versiones |
| `PATCH` | `/api/tratamientos/{id}` | Modificar datos permitidos |
| `POST` | `/api/tratamientos/{id}/versiones` | Nueva versión de pauta |
| `POST` | `/api/tratamientos/{id}/finalizar` | Finalizar |
| `POST` | `/api/tratamientos/{id}/cancelar` | Cancelar con motivo |
| `GET` | `/api/tratamientos/{id}/dosis` | Ocurrencias de una ventana |
| `POST` | `/api/tratamientos/{id}/administraciones` | Confirmar dosis |
| `POST` | `/api/tratamientos/{id}/omisiones` | Marcar dosis omitida |
| `PATCH` | `/api/resoluciones-dosis/{id}` | Corrección auditada |

### Ejemplo: confirmar una dosis

```json
{
  "version_tratamiento_id": 13,
  "fecha_hora_programada": "2026-10-20T21:00:00+02:00",
  "fecha_hora_real": "2026-10-20T21:05:00+02:00",
  "cantidad_real": 1,
  "unidad_real": "comprimido",
  "realizado_por_usuario_id": 7,
  "observaciones": "Administrado con comida"
}
```

El servidor calcula/valida la identidad de la ocurrencia, comprueba las autorizaciones y aplica restricción única. No confía en que Angular haya confirmado disponibilidad.

## 7. Calendario, citas y tareas **[Propuesta]**

| Método | Ruta | Acción |
|---|---|---|
| `GET` | `/api/calendario?desde=...&hasta=...&mascota_id=...` | Eventos unificados |
| `GET/POST` | `/api/mascotas/{id}/citas` | Listar/crear citas |
| `PATCH/DELETE` | `/api/citas/{id}` | Editar/cancelar o eliminar según regla |
| `POST` | `/api/citas/{id}/realizar` | Marcar realizada |
| `GET/POST` | `/api/mascotas/{id}/tareas` | Listar/crear tareas |
| `PATCH/DELETE` | `/api/tareas/{id}` | Editar/cancelar según permiso |
| `POST` | `/api/tareas/{id}/completar` | Completar con ejecutor |

Ejemplo de evento homogéneo:

```json
{
  "tipo": "proxima_vacuna",
  "origen_id": 51,
  "mascota_id": 42,
  "titulo": "Próxima vacuna polivalente",
  "inicio": "2027-09-15",
  "estado": "pendiente",
  "accion_disponible": "registrar_siguiente"
}
```

La respuesta es una **proyección** de los datos originales, no una tabla nueva de eventos persistidos.

## 8. Respuesta de error propuesta

```json
{
  "codigo": "VALIDACION",
  "mensaje": "Revisa los campos del formulario",
  "errores": {
    "nombre": ["El nombre es obligatorio"]
  }
}
```

Errores importantes: `ACCESO_DENEGADO`, `INVITACION_CADUCADA`, `DOSIS_YA_REGISTRADA`, `ALERGIA_DUPLICADA`, `MASCOTA_EN_PAPELERA`, `REGISTRO_NO_MODIFICABLE`.

## 9. Paginación, filtros y versiones

- Listados paginados mediante `pagina` y `limite`, con tope para evitar consultas excesivas.
- Fechas de calendario siempre acotadas a una ventana.
- Ordenación controlada por servidor, no SQL arbitrario desde peticiones.
- Si el contrato cambia sustancialmente, valorar prefijo `/api/v1`; no crear versionado de API innecesario antes del MVP.
- Documentar ejemplos de respuesta en un fichero OpenAPI cuando comience la implementación.

## 10. Acuerdos entre responsables

El integrante Angular y el de API acordarán **antes de cada módulo**: rutas, campos obligatorios, estados, respuestas y errores. El integrante de base de datos valida correspondencia de campos y relaciones.

[Índice](README.md) · [Arquitectura](05_ARQUITECTURA.md) · [Pruebas](09_PRUEBAS.md)
