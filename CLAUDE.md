# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Léeme primero.** Arquitectura, comandos y convenciones para no re-explorar el repo cada sesión.
> Si algo cambia (endpoint, renombre, migración), **actualiza este archivo**.
> `AGENTS.md` y `GEMINI.md` son resúmenes para otros agentes; si cambias algo aquí, revísalos.

---

## 1. Qué es Dagon

LMS gamificado para aprender SQL / PostgreSQL, con tutor IA (**Clawbot**) y estética "Abyss & Crimson".
XP, rachas, certificados, leaderboard, panel docente y prácticas rápidas.

## 2. Servicios y comandos

| Servicio | Stack | Puerto |
|---|---|---|
| `backend/` | Java 21, Spring Boot 4.0.3, Spring Security + JWT (jjwt 0.11.5), Spring Data JPA + JdbcTemplate, Lombok | 8080 |
| `frontend/` | React 19 + CRACO, React Router v7, Tailwind 3.4, Shadcn/Radix, Framer Motion, Monaco, `@xyflow/react`, Recharts, Axios, Sonner | 3000 |
| `mpi_service/` *(opcional)* | Python 3.10+, Flask, `mpi4py` | 5001 |

```bash
cd backend  && ./mvnw spring-boot:run
cd frontend && yarn install && yarn start      # yarn 1.22.22 (campo packageManager). Hay package-lock.json residual: ignóralo.
cd mpi_service && ./run_mpi.sh                 # DAGON_MPI_PROCS=8 PORT=5050 ./run_mpi.sh

# Tests
cd backend  && ./mvnw test
cd backend  && ./mvnw test -Dtest=DocenteControllerTest            # una clase
cd backend  && ./mvnw test -Dtest=DocenteControllerTest#nombreDelTest
cd frontend && yarn test                                           # craco test (jest watch)
cd frontend && CI=true yarn test --testPathPattern=NombreDelTest    # una suite, sin watch

# Build
cd backend && ./mvnw clean package
cd frontend && yarn build
```

## 3. Configuración (nada de valores hardcodeados)

- **Backend:** todo sale de `application.properties` con placeholders `${VAR:default}`. Los valores reales viven en `backend/.env` (gitignoreado); la plantilla es `backend/.env.example`. `spring.config.import` carga `backend/.env` y `.env` de la raíz.
- **`DatabaseEnvironmentInitializer`** normaliza `DATABASE_URL` / `DATABASE_PUBLIC_URL` / `PG*` (formatos `postgres://`, `postgresql://`, `jdbc:postgresql://`) hacia `spring.datasource.*` y `dagon.sandbox.*` antes de arrancar el contexto. Si agregas una variable de conexión, va ahí.
- **Frontend:** `frontend/src/config/api.js` exporta `API_BASE` y `apiUrl()` leyendo `REACT_APP_API_URL` → `REACT_APP_BACKEND_URL` → `http://localhost:8080`. **Nunca escribas una URL de backend a mano**; usa `apiClient` o `apiUrl()`. Craco no recarga `.env` en caliente: reinicia `yarn start`.
- **CORS:** `dagon.cors.allowed-origins` (coma-separado, acepta patrones tipo `https://*.vercel.app`). Ya no está hardcodeado en `SecurityConfig.java`.
- **Secretos:** DB, `DAGON_JWT_SECRET`, `GEMINI_API_KEY`, `GROQ_API_KEY`. Nunca los imprimas en respuestas ni los commitees.
- Detalles de arranque local y diagnóstico: `docs/LOCAL_DEV.md`.

## 4. Base de datos

- `spring.jpa.hibernate.ddl-auto=none` — **Hibernate nunca crea ni altera tablas.** No lo cambies ni agregues Flyway sin preguntar.
- Fuente de verdad, en orden: `scripts/00_instalacion_limpia.sql` → `scripts/01_datos_semilla.sql` → `scripts/02_ejercicios_semilla.sql`.
- Cambios de esquema = **nuevo archivo en `scripts/migraciones/`** con nombre fechado (`2026_05_28_misterios_modelado.sql`), y reflejarlo en el script de instalación.
- Guías del modelo de datos: `scripts/flujo_bd_dagon.md`, `scripts/guia_bd_fase4.md`. `dagon_backup.sql` (25 MB) es un respaldo, no lo edites.
- Esquemas: `lms_core` (dominio) y, por alumno, `sandbox_usuario_<uuid>` (ver §6).
- La base local corre con `lc_messages = es_ES.UTF-8`: **los errores de PostgreSQL llegan en español y con guillemets** («»). Cualquier parseo de errores debe contemplarlo (ver §9).
- Casi toda la lectura pesada es SQL vía `JdbcTemplate`, no JPA. Solo hay dos entidades (`Usuario`, `EjercicioPractico`); no asumas que existe un repositorio JPA para lo que necesitas.

