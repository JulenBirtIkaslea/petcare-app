# 09 · Estrategia de pruebas y criterios de aceptación

> **Objetivo:** demostrar que PetCare funciona correctamente en condiciones normales, errores y accesos no autorizados. Las pruebas funcionales se derivan del plan general aceptado; sus datos exactos y automatización se concretarán al implementar.

## 1. Niveles de prueba

| Nivel | Herramienta propuesta | Qué comprobar |
|---|---|---|
| Unitarias backend | PHPUnit o Pest | Normalización, fechas, reglas de dosis, servicios |
| Integración/API | PHPUnit o Pest | Autenticación, permisos, respuestas HTTP, DB |
| Unitarias frontend | Herramientas de Angular | Formularios, servicios, estados y filtros |
| E2E | Playwright | Flujos desde navegador hasta API y DB |
| Manuales | Navegador móvil/escritorio | Responsive, accesibilidad, UX y mensajes |

## 2. Datos de prueba

Preparar usuarios ficticios:

- **Usuario A:** propietario de mascota M1.
- **Usuario B:** editor de M1.
- **Usuario C:** lector de M1.
- **Usuario D:** sin acceso a M1.
- **Usuario E:** propietario de una mascota M2 distinta.

Mascotas y registros ficticios con vacunas futuras/pasadas, alergias, tratamientos, dosis y tareas. No usar datos reales de otras personas.

## 3. Casos de prueba prioritarios

### Seguridad y colaboración

| ID | Situación | Resultado esperado |
|---|---|---|
| PR-01 | Usuario D solicita ficha de M1 | No ve datos de M1 |
| PR-02 | Lector intenta editar ficha | `403` y ningún cambio en BD |
| PR-03 | Editor intenta modificar registro de A | Rechazado |
| PR-04 | Editor crea/edita su propio registro | Permitido |
| PR-05 | Propietario corrige registro ajeno | Permitido con auditoría y motivo |
| PR-06 | Editor ejecuta tarea de autor distinto | Permitido, sin modificar las instrucciones originales |
| PR-07 | Invitación aceptada desde otro correo | Rechazada |
| PR-08 | Token consumido o caducado | No puede reutilizarse |
| PR-09 | Transferencia aceptada | Exactamente un propietario, anterior editor |
| PR-10 | Revocación en mitad de una edición | Guardado posterior rechazado |
| PR-11 | Persona revocada intenta ver foto antigua por URL | Acceso denegado o URL expirada |

### Mascotas

| ID | Situación | Resultado esperado |
|---|---|---|
| PR-12 | Crear sin nombre o especie | `422`, mensajes claros |
| PR-13 | Crear mascota con especie «Otra» sin concretarla | Rechazado |
| PR-14 | Nacimiento solo año | Guardado sin día/mes inventados |
| PR-15 | Nacimiento futuro | Rechazado |
| PR-16 | Peso cero/negativo | Rechazado |
| PR-17 | Dos mascotas con mismo nombre | Permitido |
| PR-18 | Dos mascotas con mismo microchip | No bloquear por unicidad global |
| PR-19 | Imagen maliciosa o > 5 MB | Rechazada |
| PR-20 | Mascota a papelera | Deja de ser operativa y es restaurable |
| PR-21 | Restaurar antes de 30 días | Recupera ficha, relaciones e historial previstos |
| PR-22 | Cumplidos 30 días | Tarea de supresión aplica política y registra resultado |

### Historial veterinario

| ID | Situación | Resultado esperado |
|---|---|---|
| PR-23 | Consulta con fecha futura | Rechazada |
| PR-24 | Vacuna registrada con próxima dosis futura | Registro en historial y previsión en calendario |
| PR-25 | Próxima vacuna vencida | Permanece pendiente y aparece atrasada |
| PR-26 | «Registrar administración» de próxima vacuna | Nuevo registro, anterior intacto, previsión atendida |
| PR-27 | Dos intentos de atender la misma previsión | Solo una atención válida |
| PR-28 | Alergia «Pollo» y « pollo » misma mascota | Segundo alta bloqueada |
| PR-29 | Alergia igual en distinta mascota | Permitida |
| PR-30 | Corregir diagnóstico con motivo | Auditoría conserva antes/después/autor/fecha/motivo |
| PR-31 | Borrar lógicamente vacuna con previsión | No se muestra como pendiente activa |

