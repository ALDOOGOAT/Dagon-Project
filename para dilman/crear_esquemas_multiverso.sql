-- Script para crear los esquemas de multiverso para usuarios existentes
-- Ejecutar UNA SOLA VEZ cuando se activa el sistema de multiverso

-- Crear función auxiliar si no existe (por si se corrió la versión parcial)
CREATE OR REPLACE FUNCTION lms_core.fn_crear_multiverso()
RETURNS TRIGGER AS $$
DECLARE
    nuevo_esquema TEXT;
    tabla RECORD;
BEGIN
    nuevo_esquema := 'sandbox_usuario_' || NEW.id_usuario;

    EXECUTE format('CREATE SCHEMA %I', nuevo_esquema);
    EXECUTE format('GRANT ALL ON SCHEMA %I TO app_sandbox_user', nuevo_esquema);

    FOR tabla IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'lms_sandbox_template'
    LOOP
        EXECUTE format('CREATE TABLE %I.%I (LIKE lms_sandbox_template.%I INCLUDING ALL)', nuevo_esquema, tabla.tablename, tabla.tablename);
        EXECUTE format('INSERT INTO %I.%I SELECT * FROM lms_sandbox_template.%I', nuevo_esquema, tabla.tablename, tabla.tablename);
        EXECUTE format('GRANT ALL ON TABLE %I.%I TO app_sandbox_user', nuevo_esquema, tabla.tablename);
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS trg_desatar_multiverso ON lms_core.usuarios;
CREATE TRIGGER trg_desatar_multiverso
AFTER INSERT ON lms_core.usuarios
FOR EACH ROW EXECUTE FUNCTION lms_core.fn_crear_multiverso();

-- Crear esquemas para USUARIOS EXISTENTES
DO $$
DECLARE
    usuario RECORD;
    nuevo_esquema TEXT;
    tabla RECORD;
BEGIN
    FOR usuario IN SELECT id_usuario FROM lms_core.usuarios
    LOOP
        nuevo_esquema := 'sandbox_usuario_' || usuario.id_usuario;

        -- Crear esquema si no existe
        IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = nuevo_esquema::text) THEN
            EXECUTE format('CREATE SCHEMA %I', nuevo_esquema);
            EXECUTE format('GRANT ALL ON SCHEMA %I TO app_sandbox_user', nuevo_esquema);

            -- Clonar tablas
            FOR tabla IN
                SELECT tablename FROM pg_tables WHERE schemaname = 'lms_sandbox_template'
            LOOP
                EXECUTE format('CREATE TABLE %I.%I (LIKE lms_sandbox_template.%I INCLUDING ALL)', nuevo_esquema, tabla.tablename, tabla.tablename);
                EXECUTE format('INSERT INTO %I.%I SELECT * FROM lms_sandbox_template.%I', nuevo_esquema, tabla.tablename, tabla.tablename);
                EXECUTE format('GRANT ALL ON TABLE %I.%I TO app_sandbox_user', nuevo_esquema, tabla.tablename);
            END LOOP;

            RAISE NOTICE 'Esquema creado: %', nuevo_esquema;
        ELSE
            RAISE NOTICE 'Esquema ya existe: %', nuevo_esquema;
        END IF;
    END LOOP;
END $$;

-- Verificar
SELECT
    schemaname,
    COUNT(*) as tablas
FROM pg_tables
WHERE schemaname LIKE 'sandbox_usuario_%'
GROUP BY schemaname
ORDER BY schemaname;