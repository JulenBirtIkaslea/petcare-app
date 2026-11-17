# 02 · Requisitos funcionales y reglas de negocio

> **Convención:** **[A] Aprobado** (de manera explícita en la revisión modular o al aceptar el plan maestro), **[P] propuesta detallada nueva pendiente de contraste**. Lo marcado [P] concreta cuestiones no expresadas suficientemente en el plan maestro.

## 1. Usuarios y cuentas

- **RF-US-01 [A]** Registrar cuenta con nombre, correo único y contraseña.
- **RF-US-02 [A]** Iniciar/cerrar sesión y recuperar contraseña.
- **RF-US-03 [A]** Verificar correo antes de aceptar invitaciones; para el MVP se recomienda exigir verificación a todas las cuentas.
- **RF-US-04 [A]** Consultar y editar datos propios; gestionar eliminación de cuenta con mascotas a cargo.
- **RF-US-05 [A]** Cada usuario puede ser propietario de unas mascotas y lector/editor de otras; permisos por mascota, no un rol global.

## 2. Mascotas — módulo cerrado

- **RF-MA-01 [A]** Crear mascota con nombre (1–60 caracteres), especie de catálogo u «Otra» y foto opcional; los restantes datos se completan después.
- **RF-MA-02 [A]** Almacenar raza, sexo, nacimiento de precisión variable, peso actual, color/características, esterilización, microchip y observaciones como opcionales.
- **RF-MA-03 [A]** Admitir fecha completa, mes/año, solo año o desconocida, sin inventar día/mes ausente. No fechas futuras.
- **RF-MA-04 [A]** Una fotografía de perfil reemplazable, JPG/PNG/WebP, límite propuesto de 5 MB.
- **RF-MA-05 [A]** Microchip sin exigencia de unicidad global.
- **RF-MA-06 [A]** Solo propietario modifica datos generales.
- **RF-MA-07 [A]** Mascota activa o en papelera recuperable 30 días; no existe archivado.
- **RF-MA-08 [A]** Al restaurar, recuperar registros y colaboradores activos previos; no reactivar invitaciones canceladas.
- **RF-MA-09 [A]** Permitir varias mascotas con igual nombre y una mascota perteneciente a un único propietario actual.

## 3. Colaboración — reglas principales cerradas

- **RF-CO-01 [A]** Un propietario principal y cero o más lectores/editores por mascota.
- **RF-CO-02 [A]** Lector puede consultar; editor puede crear registros propios y modificar/eliminar lógicamente los suyos; propietario puede modificar cualquier registro.
- **RF-CO-03 [A]** Editor puede registrar administraciones y completar tareas compartidas, aunque el plan o la tarea sea ajeno, sin editar las instrucciones ajenas.
- **RF-CO-04 [A]** Invitaciones por enlace seguro ligado a correo determinado; propietario lo comparte manualmente; destinatario debe entrar con el correo invitado.
- **RF-CO-05 [A]** Token de un solo uso que caduca en 7 días; opción de cancelar invitaciones pendientes.
- **RF-CO-06 [A]** Propietario puede solicitar transferencia a colaborador; el destinatario acepta; anterior propietario queda editor limitado.
- **RF-CO-07 [A]** Revocación inmediata, sin borrar la autoría ni registros del colaborador.
- **RF-CO-08 [A]** Permitir abandonar voluntariamente colaboración y prohibir invitaciones duplicadas pendientes.
- **RF-CO-09 [A]** Cancelar invitaciones pendientes al transferir propiedad; mantener una sola solicitud de transferencia pendiente.

## 4. Historial veterinario — módulo cerrado

### Consultas
- **RF-HI-01 [A]** Fecha de consulta y motivo obligatorios; clínica, diagnóstico, recomendaciones y observaciones opcionales.
### Vacunas
- **RF-HI-02 [A]** Nombre y fecha de administración obligatorios; próxima dosis, clínica, lote y observaciones opcionales.
### Desparasitaciones
- **RF-HI-03 [A]** Producto, fecha de aplicación y tipo (interna/externa/ambas) obligatorios; próxima fecha y observaciones opcionales.
### Alergias
- **RF-HI-04 [A]** Alérgeno obligatorio, tipo/síntomas/gravedad/fecha/observaciones opcionales; no hay estados activa/resuelta.
- **RF-HI-05 [A]** Bloquear dos alergias con nombre normalizado igual en una misma mascota; se permiten en mascotas distintas.
### Comportamiento compartido
- **RF-HI-06 [A]** Cronología común filtrable por clase de registro.
- **RF-HI-07 [A]** Hechos realizados con fecha presente/pasada; próxima dosis/aplicación puede ser futura y debe ser posterior a la administración anterior.
- **RF-HI-08 [A]** Próximas vacunas y desparasitaciones se ven en calendario; si vencen no desaparecen y se etiquetan atrasadas.
- **RF-HI-09 [A]** Desde evento programado, «Registrar administración» crea un registro sanitario nuevo, mantiene el anterior y marca la previsión como atendida.
- **RF-HI-10 [A]** Edición y eliminación lógica sujetas a propietario/autor; auditoría de valores previos, autor del cambio, fecha y motivo.
- **RF-HI-11 [A]** Una previsión atendida no podrá atenderse por segunda vez; un error se corrige con auditoría, no borrando silenciosamente el historial.

