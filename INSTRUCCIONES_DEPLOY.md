# Instrucciones de Despliegue (Dagon Project)

Actualizado y revisado. Este documento incluye el flujo de despliegue completo para **Railway** (Base de datos y Backend) y **Vercel** (Frontend), incluyendo todas las variables necesarias y la configuración rotación de secretos.

## 1. Base de Datos (PostgreSQL en Railway)
El backend requiere una base de datos PostgreSQL (versión 15+ recomendada).

1. Crea un nuevo servicio PostgreSQL en Railway.
2. Abre la conexión usando DBeaver, pgAdmin o psql, o utiliza la terminal que proporciona Railway.
3. Ejecuta los siguientes scripts en orden estricto (se encuentran en `/scripts`):
   - `00_instalacion_limpia.sql`
   - `01_datos_semilla.sql`
   - `02_ejercicios_semilla.sql`
   - `03_io_semilla.sql` (Contenido y misiones del módulo IO)
   - Adicionalmente, aplica las migraciones recientes en `/scripts/migraciones/`.

**¡Atención! Rotación de Contraseñas:** 
Los scripts asignan contraseñas por defecto (`2097`). **Es obligatorio** rotarlas en producción. Puedes utilizar el script provisto en `scripts/secrets_rotation_example.sql` para cambiar las contraseñas de `usuario_app`, `app_sandbox_user` y `app_provision_user`.
Nunca dejes la BD en producción con `ddl-auto=update`, el backend espera `ddl-auto=none`.

## 2. Backend (Spring Boot en Railway)
Se ha creado un `Dockerfile` y un `railway.toml` para garantizar el despliegue correcto del monorepo.

**Configuración en Railway:**
- **Root Directory:** Asegúrate de establecer la ruta raíz a `/backend`.
- **Healthcheck:** El `HealthController` ya está expuesto en `/api/health`.
- **Volumen Persistente (Uploads):** Debes crear un volumen en Railway montado en `/data` (o configurar `DAGON_UPLOADS_DIR` como corresponda) para que las fotos de perfil persistan en redespliegues.

**Variables de entorno (obligatorias):**
- `PORT`: Railway lo asigna automáticamente, asegúrate de que el backend escucha este puerto (ya configurado vía `server.port=${PORT:8080}`).
- `DATABASE_URL` o `SPRING_DATASOURCE_URL`: URL de conexión a PostgreSQL generada por Railway.
- `SPRING_DATASOURCE_USERNAME` y `SPRING_DATASOURCE_PASSWORD`: Credenciales del usuario principal.
- `DAGON_SANDBOX_URL`, `DAGON_SANDBOX_USERNAME`, `DAGON_SANDBOX_PASSWORD`: Configura esto con el rol de sandbox (`app_sandbox_user`).
- `DAGON_JWT_SECRET`: Secreto largo (> 32 caracteres) generado, por ejemplo, con `openssl rand -base64 48`.
- `DAGON_CORS_ALLOWED_ORIGINS`: URL HTTPS del frontend en Vercel (ej: `https://dagon-project.vercel.app`).
- `GROQ_API_KEY`: API Key de Groq para el Clawbot y el Solver IO.
- `GEMINI_API_KEY`: (Opcional, respaldo) API Key de Gemini.
- `DAGON_UPLOADS_DIR`: `/data/uploads` (si has montado el volumen en `/data`).

## 3. Frontend (React en Vercel)
El frontend ya incluye `vercel.json` configurado correctamente con los _rewrites_ para que las rutas SPA como `/io/calculadora` no devuelvan 404.

**Configuración en Vercel:**
- **Framework Preset:** Create React App
- **Root Directory:** `frontend`
- **Build Command:** `yarn build`
- **Install Command:** `yarn install --frozen-lockfile` (Para respetar la versión de dependencias probada en Node 20/24).

**Variables de entorno (Vercel):**
- `REACT_APP_API_URL`: La URL pública HTTPS generada por Railway para tu backend, sin `/api` al final (ej: `https://dagon-backend-production.up.railway.app`).
- `REACT_APP_BACKEND_URL`: URL de respaldo, puedes usar el mismo valor.

## 4. Servicio de Analíticas (Opcional - mpi_service)
Microservicio Python/Flask opcional (`/mpi_service`). El frontend continuará funcionando (excepto la gráfica de ranking MPI) si no se despliega.
