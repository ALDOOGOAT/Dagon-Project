-- Agregar columnas de racha a la tabla usuarios (si no existen)
ALTER TABLE lms_core.usuarios
ADD COLUMN IF NOT EXISTS racha_actual integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS mejor_racha integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_practica date;

-- Limpiar datos inconsistentes (donde racha_actual > mejor_racha)
UPDATE lms_core.usuarios SET mejor_racha = racha_actual WHERE racha_actual > mejor_racha;