## 5. Auth y roles

- JWT emitido por `JwtUtil` (issuer/audience/expiración configurables). El frontend lo guarda en `localStorage.token`; `AuthContext` lo expone.
- `JwtAuthenticationFilter` **relee el usuario en cada request** (`id_rol`, `activo`) y mapea `1 → ROLE_ALUMNO`, `2 → ROLE_DOCENTE`, `3 → ROLE_ADMIN`.
- Público: `/api/usuarios/login`, `/api/usuarios/registro`, `/api/usuarios/imagen/**`, y todos los `OPTIONS`. Todo lo demás exige `Authorization: Bearer <JWT>`.
- `AuthRateLimiter` limita intentos de login. `ClawbotRateLimiter` hace lo propio con la IA.
- Alta de docentes: requiere `DAGON_DOCENTE_REGISTRATION_CODE`; los alumnos entran a un grupo con el `codigo_acceso` de `lms_core.grupos_docente`.
- `apiClient` intercepta `401`: borra el token, emite `dagon_unauthorized` y redirige a `/`.

## 6. Validación de ejercicios (el núcleo del backend)

`POST /api/exercises/{id}/validate` → `EjercicioService.validarConsulta` (~103 KB, el archivo más denso del repo).

1. **`EjercicioValidationRouter.resolverTipo`** decide el `TipoValidacionEjercicio` a partir de `formato`, `configuracion_extra` (`tipo_validacion`, `modo`), `id_modulo` y la forma del SQL maestro: `SELECT | DML | DDL | DIAGRAMA | TRANSACCION | PRACTICA_RAPIDA | TEXTUAL`.
2. Cada tipo tiene un `Validador*` (`ValidadorSelect`, `ValidadorDml`, `ValidadorDiagrama`, …) que prevalida; después **siempre** corre `SqlExerciseGuard` (33 KB de reglas antitrampa/didácticas).
3. La query del alumno se ejecuta en el **datasource sandbox** (`SandboxDataSourceConfig`, rol `app_sandbox_user`) con `statement_timeout`, `lock_timeout` e `idle_in_transaction_timeout` propios.
4. `SandboxSqlPolicy` exige el rol `app_sandbox_user` y fija `SET search_path TO sandbox_usuario_<uuid-del-alumno>` — **cada alumno tiene su propio esquema**; `POST /api/modulos/reset-sandbox` lo regenera.
5. En SELECT correctos, `SqlPerformanceService` corre `EXPLAIN ANALYZE` y guarda métricas competitivas (`tiempo_ms`, `costo_ejecucion`, `longitud_caracteres`) en `lms_core.intentos`, que alimentan el ranking de eficiencia y SQL Golf.

`EjercicioService` orquesta; dos servicios vecinos hacen el trabajo concreto:
- **`SandboxExecutionService`** — `ejecutarEnSandbox`, `ejecutarEnSandboxConRollback`, timeouts y `extraerNombreTablaDDL`.
- **`RewardService`** — `registrarIntento` (con las columnas competitivas si la tabla las tiene), `contarAciertosRapidosHoy` y `calcularTiempoMs`. Un intento correcto invalida el caché del leaderboard (§7).

**No mockees la DB en la validación**: el contrato con los scripts maestros se rompe.

## 7. Endpoints REST (`http://localhost:8080/api`)

| Controlador | Rutas |
|---|---|
| `UsuarioController` | `POST /usuarios/registro`, `/usuarios/login`, `/usuarios/login-google`, `GET /usuarios/{id}/stats`, `/usuarios/{id}/profile`, `/usuarios/ranking`, `POST|GET /usuarios/{id}/foto`, `GET /usuarios/imagen/{filename}` |
| `NivelController` | `GET /levels`, `/exercises/{levelId}`, `/practica-rapida`, `POST /exercises/{id}/validate` |
| `ModuloController` | `GET /modulos`, `/modulos/completados`, `/modulos/cursos-completados`, `/modulos/certificado/{cursoId}`, `POST /modulos/reset-sandbox` |
| `DashboardController` | `GET /dashboard/resumen` |
| `LeaderboardController` | `GET /leaderboard`, `/leaderboard/exercises/{exerciseId}` |
| `ClawbotController` | `POST /clawbot/chat`, `/clawbot/analyze`, `GET /clawbot/metrics` |
| `ModelingController` | `POST /modeling/ddl-to-erd`, `/modeling/erd-to-ddl` |
| `AnalyticsController` | `GET /analytics/mpi` (proxy al servicio MPI) |
| `DocenteController` | `GET /docente/resumen`, `/tablero`, `/alumnos`, `/ejercicios-fallados`, `/abandono-modulos`, `/tiempo-promedio`, `/calificaciones{,/resumen,/ejercicios}`, `/intentos/{alumnoId}`, `/exportar/csv`, `GET|POST /grupos`, `GET|POST /grupos/{idGrupo}/alumnos`, `DELETE /grupos/{idGrupo}/alumnos/{alumnoId}`, `GET|POST /ejercicios`, `POST /evaluaciones`, `GET /evaluaciones/{alumnoId}` |

