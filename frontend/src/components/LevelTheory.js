import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { DagonMascot } from './DagonMascot';
import {
  ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, Rocket,
  Library, Grid3x3, MessageSquare, Search, Filter, ArrowDownNarrowWide, GitMerge,
} from 'lucide-react';

/* ============================================================
   CONTENIDO POR NIVEL — lenguaje para jóvenes que no saben nada
   ============================================================ */

const LEVELS = {
  "1": {
    title: "Descubre las bases de datos",
    subtitle: "Tu primer paso en el abismo de los datos",
    color: "from-cyan-500 to-blue-700",
    slides: [
      {
        type: "hero",
        emoji: <Library className="w-12 h-12" />,
        headline: "Imagina una biblioteca mágica",
        lead: "Una base de datos es como una biblioteca gigante donde toda la información está súper ordenada en cajas.",
        bullets: [
          "Cada caja guarda un tipo de cosa (personajes, pokemones, canciones...).",
          "Dentro de cada caja hay fichas con información.",
          "Tú, como explorador, vas a pedirle cosas a esa biblioteca.",
        ],
      },
      {
        type: "table",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "Cada caja se llama 'tabla'",
        lead: "Una tabla tiene columnas (tipo de dato) y filas (cada elemento).",
        tableTitle: "pokemones",
        columns: ["id", "nombre", "tipo", "poder"],
        rows: [
          [1, "Pikachu", "Eléctrico", 55],
          [2, "Charmander", "Fuego", 52],
          [3, "Bulbasaur", "Planta", 49],
        ],
        caption: "Esta tabla tiene 4 columnas y 3 filas. Cada fila es un pokémon.",
      },
      {
        type: "chat",
        emoji: <MessageSquare className="w-12 h-12" />,
        headline: "SQL es el idioma para hablarle",
        lead: "SQL significa 'Structured Query Language'. Es como pedirle cosas a la biblioteca escribiendo en un idioma especial.",
        chat: [
          { from: "tu", text: "Oye base de datos, dame los nombres de todos los pokemones." },
          { from: "db", text: "Claro, aquí tienes: Pikachu, Charmander, Bulbasaur." },
        ],
        code: "SELECT nombre FROM pokemones;",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Ya estás listo!",
        lead: "En esta misión vas a aprender a hablar con la base de datos para pedirle cosas.",
        checklist: [
          "Sabes qué es una base de datos.",
          "Sabes que las tablas tienen filas y columnas.",
          "Sabes que SQL es el idioma para pedirle cosas.",
        ],
      },
    ],
  },

  "2": {
    title: "SELECT: pide lo que necesitas",
    subtitle: "Tu herramienta #1 para obtener datos",
    color: "from-emerald-500 to-cyan-600",
    slides: [
      {
        type: "hero",
        emoji: <Search className="w-12 h-12" />,
        headline: "SELECT = 'dame esto'",
        lead: "SELECT le dice a la base de datos qué columnas quieres ver. FROM le dice de cuál tabla.",
        code: "SELECT nombre, poder\nFROM pokemones;",
        codeLabel: "Estructura básica",
      },
      {
        type: "highlight-columns",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "Elige las columnas que quieres",
        lead: "Solo se muestran las columnas que pediste — las demás se quedan ocultas.",
        tableTitle: "pokemones",
        columns: ["id", "nombre", "tipo", "poder"],
        rows: [
          [1, "Pikachu", "Eléctrico", 55],
          [2, "Charmander", "Fuego", 52],
          [3, "Bulbasaur", "Planta", 49],
        ],
        highlightCols: [1, 3],
        caption: "SELECT nombre, poder → solo vemos nombre y poder.",
      },
      {
        type: "highlight-rows",
        emoji: <Filter className="w-12 h-12" />,
        headline: "WHERE filtra filas",
        lead: "WHERE es como una linterna: solo deja pasar las filas que cumplen la condición.",
        tableTitle: "pokemones",
        columns: ["id", "nombre", "tipo", "poder"],
        rows: [
          [1, "Pikachu", "Eléctrico", 55],
          [2, "Charmander", "Fuego", 52],
          [3, "Bulbasaur", "Planta", 49],
          [4, "Squirtle", "Agua", 48],
        ],
        highlightRows: [0, 2],
        code: "SELECT * FROM pokemones\nWHERE poder > 50;",
        caption: "Solo los pokemones con poder mayor a 50.",
      },
      {
        type: "highlight-rows",
        emoji: <ArrowDownNarrowWide className="w-12 h-12" />,
        headline: "ORDER BY ordena",
        lead: "ORDER BY acomoda los resultados. ASC = de menor a mayor, DESC = de mayor a menor.",
        tableTitle: "resultado",
        columns: ["nombre", "poder"],
        rows: [
          ["Pikachu", 55],
          ["Charmander", 52],
          ["Bulbasaur", 49],
          ["Squirtle", 48],
        ],
        caption: "ORDER BY poder DESC → los más fuertes arriba.",
        code: "SELECT nombre, poder\nFROM pokemones\nORDER BY poder DESC;",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡A practicar!",
        lead: "Ya conoces las tres herramientas más importantes de SQL:",
        checklist: [
          "SELECT para elegir columnas.",
          "WHERE para filtrar filas.",
          "ORDER BY para ordenar el resultado.",
        ],
      },
    ],
  },

  "3": {
    title: "JOINs: une dos tablas",
    subtitle: "Cuando la información vive en varias cajas",
    color: "from-fuchsia-500 to-indigo-700",
    slides: [
      {
        type: "hero",
        emoji: <GitMerge className="w-12 h-12" />,
        headline: "A veces un dato vive en dos tablas",
        lead: "Ejemplo: la tabla pokemones guarda nombres y la tabla ataques guarda movimientos. Para saber qué ataque tiene cada pokémon hay que unirlas.",
        bullets: [
          "Las dos tablas comparten una pista (normalmente un id).",
          "JOIN conecta esa pista para mezclar la información.",
        ],
      },
      {
        type: "two-tables",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "Tabla 1: pokemones",
        lead: "Y tabla 2: ataques. Ambas tienen la columna 'id_pokemon' en común.",
        left: {
          title: "pokemones",
          columns: ["id", "nombre"],
          rows: [[1, "Pikachu"], [2, "Charmander"]],
        },
        right: {
          title: "ataques",
          columns: ["id_pokemon", "movimiento"],
          rows: [[1, "Impactrueno"], [2, "Ascuas"]],
        },
      },
      {
        type: "merge",
        emoji: <GitMerge className="w-12 h-12" />,
        headline: "INNER JOIN las combina",
        lead: "INNER JOIN trae las filas donde la pista coincide en ambas tablas.",
        code: "SELECT p.nombre, a.movimiento\nFROM pokemones p\nINNER JOIN ataques a\n  ON p.id = a.id_pokemon;",
        result: {
          title: "resultado",
          columns: ["nombre", "movimiento"],
          rows: [["Pikachu", "Impactrueno"], ["Charmander", "Ascuas"]],
        },
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Listo para la acción!",
        lead: "Los JOINs son el superpoder para trabajar con datos reales.",
        checklist: [
          "Sabes que las tablas se conectan con una columna común.",
          "INNER JOIN trae coincidencias.",
          "Ahora a probarlo en la misión.",
        ],
      },
    ],
  },
};

// Fallback genérico para niveles 4, 5+ que todavía no tengan teoría propia
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

export const LevelTheory = ({ levelId, onComplete }) => {
  const theory = LEVELS[String(levelId)] || FALLBACK;
  const [index, setIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const slide = theory.slides[index];
  const total = theory.slides.length;
  const isLast = index === total - 1;

  const speak = () => {
    if (isMuted) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = `${slide.headline}. ${slide.lead || ''}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 0.95;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
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
              Saltar teoría →
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
            key={index}
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
