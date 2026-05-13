import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { DagonMascot } from './DagonMascot';
import { sounds } from '../lib/SoundEngine';
import { getModuleCinematic } from '../data/moduleCinematics';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Database,
  Eye,
  Film,
  Filter,
  GitBranch,
  KeyRound,
  Layers,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Search,
  Shield,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';

const MODULE_THEMES = [
  {
    match: /(SELECT|FROM|PROYECCION|CONSULTA|LECTURA)/i,
    title: 'Leer datos sin miedo',
    visual: Database,
    color: 'from-cyan-500 to-blue-600',
    script: 'SQL empieza con una pregunta sencilla: que dato quieres ver y de donde sale. En esta misión vas a practicar esa lectura paso a paso.'
  },
  {
    match: /(WHERE|FILTRO|CONDICION|LIKE|BETWEEN|ORDER|DISTINCT)/i,
    title: 'Encontrar la fila correcta',
    visual: Shield,
    color: 'from-amber-500 to-orange-600',
    script: 'Filtrar no es escribir mas codigo: es decirle a la base de datos que reglas debe cumplir una fila para aparecer en la respuesta.'
  },
  {
    match: /(JOIN|RELACION|CLAVE|FOREIGN|FORANEA)/i,
    title: 'Conectar tablas',
    visual: Layers,
    color: 'from-violet-500 to-fuchsia-600',
    script: 'Cuando la informacion vive en varias tablas, JOIN permite unir piezas relacionadas. La clave es entender que columna conecta una tabla con otra.'
  },
  {
    match: /(GROUP|COUNT|SUM|AVG|HAVING|AGREG)/i,
    title: 'Convertir datos en resumen',
    visual: Sparkles,
    color: 'from-emerald-500 to-teal-600',
    script: 'Agrupar significa pasar de muchas filas a una respuesta compacta: conteos, promedios, maximos o totales que explican lo que esta ocurriendo.'
  },
  {
    match: /(INSERT|UPDATE|DELETE|RETURNING|TRANSAC|COMMIT|ROLLBACK)/i,
    title: 'Cambiar datos con responsabilidad',
    visual: Shield,
    color: 'from-rose-500 to-red-600',
    script: 'Modificar datos tiene consecuencias. En esta misión vas a practicar cambios seguros, revisar resultados y entender como recuperarte si algo sale mal.'
  },
  {
    match: /(CREATE|ALTER|TABLE|PRIMARY|UNIQUE|CHECK|MODELO|ENTIDAD)/i,
    title: 'Diseñar reglas para la base',
    visual: Database,
    color: 'from-sky-500 to-indigo-600',
    script: 'Modelar es decidir que datos existen y que reglas los protegen. Una buena tabla ayuda a que el sistema no acepte informacion incorrecta.'
  }
];

const DEFAULT_THEME = {
  title: 'Pensar como programador de datos',
  visual: Database,
  color: 'from-cyan-500 to-emerald-600',
  script: 'Antes de memorizar comandos, aprende a separar una pregunta en partes: datos, tablas, condiciones y resultado esperado.'
};

const VISUALS = {
  code: Code2,
  database: Database,
  diagram: GitBranch,
  filter: Filter,
  function: Sparkles,
  key: KeyRound,
  lock: Lock,
  metadata: Eye,
  relation: Layers,
  search: Search,
  sequence: KeyRound,
  set: Layers,
  shield: Shield,
  spark: Sparkles,
  target: CheckCircle2,
  time: Pause,
  trigger: Sparkles,
  view: Eye,
  warning: AlertTriangle,
};

const resolveVisual = (visual) => {
  if (typeof visual === 'function') return visual;
  return VISUALS[visual] || Database;
};

const buildModuleFocus = (exercises = []) => {
  const combined = exercises
    .map((exercise) => [exercise.title, exercise.description, exercise.hint, exercise.starterCode].filter(Boolean).join(' '))
    .join(' ');

  return MODULE_THEMES.find((theme) => theme.match.test(combined)) || DEFAULT_THEME;
};

