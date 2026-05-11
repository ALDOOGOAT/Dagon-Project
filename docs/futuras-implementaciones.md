# Futuras Implementaciones de Dagon

Checklist paso a paso para mejorar el proyecto completo: backend, frontend, base de datos, experiencia educativa, seguridad y despliegue en servidor UNACH.

## Fase 1: Orden y Diagnóstico Inicial

- [ ] Revisar el estado actual del repositorio con `git status`.
- [ ] Confirmar que el backend levanta correctamente con `cd backend && ./mvnw spring-boot:run`.
- [ ] Confirmar que el frontend levanta correctamente con `cd frontend && yarn start`.
- [ ] Confirmar que el servicio MPI levanta correctamente con `cd mpi_service && ./run_mpi.sh`.
- [ ] Ejecutar el build del frontend con `cd frontend && yarn build`.
- [ ] Ejecutar pruebas del backend con `cd backend && ./mvnw test`.
- [ ] Revisar archivos duplicados, temporales o de respaldo que no deban estar en el flujo principal.
- [ ] Eliminar `console.log`, `System.out.println` y logs innecesarios de producción.
- [ ] Documentar qué script SQL es la fuente oficial de la base de datos.
- [ ] Separar estructura limpia, datos semilla, datos de prueba y respaldos reales.

## Fase 2: Seguridad del Backend

- [ ] Restringir CORS a dominios permitidos: localhost en desarrollo y dominio/IP UNACH en producción.
- [ ] Eliminar `@CrossOrigin(origins = "*")` de los controladores.
- [ ] Reemplazar `setAllowedOriginPatterns("*")` por una lista configurable desde propiedades o variables de entorno.
- [ ] Proteger `/api/exercises/{id}/validate` con JWT.
- [ ] Proteger `/api/clawbot/**` o agregar rate limit si se decide dejarlo público.
- [ ] Obtener `usuarioId` desde el token JWT, no desde el body de la petición.
- [ ] Crear DTOs seguros para respuestas de usuario.
- [ ] Evitar devolver `passwordHash` en login, perfil, ranking y perfil público.
- [ ] Validar que el usuario autenticado sea dueño del perfil antes de subir o cambiar foto.
- [ ] Validar tamaño máximo y tipo real de imagen en subida de foto.
- [ ] Guardar imágenes con nombre UUID, no con nombre original.
- [ ] Normalizar rutas de archivos para evitar path traversal.
- [ ] Agregar manejo global de errores con `@ControllerAdvice`.

## Fase 3: Correcciones y Refactor del Backend

- [ ] Corregir la consulta de cursos completados en `ModuloService` agrupando correctamente la condición del usuario antes de `AND i.es_correcto = true`.
- [ ] Unificar endpoints duplicados de ranking.
- [ ] Evitar que controladores consulten datos sensibles directamente si la lógica pertenece a servicios.
- [ ] Separar la lógica grande de `EjercicioService` en validadores por tipo de ejercicio.
- [ ] Crear validadores específicos para `SELECT`, DML, DDL, diagramas, transacciones y ejercicios de práctica rápida.
- [ ] Mantener el sandbox SQL con `search_path` controlado.
- [ ] Mantener el rol `app_sandbox_user` sin permisos peligrosos.
- [ ] Mejorar logs con logger formal.
- [ ] Agregar pruebas para login, registro, perfil, progreso, ranking y validación.
- [ ] Agregar pruebas enfocadas en seguridad del sandbox SQL.

## Fase 4: Base de Datos

- [ ] Definir un script SQL principal oficial para instalación limpia.
- [ ] Mantener `spring.jpa.hibernate.ddl-auto=none`.
- [ ] Crear scripts incrementales manuales para cambios futuros.
- [ ] No introducir Flyway sin aprobación previa.
- [ ] Agregar índice para `lms_core.intentos(id_usuario, id_ejercicio, es_correcto, fecha_intento)`.
- [ ] Agregar índice para `lms_core.ejercicios_practicos(id_modulo, orden)`.
- [ ] Agregar índice para `lms_core.modulos(id_curso, orden)`.
- [ ] Revisar índice o constraint de `lms_core.usuarios(email)`.
- [ ] Revisar constraints existentes de dificultad, orden, roles y relaciones.
- [ ] Separar datos semilla de datos reales de usuarios.
- [ ] Revisar respaldos con sandboxes de usuarios antes de reutilizarlos.
- [ ] Agregar metadatos educativos por módulo: objetivos, prerequisitos y errores comunes.
- [ ] Agregar metadatos para cinemáticas por módulo.

