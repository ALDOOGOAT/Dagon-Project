# Cambios rol docente y grupos

## Resumen funcional

- El rol `docente` y `admin` desbloquea todos los módulos desde `/api/modulos` sin depender del XP.
- Los ejercicios enviados por `/api/exercises/{levelId}` incluyen `expectedQuery` únicamente para usuarios con rol docente o admin.
- La validación de ejercicios privados ahora revisa acceso real: global, creador del ejercicio, alumno inscrito al grupo o admin.
- El panel `/docente` ahora funciona como centro de aula: inicio guiado, grupos, códigos de acceso, alumnos del grupo, creación de ejercicios, calificaciones y analítica opcional.
- El registro soporta tres experiencias: aprendiz libre, alumno con código de grupo y docente con clave institucional.
- Cuando una query se resuelve correctamente, la pantalla de ejercicios mueve el foco al resultado y a la explicación, sin obligar al usuario a buscarla al final.

## Cambios de base de datos

Aplicar la migración:

```sql
scripts/migraciones/20260517_01_docente_grupos.sql
```

Además de las tablas que ya agregaba, ahora `lms_core.grupos_docente` tiene `codigo_acceso` único para inscripción controlada de alumnos. El docente puede compartir ese código con su grupo; el alumno lo ingresa al registrarse.

## Variable requerida para registrar docentes

Para que alguien pueda crear una cuenta docente desde registro, define:

```bash
DAGON_DOCENTE_REGISTRATION_CODE=tu_clave_institucional
```

Si la variable no existe, el backend rechaza altas docentes públicas. Esto evita que cualquier usuario se autoasigne el rol de docente.

## Calificaciones docentes

No se agregó una migración nueva para calificaciones automáticas. El endpoint:

```http
GET /api/docente/calificaciones?idCurso={idCurso}&idModulo={idModulo}
```

usa los intentos ya registrados en `lms_core.intentos` y respeta el mismo alcance docente: un docente solo ve alumnos de sus grupos activos; admin ve el conjunto completo.

El criterio actual queda así:

- Ejercicio: `10` si el alumno resolvió correctamente al menos una vez; `0` si está pendiente.
- Módulo: porcentaje de ejercicios resueltos correctamente dentro del módulo, convertido a escala `0-10`.
- Curso: porcentaje de ejercicios resueltos correctamente dentro del curso, convertido a escala `0-10`.
- Las prácticas relámpago (`tipo_mision = 'RAPIDA'`) quedan fuera de estas calificaciones oficiales. Siguen contando para entrenamiento, XP y racha, pero no para nota docente.

La vista `/docente` muestra estas notas en la pestaña `Notas`, separadas por curso, módulo y ejercicio, con una cabecera visual que aclara que la evaluación oficial no incluye relámpagos. Este criterio es simple para arrancar con evaluación universitaria y se puede reemplazar después por ponderaciones institucionales si la UNACH pide pesos distintos por actividad.

## Tutorial docente

Al registrar una cuenta con rol `docente`, el frontend guarda `dagon_docente_tutorial_pending=true` y abre una guía dentro del panel docente. La guía explica las diferencias del rol: módulos desbloqueados, query esperada visible, grupos controlados y evaluación por escala `0-10`. Para usuarios normales o alumnos no aparece este tutorial docente.

## Archivos principales modificados

- `backend/src/main/java/com/dagon/backend/controller/UsuarioController.java`
- `backend/src/main/java/com/dagon/backend/service/UsuarioService.java`
- `backend/src/main/java/com/dagon/backend/service/ModuloService.java`
- `backend/src/main/java/com/dagon/backend/service/EjercicioService.java`
- `backend/src/main/java/com/dagon/backend/service/DocenteService.java`
- `backend/src/main/java/com/dagon/backend/dto/EjercicioDTO.java`
- `backend/src/main/java/com/dagon/backend/dto/DocenteDTO.java`
- `frontend/src/pages/LoginPage.js`
- `frontend/src/pages/DocentePage.js`
- `frontend/src/pages/ExercisePage.js`
- `frontend/src/services/apiClient.js`
- `scripts/migraciones/20260517_01_docente_grupos.sql`

## Flujo esperado

1. El docente se registra con la clave institucional o un admin le asigna el rol en DB.
2. El docente entra al panel, crea un grupo y obtiene su código.
3. El alumno se registra como `Grupo` usando ese código.
4. El docente ve únicamente alumnos inscritos en sus grupos.
5. El docente crea ejercicios para un grupo o los guarda como banco privado.
6. El alumno ve ejercicios globales y los ejercicios del grupo al que pertenece.
7. El docente puede entrar a cualquier módulo y ver la query esperada como guía pedagógica.
8. El docente revisa `Notas` para ver calificación por ejercicio, módulo y curso.
