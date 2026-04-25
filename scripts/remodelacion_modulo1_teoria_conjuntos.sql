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
-- 2. ELIMINAR EJERCICIOS ACTUALES DEL MÓDULO 1
-- ============================================================================

DELETE FROM lms_core.ejercicios_practicos WHERE id_modulo = 1;

-- ============================================================================
-- 3. EJERCICIOS DEL MÓDULO 1: TEORÍA DE CONJUNTOS (Con metaforas)
-- ============================================================================

-- Nivel 1.1: El Conjunto Universo
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 1, '1.1: El Conjunto Universo', 
'El Gran salón contiene TODOS los aventureros. SELECT * = ver TODO',
'SELECT * FROM usuarios', 
' SELECT * FROM usuarios');

-- Nivel 1.2: El Subconjunto (WHERE básico)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 2, '1.2: El Subconjunto - Filtrado',
'De todos los del Gran Salón, los Magos dan un paso al frente. WHERE crea un Subconjunto',
'SELECT * FROM usuarios WHERE clase = ''Mago'' ',
' SELECT * FROM usuarios WHERE clase = ''Mago'' ');

-- Nivel 1.3: La Intersección (AND)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 3, '1.3: La Intersección - AND',
'Deben estar en el círculo de GUERREROS Y tener nivel > 10. Solo los de en medio',
'SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 10',
' SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 10');

-- Nivel 1.4: La Unión Lógica (OR)  
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 4, '1.4: La Unión - OR',
'Cualquiera que sea Mago O Arquero entra al grupo',
'SELECT * FROM usuarios WHERE clase = ''Mago'' OR clase = ''Arquero'' ',
' SELECT * FROM usuarios WHERE clase = ''Mago'' OR clase = ''Arquero'' ');

-- Nivel 1.5: La Diferencia/Exclusión (NOT !=)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 5, '1.5: La Diferencia - NOT/!=',
'Excluye a los Paladines del grupo. != significa NO ES',
'SELECT * FROM usuarios WHERE clase != ''Paladin'' ',
' SELECT * FROM usuarios WHERE clase != ''Paladin'' ');

-- Nivel 1.6: Múltiples Interscciones ( múltiples AND)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 6, '1.6: Múltiples Interscciones',
'Guerreros Y nivel > 15 Y activos. Múltiples condiciones a la vez',
'SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 15 AND activo = true',
' SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 15 AND activo = true');

-- Nivel 1.7: Múltiples Unions - IN ( lista)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 7, '1.7: Múltiples Unions - IN',
'Que sean Mago, Arquero o Guerrero. IN simplifica muchos OR',
'SELECT * FROM usuarios WHERE clase IN (''Mago'', ''Arquero'', ''Guerrero'')',
' SELECT * FROM usuarios WHERE clase IN (''Mago'', ''Arquero'', ''Guerrero'')');

-- ============================================================================
-- 4. PRÁCTICAS DEL MÓDULO 1 (Ejercicios extra para practicar)
-- ============================================================================

INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 101, 'Práctica: Arma tu Intersección',
'Encuentra los Guerreros con nivel mayor a 10',
'SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 10',
' SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 10');

INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, enunciado, query_maestra, dificultad) VALUES
(1, 102, 'Práctica: La Unión Multiple',
'Muestra los usuarios que sean Magos o tengan nivel mayor a 20',
'SELECT * FROM usuarios WHERE clase = ''Mago'' OR nivel > 20',
' SELECT * FROM usuarios WHERE clase = ''Mago'' OR nivel > 20');

-- ============================================================================
-- 5. VERIFICAR
-- ============================================================================

SELECT id_modulo, titulo FROM lms_core.modulos WHERE id_modulo = 1;

SELECT id_modulo, COUNT(*) as total FROM lms_core.ejercicios_practicos GROUP BY id_modulo ORDER BY id_modulo;

SELECT orden, titulo, LEFT(enunciado, 60) as enunciado_corto, dificultad FROM lms_core.ejercicios_practicos WHERE id_modulo = 1 ORDER BY orden;