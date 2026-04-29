-- ============================================================
-- Módulo 15: Transacciones estilo terminal PostgreSQL
-- Autor: integración manual para Dagon
-- Objetivo:
--   1. Marcar las misiones del módulo 15 como laboratorio transaccional
--   2. Inyectar metadata pedagógica para el frontend
--   3. Mantener la lógica actual de ejercicios sin romper el contenido
-- ============================================================

BEGIN;

UPDATE lms_core.ejercicios_practicos
SET configuracion_extra = jsonb_build_object(
  'tipo_validacion', 'transaccion',
  'modo', 'terminal_transaccional',
  'terminal_prompt_base', 'dagon=#',
  'terminal_prompt_tx', 'dagon=*#',
  'sesiones_paralelas', true,
  'paneles', jsonb_build_array('sesion_a', 'sesion_b', 'linea_tiempo', 'aislamiento'),
  'foco', jsonb_build_array('BEGIN', 'COMMIT', 'visibilidad'),
  'mensaje_terminal', 'Inserta como si estuvieras en psql real: primero abre la transacción, luego ejecuta el cambio y confirma para hacerlo visible a otras sesiones.'
)
WHERE id_ejercicio = 80;

UPDATE lms_core.ejercicios_practicos
SET configuracion_extra = jsonb_build_object(
  'tipo_validacion', 'transaccion',
  'modo', 'terminal_transaccional',
  'terminal_prompt_base', 'dagon=#',
  'terminal_prompt_tx', 'dagon=*#',
  'sesiones_paralelas', true,
  'paneles', jsonb_build_array('sesion_a', 'sesion_b', 'linea_tiempo', 'rollback_total'),
  'foco', jsonb_build_array('BEGIN', 'ROLLBACK', 'estado_confirmado'),
  'mensaje_terminal', 'Piensa en ROLLBACK como regresar al último estado confirmado. La otra sesión nunca alcanza a ver lo que quedó pendiente.'
)
WHERE id_ejercicio = 81;

UPDATE lms_core.ejercicios_practicos
SET configuracion_extra = jsonb_build_object(
  'tipo_validacion', 'transaccion',
  'modo', 'terminal_transaccional',
  'terminal_prompt_base', 'dagon=#',
  'terminal_prompt_tx', 'dagon=*#',
  'sesiones_paralelas', true,
  'paneles', jsonb_build_array('sesion_a', 'sesion_b', 'linea_tiempo', 'savepoint'),
  'foco', jsonb_build_array('SAVEPOINT', 'ROLLBACK TO SAVEPOINT', 'COMMIT'),
  'mensaje_terminal', 'Esta misión enseña rollback parcial: conserva la parte correcta de la transacción y deshaz solo el bloque posterior al savepoint.'
)
WHERE id_ejercicio = 82;

COMMIT;

-- Verificación rápida opcional:
-- SELECT id_ejercicio, titulo, configuracion_extra
-- FROM lms_core.ejercicios_practicos
-- WHERE id_modulo = 15
-- ORDER BY orden;
