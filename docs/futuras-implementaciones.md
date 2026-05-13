# Futuras Implementaciones de Dagon

Checklist paso a paso para mejorar el proyecto completo: backend, frontend, base de datos, experiencia educativa, seguridad y despliegue en servidor UNACH.

## Fase 1: Orden y Diagnóstico Inicial

- [x] Revisar el estado actual del repositorio con `git status`.
- [x] Confirmar que el backend levanta correctamente con `cd backend && ./mvnw spring-boot:run`.
- [x] Confirmar que el frontend levanta correctamente con `cd frontend && yarn start`.
- [x] Confirmar que el servicio MPI levanta correctamente con `cd mpi_service && ./run_mpi.sh`.
- [x] Ejecutar el build del frontend con `cd frontend && yarn build`.
- [x] Ejecutar pruebas del backend con `cd backend && ./mvnw test`.
- [x] Revisar archivos duplicados, temporales o de respaldo que no deban estar en el flujo principal.
- [x] Eliminar `console.log`, `System.out.println` y logs innecesarios de producción.
- [x] Documentar qué script SQL es la fuente oficial de la base de datos.
- [ ] Separar estructura limpia, datos semilla, datos de prueba y respaldos reales.

Nota Fase 1: el respaldo oficial actual quedó documentado en `scripts/flujo_bd_dagon.md`. La separación física del SQL sigue pendiente porque requiere dividir un respaldo sensible en estructura, semillas y datos reales sin romper restauraciones.

## Fase 2: Seguridad del Backend

- [x] Restringir CORS a dominios permitidos: localhost en desarrollo y dominio/IP UNACH en producción.
- [x] Eliminar `@CrossOrigin(origins = "*")` de los controladores.
- [x] Reemplazar `setAllowedOriginPatterns("*")` por una lista configurable desde propiedades o variables de entorno.
- [x] Proteger `/api/exercises/{id}/validate` con JWT.
- [x] Proteger `/api/clawbot/**` o agregar rate limit si se decide dejarlo público.
- [x] Obtener `usuarioId` desde el token JWT, no desde el body de la petición.
- [x] Crear DTOs seguros para respuestas de usuario.
- [x] Evitar devolver `passwordHash` en login, perfil, ranking y perfil público.
- [x] Validar que el usuario autenticado sea dueño del perfil antes de subir o cambiar foto.
- [x] Validar tamaño máximo y tipo real de imagen en subida de foto.
- [x] Guardar imágenes con nombre UUID, no con nombre original.
- [x] Normalizar rutas de archivos para evitar path traversal.
- [x] Agregar manejo global de errores con `@ControllerAdvice`.

Nota Fase 2: CORS quedó centralizado en `SecurityConfig` con `dagon.cors.allowed-origins`, por lo que en servidor UNACH se debe configurar el dominio/IP real mediante variable de entorno. `validate` y `clawbot` ya dependen de JWT; el frontend envía el token en ambos flujos.

## Fase 3: Correcciones y Refactor del Backend

- [x] Corregir la consulta de cursos completados en `ModuloService` agrupando correctamente la condición del usuario antes de `AND i.es_correcto = true`.
- [x] Unificar endpoints duplicados de ranking.
- [x] Evitar que controladores consulten datos sensibles directamente si la lógica pertenece a servicios.
- [x] Separar la lógica grande de `EjercicioService` en validadores por tipo de ejercicio.
- [x] Crear validadores específicos para `SELECT`, DML, DDL, diagramas, transacciones y ejercicios de práctica rápida.
- [x] Mantener el sandbox SQL con `search_path` controlado.
- [x] Mantener el rol `app_sandbox_user` sin permisos peligrosos.
- [x] Mejorar logs con logger formal.
- [x] Agregar pruebas para login, registro, perfil, progreso, ranking y validación.
- [x] Agregar pruebas enfocadas en seguridad del sandbox SQL.

Nota Fase 3: el endpoint legacy `/api/usuarios/ranking` ahora delega al mismo `LeaderboardService` que `/api/leaderboard`. `UsuarioController` quedó como capa HTTP y delega perfil, progreso e imagen a `UsuarioService`. `EjercicioService` conserva el flujo principal para no romper contratos, pero ahora usa `EjercicioValidationRouter`, validadores específicos por tipo y `SandboxSqlPolicy` para centralizar prevalidaciones, `search_path` y rol `app_sandbox_user`.

## Fase 4: Base de Datos

