# Instrucciones de Despliegue (Dagon Project)

Este documento contiene todo lo necesario para que puedas subir y configurar el proyecto completo a producción.

## 1. Base de Datos (PostgreSQL en Railway)
Tienes dos opciones para la base de datos:
- **Respaldo completo:** En la raíz del proyecto está el archivo `dagon_backup.sql`.
- **Scripts:** En la carpeta `/scripts/` están los archivos `00_instalacion_limpia.sql`, `01_datos_semilla.sql`, `02_ejercicios_semilla.sql`, y `dagon_db_estructura.sql` en caso de que quieras montarla paso a paso. También hay scripts adicionales en la carpeta `/para dilman/` (`respaldo_dagon_multiverso.sql`, etc).

Para Railway, crea un servicio de PostgreSQL, conecta y restaura el backup usando psql o DBeaver. Toma nota de la variable de entorno de conexión (`DATABASE_URL`).

## 2. Backend (Spring Boot en Railway)
El backend está configurado en la carpeta `/backend`. Railway debería detectar automáticamente que es un proyecto Java (Maven).

**Variables de entorno necesarias (configurar en Railway):**
- `SPRING_DATASOURCE_URL`: La URL de conexión a tu DB (ej. `jdbc:postgresql://host:port/database`).
- `SPRING_DATASOURCE_USERNAME`: El usuario de la DB.
- `SPRING_DATASOURCE_PASSWORD`: La contraseña de la DB.
- `GEMINI_API_KEY`: Tu API key de Gemini (para el chatbot y validaciones IA).
- `FRONTEND_URL`: URL donde esté alojado tu frontend (ej. `https://tu-proyecto.vercel.app` o `https://tu-proyecto.pages.dev`). *Esto es importante para los CORS, si no lo tienes, revisa `SecurityConfig.java`*.

*Nota: La configuración actual está en `backend/src/main/resources/application.properties` preparada para inyectar variables de entorno (`${...}`). `ddl-auto=none` está configurado por defecto para no romper la BD.*

## 3. Frontend (React en Vercel, Cloudflare Pages o Cloudware)
El frontend está en la carpeta `/frontend`.

**Configuración de build (para Vercel / Cloudflare):**
- **Framework Preset:** Create React App (aunque usa craco, los comandos básicos aplican).
- **Build Command:** `yarn build` (o `npm run build`)
- **Output Directory:** `build`
- **Root Directory:** `frontend`

**Variables de entorno necesarias (configurar en Vercel/Cloudflare):**
- `REACT_APP_BACKEND_URL`: La URL pública de tu backend en Railway (ej. `https://tu-backend-railway.app`).
- `REACT_APP_API_URL`: (Opcional, si usas ambas en tu código, pon la misma de arriba).

## 4. Servicio de Analíticas (Opcional)
Si también van a subir el servicio de Python de MPI:
- Está en `/mpi_service`.
- Es un microservicio Flask.
- Probablemente requiera un Dockerfile personalizado si se sube a Railway por la dependencia de `mpi4py` y Open MPI.
