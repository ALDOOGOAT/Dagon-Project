# 🛡️ Proyecto Dagon: SQL Learning Adventure

Plataforma educativa gamificada diseñada para enseñar SQL y diseño de bases de datos a través de una narrativa épica de un Gremio de Aventureros.

## 🚀 Estado Actual del Proyecto (Final de Sesión)

El software es plenamente funcional y cuenta con las siguientes capacidades avanzadas:

### 1. Sistema de Misiones Progresivo
- **Teoría Atómica:** La teoría ya no se entrega en bloques pesados. Ahora aparece de forma quirúrgica justo antes de cada ejercicio que introduce un concepto nuevo (SELECT, WHERE, JOIN, Agregaciones, etc.).
- **Mapa de Niveles Interactivo:** La cabecera incluye una "Línea de Misión" numerada. Los niveles completados muestran un check verde y permiten la navegación libre para repasar lecciones anteriores.

### 2. Motor de Validación Inteligente (Backend)
- **Auto-Visualización DML:** El usuario ya no necesita escribir `RETURNING *`. El sistema lo inyecta automáticamente en consultas `INSERT`, `UPDATE` y `DELETE` para mostrar el resultado de forma instantánea.
- **Validación Tolerante:** El comparador de resultados ignora diferencias de mayúsculas en columnas, diferencias de tipos (Integer vs Long) y, lo más importante, ignora los IDs autogenerados para evitar fallos por discrepancia de secuencias.

### 3. Constructor de Diagramas MER
- **Cardinalidad Real:** El constructor de diagramas ahora permite seleccionar el tipo de relación (1:1, 1:N, M:N) directamente en las líneas de conexión.
- **Validación de Arquitectura:** El backend valida no solo que existan las entidades, sino que las relaciones y sus cardinalidades sean las correctas según la misión.

### 4. Reto Final: La Posada de Dagon (Módulo 4)
- **Coherencia Narrativa:** Se eliminaron ejercicios duplicados. Ahora el módulo es un reto de 3 fases:
  1. **Fase 1:** Diseño del plano de la Posada (Entidades `huespedes`, `habitaciones` y la tabla puente `reservas`).
  2. **Fase 2:** Consulta de ocupación usando `JOIN`.
  3. **Fase 3:** Reporte de ingresos usando `SUM` y `GROUP BY`.
- **Datos Reales:** Las tablas de la posada ya existen en el Sandbox con datos de prueba, permitiendo que las consultas de las fases 2 y 3 funcionen perfectamente.

## 🔒 Seguridad (Sandbox)
- **Aislamiento Total:** El código del usuario se ejecuta en el esquema `lms_sandbox` bajo el rol `app_sandbox_user`.
- **Restricciones:** El usuario tiene prohibido usar comandos estructurales como `DROP`, `TRUNCATE` o acceder a los datos reales del sistema (`lms_core`).
- **Robustez:** Se ha mejorado el manejo de comentarios y puntos y coma en las consultas enviadas.

## 🛠️ Tecnologías Utilizadas
- **Frontend:** React, Framer Motion, Lucide Icons, ReactFlow.
- **Backend:** Java (Spring Boot), JDBC.
- **Base de Datos:** PostgreSQL 15+ (con soporte para esquemas y roles).

---
*Este proyecto está listo para su presentación escolar y despliegue en un dominio público.*