- [x] Definir un script SQL principal oficial para instalación limpia.
- [x] Mantener `spring.jpa.hibernate.ddl-auto=none`.
- [x] Crear scripts incrementales manuales para cambios futuros.
- [x] No introducir Flyway sin aprobación previa.
- [x] Agregar índice para `lms_core.intentos(id_usuario, id_ejercicio, es_correcto, fecha_intento)`.
- [x] Agregar índice para `lms_core.ejercicios_practicos(id_modulo, orden)`.
- [x] Agregar índice para `lms_core.modulos(id_curso, orden)`.
- [x] Revisar índice o constraint de `lms_core.usuarios(email)`.
- [x] Revisar constraints existentes de dificultad, orden, roles y relaciones.
- [x] Separar datos semilla de datos reales de usuarios.
- [x] Revisar respaldos con sandboxes de usuarios antes de reutilizarlos.
- [x] Agregar metadatos educativos por módulo: objetivos, prerequisitos y errores comunes.
- [x] Agregar metadatos para cinemáticas por módulo.

+Nota Fase 4: la instalación limpia quedó en `scripts/00_instalacion_limpia.sql`, las semillas seguras sin usuario
        s reales en `scripts/01_datos_semilla.sql`, los ejercicios educativos separados en `scripts/02_ejercicios_semilla
        .sql` y los cambios incrementales en `scripts/migraciones/2026_05_13_fase4_indices_metadatos.sql`. El respaldo `s
        cripts/respaldo_dagon_multiverso.sql` queda como referencia histórica porque mezcla usuarios, intentos y sandboxe
        s personales. La guía operativa quedó en `scripts/guia_bd_fase4.md`.


## Fase 5: Frontend Base

- [x] Centralizar llamadas HTTP en un solo cliente API.
- [x] Adjuntar JWT automáticamente en peticiones autenticadas.
- [x] Manejar errores `401` y `403` con mensajes claros y cierre de sesión cuando aplique.
- [x] Unificar uso de `fetch`, `axios`, `API_BASE` y `apiUrl`.
- [x] Dividir `ExercisePage.js` en componentes más pequeños.
- [x] Extraer editor SQL, panel de teoría, resultado de validación, Clawbot y controles de módulo.
- [x] Resolver warnings de hooks en componentes existentes.
- [x] Eliminar logs de depuración del frontend.
- [x] Revisar archivos duplicados o versiones temporales.
- [x] Mejorar estados de carga, error y vacío.
- [x] Revisar responsive en dashboard, ejercicios, ranking, perfil y certificados.

## Fase 6: Accesibilidad y Experiencia Visual

- [x] Mejorar contraste y contorno de botones superiores.
- [x] Agregar estados visibles de hover, focus y active.
- [x] Asegurar navegación por teclado en botones, modales y cinemáticas.
- [x] Agregar soporte para `prefers-reduced-motion`.
- [x] Evitar animaciones excesivas para usuarios principiantes.
- [x] Revisar que textos no se encimen en móvil.
- [x] Revisar que paneles importantes no dependan solo de color para entenderse.
- [x] Agregar controles claros de audio: volumen, mute y repetir.

## Fase 7: Cinemáticas Educativas

- [x] Mantener un motor único de cinemáticas.
- [x] Crear un guion personalizado para cada módulo.
- [x] Definir escenas por módulo: introducción, concepto clave, ejemplo visual, mini interacción y cierre.
- [x] Agregar narración por escena.
- [x] Agregar subtítulos obligatorios.
- [x] Agregar controles de pausar, continuar, repetir y saltar.
- [x] Guardar si el usuario ya vio la cinemática.
- [x] Permitir repetir cinemática desde cada módulo.
- [x] Relacionar cada cinemática con objetivos de aprendizaje.
- [x] Agregar ejemplos visuales pensados para estudiantes sin experiencia previa.
- [x] Revisar que las cinemáticas no bloqueen a usuarios que quieran practicar rápido.

## Fase 8: Gamificación y Aprendizaje

- [x] Crear insignias por tema dominado: `SELECT`, filtros, agregaciones, `JOIN`, DML, DDL y transacciones.
- [x] Mejorar sistema de rachas diarias.
- [x] Agregar recompensas por constancia, no solo por respuestas correctas.
- [x] Agregar pistas progresivas según número de intentos.
- [x] Crear práctica de refuerzo cuando un error se repite.
- [x] Medir dominio por concepto, no solo por ejercicio completado.
- [x] Agregar resumen al terminar cada módulo.
- [x] Agregar recomendaciones personalizadas según errores del alumno.
- [x] Diseñar presión positiva: perder debe significar repetir y aprender, no frustrarse.

## Fase 9: Clawbot e IA

