# AGENTS.md - Proyecto Dagon

> For architecture, commands, and conventions: see `CLAUDE.md`.
> For repo layout and endpoint docs: see `CLAUDE.md` §3, §5, §6.

## Developer Commands

```bash
# Backend (Maven wrapper, Java 21 required)
cd backend && ./mvnw spring-boot:run        # http://localhost:8080

# Frontend (yarn, NOT npm — see packageManager field)
cd frontend && yarn install && yarn start    # http://localhost:3000 (uses craco, not react-scripts)

# MPI analytics service (requires mpi4py + flask)
cd mpi_service && ./run_mpi.sh              # http://localhost:5001
```

Frontend test: `cd frontend && yarn test` (craco test)
Backend test: `cd backend && ./mvnw test`

## Critical Config Facts

- **`ddl-auto=none`** — Hibernate never creates/updates tables. `BaseDeDatosZaca.sql` is the DB source of truth. Never enable `ddl-auto=update` or add Flyway without asking.
- **Secrets in `backend/src/main/resources/application.properties`** — Contains real DB credentials and Gemini API key in plaintext. Do NOT expose in responses or commits.
- **CORS** — Backend allows only `http://localhost:3000`. Update `SecurityConfig.java` and `@CrossOrigin` annotations if port changes.
- **Hardcoded backend URL** — `DashboardPage.js` hardcodes `http://localhost:8080`. `apiService.js` uses `process.env.REACT_APP_BACKEND_URL`. No `.env` exists currently. Use `API_BASE` constant for new calls.

## SQL Sandbox Execution

- User code runs under role `app_sandbox_user` (no `DROP`/`TRUNCATE`)
- `search_path` must be `lms_sandbox`
- `EjercicioService.java` auto-appends `RETURNING *;` to DML statements
- Comparison ignores `id`/`id_` columns and normalizes all values to `String`

## Language & Style Conventions

- Comments, UI strings, and commits in **Spanish**
- Icons: `lucide-react` only — no emojis unless user requests
- Fonts: Inter (UI) + JetBrains Mono (code) — loaded in `frontend/src/index.css`
- Custom classes: `glass-card`, `glass-card-apple`, `neon-glow`, `neon-glow-red`, `cyber-bg`, `grid-pattern`, `animate-float`, `animate-breathe`, `animate-pulse-glow` — reuse before creating new ones

## MPI Analytics (Academic Feature)

- Python microservice using `mpi4py` + Flask
- `AnalyticsController.java` proxies requests to `http://127.0.0.1:5001`
- `mpirun -np 4 python analytics_mpi.py` — scatter/reduce across ranks
- Frontend `/analytics` page shows rank-by-rank MPI timing with Recharts + Framer Motion

## What NOT to Do

- Do not mock the DB in exercise validation (breaks script master contract)
- Do not replace Tailwind with CSS modules or styled-components
- Do not change `/analytics/mpi` contract without updating frontend
- Do not commit `application.properties` secrets to public repos