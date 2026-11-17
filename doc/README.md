# Documentación técnica de PetCare

Punto de entrada para desarrolladores y agentes. Los documentos describen el código actual; los ejemplos son ficticios. Última revisión: 17 de noviembre de 2026.

| Necesidad | Documento |
| --- | --- |
| Entender componentes, límites y flujo de datos | [Arquitectura](ARQUITECTURA.md) |
| Encontrar una pantalla, servicio, formulario o ruta Angular | [Mapa del frontend](MAPA_FRONTEND.md) |
| Encontrar controladores, servicios, políticas y modelos | [Mapa del backend](MAPA_BACKEND.md) |
| Consultar métodos, rutas, cuerpos y errores HTTP | [Contrato API](API.md) |
| Entender tablas, columnas, tipos, relaciones y ejemplos | [Base de datos](BASE_DE_DATOS.md) |
| Instalar, arrancar y diagnosticar problemas | [Operación](OPERACION.md) |
| Saber qué archivos cambiar para una funcionalidad | [Guía de cambios](GUIA_CAMBIOS.md) |
| Comprobaciones, límites y trabajo pendiente | [Validación](VALIDACION.md) |
| Instrucciones para agentes | [AGENTS.md](../AGENTS.md) |

## Lectura recomendada

Para empezar: [README principal](../README.md) → Arquitectura → mapa del área. Para cambios de persistencia: API → Base de datos → controlador/servicio correspondiente. Para arreglar una pantalla: Mapa frontend → componente → `ServicioApi` → modo local o endpoint real.

`docs/` conserva decisiones y documentos anteriores; `Propuesta-Inicial/` conserva la propuesta académica. Ante discrepancias, contrastar con `frontend/src/app/app.routes.ts`, `backend/routes/api.php` y `database/sql/01_crear_esquema.sql`. El hecho de que exista un modelo no implica que exista una función accesible en la aplicación.
