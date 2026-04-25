-- ============================================================================
-- SCRIPT DE REMODELACIÓN: MÓDULO 1 (Teoría de Conjuntos) y MÓDULO 2 (CRUD)
-- ============================================================================
-- Este script reorganiza los niveles de los módulos 1 y 2
-- 
-- MÓDULO 1: Teoría de Conjuntos (análisis de datos, teoría de conjuntos SQL)
-- MÓDULO 2: CRUD (Insert, Update, Delete con práctica intercalada)
--
-- EJECUTAR EN ORDEN:
-- 1. Primero este script
-- 2. Luego verificar los cambios
-- ============================================================================

-- ============================================================================
-- 1. ACTUALIZAR NOMBRES DE LOS MÓDULOS
-- ============================================================================

UPDATE lms_core.modulos 
SET titulo = 'Módulo 1: Teoría de Conjuntos', descripcion = 'Aprende a analizar datos con SELECT, фильтros y funciones de agregación'
WHERE id_modulo = 1;

UPDATE lms_core.modulos 
SET titulo = 'Módulo 2: Manipulación de Datos', descripcion = 'Domina el CRUD: Insert, Update y Delete'
WHERE id_modulo = 2;

-- ============================================================================
-- 2. ELIMINAR LOS EJERCICIOS PRÁCTICOS ACTUALES DE LOS MÓDULOS 1 Y 2
-- ============================================================================

DELETE FROM lms_core.ejercicios_practicos WHERE id_modulo IN (1, 2);

-- ============================================================================
-- 3. INSERTAR NUEVOS EJERCICIOS PARA EL MÓDULO 1: TEORÍA DE CONJUNTOS
-- ============================================================================

-- Nivel 1: Introducción a SELECT (teoría)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, descripcion, tipo, esquema, tabla1, tabla2, query_base, query_validacion, xp, hint) VALUES
(1, 1, '1.1: El Primer Vistazo', 'Aprende a visualizar datos con SELECT', 'editor', 'lms_sandbox', 'usuarios', NULL, 
'SELECT * FROM usuarios', 'SELECT COUNT(*) = 5', 10, 'Usa SELECT * para ver todas las columnas'),

(1, 2, '1.2: El Francotirador', 'Selecciona columnas específicas', 'editor', 'lms_sandbox', 'usuarios', NULL,
'SELECT nombre, email FROM usuarios', 'SELECT nombre, email FROM usuarios LIMIT 1', 10, 'Lista solo las columnas que necesitas'),

-- Nivel 3: WHERE básico (teoría)
(1, 3, '1.3: El Detective', 'Filtra datos con WHERE', 'editor', 'lms_sandbox', 'usuarios', NULL,
'SELECT * FROM usuarios WHERE activo = true', 'SELECT COUNT(*) >= 3', 10, 'WHERE filtra los resultados'),

-- Nivel 4: WHERE con operadores (teoría)
(1, 4, '1.4: El Explorador', 'Usa operadores de comparación', 'editor', 'lms_sandbox', 'productos', NULL,
'SELECT * FROM productos WHERE precio > 100', 'SELECT COUNT(*) >= 2', 10, 'Compara valores numéricos'),

-- Nivel 5: LIKE y patrones (teoría)
(1, 5, '1.5: El Rastreo', 'Busca patrones con LIKE', 'editor', 'lms_sandbox', 'usuarios', NULL,
"SELECT * FROM usuarios WHERE nombre LIKE 'A%'", "SELECT COUNT(*) >= 1", 10, 'Usa % como comodín'),

-- Nivel 6: ORDER BY (teoría)
(1, 6, '1.6: Orden y Metas', 'Ordena resultados', 'editor', 'lms_sandbox', 'productos', NULL,
'SELECT * FROM productos ORDER BY precio DESC', 'SELECT precio FROM productos ORDER BY precio DESC LIMIT 1', 10, 'DESC para mayor a menor'),

-- Nivel 7: LIMIT y paginación (teoría)
(1, 7, '1.7: El Listón', 'Limita resultados', 'editor', 'lms_sandbox', 'usuarios', NULL,
'SELECT * FROM usuarios ORDER BY id ASC LIMIT 3', 'SELECT COUNT(*) = 3', 10, 'LIMIT muestra solo N resultados'),

-- Nivel 8: COUNT y agregados (teoría)
(1, 8, '1.8: El Contador', 'Cuenta registros', 'editor', 'lms_sandbox', 'usuarios', NULL,
'SELECT COUNT(*) AS total FROM usuarios', 'SELECT COUNT(*) > 0', 10, 'COUNT cuenta todas las filas'),

-- Nivel 9: GROUP BY (teoría básica)
(1, 9, '1.9: El Agrupador', 'Agrupa resultados', 'editor', 'lms_sandbox', 'pedidos', NULL,
'SELECT usuario_id, COUNT(*) AS total FROM pedidos GROUP BY usuario_id', 'SELECT usuario_id FROM pedidos GROUP BY usuario_id', 10, 'GROUP BY agrupa por columna'),

-- Nivel 10: HAVING (teoría)
(1, 10, '1.10: El Filtro Final', 'Filtra grupos con HAVING', 'editor', 'lms_sandbox', 'pedidos', NULL,
"SELECT usuario_id, COUNT(*) AS total FROM pedidos GROUP BY usuario_id HAVING COUNT(*) > 1", 'COUNT(*) > 1', 10, 'HAVING filtra después de agrupar'),

