-- Dagon - Cache persistente de respuestas de Clawbot.
--
-- Objetivo:
-- - Cobrar una sola vez a Gemini/Groq la explicacion de un error que muchos alumnos repiten.
-- - Sobrevivir a los redeploys (la cache en memoria se perdia en cada arranque).
-- - Purgarse sola: ClawbotCacheService borra a diario lo que lleva 30 dias sin usarse.
--
-- Ejecutar en la base principal con un usuario con permisos sobre lms_core.

BEGIN;

CREATE TABLE IF NOT EXISTS lms_core.clawbot_cache (
    clave       char(64)    PRIMARY KEY,
    respuesta   text        NOT NULL,
    fuente      varchar(40) NOT NULL,
    aciertos    integer     NOT NULL DEFAULT 0,
    creado_en   timestamptz NOT NULL DEFAULT now(),
    ultimo_uso  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE lms_core.clawbot_cache IS
    'Respuestas de Clawbot ya pagadas. aciertos = veces que se sirvio sin llamar a la IA.';

-- La purga diaria filtra por ultimo_uso.
CREATE INDEX IF NOT EXISTS idx_clawbot_cache_ultimo_uso
    ON lms_core.clawbot_cache (ultimo_uso);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE lms_core.clawbot_cache TO app_backend_user;

COMMIT;