`ApiExceptionHandler` normaliza los errores; `ResponseTimingFilter` añade la cabecera `x-dagon-response-time-ms` (el frontend la loguea en dev).

`/docente/calificaciones` calcula nota 0-10 desde `lms_core.intentos`, restringe alumnos a los grupos del docente y excluye `tipo_mision='RAPIDA'`.

`LeaderboardService.obtenerRankingGlobal(limite)` va cacheado (`@EnableCaching`, caché `leaderboard`, clave = `limite`). Se invalida al registrar un intento correcto y, como red de seguridad, cada 5 min (`@Scheduled`). **No agregues una sobrecarga que llame a ese método desde dentro de la clase**: la auto-invocación se salta el proxy de Spring y el caché deja de aplicarse.

## 8. Frontend

Rutas (`src/App.js`, todas protegidas salvo `/`, todas cargadas con `React.lazy`):
`/` (Login) · `/dashboard` · `/exercise/:levelId` · `/leaderboard` · `/profile` · `/streak` · `/graduation/:levelId` · `/postgres` · `/credits` · `/docente`.

- **`services/apiClient.js`** es la única puerta de salida: axios con `baseURL` de `config/api.js`, inyección del `Bearer`, manejo global de 401 y **caché GET en memoria (TTL 15 s) + deduplicación de peticiones en vuelo** (`cachedGet`). Toda mutación invalida la caché; si añades un endpoint que cambia datos fuera de axios, llama `invalidateApiCache()`.
- `AuthContext` (sesión) y `ThemeContext` (paleta por usuario) envuelven la app.
- `App.js` calcula un **perfil visual adaptativo** (`prefers-reduced-motion`, `saveData`, núcleos, memoria, viewport) que baja intensidad de fondo y FPS en móvil; respétalo al añadir animaciones.
- Audio: `lib/SoundEngine.js` + `hooks/useSound.js`; se inicializa con la primera interacción. Sonidos CC0 en `public/assets/sounds/`.
- Guiones de cinemáticas por módulo: `src/data/moduleCinematics.js`. Contenido de la academia Postgres: `src/data/postgresAcademyContent.js`.
- Archivos gigantes que dominan el frontend: `pages/ExercisePage.js` (139 KB), `pages/DocentePage.js` (77 KB), `pages/DashboardPage.js` (61 KB), `components/LevelTheory.js` (59 KB). Edítalos con búsquedas puntuales, no leyéndolos enteros.

## 9. Clawbot (IA)

Cadena de `ClawbotService`, **en este orden**. Los dos primeros filtros existen para no gastar tokens:

1. **`ClawbotLocalResolver`** — resuelve sin IA. Para errores: mapea ~22 patrones deterministas de PostgreSQL (sintaxis, relación/columna inexistente, GROUP BY, agregación en WHERE, alias fuera del FROM, tipos, constraints, división por cero, permisos, UNION, subconsulta, timeout) a un diagnóstico socrático que **cita el identificador exacto** del error. Para chat: saludos, agradecimientos, despedidas y preguntas de identidad. Si no hay certeza devuelve vacío y deja pasar a la IA — los fallos de lógica ("tu resultado no coincide") **deben** llegar a la IA, ahí el token sí vale.
   **Los patrones cubren inglés y español**: la base del proyecto corre con `lc_messages = es_ES.UTF-8` y devuelve `error de sintaxis en o cerca de «X»`, `no existe la relación «X»`, etc., con guillemets. Si agregas un patrón, cubre las dos variantes y verifica el mensaje real con `psql` antes.
2. **`ClawbotCacheService`** — caché de respuestas ya pagadas. Clave = SHA-256 de (tipo + partes normalizadas); memoria (500 entradas) + tabla `lms_core.clawbot_cache`, que sobrevive a los redeploys. Se purga sola a diario (`@Scheduled`, 30 días sin uso). Si la tabla no existe, la capa persistente se apaga sola y loguea un aviso. El chat solo se cachea cuando llega sin historial.
3. **Gemini** (`gemini-1.5-flash`, si hay `GEMINI_API_KEY`) → **Groq** (si hay `GROQ_API_KEY`) → **Ollama** local (solo si `dagon.clawbot.ollama.enabled=true`) → respuesta de fallback estática. Toda respuesta de IA que pase el guardrail se guarda en caché.
   El modelo de Groq sale de `dagon.clawbot.groq.model` (default `openai/gpt-oss-20b`). Groq retira modelos con frecuencia: si el log dice `model_not_found`, lista los vigentes con `GET https://api.groq.com/openai/v1/models` y cambia la propiedad, no el código.

