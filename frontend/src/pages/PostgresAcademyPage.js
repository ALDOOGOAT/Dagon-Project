import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  FileJson,
  Gauge,
  GitBranch,
  History,
  KeyRound,
  Layers,
  Play,
  Search,
  Server,
  Shield,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { DagonMascot } from '../components/DagonMascot';
import { useTheme } from '../contexts/ThemeContext';
import { sounds } from '../lib/SoundEngine';

const CHAPTERS = [
  {
    id: 'origen',
    label: 'Origen',
    icon: History,
    title: 'De Berkeley al mundo real',
    mood: 'thinking',
    accent: 'historia',
    narration:
      'PostgreSQL nació de POSTGRES, un proyecto de investigación en la Universidad de California en Berkeley. Su idea central fue construir un motor relacional extensible, confiable y preparado para datos complejos.',
    bullets: [
      'POSTGRES inició en los años ochenta bajo la dirección de Michael Stonebraker.',
      'PostgreSQL agregó SQL como lenguaje principal y mantuvo una cultura fuerte de software libre.',
      'Su reputación viene de cumplir estándares, cuidar la integridad y permitir extensiones.'
    ],
    codeLabel: 'identidad.sql',
    code: `SELECT version();\nSHOW server_version;\nSHOW standard_conforming_strings;`
  },
  {
    id: 'porque',
    label: 'Por que',
    icon: Shield,
    title: 'Un motor pensado para datos serios',
    mood: 'determined',
    accent: 'confiabilidad',
    narration:
      'PostgreSQL se usa cuando los datos importan. Ofrece transacciones ACID, claves foraneas, constraints, vistas, funciones, indices avanzados y herramientas para analizar rendimiento.',
    bullets: [
      'Es una gran opcion para LMS, ERPs, fintech, dashboards, APIs, reportes y analitica.',
      'Soporta datos relacionales, JSONB, busqueda textual, geodatos mediante PostGIS y extensiones.',
      'Brilla cuando necesitas reglas fuertes, consultas complejas y evolucion controlada del esquema.'
    ],
    codeLabel: 'reglas.sql',
    code: `ALTER TABLE usuarios\nADD CONSTRAINT email_unico UNIQUE (email);\n\nALTER TABLE progreso\nADD CONSTRAINT progreso_xp_valido CHECK (xp >= 0);`
  },
  {
    id: 'modelo',
    label: 'Modelo',
    icon: Database,
    title: 'Tablas, relaciones y significado',
    mood: 'happy',
    accent: 'modelo relacional',
    narration:
      'Aprender PostgreSQL no es memorizar comandos. Es aprender a modelar informacion: entidades, relaciones, restricciones y consultas que responden preguntas reales.',
    bullets: [
      'Una tabla representa una entidad del sistema.',
      'Las claves primarias identifican filas; las claves foraneas conectan tablas.',
      'Las consultas convierten datos guardados en respuestas utiles para una persona.'
    ],
    codeLabel: 'modelo.sql',
    code: `CREATE TABLE modulos (\n  id_modulo integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  titulo text NOT NULL,\n  xp_requerida integer NOT NULL DEFAULT 0\n);`
  },
  {
    id: 'flujo',
    label: 'Flujo',
    icon: GitBranch,
    title: 'El ciclo mental de una consulta',
    mood: 'excited',
    accent: 'consulta',
    narration:
      'Una consulta tiene flujo: eliges columnas, eliges tablas, conectas relaciones, filtras, agrupas, ordenas y limitas. PostgreSQL ejecuta ese plan con ayuda del optimizador.',
    bullets: [
      'SELECT define que quieres ver.',
      'FROM y JOIN definen de donde salen los datos.',
      'WHERE, GROUP BY, HAVING, ORDER BY y LIMIT moldean la respuesta final.'
    ],
    codeLabel: 'consulta.sql',
    code: `SELECT u.nombre, COUNT(e.id_ejercicio) AS resueltos\nFROM usuarios u\nJOIN ejercicios_resueltos e ON e.id_usuario = u.id_usuario\nWHERE u.activo = true\nGROUP BY u.nombre\nORDER BY resueltos DESC\nLIMIT 10;`
  }
];