### Tratamientos (propuesta)

| ID | Situación | Resultado esperado |
|---|---|---|
| PR-32 | Crear medicamento sin cantidad | Rechazado |
| PR-33 | Crear cuidado sin cantidad | Permitido si su clase lo admite |
| PR-34 | Tratamiento sin fecha final | Generación acotada de próximas dosis |
| PR-35 | Dos usuarios confirman misma dosis a la vez | Una resolución única; segundo recibe conflicto |
| PR-36 | Dosis confirmada fuera de horario | Guarda hora real y vínculo correcto |
| PR-37 | Modificar frecuencia | Crea versión nueva; conserva anteriores |
| PR-38 | Cancelar tratamiento | No genera próximas dosis, mantiene administradas |
| PR-39 | Dosis vencida sin confirmación | Atrasada, no administrada automáticamente |
| PR-40 | Marcar omitida | Registra omisión sin fingir administración |

### Calendario y tareas (propuesta)

| ID | Situación | Resultado esperado |
|---|---|---|
| PR-41 | Filtrar calendario por mascota | Solo sus eventos permitidos |
| PR-42 | Cambiar próxima dosis de vacuna | Calendario refleja nueva fecha |
| PR-43 | Completar tarea compartida ajena | Se registra ejecutor, no se altera autoría |
| PR-44 | Revocar responsable de tarea | Tarea sigue, responsable queda sin asignar |
| PR-45 | Cita realizada vinculada a consulta | Consulta asociada sin duplicar datos |

## 4. Pruebas de concurrencia e integridad

Especial atención a:

1. Dos usuarios aceptando la misma invitación.
2. Dos peticiones simultáneas de transferencia.
3. Dos intentos de crear la misma alergia normalizada.
4. Dos confirmaciones simultáneas de una dosis.
5. Revocación de permiso entre lectura y escritura.
6. Restauración y limpieza automática de una mascota al borde del plazo de 30 días.

El backend debe apoyarse en **transacciones y restricciones de PostgreSQL**. Las comprobaciones de frontend no bastan.

## 5. Seguridad

- Test de control de acceso en todos los endpoints de mascota.
- Test de que las respuestas no exponen hashes, tokens, credenciales ni datos de otras mascotas.
- Test de CSRF/sesión, expiración e inicio de sesión seguro.
- Test de subida de archivos: MIME real, tamaño, extensión, almacenamiento privado.
- Test de fuerza bruta con límite de intentos en login e invitaciones.
- Test de mensajes de error sin trazas o secretos.
- Comprobar que la API rechaza manipulación de `propietario_id` o `creado_por_id` desde el cliente.

## 6. Usabilidad y responsive

Probar en anchuras de móvil pequeño, móvil grande y escritorio; formularios con teclado, errores visibles, botones accesibles y textos legibles. Un caso E2E debe cubrir navegación desde login hasta registrar una vacuna y visualizar su próxima fecha.

## 7. Criterio de aceptación por módulo

| Módulo | Mínimo para considerarlo terminado |
|---|---|
| Mascotas | Alta, edición de propietario, foto, nacimiento variable, papelera/restauración |
| Historial | Cuatro registros, cronología, duplicados, auditoría, integración de próxima fecha |
| Colaboración | Invitación, lector/editor, transferencia, revocación y 403 correctos |
| Tratamientos | Pautas, programación, confirmación única, historial de acciones |
| Calendario | Fechas sanitarias y cuidados, citas/tareas, filtros básicos |

## 8. Evidencias para memoria/defensa

- Capturas de la interfaz real.
- Captura del ERD de PostgreSQL.
- Registros de ejecución de tests.
- Demostración de `403` para un editor o lector no autorizado.
- Demostración del `409` al repetir una dosis.
- Captura de un cambio auditado.
- Recuperación desde papelera.

## 9. Flujo para reproducir una incidencia

Anotar: entorno, usuario/rol, mascota, pasos, resultado esperado, resultado real, respuesta API y captura (sin secretos). Crear incidencia en GitHub; corregir en `development`; añadir prueba de regresión cuando sea posible.

[Índice](README.md) · [Requisitos](02_REQUISITOS_FUNCIONALES.md) · [Plan](08_PLAN_DE_TRABAJO.md)
