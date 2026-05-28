-- Migración para Grupos y Validaciones de Registro
-- 2026_05_28_grupos_validaciones.sql

-- 1. Crear tabla de grupos
CREATE TABLE IF NOT EXISTS lms_core.grupos (
    id_grupo uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo_acceso VARCHAR(20) UNIQUE NOT NULL,
    id_docente uuid REFERENCES lms_core.usuarios(id_usuario) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de relación Usuario-Grupo (Un alumno puede estar en un grupo, o varios)
CREATE TABLE IF NOT EXISTS lms_core.usuario_grupos (
    id_usuario uuid REFERENCES lms_core.usuarios(id_usuario) ON DELETE CASCADE,
    id_grupo uuid REFERENCES lms_core.grupos(id_grupo) ON DELETE CASCADE,
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_grupo)
);

-- 3. Agregar columna para identificar el origen (Google vs Local) si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='lms_core' AND table_name='usuarios' AND column_name='metodo_auth') THEN
        ALTER TABLE lms_core.usuarios ADD COLUMN metodo_auth VARCHAR(20) DEFAULT 'local';
    END IF;
END $$;

-- 4. Asegurar que exista el rol 'free'
INSERT INTO lms_core.roles (nombre) 
SELECT 'free' WHERE NOT EXISTS (SELECT 1 FROM lms_core.roles WHERE nombre = 'free');
