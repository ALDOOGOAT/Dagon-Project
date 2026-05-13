-- Dagon - Fase 4: indices, constraints ligeros y metadatos educativos.
--
-- Ejecutar despues de tener la estructura base creada. Este archivo es
-- incremental e idempotente en objetos principales.
--
-- Nota: si el indice unico lower(email) falla, primero normaliza correos
-- duplicados que solo cambien por mayusculas/minusculas.

BEGIN;

ALTER TABLE lms_core.modulos
    ADD COLUMN IF NOT EXISTS objetivos jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS prerequisitos jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS errores_comunes jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cinematica_config jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_intentos_usuario_ejercicio_correcto_fecha
    ON lms_core.intentos (id_usuario, id_ejercicio, es_correcto, fecha_intento DESC);

CREATE INDEX IF NOT EXISTS idx_ejercicios_modulo_orden
    ON lms_core.ejercicios_practicos (id_modulo, orden);

CREATE INDEX IF NOT EXISTS idx_modulos_curso_orden
    ON lms_core.modulos (id_curso, orden);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_lower_unique
    ON lms_core.usuarios (lower(email::text));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'modulos_xp_requerida_check'
          AND conrelid = 'lms_core.modulos'::regclass
    ) THEN
        ALTER TABLE lms_core.modulos
            ADD CONSTRAINT modulos_xp_requerida_check CHECK (xp_requerida >= 0) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'modulos_objetivos_array_check'
          AND conrelid = 'lms_core.modulos'::regclass
    ) THEN
        ALTER TABLE lms_core.modulos
            ADD CONSTRAINT modulos_objetivos_array_check CHECK (jsonb_typeof(objetivos) = 'array') NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'modulos_prerequisitos_array_check'
          AND conrelid = 'lms_core.modulos'::regclass
    ) THEN
        ALTER TABLE lms_core.modulos
            ADD CONSTRAINT modulos_prerequisitos_array_check CHECK (jsonb_typeof(prerequisitos) = 'array') NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'modulos_errores_comunes_array_check'
          AND conrelid = 'lms_core.modulos'::regclass
    ) THEN
        ALTER TABLE lms_core.modulos
            ADD CONSTRAINT modulos_errores_comunes_array_check CHECK (jsonb_typeof(errores_comunes) = 'array') NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'modulos_cinematica_object_check'
          AND conrelid = 'lms_core.modulos'::regclass
    ) THEN
        ALTER TABLE lms_core.modulos
            ADD CONSTRAINT modulos_cinematica_object_check CHECK (jsonb_typeof(cinematica_config) = 'object') NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ejercicios_practicos_orden_check'
          AND conrelid = 'lms_core.ejercicios_practicos'::regclass
    ) THEN
        ALTER TABLE lms_core.ejercicios_practicos
            ADD CONSTRAINT ejercicios_practicos_orden_check CHECK (orden > 0) NOT VALID;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'intentos_tiempo_ms_check'
          AND conrelid = 'lms_core.intentos'::regclass
    ) THEN
        ALTER TABLE lms_core.intentos
            ADD CONSTRAINT intentos_tiempo_ms_check CHECK (tiempo_ms IS NULL OR tiempo_ms >= 0) NOT VALID;
    END IF;
END;
$$;

