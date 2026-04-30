# GEMINI.md - Dagon Project Context

## Project Overview
Dagon is a modern, interactive educational platform designed for learning SQL and PostgreSQL database administration. It features a gamified experience with XP, streaks, and certificates, supported by an AI tutor named **Clawbot** (or Dagonbot).

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

**Note:** The root `README.md` is currently outdated (describing a FastAPI/MongoDB stack). Refer to `REQUERIMIENTOS_TECNICOS.md` for the most accurate technical specifications.

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
- SQL scripts for database structure and migration are located in the root (`dagon_db_estructura.sql`, `migracion_dagon.sql`).
- **DDL Auto:** Set to `none` in production to prevent schema modification from JPA.

### Testing
- Backend tests are located in `backend/src/test`.
- Frontend tests can be run via `yarn test`.

---

## Important Files
- `REQUERIMIENTOS_TECNICOS.md`: Primary source of technical truth.
- `ESTADO_PROYECTO.md`: Recent updates and pending tasks.
- `backend/src/main/resources/application.properties`: Backend configuration and secrets.
- `frontend/src/services/apiService.js`: API client configuration.
- `para dilman/`: Directory containing database backups and specialized scripts.
