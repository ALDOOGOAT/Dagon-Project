# Relevo para Claude: Investigación de Operaciones y despliegue

**Actualizado: 5 de octubre de 2026.** Repositorio: `/home/aldo/Descargas/Dagon_Project/Dagon-Project`, rama `main`.

## Estado al retomar

La experiencia local de IO está implementada: escribir el enunciado, extraer variables y datos, revisar o editar el modelo, resolver con algoritmos deterministas y mostrar procedimiento, resultados y gráficas. Se comprobó tanto el fallback local como un recorrido completo con Groq real. También existen las materias SQL/IO, misiones y progreso.

La última petición del usuario fue: **"genera un .md para uqe claude lo lea despues de donde vamos, que le falta por hacer y proximas tareas para despliegue y ante suq eeso mejora en el front"**. Las mejoras de frontend de esta petición ya están realizadas y verificadas; las tareas siguientes son preparar y comprobar el despliegue.

**No se ha desplegado, hecho commit ni push. Las migraciones se probaron solamente en PostgreSQL local.** No se inspeccionaron las cuentas/proyectos actuales de Vercel o Railway. El estado local no demuestra que producción esté preparada.

## Qué leer primero

1. `AGENTS.md` y `CLAUDE.md`: instrucciones y arquitectura. Preservar `AGENTS.md`; algunos datos históricos de ese archivo sobre secretos, CORS y URLs quedaron superados por el código y `CLAUDE.md`.
2. Este relevo: pendientes actuales y orden de trabajo.
3. `docs/CONTRATO_IO_ENUNCIADO.md`: contrato compartido entre API, editor y solvers.
4. `docs/CHECKPOINT_IO_ENUNCIADO.md`: integración real, errores corregidos y evidencia del proveedor.
5. `docs/IO_TEMARIO_UNACH.md` y `frontend/src/lib/io/README.md`: contenido académico y alcance matemático.

`docs/CHECKPOINT_IO.md` conserva la primera retoma de Claude. Sus conteos iniciales y su pendiente de QA visual son históricos: después sí se hizo QA en Chrome con GPU Intel. `INSTRUCCIONES_DEPLOY.md` necesita actualizarse antes de usarlo: omite IO, contiene configuración anterior y no cubre los bloqueos descritos aquí. Si hay diferencias de estado, contrastarlas con este relevo y el código actual.

## Trabajo completado

### Plataforma multimateria

- Selector de materia después del login; IO conserva glass, Inter/JetBrains Mono y la mascota, con paleta ámbar/cian y cuadrícula.
- Dos cursos de IO, 15 módulos y 45 misiones NUMERICO; semilla con 1350 XP disponibles. XP global, desbloqueo y ranking filtrados por materia.
- Teoría, misiones, tolerancias numéricas, fracciones, feedback, XP/racha y certificados. Los requisitos de finalización excluyen ejercicios privados y práctica RAPIDA.
- Filtros por materia en API/dashboard y tutor Clawbot adaptado a IO. El servidor comprueba ejercicio, materia y permisos; no entrega respuestas NUMERICO esperadas al cliente.
- Arreglos de arquitectura y seguridad: `/login-google` desactivado con 410, secreto JWT obligatorio, eliminación de valores reales por defecto, normalización de tokens HSL y limpieza de componentes muertos.
- Corrección del registro/provisionamiento del sandbox mediante helpers de permisos limitados. Hay migración administrativa separada; no convertir la cuenta runtime del backend en administradora de BD.

### Enunciado → modelo → cálculo