## Fase 5: Frontend Base

- [ ] Centralizar llamadas HTTP en un solo cliente API.
- [ ] Adjuntar JWT automáticamente en peticiones autenticadas.
- [ ] Manejar errores `401` y `403` con mensajes claros y cierre de sesión cuando aplique.
- [ ] Unificar uso de `fetch`, `axios`, `API_BASE` y `apiUrl`.
- [ ] Dividir `ExercisePage.js` en componentes más pequeños.
- [ ] Extraer editor SQL, panel de teoría, resultado de validación, Clawbot y controles de módulo.
- [ ] Resolver warnings de hooks en componentes existentes.
- [ ] Eliminar logs de depuración del frontend.
- [ ] Revisar archivos duplicados o versiones temporales.
- [ ] Mejorar estados de carga, error y vacío.
- [ ] Revisar responsive en dashboard, ejercicios, ranking, perfil y certificados.

## Fase 6: Accesibilidad y Experiencia Visual

- [ ] Mejorar contraste y contorno de botones superiores.
- [ ] Agregar estados visibles de hover, focus y active.
- [ ] Asegurar navegación por teclado en botones, modales y cinemáticas.
- [ ] Agregar soporte para `prefers-reduced-motion`.
- [ ] Evitar animaciones excesivas para usuarios principiantes.
- [ ] Revisar que textos no se encimen en móvil.
- [ ] Revisar que paneles importantes no dependan solo de color para entenderse.
- [ ] Agregar controles claros de audio: volumen, mute y repetir.

## Fase 7: Cinemáticas Educativas

- [ ] Mantener un motor único de cinemáticas.
- [ ] Crear un guion personalizado para cada módulo.
- [ ] Definir escenas por módulo: introducción, concepto clave, ejemplo visual, mini interacción y cierre.
- [ ] Agregar narración por escena.
- [ ] Agregar subtítulos obligatorios.
- [ ] Agregar controles de pausar, continuar, repetir y saltar.
- [ ] Guardar si el usuario ya vio la cinemática.
- [ ] Permitir repetir cinemática desde cada módulo.
- [ ] Relacionar cada cinemática con objetivos de aprendizaje.
- [ ] Agregar ejemplos visuales pensados para estudiantes sin experiencia previa.
- [ ] Revisar que las cinemáticas no bloqueen a usuarios que quieran practicar rápido.

## Fase 8: Gamificación y Aprendizaje

- [ ] Crear insignias por tema dominado: `SELECT`, filtros, agregaciones, `JOIN`, DML, DDL y transacciones.
- [ ] Mejorar sistema de rachas diarias.
- [ ] Agregar recompensas por constancia, no solo por respuestas correctas.
- [ ] Agregar pistas progresivas según número de intentos.
- [ ] Crear práctica de refuerzo cuando un error se repite.
- [ ] Medir dominio por concepto, no solo por ejercicio completado.
- [ ] Agregar resumen al terminar cada módulo.
- [ ] Agregar recomendaciones personalizadas según errores del alumno.
- [ ] Diseñar presión positiva: perder debe significar repetir y aprender, no frustrarse.

## Fase 9: Clawbot e IA

- [ ] Actualizar contexto de Clawbot para cubrir los 20 módulos.
- [ ] Mover prompts largos a archivos o configuración versionada.
- [ ] Evitar enviar soluciones completas a modelos externos cuando no sea necesario.
- [ ] Crear prompts por tipo de error.
- [ ] Agregar límites de uso por usuario.
- [ ] Agregar fallback local cuando no haya API externa.
- [ ] Medir preguntas frecuentes y errores comunes.
- [ ] Mejorar respuestas para principiantes absolutos.
- [ ] Mantener reglas socráticas: guiar sin dar la solución exacta.

## Fase 10: Panel Docente

- [ ] Crear vista para profesor.
- [ ] Mostrar progreso por alumno.
- [ ] Mostrar ejercicios más fallados.
- [ ] Mostrar módulos con mayor abandono.
- [ ] Mostrar tiempo promedio por módulo.
- [ ] Exportar progreso en CSV o PDF.
- [ ] Permitir revisar intentos de alumnos.
- [ ] Crear dashboard de analítica educativa.
- [ ] Agregar filtros por grupo, módulo, curso y fecha.

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