WITH metadata(id_modulo, objetivos, prerequisitos, errores_comunes, cinematica_config) AS (
    VALUES
        (1, '["Entender tablas como conjuntos", "Usar SELECT y filtros basicos"]'::jsonb, '["Lectura visual de tablas"]'::jsonb, '["Confundir AND con OR", "Olvidar comillas simples"]'::jsonb, '{"slug":"teoria-conjuntos","duracion_segundos":90,"escenas":["universo","subconjunto","interseccion","union"]}'::jsonb),
        (2, '["Modificar datos con INSERT, UPDATE y DELETE", "Verificar cambios con RETURNING"]'::jsonb, '["SELECT y WHERE"]'::jsonb, '["Modificar sin WHERE", "No verificar filas afectadas"]'::jsonb, '{"slug":"crud","duracion_segundos":105,"escenas":["crear","leer","actualizar","eliminar"]}'::jsonb),
        (3, '["Relacionar entidades", "Usar JOIN y llaves"]'::jsonb, '["CRUD", "Columnas clave"]'::jsonb, '["Unir columnas incorrectas", "Confundir PK y FK"]'::jsonb, '{"slug":"arquitecto-vinculos","duracion_segundos":120,"escenas":["entidades","llaves","relaciones","join"]}'::jsonb),
        (4, '["Integrar MER, DDL y consultas", "Construir una solucion completa"]'::jsonb, '["MER", "DDL", "JOIN"]'::jsonb, '["Diseno incompleto", "Probar consultas sin datos"]'::jsonb, '{"slug":"prueba-dagon","duracion_segundos":130,"escenas":["reto","plano","construccion","consulta"]}'::jsonb),
        (5, '["Crear tablas con reglas", "Usar PRIMARY KEY y DEFAULT"]'::jsonb, '["Tablas y columnas"]'::jsonb, '["Olvidar constraints", "No probar valores invalidos"]'::jsonb, '{"slug":"sellos-sagrados","duracion_segundos":100,"escenas":["reglas","primary-key","default"]}'::jsonb),
        (6, '["Aplicar UNIQUE, CHECK y DEFAULT"]'::jsonb, '["Constraints basicos"]'::jsonb, '["CHECK permisivo", "Confundir NULL con DEFAULT"]'::jsonb, '{"slug":"sellos-validacion","duracion_segundos":95,"escenas":["unique","check","default"]}'::jsonb),
        (7, '["Entender secuencias", "Usar nextval y currval"]'::jsonb, '["PRIMARY KEY", "INSERT"]'::jsonb, '["currval antes de nextval", "Reiniciar secuencias sin cuidado"]'::jsonb, '{"slug":"generador-ids","duracion_segundos":90,"escenas":["serial","nextval","currval"]}'::jsonb),
        (8, '["Usar BETWEEN, IN e IS NULL"]'::jsonb, '["WHERE"]'::jsonb, '["Usar = NULL", "Creer que BETWEEN excluye extremos"]'::jsonb, '{"slug":"filtros-precision","duracion_segundos":90,"escenas":["rango","lista","null"]}'::jsonb),
        (9, '["Crear y consultar vistas", "Distinguir vista y tabla base"]'::jsonb, '["SELECT", "JOIN"]'::jsonb, '["Pensar que una vista siempre duplica datos", "No revisar tabla base"]'::jsonb, '{"slug":"vistas","duracion_segundos":95,"escenas":["tabla-base","ventana","consulta"]}'::jsonb),
        (10, '["Explorar tablas, columnas y constraints"]'::jsonb, '["Estructura de tablas"]'::jsonb, '["Confundir metadatos con datos", "Filtrar por esquema incorrecto"]'::jsonb, '{"slug":"information-schema","duracion_segundos":100,"escenas":["catalogo","tablas","columnas"]}'::jsonb),
        (11, '["Buscar prefijos, sufijos y patrones"]'::jsonb, '["WHERE", "Texto entre comillas"]'::jsonb, '["Olvidar comodines", "Ignorar mayusculas/minusculas"]'::jsonb, '{"slug":"patrones-busqueda","duracion_segundos":90,"escenas":["prefijo","sufijo","contiene"]}'::jsonb),
        (12, '["Crear funciones SQL", "Usar parametros y retornos"]'::jsonb, '["SELECT", "Tipos de datos"]'::jsonb, '["No declarar retorno", "Confundir funcion con procedimiento"]'::jsonb, '{"slug":"funciones","duracion_segundos":110,"escenas":["entrada","proceso","salida"]}'::jsonb),
        (13, '["Usar bloques PL/pgSQL", "Encadenar acciones controladas"]'::jsonb, '["Funciones", "INSERT"]'::jsonb, '["No capturar IDs", "Mezclar comillas"]'::jsonb, '{"slug":"procedural","duracion_segundos":115,"escenas":["bloque","variable","insert"]}'::jsonb),
        (14, '["Crear triggers AFTER y BEFORE", "Auditar cambios"]'::jsonb, '["PL/pgSQL", "Constraints"]'::jsonb, '["Olvidar RETURN NEW", "Usar tabla equivocada"]'::jsonb, '{"slug":"triggers","duracion_segundos":120,"escenas":["evento","funcion-trigger","auditoria"]}'::jsonb),
        (15, '["Usar BEGIN, COMMIT, ROLLBACK y SAVEPOINT"]'::jsonb, '["INSERT", "UPDATE", "DELETE"]'::jsonb, '["Olvidar COMMIT", "Confundir ROLLBACK con borrar datos confirmados"]'::jsonb, '{"slug":"transacciones","duracion_segundos":125,"escenas":["begin","commit","rollback","savepoint"]}'::jsonb),
        (16, '["Entender bloqueos de fila", "Usar FOR UPDATE y NOWAIT"]'::jsonb, '["Transacciones"]'::jsonb, '["Bloquear mas filas de las necesarias", "No cerrar transaccion"]'::jsonb, '{"slug":"bloqueos","duracion_segundos":105,"escenas":["fila","cerrojo","sesion-a","sesion-b"]}'::jsonb),
        (17, '["Usar UNION, INTERSECT y EXCEPT"]'::jsonb, '["SELECT", "Teoria de conjuntos"]'::jsonb, '["No alinear columnas", "Esperar duplicados en UNION"]'::jsonb, '{"slug":"algebra-relacional","duracion_segundos":100,"escenas":["union","intersect","except"]}'::jsonb),
        (18, '["Consultar roles y privilegios", "Entender current_user"]'::jsonb, '["information_schema", "Seguridad basica"]'::jsonb, '["Dar privilegios excesivos", "Confundir usuario app con sandbox"]'::jsonb, '{"slug":"roles-permisos","duracion_segundos":110,"escenas":["roles","grant","revoke"]}'::jsonb),
        (19, '["Entender aislamiento por usuario", "Relacionar seguridad con contexto"]'::jsonb, '["Roles", "Esquemas"]'::jsonb, '["Creer que RLS reemplaza permisos", "Probar con rol incorrecto"]'::jsonb, '{"slug":"row-level-security","duracion_segundos":120,"escenas":["usuario-a","usuario-b","politica"]}'::jsonb),
        (20, '["Integrar todo lo aprendido", "Explicar decisiones tecnicas"]'::jsonb, '["Todos los modulos anteriores"]'::jsonb, '["Resolver sin plan", "No validar casos borde"]'::jsonb, '{"slug":"proyecto-final","duracion_segundos":140,"escenas":["brief","modelo","implementacion","validacion"]}'::jsonb)
)
UPDATE lms_core.modulos m
SET objetivos = metadata.objetivos,
    prerequisitos = metadata.prerequisitos,
    errores_comunes = metadata.errores_comunes,
    cinematica_config = metadata.cinematica_config
FROM metadata
WHERE m.id_modulo = metadata.id_modulo;

COMMIT;