`ClawbotTelemetryService` registra qué fuente respondió y calcula `ahorro` (`respuestas_sin_ia` / `respuestas_con_ia` / `porcentaje_ahorrado`), visible en `GET /clawbot/metrics`. Los prompts viven en `ClawbotPromptCatalog`: al agregar un modo de chat, añade el prompt al catálogo, no lo incrustes en el servicio.

El frontend parsea las etiquetas `ERROR:`, `CONCEPTO:`, `PISTA:`, `AYUDA:`, `CIERRE:` y `MINIEJEMPLO:` en `lib/exerciseHelpers.js`. Si el backend emite una etiqueta nueva, agrégala también ahí o caerá como texto plano.

## 10. MPI (materia de Programación Distribuida y Paralela)

`AnalyticsController` toma el ranking de `LeaderboardService` y lo POSTea a `dagon.mpi.url` (`http://127.0.0.1:5001`). `server.py` (Flask) lanza `mpirun -np N analytics_mpi.py`: scatter del arreglo de usuarios, cálculo por rank, `reduce` (SUM/MAX) y `gather` de tiempos por rank. El resultado se pinta como panel educativo dentro de **`/leaderboard`** (no hay página `/analytics`). No cambies el contrato de `/analytics/mpi` sin tocar `LeaderboardPage.js`. Con el servicio caído, la página debe seguir funcionando.

## 11. Convenciones

- **Español** en comentarios, textos de UI y mensajes de commit.
- Iconos: `lucide-react`. Sin emojis salvo que el usuario los pida.
- Fuentes: Inter (UI) + JetBrains Mono (código), cargadas en `index.css`.
- Clases propias antes de inventar nuevas: `glass-card`, `glass-card-apple`, `neon-glow`, `neon-glow-red`, `cyber-bg`, `grid-pattern`, `animate-float`, `animate-breathe`, `animate-pulse-glow`.
- No reemplaces Tailwind por CSS modules o styled-components.

## 12. Estado (agosto 2026)

- Rama activa: `main`. Ramas vivas: `feature/conexion-niveles`, `feature/docente-grupos`, `merge/dilman-into-main`, `origin/dilman`.
- Despliegue: backend en **Railway**, frontend en **Vercel** (`INSTRUCCIONES_DEPLOY.md`). En local el backend suele apuntar a la DB de Railway; verifica la línea `Database JDBC URL` al arrancar.
- Última tanda (28 ago 2026): filtro local + caché de Clawbot (§9, migración `2026_08_28_clawbot_cache.sql`) y dos capas de diseño al final de `frontend/src/index.css`. **Los ajustes visuales nuevos van en esas capas, no dispersos por el archivo.**
  - *Capa de refinamiento*: escala tipográfica fluida (`--fs-*` con `clamp`), elevación (`--elev-1..3`), movimiento (`--ease-out-quint`, `--dur-*`), mapa de campaña en grilla `auto-fit`, columna de lectura acotada a 62rem, alto del editor relativo al viewport.
  - *Capa de sistema*: radios (`--r-*`), pesos (`--w-*`), grosor de icono por tamaño (`svg.lucide`), comportamiento común de botones/campos y jerarquía en tres niveles de la botonera del panel (se ordena por `data-tour` desde CSS, sin tocar el marcado).
  - **`App.css` ya no encoge la raíz a 13/14px en móvil.** Lo hacía para que cupiera más contenido, pero menguaba también el texto de lectura (`text-sm` quedaba en 11.4px) y los objetivos táctiles, y pisaba la preferencia del navegador. Ese trabajo lo hacen ahora la escala fluida y los tokens de espaciado. Si vuelves a tocar el tamaño raíz, revisa antes que ninguna ruta desborde en horizontal a 390px.
  - `DagonMascot`: el SVG lleva `overflow: visible` porque los tentáculos se dibujan hasta `y=103` con un `viewBox` que acaba en 100, y el resplandor no cabe en la caja. El contenedor usa `contain: layout style` — con `contain: paint` el `drop-shadow` se recortaba en un rectángulo de luz.
- Notas de trabajo dispersas en la raíz: `ESTADO_PROYECTO.md` (bitácora), `REQUERIMIENTOS_TECNICOS.md`, `CAMBIOS_*.md`, `PLAN_MULTI_ACADEMIA.md`, `RESPONSIVE_MOBILE.md`, `docs/futuras-implementaciones.md`. Son históricas y se contradicen entre sí: **este archivo gana**.

---

**Tras un cambio no trivial, actualiza §3, §4, §6, §7 o §12 según corresponda.**
