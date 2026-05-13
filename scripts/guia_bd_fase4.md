# Guia de Base de Datos - Fase 4

Este documento define la ruta limpia de base de datos para Dagon despues de revisar `scripts/respaldo_dagon_multiverso.sql`.

## Fuente Oficial

La instalacion limpia ya no debe partir directamente del respaldo bruto. El respaldo mezcla estructura, datos semilla, usuarios reales, intentos, auditoria historica y esquemas `sandbox_usuario_<uuid>`.

Orden oficial para ambientes nuevos:

1. `scripts/00_instalacion_limpia.sql`
2. `scripts/01_datos_semilla.sql`
3. `scripts/02_ejercicios_semilla.sql`
4. `scripts/migraciones/*.sql` en orden cronologico

`scripts/respaldo_dagon_multiverso.sql` queda como respaldo historico y referencia de recuperacion, no como script principal de instalacion.

El script limpio crea `lms_sandbox_template` y `lms_sandbox`. El primero es el molde para clonar sandboxes por usuario; el segundo queda como sandbox compartido de compatibilidad para flujos antiguos o pruebas sin usuario.

## Configuracion JPA

Se reviso `backend/src/main/resources/application.properties` y se mantiene:

```properties
spring.jpa.hibernate.ddl-auto=none
```

Hibernate no debe crear ni modificar tablas. Los cambios estructurales se hacen por scripts SQL manuales.

## Politica de Migraciones

- Cada cambio futuro de BD debe ir en `scripts/migraciones/`.
- El nombre recomendado es `YYYY_MM_DD_descripcion_corta.sql`.
- Las migraciones deben ser idempotentes cuando PostgreSQL lo permita.
- No se introduce Flyway ni Liquibase sin aprobacion previa.
- Antes de ejecutar en produccion, respaldar la BD y probar en copia local.

## Indices Agregados

La fase 4 define estos indices:

```sql
CREATE INDEX idx_intentos_usuario_ejercicio_correcto_fecha
    ON lms_core.intentos (id_usuario, id_ejercicio, es_correcto, fecha_intento DESC);

CREATE INDEX idx_ejercicios_modulo_orden
    ON lms_core.ejercicios_practicos (id_modulo, orden);

CREATE INDEX idx_modulos_curso_orden
    ON lms_core.modulos (id_curso, orden);

CREATE UNIQUE INDEX idx_usuarios_email_lower_unique
    ON lms_core.usuarios (lower(email::text));
```

Razon:

- `intentos`: acelera progreso, ranking, certificados, perfil y validacion de ejercicios ya resueltos.
- `ejercicios_practicos`: acelera carga de ejercicios por modulo.
- `modulos`: acelera carga ordenada de modulos por curso.
- `usuarios(email)`: ya existe `usuarios_email_key`; el indice `lower(email)` evita duplicados por mayusculas/minusculas.

## Constraints Revisadas

Existentes en el respaldo:

- `usuarios_email_key`: correo unico.
- `modulos_id_curso_orden_key`: orden unico por curso.
- `modulos_orden_check`: orden mayor a cero.
- `ejercicios_practicos_dificultad_check`: dificultad de 1 a 5.
- FKs principales entre cursos, modulos, ejercicios, usuarios e intentos.
- FKs del sandbox template en reservas hacia huespedes y habitaciones.

Refuerzos definidos en scripts nuevos:

- `xp_requerida >= 0`.
- `objetivos`, `prerequisitos` y `errores_comunes` deben ser arreglos JSON.
- `cinematica_config` debe ser objeto JSON.
- `ejercicios_practicos.orden > 0`.
- `intentos.tiempo_ms` nulo o mayor/igual a cero.
- Roles semilla permitidos: `alumno`, `docente`, `admin`.

## Separacion de Datos

Separacion actual:

- Estructura limpia: `scripts/00_instalacion_limpia.sql`.
- Datos semilla seguros: `scripts/01_datos_semilla.sql`.
- Ejercicios educativos seguros: `scripts/02_ejercicios_semilla.sql`.
- Cambios futuros: `scripts/migraciones/`.
- Respaldo historico con datos reales: `scripts/respaldo_dagon_multiverso.sql`.

No se deben copiar a semillas:

- Filas de `lms_core.usuarios`.
- Filas de `lms_core.intentos`.
- Filas de `lms_core.auditoria_logs` generadas por uso real.
- Esquemas `sandbox_usuario_<uuid>`.
- Objetos creados por alumnos dentro de sandboxes personales.

## Sandboxes

El respaldo contiene esquemas `sandbox_usuario_<uuid>` con tablas, funciones, triggers y objetos extra creados durante practicas. Para instalacion limpia se usan `lms_sandbox_template` y `lms_sandbox`; no se importan sandboxes personales.

Flujo correcto:

1. `lms_sandbox_template` guarda las tablas iniciales de practica.
2. `lms_sandbox` guarda la misma semilla para compatibilidad y pruebas sin usuario.
3. Al registrar un usuario, `trg_desatar_multiverso` ejecuta `fn_crear_multiverso()`.
4. La funcion crea `sandbox_usuario_<uuid>`.
5. La funcion clona tablas y datos desde `lms_sandbox_template`.
6. El backend valida ejercicios usando el search path controlado hacia el sandbox del usuario.

## Metadatos Educativos

La fase 4 agrega campos a `lms_core.modulos`:

- `objetivos`: lista JSON de objetivos de aprendizaje.
- `prerequisitos`: lista JSON de conocimientos previos.
- `errores_comunes`: lista JSON de errores esperados para retroalimentacion.
- `cinematica_config`: objeto JSON con slug, duracion y escenas base para cinematica educativa.

Estos campos son base para fases posteriores de UX, cinemáticas y recomendaciones personalizadas.

## Checklist Antes de Reutilizar un Respaldo

- [ ] Confirmar si contiene usuarios reales.
- [ ] Confirmar si contiene `password_hash`.
- [ ] Confirmar si contiene intentos o respuestas enviadas.
- [ ] Confirmar si contiene esquemas `sandbox_usuario_<uuid>`.
- [ ] Separar estructura de semillas.
- [ ] Eliminar o anonimizar datos personales.
- [ ] Probar restauracion en una BD local desechable.
- [ ] Ejecutar migraciones manuales pendientes.
- [ ] Validar que `spring.jpa.hibernate.ddl-auto=none` siga activo.
