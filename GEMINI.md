# GEMINI.md - Dagon Project Contexto sjsjsj

## Project Overview
Dagon es una plataforma multimateria: SQL/PostgreSQL e Investigación de Operaciones. Comparte XP global, racha, certificados y tutor Clawbot; el desbloqueo y ranking se filtran por materia. Consulta `CLAUDE.md` como fuente de arquitectura vigente y `docs/CHECKPOINT_IO.md` para la retoma.

### Key Technologies
- **Backend:** Java 21, Spring Boot 4.0.3, PostgreSQL.
- **Frontend:** React 19, Tailwind CSS, Shadcn/UI, Framer Motion, Monaco Editor.
- **Analytics Service:** Python 3.10+, Flask, `mpi4py` (Parallel processing).
- **AI Integration:** Supports Gemini API, Groq, and local Ollama (Qwen2.5-coder:7b).

---

## Architecture
The project follows a microservices-like architecture with three main components:
1.  `backend/`: Core logic, user management, and SQL validation.
2.  `frontend/`: Interactive UI for exercises, theory, and dashboard.
3.  `mpi_service/`: Specialized service for parallel analytical tasks.

**Fuente de verdad:** `CLAUDE.md`. Los documentos históricos pueden contradecir el estado actual.

---

## Building and Running

### Prerequisites
- Java 21
- Node.js LTS + Yarn 1.22.22
- Python 3.10+ & Open MPI
- PostgreSQL

### Backend
```bash
cd backend
./mvnw spring-boot:run
```
*Configured via `backend/src/main/resources/application.properties`.*

### Frontend
```bash
cd frontend
yarn install
yarn start
```
*Uses `craco` for build/start. Environment variables `REACT_APP_API_URL` and `REACT_APP_BACKEND_URL` should be set to the backend URL.*

### MPI Service
```bash
cd mpi_service
pip install -r requirements.txt
./run_mpi.sh
```

---

## Development Conventions

### Coding Style
- **Backend:** Standard Spring Boot patterns. Uses Lombok for boilerplate reduction.
- **Frontend:** Functional components with React Hooks. Styling via Tailwind utility classes and Shadcn/UI components.

### Database Management
- The system uses a real PostgreSQL database with a sandbox environment for user queries.
- Instalación: scripts 00 → 01 → 02 → 03_io_semilla.sql. BD previa: migraciones multimateria y aprovisionamiento del 2026_10_05; este último requiere administrador.
- **DDL Auto:** `none` en todos los entornos. En esta retoma solo se autorizaron migraciones locales, nunca Railway.
- NUMERICO valida JSON por campo sin ejecutar SQL ni exponer respuestas. El backend verifica permisos y XP por materia. Aprovisionador NOLOGIN dedicado crea/restaura sandboxes mediante UUID.

### Testing
- Backend tests are located in `backend/src/test`.
- Frontend tests can be run via `yarn test`.

---

## Important Files
- `CLAUDE.md`: fuente técnica vigente.
- `ESTADO_PROYECTO.md`: Recent updates and pending tasks.
- `backend/src/main/resources/application.properties`: placeholders; credenciales en entorno/.env, sin defaults reales.
- `frontend/src/services/apiClient.js`: cliente API, token y caché.
- `frontend/src/lib/io/`: solvers y pruebas; `docs/IO_TEMARIO_UNACH.md`: fuentes y alcance pedagógico.
- `para dilman/`: Directory containing database backups and specialized scripts.
