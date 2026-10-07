-- Migración: columna metodo_auth para identificar el origen del registro (Google vs Local)
-- 2026_05_28_grupos_validaciones.sql
--
-- Los grupos reales viven en lms_core.grupos_docente / grupo_alumnos (20260517_01_docente_grupos.sql).
-- Esta migración antes creaba lms_core.grupos y lms_core.usuario_grupos, que nadie usaba, y un rol
-- 'free' que viola roles_nombre_check; ambos se quitaron.

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='lms_core' AND table_name='usuarios' AND column_name='metodo_auth') THEN
        ALTER TABLE lms_core.usuarios ADD COLUMN metodo_auth VARCHAR(20) DEFAULT 'local';
    END IF;
END $$;
