# Investigación de Operaciones: adaptación Dagon

Consulta de fuentes: 5 de octubre de 2026. La materia reúne dos programas universitarios publicados por la UNACH. Los nombres IO I/IO II, el reparto en 15 módulos y las misiones son una adaptación didáctica de Dagon, no una reproducción del orden oficial ni una certificación de la universidad.

## Fuentes primarias

- [Investigación de Operaciones, Gestión Turística, quinto semestre](https://fca.unach.mx/images/programas_lgt/5to_sem/INVESTIGACION_DE_OPERACIONE.pdf). Se comprobó el PDF completo: introducción, programación lineal, proyectos, inventarios, espera y Markov. Incluye método gráfico, simplex, transporte, asignación, CPM/PERT, faltantes, producción, descuentos y revisión periódica.
- [Investigación de Operaciones II, Sistemas Computacionales, clave 1983](https://negocios.unach.mx/planlsc/5/Investigacion%20de%20operaciones%20II.pdf). El índice del buscador recuperó el contenido del PDF oficial: carrera, quinto semestre, prerrequisito IO I, sensibilidad, programación no lineal (optimización restringida/no restringida y programación cuadrática), inventarios, colas y Markov. La descarga directa agotó el tiempo; la verificación temática se hizo mediante el texto indexado del mismo documento. El curso implementa ejemplos acotados de no lineal; no cubre todavía un solver general de programación cuadrática o de varias variables.
- [Plan de Sistemas Computacionales, Facultad de Negocios Campus IV](https://negocios.unach.mx/index.php/licenciatura-en-sistemas-computacionales/). Confirma la presencia de Investigación de Operaciones II en quinto semestre.

## Correspondencia de módulos

| Curso Dagon | Orden | Tema | Correspondencia |
|---|---:|---|---|
| IO I | 1 | Introducción y decisiones | Gestión Turística, unidad I |
| IO I | 2 | Formulación de PL | Gestión Turística, unidad II |
| IO I | 3 | Método gráfico | Gestión Turística, unidad II |
| IO I | 4 | Simplex máximo | Gestión Turística, unidad II |
| IO I | 5 | Minimización y artificiales | Gestión Turística, unidad II |
| IO I | 6 | Dualidad y sensibilidad | IO II, análisis de sensibilidad; dualidad como base didáctica |
| IO I | 7 | Transporte y MODI | Gestión Turística, unidad II; MODI amplía el procedimiento |
| IO I | 8 | Asignación | Gestión Turística, unidad II |
| IO II | 1 | CPM | Gestión Turística, unidad III |
| IO II | 2 | PERT | Gestión Turística, unidad III |
| IO II | 3 | Inventarios deterministas | Gestión Turística, unidad IV |
| IO II | 4 | Incertidumbre y período fijo | Gestión Turística, unidad IV |
| IO II | 5 | M/M/1 y M/M/s | Gestión Turística, unidad V; varios servidores como ampliación |
| IO II | 6 | Markov | Gestión Turística, unidad VI |
| IO II | 7 | No lineal | IO II, unidad III; métodos concretos adaptados al alcance del solver |

## Contrato de contenido

`frontend/src/data/ioTheory.js` exporta `ioTheory['io-i'][orden]` y `ioTheory['io-ii'][orden]`, y `getIoTheory(tituloOClaveCurso, orden)`. El contenido se vincula por curso y orden, nunca por un identificador fijo de BD. Cada módulo incluye objetivos, explicaciones, errores comunes y fórmulas originales.

`scripts/03_io_semilla.sql` genera dos cursos, 15 módulos y 45 misiones `NUMERICO`, tres por módulo. Cada misión admite un objeto `{clave: valor}`. `configuracion_extra` guarda campos, opciones, respuestas servidor, tolerancia y `semilla_clave` estable; las respuestas esperadas deben permanecer fuera del DTO público. Valores decimales: tolerancia absoluta 0.001 y relativa 0.001. Las probabilidades se expresan de 0 a 1 y las tasas de colas por hora.

Las misiones progresan de dificultad 2 a 4, con 90 XP disponibles por módulo y 1350 en total. Los umbrales crecen 30 XP por módulo sobre la misma materia IO, de 0 a 210, reiniciando en cero al comenzar cada curso; siempre quedan por debajo de la XP obtenible en módulos anteriores del curso. No son una calificación académica equivalente a la evaluación institucional.

## Verificación y carga local

Los resultados de PL, sensibilidad, minimización, transporte, asignación, inventarios, colas, PERT, Markov y no lineal se calcularon llamando los solvers puros existentes; varios resultados se comprobaron además con fórmulas directas (EOQ 200, Wyndor 36, Markov 0.6/0.4 y M/M/1 L=2). Introducción y formulación son actividades conceptuales originales; CPM básico usa sumas y recorridos de redes pequeñas.

Orden: instalación 00 → datos 01 → ejercicios SQL 02 → semilla IO 03. En una BD previa, aplicar primero `migraciones/2026_10_05_materias_io.sql`. La semilla usa transacción, bloquea escrituras concurrentes durante la carga y sincroniza las secuencias hacia delante para evitar colisiones con los IDs explícitos de semillas previas. Reejecutarla actualiza sus propias misiones mediante `semilla_clave`, sin borrar intentos ni misiones docentes.

No se ejecutó este archivo contra una BD durante la preparación del contenido. La prueba de carga y segunda ejecución idempotente debe hacerse exclusivamente en la PostgreSQL local autorizada, nunca Railway.
