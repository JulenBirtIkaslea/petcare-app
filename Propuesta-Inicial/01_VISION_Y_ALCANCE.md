# 01 · Visión y alcance del proyecto

> **Proyecto:** PetCare (nombre provisional) · **Tipo:** Trabajo de Fin de Grado de Desarrollo de Aplicaciones Web (DAW) · **Equipo:** 3 personas  
> **Estado:** plan general aceptado por el equipo promotor, con aspectos técnicos concretos todavía revisables.

## 1. Resumen ejecutivo

PetCare es una aplicación web adaptable a móvil y escritorio para gestionar de forma compartida los cuidados de mascotas domésticas. Centraliza la ficha del animal, su historial veterinario, tratamientos, dosis realizadas, citas y tareas, y permite compartir cada mascota con familiares o cuidadores mediante permisos específicos.

**Problema:** cuando varias personas cuidan de un animal, las instrucciones y actuaciones quedan repartidas entre chats, notas y documentos. Esto dificulta saber qué se ha hecho y qué sigue pendiente.  
**Propuesta de valor:** una única ficha, un historial trazable y una agenda común con autoría y permisos.

No es una aplicación de diagnóstico ni prescribe tratamientos; los datos sanitarios los introducen las personas usuarias siguiendo, en su caso, instrucciones profesionales.

## 2. Público objetivo

- Personas que conviven con una o varias mascotas.
- Familias y parejas que comparten cuidados.
- Personas cuidadoras temporales autorizadas por el propietario de la ficha.
- Veterinarios que, en el MVP, acceden como usuarios normales invitados, **sin rol profesional verificado**.

## 3. Objetivos

1. Registrar mascotas con identificación básica y fotografía.
2. Consultar el historial sanitario desde una cronología única.
3. Coordinar tratamientos y registrar quién realiza los cuidados y cuándo.
4. Reunir próximas dosis, citas y tareas en un calendario común.
5. Compartir acceso por mascota, aplicando permisos y revocaciones en backend.
6. Mantener la integridad y trazabilidad de los registros sanitarios y de colaboración.
7. Entregar una aplicación operativa con pruebas, documentación y despliegue para demostración.

## 4. Alcance del MVP

| Área | Dentro del MVP | Situación |
|---|---|---|
| Ficha de mascota | Nombre, especie, nacimiento de precisión variable, datos opcionales, una foto, papelera de 30 días | **Aprobado** |
| Historial sanitario | Consultas, vacunas, desparasitaciones, alergias; cronología, auditoría e integración de próximas dosis | **Aprobado** |
| Colaboración | Propietario único; lectores y editores; invitaciones por enlace; transferencias y revocación | **Plan aceptado** |
| Tratamientos | Medicamentos y cuidados pautados; frecuencias, dosis, versiones y administraciones | **Plan general aceptado** |
| Calendario | Próximas dosis, tratamientos, citas y tareas; vistas y filtros | **Plan general aceptado** |
| Autenticación | Registro, inicio de sesión, recuperación y verificación de correo | **Propuesta técnica necesaria para invitaciones seguras** |

### 4.1. Decisiones funcionales aprobadas

**Mascotas**
- Especies domésticas variadas, mediante catálogo y opción «Otra».
- Creación corta: nombre y especie obligatorios; foto opcional; resto después.
- Nacimiento exacto, mes/año, solo año o desconocido; no inventar fechas para completar partes ausentes.
- Un peso actual, sin historial; una fotografía reemplazable; microchip opcional y sin unicidad global.
- Sin estado de archivado: mascota activa o en papelera recuperable durante 30 días.

**Historial veterinario**
- Formularios de consultas, vacunas, desparasitaciones y alergias; cronología común filtrable.
- Alergias sin estados; bloquear duplicados por nombre normalizado **en la misma mascota**.
- Las actuaciones realizadas no pueden fecharse en el futuro; sí las próximas administraciones previstas.
- Próximas vacunas/desparasitaciones aparecen en el calendario; si vencen, siguen pendientes.
- «Registrar administración» crea un nuevo registro sanitario, vinculado al anterior, y marca la programación previa como atendida.
- Auditoría con valores anteriores, autor, fecha y motivo de corrección.