## 5. Tratamientos — plan general aceptado; detalles técnicos por revisar

- **RF-TR-01 [A]** Admitir medicamentos y cuidados pautados.
- **RF-TR-02 [A]** Frecuencias: diaria, cada X horas, días concretos de semana y dosis única.
- **RF-TR-03 [A]** Fecha de fin opcional; tratamientos indefinidos permitidos.
- **RF-TR-04 [A]** Cantidad por dosis obligatoria para medicamentos y opcional para otros cuidados.
- **RF-TR-05 [A]** Tratamiento contiene nombre, tipo, instrucciones, cantidad/unidad, inicio/fin, frecuencia/horario, prescriptor opcional y observaciones.
- **RF-TR-06 [A]** Estados: en curso, finalizado y cancelado; cancelación con motivo.
- **RF-TR-07 [A]** Dosis: pendiente, atrasada, administrada y omitida; motivo de omisión opcional.
- **RF-TR-08 [A]** Finalización automática al terminar una pauta con fecha de fin, sin dar por administradas sus dosis; indefinidos terminan manualmente.
- **RF-TR-09 [A]** Administraciones guardan fecha/hora real, cantidad, persona que registra, persona que realiza y observaciones.
- **RF-TR-10 [A]** Cambios de frecuencia, cantidad u horarios crean una nueva versión; dosis anteriores siguen asociadas a su versión.
- **RF-TR-11 [A]** No duplicar resolución para la misma dosis planificada, aun bajo concurrencia.
- **RF-TR-12 [A]** Editores registran dosis sobre pautas ajenas; no modifican instrucciones ajenas.
- **RF-TR-13 [A]** No borrar físicamente tratamientos con administraciones; conservar el historial.
- **RF-TR-14 [A]** No registrar administraciones futuras; permitir fuera de horario con hora real y corrección auditada.

## 6. Calendario, citas y tareas — plan general aceptado

- **RF-CA-01 [A]** Mostrar en calendario/lista los eventos derivados de historial, tratamientos, citas y tareas.
- **RF-CA-02 [A]** Vista mensual y agenda próxima; filtros por mascota y tipo.
- **RF-CA-03 [A]** Crear citas con título, fecha/hora, lugar, descripción y estado programada/realizada/cancelada.
- **RF-CA-04 [A]** Crear tareas con título, fecha/hora, descripción, responsable opcional y estado pendiente/completada/cancelada.
- **RF-CA-05 [A]** Completar tareas conserva ejecutor real y fecha de ejecución.
- **RF-CA-06 [A]** El editor puede completar tareas ajenas sin alterar las instrucciones de quien las creó.
- **RF-CA-07 [A]** Si se revoca al responsable de una tarea, se desasigna, manteniendo la tarea y su historial.
- **RF-CA-08 [A]** Mostrar dosis atrasadas sin marcarlas administradas automáticamente.
- **RF-CA-09 [A]** No enviar avisos push ni correos automáticos para recordatorios dentro del MVP.

## 7. Matriz general de permisos

| Acción | Propietario | Editor limitado | Lector |
|---|---|---|---|
| Consultar ficha e historial | Sí | Sí | Sí |
| Modificar ficha general o fotografía | Sí | No | No |
| Crear registro veterinario | Sí | Sí | No |
| Modificar/eliminar lógicamente registro propio | Sí | Sí | No |
| Modificar registro ajeno | Sí | No | No |
| Crear tratamiento | Sí | Sí | No |
| Cambiar tratamiento ajeno | Sí | No | No |
| Registrar administración en pauta ajena | Sí | Sí | No |
| Completar tarea compartida | Sí | Sí | No |
| Invitar, cambiar permisos, revocar | Sí | No | No |
| Transferir propiedad | Sí | No | No |
| Eliminar/restaurar mascota | Sí | No | No |

> Cualquier usuario autenticado puede crear **su propia mascota**, aunque sea lector en las mascotas de otros.

## 8. Reglas no funcionales

- **RNF-01:** API valida todo en servidor, incluso si Angular lo valida también.
- **RNF-02:** acceso a fotografías privadas sujeto a autorización.
- **RNF-03:** no guardar contraseñas o tokens en claro; secretos fuera de Git.
- **RNF-04:** operaciones de transferencias, invitaciones y administraciones concurrentes son atómicas.
- **RNF-05:** interfaz usable con teclado, mensajes claros y diseño adaptable.
- **RNF-06:** todas las fechas/hora tienen semántica y zona horaria definida.
- **RNF-07:** pruebas automatizadas de permisos, integridad y flujos principales.

## 9. Criterio de finalización

Un requisito pasa a «Terminado» cuando dispone de formulario/endpoint funcional, validaciones, comprobación de permisos, prueba correspondiente y demostración manual en el entorno de integración.

## 10. Aspectos técnicos por cerrar

El alcance maestro de tratamientos, calendario, tareas/citas, permisos, arquitectura y entregas se ha aceptado. Antes de implementarlo deben concretarse: (1) formato exacto de frecuencias y cambios de pauta; (2) servicio de verificación de correo; (3) política de retención de auditoría y eliminación de cuentas; (4) detalle final del contrato API y pruebas.

[Índice](README.md) · [Base de datos](04_BASE_DE_DATOS.md) · [Pruebas](09_PRUEBAS.md)
