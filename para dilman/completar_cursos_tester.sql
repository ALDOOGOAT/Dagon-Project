-- ============================================================
-- SCRIPT PARA COMPLETAR AMBOS CURSOS
-- Usuario: Dagon Tester (tester@dagon.com)
-- Esto marca todos los ejercicios como completados para ambos cursos
-- ============================================================

-- Obtener el ID del usuario tester
DO $$
DECLARE
    tester_id UUID;
    ejercicio_row RECORD;
BEGIN
    -- Buscar al usuario tester
    SELECT id_usuario INTO tester_id
    FROM lms_core.usuarios
    WHERE email = 'tester@dagon.com';

    IF tester_id IS NULL THEN
        RAISE NOTICE 'Usuario tester no encontrado';
        RETURN;
    END IF;

    RAISE NOTICE 'Completando ejercicios para usuario: %', tester_id;

    -- Marcar TODOS los ejercicios como completados
    FOR ejercicio_row IN SELECT id_ejercicio FROM lms_core.ejercicios_practicos
    LOOP
        -- Solo insertar si no existe ya
        INSERT INTO lms_core.intentos (id_usuario, id_ejercicio, query_enviada, es_correcto, fecha_intento)
        SELECT tester_id, ejercicio_row.id_ejercicio, 'Completado por script de prueba', true, NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM lms_core.intentos
            WHERE id_usuario = tester_id
            AND id_ejercicio = ejercicio_row.id_ejercicio
            AND es_correcto = true
        );
    END LOOP;

    RAISE NOTICE 'Ejercicios completados exitosamente!';
END $$;

-- Verificar progreso
SELECT 
    u.nombre,
    u.email,
    COUNT(DISTINCT CASE WHEN i.es_correcto THEN i.id_ejercicio END) as ejercicios_completados,
    SUM(CASE 
        WHEN e.tipo_mision = 'RAPIDA' THEN 5 
        ELSE e.dificultad * 10 
    END) as xp_total
FROM lms_core.usuarios u
LEFT JOIN lms_core.intentos i ON u.id_usuario = i.id_usuario AND i.es_correcto = true
LEFT JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio
WHERE u.email = 'tester@dagon.com'
GROUP BY u.id_usuario, u.nombre, u.email;

-- Verificar por curso
SELECT 
    c.titulo as curso,
    COUNT(DISTINCT e.id_ejercicio) as total_ejercicios,
    COUNT(DISTINCT CASE WHEN i.es_correcto THEN e.id_ejercicio END) as completados
FROM lms_core.cursos c
JOIN lms_core.modulos m ON c.id_curso = m.id_curso
JOIN lms_core.ejercicios_practicos e ON m.id_modulo = e.id_modulo
LEFT JOIN lms_core.intentos i ON e.id_ejercicio = i.id_ejercicio 
    AND i.id_usuario = (SELECT id_usuario FROM lms_core.usuarios WHERE email = 'tester@dagon.com')
    AND i.es_correcto = true
GROUP BY c.id_curso, c.titulo;

-- Verificar módulos completados
SELECT 
    m.titulo,
    COUNT(DISTINCT e.id_ejercicio) as total,
    COUNT(DISTINCT CASE WHEN i.es_correcto THEN e.id_ejercicio END) as completados
FROM lms_core.modulos m
JOIN lms_core.ejercicios_practicos e ON m.id_modulo = e.id_modulo
LEFT JOIN lms_core.intentos i ON e.id_ejercicio = i.id_ejercicio 
    AND i.id_usuario = (SELECT id_usuario FROM lms_core.usuarios WHERE email = 'tester@dagon.com')
    AND i.es_correcto = true
GROUP BY m.id_modulo, m.titulo
ORDER BY m.orden;