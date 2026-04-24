# AGENTS.md - Proyecto Dagon

## Stack Real (verificar en CLAUDE.md)

| Capa | Tech |
|------|------|
| Frontend | React 19 + Craco, Monaco Editor, Tailwind, @xyflow/react |
| Backend | Spring Boot 4.0.3 (Java 21), Spring Security + JWT |
| DB | PostgreSQL - schemas `lms_core`, `lms_sandbox` |

## Motor de Validación SQL (`EjercicioService.java`)

- **Normalización**: `compararResultadosDML` convierte valores a `String` antes de comparar
- **IDs secuenciales**: Ignora columnas `id_` o `id` al comparar inserciones
- **Inyección DML**: Añade `RETURNING *;` automáticamente a `INSERT`/`UPDATE`/`DELETE`

## Constructor de Diagramas MER

- Las líneas de conexión (`RelationshipEdge`) tienen selector de cardinalidad (`1:1`, `1:N`, `M:N`)
- La cardinalidad se guarda en el objeto `data` del edge de ReactFlow

## Reto Final: La Posada (Módulo 4, niveles 25-27)

1. **Nivel 25**: Diseño plano con `huespedes`, `habitaciones`, `reservas`
2. **Nivel 26**: Consulta ocupación - JOIN triple
3. **Nivel 27**: Reporte ingresos - `SUM(precio_noche)` + `GROUP BY`

Tablas ya existen pobladas en `lms_sandbox`.

## Seguridad

- Código usuario ejecuta bajo rol `app_sandbox_user`
- Sin permisos `DROP`/`TRUNCATE`
- `search_path` debe ser `lms_sandbox`

## Narrativa

- Tono: Mentor épico (Dagon), nunca puramente académico
- Analogías: `reservas` = Libro de Registro, `WHERE` = Colador Mágico, `JOIN` = Puente de Datos

---

> Para arquitectura, comandos y rutas: ver `CLAUDE.md`