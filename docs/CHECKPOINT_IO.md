# Retoma IO multimateria — 5 octubre 2026

## Alcance autorizado

Continuar el plan aprobado en Claude: arquitectura, selector SQL/IO, IO I + II adaptada de programas UNACH, calculadora con pasos y gráficas, misiones, XP global y desbloqueo por materia. Migraciones exclusivamente locales. Sin commit, push ni despliegue.

## Estado al retomar

- Backend y frontend tenían cambios parciales sin terminar; se preservaron las modificaciones y eliminaciones previamente existentes, incluidas las staged en `para dilman/`.
- Solvers `frontend/src/lib/io/`: 14 suites y 131 pruebas pasan (`/tmp/dagon-io-solvers.log`).
- Docker: `dagon-local-pg` puerto 5435; `dagon-io-seed-pg` puerto 5434. **5433 pertenece a tendi-db**, no usarlo.
- `RTK.md` no está en la raíz; `CLAUDE.md` leído como guía vigente.

## Implementación terminada

- Backend: NUMERICO, catálogo/filtros, certificados, XP por materia, permisos de ejercicios y contexto servidor de Clawbot. Bloqueo transaccional evita doble XP concurrente. Sin solución esperada en DTO.
- Frontend: selector, tema IO, dashboard, calculadora con 8 pestañas y gráficas/pasos, misiones con teoría, tutor, XP/racha, ranking y graduación. Mathjs, KaTeX y gráficas lazy; no se agregaron pases de GPU costosos.
- Contenido original adaptado de fuentes UNACH: dos cursos, 15 módulos, 45 misiones, 1350 XP. Fuentes/límites en `IO_TEMARIO_UNACH.md`; no se presenta como réplica íntegra del programa oficial ni solver no lineal general.
- Corregido fallo real del húngaro (columnas con -1 podían terminar antes de asignar todas las filas): regresión por enumeración independiente de 40 matrices. También se contrastaron 160 PL por vértices y 60 transportes 2x3 por enumeración.
- Corregido fallo real de registro con rol backend limitado: aprovisionador NOLOGIN y helpers SECURITY DEFINER acotados a UUID, search_path fijo y EXECUTE público revocado. `2026_10_05_sandbox_provisionamiento.sql`, reflejado en 00, requiere administrador.
- CLAUDE.md y GEMINI.md actualizados; AGENTS.md existente revisado y preservado. No commit/push/deploy.

## Evidencia final — 5 octubre 2026

- Maven: **93 pruebas**, 0 fallos/errores, BUILD SUCCESS. `/tmp/dagon-backend-recovery.log`.
- Frontend: **151 pruebas en 18 suites**, todas pasan. `/tmp/dagon-final-frontend-tests.log`. Incluye 13 UI para formularios, todos los ejemplos principales de calculadora, misión errónea/correcta, racha y XP.
- `yarn build`: **Compiled successfully**, sin warnings de compilación. `/tmp/dagon-final-build.log` (Browserslist avisa de antigüedad de su catálogo).
- Cobertura medida antes de añadir UI: solvers principales alrededor del 94-100% statements; no se afirma cobertura global del proyecto (reporte global incluye pantallas sin tests).
- `git diff --check`: limpio.
- Base de actualización `dagon_io_retoma_20261005`: 00/01/02, migración materias, 03 **dos veces**, migración aprovisionamiento. Backend con import .env desactivado y URL confirmada `jdbc:postgresql://127.0.0.1:5434/dagon_io_retoma_20261005`, rol `app_backend_user`, sandbox `app_sandbox_user` y credenciales de prueba sintéticas.
- `scripts/verificar_io_local.py` contra API real 18080 + PostgreSQL local: registro/JWT, login-google410, bloqueo servidor, 45 aciertos, errores sin XP, repetición sin XP extra, dos envíos concurrentes sin doble premio, un acierto no completa un módulo, final 1350XP/15 módulos completos, ranking IO, certificados ambos cursos, separación de SQL, reset sandbox y SELECT SQL real correcto. `/tmp/dagon-io-api-check-final.log`.
- Segunda base limpia `dagon_io_instalacion_final_20261005`: 00 → 01 → 02 → 03 sin errores. Conteos **IO 2 cursos/15 módulos/45 ejercicios; SQL 4 cursos/22 módulos/101 ejercicios**. Logs `/tmp/dagon-final-{schema,seed1,seed2,seed3}.log`.
- Roles en ambas bases: backend **sin CREATE** en BD; sandbox **no miembro** del aprovisionador. Sandbox no puede leer `lms_core`; backend sí lee catálogo.
- Las bases y alumnos sintéticos quedan para inspección. El backend temporal se detuvo tras probarlo. No se modificaron .env del usuario ni se ejecutaron migraciones en Railway.

## Vista local abierta a petición del usuario

- Backend reiniciado en 18080; URL PostgreSQL local confirmada (5434/base de retoma), sin importar .env.
- Frontend dev en `http://127.0.0.1:3000`, variables API apuntan a 18080. HTTP frontend200 y API protegida403 comprobados.
- `xdg-open http://127.0.0.1:3000` finalizó con código0 para Chrome predeterminado. MCP Chrome sigue sin X server en su proceso y CUA no tiene superficies; no se afirma inspección visual ni medición GPU.
- Cuenta sintética local de vista: `demo.io@dagon.test` / `DemoIO2026!`; registro/login comprobado sin imprimir JWT. Se dejan servicios activos para que el usuario pruebe.

## Pendiente concreto / siguiente sesión

1. **Verificación visual en navegador real y GPU del usuario**, 390px y 1440px. Chrome MCP devolvió `Missing X server`; inventario CUA no encontró navegadores. No sustituir por SwiftShader para certificar rendimiento.
2. Reabrir con servicios locales aislados: verificar URL efectiva de BD antes de requests; nunca arrancar ciegamente con backend/.env (podría apuntar a Railway). El smoke requiere contenedor/base/puerto definidos en su encabezado.
3. Comprobar login → materias → IO → gráfica Wyndor (2,6), Z36 → misión error/acierto → certificado → volver a SQL; overflow, consola, foco/teclado y paleta.
4. Las migraciones y semilla están preparadas, **no aplicadas en producción**. Cualquier despliegue posterior requiere autorización del usuario y configuración revisada.
5. Mantener deuda fuera del plan: editor docente IO, cinemáticas IO, refactor DriverManager/regex y monolito ExercisePage. Secretos previamente en Git requieren rotación antes de despliegue; no se rotaron cuentas remotas.
