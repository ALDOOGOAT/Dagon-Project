# Plan Dagon Multi-Academia

## Resumen

- Dificultad: media-alta. Meter más filas en cursos, modulos y ejercicios_practicos es fácil; hacerlo profesional implica desacoplar Dagon de SQL como único tipo de ejercicio.
- Objetivo: convertir Dagon en una plataforma de academias separadas: PostgreSQL actual, Matemáticas y Física como pilotos, y base extensible para cualquier materia futura.
- Modelo de producto: catálogo oficial curado + docentes creando módulos/niveles para sus grupos. La publicación global queda controlada por admin/curación.

## Cambios Clave

- Base de datos:
    - Crear lms_core.academias con slug, nombre, materia, descripcion, icono, tema_visual, estado, orden.
    - Extender cursos con id_academia, slug, descripcion, estado_publicacion, tema_visual, creado_por.
    - Extender ejercicios_practicos con tipo_validacion, contenido jsonb, solucion_esperada jsonb, rubrica jsonb; mantener query_maestra solo para SQL y hacerla compatible con ejercicios no SQL.
    - Extender intentos con respuesta_enviada jsonb, tipo_validacion y detalle_resultado jsonb, conservando query_enviada para compatibilidad.
- Backend:
    - Agregar APIs de catálogo: /api/academias, /api/academias/{slug}, /api/cursos/{id}/modulos.
    - Mantener /api/modulos y /api/exercises/{levelId} funcionando para no romper el frontend actual.
    - Convertir EjercicioValidationRouter en motor general: SQL usa sandbox; Matemáticas/Física usan validadores deterministas.
    - Tipos iniciales: SQL_SELECT, SQL_DML, SQL_DDL, SQL_TRANSACCION, DIAGRAMA, TEXTUAL, QUIZ, NUMERICO, FORMULA, PROCEDIMIENTO.
    - La IA queda como tutor/retroalimentación, no como juez principal de calificación.
- Frontend:
    - Dashboard pasa a “Catálogo de Academias”, con academias visualmente separadas pero compartiendo login, XP, racha, ranking y certificados.
    - ExercisePage se divide por renderizadores: SQL editor, drag/drop SQL, diagrama, quiz, respuesta numérica, fórmula/procedimiento.
    - LevelTheory deja de depender solo de IDs de módulos PostgreSQL y se vuelve contenido por academia/curso/módulo.
    - DocentePage agrega creador condicional de ejercicios: no obliga queryMaestra; muestra campos según tipo de validación.

## Pilotos Iniciales

- PostgreSQL actual se migra a Academia PostgreSQL sin cambiar su progreso ni ejercicios.
- Nueva Academia Matemáticas: curso piloto “Álgebra Universitaria”, con módulos de fundamentos, ecuaciones y funciones.
- Nueva Academia Física: curso piloto “Física General I”, con módulos de unidades, cinemática y fuerzas.
- V1 no ejecuta código arbitrario ni álgebra simbólica abierta; valida con respuestas numéricas, tolerancias, unidades, opciones, pasos esperados y rúbricas configuradas.

## Pruebas

- Migración idempotente en copia local: academias, cursos existentes, módulos, ejercicios e intentos previos intactos.
- Backend: validar que SQL sigue usando sandbox y que QUIZ, NUMERICO, FORMULA y TEXTUAL no pasan por sandbox.
- Frontend: catálogo de academias, entrada a PostgreSQL, Matemáticas y Física, render correcto por tipo de ejercicio, creación docente por grupo.
- Producción: backup antes de migrar, ddl-auto=none intacto, yarn build frontend y ./mvnw test backend.

## Supuestos

- No se introduce Flyway/Liquibase sin pedirlo antes; las migraciones van en scripts/migraciones/.
- Las academias son visualmente separadas, pero comparten núcleo de usuario, progreso, XP, docentes y certificados.
- Los docentes pueden crear contenido para grupos; publicar contenido global requiere admin/curación.
- El objetivo inicial es plataforma multi-materia sólida, no marketplace abierto.