const COMMAND_TIERS = {
  basico: {
    label: 'Basico',
    icon: Terminal,
    colorHint: 'inicio',
    commands: [
      {
        name: 'SELECT',
        purpose: 'Leer columnas de una tabla.',
        detail: 'Es el punto de entrada para explorar datos sin modificarlos.',
        code: `SELECT nombre, xp\nFROM usuarios;`
      },
      {
        name: 'WHERE',
        purpose: 'Filtrar filas con condiciones.',
        detail: 'Permite convertir una tabla completa en una respuesta especifica.',
        code: `SELECT *\nFROM modulos\nWHERE xp_requerida <= 100;`
      },
      {
        name: 'ORDER BY',
        purpose: 'Ordenar resultados.',
        detail: 'Se usa para rankings, fechas recientes y vistas faciles de revisar.',
        code: `SELECT nombre, xp\nFROM usuarios\nORDER BY xp DESC;`
      },
      {
        name: 'INSERT RETURNING',
        purpose: 'Crear datos y recuperar lo creado.',
        detail: 'RETURNING es muy util en PostgreSQL para APIs y formularios.',
        code: `INSERT INTO cursos (titulo)\nVALUES ('PostgreSQL esencial')\nRETURNING id_curso, titulo;`
      },
      {
        name: 'UPDATE',
        purpose: 'Modificar filas existentes.',
        detail: 'Siempre debe ir con una condicion clara para evitar cambios masivos.',
        code: `UPDATE usuarios\nSET xp = xp + 20\nWHERE id_usuario = 7\nRETURNING nombre, xp;`
      }
    ]
  },
  medio: {
    label: 'Medio',
    icon: Layers,
    colorHint: 'relaciones',
    commands: [
      {
        name: 'JOIN',
        purpose: 'Unir tablas relacionadas.',
        detail: 'Es la base para responder preguntas que viven en mas de una tabla.',
        code: `SELECT u.nombre, m.titulo\nFROM usuarios u\nJOIN progreso p ON p.id_usuario = u.id_usuario\nJOIN modulos m ON m.id_modulo = p.id_modulo;`
      },
      {
        name: 'GROUP BY',
        purpose: 'Agrupar filas para calcular metricas.',
        detail: 'Funciona junto a COUNT, SUM, AVG, MIN y MAX.',
        code: `SELECT id_modulo, COUNT(*) AS intentos\nFROM intentos_sql\nGROUP BY id_modulo;`
      },
      {
        name: 'HAVING',
        purpose: 'Filtrar grupos despues de agrupar.',
        detail: 'WHERE filtra filas; HAVING filtra resultados agregados.',
        code: `SELECT id_usuario, COUNT(*) AS resueltos\nFROM ejercicios_resueltos\nGROUP BY id_usuario\nHAVING COUNT(*) >= 5;`
      },
      {
        name: 'CTE',
        purpose: 'Nombrar una consulta temporal.',
        detail: 'Hace consultas largas mas legibles y faciles de mantener.',
        code: `WITH ranking AS (\n  SELECT nombre, xp, RANK() OVER (ORDER BY xp DESC) AS lugar\n  FROM usuarios\n)\nSELECT * FROM ranking WHERE lugar <= 10;`
      },
      {
        name: 'ON CONFLICT',
        purpose: 'Insertar o actualizar sin duplicar.',
        detail: 'Es ideal para sincronizaciones y progreso por usuario.',
        code: `INSERT INTO progreso_usuario (id_usuario, id_modulo, xp)\nVALUES (7, 3, 20)\nON CONFLICT (id_usuario, id_modulo)\nDO UPDATE SET xp = progreso_usuario.xp + EXCLUDED.xp;`
      }
    ]
  },
  avanzado: {
    label: 'Avanzado',
    icon: Gauge,
    colorHint: 'optimizacion',
    commands: [
      {
        name: 'EXPLAIN ANALYZE',
        purpose: 'Ver como PostgreSQL ejecuta una consulta.',
        detail: 'Ayuda a encontrar consultas lentas y decisiones del optimizador.',
        code: `EXPLAIN (ANALYZE, BUFFERS)\nSELECT *\nFROM usuarios\nWHERE email ILIKE '%@correo.com';`
      },
      {
        name: 'INDEX',
        purpose: 'Acelerar busquedas frecuentes.',
        detail: 'Un indice correcto mejora lecturas; demasiados indices encarecen escrituras.',
        code: `CREATE INDEX idx_usuarios_email\nON usuarios (email);`
      },
      {
        name: 'JSONB',
        purpose: 'Guardar datos flexibles con operadores consultables.',
        detail: 'Es util cuando parte del dato cambia mucho, sin abandonar PostgreSQL.',
        code: `SELECT perfil->>'pais' AS pais\nFROM usuarios\nWHERE perfil @> '{"rol": "alumno"}'::jsonb;`
      },
      {
        name: 'WINDOW FUNCTIONS',
        purpose: 'Calcular rankings y acumulados sin perder filas.',
        detail: 'Permiten analisis avanzado sin colapsar resultados como GROUP BY.',
        code: `SELECT nombre, xp,\n       DENSE_RANK() OVER (ORDER BY xp DESC) AS liga\nFROM usuarios;`
      },
      {
        name: 'TRANSACCIONES',
        purpose: 'Controlar cambios como una unidad segura.',
        detail: 'BEGIN, COMMIT, ROLLBACK y SAVEPOINT protegen operaciones sensibles.',
        code: `BEGIN;\nUPDATE usuarios SET xp = xp + 50 WHERE id_usuario = 7;\nSAVEPOINT revision;\nDELETE FROM intentos_sql WHERE id_usuario = 7;\nROLLBACK TO revision;\nCOMMIT;`
      }
    ]
  }
};

