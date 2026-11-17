# PetCare — Documentación del proyecto DAW

> **Estado:** primera versión integral del **plan maestro aceptado**, incorporando los tres cambios solicitados. La especificación técnica detallada se revisará antes de programar.  
> **Nombre del producto:** PetCare (provisional).  
> **Equipo:** tres integrantes.  
> **Tecnologías previstas:** Angular, TypeScript, Laravel, PostgreSQL.  
> **Idioma:** documentación y datos de negocio en castellano; **solo directorios en inglés** para organización e iconos en Visual Studio Code, aparte de identificadores técnicos fijos de herramientas y frameworks.

## Índice

| Archivo | Contenido |
|---|---|
| [01_VISION_Y_ALCANCE.md](01_VISION_Y_ALCANCE.md) | Problema, objetivos, alcance y exclusiones |
| [02_REQUISITOS_FUNCIONALES.md](02_REQUISITOS_FUNCIONALES.md) | Reglas de negocio y requisitos por módulo |
| [03_PANTALLAS_Y_FLUJOS.md](03_PANTALLAS_Y_FLUJOS.md) | Pantallas, navegación, bocetos textuales y casos de uso |
| [04_BASE_DE_DATOS.md](04_BASE_DE_DATOS.md) | Tablas y columnas **en castellano**, relaciones y ERD |
| [05_ARQUITECTURA.md](05_ARQUITECTURA.md) | Capas Angular–Laravel–PostgreSQL y seguridad |
| [06_API_REST.md](06_API_REST.md) | Endpoints y ejemplos JSON de negocio en castellano |
| [07_ESTRUCTURA_PROYECTO.md](07_ESTRUCTURA_PROYECTO.md) | Árbol de directorios **en inglés**, nombres de archivos y convenciones |
| [08_PLAN_DE_TRABAJO.md](08_PLAN_DE_TRABAJO.md) | Hitos, organización de 3 integrantes y GitHub |
| [09_PRUEBAS.md](09_PRUEBAS.md) | Casos críticos, seguridad y criterios de aceptación |
| [10_DESPLIEGUE.md](10_DESPLIEGUE.md) | Hosting, configuración, backup y estimación de costes |

## Cambios específicos solicitados

### Base de datos y nombres

**En castellano:** nombre de la base de datos (`gestion_mascotas`), tablas, columnas, modelos del dominio, propiedades JSON y rutas propias de negocio. Ejemplos: `mascotas`, `colaboradores_mascota`, `fecha_administracion`, `/api/mascotas`.

**En inglés:** nombres de **directorios** dentro de VS Code (`frontend`, `backend`, `src`, `app`, `features`, `services`, `database`, `migrations`, etc.), para respetar el ecosistema y los iconos de extensiones. Los nombres técnicos que exijan frameworks o protocolos siguen siendo los estándares.

### Reparto del equipo

| Integrante | Responsabilidad principal |
|---|---|
| A | **Layout y base de datos** |
| B | **Angular** |
| C | **API y backend Laravel** |

### GitHub

**Exactamente dos ramas:** `main` (estable) y `development` (integración diaria). No se plantea un flujo de ramas `feature/*`, `fix/*` u otras.

## Estado de decisiones

| Módulo | Estado |
|---|---|
| Ficha general de mascota | **Aprobado y cerrado** |
| Historial veterinario | **Aprobado y cerrado** |
| Colaboración | **Plan aceptado**; matices técnicos por cerrar |
| Tratamientos | **Plan maestro aceptado**; detalles de implementación por revisar |
| Calendario, citas y tareas | **Plan maestro aceptado** |
| Arquitectura, infraestructura y pruebas | **Enfoque aceptado**; servicios, versiones y configuración pendientes |

**Leyenda en el documento de requisitos:** `[A]` significa aprobado expresamente o comprendido en el plan maestro aceptado; `[P]` identifica una precisión nueva que todavía debe confirmarse.

## Orden recomendado de revisión

1. Leer [01 Visión](01_VISION_Y_ALCANCE.md) y [02 Requisitos](02_REQUISITOS_FUNCIONALES.md).
2. Revisar las precisiones nuevas `[P]` que el plan maestro no había concretado.
3. Validar [03 Pantallas](03_PANTALLAS_Y_FLUJOS.md) y preparar mockups gráficos finales.
4. Revisar [04 Base de datos](04_BASE_DE_DATOS.md) con el responsable del esquema **antes de generar SQL**.
5. Pactar [06 API](06_API_REST.md) entre los responsables de Angular y backend.
6. Confirmar arquitectura, planificación, tests y despliegue.

## Qué no incluye esta entrega

No contiene código ejecutable, migraciones SQL, mockups ilustrados definitivos ni una aplicación desplegada. Estos archivos son la **base documental editable** para que el equipo revise decisiones y organice el desarrollo.

## Mantenimiento

Al aprobar cambios, actualizar simultáneamente requisitos, esquema, API y pruebas. Evitar que dos documentos describan reglas contradictorias. En GitHub usar `development` para cambios cotidianos y promocionar a `main` cuando el equipo valide un hito.
