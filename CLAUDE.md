# Dagon-Project — Guía rápida para Claude

> **Lee esto primero.** Resume arquitectura, rutas, comandos y convenciones para que no tengas que re-explorar el repo en cada sesión. Si algo cambia (nuevo endpoint, renombre, librería), **actualiza este archivo**.

---

## 1. Qué es Dagon

LMS gamificado para aprender SQL / PostgreSQL, con tutor IA (Clawbot / Gemini) y estética "Abyss & Crimson" (oscuro, glassmorphism, pulpo rojo). 5 niveles progresivos, XP, rachas, leaderboard.

## 2. Stack

| Capa | Tech |
|---|---|
| Frontend | React 19 + Craco, React Router v7, Tailwind 3.4, Shadcn/Radix, Framer Motion, Monaco Editor, Axios, Sonner, Recharts |
| Backend | Spring Boot 4.0.3 (Java 21), Spring Security + JWT (jjwt 0.11.5), Spring Data JPA, Lombok |
| DB | PostgreSQL — schemas `lms_core` y `lms_sandbox` |
| IA | Google Gemini API (key en `application.properties`) |
| Paralelismo | **Microservicio Python con `mpi4py`** (ver §7) |

## 3. Layout de carpetas

```
Dagon-Project/
├── CLAUDE.md              ← este archivo
├── README.md              ← README público
├── BaseDeDatosZaca.sql    ← script maestro de la DB (22 KB)
├── respaldo_db.sql        ← respaldo con datos
├── backend/               ← Spring Boot
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/dagon/backend/
│       │   ├── DagonBackendApplication.java
│       │   ├── config/SecurityConfig.java
│       │   ├── security/{JwtUtil, JwtAuthenticationFilter}.java
│       │   ├── controller/   ← Usuario, Nivel, Clawbot, Modulo, Leaderboard, Analytics (MPI)
│       │   ├── service/      ← lógica de negocio
│       │   ├── model/        ← entidades JPA
│       │   ├── dto/          ← DTOs (EjercicioDTO, NivelDTO)
│       │   └── repository/   ← Spring Data repos
│       └── resources/application.properties
├── frontend/              ← React
│   ├── package.json  (yarn)
│   ├── craco.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.js
│       ├── index.css              ← utilidades Tailwind + animaciones
│       ├── pages/                 ← Login, Dashboard, Exercise, Leaderboard, Profile, Streak, Analytics
│       ├── components/            ← Clawbot, DagonMascot, AbyssBackground, ui/* (Shadcn)
│       ├── data/                  ← guiones locales de cinemáticas por módulo
│       ├── contexts/AuthContext.js
│       ├── services/apiService.js
│       └── hooks/ + lib/
└── mpi_service/           ← microservicio Python MPI (ver §7)
    ├── analytics_mpi.py
    ├── server.py          ← HTTP wrapper Flask
    ├── requirements.txt
    └── run_mpi.sh
```

## 4. Comandos para correr

```bash
# Backend  →  http://localhost:8080
cd backend && ./mvnw spring-boot:run

# Frontend →  http://localhost:3000
cd frontend && yarn install && yarn start

# MPI service → http://localhost:5001
cd mpi_service && ./run_mpi.sh      # lanza mpirun -np 4 python server.py
```

Prerequisitos MPI (macOS): `brew install open-mpi && pip install mpi4py flask psycopg2-binary`.

## 5. Rutas del frontend (React Router)

| Path | Componente | Protegida |
|---|---|---|
| `/` | LoginPage | no (redirige a /dashboard si hay token) |
| `/dashboard` | DashboardPage | ✅ |
| `/exercise/:levelId` | ExercisePage | ✅ |
| `/leaderboard` | LeaderboardPage | ✅ |
| `/profile` | ProfilePage | ✅ |
| `/streak` | StreakPage | no |
| `/analytics` | AnalyticsPage (MPI) | ✅ |

## 6. Endpoints REST backend

Todos bajo `http://localhost:8080/api`. Todos requieren `Authorization: Bearer <JWT>` salvo `/usuarios/login` y `/usuarios/registro`.

| Método | Path | Handler |
|---|---|---|
| POST | `/usuarios/registro` | UsuarioController |
| POST | `/usuarios/login` | UsuarioController |
| GET  | `/usuarios/{id}/stats` | UsuarioController — xp, racha, posición |
| GET  | `/modulos` | ModuloController — lista de misiones con flag `bloqueado` |
| GET  | `/levels`, `/exercises/{id}` | NivelController |
| POST | `/exercises/validate` | NivelController — valida query SQL |
| POST | `/clawbot` | ClawbotController — chat Gemini |
| GET  | `/leaderboard` | LeaderboardController |
| GET  | `/leaderboard/exercises/{exerciseId}` | LeaderboardController — ranking de eficiencia y SQL Golf por misión |
| POST | `/modeling/ddl-to-erd` | ModelingController — convierte DDL `CREATE TABLE` en nodos/aristas ERD |
| POST | `/modeling/erd-to-ddl` | ModelingController — genera DDL desde el diagrama ERD |
| GET  | `/analytics/mpi` | **AnalyticsController** — proxy al servicio MPI |

