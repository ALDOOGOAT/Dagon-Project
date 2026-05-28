import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Database,
  Trophy,
  Sparkles,
  BookOpen,
  Target,
  PlayCircle,
  User,
  Flame,
  Zap,
  Compass,
  HelpCircle,
  Monitor,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../lib/SoundEngine';

const tutorialSteps = [
  {
    id: 'intro',
    target: null,
    eyebrow: 'Prólogo',
    shot: 'Plano general',
    title: 'Dagon abre tu mapa de aprendizaje',
    content: 'Este recorrido funciona como un manual de usuario jugable. Dagon te va a señalar cada zona importante para que sepas dónde practicar, revisar tu avance y repetir el tutorial cuando lo necesites.',
    voice: 'Bienvenido a Dagon. Este recorrido es tu manual de usuario interactivo. Te voy a señalar las zonas importantes para que sepas practicar, avanzar y revisar tu progreso desde el primer minuto.',
    icon: Sparkles,
    mood: 'excited',
    cue: 'cinematic',
  },
  {
    id: 'header',
    target: 'header',
    eyebrow: 'Centro de mando',
    shot: 'Orientación',
    title: 'Aquí sabes en qué parte del viaje estás',
    content: 'La parte superior resume tu sesión actual. Desde aquí puedes reconocer tu cuenta, entrar al tour, controlar sonido, abrir tu perfil, cuidar tu racha y empezar una práctica rápida.',
    voice: 'Esta es tu zona de mando. Aquí encuentras el tour, el sonido, tu perfil, tu racha y la práctica rápida. Si te pierdes, vuelve a esta parte.',
    icon: Monitor,
    mood: 'happy',
    cue: 'focus',
  },
  {
    id: 'progress',
    target: 'progress',
    eyebrow: 'Progreso',
    shot: 'Perfil de aventura',
    title: 'Tu avance no es decorativo',
    content: 'Esta tarjeta muestra tu nivel, XP total, rango y estado de Dagon. Sirve para que veas si estás practicando con constancia y qué tan cerca estás del siguiente nivel.',
    voice: 'Tu avance vive aquí. Revisa tu nivel, experiencia total, rango y progreso al siguiente nivel para saber si vas construyendo dominio real.',
    icon: Trophy,
    mood: 'happy',
    cue: 'safe',
  },
  {
    id: 'stats',
    target: 'stats',
    eyebrow: 'Indicadores',
    shot: 'Lectura rápida',
    title: 'Estos accesos te dicen qué cuidar',
    content: 'Las tarjetas rápidas muestran racha, XP, ranking y rango. Úsalas como señales: si baja tu racha, entra a practicar; si sube tu XP, desbloqueas más contenido.',
    voice: 'Estas tarjetas son señales rápidas. La racha mide constancia, la experiencia mide práctica, el ranking compara avance y el rango reconoce tu nivel.',
    icon: Zap,
    mood: 'determined',
    cue: 'tick',
  },
  {
    id: 'courses',
    target: 'courses',
    eyebrow: 'Sendas',
    shot: 'Selección de ruta',
    title: 'Elige cómo quieres aprender SQL',
    content: 'Las sendas separan el aprendizaje por intención. Puedes iniciar desde misiones básicas o avanzar hacia rutas más arquitectónicas cuando ya entiendas la lógica.',
    voice: 'Aquí eliges tu senda. Cada ruta organiza los módulos con una intención distinta, desde lo básico hasta una comprensión más arquitectónica.',
    icon: Compass,
    mood: 'thinking',
    cue: 'switch',
  },
  {
    id: 'modules',
    target: 'modules',
    eyebrow: 'Misiones',
    shot: 'Mapa de niveles',
    title: 'Cada módulo es una misión completa',
    content: 'Entra desde las tarjetas de módulo. Las misiones bloqueadas te dicen cuánta XP necesitas. Las disponibles abren cinemática, teoría corta y ejercicios reales.',
    voice: 'Cada módulo es una misión. Si está bloqueado, necesitas más experiencia. Si está disponible, entrarás a cinemática, teoría y ejercicios reales.',
    icon: BookOpen,
    mood: 'excited',
    cue: 'challenge',
  },
  {
    id: 'daily-challenge',
    target: 'daily-challenge',
    eyebrow: 'Reto diario',
    shot: 'Presión sana',
    title: 'La práctica corta mantiene el hábito',
    content: 'El reto del día te da una entrada rápida cuando no tienes mucho tiempo. Resolver poco pero constante evita que SQL se vuelva memoria suelta.',
    voice: 'El reto diario es para practicar sin fricción. Aunque tengas poco tiempo, entrar y resolver algo mantiene vivo el hábito.',
    icon: Target,
    mood: 'determined',
    cue: 'build',
  },
  {
    id: 'ranking',
    target: 'ranking',
    eyebrow: 'Competencia',
    shot: 'Tabla de honor',
    title: 'El ranking convierte el avance en referencia',
    content: 'El top de aventureros te muestra cómo vas frente al grupo. No es para castigarte: es una referencia para mantener ritmo y curiosidad.',
    voice: 'El ranking te da referencia de avance. Úsalo para mantener ritmo y curiosidad, no para frustrarte.',
    icon: Trophy,
    mood: 'happy',
    cue: 'confirm',
  },
  {
    id: 'profile',
    target: 'profile',
    eyebrow: 'Cuenta',
    shot: 'Identidad',
    title: 'Tu perfil concentra ajustes y progreso personal',
    content: 'Desde Mi Perfil revisas datos de cuenta, avatar, preferencias visuales y estado general. Si algo del entorno no se siente tuyo, este es el primer lugar para ajustar.',
    voice: 'En Mi Perfil puedes revisar tu cuenta, avatar, preferencias y progreso personal. Es tu zona de ajustes.',
    icon: User,
    mood: 'happy',
    cue: 'select',
  },
  {
    id: 'streaks',
    target: 'streaks',
    eyebrow: 'Rachas',
    shot: 'Constancia',
    title: 'La racha existe para que no abandones',
    content: 'La racha te recuerda volver. Si estás aprendiendo desde cero, la constancia vale más que estudiar mucho un día y desaparecer una semana.',
    voice: 'La racha te recuerda volver. Para aprender programación desde cero, la constancia pesa más que estudiar muchas horas una sola vez.',
    icon: Flame,
    mood: 'determined',
    cue: 'risk',
  },
  {
    id: 'quick-practice',
    target: 'quick-practice',
    eyebrow: 'Entrenamiento',
    shot: 'Acción inmediata',
    title: 'Práctica rápida es tu botón de calentamiento',
    content: 'Si no sabes qué hacer, entra aquí. Te lanza ejercicios cortos para ganar XP, detectar dudas y llegar mejor preparado a los módulos largos.',
    voice: 'Práctica rápida es tu calentamiento. Te ayuda a ganar experiencia, detectar dudas y prepararte antes de un módulo largo.',
    icon: Target,
    mood: 'excited',
    cue: 'build',
  },
  {
    id: 'sound-toggle',
    target: 'sound-toggle',
    eyebrow: 'Audio',
    shot: 'Control global',
    title: 'El botón de sonido controla música, efectos y narración',
    content: 'Si activas silencio, Dagon deja de narrar y los efectos se apagan. Si lo vuelves a activar, regresan las pistas de audio del entorno.',
    voice: 'Este botón controla el audio global. Silencia música, efectos y narración. Puedes activarlo de nuevo cuando quieras.',
    icon: Volume2,
    mood: 'thinking',
    cue: 'switch',
  },
  {
    id: 'tour-button',
    target: 'tour-button',
    eyebrow: 'Repetición',
    shot: 'Reinicio guiado',
    title: 'Puedes volver a ver este tutorial',
    content: 'El botón Tutorial queda disponible para repetir este recorrido. Es útil si presentas el proyecto, si entra alguien nuevo o si quieres recordar dónde está cada herramienta.',
    voice: 'El botón Tutorial sirve para repetir este recorrido. Úsalo para presentaciones, usuarios nuevos o para recordar cada herramienta.',
    icon: HelpCircle,
    mood: 'happy',
    cue: 'safe',
  },
  {
    id: 'finish',
    target: null,
    eyebrow: 'Inicio',
    shot: 'Listo para jugar',
    title: 'Ya puedes moverte por Dagon sin miedo',
    content: 'Empieza por una senda, revisa el módulo recomendado o entra a práctica rápida. La meta no es adivinar: es entender qué hace cada consulta SQL.',
    voice: 'Listo. Empieza por una senda, una misión recomendada o práctica rápida. La meta no es adivinar, es entender cada consulta SQL.',
    icon: Sparkles,
    mood: 'celebrating',
    cue: 'confirm',
  },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createTourParticles = () => Array.from({ length: 8 }, (_, index) => {
  const angle = index * 2.399963229728653;
  const radius = 20 + (index % 4) * 12;
  const left = clamp(50 + Math.cos(angle) * radius, 4, 96);
  const top = clamp(50 + Math.sin(angle) * radius * 0.76, 7, 93);

  return {
    id: `tour-particle-${index}`,
    left: `${left}%`,
    top: `${top}%`,
    drift: 70 + (index % 5) * 18,
    duration: 5 + (index % 3) * 0.8,
    delay: (index % 4) * 0.3,
    scale: 0.9 + (index % 3) * 0.2,
  };
});

export const TutorialOverlay = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => sounds.isEnabled());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const particles = useMemo(() => createTourParticles(), []);
  const step = tutorialSteps[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !step?.target || typeof document === 'undefined') {
      setTargetRect((prev) => (prev === null ? prev : null));
      return;
    }

    const element = document.querySelector(`[data-tour="${step.target}"]`);
    if (!element) {
      setTargetRect((prev) => (prev === null ? prev : null));
      return;
    }

    const rect = element.getBoundingClientRect();
    const vh = document.documentElement.clientHeight || window.innerHeight;
    const vw = document.documentElement.clientWidth || window.innerWidth;
    
    const newTop = clamp(rect.top - 10, 12, vh - 80);
    const newLeft = clamp(rect.left - 10, 12, vw - 80);
    const newWidth = Math.min(rect.width + 20, vw - 24);
    const newHeight = Math.min(rect.height + 20, vh - 24);

    setTargetRect((prev) => {
      if (
        prev &&
        Math.abs(prev.top - newTop) < 1 &&
        Math.abs(prev.left - newLeft) < 1 &&
        Math.abs(prev.width - newWidth) < 1 &&
        Math.abs(prev.height - newHeight) < 1
      ) {
        return prev;
      }
      return { top: newTop, left: newLeft, width: newWidth, height: newHeight };
    });
  }, [isOpen, step?.target]);

  const cancelSpeech = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  const handleClose = useCallback(() => {
    cancelSpeech();
    localStorage.setItem('dagon_tutorial_completed', 'true');
    localStorage.removeItem('dagon_tutorial_pending');
    localStorage.removeItem('dagon_first_login');
    if (onClose) onClose();
  }, [cancelSpeech, onClose]);

  const handleNext = useCallback(() => {
    cancelSpeech();
    setCurrentStep((value) => {
      if (value < tutorialSteps.length - 1) {
        requestAnimationFrame(() => sounds.playStep());
        return value + 1;
      }
      handleClose();
      return value;
    });
  }, [cancelSpeech, handleClose]);

  const speak = useCallback((text, onFinish) => {
    if (!soundEnabled || !isOpen) return;
    sounds.speakTTS(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        if (onFinish) onFinish();
      },
      onError: () => setIsSpeaking(false)
    });
  }, [isOpen, soundEnabled]);

  useEffect(() => {
    const syncSound = (event) => {
      const enabled = event?.detail?.enabled ?? sounds.isEnabled();
      setSoundEnabled(enabled);
      if (!enabled) cancelSpeech();
    };

    window.addEventListener('dagon:soundchange', syncSound);
    syncSound();
    return () => window.removeEventListener('dagon:soundchange', syncSound);
  }, [cancelSpeech]);

  useEffect(() => {
    if (!isOpen) {
      cancelSpeech();
      return;
    }

    setCurrentStep(0);
    sounds.playCinematicCue?.('cinematic');
  }, [isOpen, cancelSpeech]);

  useEffect(() => {
    if (!isOpen) return undefined;

    cancelSpeech();

    const target = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });

    updateTargetRect();
    const rectTimer = requestAnimationFrame(() => updateTargetRect());
    const speechTimer = setTimeout(() => speak(step.voice, () => handleNext()), 150);

    return () => {
      cancelAnimationFrame(rectTimer);
      clearTimeout(speechTimer);
      cancelSpeech();
    };
  }, [currentStep, isOpen, step, speak, updateTargetRect, cancelSpeech, handleNext]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, updateTargetRect]);

  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return undefined;

    const loadVoices = () => synth.getVoices();
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    return () => synth.cancel();
  }, []);

  const handlePrevious = () => {
    cancelSpeech();
    setCurrentStep((value) => Math.max(0, value - 1));
    requestAnimationFrame(() => sounds.playSelect());
  };

  const toggleVoice = async () => {
    const next = sounds.toggleEnabled({ restart: false });
    setSoundEnabled(next);
    if (next) {
      await sounds.init();
      sounds.playMagic();
      speak(step.voice);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            backgroundColor: targetRect ? 'transparent' : 'rgba(2, 6, 23, 0.85)'
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`tour-overlay-shell fixed inset-0 z-[100] overflow-hidden ${!targetRect ? 'backdrop-blur-[8px]' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-step-title"
          aria-describedby="tour-step-description"
        >
          {/* Overlay oscuro con hueco recortado donde está el target */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <mask id="tour-cutout-mask">
                <rect width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left}
                    y={targetRect.top}
                    width={targetRect.width}
                    height={targetRect.height}
                    rx="24"
                    fill="black"
                    className="tour-mask-hole"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(2, 6, 23, 0.85)"
              mask="url(#tour-cutout-mask)"
            />
          </svg>

          <motion.div 
            className="tour-cinematic-vignette absolute inset-0 pointer-events-none"
            animate={{ opacity: targetRect ? 0 : 1 }}
          />
          <motion.div 
            className="tour-scanlines absolute inset-0 pointer-events-none"
            animate={{ opacity: targetRect ? 0 : 1 }}
          />

          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="tour-particle absolute w-1.5 h-1.5 bg-cyan-300/35 rounded-full blur-[1px]"
                style={{
                  left: particle.left,
                  top: particle.top,
                  animation: `tour-float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
                  '--tour-drift': `${particle.drift}px`,
                }}
              />
            ))}
          </div>

          {targetRect && (
            <div
              className="tour-spotlight fixed pointer-events-none rounded-[24px]"
              style={{
                zIndex: 3,
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
              }}
            />
          )}

          <div className="relative z-[102] flex h-[100dvh] w-full items-end justify-center p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8 overflow-hidden overscroll-none">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="tour-panel tour-cinematic-panel relative w-full max-w-6xl max-h-[85dvh] overflow-y-auto overflow-x-hidden rounded-[24px] border border-cyan-300/40 shadow-[0_-8px_50px_rgba(0,0,0,0.6),0_30px_120px_rgba(0,0,0,0.7)] overscroll-contain"
            >
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-300/60 to-transparent" />

              <div className="relative z-10 flex flex-col gap-6 p-5 sm:p-7 lg:grid lg:grid-cols-[250px_1fr] lg:p-8 xl:p-10">
                <aside className="hidden lg:flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/12 bg-white/[0.06] p-5 text-center">
                  <div className="relative tour-mascot-float">
                    <div className="absolute inset-0 scale-150 rounded-full bg-cyan-400/20 blur-2xl" />
                    <DagonMascot size="xlarge" mood={step.mood} animated={false} />
                  </div>

                  <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                    <StepIcon className="mx-auto mb-2 h-8 w-8 text-cyan-200 drop-shadow-[0_0_14px_rgba(125,211,252,0.55)]" />
                    <p className="font-display text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                      {step.shot}
                    </p>
                  </div>
                </aside>

                <section className="min-w-0">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-gameui text-[9px] font-black uppercase tracking-[0.32em] text-cyan-200 sm:text-[10px]">
                        Capítulo {String(currentStep + 1).padStart(2, '0')} / {String(tutorialSteps.length).padStart(2, '0')} · {step.eyebrow}
                      </p>
                      <div className="mt-2 h-1.5 w-full max-w-xl overflow-hidden rounded-full border border-white/10 bg-black/45 sm:mt-3">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 transition-[width] duration-200 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVoice}
                        className="tour-icon-button"
                        title={soundEnabled ? 'Silenciar tutorial' : 'Activar sonido del tutorial'}
                      >
                        {isSpeaking ? <Volume2 className="h-4 w-4 text-cyan-200" /> : soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="tour-icon-button hover:border-rose-300/50 hover:text-rose-200"
                        title="Cerrar tutorial"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="tour-step-content">
                    <h2 className="text-arcane-title max-w-4xl font-display text-2xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                      {step.title}
                    </h2>
                    <p className="text-arcane-body mt-3 max-w-4xl text-sm leading-relaxed text-slate-100 sm:mt-5 sm:text-lg">
                      {step.content}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-4 sm:mt-7 sm:flex-row sm:items-center sm:justify-between">
                    <div className="hidden items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-200 sm:flex">
                      <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(125,211,252,0.8)]" />
                      {targetRect ? 'Elemento señalado' : 'Escena intro'}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3">
                      <Button
                        onClick={handleClose}
                        variant="ghost"
                        className="h-10 rounded-xl border border-white/10 px-4 text-xs font-display font-black text-slate-300 hover:bg-white/5 sm:h-12 sm:px-5 sm:text-sm"
                      >
                        Omitir
                      </Button>
                      <Button
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        variant="outline"
                        className="h-10 rounded-xl border-white/15 bg-white/[0.03] px-4 text-xs font-display font-black text-white disabled:opacity-40 sm:h-12 sm:px-5 sm:text-sm"
                      >
                        Atrás
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="col-span-2 h-12 rounded-xl bg-white px-6 font-display font-black text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.24)] transition-all hover:bg-cyan-100 sm:col-auto"
                      >
                        {currentStep === tutorialSteps.length - 1 ? 'Comenzar' : 'Siguiente'}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const TourTrigger = ({ onClick }) => {
  return (
    <Button
      data-tour="tour-button"
      onClick={onClick}
      variant="outline"
      size="sm"
      className="group relative min-h-[44px] overflow-hidden rounded-xl border-2 border-cyan-300/70 bg-cyan-400/10 px-4 font-display font-black shadow-[0_12px_30px_rgba(34,211,238,0.22)] ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-400/20"
    >
      <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-cyan-300/0 via-cyan-200/18 to-fuchsia-300/0 transition-transform duration-1000 group-hover:translate-x-[100%]" />
      <span className="relative flex items-center gap-2 text-cyan-100">
        <PlayCircle className="h-4 w-4" />
        Tutorial
      </span>
    </Button>
  );
};
