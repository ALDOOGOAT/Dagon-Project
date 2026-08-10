BEGIN;

CREATE TABLE IF NOT EXISTS lms_core.grupos_docente (
    id_grupo BIGSERIAL PRIMARY KEY,
    id_docente UUID NOT NULL REFERENCES lms_core.usuarios(id_usuario),
    nombre_grupo VARCHAR(120) NOT NULL,
    codigo_acceso VARCHAR(32),
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lms_core.grupo_alumnos (
    id_grupo BIGINT NOT NULL REFERENCES lms_core.grupos_docente(id_grupo) ON DELETE CASCADE,
    id_alumno UUID NOT NULL REFERENCES lms_core.usuarios(id_usuario),
    activo BOOLEAN NOT NULL DEFAULT true,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (id_grupo, id_alumno)
);

CREATE TABLE IF NOT EXISTS lms_core.evaluaciones_docente (
    id_evaluacion BIGSERIAL PRIMARY KEY,
    id_docente UUID NOT NULL REFERENCES lms_core.usuarios(id_usuario),
    id_alumno UUID NOT NULL REFERENCES lms_core.usuarios(id_usuario),
    id_curso INT REFERENCES lms_core.cursos(id_curso),
    id_modulo INT REFERENCES lms_core.modulos(id_modulo),
    calificacion NUMERIC(4,2) NOT NULL CHECK (calificacion >= 0 AND calificacion <= 10),
    comentario TEXT,
    fecha_evaluacion TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (id_docente, id_alumno, id_modulo)
);

ALTER TABLE lms_core.ejercicios_practicos
ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES lms_core.usuarios(id_usuario),
ADD COLUMN IF NOT EXISTS visibilidad VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN IF NOT EXISTS id_grupo BIGINT REFERENCES lms_core.grupos_docente(id_grupo);

ALTER TABLE lms_core.grupos_docente
ADD COLUMN IF NOT EXISTS codigo_acceso VARCHAR(32);

UPDATE lms_core.grupos_docente
SET codigo_acceso = UPPER(SUBSTRING(MD5(id_grupo::text || clock_timestamp()::text || random()::text), 1, 8))
WHERE codigo_acceso IS NULL OR TRIM(codigo_acceso) = '';

ALTER TABLE lms_core.grupos_docente
ALTER COLUMN codigo_acceso SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_ejercicios_visibilidad'
    ) THEN
        ALTER TABLE lms_core.ejercicios_practicos
        ADD CONSTRAINT chk_ejercicios_visibilidad
        CHECK (visibilidad IN ('GLOBAL', 'DOCENTE', 'GRUPO'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_grupos_docente_docente
ON lms_core.grupos_docente(id_docente);

CREATE UNIQUE INDEX IF NOT EXISTS uq_grupos_docente_codigo_acceso
ON lms_core.grupos_docente(UPPER(codigo_acceso));

CREATE INDEX IF NOT EXISTS idx_grupo_alumnos_alumno
ON lms_core.grupo_alumnos(id_alumno);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_docente_alumno
ON lms_core.evaluaciones_docente(id_docente, id_alumno);

CREATE INDEX IF NOT EXISTS idx_ejercicios_visibilidad
ON lms_core.ejercicios_practicos(visibilidad, creado_por, id_grupo);

COMMIT;