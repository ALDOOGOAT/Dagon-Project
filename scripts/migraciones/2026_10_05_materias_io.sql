-- Dagon - Multimateria: catalogo de materias, cursos.materia_slug y XP por materia.
--
-- Objetivo:
-- - Soportar mas de una materia (SQL y Investigacion de Operaciones) sin tocar
--   ejercicios_practicos ni intentos.
-- - v_xp_por_materia reparte la XP de v_ranking_alumnos por materia; el desbloqueo de
--   modulos y el ranking por materia leen de ahi.
--
-- Idempotente. Ejecutar en la base principal con un usuario con permisos sobre lms_core.

BEGIN;

CREATE TABLE IF NOT EXISTS lms_core.materias (
    slug varchar(30) PRIMARY KEY,
    nombre text NOT NULL,
    descripcion text,
    orden integer NOT NULL DEFAULT 0,
    activa boolean NOT NULL DEFAULT true
);

INSERT INTO lms_core.materias (slug, nombre, descripcion, orden) VALUES
    ('sql', 'Bases de Datos SQL', 'SQL y PostgreSQL: consultas, modelado, transacciones y rendimiento', 1),
    ('io', 'Investigación de Operaciones', 'Programación lineal, simplex, transporte, redes, inventarios, colas y Markov — plan UNACH', 2)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE lms_core.cursos
    ADD COLUMN IF NOT EXISTS materia_slug varchar(30) NOT NULL DEFAULT 'sql' REFERENCES lms_core.materias(slug);

-- XP por materia: misma formula que v_ranking_alumnos (historia unica + practica
-- rapida con tope de 5 por dia), agrupada por cursos.materia_slug. El tope diario
-- se calcula sobre todas las materias, asi que la suma de materias = xp_total global.
CREATE OR REPLACE VIEW lms_core.v_xp_por_materia AS
WITH historia_unica AS (
    SELECT DISTINCT i.id_usuario, i.id_ejercicio
    FROM lms_core.intentos i
    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio
    WHERE i.es_correcto = true
      AND COALESCE(e.tipo_mision, 'HISTORIA') <> 'RAPIDA'
),
historia AS (
    SELECT hu.id_usuario,
           c.materia_slug,
           SUM(e.dificultad * 10) AS xp
    FROM historia_unica hu
    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = hu.id_ejercicio
    JOIN lms_core.modulos m ON m.id_modulo = e.id_modulo
    JOIN lms_core.cursos c ON c.id_curso = m.id_curso
    GROUP BY hu.id_usuario, c.materia_slug
),
rapida_ordenada AS (
    SELECT i.id_usuario,
           c.materia_slug,
           ROW_NUMBER() OVER (
               PARTITION BY i.id_usuario, DATE(i.fecha_intento)
               ORDER BY i.fecha_intento, i.id_intento
           ) AS rn
    FROM lms_core.intentos i
    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio
    JOIN lms_core.modulos m ON m.id_modulo = e.id_modulo
    JOIN lms_core.cursos c ON c.id_curso = m.id_curso
    WHERE i.es_correcto = true
      AND e.tipo_mision = 'RAPIDA'
),
rapida AS (
    SELECT id_usuario,
           materia_slug,
           COUNT(*) * 5 AS xp
    FROM rapida_ordenada
    WHERE rn <= 5
    GROUP BY id_usuario, materia_slug
),
xp_materia AS (
    SELECT id_usuario, materia_slug, SUM(xp)::bigint AS xp
    FROM (
        SELECT id_usuario, materia_slug, xp FROM historia
        UNION ALL
        SELECT id_usuario, materia_slug, xp FROM rapida
    ) t
    GROUP BY id_usuario, materia_slug
),
ejercicios AS (
    SELECT i.id_usuario,
           c.materia_slug,
           COUNT(DISTINCT i.id_ejercicio) AS ejercicios_resueltos
    FROM lms_core.intentos i
    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio
    JOIN lms_core.modulos m ON m.id_modulo = e.id_modulo
    JOIN lms_core.cursos c ON c.id_curso = m.id_curso
    WHERE i.es_correcto = true
    GROUP BY i.id_usuario, c.materia_slug
)
SELECT x.id_usuario,
       x.materia_slug,
       x.xp,
       COALESCE(ej.ejercicios_resueltos, 0) AS ejercicios_resueltos
FROM xp_materia x
JOIN lms_core.usuarios u ON u.id_usuario = x.id_usuario AND u.activo = true
LEFT JOIN ejercicios ej ON ej.id_usuario = x.id_usuario AND ej.materia_slug = x.materia_slug;

GRANT SELECT ON TABLE lms_core.materias TO app_backend_user;
GRANT SELECT ON TABLE lms_core.v_xp_por_materia TO app_backend_user;

COMMIT;