- `POST /api/io/interpretar` autenticado y limitado: devuelve `listo`, `incompleto` o `no_soportado`, con fuente, variables, evidencia literal, supuestos y preguntas.
- Parser local conservador para patrones explícitos de producción mesas/sillas, EOQ, colas y modelos JSON. Si no basta, intenta proveedores configurados. No resuelve cualquier enunciado arbitrario sin condiciones.
- Groq real comprobado con `openai/gpt-oss-20b`, `User-Agent: DagonIO/1.0` y JSON Schema estricto. Un único discriminador `tipo`; `metodo` obligatorio como texto en el esquema y validado contra métodos permitidos en servidor. No volver a introducir dos discriminadores: el proveedor lo rechazó.
- Compatibilidad Spring Boot 4/Jackson 3 corregida: el controller convierte JsonNode Jackson 2 a Map/List antes de responder. Hay prueba con el serializador real; devolver directamente aquel JsonNode producía flags internos en HTTP.
- `frontend/src/lib/io/desdeEnunciado.js` valida tipos, límites y fórmulas y llama a los solvers puros. La IA extrae el modelo; el resultado matemático procede de los algoritmos. Editar el modelo permite recalcular sin otra llamada IA.
- Ocho familias y 19 métodos declarados: PL/simplex/gráfico, transporte, asignación, CPM/PERT, inventarios, colas, Markov y no lineal. Tests de solvers y contrastes independientes cubrieron también un fallo corregido del método húngaro.
- Estados infactible/no acotado/cola inestable y entradas incompletas se muestran sin inventar un óptimo. PL entera/binaria queda fuera de alcance. Lagrange encuentra un punto estacionario regular, no certifica un óptimo global; PERT usa aproximación normal; estacionariedad de Markov no garantiza convergencia.
- **Gemini generación y Ollama siguen sin comprobarse.** El listado de modelos Gemini respondió, pero las pruebas de generación dieron 404/timeout; Ollama permanece desactivado. No afirmar que todos los proveedores están conectados.

### Última mejora de frontend, ya terminada

- Pestañas de calculadora en una fila desplazable en móvil, para dejar visible el enunciado sin varias filas de navegación.
- Navegación por pasos con foco: Planteamiento, Modelo y Solución. Accesos “Revisar modelo” y “Ver solución” al terminar el cálculo.
- “Cancelar análisis” conserva el texto, aborta la solicitud y descarta respuestas tardías. Editar el texto mantiene la protección contra resultados obsoletos.
- Ctrl/Cmd + Enter envía el enunciado, con guarda para composición de texto.
- Nombres de familias/métodos en español y etiquetas de parámetros según el modelo: P no significa lo mismo en producción y en Markov; a/b tampoco en redes y no lineal.
- Targets y foco visibles, sin animaciones o dependencias nuevas. Se mantiene el estilo de Dagon.

Archivos de esta última mejora: `frontend/src/components/io/TabEnunciado.jsx`, `EditorModelo.jsx`, `TabEnunciado.test.jsx` y `frontend/src/index.css`. El frontend nuevo de IO incluye más archivos todavía sin seguimiento en Git: no confundirlos con temporales que se pueden borrar.

## Evidencia y límites de la verificación

Todas las pruebas siguientes son locales del 5 de octubre de 2026. Los registros de `/tmp` son temporales; guardar evidencia nueva si desaparecen.

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Frontend después de la última mejora | **218 pruebas / 21 suites**, todas pasan | `/tmp/dagon-front-relevo-tests.log` |
| Build frontend después de la última mejora | `yarn build` correcto | `/tmp/dagon-front-relevo-build.log` |
| Backend en la integración anterior de este mismo día | **118 pruebas**, todas pasan; backend sin cambios en esta última mejora | `/tmp/dagon-backend-recovery.log` |
| API + solvers reales en la integración anterior | **50 comprobaciones** sobre ocho familias y estados de error | `/tmp/dagon-enunciado-api.log` |
| Chrome visible, última mejora | 390/768/1440, sin overflow horizontal ni errores JS en el recorrido probado; 0 violaciones axe automáticas en `.io-enunciado` | `/tmp/dagon-front-relevo-qa.json` |
| Interacción real | Ctrl+Enter → Wyndor Z=36; accesos al modelo/solución desplazan y enfocan la región correcta | Capturas `/tmp/dagon-front-relevo-resuelto-{390,768,1440}.png` |
| Recorrido IA real anterior | Transporte natural → Groq → coeficientes correctos → solver → costo óptimo **75** en UI | `/tmp/dagon-enunciado-proveedor.json`, `/tmp/dagon-transporte-ia-{390,1440}.png` |

Ejemplos comprobados: Wyndor `(x1,x2)=(2,6), Z=36`; EOQ demanda 10000 / pedido 50 / mantenimiento 25 → Q = 200; M/M/1 llegada 4/h y servicio 6/h → L = 2, W = 0.5 h. Transporte IA: oferta 15/25, demanda 20/20 y costos `[[6,2],[1,5]]` → costo 75.