-- Práctica intercalada: drag & drop
(1, 101, 'Práctica: Arma tu SELECT', 'Arrastra las palabras para construir un SELECT', 'drag_drop', 'lms_sandbox', 'usuarios', NULL,
'SELECT nombre FROM usuarios WHERE activo = true', 'SELECT nombre FROM usuarios WHERE activo = true', 15, NULL),

(1, 102, 'Práctica: Filtra y Ordena', 'Arrastra para crear una consulta completa', 'drag_drop', 'lms_sandbox', 'productos', NULL,
'SELECT nombre, precio FROM productos WHERE precio > 50 ORDER BY precio DESC', 'SELECT nombre, precio FROM productos WHERE precio > 50 ORDER BY precio DESC', 15, NULL);

-- ============================================================================
-- 4. INSERTAR NUEVOS EJERCICIOS PARA EL MÓDULO 2: CRUD (intercalados)
-- ============================================================================

-- Nivel 1: INSERT básico (teoría)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, descripcion, tipo, esquema, tabla1, tabla2, query_base, query_validacion, xp, hint) VALUES
(2, 1, '2.1: El Nacimiento', 'Inserta nuevos registros', 'editor', 'lms_sandbox', 'usuarios', NULL,
"INSERT INTO usuarios (nombre, email, activo) VALUES ('Nuevo', 'nuevo@email.com', true)", "SELECT COUNT(*) = 1", 10, 'Usa VALUES para insertar'),

-- Práctica intercalada: drag & drop
(2, 2, 'Práctica: Arma tu INSERT', 'Arrastra las palabras para insertar', 'drag_drop', 'lms_sandbox', 'productos', NULL,
"INSERT INTO productos (nombre, precio) VALUES ('Nuevo Producto', 100)", "INSERT INTO productos (nombre, precio) VALUES ('Nuevo Producto', 100)", 15, NULL),

-- Nivel 3: UPDATE básico (teoría)
(2, 3, '2.2: El Ascenso', 'Modifica registros existentes', 'editor', 'lms_sandbox', 'usuarios', NULL,
"UPDATE usuarios SET nivel = nivel + 1 WHERE id = 1", "SELECT nivel FROM usuarios WHERE id = 1", 10, 'UPDATE cambia valores'),

-- Práctica intercalada: drag & drop
(2, 4, 'Práctica: Actualiza precios', 'Arrastra para actualizar', 'drag_drop', 'lms_sandbox', 'productos', NULL,
'UPDATE productos SET precio = precio * 1.1', 'UPDATE productos SET precio = precio * 1.1', 15, NULL),

-- Nivel 5: DELETE básico (teoría)
(2, 5, '2.3: El Sacrificio', 'Elimina registros', 'editor', 'lms_sandbox', 'usuarios', NULL,
'DELETE FROM usuarios WHERE id = 3', 'SELECT COUNT(*) < 5', 10, 'DELETE borra permanentemente'),

-- Nivel 6: INSERT con SELECT (teoría)
(2, 6, '2.4: El Clon', 'Inserta desde otra tabla', 'editor', 'lms_sandbox', 'usuarios', 'productos',
"INSERT INTO productos (nombre, precio) SELECT nombre, precio FROM productos WHERE precio > 100",
'SELECT COUNT(*) > 0', 10, 'INSERT puede usar SELECT'),

-- Práctica intercalada: drag & drop
(2, 7, 'Práctica: Elimina pendientes', 'Arrastra para borrar', 'drag_drop', 'lms_sandbox', 'pedidos', NULL,
"DELETE FROM pedidos WHERE status = 'cancelado'", "DELETE FROM pedidos WHERE status = 'cancelado'", 15, NULL),

-- Nivel 8: UPDATE con JOIN (teoría)
(2, 8, '2.5: El Maestro', 'Actualiza con JOIN', 'editor', 'lms_sandbox', 'usuarios', 'pedidos',
"UPDATE usuarios SET nivel = nivel + 1 WHERE id IN (SELECT usuario_id FROM pedidos)",
'SELECT nivel FROM usuarios WHERE id = 1', 10, 'Usa subconsulta en UPDATE'),

-- Nivel 9: Transacciones (teoría)
(2, 9, '2.6: El Seguro', 'Usa transacciones para seguridad', 'editor', 'lms_sandbox', 'usuarios', NULL,
'BEGIN; UPDATE usuarios SET nivel = 5 WHERE id = 1; ROLLBACK;', 'SELECT nivel FROM usuarios WHERE id = 1', 10, 'ROLLBACK revierte cambios'),

-- Práctica intercalada: drag & drop
(2, 10, 'Práctica: CRUD Completo', 'Arrastra las palabras para completar operaciones', 'drag_drop', 'lms_sandbox', 'productos', NULL,
'SELECT * FROM productos WHERE precio > (SELECT AVG(precio) FROM productos)', 'SELECT * FROM productos WHERE precio > (SELECT AVG(precio) FROM productos)', 20, NULL);

-- ============================================================================
-- 5. VERIFICAR LOS CAMBIOS
-- ============================================================================

-- Ver módulos actualizados
SELECT id_modulo, titulo, descripcion FROM lms_core.modulos WHERE id_modulo IN (1, 2);

-- Contar ejercicios por módulo
SELECT id_modulo, COUNT(*) AS total_ejercicios 
FROM lms_core.ejercicios_practicos 
GROUP BY id_modulo 
ORDER BY id_modulo;

-- Ver niveles del módulo 1
SELECT orden, titulo, tipo FROM lms_core.ejercicios_practicos 
WHERE id_modulo = 1 
ORDER BY orden;

-- Ver niveles del módulo 2
SELECT orden, titulo, tipo FROM lms_core.ejercicios_practicos 
WHERE id_modulo = 2 
ORDER BY orden;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================