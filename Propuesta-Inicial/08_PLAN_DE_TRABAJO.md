# 08 · Plan de trabajo, hitos y coordinación

> **Plan general aceptado:** 12 semanas orientativas. Ajustar a la fecha real de entrega y disponibilidad.  
> **Ramas GitHub:** únicamente `main` y `development`.  
> **Responsables principales:** A = Layout + BBDD; B = Angular; C = API + backend.

## 1. Metodología

- Dividir el trabajo en historias pequeñas y demostrables.
- Trabajar en `development`; reservar `main` para hitos estables.
- Usar GitHub Projects o tablero sencillo con: **Pendiente, En curso, En revisión, Terminado**.
- Reunión corta de coordinación dos o tres veces por semana; demostración al cierre de cada hito.
- Toda funcionalidad debe verificarse extremo a extremo: UI → API → BD.

## 2. Distribución principal

| Integrante | Trabajo principal | Colaboración esperada |
|---|---|---|
| A | Layout, estructura responsive, diseño de base de datos, migraciones | Acordar campos con C y componentes visuales con B |
| B | Angular, formularios, navegación, servicios de consumo API | Acordar contrato con C y usar layout de A |
| C | API Laravel, autenticación, políticas, servicios, transacciones | Revisar esquema con A y conectar endpoints con B |

No significa que A haga *todo* el CSS ni que C trabaje sin comprobar el frontend. Cada responsable mantiene el área, pero las integraciones son conjuntas.

## 3. Calendario de hitos

| Hito | Semanas | Entrega verificable |
|---|---|---|
| H1 · Definición | 1–2 | Requisitos, ERD, mockups, contrato inicial y repo |
| H2 · Base | 3–4 | Login, mascotas, layout y autorización básica |
| H3 · Colaboración/salud | 5–6 | Invitaciones, historial, roles y transferencia |
| H4 · Tratamientos | 7–8 | Pautas, dosis, correcciones y bloqueos de duplicados |
| H5 · Calendario | 9–10 | Agenda unificada, citas y tareas |
| H6 · Cierre | 11–12 | Pruebas, seguridad, despliegue, memoria y demo |

## 4. Tareas detalladas por hito

### H1 — Definición

**A (layout + BBDD):** crear mapa de pantallas, estilos base, ERD en castellano, convenciones de nombres, migraciones iniciales.  
**B (Angular):** preparar proyecto, rutas base, modelo de comunicación con API y componentes vacíos reutilizables.  
**C (backend):** preparar Laravel, conexión de BD, autenticación inicial, estructura de políticas y primera definición de API.

**Criterio de salida:** entorno local funciona, tres personas pueden ejecutar proyectos, contrato API de mascotas acordado.

### H2 — Inicio y mascotas

**A:** layout responsive y tablas de usuarios, especies, mascotas y fotografía.  
**B:** acceso/registro, lista, creación y ficha de mascota.  
**C:** endpoints, validaciones, permisos y subida privada de foto.

**Criterio:** una cuenta puede crear mascota; otra sin acceso no puede verla; edición y papelera funcionan.

### H3 — Colaboración e historial

**A:** esquema de invitaciones, colaboradores, transferencias y registros sanitarios.  
**B:** UI de colaboradores, invitaciones e historial.  
**C:** enlaces seguros, transferencias, API del historial y auditoría.

**Criterio:** lector/editor/propietario cumplen matriz de permisos y se puede atender una próxima vacuna.

### H4 — Tratamientos

**A:** tablas de tratamientos, versiones, resoluciones e índices únicos.  
**B:** formularios de pauta, detalle y registro de dosis.  
**C:** programación de dosis, comprobación de reglas, concurrencia y auditoría.

**Criterio:** pauta diaria y otra de frecuencia alternativa; registro duplicado rechazado; cambios preservan pasado.

### H5 — Calendario

**A:** refinar layout del calendario y modelos de citas/tareas.  
**B:** vista mensual/agenda, filtros, creación y finalización.  
**C:** API agregada que integra vacunaciones, desparasitaciones, tratamientos, citas y tareas.

**Criterio:** las previsiones sanitarias aparecen sin duplicación; tareas completadas registran ejecutor.

### H6 — Calidad y entrega

**A:** revisar responsive, accesibilidad y consistencia de BD; preparar diagramas.  
**B:** pruebas de UI/E2E, mensajes y errores, pulido visual.  
**C:** seguridad, pruebas backend, copias de seguridad y despliegue.

**Todos:** documentación final, capturas reales, guion de defensa y ensayo.

## 5. Historias prioritarias

1. **HU-01:** Como usuario quiero crear una mascota en pocos pasos.
2. **HU-02:** Como propietario quiero invitar a alguien con permisos concretos.
3. **HU-03:** Como lector quiero consultar el historial sin modificarlo.
4. **HU-04:** Como editor quiero registrar una vacuna administrada.
5. **HU-05:** Como propietario quiero corregir un registro conservando trazabilidad.
6. **HU-06:** Como cuidador quiero registrar una dosis sin duplicaciones.
7. **HU-07:** Como usuario quiero ver las actividades próximas en agenda.
8. **HU-08:** Como editor quiero completar una tarea que creó otro usuario.
9. **HU-09:** Como propietario quiero transferir una mascota con aceptación.
10. **HU-10:** Como propietario quiero restaurar una mascota desde papelera.

## 6. Política de GitHub con dos ramas

```text
main          → Entrega estable
   ↑
development   → Integración diaria (todos trabajan aquí)
```

- La rama base diaria será `development`.
- Commits pequeños con mensajes en castellano: `feat: añadir formulario de mascota`, `fix: validar permisos de vacunas`.
- Coordinar archivos compartidos mediante mensajes y revisiones puntuales.
- Fusionar `development` hacia `main` solo cuando pase CI y un compañero revise los cambios.
- Etiquetar entregas en `main` (`v0.1`, `v0.2`, ...), sin introducir ramas nuevas.
- Si dos personas tocan el mismo archivo, resolver conflictos de forma conjunta; no sobrescribir cambios.

## 7. Definición de terminado

Una tarea se considera terminada si:

- Cumple sus criterios de aceptación.
- Tiene validación de interfaz y de servidor si corresponde.
- Comprueba permisos y casos de error.
- Cuenta con pruebas relevantes.
- No rompe la ejecución local ni la integración de `development`.
- Se puede demostrar en una secuencia de acciones.
- Está documentada si cambia API, BD o reglas de negocio.

## 8. Gestión de riesgos

| Riesgo | Mitigación |
|---|---|
| Tratamientos demasiado complejos | Implementar primero frecuencia diaria, después otras; conservar alcance aprobado |
| Conflictos en `development` | Commits pequeños, coordinación y tocar áreas delimitadas |
| API e interfaz divergen | Acordar JSON antes de cada pantalla |
| Base de datos cambia demasiado tarde | Revisar ERD antes de migraciones finales |
| Falla autenticación/correo | Probar invitación desde H3, no dejar para el final |
| Calendario no integra registros | Endpoint unificado desde diseño inicial |
| Falta tiempo | Reducir adornos visuales, no seguridad ni integridad |

## 9. Entrega final

Repositorio reproducible, instalación documentada, base de datos migrable, demo desplegada (si es viable), manual técnico, mockups/capturas y guion para explicar arquitectura y pruebas.

[Índice](README.md) · [Pruebas](09_PRUEBAS.md) · [Estructura](07_ESTRUCTURA_PROYECTO.md)
