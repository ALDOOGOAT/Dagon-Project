-- Dagon - Banco progresivo para practica relampago.
--
-- Objetivo:
-- - Agregar ejercicios RAPIDA de complejidad inicial y basica.
-- - Evitar que el nivel inicial caiga en agregaciones, DDL, secuencias o DML.
-- - Mantener la progresion: lectura simple -> filtros -> agregaciones -> joins/DDL.
--
-- Ejecutar en la base principal con un usuario con permisos sobre lms_core.

BEGIN;

WITH nuevos(id_modulo, enunciado, query_maestra, dificultad, configuracion_extra, titulo, orden, tipo_mision, formato) AS (
    VALUES
        (1, 'Mira todos los aventureros del gremio.', 'SELECT * FROM aventureros;', 1, NULL::jsonb, 'Relampago Inicial: Universo de aventureros', 301, 'RAPIDA', 'editor'),
        (1, 'Muestra solo los nombres de los aventureros.', 'SELECT nombre FROM aventureros;', 1, NULL::jsonb, 'Relampago Inicial: Nombres del gremio', 302, 'RAPIDA', 'editor'),
        (1, 'Muestra las clases registradas de los aventureros.', 'SELECT clase FROM aventureros;', 1, NULL::jsonb, 'Relampago Inicial: Clases visibles', 303, 'RAPIDA', 'editor'),
        (1, 'Muestra nombre y nivel para leer dos columnas a la vez.', 'SELECT nombre, nivel FROM aventureros;', 1, NULL::jsonb, 'Relampago Inicial: Dos columnas', 304, 'RAPIDA', 'editor'),
        (1, 'Mira todos los objetos de equipamiento disponibles.', 'SELECT * FROM equipamiento;', 1, NULL::jsonb, 'Relampago Inicial: Inventario visible', 305, 'RAPIDA', 'editor'),
        (1, 'Muestra solo el nombre de cada objeto del inventario.', 'SELECT item FROM equipamiento;', 1, NULL::jsonb, 'Relampago Inicial: Items del inventario', 306, 'RAPIDA', 'editor'),
        (2, 'Filtra aventureros de clase Mago.', 'SELECT nombre FROM aventureros WHERE clase = ''Mago'';', 2, NULL::jsonb, 'Relampago Basico: Filtro por clase', 401, 'RAPIDA', 'editor'),
        (2, 'Muestra aventureros con nivel mayor a 10.', 'SELECT nombre FROM aventureros WHERE nivel > 10;', 2, NULL::jsonb, 'Relampago Basico: Nivel mayor', 402, 'RAPIDA', 'editor'),
        (2, 'Ordena los aventureros por nivel de menor a mayor.', 'SELECT nombre, nivel FROM aventureros ORDER BY nivel ASC;', 2, NULL::jsonb, 'Relampago Basico: Orden por nivel', 403, 'RAPIDA', 'editor'),
        (2, 'Muestra equipamiento con precio mayor a 100.', 'SELECT item, precio FROM equipamiento WHERE precio > 100;', 2, NULL::jsonb, 'Relampago Basico: Precio filtrado', 404, 'RAPIDA', 'editor')
)
UPDATE lms_core.ejercicios_practicos e
SET id_modulo = n.id_modulo,
    enunciado = n.enunciado,
    query_maestra = n.query_maestra,
    dificultad = n.dificultad,
    configuracion_extra = n.configuracion_extra,
    orden = n.orden,
    tipo_mision = n.tipo_mision,
    formato = n.formato
FROM nuevos n
WHERE e.titulo = n.titulo;

WITH nuevos(id_modulo, enunciado, query_maestra, dificultad, configuracion_extra, titulo, orden, tipo_mision, formato) AS (
    VALUES
        (1, 'Mira todos los aventureros del gremio.', 'SELECT * FROM aventureros;', 1, NULL::jsonb, 'Relampago Inicial: Universo de aventureros', 301, 'RAPIDA', 'editor'),
        (1, 'Muestra solo los nombres de los aventureros.', 'SELECT nombre FROM aventureros;', 1, NULL::jsonb, 'Relampago Inicial: Nombres del gremio', 302, 'RAPIDA', 'editor'),
        (1, 'Muestra las clases registradas de los aventureros.', 'SELECT clase FROM aventureros;', 1, NULL::jsonb, 'Relampago Inicial: Clases visibles', 303, 'RAPIDA', 'editor'),
        (1, 'Muestra nombre y nivel para leer dos columnas a la vez.', 'SELECT nombre, nivel FROM aventureros;', 1, NULL::jsonb, 'Relampago Inicial: Dos columnas', 304, 'RAPIDA', 'editor'),
        (1, 'Mira todos los objetos de equipamiento disponibles.', 'SELECT * FROM equipamiento;', 1, NULL::jsonb, 'Relampago Inicial: Inventario visible', 305, 'RAPIDA', 'editor'),
        (1, 'Muestra solo el nombre de cada objeto del inventario.', 'SELECT item FROM equipamiento;', 1, NULL::jsonb, 'Relampago Inicial: Items del inventario', 306, 'RAPIDA', 'editor'),
        (2, 'Filtra aventureros de clase Mago.', 'SELECT nombre FROM aventureros WHERE clase = ''Mago'';', 2, NULL::jsonb, 'Relampago Basico: Filtro por clase', 401, 'RAPIDA', 'editor'),
        (2, 'Muestra aventureros con nivel mayor a 10.', 'SELECT nombre FROM aventureros WHERE nivel > 10;', 2, NULL::jsonb, 'Relampago Basico: Nivel mayor', 402, 'RAPIDA', 'editor'),
        (2, 'Ordena los aventureros por nivel de menor a mayor.', 'SELECT nombre, nivel FROM aventureros ORDER BY nivel ASC;', 2, NULL::jsonb, 'Relampago Basico: Orden por nivel', 403, 'RAPIDA', 'editor'),
        (2, 'Muestra equipamiento con precio mayor a 100.', 'SELECT item, precio FROM equipamiento WHERE precio > 100;', 2, NULL::jsonb, 'Relampago Basico: Precio filtrado', 404, 'RAPIDA', 'editor')
)
INSERT INTO lms_core.ejercicios_practicos
    (id_modulo, enunciado, query_maestra, dificultad, configuracion_extra, titulo, orden, tipo_mision, formato)
SELECT n.id_modulo, n.enunciado, n.query_maestra, n.dificultad, n.configuracion_extra, n.titulo, n.orden, n.tipo_mision, n.formato
FROM nuevos n
WHERE NOT EXISTS (
    SELECT 1
    FROM lms_core.ejercicios_practicos e
    WHERE e.titulo = n.titulo
);

COMMIT;
