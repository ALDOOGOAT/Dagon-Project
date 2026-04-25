-- ============================================================================
-- SCRIPT: Remodelación MÓDULO 1 - TEORÍA DE CONJUNTOS (Con Metaforas de Dagon)
-- ============================================================================
-- Ejecutar en Railway: psql -f remodelacion_modulo1_teoria_conjuntos.sql
-- ============================================================================

-- ============================================================================
-- 1. ACTUALIZAR NOMBRE DEL MÓDULO 1
-- ============================================================================

UPDATE lms_core.modulos 
SET titulo = 'Módulo 1: Teoría de Conjuntos', descripcion = 'Aprende a pensar en SQL como matemático: Conjuntos, intersecciones y uniones'
WHERE id_modulo = 1;

-- ============================================================================
-- 2. ELIMINAR EJERCICIOS ANTIGUOS DEL MÓDULO 1 (orden 1-10)
-- ============================================================================

DELETE FROM lms_core.ejercicios_practicos WHERE id_modulo = 1 AND orden <= 10;

-- ============================================================================
-- 3. INSERTAR NUEVOS EJERCICIOS (con columnas correctas)
-- ============================================================================

-- Nivel 1.1: El Conjunto Universo
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 1, '1.1: El Conjunto Universo', 
'El Gran salón contiene TODOS los aventureros. SELECT * = ver TODO',
'SELECT * FROM usuarios', 1);

-- Nivel 1.2: El Subconjunto (WHERE básico)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 2, '1.2: El Subconjunto - Filtrado',
'De todos los del Gran Salón, los Magos dan un paso al frente. WHERE crea un Subconjunto',
'SELECT * FROM usuarios WHERE clase = ''Mago''', 1);

-- Nivel 1.3: La Intersección (AND)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 3, '1.3: La Intersección - AND',
'Deben estar en el círculo de GUERREROS Y tener nivel > 10. Solo los de en medio',
'SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 10', 2);

-- Nivel 1.4: La Unión Lógica (OR)  
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 4, '1.4: La Unión - OR',
'Cualquiera que sea Mago O Arquero entra al grupo',
'SELECT * FROM usuarios WHERE clase = ''Mago'' OR clase = ''Arquero''', 2);

-- Nivel 1.5: La Diferencia/Exclusión (NOT !=)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 5, '1.5: La Diferencia - NOT/!=',
'Excluye a los Paladines del grupo. != significa NO ES',
'SELECT * FROM usuarios WHERE clase != ''Paladin''', 2);

-- Nivel 1.6: Intersección Múltiple (AND multiple)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 6, '1.6: Múltiples Interscciones',
'Guerreros con nivel > 15 Y que estén activos',
'SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 15 AND activo = true', 3);

-- Nivel 1.7: Unión con diferentes valores (OR multiple)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 7, '1.7: Múltiples Unions - IN',
'Que sean Mago, Arquero o Guerrero. IN simplifica muchos OR',
'SELECT * FROM usuarios WHERE clase IN (''Mago'', ''Arquero'', ''Guerrero'')', 3);

-- ============================================================================
-- 4. VERIFICAR LOS CAMBIOS
-- ============================================================================

-- Ver módulos
SELECT id_modulo, titulo FROM lms_core.modulos WHERE id_modulo IN (1,2);

-- Contar ejercicios por módulo
SELECT id_modulo, COUNT(*) as total FROM lms_core.ejercicios_practicos 
GROUP BY id_modulo ORDER BY id_modulo;

-- Ver ejercicios del Módulo 1
SELECT orden, titulo, LEFT(enunciado, 60) as enunciado_corto, dificultad 
FROM lms_core.ejercicios_practicos 
WHERE id_modulo = 1 ORDER BY orden;