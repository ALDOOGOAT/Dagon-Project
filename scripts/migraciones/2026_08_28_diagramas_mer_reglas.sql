-- ============================================================================
-- 2026_08_28_diagramas_mer_reglas.sql
--
-- Los ejercicios de diagrama MER pedian en el enunciado mucho mas de lo que
-- configuracion_extra permitia comprobar, asi que se aprobaban con cualquier
-- diagrama que cumpliera los conteos minimos:
--
--   * 16 "El Lienzo del Arquitecto": pide dos entidades conectadas por una llave
--     foranea, pero no se exigia ninguna clave primaria a la que apuntar.
--   * 28 "La Posada del Arquitecto": pide "cada una con al menos 2 atributos" y
--     solo se comprobaba el total (6 atributos en una sola entidad pasaban).
--   * 40 "Reto Final Fase 1: El Plano": nombra Huespedes, Habitaciones y Reservas
--     y solo se contaban 3 entidades y 2 relaciones, con cualquier nombre.
--
-- Las claves nuevas (min_atributos_por_entidad, requiere_pk, relaciones_requeridas)
-- las interpreta ValidadorDiagrama. Los ejercicios de diagrama creados por docentes
-- no necesitan migracion: sus reglas se deducen del DDL de la query maestra.
-- ============================================================================

BEGIN;

-- 16: una FK necesita una PK a la que apuntar, y una entidad sin atributos no es un modelo.
UPDATE lms_core.ejercicios_practicos
SET configuracion_extra = COALESCE(configuracion_extra, '{}'::jsonb) || jsonb_build_object(
        'min_entidades', 2,
        'min_relaciones', 1,
        'min_atributos_por_entidad', 1,
        'requiere_pk', true,
        'mensaje_error', 'El lienzo necesita al menos dos entidades con nombre.',
        'mensaje_relaciones', 'Conecta las dos entidades arrastrando desde el punto cyan hasta el fucsia.'
    )
WHERE id_ejercicio = 16 AND formato = 'diagram';

-- 28: el enunciado exige 2 atributos POR entidad, no 6 repartidos como sea.
UPDATE lms_core.ejercicios_practicos
SET configuracion_extra = COALESCE(configuracion_extra, '{}'::jsonb) || jsonb_build_object(
        'min_atributos_por_entidad', 2,
        'requiere_pk', true,
        'relaciones_requeridas', jsonb_build_array(
            jsonb_build_object(
                'source', jsonb_build_array('huesped', 'huespedes', 'cliente', 'clientes'),
                'target', jsonb_build_array('reserva', 'reservas', 'reservacion', 'booking')
            ),
            jsonb_build_object(
                'source', jsonb_build_array('habitacion', 'habitaciones', 'cuarto', 'cuartos', 'room'),
                'target', jsonb_build_array('reserva', 'reservas', 'reservacion', 'booking')
            )
        )
    )
WHERE id_ejercicio = 28 AND formato = 'diagram';

-- 40: el enunciado nombra las tres entidades; hasta ahora valia cualquier nombre.
UPDATE lms_core.ejercicios_practicos
SET configuracion_extra = COALESCE(configuracion_extra, '{}'::jsonb) || jsonb_build_object(
        'min_entidades', 3,
        'min_relaciones', 2,
        'min_atributos_por_entidad', 2,
        'requiere_pk', true,
        'mensaje_error', 'El plano de la posada necesita Huespedes, Habitaciones y Reservas.',
        'mensaje_relaciones', 'Conecta huespedes con reservas y habitaciones con reservas.',
        'entidades_requeridas', jsonb_build_array(
            jsonb_build_array('huesped', 'huespedes', 'cliente', 'clientes'),
            jsonb_build_array('habitacion', 'habitaciones', 'cuarto', 'cuartos', 'room'),
            jsonb_build_array('reserva', 'reservas', 'reservacion', 'booking')
        ),
        'relaciones_requeridas', jsonb_build_array(
            jsonb_build_object(
                'source', jsonb_build_array('huesped', 'huespedes', 'cliente', 'clientes'),
                'target', jsonb_build_array('reserva', 'reservas', 'reservacion', 'booking')
            ),
            jsonb_build_object(
                'source', jsonb_build_array('habitacion', 'habitaciones', 'cuarto', 'cuartos', 'room'),
                'target', jsonb_build_array('reserva', 'reservas', 'reservacion', 'booking')
            )
        )
    )
WHERE id_ejercicio = 40 AND formato = 'diagram';

COMMIT;
