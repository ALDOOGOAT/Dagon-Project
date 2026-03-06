# Dagon - Plataforma Interactiva de SQL

## Descripción del Producto
Dagon es una plataforma educativa interactiva para aprender SQL y administración de PostgreSQL. Utiliza un enfoque gamificado inspirado en Duolingo, con una mascota (Dagon, un pulpo rojo inspirado en Jujutsu Kaisen) que guía al usuario.

## Stack Tecnológico
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Base de Datos**: MongoDB (actual) → PostgreSQL (planificado)
- **Autenticación**: JWT custom
- **Drag & Drop**: @hello-pangea/dnd
- **Code Editor**: @monaco-editor/react

## Funcionalidades Implementadas

### Autenticación
- [x] Login con email/password
- [x] Registro de nuevos usuarios
- [x] JWT token management
- [x] Persistencia de sesión en localStorage

### Dashboard
- [x] Vista de XP y racha del usuario
- [x] Mapa de niveles (Nivel 0, Básico, Medio, Avanzado, Pro)
- [x] Cards de navegación a Profile y Leaderboard
- [x] Tutorial overlay para nuevos usuarios

### Ejercicios
- [x] **Drag & Drop**: Arrastrar palabras SQL para construir queries (FIX CONFIRMADO)
- [x] **Code Editor**: Editor Monaco para ejercicios avanzados
- [x] Sección de teoría con mascota animada
- [x] Sistema de pistas (hints)
- [x] Validación de respuestas
- [x] Animación de recompensa (+XP, estrellas)

### Páginas Adicionales
- [x] ProfilePage (estructura básica)
- [x] LeaderboardPage (estructura básica)

## Bugs Resueltos

### 2025-03-06: Bug Drag & Drop CORREGIDO
**Problema**: Los usuarios no podían soltar palabras en la zona de construcción. Error: `Cannot find draggable entry with id [word-*-1]`

**Causa Raíz**: Los `draggableId` contenían caracteres especiales (como `*`) que causaban errores en @hello-pangea/dnd.

**Solución**: 
- Cambiar de almacenar strings a objetos `{id, word}`
- Usar IDs numéricos seguros (`word-0`, `word-1`, etc.)
- Mantener la palabra real en el campo `word` del objeto

**Archivos modificados**: `/app/frontend/src/pages/ExercisePage.js`

## Próximas Tareas

### P0 - Alta Prioridad
- [ ] **Migración a PostgreSQL**: Implementar el esquema SQL proporcionado por el usuario
  - Instalar psycopg2-binary y SQLAlchemy
  - Crear modelos Pydantic/SQLAlchemy
  - Reescribir endpoints para usar PostgreSQL real

### P1 - Media Prioridad
- [ ] Completar las 4 mejoras UX estilo Duolingo:
  1. [ ] Transiciones fluidas entre páginas (framer-motion)
  2. [ ] Clawbot visual como tutor integrado con diagramas
  3. [ ] Sección de teoría como "cinemática" auto-playing
  4. [ ] Refinar tutorial interactivo
- [ ] Arreglar conflictos de z-index/overlay

### P2 - Baja Prioridad
- [ ] Mejorar persistencia de sesión
- [ ] Conectar eventualmente con backend Spring Boot del usuario (localhost:8080)
- [ ] UI glassmorphism refinado

## APIs Mock Actuales
Los ejercicios y niveles están hardcodeados en `server.py`:
- `GET /api/levels` → MOCK_LEVELS
- `GET /api/exercises/{level_id}` → MOCK_EXERCISES

Las APIs de auth y validación funcionan con MongoDB real.

## Credenciales de Prueba
- Email: dragon123@test.com
- Password: Dragon123!

## URL de Preview
https://postgres-academy-1.preview.emergentagent.com
