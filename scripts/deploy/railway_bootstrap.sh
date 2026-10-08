#!/usr/bin/env bash
# Instala Dagon en una BD PostgreSQL 16 vacía (p. ej. Railway). Idempotente.
# Uso:
#   ADMIN_URL='postgresql://postgres:***@host:port/railway' \
#   BACKEND_DB_PASSWORD='...' SANDBOX_DB_PASSWORD='...' \
#   scripts/deploy/railway_bootstrap.sh
# Requiere psql >= 15 (usa \getenv). Nunca imprime contraseñas.
set -euo pipefail

: "${ADMIN_URL:?Falta ADMIN_URL (URL del superusuario de la BD destino)}"
: "${BACKEND_DB_PASSWORD:?Falta BACKEND_DB_PASSWORD}"
: "${SANDBOX_DB_PASSWORD:?Falta SANDBOX_DB_PASSWORD}"
export BACKEND_DB_PASSWORD SANDBOX_DB_PASSWORD

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
q() { psql "$ADMIN_URL" -X -q -v ON_ERROR_STOP=1 -At "$@"; }

# 1) Esquema: 00 no es re-ejecutable (CREATE TABLE sin IF NOT EXISTS) -> solo si falta.
if [ "$(q -c "SELECT to_regclass('lms_core.usuarios') IS NOT NULL")" = "t" ]; then
  echo "[1/4] Esquema ya instalado; se omite 00_instalacion_limpia.sql"
else
  echo "[1/4] Instalando esquema (00)"
  q -f "$ROOT/scripts/00_instalacion_limpia.sql" >/dev/null
fi

# 2) Semillas (usan ON CONFLICT / bloques DO, re-ejecutables).
echo "[2/4] Aplicando semillas 01, 02, 03"
for f in 01_datos_semilla 02_ejercicios_semilla 03_io_semilla; do
  q -f "$ROOT/scripts/$f.sql" >/dev/null
done

# 3) Roles de runtime: contraseñas desde entorno y privilegios mínimos.
echo "[3/4] Configurando roles de runtime"
q >/dev/null <<'SQL'
\getenv bp BACKEND_DB_PASSWORD
\getenv sp SANDBOX_DB_PASSWORD
ALTER ROLE app_backend_user LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'bp';
ALTER ROLE app_sandbox_user LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD :'sp';
-- Sandbox aislado de lms_core; el backend no hereda el rol sandbox.
REVOKE ALL ON SCHEMA lms_core FROM app_sandbox_user;
REVOKE ALL ON ALL TABLES IN SCHEMA lms_core FROM app_sandbox_user;
-- Re-grants por si semillas/migraciones añadieron objetos nuevos.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA lms_core TO app_backend_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA lms_core TO app_backend_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA lms_core GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_backend_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA lms_core GRANT USAGE, SELECT ON SEQUENCES TO app_backend_user;
SQL

# 4) Verificación (solo conteos).
echo "[4/4] Verificación"
q <<'SQL'
SELECT 'materias='||count(*) FROM lms_core.materias;
SELECT 'cursos_io='||count(*) FROM lms_core.cursos WHERE materia_slug='io';
SELECT 'modulos_io='||count(*) FROM lms_core.modulos m JOIN lms_core.cursos c USING (id_curso) WHERE c.materia_slug='io';
SELECT 'misiones_numerico_globales='||count(*) FROM lms_core.ejercicios_practicos
 WHERE configuracion_extra->>'tipo_validacion'='NUMERICO' AND visibilidad='GLOBAL';
SET ROLE app_backend_user;
SELECT 'backend_select_usuarios='||count(*) FROM lms_core.usuarios;
RESET ROLE;
SELECT 'backend_privilegiado='||count(*) FROM pg_roles WHERE rolname='app_backend_user' AND (rolsuper OR rolcreatedb OR rolcreaterole);
SELECT 'backend_miembro_de_sandbox='||count(*) FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid JOIN pg_roles u ON u.oid=m.member WHERE u.rolname='app_backend_user' AND r.rolname='app_sandbox_user';
SQL
