# Requerimientos Técnicos de Dagon

## Objetivo

Este documento resume los requerimientos reales del proyecto a partir del código actual del repositorio. Se priorizó la implementación efectiva sobre el README público, porque hay partes de la documentación existente que ya no coinciden con el estado real del sistema.

## Arquitectura actual

El proyecto está dividido en 3 servicios:

1. `backend/`: API REST en Spring Boot.
2. `frontend/`: cliente web en React con `craco`.
3. `mpi_service/`: microservicio Python para analítica paralela con `mpi4py`.

## Requerimientos obligatorios

### 1. Backend

- Java 21.
- Maven Wrapper incluido en `backend/mvnw`.
- PostgreSQL accesible desde el backend.
- Conectividad HTTP saliente si se quiere usar IA externa:
  - Gemini (`GEMINI_API_KEY`)
  - Groq (`GROQ_API_KEY`)
- Si no hay claves de IA, el sistema sigue funcionando con respuestas de fallback para Clawbot.

### 2. Frontend

- Node.js LTS recomendado.
- Yarn 1.22.22.
- Navegador moderno compatible con React 19.

Nota:
El repositorio declara `packageManager: yarn@1.22.22`. Conviene usar Yarn y no `npm`.

### 3. Servicio MPI

- Python 3.10+ recomendado.
- `pip`.
- Open MPI con `mpirun`.
- Paquetes Python:
  - `mpi4py`
  - `flask`

## Dependencias detectadas por servicio

### Backend (`backend/pom.xml`)

- Spring Boot `4.0.3`
- Spring Security
- Spring Data JPA
- Spring Web MVC
- PostgreSQL JDBC
- Lombok
- JJWT `0.11.5`

### Frontend (`frontend/package.json`)

- React `19`
- React Router DOM `7.5.1`
- Tailwind CSS `3.4.17`
- `@craco/craco`
- Axios
- Framer Motion
- Recharts
- Monaco Editor
- Radix UI / Shadcn
- Lucide React

### MPI (`mpi_service/requirements.txt`)

- `mpi4py>=3.1.5`
- `flask>=3.0.0`

## Base de datos requerida

El backend depende de PostgreSQL y usa SQL real contra esquemas existentes. No está configurado para crear tablas automáticamente.

Requisitos observados:

- `spring.jpa.hibernate.ddl-auto=none`
- Esquemas usados por el código:
  - `lms_core`
  - `lms_sandbox`
  - `lms_sandbox_template`
- Rol usado por el sandbox SQL:
  - `app_sandbox_user`

### Scripts SQL relevantes del repositorio

- `respaldo_db.sql`
- `dagon_db_estructura.sql`
- `migracion_dagon.sql`
- `update_racha_columns.sql`

Nota:
`AGENTS.md` y `CLAUDE.md` mencionan `BaseDeDatosZaca.sql` como fuente de verdad, pero ese archivo no está presente en la raíz actual del repositorio. En el estado actual, los scripts disponibles que parecen relevantes son los listados arriba.

## Variables y configuración necesarias

### Backend

Configuraciones detectadas en código:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `ollama.url` opcional, por defecto `http://localhost:11434`
- `GEMINI_API_KEY` opcional
- `GROQ_API_KEY` opcional
- `dagon.mpi.url` opcional, por defecto `http://127.0.0.1:5001`

Importante:
Existe un archivo `backend/src/main/resources/application.properties` con secretos reales. No debe exponerse ni subirse a repositorios públicos.

### Frontend

Variables esperadas por el código:

- `REACT_APP_API_URL`
- `REACT_APP_BACKEND_URL`

Importante:
El frontend no es consistente todavía:

- `AuthContext.js`, `DashboardPage.js`, `ExercisePage.js` y otros archivos usan `REACT_APP_API_URL`.
- `src/services/apiService.js` usa `REACT_APP_BACKEND_URL`.

Para evitar fallos al ejecutar, conviene definir ambas con el mismo valor, por ejemplo:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_BACKEND_URL=http://localhost:8080
```

## Puertos y conectividad

- Frontend: `3000`
- Backend: `8080`
- MPI service: `5001`
- Ollama local opcional: `11434`

Conectividad esperada:

- Frontend -> Backend
- Backend -> PostgreSQL
- Backend -> MPI service
- Backend -> Gemini o Groq si se quiere IA externa
- Backend -> Ollama si se usa el endpoint local configurado

## Comandos de ejecución

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

### Servicio MPI

```bash
cd mpi_service
python -m pip install -r requirements.txt
./run_mpi.sh
```

## Requerimientos funcionales especiales

### Validación de ejercicios SQL

El sistema de ejercicios no trabaja con mocks. Requiere base de datos real y una estructura compatible con el sandbox.

Restricciones detectadas:

- Se cambia el `search_path` del usuario al esquema sandbox.
- Para DML, el backend agrega `RETURNING *;` automáticamente.
- Se bloquean referencias directas a esquemas sensibles como `lms_core`, `information_schema` y `pg_catalog`.

### Analítica paralela

La ruta `GET /api/analytics/mpi` del backend depende de que el microservicio Python esté activo. Si `mpi_service` no está arriba, esa funcionalidad responderá con error `502`.

## Inconsistencias detectadas en el repositorio

Durante el análisis aparecieron diferencias entre documentación y código:

1. El `README.md` principal describe un stack antiguo con FastAPI y MongoDB, pero el código actual usa Spring Boot y PostgreSQL.
2. `CLAUDE.md` menciona Gemini como IA principal, pero `ClawbotService` también contempla Groq y una URL de Ollama.
3. La variable de entorno del frontend no está unificada:
   - parte del código usa `REACT_APP_API_URL`
   - otra parte usa `REACT_APP_BACKEND_URL`
4. La documentación histórica menciona `BaseDeDatosZaca.sql`, pero ese archivo no existe en la raíz actual.

## Recomendación mínima para levantar el proyecto localmente

1. Instalar Java 21.
2. Instalar Node.js LTS y Yarn 1.22.22.
3. Instalar Python 3.10+ y Open MPI.
4. Restaurar PostgreSQL con los esquemas `lms_core` y `lms_sandbox`.
5. Configurar `application.properties` o equivalentes con acceso válido a PostgreSQL.
6. Definir en frontend:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_BACKEND_URL=http://localhost:8080
```

7. Levantar:
   - backend
   - frontend
   - `mpi_service` si se usará `/analytics`

## Estado del análisis

Este documento fue construido revisando principalmente:

- `CLAUDE.md`
- `backend/pom.xml`
- `frontend/package.json`
- `mpi_service/requirements.txt`
- `mpi_service/run_mpi.sh`
- `mpi_service/server.py`
- `backend/src/main/java/...`
- `frontend/src/...`

No se ejecutaron pruebas ni se validó conectividad real contra PostgreSQL, Gemini, Groq u Ollama durante este análisis.
