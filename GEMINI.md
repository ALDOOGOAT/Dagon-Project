# GEMINI.md - Dagon Project Context (Documentación Técnica Completa)

## 1. Visión General del Sistema
Dagon es un LMS (Learning Management System) gamificado para aprender SQL/PostgreSQL con una estética "Abyss & Crimson" (oscuro, glassmorphism, pulpo rojo).

**Flujo Principal:**
USUARIO → Frontend (React) → Backend (Spring Boot) → PostgreSQL
                     ↓
                Clawbot IA (Gemini) ────→ Microservicio MPI (Analytics)

**Módulos Clave:**
- Registro/Login con JWT.
- 5 niveles progresivos de SQL (SELECT, WHERE, JOIN, GROUP BY, DDL).
- Tutor IA (Clawbot) con retroalimentación socrática.
- Leaderboard global y rachas diarias.
- Analytics con programación paralela (MPI).
- Modos alternativos: Drag & Drop, Diagramas ER, Consola Interactiva Transaccional (Módulo 15).

## 2. Arquitectura y Patrones de Diseño
El proyecto emplea una arquitectura MVC y microservicios-lite con los siguientes patrones:
- **Patrón MVC:** View (React Pages), Controller (Backend Controllers como `UsuarioController`, `NivelController`), Model (Entidades JPA).
- **Patrón Repository (Spring Data JPA):** Interfaces que extienden `JpaRepository` para auto-generación de queries (ej. `findByEmail`).
- **Patrón DTO (Data Transfer Object):** Separación de entidades JPA y objetos de respuesta (`EjercicioDTO`, `NivelDTO`).
- **Inyección de Dependencias (Spring IoC):** Uso intensivo de `@Autowired` para inyectar servicios y repositorios.
- **Patrón Filter Chain (Seguridad):** `JwtAuthenticationFilter` intercepta cada petición bajo `/api/**` (excepto `/login`, `/registro`, `/clawbot/**`) para validar el token JWT. `SecurityConfig` maneja las políticas de CORS.

## 3. Tecnologías Clave y Estructura
- **Backend (`backend/`):** Java 21, Spring Boot 4.0.3, PostgreSQL. Dependencias en `pom.xml` incluyen `jjwt`, `spring-boot-starter-data-jpa`, `lombok`. Uso de Maven Wrapper (`./mvnw`).
- **Frontend (`frontend/`):** React 19, React Router v7, Tailwind CSS 3.4, Shadcn/UI, Framer Motion, Monaco Editor. Se usa `yarn` (NO `npm`) y `Craco` para el build.
- **Analytics Service (`mpi_service/`):** Python 3.10+, Flask (`server.py`), `mpi4py` (`analytics_mpi.py`). Implementa paralelismo real con scatter/reduce.
- **AI Integration:** Clawbot usa Gemini API (configurado en `application.properties`).

## 4. Base de Datos (PostgreSQL)
El sistema divide la información en esquemas. **NUNCA usar ddl-auto=update**. La fuente de verdad es `BaseDeDatosZaca.sql`.
- `lms_core`: Datos del sistema (usuarios, módulos, ejercicios_practicos, v_ranking_alumnos).
- `lms_sandbox`: Tablas interactivas (aventureros, misiones). El motor SQL usa `search_path = 'lms_sandbox'`.
- `lms_sandbox_template`: Molde para reiniciar el sandbox.
- `sandbox_usuario_{uuid}`: Esquema aislado dinámico para DDL de cada usuario.

## 5. Motor de Validación SQL (EjercicioService)
El motor de validación ejecuta el código SQL del alumno en un entorno seguro (`app_sandbox_user`) y lo compara:
1. **Seguridad (Escudo de Dagon):** Bloquea comandos destructivos (DROP DATABASE, TRUNCATE) y previene acceso a `lms_core`.
2. **DML (INSERT/UPDATE/DELETE):**
   - Ejecuta la `queryMaestra` en el sandbox con auto-rollback (`conn.setAutoCommit(false)`).
   - Ejecuta la `queryUsuario` en el sandbox con auto-rollback.
   - Compara los resultados ignorando columnas ID autogeneradas. Inyecta `RETURNING *;` si falta.
3. **DDL (CREATE/ALTER):** Ejecuta en un esquema aislado (`sandbox_usuario_{uuid}`) de manera persistente.
4. **Pedagogía Adaptativa:** Si detecta errores comunes (ej. "multiple primary keys"), lanza intervención pedagógica automática (`isPedagogicalIntervention: true`).
5. **Transacciones (Módulo 15):** Simula concurrencia (Sesión A vs Sesión B) evaluando aislamiento en tiempo real (BEGIN, COMMIT, ROLLBACK).

## 6. API Endpoints Principales
- **Autenticación:** `POST /api/usuarios/login`, `POST /api/usuarios/registro`
- **Usuarios:** `GET /api/usuarios/{id}/stats`, `GET /api/usuarios/ranking`
- **Ejercicios:** `GET /api/levels`, `POST /api/exercises/{id}/validate`
- **Clawbot:** `POST /api/clawbot/chat`, `POST /api/clawbot/analyze`
- **Analytics MPI:** `GET /api/analytics/mpi` (Redirige a `http://127.0.0.1:5001/analytics`)

## 7. Comandos de Ejecución
- **Backend:** `cd backend && ./mvnw spring-boot:run` (`http://localhost:8080`)
- **Frontend:** `cd frontend && yarn install && yarn start` (`http://localhost:3000`)
- **MPI Service:** `cd mpi_service && ./run_mpi.sh` (`http://localhost:5001`)

## 8. Consideraciones Generales y UI
- **Idioma:** Comentarios, UI y commits en ESPAÑOL.
- **Estilos:** NO usar emojis en UI (usar Lucide React). Emplear clases Tailwind/CSS como `glass-card`, `neon-glow`, `cyber-bg`, animaciones (`animate-float`).
- **Fuentes:** Inter (UI) y JetBrains Mono (código).
- **Seguridad:** NUNCA hacer commit de `application.properties` (contiene secretos).
- **Conexión Frontend/Backend:** Usar `apiService.js`. El frontend incluye Axios enviando el Bearer Token global gestionado por `AuthContext`.