const USE_CASES = [
  { icon: Server, label: 'APIs con reglas fuertes', text: 'Usuarios, pagos, permisos y progreso necesitan consistencia.' },
  { icon: FileJson, label: 'Datos hibridos', text: 'JSONB permite flexibilidad sin cambiar de motor.' },
  { icon: Search, label: 'Busqueda y analisis', text: 'Indices, vistas y EXPLAIN ayudan a escalar consultas.' },
  { icon: KeyRound, label: 'Seguridad', text: 'Roles, permisos y transacciones hacen controlable el acceso.' }
];

const getTierKeys = () => Object.keys(COMMAND_TIERS);

export const PostgresAcademyPage = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const [chapterIndex, setChapterIndex] = useState(0);
  const [tierKey, setTierKey] = useState('basico');
  const [commandIndex, setCommandIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const speechRef = useRef(null);
  const chapter = CHAPTERS[chapterIndex];
  const tier = COMMAND_TIERS[tierKey];
  const command = tier.commands[commandIndex] || tier.commands[0];
  const ChapterIcon = chapter.icon;
  const TierIcon = tier.icon;

  const panelStyle = useMemo(() => ({
    borderColor: colors.border,
    backgroundColor: isLight ? 'rgba(255, 250, 240, 0.84)' : 'rgba(15, 23, 42, 0.72)',
    color: colors.text,
    boxShadow: isLight
      ? `0 30px 90px -48px ${colors.primary}66`
      : '0 28px 80px -44px rgba(0,0,0,0.72)'
  }), [colors, isLight]);

  const softPanelStyle = useMemo(() => ({
    borderColor: isLight ? `${colors.primary}24` : 'rgba(255,255,255,0.08)',
    backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(2,6,23,0.42)'
  }), [colors, isLight]);

  const codeStyle = useMemo(() => ({
    borderColor: isLight ? `${colors.primary}33` : 'rgba(34,211,238,0.18)',
    backgroundColor: isLight ? '#2a2118' : '#020617',
    color: isLight ? '#ffe8bd' : '#a7f3d0'
  }), [colors, isLight]);

  useEffect(() => {
    sounds.init();
    return () => {
      sounds.stopSpeech();
    };
  }, []);

  useEffect(() => {
    const syncSoundState = (event) => {
      const enabled = event?.detail?.enabled ?? sounds.isEnabled();
      if (!enabled) {
        setIsMuted(true);
        sounds.stopSpeech();
      } else {
        setIsMuted(false);
      }
    };

    window.addEventListener('dagon:soundchange', syncSoundState);
    syncSoundState();
    return () => window.removeEventListener('dagon:soundchange', syncSoundState);
  }, []);

  useEffect(() => {
    setCommandIndex(0);
  }, [tierKey]);

  useEffect(() => {
    if (!isMuted && chapter?.narration) {
      sounds.speakTTS(chapter.narration);
    }
    return () => sounds.stopSpeech();
  }, [chapter, isMuted]);

  const speak = () => {
    if (!chapter?.narration) return;
    if (!sounds.isEnabled()) {
      sounds.setEnabled(true, { restart: false });
      sounds.init();
    }
    setIsMuted(false);
    sounds.speakTTS(chapter.narration);
  };

  const stopVoice = () => {
    sounds.setEnabled(false);
    sounds.stopSpeech();
    setIsMuted(true);
  };

  const goToChapter = (nextIndex) => {
    const normalized = (nextIndex + CHAPTERS.length) % CHAPTERS.length;
    setChapterIndex(normalized);
    sounds.stopSpeech();
    sounds.playStep();
  };

  const goToCommand = (nextIndex) => {
    const normalized = (nextIndex + tier.commands.length) % tier.commands.length;
    setCommandIndex(normalized);
    sounds.playClick();
  };

  return (
    <div className="min-h-screen" data-testid="postgres-academy-page">
      <div className="dagon-page-shell dagon-page-shell--wide">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="self-start"
            style={{ color: colors.textMuted }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {getTierKeys().map((key) => {
              const item = COMMAND_TIERS[key];
              const ItemIcon = item.icon;
              const active = key === tierKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTierKey(key)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-display font-black transition-all"
                  style={{
                    borderColor: active ? colors.primary : colors.border,
                    color: active ? (isLight ? '#fffaf0' : '#ffffff') : colors.text,
                    background: active
                      ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                      : (isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.72)'),
                    boxShadow: active ? `0 18px 44px -28px ${colors.primary}` : undefined
                  }}
                >
                  <ItemIcon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border p-5 sm:p-7 lg:p-10 dagon-compact-card"
          style={panelStyle}
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }}
          />
          <div className="absolute inset-0 pointer-events-none opacity-70" style={{
            background: isLight
              ? `linear-gradient(135deg, rgba(255,255,255,0.72), ${colors.surfaceAlt}55, transparent)`
              : `linear-gradient(135deg, ${colors.primary}16, transparent 48%, ${colors.secondary}12)`
          }} />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[0.85fr_1.15fr] xl:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.28em]" style={{
                color: colors.primary,
                borderColor: `${colors.primary}33`,
                backgroundColor: isLight ? 'rgba(255,255,255,0.74)' : 'rgba(255,255,255,0.05)'
              }}>
                <Database className="h-4 w-4" />
                Academia PostgreSQL
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border" style={{
                      borderColor: `${colors.primary}33`,
                      background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}16)`
                    }}>
                      <ChapterIcon className="h-7 w-7" style={{ color: colors.primary }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: colors.textMuted }}>
                        {chapter.accent}
                      </p>
                      <h1 className="mt-2 font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl" style={{ color: colors.text }}>
                        {chapter.title}
                      </h1>
                    </div>
                  </div>

                  <p className="max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: colors.textMuted }}>
                    {chapter.narration}
                  </p>

                  <div className="grid gap-3">
                    {chapter.bullets.map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border p-3" style={softPanelStyle}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: colors.primary }} />
                        <span className="text-sm leading-relaxed" style={{ color: colors.text }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => goToChapter(chapterIndex - 1)}
                  className="rounded-2xl border"
                  style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.74)' : colors.surface, borderColor: colors.border, color: colors.text }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  onClick={() => goToChapter(chapterIndex + 1)}
                  className="rounded-2xl text-white"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                >
                  Siguiente escena
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={isMuted ? speak : stopVoice}
                  variant="ghost"
                  className="rounded-2xl"
                  style={{ color: colors.textMuted }}
                >
                  {isMuted ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                  {isMuted ? 'Narrar' : 'Silenciar'}
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border p-4 sm:p-5" style={softPanelStyle}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-full blur-2xl" style={{ backgroundColor: `${colors.primary}22` }} />
                      <div className="relative">
                        <DagonMascot size="medium" mood={chapter.mood} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: colors.primary }}>
                        Dagon explica
                      </p>
                      <p className="text-sm" style={{ color: colors.textMuted }}>
                        Escena {chapterIndex + 1} de {CHAPTERS.length}
                      </p>
                    </div>
                  </div>
                  <Sparkles className="h-5 w-5" style={{ color: colors.accent }} />
                </div>

                <div className="overflow-hidden rounded-2xl border" style={codeStyle}>
                  <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: isLight ? 'rgba(255,232,189,0.14)' : 'rgba(255,255,255,0.08)' }}>
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: isLight ? '#ffd28e' : '#94a3b8' }}>
                      {chapter.codeLabel}
                    </span>
                  </div>
                  <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                    <code>{chapter.code}</code>
                  </pre>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {USE_CASES.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border p-3" style={softPanelStyle}>
                      <ItemIcon className="mb-2 h-5 w-5" style={{ color: colors.primary }} />
                      <p className="text-sm font-display font-black" style={{ color: colors.text }}>{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: colors.textMuted }}>{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-[28px] border p-5 sm:p-6 dagon-compact-card"
            style={panelStyle}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: colors.primary }}>
                  Comandos PostgreSQL
                </p>
                <h2 className="mt-2 font-display text-2xl font-black" style={{ color: colors.text }}>
                  Ruta {tier.label.toLowerCase()}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{
                borderColor: `${colors.primary}33`,
                backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.06)'
              }}>
                <TierIcon className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
            </div>

            <div className="space-y-3">
              {tier.commands.map((item, index) => {
                const active = index === commandIndex;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCommandIndex(index)}
                    className="w-full rounded-2xl border p-4 text-left transition-all"
                    style={{
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active
                        ? (isLight ? `${colors.primary}18` : `${colors.primary}1f`)
                        : (isLight ? 'rgba(255,255,255,0.64)' : 'rgba(15,23,42,0.52)'),
                      color: colors.text
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-black">{item.name}</span>
                      {active && <Play className="h-4 w-4" style={{ color: colors.primary }} />}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                      {item.purpose}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-[28px] border p-5 sm:p-6 dagon-compact-card"
            style={panelStyle}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${tierKey}-${command.name}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.24 }}
                className="space-y-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: colors.accent }}>
                      {tier.colorHint}
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-black" style={{ color: colors.text }}>
                      {command.name}
                    </h3>
                    <p className="mt-2 max-w-2xl text-base leading-relaxed" style={{ color: colors.textMuted }}>
                      {command.detail}
                    </p>
                  </div>
                  <Code2 className="h-8 w-8 shrink-0" style={{ color: colors.primary }} />
                </div>

                <div className="overflow-hidden rounded-2xl border" style={codeStyle}>
                  <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: isLight ? 'rgba(255,232,189,0.14)' : 'rgba(255,255,255,0.08)' }}>
                    <span className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: isLight ? '#ffd28e' : '#94a3b8' }}>
                      practica.sql
                    </span>
                    <Terminal className="h-4 w-4" style={{ color: isLight ? '#ffd28e' : colors.accent }} />
                  </div>
                  <pre className="overflow-x-auto p-4 text-sm leading-relaxed sm:text-base">
                    <code>{command.code}</code>
                  </pre>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => goToCommand(commandIndex - 1)}
                    className="rounded-2xl border"
                    style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : colors.surface, borderColor: colors.border, color: colors.text }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior comando
                  </Button>
                  <Button
                    onClick={() => goToCommand(commandIndex + 1)}
                    className="rounded-2xl text-white"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                  >
                    Siguiente comando
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </section>
      </div>
    </div>
  );
};
