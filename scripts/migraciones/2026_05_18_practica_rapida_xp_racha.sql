-- Dagon - Practica relampago con XP diaria limitada y ranking consistente.
--
-- Objetivo:
-- - La practica RAPIDA salva racha con cada acierto correcto.
-- - Solo los primeros 5 aciertos RAPIDA del dia dan XP.
-- - El ranking calcula la misma XP que el backend para evitar farm infinito.
--
-- Ejecutar en la base principal con un usuario con permisos sobre lms_core.

BEGIN;

CREATE OR REPLACE VIEW lms_core.v_ranking_alumnos AS
WITH historia_unica AS (
    SELECT DISTINCT i.id_usuario, i.id_ejercicio
    FROM lms_core.intentos i
    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio
    WHERE i.es_correcto = true
      AND COALESCE(e.tipo_mision, 'HISTORIA') <> 'RAPIDA'
),
historia AS (
    SELECT hu.id_usuario,
           SUM(e.dificultad * 10) AS xp_historia
    FROM historia_unica hu
    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = hu.id_ejercicio
    GROUP BY hu.id_usuario
),
rapida_ordenada AS (
    SELECT i.id_usuario,
           ROW_NUMBER() OVER (
               PARTITION BY i.id_usuario, DATE(i.fecha_intento)
               ORDER BY i.fecha_intento, i.id_intento
           ) AS rn
    FROM lms_core.intentos i
    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio
    WHERE i.es_correcto = true
      AND e.tipo_mision = 'RAPIDA'
),
rapida AS (
    SELECT id_usuario,
           COUNT(*) * 5 AS xp_rapida
    FROM rapida_ordenada
    WHERE rn <= 5
    GROUP BY id_usuario
),
ejercicios AS (
    SELECT id_usuario,
           COUNT(DISTINCT id_ejercicio) AS ejercicios_resueltos
    FROM lms_core.intentos
    WHERE es_correcto = true
    GROUP BY id_usuario
)
SELECT
    u.id_usuario,
    u.nombre,
    u.email,
    COALESCE(ej.ejercicios_resueltos, 0) AS ejercicios_resueltos,
    COALESCE(h.xp_historia, 0) + COALESCE(r.xp_rapida, 0) AS xp_total
FROM lms_core.usuarios u
LEFT JOIN historia h ON h.id_usuario = u.id_usuario
LEFT JOIN rapida r ON r.id_usuario = u.id_usuario
LEFT JOIN ejercicios ej ON ej.id_usuario = u.id_usuario
WHERE u.activo = true
ORDER BY xp_total DESC, ejercicios_resueltos DESC, u.nombre;

GRANT SELECT ON TABLE lms_core.v_ranking_alumnos TO app_backend_user;

COMMIT;