const buildScenes = ({ moduleId, exercises, focus }) => {
  const titles = exercises.slice(0, 4).map((exercise) => exercise.title).filter(Boolean);
  const practiceList = titles.length > 0
    ? titles.join(', ')
    : 'consultas guiadas, validación y corrección de errores';

  return [
    {
      kicker: `Módulo ${moduleId}`,
      title: focus.title,
      body: focus.script,
      prompt: 'Primero observa la idea, luego practica con calma.',
      mood: 'thinking'
    },
    {
      kicker: 'Mapa mental',
      title: 'Divide el problema antes de escribir',
      body: 'Todo ejercicio de SQL se puede separar en cuatro preguntas: que quieres ver, de donde sale, que condicion lo limita y como debe comprobarse el resultado.',
      prompt: 'No ejecutes por impulso: predice el resultado antes de validar.',
      mood: 'happy'
    },
    {
      kicker: 'Temas de esta misión',
      title: 'Lo que vas a practicar',
      body: `Este módulo incluye: ${practiceList}. Dagon te mostrará pistas progresivas si el primer intento no sale bien.`,
      prompt: 'Fallar no reinicia tu avance; cada error debe dejar una pista concreta.',
      mood: 'determined'
    },
    {
      kicker: 'Reto',
      title: 'Demuestra comprensión, no memoria',
      body: 'La meta es que puedas explicar cada palabra de tu consulta. Si puedes decir por que usaste SELECT, FROM, WHERE o JOIN, ya estas aprendiendo de verdad.',
      prompt: 'Cuando estes listo, entra a la teoría corta y luego al editor.',
      mood: 'excited'
    }
  ];
};

const parseMaybeJson = (value, fallback) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const asArray = (value) => {
  const parsed = parseMaybeJson(value, []);
  return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
};

