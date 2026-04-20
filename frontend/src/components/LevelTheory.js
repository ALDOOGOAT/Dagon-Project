import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { DagonMascot } from './DagonMascot';
import {
  ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, Rocket,
  Library, Grid3x3, MessageSquare, Search, Filter, ArrowDownNarrowWide,
  GitMerge, Database, Shield, Zap, PenLine, Trash2, Plus, Link2
} from 'lucide-react';

/* ============================================================
   CONTENIDO POR SUBTEMA — La Senda del Arquitecto
   Clave: "modulo-grupo" (ej: "1-0" = módulo 1, grupo 0)
   Cada grupo de 3 ejercicios tiene su propia teoría.
   ============================================================ */

const SUB_TOPICS = {

  /* ──────────────────────────────────────────────
     MÓDULO 1 — Conociendo a la Bestia
     ────────────────────────────────────────────── */

  "1-0": {
    title: "SELECT — Tu Primer Comando",
    subtitle: "Aprendiendo a leer datos",
    color: "from-cyan-500 to-blue-700",
    slides: [
      {
        type: "hero",
        emoji: <Library className="w-12 h-12" />,
        headline: "Bienvenido al Archivero Infinito",
        lead: "Una base de datos es un archivero digital masivo y perfectamente organizado. Toda la información se guarda en tablas, como hojas de cálculo pero mucho más poderosas.",
        bullets: [
          "Las Tablas organizan la información en filas y columnas.",
          "Las Columnas definen el tipo de dato (nombre, nivel, clase...).",
          "Las Filas son los registros reales — cada aventurero es una fila.",
          "SQL (Structured Query Language) es el idioma para hablar con la base de datos.",
        ],
      },
      {
        type: "table",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "Tu primera tabla: aventureros",
        lead: "Así se ve la información estructurada. Esta tabla tiene 4 columnas y cada fila es un héroe distinto del gremio.",
        tableTitle: "aventureros",
        columns: ["id_aventurero", "nombre", "clase", "nivel"],
        rows: [
          [1, "Loya", "Caballero", 15],
          [2, "Zoe", "Maga Suprema", 20],
          [3, "Jared", "Arquero", 8],
          [4, "Aldo", "Guerrero", 30],
          [5, "Dan", "Asesino", 25],
        ],
        caption: "5 filas = 5 aventureros. 4 columnas = 4 datos por cada uno.",
      },
      {
        type: "chat",
        emoji: <MessageSquare className="w-12 h-12" />,
        headline: "SELECT: Tu voz de mando",
        lead: "Para sacar datos de una tabla usamos el comando SELECT. Piensa en él como decirle al archivero: '¡Muéstrame esto!'",
        chat: [
          { from: "tu", text: "Quiero ver TODOS los datos de todos los aventureros." },
          { from: "db", text: "Entendido. Aquí tienes las 5 filas completas de la tabla." },
        ],
        code: "SELECT * FROM aventureros;",
        codeLabel: "El asterisco (*) = todas las columnas",
      },
      {
        type: "hero",
        emoji: <Search className="w-12 h-12" />,
        headline: "Eligiendo columnas específicas",
        lead: "No siempre necesitas todo. Puedes pedir solo las columnas que te interesan separándolas por comas.",
        code: "SELECT nombre, clase FROM aventureros;",
        codeLabel: "Solo nombre y clase",
        bullets: [
          "SELECT nombre, clase → Solo esas dos columnas aparecerán.",
          "SELECT * → El asterisco significa 'todo', todas las columnas.",
          "Puedes consultar cualquier tabla, no solo aventureros. Hay una tabla de equipamiento con las armas de cada héroe.",
        ],
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Tu turno de consultar!",
        lead: "En los próximos 3 ejercicios practicarás SELECT con las tablas del gremio. Arrastra los bloques SQL para construir tus consultas.",
        checklist: [
          "SELECT * FROM aventureros — Trae todos los héroes.",
          "SELECT col1, col2 FROM tabla — Solo columnas específicas.",
          "SELECT * FROM equipamiento — Explora otras tablas del gremio.",
        ],
      },
    ],
  },

  "1-1": {
    title: "WHERE — El Filtro Definitivo",
    subtitle: "Filtrando con precisión quirúrgica",
    color: "from-indigo-500 to-purple-700",
    slides: [
      {
        type: "hero",
        emoji: <Filter className="w-12 h-12" />,
        headline: "¿Por qué filtrar?",
        lead: "SELECT * te muestra TODO. Pero en una tabla con miles de filas, necesitas encontrar justo lo que buscas. Para eso existe WHERE: un filtro que solo deja pasar las filas que cumplen tu condición.",
        bullets: [
          "WHERE va después de FROM y antes de ORDER BY.",
          "Puedes usar operadores: = (igual), > (mayor), < (menor), != (diferente).",
          "Los valores de texto siempre van entre comillas simples: 'Caballero'.",
        ],
      },
      {
        type: "chat",
        emoji: <MessageSquare className="w-12 h-12" />,
        headline: "WHERE con igualdad exacta",
        lead: "El operador = busca una coincidencia exacta. Perfecto cuando sabes exactamente qué buscas:",
        chat: [
          { from: "tu", text: "Quiero encontrar solo al aventurero que sea de clase 'Guerrero'." },
          { from: "db", text: "Filtrado. Solo Aldo (Guerrero, nivel 30) cumple la condición." },
        ],
        code: "SELECT * FROM aventureros\nWHERE clase = 'Guerrero';",
        codeLabel: "Operador = (igualdad exacta)",
      },
      {
        type: "highlight-rows",
        emoji: <Search className="w-12 h-12" />,
        headline: "Comparaciones y patrones",
        lead: "WHERE no solo busca igualdad. Puedes usar >, <, >=, <= para comparar números, y LIKE con % para buscar patrones en texto.",
        tableTitle: "Resultado de WHERE nivel > 20",
        columns: ["id", "nombre", "clase", "nivel"],
        rows: [
          [1, "Loya", "Caballero", 15],
          [4, "Aldo", "Guerrero", 30],
          [5, "Dan", "Asesino", 25],
        ],
        highlightRows: [1, 2],
        code: "SELECT nombre FROM aventureros\nWHERE nivel > 20;",
        caption: "Solo Aldo (30) y Dan (25) superan el nivel 20. LIKE 'A%' = empieza con A.",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Hora de filtrar como un francotirador!",
        lead: "Los próximos 3 ejercicios irán de lo simple a lo complejo: igualdad, comparación y patrones.",
        checklist: [
          "WHERE clase = 'Guerrero' — Igualdad exacta (texto con comillas simples).",
          "WHERE nivel > 20 — Comparación numérica (mayor que).",
          "WHERE nombre LIKE 'A%' — Búsqueda por patrón con comodín.",
        ],
      },
    ],
  },

  "1-2": {
    title: "ORDER BY, LIMIT y COUNT",
    subtitle: "Ordenar, limitar y contar",
    color: "from-teal-500 to-emerald-700",
    slides: [
      {
        type: "hero",
        emoji: <ArrowDownNarrowWide className="w-12 h-12" />,
        headline: "Poniendo orden en el caos",
        lead: "Ya sabes extraer y filtrar datos. Ahora aprenderás a organizarlos. ORDER BY ordena los resultados por cualquier columna.",
        bullets: [
          "ORDER BY columna ASC — Orden ascendente (menor a mayor). Es el predeterminado.",
          "ORDER BY columna DESC — Orden descendente (mayor a menor).",
          "Siempre va al final de la consulta, después de WHERE (si hay).",
        ],
      },
      {
        type: "highlight-rows",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "LIMIT — Frena la avalancha",
        lead: "Si una tabla tiene 10,000 filas, no quieres verlas todas. LIMIT restringe cuántas filas te devuelve.",
        tableTitle: "Los 3 más fuertes (ORDER BY nivel DESC LIMIT 3)",
        columns: ["id", "nombre", "clase", "nivel"],
        rows: [
          [4, "Aldo", "Guerrero", 30],
          [5, "Dan", "Asesino", 25],
          [2, "Zoe", "Maga Suprema", 20],
        ],
        highlightRows: [0, 1, 2],
        code: "SELECT * FROM aventureros\nORDER BY nivel DESC\nLIMIT 3;",
        caption: "Primero ordena de mayor a menor, luego corta en 3 resultados.",
      },
      {
        type: "chat",
        emoji: <MessageSquare className="w-12 h-12" />,
        headline: "COUNT — ¿Cuántos hay?",
        lead: "COUNT(*) no te muestra los datos, sino que los cuenta. Es una función de agregación — resume información en un solo número.",
        chat: [
          { from: "tu", text: "¿Cuántos aventureros existen en total?" },
          { from: "db", text: "count: 5. Hay 5 registros en la tabla aventureros." },
        ],
        code: "SELECT COUNT(*) FROM aventureros;",
        codeLabel: "Resultado: un solo número",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Domina el orden y el conteo!",
        lead: "Los próximos 3 ejercicios combinarán ORDER BY, LIMIT y COUNT para que controles completamente cómo se presentan los datos.",
        checklist: [
          "ORDER BY columna DESC — Ordenar de mayor a menor.",
          "LIMIT N — Trae solo N resultados.",
          "COUNT(*) — Cuenta el total de filas.",
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────
     MÓDULO 2 — Manipulación de Datos
     ────────────────────────────────────────────── */

  "2-0": {
    title: "INSERT — Creando Datos",
    subtitle: "El poder de la creación",
    color: "from-emerald-500 to-cyan-600",
    slides: [
      {
        type: "hero",
        emoji: <Plus className="w-12 h-12" />,
        headline: "Juega a ser un Dios: Crea registros",
        lead: "Hasta ahora solo has leído datos. Ahora aprenderás a CREAR nuevos registros con INSERT INTO. Es como reclutar un nuevo héroe al gremio.",
        bullets: [
          "INSERT INTO tabla (columnas) VALUES (valores) — Crea una nueva fila.",
          "Las columnas y valores deben coincidir en orden y cantidad.",
          "Los textos van entre comillas simples, los números van sin comillas.",
          "RETURNING * al final te muestra el registro que acabas de crear.",
        ],
      },
      {
        type: "chat",
        emoji: <MessageSquare className="w-12 h-12" />,
        headline: "Tu primer INSERT",
        lead: "Observa la anatomía de un INSERT. Cada parte tiene un propósito claro:",
        chat: [
          { from: "tu", text: "Quiero agregar a Gimli, un Guerrero de nivel 10." },
          { from: "db", text: "Registro insertado correctamente. id_aventurero: 6, nombre: Gimli." },
        ],
        code: "INSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Gimli', 'Guerrero', 10)\nRETURNING *;",
        codeLabel: "Anatomía del INSERT",
      },
      {
        type: "hero",
        emoji: <Database className="w-12 h-12" />,
        headline: "Insertando en diferentes tablas",
        lead: "Puedes insertar en cualquier tabla, no solo aventureros. Por ejemplo, puedes agregar equipamiento a un héroe existente.",
        code: "INSERT INTO equipamiento\n  (id_aventurero, item, precio)\nVALUES\n  (1, 'Casco de Plata', 80)\nRETURNING *;",
        codeLabel: "Insertando equipamiento",
        bullets: [
          "El id_aventurero = 1 conecta este item con Loya (el aventurero con ID 1).",
          "Esta conexión entre tablas se llama Llave Foránea — la verás a fondo en el Módulo 3.",
        ],
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Recluta a tus guerreros!",
        lead: "En los próximos 3 ejercicios insertarás registros en las tablas del Sandbox. Escribe el SQL en el editor.",
        checklist: [
          "INSERT INTO tabla (cols) VALUES (vals) — Crear registros.",
          "Textos entre comillas simples: 'Gimli'.",
          "Siempre termina con RETURNING * para ver tu creación.",
        ],
      },
    ],
  },

  "2-1": {
    title: "UPDATE y DELETE — Alterar y Destruir",
    subtitle: "El poder (y peligro) de modificar datos",
    color: "from-orange-500 to-rose-600",
    slides: [
      {
        type: "hero",
        emoji: <PenLine className="w-12 h-12" />,
        headline: "UPDATE: Reescribiendo el destino",
        lead: "Cuando un héroe sube de nivel o un precio cambia, usamos UPDATE para modificar registros existentes. Pero atención: un UPDATE mal hecho puede causar un desastre.",
        bullets: [
          "UPDATE tabla SET columna = nuevo_valor — Cambia el valor de una columna.",
          "SIEMPRE usa WHERE para indicar QUÉ fila(s) quieres modificar.",
          "Sin WHERE, UPDATE cambia TODAS las filas. Esto es peligroso.",
          "RETURNING * te muestra cómo quedó el registro después del cambio.",
        ],
      },
      {
        type: "highlight-rows",
        emoji: <Zap className="w-12 h-12" />,
        headline: "UPDATE en acción",
        lead: "Loya ha entrenado duro y sube al nivel 20. Observa cómo solo su fila cambia gracias al WHERE:",
        tableTitle: "aventureros (después del UPDATE)",
        columns: ["id", "nombre", "clase", "nivel"],
        rows: [
          [1, "Loya", "Caballero", 20],
          [2, "Zoe", "Maga Suprema", 20],
          [4, "Aldo", "Guerrero", 30],
        ],
        highlightRows: [0],
        code: "UPDATE aventureros\nSET nivel = 20\nWHERE nombre = 'Loya'\nRETURNING *;",
        caption: "Solo la fila de Loya fue modificada. Las demás siguen intactas.",
      },
      {
        type: "highlight-rows",
        emoji: <Trash2 className="w-12 h-12" />,
        headline: "DELETE: El abismo no perdona",
        lead: "DELETE borra filas permanentemente. Al igual que UPDATE, SIEMPRE necesita WHERE. Un DELETE sin WHERE vacía la tabla entera.",
        tableTitle: "aventureros (Dan fue eliminado)",
        columns: ["id", "nombre", "clase", "nivel"],
        rows: [
          [1, "Loya", "Caballero", 15],
          [2, "Zoe", "Maga Suprema", 20],
          [4, "Aldo", "Guerrero", 30],
        ],
        highlightRows: [],
        code: "DELETE FROM aventureros\nWHERE nombre = 'Dan'\nRETURNING *;",
        caption: "Dan ha sido borrado. No hay marcha atrás (en un sistema real).",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡A ensuciarse las manos!",
        lead: "Los próximos 3 ejercicios te harán modificar y eliminar datos reales del Sandbox. Recuerda: WHERE es tu mejor amigo.",
        checklist: [
          "UPDATE tabla SET col = val WHERE condición — Modificar registros.",
          "DELETE FROM tabla WHERE condición — Eliminar registros.",
          "NUNCA olvides WHERE — o destruirás todos los datos.",
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────
     MÓDULO 3 — El Arquitecto y los Vínculos
     ────────────────────────────────────────────── */

  "3-0": {
    title: "Entidades, Atributos y Relaciones",
    subtitle: "Los cimientos del diseño de bases de datos",
    color: "from-fuchsia-500 to-indigo-700",
    slides: [
      {
        type: "hero",
        emoji: <Database className="w-12 h-12" />,
        headline: "¿Qué es una Entidad?",
        lead: "Una entidad es cualquier 'cosa' del mundo real que necesitas representar en tu base de datos. Cada entidad se convierte en una TABLA.",
        bullets: [
          "Un aventurero es una entidad → se convierte en la tabla 'aventureros'.",
          "Un arma es una entidad → se convierte en la tabla 'equipamiento'.",
          "Cada entidad tiene Atributos (columnas): nombre, clase, nivel, precio...",
          "Para diseñar una base de datos, primero dibujas un Diagrama Entidad-Relación (MER).",
        ],
      },
      {
        type: "table",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "De Entidad a Tabla",
        lead: "La entidad 'Aventurero' se traduce en una tabla con sus atributos como columnas. El atributo especial 'id' es la Llave Primaria (PK): un valor único que identifica cada fila.",
        tableTitle: "aventureros",
        columns: ["id_aventurero (PK)", "nombre", "clase", "nivel"],
        rows: [
          [1, "Loya", "Caballero", 15],
          [2, "Zoe", "Maga Suprema", 20],
          [4, "Aldo", "Guerrero", 30],
        ],
        caption: "PK = Llave Primaria. Nunca se repite. Identifica cada fila de forma única.",
      },
      {
        type: "hero",
        emoji: <Link2 className="w-12 h-12" />,
        headline: "¿Qué es una Relación?",
        lead: "Las entidades no viven solas. Un aventurero TIENE equipamiento. Un cliente COMPRA productos. Estas conexiones se llaman Relaciones.",
        bullets: [
          "La Llave Foránea (FK) es el puente: una columna en una tabla que apunta al PK de otra.",
          "En 'equipamiento', la columna id_aventurero es una FK que apunta a aventureros.",
          "Así sabemos que la Espada Larga (FK=1) pertenece a Loya (PK=1).",
        ],
      },
      {
        type: "two-tables",
        emoji: <GitMerge className="w-12 h-12" />,
        headline: "Tipos de Relaciones (Cardinalidad)",
        lead: "Las relaciones tienen tipos según cuántos registros se conectan entre sí:",
        left: {
          title: "1:N (Uno a Muchos)",
          columns: ["Ejemplo", "Explicación"],
          rows: [
            ["Aventurero → Armas", "1 héroe tiene N armas"],
            ["Profesor → Alumnos", "1 profe tiene N alumnos"],
            ["País → Ciudades", "1 país tiene N ciudades"],
          ],
        },
        right: {
          title: "M:N (Muchos a Muchos)",
          columns: ["Ejemplo", "Explicación"],
          rows: [
            ["Alumnos ↔ Materias", "N alumnos cursan M materias"],
            ["Actores ↔ Películas", "N actores en M películas"],
            ["Doctores ↔ Pacientes", "N doctores ven M pacientes"],
          ],
        },
      },
      {
        type: "hero",
        emoji: <Sparkles className="w-12 h-12" />,
        headline: "1:1, 1:N y M:N en detalle",
        lead: "Entender la cardinalidad es clave para diseñar bien tu base de datos:",
        bullets: [
          "1:1 (Uno a Uno) — Raro. Ej: una persona tiene UN pasaporte, un pasaporte pertenece a UNA persona.",
          "1:N (Uno a Muchos) — El más común. Ej: 1 aventurero puede tener MUCHAS armas, pero cada arma pertenece a 1 solo aventurero.",
          "M:N (Muchos a Muchos) — Necesita una tabla intermedia. Ej: muchos alumnos cursan muchas materias → tabla 'inscripciones' que conecta ambas.",
          "La relación aventureros↔equipamiento es 1:N: Loya tiene Espada Y Escudo, pero cada arma es de 1 solo héroe.",
        ],
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Diseña tus primeras entidades!",
        lead: "En los próximos 3 ejercicios usarás el Lienzo de Arquitectura para crear entidades, darles atributos y conectarlas con relaciones.",
        checklist: [
          "Clic en '+ Entidad' para crear una tabla nueva.",
          "Escribe el nombre y agrega atributos (columnas).",
          "Arrastra desde el punto cyan al fucsia para crear una relación.",
        ],
      },
    ],
  },

  "3-1": {
    title: "JOINs — Consultando Relaciones con SQL",
    subtitle: "De diagramas a consultas reales",
    color: "from-violet-500 to-purple-700",
    slides: [
      {
        type: "hero",
        emoji: <GitMerge className="w-12 h-12" />,
        headline: "Ya diseñaste las tablas. Ahora consúltalas.",
        lead: "Sabes que aventureros y equipamiento están conectados por id_aventurero. JOIN es el comando SQL que cruza esa conexión y te muestra datos de AMBAS tablas juntas.",
        bullets: [
          "INNER JOIN muestra solo filas que tienen coincidencia en AMBAS tablas.",
          "Si un héroe no tiene equipo, NO aparece en un INNER JOIN.",
          "Siempre usamos ON para definir por qué columna se conectan las tablas.",
        ],
      },
      {
        type: "merge",
        emoji: <Link2 className="w-12 h-12" />,
        headline: "INNER JOIN en acción",
        lead: "Observa cómo SQL fusiona las tablas usando la Llave Foránea como puente:",
        code: "SELECT a.nombre, e.item\nFROM aventureros a\nINNER JOIN equipamiento e\n  ON a.id_aventurero = e.id_aventurero;",
        result: {
          title: "Resultado del INNER JOIN",
          columns: ["nombre", "item"],
          rows: [["Loya", "Espada Larga"], ["Loya", "Escudo de Hierro"], ["Zoe", "Báculo de Fuego"], ["Aldo", "Hacha Doble"], ["Dan", "Daga Venenosa"]],
        },
      },
      {
        type: "hero",
        emoji: <Filter className="w-12 h-12" />,
        headline: "LEFT JOIN: Nadie se queda atrás",
        lead: "LEFT JOIN incluye TODOS los registros de la tabla izquierda (FROM), incluso los que no tienen coincidencia. Jared no tiene equipo, pero igual aparece con NULL.",
        code: "SELECT a.nombre, e.item\nFROM aventureros a\nLEFT JOIN equipamiento e\n  ON a.id_aventurero = e.id_aventurero;",
        codeLabel: "Jared aparece con item = NULL",
        bullets: [
          "El alias 'a' y 'e' son atajos para los nombres de tabla.",
          "ON define el puente (la FK).",
          "Puedes agregar WHERE después del JOIN para filtrar los resultados.",
        ],
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Cruza el puente con SQL!",
        lead: "Los próximos 3 ejercicios te retarán a unir tablas usando INNER JOIN, LEFT JOIN y filtros WHERE.",
        checklist: [
          "INNER JOIN tabla ON condición — Une dos tablas (solo coincidencias).",
          "LEFT JOIN — Incluye todos de la tabla izquierda.",
          "Combina con WHERE para filtrar el resultado.",
        ],
      },
    ],
  },

  "3-2": {
    title: "Agregaciones con JOINs",
    subtitle: "Calculando totales entre tablas",
    color: "from-teal-500 to-cyan-700",
    slides: [
      {
        type: "hero",
        emoji: <Sparkles className="w-12 h-12" />,
        headline: "GROUP BY + Funciones de Agregación",
        lead: "Ya sabes unir tablas. Ahora aprende a RESUMIR los datos unidos. GROUP BY agrupa filas con valores iguales y te permite calcular estadísticas por grupo.",
        bullets: [
          "COUNT(columna) — Cuenta cuántos valores no nulos hay.",
          "SUM(columna) — Suma todos los valores numéricos.",
          "GROUP BY columna — Agrupa las filas por esa columna (un resultado por grupo).",
          "Se usa DESPUÉS del JOIN y del WHERE.",
        ],
      },
      {
        type: "merge",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "Ejemplo: ¿Cuántas armas tiene cada héroe?",
        lead: "Combinamos LEFT JOIN (para incluir a todos, incluso sin equipo) con COUNT y GROUP BY:",
        code: "SELECT a.nombre, COUNT(e.item)\nFROM aventureros a\nLEFT JOIN equipamiento e\n  ON a.id_aventurero = e.id_aventurero\nGROUP BY a.nombre;",
        result: {
          title: "Armas por héroe",
          columns: ["nombre", "count"],
          rows: [["Loya", "2"], ["Zoe", "1"], ["Jared", "0"], ["Aldo", "1"], ["Dan", "1"]],
        },
      },
      {
        type: "hero",
        emoji: <Database className="w-12 h-12" />,
        headline: "SUM: El gasto total",
        lead: "SUM suma valores numéricos por grupo. Perfecto para calcular el gasto total en equipamiento de cada héroe.",
        code: "SELECT a.nombre, SUM(e.precio)\nFROM aventureros a\nINNER JOIN equipamiento e\n  ON a.id_aventurero = e.id_aventurero\nGROUP BY a.nombre;",
        codeLabel: "Gasto total por héroe",
        bullets: [
          "Loya gastó 250 (Espada 150 + Escudo 100).",
          "Zoe gastó 300 (Báculo de Fuego).",
          "Puedes agregar ORDER BY al final para ordenar los resultados.",
        ],
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Domina las agregaciones!",
        lead: "Los próximos 3 ejercicios combinan JOINs con funciones de agregación y filtros avanzados.",
        checklist: [
          "COUNT(columna) con GROUP BY — Cuenta elementos por grupo.",
          "SUM(columna) con GROUP BY — Suma valores por grupo.",
          "WHERE + JOIN + GROUP BY + ORDER BY — La consulta completa.",
        ],
      },
    ],
  },

  /* ──────────────────────────────────────────────
     MÓDULO 4 — La Prueba de Dagon
     ────────────────────────────────────────────── */

  "4-0": {
    title: "La Prueba de Dagon",
    subtitle: "El reto final: diseña, conecta y consulta",
    color: "from-orange-500 to-rose-700",
    slides: [
      {
        type: "hero",
        emoji: <Database className="w-12 h-12" />,
        headline: "El Lienzo en Blanco",
        lead: "Llegaste al final. Ya sabes crear entidades, definir relaciones y consultar datos con JOINs y agregaciones. Ahora demuéstralo todo en una prueba real.",
        bullets: [
          "Diseñarás un sistema completo con 3 entidades y relaciones M:N.",
          "Recuerda: una relación Muchos a Muchos (M:N) necesita una tabla intermedia.",
          "Ej: Huéspedes ↔ Habitaciones necesita una tabla 'reservas' como puente.",
          "Después resolverás consultas avanzadas con JOINs, filtros y agregaciones.",
        ],
      },
      {
        type: "two-tables",
        emoji: <GitMerge className="w-12 h-12" />,
        headline: "Ejemplo de relación M:N",
        lead: "Observa cómo una tabla intermedia ('reservas') conecta dos entidades que tienen relación muchos a muchos:",
        left: {
          title: "huéspedes",
          columns: ["id (PK)", "nombre"],
          rows: [[1, "Carlos"], [2, "María"]],
        },
        right: {
          title: "reservas (tabla intermedia)",
          columns: ["id", "id_huesped (FK)", "id_habitacion (FK)"],
          rows: [[1, 1, 101], [2, 1, 102], [3, 2, 101]],
        },
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Dagon te observa. Demuestra lo que vales.",
        lead: "Esta es tu certificación como Arquitecto. 3 retos que combinan todo lo aprendido.",
        checklist: [
          "Fase 1: Diseña un sistema completo con 3 entidades y sus relaciones.",
          "Fase 2: Resuelve una consulta avanzada con JOIN + WHERE + ORDER BY.",
          "Fase 3: Construye un ranking con JOIN + SUM + GROUP BY + ORDER BY.",
        ],
      },
    ],
  },
};

/* Para el flujo antiguo que usa levelId directo (teoría inicial del módulo) */
const LEVEL_KEYS = {
  "1": "1-0",
  "2": "2-0",
  "3": "3-0",
  "4": "4-0",
};

const FALLBACK = {
  title: "Nueva misión",
  subtitle: "Vamos a practicar lo aprendido",
  color: "from-blue-500 to-fuchsia-600",
  slides: [
    {
      type: "hero",
      emoji: <Rocket className="w-12 h-12" />,
      headline: "¡Entrena tus habilidades!",
      lead: "Esta misión pondrá a prueba lo que ya sabes. Lee bien cada instrucción y suéltale tu mejor consulta a la base de datos.",
      bullets: [
        "Respira — cada error te enseña algo.",
        "Clawbot está para ayudarte si te atoras.",
        "¡Ganarás XP al resolver cada ejercicio!",
      ],
    },
  ],
};

/* ============================================================
   SUBCOMPONENTES VISUALES
   ============================================================ */

const CodeBox = ({ code, label }) => (
  <div className="rounded-2xl overflow-hidden border border-cyan-400/20 shadow-[0_0_30px_rgba(34,211,238,0.15)] max-w-lg mx-auto">
    <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-white/5">
      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
      <span className="ml-2 text-[10px] font-mono text-slate-400 tracking-widest">
        {label || 'query.sql'}
      </span>
    </div>
    <pre className="bg-slate-950 p-4 overflow-x-auto text-sm font-mono text-emerald-300 leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

const DataTable = ({ title, columns, rows, highlightCols = [], highlightRows = [] }) => (
  <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950/80 max-w-md mx-auto shadow-xl">
    <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-white/5">
      <Grid3x3 className="w-3 h-3 text-cyan-300" />
      <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">{title}</span>
    </div>
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-900/70">
          {columns.map((c, i) => (
            <th
              key={i}
              className={`px-3 py-2 text-left text-[11px] font-bold uppercase tracking-widest transition-colors ${
                highlightCols.includes(i) ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-500'
              }`}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => {
          const dim = highlightRows.length > 0 && !highlightRows.includes(ri);
          return (
            <motion.tr
              key={ri}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: dim ? 0.25 : 1, x: 0 }}
              transition={{ delay: ri * 0.1 }}
              className={`border-t border-white/5 ${
                highlightRows.includes(ri) ? 'bg-emerald-500/10' : ''
              }`}
            >
              {row.map((v, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 font-mono text-slate-200 ${
                    highlightCols.includes(ci) ? 'text-cyan-200 bg-cyan-500/5 font-bold' : ''
                  }`}
                >
                  {String(v)}
                </td>
              ))}
            </motion.tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

export const LevelTheory = ({ levelId, subTopic, onComplete }) => {
  // subTopic es la clave directa como "1-0", "1-1", etc.
  // levelId es el fallback para compatibilidad (módulo)
  const theoryKey = subTopic || LEVEL_KEYS[String(levelId)] || null;
  const theory = (theoryKey && SUB_TOPICS[theoryKey]) || FALLBACK;

  const [index, setIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const slide = theory.slides[index];
  const total = theory.slides.length;
  const isLast = index === total - 1;

  useEffect(() => {
    setIndex(0);
  }, [theoryKey]);

  useEffect(() => {
    if (!isMuted) {
      const timer = setTimeout(() => speak(), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const speak = () => {
    if (isMuted) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const prepareVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return voices.find(v => v.lang.includes('es')) || voices[0];
    };

    let fullText = `${slide.headline}. ${slide.lead || ''}`;
    if (slide.bullets) fullText += '. ' + slide.bullets.join('. ');
    if (slide.code) fullText += `. Código: ${slide.code.replace(/\n/g, ' ')}`;
    if (slide.caption) fullText += `. ${slide.caption}`;
    if (slide.chat) slide.chat.forEach(c => { fullText += `. ${c.from} dice: ${c.text}`; });

    window.speechSynthesis.cancel();

    const doSpeak = () => {
      const u = new SpeechSynthesisUtterance(fullText);
      u.lang = 'es-ES';
      u.rate = 0.9;
      u.pitch = 1.1;
      u.voice = prepareVoice();
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
    } else {
      doSpeak();
    }
  };

  const next = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (isLast) onComplete?.();
    else setIndex((i) => i + 1);
  };
  const prev = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (index > 0) setIndex((i) => i - 1);
  };

  return (
    <div className="w-full h-full overflow-y-auto scroll-fancy">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        {/* Top: progreso + controles */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <p className="text-cyan-300 text-xs font-bold tracking-[0.4em] uppercase mb-2">
              {theory.subtitle}
            </p>
            <h1 className="font-display text-2xl lg:text-3xl font-black text-white">
              {theory.title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={speak}
              disabled={isMuted}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/30 text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isSpeaking ? 'Detener voz' : 'Reproducir teoría'}
            >
              {isSpeaking ? (
                <span className="animate-pulse">🛑</span>
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              <span className="text-xs font-bold">{isSpeaking ? 'Detener' : 'Escuchar'}</span>
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white transition-colors"
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onComplete}
              className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest"
            >
              Saltar teoria →
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-6">
          {theory.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-10 bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]'
                  : i < index
                    ? 'w-6 bg-emerald-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
          <span className="ml-auto text-xs font-bold text-slate-500 tracking-widest">
            {index + 1} / {total}
          </span>
        </div>

        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${theoryKey}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="glass-card-apple rounded-3xl p-8 lg:p-10 border border-white/10 relative overflow-hidden mb-6"
          >
            <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-gradient-to-br ${theory.color} opacity-20`} />

            <div className="relative z-10">
              <SlideContent
                slide={slide}
                isSpeaking={isSpeaking}
                onSpeak={speak}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={index === 0}
            className="text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>

          <Button
            onClick={next}
            className={`bg-gradient-to-r ${theory.color} hover:brightness-110 text-white font-display font-black px-8 py-6 rounded-2xl text-base shadow-[0_15px_40px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-transform`}
          >
            {isLast ? <>Comenzar práctica <Rocket className="w-4 h-4 ml-2" /></> : <>Siguiente <ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* Exportamos las claves de subtemas para que ExercisePage pueda usarlas */
export const getSubTopicKey = (moduleId, exerciseOrder) => {
  const group = Math.floor((exerciseOrder - 1) / 3);
  const key = `${moduleId}-${group}`;
  return SUB_TOPICS[key] ? key : null;
};

export const hasSubTopic = (key) => !!SUB_TOPICS[key];

/* ============================================================
   Render del contenido de cada slide
   ============================================================ */

const SlideHeader = ({ slide, isSpeaking, onSpeak }) => (
  <div className="flex items-start gap-5 mb-6">
    <button
      onClick={onSpeak}
      className={`shrink-0 relative group ${isSpeaking ? 'animate-bounce' : 'animate-float'}`}
      title="Leer en voz alta"
    >
      <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-xl group-hover:bg-cyan-500/20" />
      <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center text-cyan-300">
        {slide.emoji}
      </div>
    </button>
    <div className="flex-1 min-w-0">
      <h2 className="font-display text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
        {slide.headline}
      </h2>
      {slide.lead && (
        <p className="text-slate-300 font-gameui text-base lg:text-lg leading-relaxed">
          {slide.lead}
        </p>
      )}
    </div>
  </div>
);

const SlideContent = ({ slide, isSpeaking, onSpeak }) => {
  return (
    <>
      <SlideHeader slide={slide} isSpeaking={isSpeaking} onSpeak={onSpeak} />

      {slide.bullets && (
        <ul className="space-y-2 mb-5">
          {slide.bullets.map((b, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex items-start gap-3 text-slate-200 font-gameui"
            >
              <span className="mt-1.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)] shrink-0" />
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
      )}

      {slide.checklist && (
        <ul className="space-y-2 mb-5">
          {slide.checklist.map((b, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/20 rounded-xl px-4 py-3"
            >
              <span className="text-emerald-300">✓</span>
              <span className="text-emerald-100 font-gameui">{b}</span>
            </motion.li>
          ))}
        </ul>
      )}

      {slide.code && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-5"
        >
          <CodeBox code={slide.code} label={slide.codeLabel} />
        </motion.div>
      )}

      {/* Tipos con tabla */}
      {(slide.type === 'table' || slide.type === 'highlight-columns' || slide.type === 'highlight-rows') && slide.columns && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <DataTable
            title={slide.tableTitle}
            columns={slide.columns}
            rows={slide.rows}
            highlightCols={slide.highlightCols}
            highlightRows={slide.highlightRows}
          />
        </motion.div>
      )}

      {/* Chat demo */}
      {slide.type === 'chat' && slide.chat && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 max-w-lg mx-auto mb-5"
        >
          {slide.chat.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.from === 'tu' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.5 }}
              className={`flex ${msg.from === 'tu' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-3 font-gameui text-sm leading-relaxed ${
                msg.from === 'tu'
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm'
                  : 'bg-slate-800/80 text-slate-100 border border-white/10 rounded-bl-sm'
              }`}>
                {msg.from === 'db' && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Base de datos
                  </p>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Dos tablas lado a lado */}
      {slide.type === 'two-tables' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <DataTable {...slide.left} />
          <DataTable {...slide.right} />
        </motion.div>
      )}

      {/* Merge: tablas que se fusionan */}
      {slide.type === 'merge' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          {slide.result && <DataTable {...slide.result} />}
        </motion.div>
      )}

      {slide.caption && (
        <p className="text-slate-400 text-sm italic font-gameui text-center mt-4">
          {slide.caption}
        </p>
      )}
    </>
  );
};
