# Cambios de optimizacion Dagon - 2026-05-23

## Objetivo

Mejorar velocidad real y percibida sin romper los flujos de alumno, docente y admin. La optimizacion se enfoco en reducir llamadas iniciales, evitar cargas pesadas del panel docente y dejar componentes reutilizables para UI consistente.

## Backend

- Se agrego `GET /api/dashboard/resumen` para agrupar perfil, stats esenciales, modulos y top del leaderboard en una sola llamada autenticada.
- Se agrego medicion de tiempos por request con header `X-Dagon-Response-Time-Ms` y log de peticiones lentas sin exponer tokens ni payloads.
- Se agrego `GET /api/docente/tablero` como carga inicial liviana del panel docente.
- Se agregaron endpoints docentes bajo demanda:
  - `GET /api/docente/calificaciones/resumen`
  - `GET /api/docente/calificaciones/ejercicios?page=&size=&idCurso=&idModulo=&alumnoId=`
- Se mantuvo `GET /api/docente/calificaciones` por compatibilidad.
- Se consolido el resumen de estadisticas de usuario para reducir roundtrips en dashboard.
- El leaderboard ahora permite limite server-side para no traer mas filas de las necesarias en el dashboard.

## Base de datos

- Se creo `scripts/migraciones/20260523_01_respuesta_agil_indices.sql`.
- La migracion usa `CREATE INDEX CONCURRENTLY` y no incluye `BEGIN/COMMIT`.
- Se aplico correctamente contra la BD configurada en `backend/.env`; PostgreSQL devolvio `CREATE INDEX` para los 8 indices.

## Frontend

- `apiClient` ahora tiene cache GET con TTL corto, deduplicacion de requests en vuelo e invalidacion automatica al hacer mutaciones.
- Dashboard consume `GET /api/dashboard/resumen` en vez de disparar stats, modulos y leaderboard por separado.
- Dashboard conserva fallback automatico a `/api/usuarios/{id}/stats`, `/api/modulos` y `/api/leaderboard` si el backend activo todavia no tiene el endpoint agregado.
- Panel docente consume `GET /api/docente/tablero` para la carga inicial.
- Panel docente conserva fallback automatico a `/api/docente/resumen` si el backend activo todavia no tiene el endpoint agregado.
- Calificaciones docentes se cargan solo cuando se abre la vista de notas y el detalle por ejercicio se pagina.
- Calificaciones conservan fallback automatico a `/api/docente/calificaciones` si los endpoints paginados todavia no estan disponibles.
- Se agrego `DagonSelect`, basado en Radix Select, para evitar selects nativos con fondo blanco y contraste inconsistente.
- Se agregaron patrones reutilizables en `dagon-panel.jsx` para tarjetas metricas, empty states y bloques de carga.
- Las rutas pesadas ahora usan `React.lazy` y `Suspense`; el bundle principal bajo de forma considerable en build.
- Practica rapida se carga bajo demanda cuando se abre.
- ExercisePage usa cache para ejercicios, enfoca el resultado correcto/advertencia en pantalla y prefetch silencioso del siguiente modulo al cerrar una mision final.
- AuthContext pinta con usuario cacheado y refresca perfil en segundo plano para que la recarga se sienta mas rapida.

## Verificacion

- Backend: `cd backend && ./mvnw test`
  - Resultado: 24 tests, 0 fallas.
- Frontend build: `cd frontend && yarn build`
  - Resultado: compilacion exitosa.
- Frontend test: `cd frontend && yarn test --watchAll=false --passWithNoTests`
  - Resultado: sin tests encontrados, salida 0 por `--passWithNoTests`.

## Notas

- Se mantiene `ddl-auto=none`.
- No se eliminaron endpoints existentes.
- Las practicas `RAPIDA` siguen fuera de calificaciones oficiales.
- Las mutaciones docentes invalidan cache para evitar datos visualmente viejos.

## Correccion de estabilidad visual - 2026-05-23

- Dashboard ya no depende del perfil cacheado para pintar XP, nivel y racha; usa el resumen fresco del backend y conserva esos datos aunque el perfil publico se recargue despues.
- La seleccion de curso del dashboard se normaliza antes de renderizar. Si `localStorage` tenia una senda antigua, vacia o invalida, ahora se elige automaticamente el primer curso real con modulos.
- `GET /api/levels` dejo de devolver el placeholder historico de un solo nivel y ahora lee los 20 modulos reales desde `lms_core.modulos`, respetando bloqueo por XP y desbloqueo docente/admin.
- `obtenerPerfilSeguro` ahora tolera identificadores UUID y emails para no romper sesiones antiguas.
- El filtro JWT ahora acepta sesiones con `sub` UUID o email y convierte internamente a UUID canonico antes de ejecutar controllers.
- Se corrigio la causa del dashboard vacio: `cachedGet` ya no reutiliza peticiones en vuelo cuando vienen con `AbortSignal`, evitando que React en desarrollo reutilice una promesa abortada y deje sin ejecutar `/api/dashboard/resumen`.
- Se reiniciaron los servidores locales y se valido:
  - `GET /api/dashboard/resumen`: 2 cursos, modulos `[16, 4]`, ranking disponible.
  - `GET /api/dashboard/resumen` con token antiguo basado en email: stats, modulos y ranking disponibles.
  - `GET /api/levels`: 20 niveles reales.
  - Frontend local: `http://localhost:3000` responde correctamente.
  - Prueba visual con Chrome headless en `/dashboard`: XP, ranking y 16 modulos visibles; sin "Ruta en Construcción".
