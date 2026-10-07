-- ===================================================================
-- SCRIPT DE ROTACIÓN DE SECRETOS (EJECUTAR EN PRODUCCIÓN / RAILWAY)
-- ===================================================================
-- Este script cambia las contraseñas de los usuarios de la aplicación.
-- ¡No olvides actualizar también las variables de entorno en Railway!

-- 1. Cambia la contraseña del usuario principal (Spring Boot)
-- Reemplaza 'NUEVA_PASSWORD_PRINCIPAL' por una contraseña fuerte.
ALTER USER usuario_app WITH PASSWORD 'NUEVA_PASSWORD_PRINCIPAL';

-- 2. Cambia la contraseña del usuario sandbox
-- Reemplaza 'NUEVA_PASSWORD_SANDBOX' por una contraseña fuerte.
ALTER USER app_sandbox_user WITH PASSWORD 'NUEVA_PASSWORD_SANDBOX';

-- 3. Cambia la contraseña del usuario provisionador (si existe)
-- Reemplaza 'NUEVA_PASSWORD_PROVISION' por una contraseña fuerte.
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_provision_user') THEN 
    ALTER USER app_provision_user WITH PASSWORD 'NUEVA_PASSWORD_PROVISION'; 
  END IF; 
END 
$$;

