-- Ejecutar como administrador, únicamente en la BD seleccionada explícitamente.
-- El backend puede registrar/restaurar sandboxes sin CREATE DATABASE ni SET ROLE.
BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'app_sandbox_provisioner') THEN
        CREATE ROLE app_sandbox_provisioner NOLOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
    END IF;
    EXECUTE format('GRANT CREATE ON DATABASE %I TO app_sandbox_provisioner', current_database());
END;
$$;
GRANT app_sandbox_user TO app_sandbox_provisioner;
GRANT USAGE, CREATE ON SCHEMA lms_core TO app_sandbox_provisioner;
GRANT USAGE ON SCHEMA lms_sandbox_template TO app_sandbox_provisioner;
GRANT SELECT ON ALL TABLES IN SCHEMA lms_sandbox_template TO app_sandbox_provisioner;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA lms_sandbox_template TO app_sandbox_provisioner;
GRANT SELECT (id_usuario, activo) ON lms_core.usuarios TO app_sandbox_provisioner;

CREATE OR REPLACE FUNCTION lms_core.fn_provisionar_sandbox(usuario uuid, reiniciar boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    esquema text := 'sandbox_usuario_' || usuario::text;
    tabla record;
    columna record;
    secuencia text;
    maximo bigint;
BEGIN
    IF usuario IS NULL OR NOT EXISTS (
        SELECT 1 FROM lms_core.usuarios u WHERE u.id_usuario = usuario AND u.activo = true
    ) THEN
        RAISE EXCEPTION 'Usuario inexistente o inactivo' USING ERRCODE = '22023';
    END IF;
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(esquema, 0));
    IF reiniciar THEN
        EXECUTE pg_catalog.format('DROP SCHEMA IF EXISTS %I CASCADE', esquema);
    END IF;
    EXECUTE pg_catalog.format('CREATE SCHEMA IF NOT EXISTS %I AUTHORIZATION app_sandbox_user', esquema);
    FOR tabla IN
        SELECT c.relname FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'lms_sandbox_template' AND c.relkind = 'r'
    LOOP
        IF pg_catalog.to_regclass(pg_catalog.format('%I.%I', esquema, tabla.relname)) IS NOT NULL THEN
            CONTINUE;
        END IF;
        EXECUTE pg_catalog.format('CREATE TABLE %I.%I (LIKE lms_sandbox_template.%I INCLUDING ALL)', esquema, tabla.relname, tabla.relname);
        EXECUTE pg_catalog.format('INSERT INTO %I.%I SELECT * FROM lms_sandbox_template.%I', esquema, tabla.relname, tabla.relname);
        -- Las identidades copiadas tienen secuencia propia; continuar después de los IDs semilla.
        FOR columna IN
            SELECT a.attname FROM pg_catalog.pg_attribute a
            WHERE a.attrelid = pg_catalog.to_regclass(pg_catalog.format('%I.%I', esquema, tabla.relname))
              AND a.attidentity <> '' AND a.attnum > 0 AND NOT a.attisdropped
        LOOP
            secuencia := pg_catalog.pg_get_serial_sequence(pg_catalog.format('%I.%I', esquema, tabla.relname), columna.attname);
            EXECUTE pg_catalog.format('SELECT MAX(%I) FROM %I.%I', columna.attname, esquema, tabla.relname) INTO maximo;
            PERFORM pg_catalog.setval(secuencia::pg_catalog.regclass, COALESCE(maximo, 1), maximo IS NOT NULL);
        END LOOP;
        EXECUTE pg_catalog.format('ALTER TABLE %I.%I OWNER TO app_sandbox_user', esquema, tabla.relname);
    END LOOP;
END;
$$;
ALTER FUNCTION lms_core.fn_provisionar_sandbox(uuid, boolean) OWNER TO app_sandbox_provisioner;
REVOKE ALL ON FUNCTION lms_core.fn_provisionar_sandbox(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lms_core.fn_provisionar_sandbox(uuid, boolean) TO app_backend_user;

CREATE OR REPLACE FUNCTION lms_core.fn_crear_multiverso()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
    PERFORM lms_core.fn_provisionar_sandbox(NEW.id_usuario, false);
    RETURN NEW;
END;
$$;
ALTER FUNCTION lms_core.fn_crear_multiverso() OWNER TO app_sandbox_provisioner;
REVOKE ALL ON FUNCTION lms_core.fn_crear_multiverso() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lms_core.fn_crear_multiverso() TO app_backend_user;
REVOKE CREATE ON SCHEMA lms_core FROM app_sandbox_provisioner;
-- El rol sandbox no recibe USAGE ni permisos sobre lms_core.
COMMIT;
