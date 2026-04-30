-- Agregar columnas de racha a la tabla usuarios solo por probar 
ALTER TABLE lms_core.usuarios
ADD COLUMN IF NOT EXISTS racha_actual integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS mejor_racha integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_practica date;

-- Limpiar datos inconsistentes (donde racha_actual > mejor_racha)
UPDATE lms_core.usuarios SET mejor_racha = racha_actual WHERE racha_actual > mejor_racha;

-- Actualizar racha desde la tabla de intentos para usuarios existentes
WITH actividad_usuario AS (
    SELECT
        id_usuario,
        COUNT(DISTINCT DATE(fecha_intento)) as dias_actividad
    FROM lms_core.intentos
    GROUP BY id_usuario
)
UPDATE lms_core.usuarios u
SET racha_actual = CASE
    WHEN a.dias_actividad > 0 THEN 1
    ELSE 0
END
FROM actividad_usuario a
WHERE u.id_usuario = a.id_usuario;
