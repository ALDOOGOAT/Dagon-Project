# 🤖 Memoria Técnica y Guía para Agentes - Proyecto Dagon

Este documento registra las mejoras críticas realizadas en la sesión del 20 de abril de 2026. Cualquier agente de IA debe leer esto antes de proponer cambios para mantener la integridad del sistema.

## 🕹️ Sistema de Juego y Navegación
- **Navegación Libre:** Se implementó un selector de niveles en el Header (`ExercisePage.js`). Los niveles se desbloquean dinámicamente.
- **Teoría Inteligente:** La función `handleLevelJump` detecta si el nivel de destino tiene una llave de teoría asociada mediante `getSubTopicKey`. Si es así, activa `setShowTheory(true)` automáticamente.
- **Reset de Estado:** Al saltar entre niveles, se limpian los resultados de ejecución, el código del editor y los mensajes de error para evitar "arrastrar" datos de misiones anteriores.

## 🏗️ Motor de Validación (Backend)
- **Normalización de Datos:** El comparador de DML (`compararResultadosDML`) en `EjercicioService.java` convierte todos los valores a `String` antes de comparar. Esto evita errores por diferencias entre `Integer`, `Long` o `Decimal`.
- **Ignora IDs Secuenciales:** El validador elimina cualquier columna que empiece por `id_` o se llame `id` al comparar resultados de inserción. Esto permite que el usuario gane aunque su ID autogenerado sea diferente al del maestro.
- **Inyección DML:** El sistema detecta comandos `INSERT`, `UPDATE` y `DELETE` y les añade `RETURNING *;` de forma invisible. El usuario NO debe ser instruido a escribir `RETURNING`.
- **Validación de Diagramas:** Ahora soporta `relaciones_requeridas` con validación de `cardinality`. El backend busca coincidencias entre los nombres de las entidades conectadas y el tipo de relación seleccionado.

## 📐 Constructor de Diagramas (MER)
- **Cardinalidad Selectable:** Las líneas de conexión (`RelationshipEdge`) tienen un selector flotante para elegir `1:1`, `1:N` o `M:N`.
- **Persistencia:** La cardinalidad se guarda en el objeto `data` de cada `edge` de ReactFlow y se envía al backend como JSON.

## 🏠 Reto Final: La Posada de Dagon (Módulo 4)
Se ha reformado el módulo para que sea un flujo funcional de 3 fases:
1. **Fase 1 (ID 25):** Diseño del plano con las tablas `huespedes`, `habitaciones` y la tabla puente `reservas`.
2. **Fase 2 (ID 26):** Consulta de ocupación. Requiere un `JOIN` triple entre las 3 tablas.
3. **Fase 3 (ID 27):** Reporte de ingresos. Requiere `SUM(precio_noche)` y `GROUP BY`.

**IMPORTANTE:** Las tablas de la posada ya están creadas y pobladas con datos de prueba en el esquema `lms_sandbox` de la base de datos para asegurar que las consultas SQL de los niveles 2 y 3 devuelvan datos válidos.

## 📜 Reglas de Oro de la Narrativa
- **Tono:** Mentor épico (Dagon). Nunca usar lenguaje puramente académico.
- **Analogías:**
  - `reservas` = El Libro de Registro (Tabla Puente).
  - IDs = Etiquetas de pertenencia.
  - WHERE = El Colador Mágico.
  - JOIN = El Puente de Datos.

## 🛡️ Seguridad
- Todo el código del usuario DEBE ejecutarse bajo el rol `app_sandbox_user`.
- Nunca dar permisos de `DROP` o `TRUNCATE` a este rol.
- El `search_path` debe ser siempre `lms_sandbox`.

---
*Este archivo es la fuente de verdad sobre el estado actual de la lógica de negocio y pedagógica.*
