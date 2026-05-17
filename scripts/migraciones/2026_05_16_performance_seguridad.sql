-- Dagon - indices de performance y seguridad operativa.
--
-- Ejecutar manualmente en la base de datos principal.
-- Importante: este archivo usa CREATE INDEX CONCURRENTLY, por lo que NO debe
-- ejecutarse dentro de BEGIN/COMMIT ni dentro de una transaccion explicita.
--
-- Objetivo:
-- 1. Acelerar ranking, historial, progreso y validaciones frecuentes.
-- 2. Evitar bloqueos largos durante la creacion de indices en una BD con datos.
-- 3. No modificar datos ni cambiar contratos existentes.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_intentos_usuario_fecha
    ON lms_core.intentos (id_usuario, fecha_intento DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_intentos_ejercicio_correcto_fecha
    ON lms_core.intentos (id_ejercicio, es_correcto, fecha_intento DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_intentos_fecha
    ON lms_core.intentos (fecha_intento DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_intentos_correctos_usuario_ejercicio
    ON lms_core.intentos (id_usuario, id_ejercicio)
    WHERE es_correcto = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ejercicios_tipo_mision_id
    ON lms_core.ejercicios_practicos (tipo_mision, id_ejercicio);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_modulos_orden
    ON lms_core.modulos (orden);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuarios_rol_activo
    ON lms_core.usuarios (id_rol, activo);
