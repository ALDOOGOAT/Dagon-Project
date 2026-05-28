# Plan de Evolución Dagon: Vanguardia y Especialización SQL

## Resumen Estratégico
Tras evaluar la viabilidad técnica y el impacto en la identidad del producto, se descarta la generalización (LMS Multi-Academia) a favor de la **hiper-especialización**. 

El objetivo es convertir a Dagon en la plataforma educativa más avanzada y gamificada para el aprendizaje de Bases de Datos, SQL y optimización de datos, destacándose por características que ninguna otra plataforma (como HackerRank o LeetCode) ofrece actualmente en el ámbito educativo.

## Ejes de Implementación (En orden de prioridad e impacto)

### 1. El Analista de Rendimiento (Integración IA + EXPLAIN ANALYZE)
*   **Concepto:** Enseñar no solo a escribir queries que funcionen, sino queries *eficientes*. 
*   **Funcionamiento:** 
    *   Al enviar una consulta correcta, el backend ejecuta `EXPLAIN (FORMAT JSON) tu_query` en PostgreSQL.
    *   Se envía el JSON del plan de ejecución a la IA (Clawbot).
    *   Clawbot devuelve un análisis: *"Hiciste un escaneo secuencial (Seq Scan) que costó X. Si usamos un índice, bajaría a Y"*.
*   **Requisitos:** 
    *   Backend: Modificar el flujo de validación para capturar el `EXPLAIN` de queries exitosas.
    *   IA Prompting: Ajustar los prompts de Clawbot para que entiendan y expliquen los planes de ejecución JSON de PostgreSQL a un nivel didáctico.

### 2. Gamificación Competitiva: "SQL Golf" y Batallas de Eficiencia
*   **Concepto:** Crear e-sports de bases de datos.
*   **Funcionamiento:**
    *   La tabla de `intentos` ahora guarda métricas adicionales: `costo_ejecucion` (del motor SQL), `tiempo_ms`, y `longitud_caracteres`.
    *   Se crea un **Leaderboard por Ejercicio** en el Frontend.
    *   Categorías del Leaderboard: "Más Eficiente" (menor costo/tiempo) y "Más Corto / SQL Golf" (menos caracteres usados).
*   **Impacto:** Multiplica el *engagement* y la rejugabilidad. Los usuarios repetirán ejercicios básicos solo para ganarle el primer lugar a sus compañeros optimizando su código.

### 3. Modo "Detective de Datos" (Entornos Big Data)
*   **Concepto:** Superar la limitación de enseñar con tablas de 5 filas y simular entornos reales y masivos.
*   **Funcionamiento:**
    *   Se introduce una nueva categoría/curso llamado "Misterios de Dagon" (Ej. Resolver un fraude bancario analizando logs).
    *   Se usan scripts con la función `generate_series()` de PostgreSQL para inyectar 1,000,000+ de registros simulados en el sandbox.
    *   Las queries ineficientes de los estudiantes fallarán por timeout (simulando la caída de un servidor), forzándolos a usar índices (previamente enseñados) o técnicas avanzadas (CTEs, Window Functions) para tener éxito.

### 4. Laboratorio de Modelado (ERD Inverso en Tiempo Real)
*   **Concepto:** Hacer tangibles los conceptos de diseño y DDL.
*   **Funcionamiento:**
    *   El usuario escribe sentencias `CREATE TABLE` y `ALTER TABLE`.
    *   El frontend parsea este código SQL o el backend extrae el esquema resultante, y usa librerías como *React Flow* para dibujar automáticamente el Diagrama Entidad-Relación (ERD).
    *   También permite la ingeniería inversa: el usuario mueve cajas y relaciones en la UI, y Dagon genera el código SQL correspondiente.

## Conclusión de Viabilidad
Estas implementaciones son **altamente factibles** porque capitalizan la arquitectura existente de Dagon:
*   El sandbox SQL ya aísla y ejecuta código de forma segura.
*   El backend ya se comunica con APIs de LLMs (Gemini/Groq/Ollama).
*   El sistema de gamificación (rachas, XP, usuarios) ya está construido; solo falta añadir la capa de competencia directa y las métricas de rendimiento.