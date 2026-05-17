-- Dagon - correccion de usuarios existentes sin rol/estado.
--
-- Problema corregido:
-- Algunos usuarios historicos pueden tener id_rol NULL. El login genera JWT,
-- pero el filtro de seguridad no puede cargar autoridad y el frontend borra
-- la sesion al recibir 401/403 en /profile.
--
-- Ejecutar manualmente una vez en la BD principal. Es idempotente.

BEGIN;

UPDATE lms_core.usuarios
SET id_rol = (
    SELECT id_rol
    FROM lms_core.roles
    WHERE nombre = 'alumno'
    ORDER BY id_rol
    LIMIT 1
)
WHERE id_rol IS NULL;

UPDATE lms_core.usuarios
SET activo = true
WHERE activo IS NULL;

ALTER TABLE lms_core.usuarios
    ALTER COLUMN activo SET DEFAULT true;

ALTER TABLE lms_core.usuarios
    ALTER COLUMN id_rol SET DEFAULT 1;

COMMIT;