const asObject = (value) => {
  const parsed = parseMaybeJson(value, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
};

const joinHuman = (items, fallback) => {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return fallback;
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(', ')} y ${clean[clean.length - 1]}`;
};

const pickCodeExample = (curatedScenes = [], exercises = []) => {
  const curatedCode = curatedScenes.find((item) => item.code)?.code;
  if (curatedCode) return curatedCode;

  const exerciseCode = exercises.find((exercise) => exercise.starterCode && !exercise.starterCode.includes('Escribe tu consulta'))?.starterCode;
  return exerciseCode || 'SELECT columnas\nFROM tabla\nWHERE condicion;';
};

const buildMetadataCheckpoint = ({ objetivos, erroresComunes, focus }) => ({
  question: 'Antes de entrar al editor, que debes cuidar en este modulo?',
  options: [
    {
      label: objetivos[0] || `Entender ${focus.title.toLowerCase()} antes de ejecutar.`,
      correct: true,
      feedback: 'Correcto. Primero entiende la intencion y luego escribe SQL.',
    },
    {
      label: erroresComunes[0] || 'Ejecutar por impulso sin revisar la condicion.',
      correct: false,
      feedback: 'Eso es justo lo que debes evitar. Usa el error como alerta antes de validar.',
    },
    {
      label: 'Memorizar la consulta sin poder explicarla.',
      correct: false,
      feedback: 'Memorizar ayuda poco si no puedes explicar que hace cada parte de la consulta.',
    },
  ],
});

const buildPedagogicalScenes = ({ moduleId, exercises, focus, curated, moduleMetadata }) => {
  const metadata = moduleMetadata || {};
  const objetivos = asArray(metadata.objetivos);
  const prerequisitos = asArray(metadata.prerequisitos);
  const erroresComunes = asArray(metadata.errores_comunes);
  const cinematicaConfig = asObject(metadata.cinematica_config);
  const baseScenes = curated?.scenes || buildScenes({ moduleId, exercises, focus });
  const firstScene = baseScenes[0] || {};
  const conceptScene = baseScenes[1] || firstScene;
  const exampleScene = baseScenes.find((item) => item.code) || baseScenes[2] || conceptScene;
  const checkpointData = curated?.checkpoint || buildMetadataCheckpoint({ objetivos, erroresComunes, focus });
  const sceneNames = asArray(cinematicaConfig.escenas);
  const moduleTitle = metadata.titulo || curated?.title || focus.title;
  const moduleDescription = metadata.descripcion || firstScene.body || focus.script;
  const objectiveText = joinHuman(objetivos.slice(0, 3), focus.script);
  const prereqText = joinHuman(prerequisitos.slice(0, 3), 'solo necesitas observar la tabla, leer con calma y probar paso a paso');
  const errorText = joinHuman(erroresComunes.slice(0, 2), 'ejecutar sin predecir el resultado');

  return [
    {
      ...firstScene,
      kicker: sceneNames[0] || 'Introducción',
      title: moduleTitle,
      body: moduleDescription,
      prompt: `Objetivo de aprendizaje: ${objectiveText}.`,
      visual: firstScene.visual || focus.visual,
      mood: firstScene.mood || 'happy',
      duration: firstScene.duration || 8200,
    },
    {
      ...conceptScene,
      kicker: sceneNames[1] || 'Concepto clave',
      title: conceptScene.title || 'La idea que debes entender',
      body: conceptScene.body || `Antes de escribir, conecta este modulo con lo que ya sabes: ${prereqText}.`,
      prompt: `Prerequisitos: ${prereqText}.`,
      visual: conceptScene.visual || focus.visual,
      mood: conceptScene.mood || 'thinking',
      duration: conceptScene.duration || 8400,
    },
    {
      ...exampleScene,
      kicker: sceneNames[2] || 'Ejemplo visual',
      title: exampleScene.title || 'Mira la idea convertida en SQL',
      body: exampleScene.body || 'El ejemplo no es para copiarlo: es para ver como una idea se convierte en una consulta verificable.',
      code: pickCodeExample(baseScenes, exercises),
      prompt: 'Lee el ejemplo de arriba hacia abajo: comando, tabla, condicion y resultado esperado.',
      visual: exampleScene.visual || 'code',
      mood: exampleScene.mood || 'determined',
      duration: exampleScene.duration || 9200,
    },
    {
      kicker: sceneNames[3] || 'Mini interacción',
      title: checkpointData.question,
      body: `Punto de atención: ${errorText}. Elige una respuesta y observa la retroalimentación antes de pasar al cierre.`,
      prompt: 'Esta interacción no busca castigarte; busca que detectes el error antes de llegar al editor.',
      visual: 'target',
      mood: 'thinking',
      duration: 11000,
      interaction: checkpointData,
    },
    {
      kicker: sceneNames[4] || 'Cierre',
      title: 'Listo para practicar con intención',
      body: `Al terminar este módulo debes poder ${objectiveText.toLowerCase()}. Si algo falla, vuelve a la cinemática o pide una pista progresiva.`,
      prompt: 'Puedes saltar, pausar o repetir esta cinemática cuando ya tengas claro el mapa mental.',
      visual: 'spark',
      mood: 'excited',
      duration: 7600,
    },
  ];
};

export const ModuleCinematic = ({ moduleId, moduleMetadata = null, exercises = [], onComplete }) => {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [muted, setMuted] = useState(() => !sounds.isEnabled());
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [interactionOption, setInteractionOption] = useState(null);
  const curated = useMemo(() => getModuleCinematic(moduleId), [moduleId]);
  const fallbackFocus = useMemo(() => buildModuleFocus(exercises), [exercises]);
  const focus = useMemo(() => {
    if (!curated) return fallbackFocus;
    return {
      title: curated.title,
      color: curated.accent || fallbackFocus.color,
      visual: curated.visual || fallbackFocus.visual,
      script: curated.subtitle || fallbackFocus.script,
    };
  }, [curated, fallbackFocus]);
  const scenes = useMemo(() => {
    return buildPedagogicalScenes({ moduleId, exercises, focus, curated, moduleMetadata });
  }, [curated, moduleId, moduleMetadata, exercises, focus]);
  const metadataObjetivos = useMemo(() => asArray(moduleMetadata?.objetivos), [moduleMetadata]);
  const metadataErrores = useMemo(() => asArray(moduleMetadata?.errores_comunes), [moduleMetadata]);
  const checkpoint = useMemo(() => curated?.checkpoint || buildMetadataCheckpoint({
    objetivos: metadataObjetivos,
    erroresComunes: metadataErrores,
    focus,
  }), [curated, focus, metadataErrores, metadataObjetivos]);
  const scene = scenes[sceneIndex];
  const isLast = sceneIndex === scenes.length - 1;
  const VisualIcon = resolveVisual(scene?.visual || focus.visual);
  const sceneDuration = scene?.duration || 7600;

  useEffect(() => {
    setSceneIndex(0);
    setProgress(0);
    setShowCheckpoint(false);
    setSelectedOption(null);
    setInteractionOption(null);
    setIsPlaying(true);
  }, [moduleId]);

  useEffect(() => {
    setProgress(0);
    setInteractionOption(null);
  }, [sceneIndex]);

  useEffect(() => {
    const syncSoundState = (event) => {
      const enabled = event?.detail?.enabled ?? sounds.isEnabled();
      setMuted(!enabled);
      if (!enabled) window.speechSynthesis?.cancel();
    };

    window.addEventListener('dagon:soundchange', syncSoundState);
    syncSoundState();
    return () => window.removeEventListener('dagon:soundchange', syncSoundState);
  }, []);

  useEffect(() => {
    sounds.playCinematicCue?.(scene?.sfx || curated?.ambient || 'mystic');
  }, [sceneIndex, scene?.sfx, curated?.ambient]);

  useEffect(() => {
    if (muted || showCheckpoint || !scene) return undefined;
    sounds.speakTTS(`${scene.title}. ${scene.body}`);
    return () => sounds.stopSpeech();
  }, [scene, muted, showCheckpoint]);

  useEffect(() => {
    if (!isPlaying || showCheckpoint || !scene) return undefined;

    const tickMs = 120;
    const interval = setInterval(() => {
      setProgress((current) => {
        const nextProgress = Math.min(100, current + (tickMs / sceneDuration) * 100);
        if (nextProgress >= 100) {
          clearInterval(interval);
          if (isLast) {
            window.speechSynthesis?.cancel();
            setShowCheckpoint(true);
            setIsPlaying(false);
          } else {
            setSceneIndex((currentScene) => currentScene + 1);
          }
        }
        return nextProgress;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [isPlaying, showCheckpoint, scene, sceneDuration, isLast]);

  const goNext = () => {
    sounds.playStep();
    if (isLast) {
      window.speechSynthesis?.cancel();
      setShowCheckpoint(true);
      setIsPlaying(false);
      return;
    }
    setProgress(0);
    setSceneIndex((current) => current + 1);
    setIsPlaying(true);
  };

  const skip = () => {
    sounds.playStep();
    window.speechSynthesis?.cancel();
    onComplete?.();
  };

  const toggleMute = () => {
    const enabled = sounds.toggleEnabled({ restart: false });
    setMuted(!enabled);
    if (!enabled) {
      window.speechSynthesis?.cancel();
    } else {
      sounds.init();
    }
  };

  const togglePlayback = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    if (next) {
      sounds.playSelect?.();
      if (sounds.speechAllowed()) window.speechSynthesis?.resume?.();
    } else {
      window.speechSynthesis?.pause?.();
    }
  };

  const repeatScene = () => {
    sounds.playSelect?.();
    setProgress(0);
    setIsPlaying(true);
    if (!muted && scene) {
      sounds.speakTTS(`${scene.title}. ${scene.body}`);
    }
  };

  const handleInteractionOption = (option) => {
    setInteractionOption(option);
    if (option.correct) sounds.playSuccess();
    else sounds.playSoftWarning?.();
  };

  const handleCheckpointOption = (option) => {
    setSelectedOption(option);
    if (option.correct) sounds.playSuccess();
    else sounds.playSoftWarning?.();
  };

  const completeFromCheckpoint = () => {
    sounds.playUnlock?.();
    window.speechSynthesis?.cancel();
    onComplete?.();
  };

  return (
    <div className="min-h-[calc(100vh-96px)] overflow-hidden relative flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className={`absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${focus.color} opacity-20 blur-3xl`}
          animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.16, 0.24, 0.16] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-cyan-400/30 bg-slate-950/50 px-4 py-2 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
            <Film className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.28em]">
              {curated ? `${curated.title} · video interactivo` : 'Cinemática interactiva'}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={togglePlayback}
              disabled={showCheckpoint}
              aria-label={isPlaying ? 'Pausar cinemática' : 'Continuar cinemática'}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3 text-xs font-bold uppercase tracking-widest text-slate-200 shadow-[0_0_18px_rgba(15,23,42,0.55)] transition hover:border-emerald-300/60 hover:text-white disabled:opacity-50"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pausa' : 'Reproducir'}
            </button>
            <button
              type="button"
              onClick={repeatScene}
              disabled={showCheckpoint}
              aria-label="Repetir escena actual"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3 text-xs font-bold uppercase tracking-widest text-slate-200 shadow-[0_0_18px_rgba(15,23,42,0.55)] transition hover:border-fuchsia-300/60 hover:text-white disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Repetir
            </button>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Activar audio de cinemática' : 'Silenciar cinemática'}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3 text-xs font-bold uppercase tracking-widest text-slate-200 shadow-[0_0_18px_rgba(15,23,42,0.55)] transition hover:border-cyan-300/60 hover:text-white"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {muted ? 'Silencio' : 'Audio'}
            </button>
            <button
              type="button"
              onClick={skip}
              aria-label="Saltar cinemática e ir al contenido"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-slate-950/70 px-3 text-xs font-bold uppercase tracking-widest text-slate-200 shadow-[0_0_18px_rgba(15,23,42,0.55)] transition hover:border-amber-300/60 hover:text-white"
            >
              <SkipForward className="w-4 h-4" />
              Saltar
            </button>
          </div>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full border border-white/10 bg-slate-900/80">
          <motion.div
            className={`h-full bg-gradient-to-r ${focus.color}`}
            animate={{ width: showCheckpoint ? '100%' : `${progress}%` }}
            transition={{ duration: 0.12 }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <motion.div
            className="relative min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.55)]"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${focus.color}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.16),transparent_38%)]" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
              <motion.div
                className={`mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/15 bg-gradient-to-br ${focus.color} shadow-[0_0_50px_rgba(34,211,238,0.25)]`}
                animate={{ y: [0, -8, 0], rotate: [0, 1.5, -1.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <VisualIcon className="w-14 h-14 text-white" />
              </motion.div>
              <DagonMascot size="large" mood={scene.mood} />
            </div>
          </motion.div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/75 p-5 sm:p-7 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
            <div className="mb-5 flex gap-2">
              {scenes.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    sounds.playStep();
                    setSceneIndex(index);
                    setShowCheckpoint(false);
                    setSelectedOption(null);
                    setInteractionOption(null);
                    setProgress(0);
                    setIsPlaying(true);
                  }}
                  className={`h-2 rounded-full transition-all ${index === sceneIndex ? 'w-14 bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]' : index < sceneIndex ? 'w-8 bg-emerald-400/80' : 'w-4 bg-slate-700'}`}
                  aria-label={`Escena ${index + 1}`}
                  aria-current={index === sceneIndex ? 'step' : undefined}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {showCheckpoint ? (
                <motion.div
                  key="checkpoint"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-[300px]"
                >
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.34em] text-emerald-300">
                    Punto de comprensión
                  </p>
                  <h1 className="font-display text-2xl font-black leading-tight text-white sm:text-4xl">
                    {checkpoint?.question || '¿Cuál es la idea principal del módulo?'}
                  </h1>
                  <div className="mt-6 grid gap-3">
                    {(checkpoint?.options || [{ label: 'Puedo explicar el objetivo antes de practicar.', correct: true, feedback: 'Listo para continuar.' }]).map((option) => {
                      const selected = selectedOption?.label === option.label;
                      const tone = selected && option.correct ? 'border-emerald-300 bg-emerald-500/15 text-emerald-100' : selected ? 'border-amber-300 bg-amber-500/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/50';
                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => handleCheckpointOption(option)}
                          aria-pressed={selected}
                          className={`rounded-2xl border p-4 text-left text-sm font-gameui transition ${tone}`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedOption && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4"
                    >
                      <p className="text-sm leading-relaxed text-cyan-100 font-gameui">
                        {selectedOption.feedback}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={sceneIndex}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="min-h-[300px]"
                >
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300">
                    {scene.kicker}
                  </p>
                  <h1 className="font-display text-3xl font-black leading-tight text-white sm:text-5xl">
                    {scene.title}
                  </h1>
                  <p className="mt-5 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                    Subtítulos
                  </p>
                  <p className="mt-2 text-base leading-relaxed text-slate-300 sm:text-lg font-gameui">
                    {scene.body}
                  </p>

                  {scene.code && (
                    <pre className="mt-5 overflow-x-auto rounded-2xl border border-cyan-400/20 bg-slate-950 p-4 text-sm text-emerald-300 shadow-[inset_0_0_24px_rgba(34,211,238,0.08)]">
                      <code>{scene.code}</code>
                    </pre>
                  )}

                  {scene.interaction?.options?.length > 0 && (
                    <div className="mt-5 grid gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                      {scene.interaction.options.map((option) => {
                        const selected = interactionOption?.label === option.label;
                        const tone = selected && option.correct ? 'border-emerald-300 bg-emerald-500/15 text-emerald-100' : selected ? 'border-amber-300 bg-amber-500/15 text-amber-100' : 'border-white/10 bg-white/5 text-slate-200 hover:border-cyan-300/50';
                        return (
                          <button
                            key={option.label}
                            type="button"
                            onClick={() => handleInteractionOption(option)}
                            aria-pressed={selected}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-gameui transition ${tone}`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                      {interactionOption && (
                        <p className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm leading-relaxed text-cyan-100">
                          {interactionOption.feedback}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 w-5 h-5 shrink-0 text-emerald-300" />
                      <p className="text-sm leading-relaxed text-emerald-100 font-gameui">
                        {scene.prompt}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
                {showCheckpoint ? 'Checkpoint final' : `Escena ${sceneIndex + 1}/${scenes.length}`}
              </p>
              <Button
                onClick={showCheckpoint ? completeFromCheckpoint : goNext}
                disabled={showCheckpoint && !selectedOption}
                className={`rounded-2xl bg-gradient-to-r ${focus.color} px-6 py-6 font-display font-black text-white shadow-[0_12px_30px_rgba(34,211,238,0.25)] hover:brightness-110`}
              >
                {showCheckpoint ? <Play className="w-4 h-4 fill-current" /> : isLast ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                {showCheckpoint ? 'Entrar a teoría' : isLast ? 'Responder checkpoint' : 'Siguiente escena'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
