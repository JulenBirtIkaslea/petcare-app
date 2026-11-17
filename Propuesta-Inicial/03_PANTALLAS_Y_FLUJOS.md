# 03 · Pantallas, navegación y flujos de usuario

> **Estado:** inventario de pantallas y flujos aceptado a nivel de plan maestro; distribución visual detallada y mockups gráficos por revisar. No son capturas ni mockups gráficos finales.

## 1. Principios de interfaz

- Aplicación responsive con navegación simple y uso cómodo desde el móvil.
- Encabezado con identidad del usuario y acceso a perfil.
- Navegación principal: **Inicio, Mis mascotas, Calendario, Cuidados**.
- Dentro de una mascota: **Resumen, Historial, Tratamientos, Calendario, Colaboradores**.
- Acciones principales visibles; acciones destructivas requieren confirmación.
- Un lector ve los datos pero no los controles de edición; Laravel comprueba permisos igualmente.
- Colores de estados complementados con textos e iconos, nunca solo color.

## 2. Inventario de pantallas

| ID | Pantalla o vista | Componentes esenciales | Acceso |
|---|---|---|---|
| P01 | Acceso | Correo, contraseña, errores, recuperar contraseña | Público |
| P02 | Registro/verificación | Alta, confirmación de correo | Público/usuario |
| P03 | Panel de inicio | Resumen, próximos cuidados, accesos a mascotas | Autenticado |
| P04 | Mis mascotas | Tarjetas, filtro, crear mascota, papelera accesible al propietario | Autenticado |
| P05 | Nueva mascota | Nombre, especie, «Otra», foto opcional | Autenticado |
| P06 | Detalle de mascota | Foto, datos, alergias, próximos eventos, pestañas | Colaboradores y propietario |
| P07 | Editar mascota | Datos generales opcionales y foto | Propietario |
| P08 | Historial | Cronología común, filtros y formulario contextual | Personas con acceso |
| P09 | Formularios sanitarios | Consulta, vacuna, desparasitación, alergia | Propietario/editor |
| P10 | Tratamientos | Listado por estado y próximas dosis | Personas con acceso |
| P11 | Editar/crear tratamiento | Pauta, frecuencia, fechas, cantidad | Según autoría/permisos |
| P12 | Detalle de tratamiento | Versiones, calendario de dosis y acciones de registro | Personas con acceso |
| P13 | Calendario | Vista mensual, agenda, filtros, atraso | Personas con acceso |
| P14 | Cita/tarea | Crear, editar, finalizar o cancelar | Según permiso |
| P15 | Colaboradores | Propietario, lectores, editores, invitaciones | Ver según permisos; editar propietario |
| P16 | Aceptar invitación | Identidad vinculada al correo, aceptar/rechazar | Destinatario |
| P17 | Transferencia | Solicitar/aceptar/rechazar | Participantes autorizados |
| P18 | Papelera | Restaurar y mostrar fecha límite de recuperación | Propietario |
| P19 | Mi cuenta | Perfil, contraseña, cerrar sesión | Autenticado |

## 3. Bocetos textuales

### 3.1. Panel de inicio (escritorio)

