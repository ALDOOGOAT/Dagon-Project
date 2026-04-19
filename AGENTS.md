# AGENTS.md - Dagon Project

## Quick Start Commands

```bash
# Backend (Java 21 Spring Boot) → http://localhost:8080
cd backend && ./mvnw spring-boot:run

# Frontend (React 19 + Craco) → http://localhost:3000
cd frontend && yarn install && yarn start

# MPI Service (Python mpi4py) → http://localhost:5001
cd mpi_service && ./run_mpi.sh
```

## Critical Conventions

- **DB changes**: Add SQL to `BaseDeDatosZaca.sql`, never use Hibernate `ddl-auto=update`
- **Language**: Code and UI in Spanish
- **CORS**: Backend permits only `http://localhost:3000`
- **API calls**: Use `API_BASE` from `apiService.js`, avoid hardcoding URLs in components

## Testing

- Frontend: `cd frontend && craco test` (jest bundled, no test framework configured)
- No lint/typecheck scripts exist

## Key References

- `CLAUDE.md` - Full architecture and conventions (read first)
- `BaseDeDatosZaca.sql` - DDL source of truth
- `backend/src/main/resources/application.properties` - DB config, JWT secret, Gemini API key
- `frontend/src/services/apiService.js` - API client