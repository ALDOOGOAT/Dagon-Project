# 🐉 Dagon — Plataforma Interactiva de Aprendizaje SQL

<div align="center">

![Dagon](https://img.shields.io/badge/Dagon-SQL%20Learning-DC2626?style=for-the-badge&logo=postgresql&logoColor=white)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

Plataforma educativa gamificada para aprender SQL y administración de PostgreSQL.  
Sistema de XP, rachas, logros, certificados y un tutor IA (**Clawbot**) integrado.

</div>

---

## 📐 Arquitectura

El proyecto tiene **3 servicios** que se levantan por separado:

| Servicio | Stack | Puerto |
|----------|-------|--------|
| **Backend** | Java 21, Spring Boot 4.0.3, Spring Security + JWT, PostgreSQL | `localhost:8080` |
| **Frontend** | React 19, CRACO, Tailwind CSS 3.4, Shadcn/UI, Framer Motion, Monaco Editor | `localhost:3000` |
| **MPI Service** *(opcional)* | Python 3.10+, Flask, mpi4py | `localhost:5001` |

```
Frontend (:3000)  ──Axios+JWT──▶  Backend (:8080)  ──JPA──▶  PostgreSQL (dagon_local)
                                       │
                                       ├──▶  MPI Service (:5001)  [opcional]
                                       └──▶  Gemini API  [opcional, IA]
```

---

## 🚀 Instalación Local (paso a paso)

### Prerequisitos

| Herramienta | Versión | Notas |
|-------------|---------|-------|
| **Java** | 21 | OpenJDK o similar |
| **PostgreSQL** | 14+ | Corriendo en `localhost:5432` |
| **Node.js** | LTS (20+) | |
| **Yarn** | 1.22+ | ⚠️ **NO usar npm** — el proyecto usa Yarn |
| **Python** | 3.10+ | Solo si quieres el servicio MPI |
| **Open MPI** | Cualquier | Solo si quieres el servicio MPI |

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/Dagon-Project.git
cd Dagon-Project
```

### 2. Base de Datos

Crea la base de datos y carga el schema + datos iniciales:

```bash
# Crear la BD
psql -U postgres -c "CREATE DATABASE dagon_local;"

# Instalar schema (estructura + roles + sandbox)
psql -U postgres -d dagon_local -f scripts/00_instalacion_limpia.sql

# Cargar datos semilla (cursos, módulos, temas)
psql -U postgres -d dagon_local -f scripts/01_datos_semilla.sql

# Cargar ejercicios
psql -U postgres -d dagon_local -f scripts/02_ejercicios_semilla.sql

# Aplicar migraciones (en orden)
psql -U postgres -d dagon_local -f scripts/migraciones/2026_05_13_fase4_indices_metadatos.sql
psql -U postgres -d dagon_local -f scripts/migraciones/2026_05_16_performance_seguridad.sql
psql -U postgres -d dagon_local -f scripts/migraciones/2026_05_17_fix_usuarios_roles_activo.sql
psql -U postgres -d dagon_local -f scripts/migraciones/2026_05_18_practica_rapida_niveles_progresivos.sql
psql -U postgres -d dagon_local -f scripts/migraciones/2026_05_18_practica_rapida_xp_racha.sql
psql -U postgres -d dagon_local -f scripts/migraciones/20260517_01_docente_grupos.sql
psql -U postgres -d dagon_local -f scripts/migraciones/20260523_01_respuesta_agil_indices.sql
```

> **Importante:** Hibernate tiene `ddl-auto=none`. Java **nunca** crea ni modifica tablas — todo se maneja con estos scripts SQL.

### 3. Configurar el Backend

Copia la plantilla de configuración y edita tus credenciales:

```bash
cd backend/src/main/resources
cp application.properties.example application.properties
```

Edita `application.properties` con tus datos reales:

```properties
# Tu contraseña de PostgreSQL (o déjalo vacío si no tienes)
spring.datasource.password=TU_PASSWORD_AQUI

# Sandbox (misma BD, puede usar las mismas credenciales)
dagon.sandbox.password=TU_PASSWORD_AQUI

# (Opcional) API key de Gemini para el tutor IA Clawbot
# Sin esto, Clawbot usa respuestas de fallback — el resto funciona normal
# gemini.api.key=TU_KEY_AQUI
```

### 4. Configurar el Frontend

```bash
cd frontend
cp .env.example .env
```

El `.env.example` ya viene apuntando a `localhost:8080`. Si tu backend corre en otro puerto, modifícalo.

### 5. Levantar los servicios

Necesitas **2 terminales** (3 si usas MPI):

```bash
# Terminal 1 — Backend
cd backend
./mvnw spring-boot:run

# Terminal 2 — Frontend
cd frontend
yarn install    # solo la primera vez
yarn start
```

Abre `http://localhost:3000` en tu navegador.

```bash
# Terminal 3 — MPI Service (OPCIONAL — solo para /analytics)
cd mpi_service
pip install -r requirements.txt
./run_mpi.sh
```

### 6. Usuario de prueba

Regístrate desde la pantalla de login, o si cargaste los datos semilla:

```
Email:    demo@dagon.com
Password: demo123
```

---

## 📁 Estructura del Proyecto

```
Dagon-Project/
├── backend/                          # API REST — Java 21 + Spring Boot
│   ├── src/main/java/com/dagon/backend/
│   │   ├── controller/               #   Controladores REST
│   │   ├── service/                   #   Lógica de negocio
│   │   │   └── validation/            #   Motor de validación SQL
│   │   ├── model/                     #   Entidades JPA
│   │   ├── repository/                #   Repositorios Spring Data
│   │   ├── security/                  #   JWT + Rate Limiter
│   │   ├── config/                    #   Security, CORS, DataSources
│   │   └── dto/                       #   Objetos de transferencia
│   └── src/main/resources/
│       └── application.properties     #   Config (⚠️ NO commitear)
│
├── frontend/                          # UI — React 19 + CRACO
│   ├── src/
│   │   ├── pages/                     #   Páginas (Dashboard, Exercise, etc.)
│   │   ├── components/                #   Componentes + Shadcn/UI
│   │   ├── services/                  #   Cliente API (Axios)
│   │   ├── contexts/                  #   AuthContext, ThemeContext
│   │   ├── config/                    #   API_BASE URL
│   │   └── lib/                       #   Utils, SoundEngine
│   ├── .env.example                   #   Plantilla de variables
│   └── package.json                   #   Deps (yarn install)
│
├── mpi_service/                       # Analytics paralelo (opcional)
│   ├── server.py                      #   Flask API
│   ├── analytics_mpi.py              #   Procesamiento MPI
│   └── run_mpi.sh                     #   Script de arranque
│
├── scripts/                           # SQL para setup de BD
│   ├── 00_instalacion_limpia.sql      #   Schema completo
│   ├── 01_datos_semilla.sql           #   Datos iniciales
│   ├── 02_ejercicios_semilla.sql      #   Ejercicios/misiones
│   └── migraciones/                   #   Migraciones incrementales
│
└── docs/                              # Documentación adicional
```

---

## 🎯 API Endpoints Principales

Todos bajo `/api`. Requieren JWT salvo login/registro.

| Grupo | Endpoints Clave |
|-------|----------------|
| **Auth** | `POST /api/usuarios/registro`, `POST /api/usuarios/login` |
| **Dashboard** | `GET /api/dashboard/resumen` |
| **Niveles** | `GET /api/levels`, `GET /api/exercises/{levelId}` |
| **Validación SQL** | `POST /api/exercises/{id}/validate` |
| **Clawbot (IA)** | `POST /api/clawbot/chat`, `POST /api/clawbot/analyze` |
| **Leaderboard** | `GET /api/leaderboard` |
| **Módulos** | `GET /api/modulos`, `GET /api/modulos/completados` |
| **Docente** | `GET /api/docente/resumen`, `GET /api/docente/alumnos`, ... |
| **Analytics** | `GET /api/analytics/mpi` *(proxy al servicio Python)* |

---

## 🌊 Características Principales

- **Sandbox SQL real** — Los estudiantes ejecutan queries contra PostgreSQL real bajo un rol restringido (`app_sandbox_user`, sin `DROP`/`TRUNCATE`)
- **Editor Monaco** — Editor de código con resaltado SQL (el mismo de VS Code)
- **Tutor IA Clawbot** — Chatbot impulsado por Gemini API (con fallback sin API key)
- **Gamificación** — XP, rachas, logros, certificados, leaderboard
- **Teoría interactiva** — Diagramas MER, Venn SQL, ejercicios drag & drop
- **Panel docente** — Gestión de alumnos, calificaciones, grupos, exportación CSV
- **Diseño "Abyss & Crimson"** — Tema oscuro con glassmorphism y mascota animada (Dagon)
- **Analytics MPI** — Procesamiento paralelo con visualización de ranks (feature académico)

---

## 🔧 Stack Tecnológico

### Backend
| Tecnología | Uso |
|-----------|-----|
| Java 21 + Spring Boot 4.0.3 | Framework web y API REST |
| Spring Security + JWT (jjwt 0.11.5) | Autenticación stateless |
| Spring Data JPA + Hibernate | ORM con PostgreSQL |
| Lombok | Reducción de boilerplate |
| Google Gemini API | Tutor IA Clawbot *(opcional)* |

### Frontend
| Tecnología | Uso |
|-----------|-----|
| React 19 + CRACO | Framework UI (no react-scripts directo) |
| Tailwind CSS 3.4 + Shadcn/UI | Estilos y componentes |
| Framer Motion | Animaciones y transiciones |
| Monaco Editor | Editor SQL interactivo |
| Recharts | Gráficas y visualización |
| Axios | Cliente HTTP con interceptores JWT |
| Lucide React | Iconos |

### MPI Service *(opcional)*
| Tecnología | Uso |
|-----------|-----|
| Python 3.10+ + Flask | API HTTP |
| mpi4py + Open MPI | Procesamiento paralelo |

---

## 🗄️ Base de Datos

- **Motor:** PostgreSQL
- **Nombre:** `dagon_local` (local) 
- **Schemas:** `lms_core` (tablas principales), `lms_sandbox` (ejecución de queries de alumnos), `lms_sandbox_template` (plantilla para sandboxes por usuario)
- **DDL-Auto:** `none` — Hibernate nunca modifica el schema
- **Scripts:** Todo en `scripts/` — ejecutar en orden numérico

### Tablas principales
`usuarios`, `cursos`, `modulos`, `ejercicios_practicos`, `intentos`, `progreso`, `logros`, `usuario_logros`, `certificados`, `docentes`, `roles`

---

## 🔐 Seguridad

- JWT stateless con expiración de 24h
- Contraseñas hasheadas con BCrypt
- CORS configurado para `localhost:3000` (y Vercel en producción)
- Sandbox SQL con rol restringido (`app_sandbox_user`)
- Rate limiting en autenticación y chat IA

---

## 🎨 Paleta de Colores

```css
--abyss-deep:     #020617   /* Fondo principal */
--ocean-surface:  #0F172A   /* Fondo secundario */
--crimson-red:    #DC2626   /* Acento principal */
--cyan-glow:      #06B6D4   /* Acento secundario */
--text-primary:   #F8FAFC   /* Texto claro */
--text-secondary: #94A3B8   /* Texto atenuado */
```

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| `yarn: command not found` | Instalar con `npm install -g yarn` |
| Backend no conecta a BD | Verifica credenciales en `application.properties` y que PostgreSQL esté corriendo |
| Frontend da error 401 | Tu token JWT expiró — vuelve a hacer login |
| Clawbot no responde con IA | Normal si no configuraste `gemini.api.key` — usa respuestas de fallback |
| Puerto 3000/8080 ocupado | Mata el proceso anterior o cambia el puerto |
| `./mvnw: Permission denied` | Ejecuta `chmod +x backend/mvnw` |
| MPI no arranca | Verifica que `mpirun` esté instalado (`sudo apt install openmpi-bin`) |

---

## 📄 Licencia

Proyecto educativo desarrollado como plataforma de aprendizaje SQL.

## 💡 Créditos

- **Diseño:** Inspirado en Jujutsu Kaisen (Dagon)
- **Stack:** Spring Boot + React + PostgreSQL
- **IA:** Google Gemini API
- **Componentes:** Shadcn/UI + Monaco Editor

---

<div align="center">

**Desarrollado con 🔴 pasión por el equipo Dagon**

</div>