- [x] Actualizar contexto de Clawbot para cubrir los 20 módulos.
- [x] Mover prompts largos a archivos o configuración versionada.
- [x] Evitar enviar soluciones completas a modelos externos cuando no sea necesario.
- [x] Crear prompts por tipo de error.
- [x] Agregar límites de uso por usuario.
- [x] Agregar fallback local cuando no haya API externa.
- [x] Medir preguntas frecuentes y errores comunes.
- [x] Mejorar respuestas para principiantes absolutos.
- [x] Mantener reglas socráticas: guiar sin dar la solución exacta.

## Fase 10: Panel Docente

- [x] Crear vista para profesor.
- [x] Mostrar progreso por alumno.
- [x] Mostrar ejercicios más fallados.
- [x] Mostrar módulos con mayor abandono.
- [x] Mostrar tiempo promedio por módulo.
- [x] Exportar progreso en CSV o PDF.
- [x] Permitir revisar intentos de alumnos.
- [x] Crear dashboard de analítica educativa.
- [x] Agregar filtros por grupo, módulo, curso y fecha.

Nota Fase 10: el panel docente vive en `/docente` y requiere `id_rol=2` (docente) o `id_rol=3` (admin) en la tabla `usuarios`. `JwtAuthenticationFilter` ahora carga el rol desde la DB y lo asigna como `GrantedAuthority`. El backend expone 7 endpoints bajo `/api/docente` (`resumen`, `alumnos`, `ejercicios-fallados`, `abandono-modulos`, `tiempo-promedio`, `intentos/{alumnoId}`, `exportar/csv`). Todos aceptan filtros opcionales por curso, modulo y rango de fechas. El frontend muestra graficas con Recharts, tablas ordenables, modal de intentos y exportacion CSV/PDF (via impresion del navegador). El boton "Panel Docente" aparece solo para docentes/admin en el DashboardPage.
---------------------------------------------------------------------------
## Fase 11: MPI Analytics

- [ ] Validar health check de MPI.
- [ ] Mejorar mensajes cuando MPI esté offline.
- [ ] Documentar cómo levantar MPI en local.
- [ ] Preparar MPI para servidor UNACH.
- [ ] Agregar métricas de rendimiento.
- [ ] Mostrar análisis útil para docentes, no solo datos técnicos.
- [ ] Agregar timeout y fallback claros desde backend.

## Fase 12: Despliegue en Servidor UNACH

- [ ] Crear configuración por ambiente: desarrollo y producción.
- [ ] Sacar secretos a variables de entorno.
- [ ] Preparar build de frontend para producción.
- [ ] Preparar backend para producción.
- [ ] Configurar PostgreSQL en servidor.
- [ ] Configurar servicio MPI en servidor.
- [ ] Configurar Nginx o proxy reverso.
- [ ] Activar HTTPS.
- [ ] Configurar dominio o IP institucional.
- [ ] Configurar CORS con el dominio real de UNACH.
- [ ] Configurar backups automáticos de base de datos.
- [ ] Crear guía de instalación para el profesor.
- [ ] Crear guía de recuperación ante fallos.

## Fase 13: Pruebas Finales

- [ ] Probar registro e inicio de sesión.
- [ ] Probar dashboard.
- [ ] Probar cinemáticas.
- [ ] Probar ejercicios de todos los módulos.
- [ ] Probar validación correcta e incorrecta.
- [ ] Probar Clawbot.
- [ ] Probar ranking.
- [ ] Probar certificados.
- [ ] Probar perfil e imagen.
- [ ] Probar práctica rápida.
- [ ] Probar analítica MPI.
- [ ] Probar responsive móvil.
- [ ] Probar despliegue completo desde cero.

## Fase 14: Pulido Final

- [ ] Revisar textos en español.
- [ ] Revisar ortografía.
- [ ] Revisar consistencia visual.
- [ ] Revisar sonidos y volumen.
- [ ] Revisar contraste de botones.
- [ ] Revisar que no haya datos sensibles en el repositorio.
- [ ] Revisar documentación final.
- [ ] Preparar presentación del proyecto.
- [ ] Preparar demo guiada para profesor y alumnos.

## Fase 15: Cierre y Mantenimiento

- [ ] Crear una lista de versiones del proyecto.
- [ ] Documentar cambios importantes por versión.
- [ ] Definir responsables de mantenimiento.
- [ ] Definir frecuencia de respaldos.
- [ ] Definir proceso para agregar nuevos módulos.
- [ ] Definir proceso para reportar errores.
- [ ] Definir proceso para restaurar la plataforma si falla.
- [ ] Mantener una copia estable lista para presentar.