El navegador utiliza **ANGLE Intel Mesa RPL-P**, no SwiftShader. Última muestra visible de requestAnimationFrame: aproximadamente 85 FPS durante 1.4 s; es una muestra breve, no un benchmark de toda la aplicación. Axe automático no certifica accesibilidad completa. No hay baseline para afirmar regresión visual. No se repitió en esta última mejora un recorrido completo de todas las páginas SQL/IO o del panel docente.

## Entorno local para continuar

- Frontend: http://localhost:3000/io/calculadora, proceso Node PID 1699118 al registrar este relevo.
- Backend: `http://127.0.0.1:18080`, Java PID 1759841. Log: `/tmp/dagon-preview-io-ready.log`.
- PostgreSQL: `127.0.0.1:5434`, contenedor `dagon-io-seed-pg5434`, base `dagon_io_retoma_20261005`. También se probó instalación limpia en `dagon_io_instalacion_final_20261005`.
- Credenciales de demo **solamente locales**: `demo.io@dagon.test` / `DemoIO2026!`. No crear esa cuenta con esa contraseña en producción. El login actual recibe `passwordHash` como nombre del campo, junto a `email`.
- Node 20.20.2, Java 21.0.12.1 y Yarn1.22.22 en esta verificación. No usar npm para regenerar el lockfile.
- Chrome se abrió con perfil temporal `/tmp/dagon-io-browser-20261005`, CDP 9223 y pantalla real. Su estado es volátil: comprobarlo antes de reutilizarlo. El problema inicial de DISPLAY del MCP no impidió el QA posterior con CDP local.

Los PIDs/servicios pueden cambiar tras reiniciar. Comprobaciones de lectura desde la raíz:

```bash
git status --short
ss -ltnp | rg ':3000|:18080|:5434'
docker ps --format '{{.Names}}\t{{.Ports}}'
rg 'Database JDBC URL' /tmp/dagon-preview-io-ready.log
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/io/calculadora
```

**No arrancar backend importando ciegamente `backend/.env`: puede apuntar a Railway.** El preview desactiva ese import mediante `SPRING_CONFIG_IMPORT` y configura explícitamente URL JDBC local, cuenta backend, sandbox y JWT de prueba. Solo se cargaron las claves de los proveedores, sin importar la configuración de BD de ese archivo. Confirmar el JDBC local antes de ejecutar pruebas que escriben. No tocar el servicio ajeno de PostgreSQL 5433.

## Próximas tareas antes de desplegar, en orden

### 1. Revisar el diff y preparar una versión reproducible

- Preservar los cambios del usuario/Claude/Codex. Hay eliminaciones ya staged en `para dilman/`; no restaurarlas ni incluirlas por accidente sin revisar su intención. No usar reset/clean.
- Revisar todos los archivos nuevos, documentación, migraciones y lockfile. Confirmar que no se publican `.env`, dumps, backups o claves. No imprimir valores de secretos.
- Repetir checks si se cambia código. Elegir una versión de Node compatible con el proveedor y comprobar instalación/build con esa misma versión; Node 20 es evidencia local, no garantía de configuración cloud.
- Actualizar `INSTRUCCIONES_DEPLOY.md` con el procedimiento nuevo y el resultado real de cada paso. El cierre del flujo local en el checkpoint anterior no significa que estos pasos de producción ya estén hechos.

### 2. Base de datos y secretos: preparar primero un ensayo aislado

- Verificar el esquema/versiones actuales del destino mediante lectura autorizada. Preparar backup y restauración comprobable, y ensayar en una copia aislada antes de migrar datos reales.
- Migraciones nuevas: `scripts/migraciones/2026_10_05_materias_io.sql` y `scripts/migraciones/2026_10_05_sandbox_provisionamiento.sql`. Contenido: `scripts/03_io_semilla.sql`. Revisar dependencias con las migraciones anteriores del destino; no asumir que su estado es idéntico al local.
- Para **base vacía local**, la instalación 00→01→02→03 fue probada. `00_instalacion_limpia.sql` es instalación inicial, no un procedimiento para volver a correr indiscriminadamente sobre producción. Mantener `ddl-auto=none`; no introducir Flyway ni `ddl-auto=update` sin autorización.
- La migración del provisionamiento requiere cuenta administradora para crear/asignar roles y helpers. Runtime backend limitado; sandbox sin acceso a `lms_core` y sin heredar la cuenta provisionadora. Consultar seguridad-bd cuando se modifiquen permisos. Helpers SECURITY DEFINER con `search_path` fijo y EXECUTE revocado a PUBLIC: conservar estas restricciones.
- Comprobar en el ensayo: dos materias, dos cursos IO, 15 módulos, 45 misiones; SQL conservado, login/registro/provisionamiento, aislamiento sandbox y recompensas sin duplicación.
- Hay antecedentes de secretos publicados en historial Git: contraseña BD, JWT y contraseña sandbox. **Su rotación no se hizo en esta sesión**. Preparar rotación y actualizar variables del servidor antes de liberar, teniendo en cuenta la invalidación de sesiones JWT.
- La decisión previa del usuario fue aplicar migraciones **solo local, nunca Railway**. Este relevo no autoriza migraciones de producción; dejar el ensayo y los comandos concretos revisables antes de solicitar una autorización nueva para ese destino.

