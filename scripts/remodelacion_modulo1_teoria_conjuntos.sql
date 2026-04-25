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
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, descripcion, tipo, esquema, tabla1, query_base, query_validacion, xp, hint) VALUES
(1, 1, '1.1: El Conjunto Universo', 
'ElGran salón contiene TODOS los aventureros. SELECT * = ver TODO', 
'editor', 'lms_sandbox', 'usuarios', 
'SELECT * FROM usuarios', 
'SELECT COUNT(*) >= 1', 10,
'"Imagina el Gran Salón del Gremio donde están TODOS. SELECT * significa TODO"');

-- Nivel 1.2: El Subconjunto (WHERE básico)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, descripcion, tipo, esquema, tabla1, query_base, query_validacion, xp, hint) VALUES
(1, 2, '1.2: El Subconjunto - Filtrado',
'"De todos los del Gran Salón, los Magos dan un paso al frente. WHERE crea un Subconjunto"',
'editor', 'lms_sandbox', 'usuarios',
'SELECT * FROM usuarios WHERE clase = ''Mago''',
'SELECT COUNT(*) >= 1', 10,
'WHERE filtra: solo los que cumplen la condición');

-- Nivel 1.3: La Intersección (AND)
(1, 3, '1.3: La Intersección - AND',
'"Deben estar en el círculo de GUERREROS Y tener nivel > 10. Solo los de en medio"',
'editor', 'lms_sandbox', 'usuarios',
'SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 10',
'SELECT COUNT(*) >= 1', 10,
'AND = cumple AMBAS condiciones');

-- Nivel 1.4: La Unión Lógica (OR)  
(1, 4, '1.4: La Unión - OR',
'"Cualquiera que sea Mago O Arquero entra al grupo"',
'editor', 'lms_sandbox', 'usuarios',
'SELECT * FROM usuarios WHERE clase = ''Mago'' OR clase = ''Arquero''',
'SELECT COUNT(*) >= 1', 10,
'OR = cumple CUALQUIERA de las condiciones');

-- Nivel 1.5: La Diferencia/Exclusión (NOT !=)
INSERT INTO lms_core.ejercicios_practicos (id_modulo, orden, titulo, descripcion, tipo, esquema, tabla1, query_base, query_validacion, xp, hint) VALUES
(1, 5, '1.5: La Diferencia - NOT/!=',
'"Excluye a los Paladines del grupo. != significa NO ES"',
'editor', 'lms_sandbox', 'usuarios',
'SELECT * FROM usuarios WHERE clase != ''Paladin''',
'SELECT COUNT(*) >= 1', 10,
'!= o <> significa diferente/no igual');

-- Nivel 1.6: Intersección Múltiple (AND multiple)
(1, 6, '1.6: Múltiples Interscciones',
'"Guerreros con nivel > 15 Y que estén activos"',
'editor', 'lms_sandbox', 'usuarios',
'SELECT * FROM usuarios WHERE clase = ''Guerrero'' AND nivel > 15 AND activo = true',
'SELECT COUNT(*) >= 1', 10,
'Puedes encadenar muchos AND');

-- Nivel 1.7: Unión con differentes valores (OR multiple)
(1, 7, '1.7: Múltiples Unions - IN',
'"Que sean Mago, Arquero o Guerrero. IN simplifica muchos OR"',
'editor', 'lms_sandbox', 'usuarios',
'SELECT * FROM usuarios WHERE clase IN (''Mago'', ''Arquero'', ''Guerrero'')',
'SELECT COUNT(*) >= 1', 10,
'IN (a,b,c) = a OR b OR c');

-- Práctica intercalada: Drag & Drop
(1, 101, 'Práctica: Arma tu Intersección',
'Arrastra las palabras para crear un AND deintersección',
'drag_drop', 'lms_sandbox', 'usuarios',
'SELECT * FROM usuarios WHERE clase = ''Mago'' AND nivel > 5',
'SELECT * FROM usuarios WHERE clase = ''Mago'' AND nivel > 5', 15, NULL);

-- ============================================================================
-- 4. VERIFICAR LOS CAMBIOS
-- ============================================================================

-- Ver módulos
SELECT id_modulo, titulo FROM lms_core.modulos WHERE id_modulo IN (1,2);

-- Contar ejercicios por módulo
SELECT id_modulo, COUNT(*) as total FROM lms_core.ejercicios_practicos 
GROUP BY id_modulo ORDER BY id_modulo;

-- Ver ejercicios del Módulo 1
SELECT orden, titulo, LEFT(descripcion, 60) as desc_corta, tipo 
FROM lms_core.ejercicios_practicos 
WHERE id_modulo = 1 ORDER BY orden;