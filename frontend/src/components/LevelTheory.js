import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { DagonMascot } from './DagonMascot';
import {
  ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, Rocket,
  Library, Grid3x3, MessageSquare, Search, Filter, ArrowDownNarrowWide,
  GitMerge, Database, Shield, Zap, PenLine, Trash2, Plus, Link2, Settings2,
  Key, Lock, Eye, EyeOff, List, Hash, Percent, View, FileCode,
  Wand2, Puzzle, Zap as ZapIcon2, Clock, Users, UserCheck, Trophy, ScrollText
} from 'lucide-react';

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
          {columns?.map((c, i) => (
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
        {rows?.map((row, ri) => {
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

const SlideHeader = ({ slide, isSpeaking, onSpeak }) => (
  <div className="flex items-start gap-5 mb-6">
    <div className={`shrink-0 w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300 ${isSpeaking ? 'animate-bounce' : ''}`}>
      {slide.emoji}
    </div>
    <div className="flex-1 min-w-0">
      <h2 className="font-display text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
        {slide.headline}
      </h2>
      {slide.lead && <p className="text-slate-300 text-lg leading-relaxed font-gameui">{slide.lead}</p>}
    </div>
  </div>
);

const SlideContent = ({ slide, isSpeaking, onSpeak }) => (
  <>
    <SlideHeader slide={slide} isSpeaking={isSpeaking} onSpeak={onSpeak} />
    {slide.bullets && (
      <ul className="space-y-2 mb-5">
        {slide.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-3 text-slate-200 font-gameui">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    )}
    {slide.code && <div className="mb-5"><CodeBox code={slide.code} label={slide.codeLabel} /></div>}
    {slide.result && <div className="mb-5"><DataTable {...slide.result} /></div>}
    {(slide.type === 'table' || slide.type === 'highlight-rows') && (
      <div className="mb-4">
        <DataTable 
          title={slide.tableTitle} 
          columns={slide.columns} 
          rows={slide.rows} 
          highlightCols={slide.highlightCols} 
          highlightRows={slide.highlightRows} 
        />
      </div>
    )}
    {slide.chat && (
      <div className="space-y-3 max-w-lg mx-auto mb-5">
        {slide.chat.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'tu' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-3 text-sm font-gameui ${msg.from === 'tu' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100 border border-white/10'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    )}
    {slide.caption && <p className="text-slate-400 text-sm italic text-center mt-4 font-gameui">{slide.caption}</p>}
  </>
);

/* ============================================================
   CONTENIDO NARRATIVO Y PROGRESIVO
   ============================================================ */

const SUB_TOPICS = {
  "1-1": {
    title: "El Archivo del Gremio",
    subtitle: "Tu primera mirada a los datos",
    color: "from-cyan-500 to-blue-700",
    slides: [
      {
        type: "hero",
        emoji: <Library className="w-12 h-12" />,
        headline: "¡Bienvenido al Gremio, Recluta!",
        lead: "Imagina que el gremio tiene un libro gigante donde anota todo. Ese libro es nuestra 'Base de Datos'.",
        bullets: [
          "Las Tablas son las páginas del libro.",
          "Las Columnas son las preguntas (¿Cómo te llamas?).",
          "Las Filas son las respuestas (Loya, nivel 15).",
        ],
      },
      {
        type: "chat",
        emoji: <MessageSquare className="w-12 h-12" />,
        headline: "SELECT: El grito de mando",
        lead: "Si quieres ver algo del libro, usas SELECT. Es como decir: '¡Oye libro, muéstrame esto!'.",
        chat: [
          { from: "tu", text: "Quiero ver TODO de todos los aventureros." },
          { from: "db", text: "¡Claro! Aquí tienes la lista completa." },
        ],
        code: "SELECT * FROM aventureros;",
        codeLabel: "El asterisco (*) significa 'TODO'",
      },
    ],
  },
  "1-2": {
    title: "Mirada Selectiva",
    subtitle: "Solo lo que importa",
    color: "from-blue-500 to-indigo-700",
    slides: [
      {
        type: "hero",
        emoji: <Search className="w-12 h-12" />,
        headline: "No leas toda la página",
        lead: "A veces solo quieres saber los nombres. Puedes elegir solo las columnas que te interesan.",
        code: "SELECT nombre, clase FROM aventureros;",
        codeLabel: "Solo tráeme nombre y clase",
      },
    ],
  },
  "1-4": {
    title: "Los Filtros Mágicos",
    subtitle: "Encuentra la aguja en el pajar",
    color: "from-indigo-500 to-purple-700",
    slides: [
      {
        type: "hero",
        emoji: <Filter className="w-12 h-12" />,
        headline: "WHERE: El colador de datos",
        lead: "Usamos WHERE para poner un filtro que solo deja pasar a los que cumplen tu regla.",
        bullets: [
          "WHERE significa 'Donde'.",
          "El texto va entre comillas simples ('Guerrero').",
        ],
      },
      {
        type: "chat",
        emoji: <MessageSquare className="w-12 h-12" />,
        headline: "Buscando al Guerrero",
        lead: "Si solo quieres ver a los Guerreros, le dices al libro:",
        code: "SELECT * FROM aventureros\nWHERE clase = 'Guerrero';",
        codeLabel: "Usa '=' para coincidencias exactas",
      },
    ],
  },
  "1-5": {
    title: "Midiendo el Poder",
    subtitle: "Filtros con números",
    color: "from-purple-500 to-pink-700",
    slides: [
      {
        type: "highlight-rows",
        emoji: <Zap className="w-12 h-12" />,
        headline: "¿Quién es más fuerte?",
        lead: "También puedes filtrar por números usando mayor que (>) o menor que (<).",
        tableTitle: "Nivel > 20",
        columns: ["id", "nombre", "clase", "nivel"],
        rows: [
          [1, "Loya", "Caballero", 15],
          [4, "Aldo", "Guerrero", 30],
          [5, "Dan", "Asesino", 25],
        ],
        highlightRows: [1, 2],
        code: "SELECT nombre FROM aventureros\nWHERE nivel > 20;",
      },
    ],
  },
  "1-6": {
    title: "El Detective",
    subtitle: "Buscando pistas",
    color: "from-pink-500 to-rose-700",
    slides: [
      {
        type: "hero",
        emoji: <Search className="w-12 h-12" />,
        headline: "LIKE: Búsqueda de patrones",
        lead: "Usa el símbolo '%' para buscar nombres que empiecen o terminen de cierta forma.",
        bullets: [
          "LIKE 'A%' → Todo lo que empiece por A.",
          "LIKE '%A' → Todo lo que termine en A.",
        ],
        code: "SELECT * FROM aventureros\nWHERE nombre LIKE 'A%';",
      },
    ],
  },
  "1-7": {
    title: "Orden en la Sala",
    subtitle: "Organiza tu tesoro",
    color: "from-teal-500 to-emerald-700",
    slides: [
      {
        type: "hero",
        emoji: <ArrowDownNarrowWide className="w-12 h-12" />,
        headline: "Ordenando resultados",
        lead: "Usa ORDER BY para poner orden. DESC para el más grande primero, ASC para el pequeño.",
        code: "SELECT * FROM aventureros\nORDER BY nivel DESC\nLIMIT 3;",
        codeLabel: "Top 3 más fuertes",
      },
    ],
  },
  "2-1": {
    title: "El Poder de la Creación",
    subtitle: "Reclutando héroes",
    color: "from-emerald-500 to-cyan-600",
    slides: [
      {
        type: "hero",
        emoji: <Plus className="w-12 h-12" />,
        headline: "INSERT INTO: Crear vida",
        lead: "Añade una nueva fila al libro respondiendo a las preguntas de las columnas.",
        bullets: [
          "INSERT INTO [tabla] (columnas) → Aquí dices a qué columnas les darás datos.",
          "VALUES (valores) → Aquí pones los datos en el mismo orden.",
        ],
        code: "INSERT INTO aventureros (nombre, clase) \nVALUES ('Gimli', 'Guerrero');",
      },
      {
        type: "chat",
        emoji: <Settings2 className="w-12 h-12" />,
        headline: "¡Cuidado con los tipos!",
        lead: "Recuerda: El texto va entre comillas simples (' ') y los números van solos.",
        code: "INSERT INTO aventureros (nombre, nivel) \nVALUES ('Loya', 10);",
      }
    ],
  },
  "2-4": {
    title: "UPDATE: Cambiar el Destino",
    subtitle: "Modificando datos",
    color: "from-orange-500 to-amber-600",
    slides: [
      {
        type: "hero",
        emoji: <PenLine className="w-12 h-12" />,
        headline: "Actualizar registros",
        lead: "Usa SET para el nuevo valor y WHERE para no cambiar a todo el gremio.",
        code: "UPDATE aventureros \nSET nivel = 20 \nWHERE nombre = 'Loya';",
      },
      {
        type: "hero",
        emoji: <Shield className="w-12 h-12" />,
        headline: "La Regla de Oro",
        lead: "¡NUNCA olvides el WHERE en un UPDATE! Si lo olvidas, todos los aventureros tendrán el mismo nivel.",
      }
    ],
  },
  "2-6": {
    title: "El Abismo",
    subtitle: "Borrando registros",
    color: "from-rose-500 to-red-700",
    slides: [
      {
        type: "hero",
        emoji: <Trash2 className="w-12 h-12" />,
        headline: "DELETE: Borrado definitivo",
        lead: "Asegúrate siempre de usar WHERE o vaciarás todo el libro por accidente.",
        bullets: [
          "DELETE FROM [tabla] → No necesitas elegir columnas, borras toda la fila.",
          "WHERE [condición] → Define exactamente qué fila debe irse al abismo.",
        ],
        code: "DELETE FROM aventureros \nWHERE nombre = 'Dan';",
      },
    ],
  },
  "3-1": {
    title: "El Plano del Castillo",
    subtitle: "¿Qué es una Entidad?",
    color: "from-fuchsia-500 to-indigo-700",
    slides: [
      {
        type: "hero",
        emoji: <Database className="w-12 h-12" />,
        headline: "Diseñando Tablas",
        lead: "Una Entidad es cualquier objeto del mundo real que quieras guardar. En el lienzo, crea una y dale atributos.",
        bullets: [
          "Entidad = La Tabla.",
          "Atributos = Las Columnas.",
          "Identificador (PK) = La columna única que no se repite.",
        ],
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Tu primer plano",
        lead: "Crea la entidad 'aventureros' con atributos básicos. No olvides marcar el ID como PK (Llave Primaria).",
      }
    ],
  },
  "3-2": {
    title: "El Puente de Datos",
    subtitle: "¿Qué es una Relación?",
    color: "from-indigo-500 to-purple-600",
    slides: [
      {
        type: "hero",
        emoji: <Link2 className="w-12 h-12" />,
        headline: "Conectando Entidades",
        lead: "Arrastra una línea desde una entidad a otra para crear un vínculo. Esto se llama Llave Foránea (FK).",
        bullets: [
          "La FK es el ID de una tabla guardado en otra tabla.",
          "Sirve para saber qué arma pertenece a qué guerrero.",
        ],
      },
    ],
  },
  "3-4": {
    title: "JOIN: La Unión Sagrada",
    subtitle: "Consultando varias tablas",
    color: "from-violet-500 to-purple-700",
    slides: [
      {
        type: "hero",
        emoji: <GitMerge className="w-12 h-12" />,
        headline: "Fusión de datos",
        lead: "Usa JOIN para ver datos de dos tablas conectadas en una sola pantalla. Necesitas una columna común.",
        code: "SELECT a.nombre, e.item \nFROM aventureros a \nJOIN equipamiento e ON a.id = e.id_aventurero;",
      },
      {
        type: "hero",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "El Secreto del ON",
        lead: "La cláusula ON es el puente. Le dice al sistema: 'Une la fila de la izquierda donde el ID sea igual al ID del dueño en la derecha'.",
      }
    ],
  },
  "3-7": {
    title: "Lógica de Agregación",
    subtitle: "Cálculos del Gran Sabio",
    color: "from-teal-500 to-emerald-600",
    slides: [
      {
        type: "hero",
        emoji: <Sparkles className="w-12 h-12" />,
        headline: "Más allá de las listas",
        lead: "A veces no quieres ver filas, quieres saber totales. Aquí entran las funciones de agregación.",
        bullets: [
          "COUNT(*) → Cuenta cuántos hay.",
          "SUM(columna) → Suma los valores.",
          "AVG(columna) → Saca el promedio.",
        ],
      },
      {
        type: "hero",
        emoji: <ArrowDownNarrowWide className="w-12 h-12" />,
        headline: "GROUP BY: El gran agrupador",
        lead: "Si quieres saber cuántas pociones tiene CADA aventurero, debes agrupar los resultados por su nombre.",
        code: "SELECT nombre, COUNT(*) \nFROM inventario \nGROUP BY nombre;",
        codeLabel: "Agrupa por nombre para contar sus items",
      },
    ],
  },
  "4-1": {
    title: "De la Imaginación al Código",
    subtitle: "El traductor de planos",
    color: "from-orange-500 to-rose-700",
    slides: [
      {
        type: "hero",
        emoji: <Shield className="w-12 h-12" />,
        headline: "Dagon te pone a prueba",
        lead: "Para graduarte, debes diseñar el sistema de la Posada del Gremio. Es un reto de 3 fases que combina todo.",
        bullets: [
          "Fase 1: Diseñar el plano visual (MER).",
          "Fase 2: Construir las tablas con código (DDL).",
          "Fase 3: Consultar los tesoros de la posada (JOIN).",
        ],
      },
      {
        type: "hero",
        emoji: <Database className="w-12 h-12" />,
        headline: "CREATE TABLE: Forjando el metal",
        lead: "En SQL, una caja de tu diagrama se convierte en código usando CREATE TABLE.",
        code: "CREATE TABLE pociones (\n  id SERIAL PRIMARY KEY,\n  nombre VARCHAR(50),\n  precio INTEGER\n);",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Empieza la Fase 1",
        lead: "Dibuja las tablas 'huespedes', 'habitaciones' y la tabla puente 'reservas'. ¡El destino te espera!",
      },
    ],
  },

  // ============================================================
  // SENDA DEL GUERRERO: MÓDULOS 5-20
  // ============================================================

  "5-1": {
    title: "Los Sellos Sagrados",
    subtitle: "Constraints básicos",
    color: "from-amber-500 to-orange-600",
    slides: [
      {
        type: "hero",
        emoji: <Lock className="w-12 h-12" />,
        headline: "Primary Key: Tu Identificador",
        lead: "La Primary Key (PK) es el sello que hace único a cada registro. Como el número de carnet del aventurero.",
        bullets: [
          "Cada tabla necesita UNA columna que sea irrepetible.",
          "No puede haber NULL ni duplicados.",
          "Se marca con PRIMARY KEY.",
        ],
        code: "CREATE TABLE aventureros (\n  id SERIAL PRIMARY KEY,\n  nombre VARCHAR(50) NOT NULL\n);",
      },
      {
        type: "chat",
        emoji: <Key className="w-12 h-12" />,
        headline: "NOT NULL: Dato obligatorio",
        lead: "Si una columna es NOT NULL, el sistema NO permite que esté vacía. Es como exigir el nombre.",
        code: "CREATE TABLE guild (\n  id SERIAL PRIMARY KEY,\n  nombre VARCHAR(100) NOT NULL,\n  fundacion DATE\n);",
      },
    ],
  },

  "5-2": {
    title: "Añadir Constraint PK",
    subtitle: "Sello de identidicador",
    color: "from-amber-600 to-yellow-600",
    slides: [
      {
        type: "hero",
        emoji: <Key className="w-12 h-12" />,
        headline: "PRIMARY KEY: Tu Sello único",
        lead: "Una Primary Key (PK) es un sello especial que hace único a cada registro. Como el número de indentificacióndel aventurero.",
        bullets: [
          "Identifica cada fila de manera única.",
          "No puede tener valores duplicados.",
          "No puede ser NULL (vacío).",
        ],
        code: "CREATE TABLE aventureros (\n  id_aventurero SERIAL PRIMARY KEY,\n  nombre VARCHAR(50)\n);",
      },
      {
        type: "hero",
        emoji: <Settings2 className="w-12 h-12" />,
        headline: "Agregar PK después",
        lead: "Si creaste la tabla SIN PK, puedes agregarla después con ALTER TABLE:",
        code: "ALTER TABLE aventureros\nADD CONSTRAINT pk_aventurero\nPRIMARY KEY (id_aventurero);",
      },
      {
        type: "chat",
        emoji: <Shield className="w-12 h-12" />,
        headline: "DEFAULT: El valor que aparece solo",
        lead: "DEFAULT define qué valor poner si no lo especificas al insertar.",
        code: "CREATE TABLE mascotas (\n  id SERIAL PRIMARY KEY,\n  nombre VARCHAR(50),\n  nivel INTEGER DEFAULT 1\n);",
        codeLabel: "nivel será 1 por defecto si no lo pones",
      },
    ],
  },

  "6-1": {
    title: "UNIQUE: Nombres Únicos",
    subtitle: "Sin duplicados",
    color: "from-violet-500 to-purple-600",
    slides: [
      {
        type: "hero",
        emoji: <Shield className="w-12 h-12" />,
        headline: "No puede haber dos iguales",
        lead: "UNIQUE asegura que una columna no tenga valores repetidos. Como los nombres de los guerreros del gremio.",
        code: "ALTER TABLE aventureros \nADD CONSTRAINT nombre_unique \nUNIQUE (nombre);",
      },
      {
        type: "chat",
        emoji: <Key className="w-12 h-12" />,
        headline: "UNIQUE vs PRIMARY KEY",
        lead: "UNIQUE permite NULL (muchos NULLs incluso). PRIMARY KEY es UNIQUE + NOT NULL obligatorio.",
        bullets: [
          "PK = Solo uno por tabla, obligatorio.",
          "UNIQUE = Puede haber varios, permite NULL.",
        ],
      },
    ],
  },

  "6-2": {
    title: "CHECK: Validación de Datos",
    subtitle: "Las reglas del juego",
    color: "from-purple-500 to-fuchsia-600",
    slides: [
      {
        type: "hero",
        emoji: <Shield className="w-12 h-12" />,
        headline: "Reglas que se cumplen",
        lead: "CHECK verifica que los datos cumplan una condición. Si no la cumplen, se rechaza el insert.",
        code: "ALTER TABLE aventureros \nADD CONSTRAINT nivel_check \nCHECK (nivel >= 1 AND nivel <= 99);",
      },
      {
        type: "chat",
        emoji: <Lock className="w-12 h-12" />,
        headline: "Ejemplos de CHECK",
        lead: "Pueden ser tan complejos como necesites:",
        code: "CHECK (precio > 0),\nCHECK (fecha_fin > fecha_inicio),\nCHECK (edad >= 18);",
      },
    ],
  },

  "7-1": {
    title: "SERIAL: ID Automático",
    subtitle: "El generador de identificadores",
    color: "from-cyan-500 to-blue-600",
    slides: [
      {
        type: "hero",
        emoji: <Hash className="w-12 h-12" />,
        headline: "No más ID manual",
        lead: "SERIAL crea automáticamente un número que aumenta cada vez. Es como la fila del banco: te dan el siguiente número.",
        code: "CREATE TABLE heroes (\n  id SERIAL PRIMARY KEY,\n  nombre VARCHAR(50)\n);",
      },
      {
        type: "chat",
        emoji: <List className="w-12 h-12" />,
        headline: "Cómo funciona internamente",
        lead: "SERIAL crea una secuencia que hace nextval automáticamente.",
        code: "INSERT INTO heroes (nombre) \nVALUES ('Loya');",
        codeLabel: "El ID se genera solo: 1, 2, 3...",
      },
    ],
  },

  "7-2": {
    title: "Secuencias: El Mecanismo",
    subtitle: "Entendiendo los GENERATORs",
    color: "from-blue-500 to-indigo-600",
    slides: [
      {
        type: "hero",
        emoji: <Hash className="w-12 h-12" />,
        headline: "Las secuencias son el motor",
        lead: "Una secuencia es un objeto que genera números en orden. SERIAL usa una secuencia internamente.",
        code: "SELECT nextval('seq_numeros');",
        codeLabel: "Devuelve el siguiente número",
      },
      {
        type: "chat",
        emoji: <ZapIcon2 className="w-12 h-12" />,
        headline: "Control de secuencias",
        lead: "Puedes ver, reiniciar y modificar secuencias:",
        code: "-- Ver siguiente valor\nSELECT nextval('seq');\n\n-- Reiniciar\nSELECT setval('seq', 100);",
      },
    ],
  },

  "8-1": {
    title: "BETWEEN: El Rango",
    subtitle: "Entre dos valores",
    color: "from-teal-500 to-emerald-600",
    slides: [
      {
        type: "hero",
        emoji: <Filter className="w-12 h-12" />,
        headline: "Dentro del rango",
        lead: "BETWEEN busca valores entre dos límites, incluyendo ambos. Es como筛选 10 a 20.",
        code: "SELECT * FROM aventureros \nWHERE nivel BETWEEN 10 AND 20;",
        codeLabel: "Nivel 10, 11, 12... hasta 20",
      },
      {
        type: "chat",
        emoji: <Filter className="w-12 h-12" />,
        headline: "BETWEEN funciona en fechas también",
        lead: "Perfecto para rangos de fechas:",
        code: "SELECT * FROM pedidos \nWHERE fecha BETWEEN '2024-01-01' AND '2024-12-31';",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Practica: Encuentra el rango",
        lead: "Usa BETWEEN para buscar heroes con nivel entre 5 y 15.",
      },
    ],
  },

  "8-2": {
    title: "IN: La Lista",
    subtitle: "Uno de varios",
    color: "from-emerald-500 to-green-600",
    slides: [
      {
        type: "hero",
        emoji: <List className="w-12 h-12" />,
        headline: "Selecciona de una lista",
        lead: "IN verifica si el valor está en una lista. Es como preguntar: '¿eres Guerrero o Mago?'",
        code: "SELECT * FROM aventureros \nWHERE clase IN ('Guerrero', 'Mago');",
      },
      {
        type: "chat",
        emoji: <Percent className="w-12 h-12" />,
        headline: "IN vs muchos OR",
        lead: "IN es más limpio que encadenar ORs:",
        code: "-- Con OR (largo)\nWHERE clase = 'Guerrero' OR clase = 'Mago'\n\n-- Con IN (elegante)\nWHERE clase IN ('Guerrero', 'Mago')",
      },
    ],
  },

  "8-3": {
    title: "IS NULL: El Vacío",
    subtitle: "Encontrando lo que no existe",
    color: "from-slate-500 to-gray-600",
    slides: [
      {
        type: "hero",
        emoji: <EyeOff className="w-12 h-12" />,
        headline: "NULL no es vacío, es 'sin valor'",
        lead: "NULL significa 'no tiene ningún valor conocido'. No es 0, no es texto vacío, es... nada.",
        code: "SELECT * FROM aventureros \nWHERE nivel IS NULL;",
      },
      {
        type: "chat",
        emoji: <Eye className="w-12 h-12" />,
        headline: "IS NOT NULL",
        lead: "Para encontrar los que SÍ tienen valor:",
        code: "SELECT * FROM aventureros \nWHERE nivel IS NOT NULL;",
      },
    ],
  },

"9-1": {
    title: "LIKE: El Padrón",
    subtitle: "Buscar patrones",
    color: "from-amber-500 to-red-600",
    slides: [
      {
        type: "hero",
        emoji: <Search className="w-12 h-12" />,
        headline: "Buscar como el viento",
        lead: "LIKE busca patrones en texto. % es 'cualquier cosa', _ es 'un caracter'.",
        code: "SELECT * FROM aventureros \nWHERE nombre LIKE 'A%';",
        codeLabel: "Todo que empieza con A",
      },
      {
        type: "chat",
        emoji: <Search className="w-12 h-12" />,
        headline: "Comodines: % y _",
        lead: "% = muchos caracteres, _ = solo uno",
        code: "-- Empieza con 'Guerrero'\nLIKE 'Guerrero%'\n\n-- Termina con 'ero'\nLIKE '%ero'\n\n-- Contiene 'espada' en cualquier parte\nLIKE '%espada%'\n\n-- Segunda letra 'a'\nLIKE '_a%'",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Busca en la oscuridad",
        lead: "Encuentra todos los nombres que contengan 'dark' anywhere.",
      },
    ],
  },

  "9-2": {
    title: "ILIKE: Mayúsculas",
    subtitle: "Sin importar mayúsculas",
    color: "from-orange-500 to-amber-600",
    slides: [
      {
        type: "hero",
        emoji: <Search className="w-12 h-12" />,
        headline: "Da igual mayúsculas",
        lead: "ILIKE es como LIKE pero ignora mayúsculas y minúsculas. Para búsquedas flexibles.",
        code: "SELECT * FROM aventureros \nWHERE nombre ILIKE '%dragon%';",
        codeLabel: "Encuentra Dragon, DRAGON, dragOn, etc.",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Practica sin caso",
        lead: "Usa ILIKE para buscar 'ARQUITECTO' sin importar cómo esté escrito.",
      },
    ],
  },

  // ============================================================
  // VISTAS (Views) - Ahora con teoría propia
  // ============================================================

  "10-1": {
    title: "VISTAS: Tablas Virtuales",
    subtitle: "Consultas guardadas",
    color: "from-pink-500 to-rose-600",
    slides: [
      {
        type: "hero",
        emoji: <View className="w-12 h-12" />,
        headline: "Una pregunta guardada",
        lead: "Una VIEW es como una fotografía de una consulta. Guardas la query y simplemente la ejecutas depois.",
        code: "CREATE VIEW guerreros_view AS\nSELECT nombre, nivel \nFROM aventureros \nWHERE clase = 'Guerrero';",
      },
      {
        type: "chat",
        emoji: <Eye className="w-12 h-12" />,
        headline: "Usar la vista",
        lead: "Ahora puedes consultar la vista como si fuera una tabla:",
        code: "SELECT * FROM guerreros_view;",
      },
    ],
  },

  "10-1": {
    title: "Los Planos del Gremio",
    subtitle: "information_schema",
    color: "from-indigo-500 to-blue-600",
    slides: [
      {
        type: "hero",
        emoji: <FileCode className="w-12 h-12" />,
        headline: "Metadatos: datos sobre datos",
        lead: "information_schema guarda 'planos' de tu base de datos: qué tablas hay, qué columnas, qué permisos.",
        code: "SELECT table_name \nFROM information_schema.tables \nWHERE table_schema = 'public';",
      },
      {
        type: "chat",
        emoji: <List className="w-12 h-12" />,
        headline: "Ver columnas de una tabla",
        lead: "Descubre qué columnas tiene cualquier tabla:",
        code: "SELECT column_name, data_type\nFROM information_schema.columns\nWHERE table_name = 'aventureros';",
      },
    ],
  },

  "11-1": {
    title: "LIKE: Búsqueda Inteligente",
    subtitle: "Buscar por patrón",
    color: "from-yellow-500 to-amber-600",
    slides: [
      {
        type: "hero",
        emoji: <Search className="w-12 h-12" />,
        headline: "El comodín %",
        lead: "% significa 'cualquier cosa'. LIKE '%algo' busca lo que termina en 'algo'.",
        code: "-- Nombres que empiezan con 'L'\nSELECT * FROM aventureros \nWHERE nombre LIKE 'L%';",
      },
      {
        type: "chat",
        emoji: <Sparkles className="w-12 h-12" />,
        headline: "Más comodines",
        lead: "_ significa 'un carácter cualquiera':",
        code: "-- Nombre con segunda letra 'o'\nSELECT * FROM aventureros \nWHERE nombre LIKE '_o%';",
      },
    ],
  },

  "12-1": {
    title: "Funciones: Hechizos Reutilizables",
    subtitle: "Código que devuelve resultados",
    color: "from-orange-500 to-red-600",
    slides: [
      {
        type: "hero",
        emoji: <Wand2 className="w-12 h-12" />,
        headline: "Las funciones son hechizos",
        lead: "Una función recibe datos, hace cálculos y devuelve UN resultado. Como un oráculo: le preguntas y te responde.",
        code: "CREATE FUNCTION sumar(a INT, b INT)\nRETURNS INT AS $$\n  SELECT a + b;\n$$ LANGUAGE SQL;",
      },
      {
        type: "chat",
        emoji: <ZapIcon2 className="w-12 h-12" />,
        headline: "Usar la función",
        lead: "Llama a la función como si fuera un comando:",
        code: "SELECT sumar(5, 3);",
        codeLabel: "Devuelve: 8",
      },
    ],
  },

  "12-2": {
    title: "Funciones con Condiciones",
    subtitle: "IF y CASE en funciones",
    color: "from-red-500 to-orange-600",
    slides: [
      {
        type: "hero",
        emoji: <Shield className="w-12 h-12" />,
        headline: "Lógica en funciones",
        lead: "Usa CASE para decisiones:",
        code: "CREATE FUNCTION verificar_nivel(n INT)\nRETURNS TEXT AS $$\n  SELECT CASE \n    WHEN n > 20 THEN 'Veterano'\n    ELSE 'Novato'\n  END;\n$$ LANGUAGE SQL;",
      },
    ],
  },

  "13-1": {
    title: "Functions vs Procedures",
    subtitle: "¿Cuál usar?",
    color: "from-violet-500 to-purple-600",
    slides: [
      {
        type: "hero",
        emoji: <Puzzle className="w-12 h-12" />,
        headline: "Functions devuelven, Procedures ejecutan",
        lead: "Functions: para cálculos y retornar valores.\nProcedures: para acciones múltiples.",
        bullets: [
          "Function: SELECT mi_funcion()",
          "Procedure: CALL mi_procedure()",
          "Function: en queries SQL",
          "Procedure: en transacciones",
        ],
      },
    ],
  },

  "14-1": {
    title: "Triggers: Gatillos Mágicos",
    subtitle: "Código que se ejecuta solo",
    color: "from-fuchsia-500 to-pink-600",
    slides: [
      {
        type: "hero",
        emoji: <ZapIcon2 className="w-12 h-12" />,
        headline: "Automagia pura",
        lead: "Un trigger se dispara SOLO cuando pasa algo específico: INSERT, UPDATE o DELETE.",
        code: "CREATE FUNCTION fn_saludo()\nRETURNS TRIGGER AS $$\nBEGIN\n  RAISE NOTICE 'Nuevo: %', NEW.nombre;\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;",
      },
      {
        type: "chat",
        emoji: <Lock className="w-12 h-12" />,
        headline: "Activar el trigger",
        lead: "Ahora conecta la función a la tabla:",
        code: "CREATE TRIGGER trg_saludo\nAFTER INSERT ON aventureros\nFOR EACH ROW\nEXECUTE FUNCTION fn_saludo();",
      },
    ],
  },

  "15-1": {
    title: "Transacciones: Viaje en el Tiempo",
    subtitle: "COMMIT y ROLLBACK",
    color: "from-cyan-500 to-teal-600",
    slides: [
      {
        type: "hero",
        emoji: <Clock className="w-12 h-12" />,
        headline: "BEGIN: Inicia el viaje",
        lead: "Una transacción agrupa operaciones. Si algo falla, puedes volver atrás con ROLLBACK.",
        code: "BEGIN;\nINSERT INTO aventureros ...;\nUPDATE equipamiento ...;\nCOMMIT; -- Guardar cambios",
      },
      {
        type: "chat",
        emoji: <ArrowLeft className="w-12 h-12" />,
        headline: "ROLLBACK: Volver al pasado",
        lead: "Si algo sale mal, deshaz TODO:",
        code: "BEGIN;\nINSERT INTO ...;\n-- ¡Ups, algo mal!\nROLLBACK; -- Todo se deshace",
      },
    ],
  },

  "16-1": {
    title: "FOR UPDATE: Cerrojo de Fila",
    subtitle: "Bloqueando datos",
    color: "from-slate-500 to-zinc-600",
    slides: [
      {
        type: "hero",
        emoji: <Lock className="w-12 h-12" />,
        headline: "Bloquea mientras operas",
        lead: "FOR UPDATE bloquea las filas seleccionadas para que nadie más pueda modificarlas hasta que hagas COMMIT.",
        code: "BEGIN;\nSELECT * FROM habitaciones\nWHERE numero = 101\nFOR UPDATE;",
        codeLabel: "La habitación 101 queda bloqueada",
      },
    ],
  },

  "17-1": {
    title: "Álgebra Relacional",
    subtitle: "Operaciones de conjuntos",
    color: "from-blue-500 to-violet-600",
    slides: [
      {
        type: "hero",
        emoji: <Sparkles className="w-12 h-12" />,
        headline: "UNION: Juntar mundos",
        lead: "UNION combina resultados de dos consultas, sin duplicados.",
        code: "SELECT nombre FROM aventureros\nUNION\nSELECT item FROM equipamiento;",
      },
      {
        type: "chat",
        emoji: <Search className="w-12 h-12" />,
        headline: "INTERSECT y EXCEPT",
        lead: "INTERSECT: lo que está en ambos.\nEXCEPT: lo que está en el primero pero no en el segundo.",
        code: "-- INTERSECT: nombres que también son items\nSELECT nombre FROM aventureros\nINTERSECT\nSELECT item FROM equipamiento;",
      },
    ],
  },

  "18-1": {
    title: "Roles del Gremio",
    subtitle: "GRANT y REVOKE",
    color: "from-emerald-500 to-green-600",
    slides: [
      {
        type: "hero",
        emoji: <Users className="w-12 h-12" />,
        headline: "Quién puede qué",
        lead: "Los roles definen qué puede hacer cada usuario. GRANT da permisos, REVOKE los quita.",
        code: "-- Dar permiso de lectura\nGRANT SELECT ON aventureros\nTO app_sandbox_user;",
      },
      {
        type: "chat",
        emoji: <UserCheck className="w-12 h-12" />,
        headline: "Verificar tu rol actual",
        lead: "Consulta quién eres en la sesión:",
        code: "SELECT current_user;",
        codeLabel: "Muestra el usuario de conexión",
      },
    ],
  },

  "19-1": {
    title: "Tu Universo Personal",
    subtitle: "Row Level Security",
    color: "from-indigo-500 to-violet-600",
    slides: [
      {
        type: "hero",
        emoji: <Shield className="w-12 h-12" />,
        headline: "Cada usuario tiene su mundo",
        lead: "Tu esquema 'sandbox_usuario_[tu_id]' es tu universo personal. Nadie más puede ver tus datos.",
        code: "SELECT current_setting('search_path');",
        codeLabel: "Muestra tu esquema actual",
      },
      {
        type: "chat",
        emoji: <Database className="w-12 h-12" />,
        headline: "El multiverso de Dagon",
        lead: "Cuando te registras, Dagon clona automáticamente tu propio esquema. ¡Tus cambios no afectan a otros!",
      },
    ],
  },

  "20-1": {
    title: "Proyecto Final",
    subtitle: "Integrando todo",
    color: "from-rose-500 to-amber-600",
    slides: [
      {
        type: "hero",
        emoji: <Trophy className="w-12 h-12" />,
        headline: "El Guerrero Completo",
        lead: "Has recorrido los Sellos Sagrados, los Hechizos, los Gatillos y el Viaje Temporal. Es hora de integrarlo todo.",
        bullets: [
          "Constraints: Datos con reglas.",
          "Funciones: Lógica reutilizable.",
          "Triggers: Automatización.",
          "Transacciones: Seguridad.",
        ],
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Tu misión final",
        lead: "Crea el sistema del bestiario con todo lo aprendido. Tablas, funciones, vistas, triggers y transacciones.",
      },
    ],
  },
};

const LEVEL_KEYS = {
  "1": "1-1",
  "2": "2-1",
  "3": "3-1",
  "4": "4-1",
  "5": "5-1",
  "6": "6-1",
  "7": "7-1",
  "8": "8-1",
  "9": "9-1",
  "10": "10-1",
  "11": "11-1",
  "12": "12-1",
  "13": "13-1",
  "14": "14-1",
  "15": "15-1",
  "16": "16-1",
  "17": "17-1",
  "18": "18-1",
  "19": "19-1",
  "20": "20-1",
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
      lead: "Esta misión pondrá a prueba lo que ya sabes.",
    },
  ],
};

export const LevelTheory = ({ levelId, subTopic, onComplete }) => {
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
    window.speechSynthesis.cancel();
    return () => window.speechSynthesis.cancel();
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

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(fullText);
    u.lang = 'es-ES';
    u.voice = prepareVoice();
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
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
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex-1">
            <p className="text-cyan-300 text-xs font-bold tracking-[0.4em] uppercase mb-2 font-display">
              {theory.subtitle}
            </p>
            <h1 className="font-display text-2xl lg:text-3xl font-black text-white">
              {theory.title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={speak}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold font-display"
            >
              {isSpeaking ? '🛑 Detener' : '🔊 Escuchar'}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-slate-800 text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={onComplete} className="text-slate-400 uppercase text-[10px] font-bold font-display hover:text-white transition-colors">
              Saltar teoría →
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {theory.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-10 bg-cyan-400' : i < index ? 'w-6 bg-emerald-400' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${theoryKey}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card-apple rounded-3xl p-8 lg:p-10 border border-white/10 relative overflow-hidden mb-6 bg-slate-900/50"
          >
            <div className={`absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${theory.color}`} />
            <div className="relative z-10">
              <SlideContent slide={slide} isSpeaking={isSpeaking} onSpeak={speak} />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={prev} disabled={index === 0} className="text-slate-300 font-display">
            Anterior
          </Button>
          <Button onClick={next} className={`bg-gradient-to-r ${theory.color} text-white font-black px-8 py-6 rounded-2xl font-display shadow-lg hover:brightness-110 transition-all`}>
            {isLast ? 'Comenzar Práctica' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const getSubTopicKey = (moduleId, exerciseOrder) => {
  const specificKey = `${moduleId}-${exerciseOrder}`;
  if (SUB_TOPICS[specificKey]) return specificKey;
  const group = Math.floor((exerciseOrder - 1) / 3);
  const groupKey = `${moduleId}-g${group}`;
  return SUB_TOPICS[groupKey] ? groupKey : null;
};

export const hasSubTopic = (key) => !!SUB_TOPICS[key];