## 7. MPI (Programación Distribuida y Paralela)

**Motivación académica:** se añadió un microservicio Python con `mpi4py` que paraleliza el cálculo de métricas del leaderboard (promedios de XP, distribución por rango, top-N) usando `MPI.COMM_WORLD`. Cada rank procesa un subconjunto de usuarios (scatter) y el rank 0 agrega (reduce).

**Flujo:**
```
Frontend  ──GET /analytics──►  Spring Boot AnalyticsController
                                        │ HTTP GET (localhost:5001)
                                        ▼
                               Flask server.py  ──spawn──►  mpirun -np 4 analytics_mpi.py
                                        │                         │
                                        │  (scatter/reduce vía MPI.COMM_WORLD)
                                        ▼
                                    JSON con estadísticas paralelas
```

Archivos clave: `mpi_service/analytics_mpi.py` (lógica MPI pura), `mpi_service/server.py` (HTTP), `backend/.../controller/AnalyticsController.java` (proxy).

La página `/analytics` en el frontend muestra el resultado con animaciones (Recharts + Framer Motion) e indica rank-by-rank el tiempo gastado por cada nodo MPI — útil para la materia.

## 8. Convenciones y gotchas

- **Idioma:** comentarios, variables de UI y commits en **español**. Respeta el tono existente.
- **URL del backend:** `DashboardPage.js` **hardcodea** `http://localhost:8080`. `apiService.js` usa `process.env.REACT_APP_BACKEND_URL`. No existe `.env` actualmente. Si agregas llamadas nuevas, **usa `API_BASE` constante**; no repitas el hardcode.
- **Auth:** el token JWT vive en `AuthContext`; recupera con `useAuth().token` y manda `Authorization: Bearer ${token}`.
- **DB:** `ddl-auto=none`. **Nunca** dejes que Hibernate cree tablas — el script maestro (`BaseDeDatosZaca.sql`) es la fuente de verdad. Si necesitas una tabla nueva, añade SQL al script y documéntalo aquí.
- **Secrets:** `application.properties` tiene password DB y API key Gemini en texto plano. **No** las saques en respuestas ni commits a repos públicos.
- **CORS:** backend abre solo `http://localhost:3000`. Al cambiar puerto, toca `SecurityConfig.java` y cada `@CrossOrigin`.
- **Estética:** clases custom `glass-card`, `glass-card-apple`, `neon-glow`, `neon-glow-red`, `cyber-bg`, `grid-pattern`, animaciones `animate-float`, `animate-breathe`, `animate-pulse-glow`. Reúsalas antes de crear nuevas.
- **Fonts:** Inter (UI) + JetBrains Mono (código). Ya cargadas en `index.css`.
- **Iconos:** `lucide-react`. Nunca uses emoji salvo que el usuario pida.
- **Cinemáticas:** los guiones personalizados por módulo viven en `frontend/src/data/moduleCinematics.js`; los sonidos locales CC0 viven en `frontend/public/assets/sounds/` con licencia documentada.

## 9. Cosas que NO hacer

- No mockees la DB en validación de ejercicios (cambiaría el contrato del script maestro).
- No reemplaces Tailwind por CSS modules o styled-components.
- No agregues `ddl-auto=update` ni migraciones Flyway sin preguntar.
- No cambies el contrato del endpoint `/analytics/mpi` sin actualizar el frontend.

## 10. Estado actual (abril 2026)

- Branch activa: `feature/conexion-niveles`.
- Último trabajo: integración del script DB, motor de validación nuevo, Clawbot con rachas.
- WIP: Dagon se está especializando en SQL avanzado. El backend registra métricas competitivas por intento (`tiempo_ms`, `costo_ejecucion`, `longitud_caracteres`), ejecuta `EXPLAIN ANALYZE` para consultas SELECT correctas y expone ranking por ejercicio para eficiencia y SQL Golf. También incluye "Misterios de Dagon" con dataset masivo por usuario, timeouts didácticos e índices requeridos, más un laboratorio de modelado que convierte DDL a ERD y ERD a DDL.

---

**Cuando termines una modificación no trivial, actualiza secciones §3, §6, §7 o §10 según corresponda.** Mantener este archivo al día es lo que hace que la próxima sesión sea barata.
