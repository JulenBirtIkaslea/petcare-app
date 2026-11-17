# 07 · Directorios, archivos y responsabilidades

> **Regla del proyecto:** los **nombres de directorios de VS Code estarán en inglés** para conservar convenciones e iconos; la **documentación, nombres de entidades/columnas/tablas, lógica de negocio y rutas funcionales estarán en castellano**. Se exceptúan identificadores técnicos fijos de Angular, Laravel, PHP, GitHub y Git.

## 1. Repositorio único (monorepo)

```text
petcare/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   └── services/
│   │   │   ├── shared/
│   │   │   │   ├── components/
│   │   │   │   ├── models/
│   │   │   │   └── validators/
│   │   │   ├── layouts/
│   │   │   └── features/
│   │   │       ├── pets/
│   │   │       ├── veterinary-history/
│   │   │       ├── collaboration/
│   │   │       ├── treatments/
│   │   │       └── calendar/
│   │   └── assets/
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── Models/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Requests/
│   │   ├── Policies/
│   │   ├── Services/
│   │   └── Jobs/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── factories/
│   ├── routes/
│   └── tests/
│       ├── Feature/
│       └── Unit/
├── docs/
├── infra/
└── .github/
    └── workflows/
```

> Es una **propuesta de organización**, no una exigencia de crear carpetas vacías antes de necesitarlas.

## 2. Responsabilidad de cada directorio

### `frontend/`

| Directorio | Qué contiene |
|---|---|
| `src/app/core/` | Servicios de sesión, configuración global, interceptores y guards |
| `src/app/shared/` | Componentes, validadores y modelos reutilizables |
| `src/app/layouts/` | Cabeceras, navegación, contenedores responsive |
| `src/app/features/pets/` | Lista, detalle, crear/editar mascota |
| `src/app/features/veterinary-history/` | Cronología y formularios de salud |
| `src/app/features/collaboration/` | Invitaciones y permisos |
| `src/app/features/treatments/` | Tratamientos, pautas, dosis |
| `src/app/features/calendar/` | Calendario, citas, tareas |
| `src/assets/` | Imágenes públicas del propio frontend, no fotos privadas de mascotas |
| `tests/` | Pruebas complementarias del frontend, si se usan |

**Ejemplos de archivos propios en castellano** (según convenciones Angular):

```text
features/pets/
├── lista-mascotas.component.ts
├── detalle-mascota.component.ts
├── formulario-mascota.component.ts
└── servicio-mascotas.service.ts
```

### `backend/`

| Directorio | Qué contiene |
|---|---|
| `app/Models/` | `Mascota.php`, `Usuario.php`, `Vacuna.php`, etc. |
| `app/Http/Controllers/` | Entrada HTTP de recursos |
| `app/Http/Requests/` | Validación de peticiones |
| `app/Policies/` | Autorización por mascota, autoría y rol |
| `app/Services/` | Lógica que coordina varias entidades y transacciones |
| `app/Jobs/` | Limpieza programada y otros trabajos |
| `database/migrations/` | Versiones del esquema PostgreSQL |
| `database/seeders/` | Catálogo de especies y datos de demo |
| `database/factories/` | Fábricas de registros de prueba |
| `routes/` | Declaración de rutas API, archivos estándar del framework |
| `tests/Feature/` | Pruebas HTTP y permisos |
| `tests/Unit/` | Pruebas unitarias de reglas |

**Ejemplos de archivos de negocio en castellano:**

```text
app/Models/Mascota.php
app/Models/Tratamiento.php
app/Http/Controllers/ControladorMascotas.php
app/Http/Requests/CrearMascotaSolicitud.php
app/Policies/PoliticaMascota.php
app/Services/ServicioTransferencias.php
app/Services/ServicioCalendario.php
```

Los nombres de las carpetas estándar pueden contener mayúsculas por convención Laravel. La regla «directorios en inglés» se refiere al idioma, no a que deban ir siempre en minúsculas.

### Directorios comunes

| Directorio | Contenido |
|---|---|
| `docs/` | Los once documentos `.md`, diagramas y, más adelante, imágenes de mockups |
| `infra/` | Configuración de despliegue sin secretos |
| `.github/workflows/` | Automatizaciones de pruebas de frontend y backend |

## 3. Reparto de los tres integrantes

| Integrante | Área principal | Entregables |
|---|---|---|
| A | **Layout y base de datos** | Estructura visual común, mockups, responsive base, ERD, migraciones y datos semilla |
| B | **Angular** | Pantallas, formularios, servicios HTTP, interacción, estados y errores |
| C | **API y backend** | Laravel, autenticación, endpoints, servicios, policies, validaciones y tests backend |

**Colaboración obligatoria:**
- A + B: layout coherente e integración de componentes.
- A + C: migraciones/relaciones acordes con servicios y políticas.
- B + C: contrato API antes de implementar vistas y endpoints.
- Todos: pruebas integradas, revisión y defensa técnica.

## 4. GitHub: **solo dos ramas**

- **`main`:** versión estable, entregable y demostrable.
- **`development`:** integración del trabajo diario del equipo.

No crearemos ramas adicionales como flujo habitual.

### Flujo propuesto

1. Antes de trabajar: actualizar `development`.
2. Cada persona trabaja en su área, con commits pequeños y descriptivos.
3. Antes de subir, ejecutar las pruebas de su parte.
4. Subir cambios a `development`; coordinarse para no pisar el mismo archivo y usar `git pull --rebase` solo si el equipo entiende y aprueba ese flujo.
5. Revisar CI y probar integración.
6. Cuando el hito está validado, fusionar `development` en `main` mediante pull request.
7. No hacer cambios directos en `main`.

**Advertencia:** con tres personas compartiendo `development` es especialmente importante avisar antes de modificar archivos comunes y hacer cambios pequeños. Las revisiones se pueden realizar en el PR `development` → `main` y mediante revisión cruzada de commits en `development`.

## 5. Reglas de nombres

- Carpetas: inglés (`features`, `services`, `migrations`, `layouts`, `calendar`).
- Tablas/columnas PostgreSQL: castellano (`mascotas`, `propietario_id`, `fecha_administracion`).
- Rutas de API propias: castellano (`/api/mascotas`, `/api/tratamientos`).
- Modelos y clases creados por el equipo: castellano (`Mascota`, `ServicioCalendario`).
- Documentos: castellano (`01_VISION_Y_ALCANCE.md`).
- Archivos/identificadores de framework: respetar lo que el framework exige (`package.json`, `composer.json`, `api.php`, `main.ts`).

## 6. Reglas para añadir directorios

- Evitar directorios con un único archivo cuando no aporten organización.
- Organizar Angular por funcionalidad y no por un directorio gigante de componentes.
- Mantener lógica de permisos en el backend centralizada.
- No subir `node_modules/`, `vendor/`, `.env`, imágenes privadas ni credenciales.
- Documentar cualquier carpeta nueva que afecte a la estructura acordada.

[Índice](README.md) · [Plan de trabajo](08_PLAN_DE_TRABAJO.md) · [Arquitectura](05_ARQUITECTURA.md)
