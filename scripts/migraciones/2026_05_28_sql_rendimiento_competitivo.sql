-- Dagon - Analista de rendimiento y competencia por ejercicio.
--
-- Objetivo:
-- - Guardar costo estimado de PostgreSQL para consultas correctas analizables.
-- - Guardar longitud de la consulta para SQL Golf.
-- - Acelerar los leaderboards por ejercicio sin cambiar el contrato historico.
--
-- Ejecutar en la base principal con un usuario con permisos sobre lms_core.

BEGIN;

ALTER TABLE lms_core.intentos
    ADD COLUMN IF NOT EXISTS costo_ejecucion numeric(12,2),
    ADD COLUMN IF NOT EXISTS longitud_caracteres integer;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'intentos_costo_ejecucion_check'
          AND conrelid = 'lms_core.intentos'::regclass
    ) THEN
        ALTER TABLE lms_core.intentos
            ADD CONSTRAINT intentos_costo_ejecucion_check
            CHECK (costo_ejecucion IS NULL OR costo_ejecucion >= 0) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'intentos_longitud_caracteres_check'
          AND conrelid = 'lms_core.intentos'::regclass
    ) THEN
        ALTER TABLE lms_core.intentos
            ADD CONSTRAINT intentos_longitud_caracteres_check
            CHECK (longitud_caracteres IS NULL OR longitud_caracteres >= 0) NOT VALID;
    END IF;
END $$;

UPDATE lms_core.intentos
SET longitud_caracteres = char_length(trim(query_enviada))
WHERE longitud_caracteres IS NULL
  AND query_enviada IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_intentos_ejercicio_eficiencia
    ON lms_core.intentos (id_ejercicio, es_correcto, costo_ejecucion, tiempo_ms, fecha_intento)
    WHERE es_correcto = true;

CREATE INDEX IF NOT EXISTS idx_intentos_ejercicio_sql_golf
    ON lms_core.intentos (id_ejercicio, es_correcto, longitud_caracteres, costo_ejecucion, fecha_intento)
    WHERE es_correcto = true;

GRANT SELECT, INSERT, UPDATE ON TABLE lms_core.intentos TO app_backend_user;

COMMIT;