```text
┌─────────────────────────────────────────────────────────────┐
│ PetCare         Inicio · Mis mascotas · Calendario · Cuenta │
├─────────────────────────────────────────────────────────────┤
│ Hola, usuario                                               │
│ [Mascotas 3] [Tratamientos activos 2] [Tareas pendientes 4]  │
│                                                             │
│ Próximos cuidados                 Mis mascotas               │
│ ┌──────────────────────────┐      ┌─────────────────────┐    │
│ │ 09:00  Cuidado Khea      │      │ [foto] Khea        │    │
│ │ 12:00  Cita otra mascota │      │ [foto] Otra mascota│    │
│ └──────────────────────────┘      └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2. Detalle de mascota (móvil)

```text
┌─────────────────────────────┐
│ ← Mascotas              ··· │
│          [ FOTO ]           │
│          Khea               │
│     Perro · Hembra          │
│ [Resumen] [Historial]       │
│ [Tratamientos] [Calendario] │
│                             │
│ Próximas actividades        │
│ • Cuidado · 21:00           │
│ • Vacuna · próxima fecha    │
│                             │
│ Alergias registradas        │
│ Información general         │
└─────────────────────────────┘
```

### 3.3. Registrar administración

```text
┌──────────────────────────────┐
│ Registrar administración     │
│ Tratamiento / dosis prevista │
│ Fecha y hora reales          │
│ Cantidad                    │
│ Persona que realizó cuidado │
│ Observaciones               │
│ [Cancelar] [Confirmar]      │
└──────────────────────────────┘
```

## 4. Flujos funcionales

### F01 — Alta de mascota

1. Usuario autenticado abre «Mis mascotas» y pulsa «Añadir».
2. Completa nombre y especie; si es «Otra», indica cuál; foto opcional.
3. Angular valida; API valida de nuevo y crea ficha con el usuario como propietario.
4. Se muestra detalle de mascota y opción de completar datos generales.

**Error esperado:** nombre vacío, especie inválida, fotografía excedida => formulario conserva datos e informa claramente.

### F02 — Invitación de colaborador

1. Propietario accede a «Colaboradores», introduce correo y elige lector/editor.
2. API genera token seguro caducable vinculado a mascota/correo/permiso.
3. El propietario copia y comparte el enlace manualmente.
4. Destinatario abre el enlace, inicia sesión o se registra y acredita el correo correcto.
5. Acepta y aparece como colaborador; token consumido.

**Errores:** caducada, consumida, correo no coincidente, persona ya colaboradora o mascota en papelera.

### F03 — Consulta sanitaria y próxima vacuna

1. Propietario/editor crea una vacuna con fecha de administración y próxima dosis opcional.
2. Aparece en el historial y la próxima dosis en calendario.
3. Cuando se realiza la siguiente, el usuario usa «Registrar administración».
4. Se crea nueva vacuna; la programación previa queda atendida; las dos dosis permanecen en el historial.

### F04 — Tratamiento compartido (propuesta)

1. Propietario/editor crea tratamiento con pauta.
2. El calendario calcula próximas dosis.
3. Cualquier editor autorizado ve una dosis y confirma administración o la marca omitida.
4. API registra autor, ejecutor y hora y evita dobles confirmaciones.
5. El creador o propietario puede cambiar pauta, dejando versión histórica.

### F05 — Transferencia de propiedad

1. Propietario solicita transferir a colaborador.
2. Destinatario acepta; backend comprueba permisos en una transacción.
3. Destinatario pasa a propietario; anterior pasa a editor limitado.
4. Se mantiene la autoría de registros históricos.

### F06 — Papelera

1. Propietario solicita eliminar mascota; interfaz indica consecuencias y plazo.
2. Backend marca fecha de eliminación y deshabilita acceso operativo.
3. Durante 30 días propietario puede restaurar.
4. Al vencer, tarea programada ejecuta supresión según política; se comprueban archivos y relaciones.

## 5. Navegación y diseño responsive

- **Escritorio:** barra superior y menú lateral o navegación estable; fichas en rejilla.
- **Móvil:** navegación compacta; campos de formularios en una columna; botones grandes.
- **Formularios largos:** secciones visibles y guardado con errores por campo.
- **Calendario móvil:** priorizar vista de agenda; la mensual es secundaria.
- **Accesibilidad:** etiquetas, foco, orden de tabulación y diálogos accesibles.

## 6. Mensajes y estados de interfaz

- **Sin mascotas:** «Todavía no tienes mascotas. Añade la primera».
- **Historial vacío:** «Aún no hay registros sanitarios».
- **Permiso insuficiente:** «No tienes permiso para realizar esta acción».
- **Enlace caducado:** «La invitación ya no es válida. Solicita otra».
- **Conflicto de dosis:** «Otra persona ya ha registrado esta dosis».
- **Mascota en papelera:** «Esta ficha se puede restaurar hasta [fecha]».
- **Error de conexión:** reintento explícito sin duplicar automáticamente operaciones sensibles.

## 7. Entregables visuales antes de programar

Diseñar mockups reales (escritorio y móvil) de: inicio, lista de mascotas, ficha, historial, crear vacuna, tratamiento, registro de dosis, calendario y colaboradores. Las restantes pantallas pueden derivarse de componentes reutilizados.

[Índice](README.md) · [Requisitos](02_REQUISITOS_FUNCIONALES.md) · [Arquitectura](05_ARQUITECTURA.md)