**Colaboración**
- Una persona propietaria por ficha; lectores y editores limitados por mascota.
- El editor crea y corrige sus registros, y puede ejecutar tareas o registrar cuidados de pautas ajenas sin alterar las instrucciones originales.
- El propietario puede corregir registros; los registros mantienen autoría y eliminación lógica.
- Invitación mediante enlace seguro vinculado al correo de destino, compartido manualmente.
- Transferencia de propiedad con aceptación: anterior propietario queda como editor limitado.
- Revocación inmediata del acceso; no borra registros ni autorías anteriores.

**Tratamientos, ya decidido**
- Medicamentos y otros cuidados pautados.
- Frecuencia diaria, cada X horas, en días concretos o una dosis única.
- Tratamientos con fecha de fin opcional.
- Cantidad obligatoria para medicamentos; opcional para otros cuidados.

## 5. Fuera del MVP

- Diagnóstico o prescripción veterinaria, IA clínica.
- Aplicación móvil nativa.
- Envío automático de invitaciones o notificaciones push/SMS.
- Integración con clínicas o calendarios externos.
- Galería de fotos, documentos sanitarios adjuntos y exportación avanzada.
- Historial/gráficos de peso.
- Facturación, seguros, pagos o cuentas de clínicas.
- Gestión de mascotas «archivadas».

## 6. Principios del producto

- **Sencillez:** creación de mascota en pocos pasos; datos complementarios después.
- **Colaboración:** permisos siempre verificados por servidor.
- **Trazabilidad:** cambios sanitarios auditados y cuidados atribuibles a personas.
- **No duplicación:** el calendario muestra datos originados en sus módulos, sin mantener copias desconectadas.
- **Privacidad:** fotografías privadas, acceso revocable, borrado recuperable.
- **Viabilidad:** priorizar funcionalidades completas frente a elementos accesorios.

## 7. Indicadores de éxito para la demostración

- Una persona registra una mascota y la comparte mediante enlace a otra cuenta.
- Un lector no puede modificar información; un editor sí registra sus propias actuaciones.
- Una vacuna puede programar su próxima dosis en el calendario sin duplicar el registro original.
- Una dosis de tratamiento se registra una sola vez, incluso con dos intentos concurrentes.
- Se puede recuperar una mascota desde papelera antes de 30 días.
- Los flujos principales funcionan en móvil y escritorio.

## 8. Equipo y tecnologías

| Responsable | Trabajo principal |
|---|---|
| Integrante A | **Layout/diseño de interfaz y base de datos**: estructura visual, diseño del esquema, migraciones coordinadas, datos de ejemplo |
| Integrante B | **Angular**: componentes, formularios, navegación, estados e integración con API |
| Integrante C | **API y backend Laravel**: rutas, autenticación, políticas, servicios y lógica de negocio |

Las decisiones de API y modelo de datos deberán coordinarse entre las tres personas. El reparto es principal, no exclusivo.

**Tecnologías propuestas:** Angular, TypeScript, Tailwind CSS, PrimeNG, Laravel, PHP, PostgreSQL, GitHub. **Ramas únicas del repositorio:** `main` y `development`.

## 9. Riesgos y prioridades

- **Alto riesgo:** permisos, doble registro de dosis, cambios de pautas, invitaciones y borrado de datos relacionados.
- **Riesgo medio:** calendario agregado, horarios/zona horaria, fotos privadas y correos de verificación.
- **Prioridad 1:** usuarios, mascotas y permisos; **2:** historial; **3:** tratamientos; **4:** calendario; **5:** refinamiento visual.

## 10. Aspectos pendientes de especificación detallada

El **plan maestro**, incluidos tratamientos, calendario y propuesta de stack, ha sido aceptado con los tres cambios expresos de idioma, responsabilidades y ramas. Siguen abiertos los **detalles de implementación que este documento introduce por primera vez**: forma exacta de verificación de correo, estructura de frecuencias, política de eliminación definitiva de auditoría/datos de personas, formatos y compatibilidad de versiones, costes reales de despliegue. Estos detalles deben revisarse antes de codificar.

## 11. Documentos relacionados

[02 Requisitos](02_REQUISITOS_FUNCIONALES.md) · [03 Pantallas y flujos](03_PANTALLAS_Y_FLUJOS.md) · [04 Base de datos](04_BASE_DE_DATOS.md) · [08 Plan de trabajo](08_PLAN_DE_TRABAJO.md)