### 3. Backend Railway: puerto, salud y arranque

- Aún no hay Dockerfile/railway.toml para este backend; los que existen pertenecen a `mpi_service`. Preparar configuración Java 21, build Maven y arranque del JAR correctos para `backend/`.
- **Puerto pendiente:** `application.properties` no configura `server.port` desde `PORT`. Añadir y probar una configuración como `server.port=${PORT:8080}`, o un arranque equivalente, que escuche el puerto asignado. Railway usa `PORT` en sus healthchecks; documentar el puerto efectivo y comprobarlo en logs. [Railway: healthchecks](https://docs.railway.com/deployments/healthchecks).
- **Salud pendiente:** no hay Actuator ni endpoint de salud público. La API protegida puede responder 403 y no sirve como probe de disponibilidad 200. Preparar un endpoint mínimo o probe apropiado, probado bajo la configuración de seguridad final y sin exponer datos internos.
- Configurar root directory `backend` en el servicio monorepo y confirmar por separado la ubicación de cualquier archivo de configuración Railway; esta no se deduce automáticamente del root directory. [Railway: monorepos](https://docs.railway.com/deployments/monorepo).
- Variables del backend: datasource JDBC/credenciales, `DAGON_SANDBOX_*`, `DAGON_JWT_SECRET`, `DAGON_CORS_ALLOWED_ORIGINS`, claves y ajustes IA de `backend/.env.example`. Comprobar el mapeo real de las variables del servicio; que Railway tenga una BD no demuestra permisos o schema instalados.
- MPI es opcional: no bloquear LMS/calculadora si ese servicio no se despliega; verificar el comportamiento con MPI apagado.

### 4. Archivos subidos y CORS

- `UsuarioService.obtenerDirectorioUploads()` escribe en `user.dir/uploads`. Preparar volumen persistente o almacenamiento de objetos y el path/configuración correspondiente. No se verificó persistencia remota. Probar que avatar/archivo sobreviva a un redeploy.
- CORS actual se configura con **`DAGON_CORS_ALLOWED_ORIGINS`**, no el antiguo `FRONTEND_URL`. Registrar los orígenes HTTPS reales de staging/producción y decidir cuáles previews están autorizados. Probar OPTIONS, login y llamadas autenticadas desde el frontend desplegado.

### 5. Frontend Vercel

- Preparar proyecto con raíz `frontend`, instalación Yarn usando su lockfile, `yarn build` y salida `build`. No desplegar el repositorio entero como si la raíz fuese el frontend. [Vercel: configuración de proyectos](https://vercel.com/docs/project-configuration).
- Configurar `REACT_APP_API_URL` con la URL pública HTTPS **raíz** del backend; los paths de API ya añaden `/api`. `REACT_APP_BACKEND_URL` sirve de fallback. Ambas se incorporan al build; verificar la URL compilada de Preview y Production. No poner claves IA, JWT o contraseña BD en variables del bundle.
- Preparar rewrites de SPA para rutas como `/materias`, `/io/calculadora` y `/io/mision/:id`. No hay `frontend/vercel.json` todavía. Probar acceso directo y recarga en cada ruta; la documentación oficial contempla el catch-all hacia `/index.html`. [Vercel: vercel.json y rewrites](https://vercel.com/docs/project-configuration/vercel-json).
- Validar frontend contra backend staging por HTTPS antes de activar producción. Actualizar dominio en CORS y rebuild cuando cambie la URL API.

### 6. IA y pruebas del candidato desplegable

- Claves solo en backend. Validar Groq en staging con el modelo disponible, su esquema estricto, cuota y timeouts. Un éxito local anterior no prueba disponibilidad/cuota futura.
- Gemini/Ollama: o probar generación real con sus modelos/configuración finales, o mantener su estado explícito como no verificado/desactivado. Probar proveedor caído/cuota agotada y mensajes de fallback sin inventar un resultado.
- Recorrer login→selector→IO→misión→respuesta incorrecta/correcta→XP/racha→graduación/certificado, ranking por materia y cambio a SQL. Incluir registro nuevo, aislamiento sandbox, logout y token vencido. Probar regresión del curso SQL existente y panel docente.
- En calculadora: Wyndor Z = 36, edición→recalcular, EOQ Q = 200, colas, transporte IA con costo 75, incompleto, infactible/no acotado, cancelar y cambiar de pestaña durante extracción. Revisar variables, unidades, procedimientos y gráficas, no solo el número final.
- Chrome visible con GPU real a 390/768/1440, teclado y foco, consola y red. Revisar rutas HTTPS directas, errores CORS/401, persistencia de archivos y ausencia de secretos en assets/logs.

### 7. Liberación y recuperación

- Dejar revisables diff/configuración, resultados del ensayo, migraciones concretas, backup/restauración y plan de rollback. Definir qué versión/frontend/backend/schema se libera y cómo volver a una versión compatible.
- El usuario pidió aquí tareas **para** despliegue. No convertir esta petición en autorización de commit/push, publicación o migración remota. Solicitar autorización final cuando el candidato esté preparado y las acciones/destino sean concretos; la restricción previa de BD local sigue vigente.
- Después de una publicación autorizada, comprobar por HTTP público y navegador lo que realmente quedó activo y registrar URL, versión y resultado. No dar un deploy por confirmado porque pasó el build local.

## Comandos de verificación que ya existen

Ejecutar cada bloque desde su carpeta indicada. Si se cambia backend, aislar primero su configuración de BD; no copiar el comando Maven sobre una configuración que apunte a Railway.

```bash
# Desde frontend/
CI=true yarn test --watchAll=false --runInBand
yarn build
```

```bash
# Desde backend/, con configuración de pruebas/local aislada
./mvnw test
```

```bash
# Desde la raíz, API local 18080 con demo existente
python3 scripts/verificar_io_enunciado.py
# Añade una llamada de aceptación al proveedor real; requiere clave/cuota
python3 scripts/verificar_io_enunciado.py --con-ia
git diff --check
```

`scripts/verificar_io_enunciado.py` no modifica BD, pero con proveedores activos algunos casos ambiguos pueden intentar IA incluso sin `--con-ia`. `scripts/verificar_io_local.py` sí crea/usa usuarios e intentos para probar misiones/XP: ejecutar solo en la base local aislada especificada en su encabezado. No cambiar la constante del destino para apuntar a producción como atajo de QA.

## Pendientes posteriores, fuera del bloqueo de despliegue

- Creador de ejercicios IO para docentes: el creador existente sigue orientado a SQL.
- Cinemáticas específicas por módulo IO.
- Refactors grandes del sandbox a DataSource, revisión de regex y división de monolitos: deuda separada, no mezclar con una liberación sin pruebas específicas.
- Extensiones matemáticas como programación entera/binaria u optimización global: no están implementadas; ampliar contrato, solvers, UI y pruebas antes de anunciar soporte.

## Primera acción de Claude al volver

Comprobar `git status`, servicios y documentos; no reimplementar el flujo de enunciado que ya funciona. Retomar las tareas 1–3 preparando cambios y un ensayo local, después configurar candidato staging/producción según la autorización disponible. Mantener checkpoints pequeños con **hecho / comprobado / pendiente / siguiente paso** y no borrar evidencia previa.

Prompt de continuación sugerido:

> Lee AGENTS.md, CLAUDE.md y RELEVO_CLAUDE_IO_DEPLOY.md. Retoma los pendientes de preparación para Vercel/Railway desde el punto 1. Preserva los cambios existentes y deja checkpoints. El frontend y la resolución de IO ya funcionan en local; verifica antes de repetir. No hagas migraciones Railway, commit/push ni publicación sin autorización para ese destino. Prepara primero el candidato, el ensayo y la evidencia.
