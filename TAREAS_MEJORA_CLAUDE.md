# Tareas de Mejora y Refactorización (Para Claude)

Hola Claude. Este documento contiene un backlog detallado de deuda técnica y mejoras de Experiencia de Usuario (UX) que necesitamos implementar en el Proyecto Dagon. Por favor, toma estas tareas una a la vez cuando te lo solicite.

## 🛠️ Fase 1: Mejoras de UX (Prioridad Alta - Quick Wins)

### 1. Autoguardado de Consultas SQL (Frontend)
**Objetivo:** Evitar que los usuarios pierdan su código SQL si recargan la página accidentalmente.
**Dónde:** `frontend/src/pages/ExercisePage.js` (o donde viva el componente del Monaco Editor).
**Acciones:**
*   Implementar un `useEffect` que guarde el valor actual del editor de código en `localStorage`. La clave debe ser única por ejercicio (ej. `dagon_code_backup_exercise_${exerciseId}`).
*   Al cargar el componente, verificar si existe código guardado en el `localStorage` para ese ejercicio específico y precargarlo en el estado del editor.
*   Añadir un *debounce* (ej. 1 segundo) al guardado para no afectar el rendimiento al escribir rápido.

### 2. Humanización de Errores PostgreSQL
**Objetivo:** Interceptar los errores de sintaxis crudos de Postgres y hacerlos más amigables.
**Dónde:** Backend (`EjercicioService.java` o el servicio que ejecute la consulta) y Frontend.
**Acciones:**
*   Cuando la consulta del sandbox falle (ej. `org.postgresql.util.PSQLException`), extraer el mensaje ("syntax error at or near...").
*   Opción A: Limpiar el mensaje mediante Regex en el backend antes de devolver el Response.
*   Opción B: Enviar automáticamente ese error al servicio de Clawbot (Gemini) en el backend y devolver una pista corta generada por IA en lugar del stacktrace crudo.

---

## 🧩 Fase 2: Refactorización Frontend (Deuda Técnica)

### 1. Descomposición de Monolitos React
**Objetivo:** Dividir archivos gigantes para que el proyecto sea mantenible.
**Dónde:** Principalmente `frontend/src/pages/ExercisePage.js` (que pesa más de 140KB).
**Acciones:**
*   Extraer la lógica del editor a un componente independiente (`CodeEditorPanel.jsx`).
*   Extraer la lógica del chat de Clawbot a `ClawbotChat.jsx`.
*   Extraer los modales de victoria/recompensa.
*   Refactorizar el manejo de estado (si actualmente todo está en un `useState` gigante, evaluar mover la lógica compleja a Context API o un custom hook como `useExerciseState`).

### 2. Implementación de Lazy Loading (Optimización)
**Objetivo:** Mejorar el TTI (Time to Interactive) de la aplicación aislando dependencias pesadas.
**Dónde:** En el enrutador de React (`App.js` o similar) y dentro de las páginas pesadas.
**Acciones:**
*   Envolver `MonacoEditor` usando `React.lazy()` y `<Suspense>` para que el motor del editor (que pesa bastante) solo se cargue cuando el usuario entra a hacer un ejercicio.
*   Hacer lo mismo con la librería `Recharts` en el `DashboardPage.js`.

---

## ⚙️ Fase 3: Refactorización Backend (Arquitectura)

### 1. Descomposición de "God Objects" (Objetos Dios)
**Objetivo:** Respetar el Principio de Responsabilidad Única (SRP) en los servicios principales de Spring Boot.
**Dónde:** `EjercicioService.java` (105KB) y `DocenteService.java` (57KB).
**Acciones:**
*   Refactorizar `EjercicioService.java` dividiéndolo en varios servicios específicos:
    *   `SandboxExecutionService`: Exclusivo para inyectar credenciales y correr el query en el esquema aislado.
    *   `ExerciseValidationService`: Exclusivo para comparar el resultado esperado vs el obtenido.
    *   `RewardService`: Para asignar XP, rachas o monedas (si aplica) tras la victoria.

### 2. Caché para el Leaderboard
**Objetivo:** Proteger PostgreSQL de lecturas masivas y redundantes.
**Dónde:** `LeaderboardService.java` (o controlador asociado).
**Acciones:**
*   Habilitar `@EnableCaching` en la configuración de Spring Boot.
*   Decorar el método que consulta el top de usuarios con `@Cacheable(value = "leaderboard", key = "'global'")`.
*   Añadir una política de expiración de caché (Evict) cada 5 minutos o cuando cambie un puntaje significativo, para que la consulta en la BD no se ejecute en tiempo real por cada usuario que carga la página.
