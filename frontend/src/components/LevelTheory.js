import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { DagonMascot } from './DagonMascot';
import {
  ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, Rocket,
  Library, Grid3x3, MessageSquare, Search, Filter, ArrowDownNarrowWide, GitMerge, Database, Shield, Zap
} from 'lucide-react';

/* ============================================================
   CONTENIDO POR NIVEL — La Senda del Arquitecto
   ============================================================ */

const LEVELS = {
  "1": {
    title: "Conociendo a la Bestia",
    subtitle: "Anatomía y Lectura de Datos",
    color: "from-cyan-500 to-blue-700",
    slides: [
      {
        type: "hero",
        emoji: <Library className="w-12 h-12" />,
        headline: "Bienvenido al Archivero Infinito",
        lead: "Una base de datos (como PostgreSQL) no es magia, es un archivero digital masivo y perfectamente estructurado.",
        bullets: [
          "Toda la información se organiza en 'Tablas' (como hojas de cálculo de Excel).",
          "Las Columnas definen qué tipo de dato guardas (ej. nombre, nivel).",
          "Las Filas son los registros reales (ej. el aventurero 'Aldo').",
        ],
      },
      {
        type: "table",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "Tu primera tabla: Aventureros",
        lead: "Así se ve la información estructurada en el abismo.",
        tableTitle: "aventureros",
        columns: ["id_aventurero", "nombre", "clase", "nivel"],
        rows: [
          [1, "Loya", "Caballero", 15],
          [2, "Zoe", "Maga Suprema", 20],
          [3, "Aldo", "Guerrero", 30],
        ],
        caption: "Esta tabla tiene 4 columnas. Cada fila representa a un héroe único.",
      },
      {
        type: "chat",
        emoji: <MessageSquare className="w-12 h-12" />,
        headline: "SQL es tu voz de mando",
        lead: "Para sacar información del archivero, usamos SQL (Structured Query Language). Es como darle órdenes a un bibliotecario.",
        chat: [
          { from: "tu", text: "Tráeme todos los nombres de los aventureros que sean nivel 30." },
          { from: "db", text: "Procesando... Encontré 1 registro: Aldo." },
        ],
        code: "SELECT nombre FROM aventureros WHERE nivel = 30;",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡Despierta a la bestia!",
        lead: "En tu primera misión usarás SELECT, WHERE, y COUNT para extraer información vital del gremio.",
        checklist: [
          "SELECT: Elige qué columnas quieres ver.",
          "WHERE: Filtra las filas como un francotirador.",
          "ORDER BY: Acomoda tus resultados.",
        ],
      },
    ],
  },

  "2": {
    title: "Manipulación de Datos",
    subtitle: "El poder (y peligro) del CRUD",
    color: "from-emerald-500 to-cyan-600",
    slides: [
      {
        type: "hero",
        emoji: <Database className="w-12 h-12" />,
        headline: "Juega a ser un Dios",
        lead: "Leer datos está bien, pero un verdadero administrador sabe crear, alterar y destruir la información. A esto se le llama CRUD (Create, Read, Update, Delete).",
        code: "INSERT INTO aventureros (nombre, clase) \nVALUES ('Gimli', 'Guerrero');",
        codeLabel: "Creación (Insertar)",
      },
      {
        type: "highlight-rows",
        emoji: <Zap className="w-12 h-12" />,
        headline: "UPDATE: Alterando el destino",
        lead: "Cuando un héroe sube de nivel, debemos actualizar su registro. ¡Pero cuidado! Si olvidas usar el WHERE, modificarás a TODOS los héroes a la vez.",
        tableTitle: "aventureros (después del UPDATE)",
        columns: ["id", "nombre", "nivel"],
        rows: [
          [1, "Loya", 20],
          [2, "Zoe", 20],
          [3, "Aldo", 30],
        ],
        highlightRows: [0],
        code: "UPDATE aventureros SET nivel = 20 \nWHERE nombre = 'Loya';",
        caption: "Solo el nivel de Loya fue alterado.",
      },
      {
        type: "highlight-rows",
        emoji: <Shield className="w-12 h-12" />,
        headline: "DELETE: El abismo no perdona",
        lead: "Borrar un registro es permanente. Al igual que el UPDATE, un DELETE sin la cláusula WHERE vaciará tu tabla entera.",
        tableTitle: "aventureros",
        columns: ["id", "nombre", "clase"],
        rows: [
          [1, "Loya", "Caballero"],
          [2, "Zoe", "Maga Suprema"],
          [3, "Aldo", "Guerrero"],
        ],
        highlightRows: [1, 2],
        code: "DELETE FROM aventureros \nWHERE nombre = 'Loya';",
        caption: "El registro 1 ha sido borrado del sistema.",
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "¡A ensuciarse las manos!",
        lead: "Es hora de alterar la base de datos real del Sandbox.",
        checklist: [
          "Usa INSERT para reclutar nuevos guerreros.",
          "Usa UPDATE + WHERE para fortalecerlos.",
          "Usa DELETE + WHERE para eliminar a los caídos.",
        ],
      },
    ],
  },

  "3": {
    title: "El Arquitecto y los Vínculos",
    subtitle: "Conectando la información",
    color: "from-fuchsia-500 to-indigo-700",
    slides: [
      {
        type: "hero",
        emoji: <GitMerge className="w-12 h-12" />,
        headline: "El problema de tener todo en un solo lugar",
        lead: "Si guardas los aventureros y todas las pociones que compran en una misma tabla, tendrías un desastre de datos repetidos. La solución: Dividir y Conectar.",
        bullets: [
          "Las Bases de Datos Relacionales separan las Entidades (ej. una tabla de Usuarios, otra de Productos).",
          "Luego, usan 'Llaves' para conectar una tabla con otra.",
        ],
      },
      {
        type: "two-tables",
        emoji: <Grid3x3 className="w-12 h-12" />,
        headline: "Llaves Primarias y Foráneas",
        lead: "El id_aventurero (Llave Primaria) en la tabla izquierda, se usa como puente (Llave Foránea) en la tabla derecha.",
        left: {
          title: "aventureros",
          columns: ["id_aventurero", "nombre"],
          rows: [[1, "Loya"], [3, "Aldo"]],
        },
        right: {
          title: "equipamiento",
          columns: ["id_equipo", "id_aventurero", "item"],
          rows: [[101, 1, "Escudo"], [102, 3, "Hacha"]],
        },
      },
      {
        type: "merge",
        emoji: <GitMerge className="w-12 h-12" />,
        headline: "INNER JOIN: Cruzando el puente",
        lead: "El comando JOIN sigue esa llave para mezclar visualmente los datos de ambas tablas en un solo reporte.",
        code: "SELECT a.nombre, e.item \nFROM aventureros a \nINNER JOIN equipamiento e \n  ON a.id_aventurero = e.id_aventurero;",
        result: {
          title: "resultado (Reporte final)",
          columns: ["nombre", "item"],
          rows: [["Loya", "Escudo"], ["Aldo", "Hacha"]],
        },
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Conviértete en el tejedor de datos",
        lead: "En este módulo demostrarás que puedes navegar entre múltiples tablas.",
        checklist: [
          "Comprende el poder del INNER JOIN.",
          "Combina filtros (WHERE) con tablas conectadas.",
          "Agrupa totales matemáticos combinando JOIN y SUM().",
        ],
      },
    ],
  },

  "4": {
    title: "La Prueba de Dagon",
    subtitle: "El reto final de arquitectura",
    color: "from-orange-500 to-rose-700",
    slides: [
      {
        type: "hero",
        emoji: <Database className="w-12 h-12" />,
        headline: "El Lienzo en Blanco",
        lead: "Llegaste a la cima. Ya no vas a consultar tablas hechas por alguien más. Vas a diseñar tu propia estructura desde cero.",
        bullets: [
          "Diseñarás el Modelo Entidad-Relación (MER).",
          "Conectarás las tablas visualmente usando nuestro motor de arquitectura.",
          "Extraerás los datos de tu propia creación.",
        ],
      },
      {
        type: "ready",
        emoji: <Rocket className="w-12 h-12" />,
        headline: "Demuestra lo que vales",
        lead: "Dagon te observa. Diseña el diagrama y sobrevive a la prueba final para obtener tu certificación de Arquitecto.",
        checklist: [
          "Identifica las Entidades correctas.",
          "Asigna las llaves PK y FK.",
          "Construye el puente perfecto.",
        ],
      },
    ],
  }
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

export const LevelTheory = ({ levelId, onComplete }) => {
  const theory = LEVELS[String(levelId)] || FALLBACK;
  const [index, setIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const slide = theory.slides[index];
  const total = theory.slides.length;
  const isLast = index === total - 1;

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
    
    // prepar voices
    const prepareVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => v.lang.includes('es')) || voices[0];
      return spanishVoice;
    };
    
    let fullText = `${slide.headline}. ${slide.lead || ''}`;
    if (slide.bullets) {
      fullText += '. ' + slide.bullets.map(b => b).join('. ');
    }
    if (slide.code) {
      fullText += `. Código: ${slide.code.replace(/\n/g, ' ')}`;
    }
    if (slide.caption) {
      fullText += `. ${slide.caption}`;
    }
    if (slide.chat) {
      slide.chat.forEach(c => { fullText += `. ${c.from} dice: ${c.text}`; });
    }
    
    window.speechSynthesis.cancel();
    
    // load voices first
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        const u = new SpeechSynthesisUtterance(fullText);
        u.lang = 'es-ES';
        u.rate = 0.9;
        u.pitch = 1.1;
        u.voice = prepareVoice();
        u.onstart = () => setIsSpeaking(true);
        u.onend = () => setIsSpeaking(false);
        u.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
      }, { once: true });
    } else {
      const u = new SpeechSynthesisUtterance(fullText);
      u.lang = 'es-ES';
      u.rate = 0.9;
      u.pitch = 1.1;
      u.voice = prepareVoice();
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(u);
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