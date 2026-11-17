-- SOLO para instalaciones anteriores. En bases nuevas, 01 ya incluye estos cambios.
-- Revisar y ejecutar manualmente en gestion_mascotas; no elimina mascotas ni historiales.
-- Los antiguos editores y visores pasan a ayudantes de solo lectura.
BEGIN;
LOCK TABLE mascotas, colaboradores_mascota, codigos_colaboracion IN ACCESS EXCLUSIVE MODE;
ALTER TABLE colaboradores_mascota DROP CONSTRAINT IF EXISTS colaboradores_mascota_permiso_check;
UPDATE colaboradores_mascota SET permiso = 'ayudante' WHERE permiso IN ('visor', 'editor');
ALTER TABLE colaboradores_mascota ADD CONSTRAINT colaboradores_mascota_permiso_check CHECK (permiso IN ('propietario', 'ayudante'));

ALTER TABLE codigos_colaboracion DROP CONSTRAINT IF EXISTS codigos_colaboracion_permiso_check;
-- Invalidar los códigos antiguos: sus condiciones de acceso y duración eran distintas.
UPDATE codigos_colaboracion SET cancelado_en = CURRENT_TIMESTAMP WHERE usado_en IS NULL AND cancelado_en IS NULL;
UPDATE codigos_colaboracion SET permiso = 'ayudante' WHERE permiso IN ('visor', 'editor');
ALTER TABLE codigos_colaboracion ADD CONSTRAINT codigos_colaboracion_permiso_check CHECK (permiso IN ('propietario', 'ayudante'));
ALTER TABLE codigos_colaboracion ALTER COLUMN caduca_en SET DEFAULT (CURRENT_TIMESTAMP + interval '20 minutes');

ALTER TABLE auditoria_cambios ADD COLUMN IF NOT EXISTS mascota_id bigint REFERENCES mascotas(id);
CREATE INDEX IF NOT EXISTS auditoria_mascota ON auditoria_cambios(mascota_id, ocurrido_en);
-- Cancelar el flujo antiguo de transferencias, que ya no existe en la aplicación.
UPDATE transferencias_propiedad SET estado = 'cancelada', resuelta_en = CURRENT_TIMESTAMP WHERE estado = 'pendiente';
UPDATE usuarios SET recuperacion_hash = NULL WHERE recuperacion_hash IS NOT NULL;
COMMIT;
