-- Indices seguros para hacer mas agil el panel docente, dashboard y calificaciones.
-- Ejecutar directamente con psql. No envolver en BEGIN/COMMIT porque usa CONCURRENTLY.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grupos_docente_docente_activo
    ON lms_core.grupos_docente (id_docente, activo, id_grupo);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grupo_alumnos_grupo_activo_alumno
    ON lms_core.grupo_alumnos (id_grupo, activo, id_alumno);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grupo_alumnos_alumno_activo_grupo
    ON lms_core.grupo_alumnos (id_alumno, activo, id_grupo);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_intentos_usuario_ejercicio_fecha
    ON lms_core.intentos (id_usuario, id_ejercicio, fecha_intento DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_intentos_usuario_correcto_fecha
    ON lms_core.intentos (id_usuario, es_correcto, fecha_intento DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ejercicios_modulo_tipo_visibilidad
    ON lms_core.ejercicios_practicos (id_modulo, tipo_mision, visibilidad, creado_por, id_grupo);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ejercicios_grupo_visibilidad
    ON lms_core.ejercicios_practicos (id_grupo, visibilidad)
    WHERE id_grupo IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modulos_curso_orden_id
    ON lms_core.modulos (id_curso, orden, id_modulo);
