import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { ChevronRight, X, Volume2, VolumeX, Database, Code, Trophy, Sparkles, BookOpen, Target, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tutorialSteps = [
  {
    id: 'welcome',
    title: "Bienvenido a Dagon",
    content: "Soy Dagon, tu mentor épico en este viaje hacia el dominio de SQL. Prepárate para una experiencia de aprendizaje impulsada por IA.",
    icon: Sparkles,
    voice: "¡Bienvenido a Dagon! Soy tu mentor. Juntos dominarás SQL desde cero hasta nivel profesional. ¡Prepárate para una aventura épica!",
    color: 'from-fuchsia-600/40 to-indigo-900/80',
    borderColor: 'border-fuchsia-500/30',
    mascotMood: 'excited'
  },
  {
    id: 'what-is-sql',
    title: "¿Qué es SQL?",
    content: "SQL es el lenguaje universal para comunicarte con bases de datos. Es como dar instrucciones precisas para encontrar, guardar y organizar la información del mundo.",
    icon: Code,
    voice: "SQL es el lenguaje universal para hablar con bases de datos. Imagina que es como dar instrucciones precisas para encontrar cualquier información que necesites en el Abismo.",
    color: 'from-blue-600/40 to-cyan-900/80',
    borderColor: 'border-blue-500/30',
    mascotMood: 'happy'
  },
  {
    id: 'why-postgres',
    title: "¿Por qué PostgreSQL?",
    content: "Es el motor de base de datos más robusto y confiable del mundo open-source. Lo usan gigantes tecnológicos como Uber, Netflix e Instagram.",
    icon: Database,
    voice: "Elegimos PostgreSQL porque es el motor más robusto del mundo. Lo usan gigantes como Uber y Netflix. Es potente, confiable y totalmente gratuito para nosotros.",
    color: 'from-emerald-600/40 to-teal-900/80',
    borderColor: 'border-emerald-500/30',
    mascotMood: 'happy'
  },
  {
    id: 'mission',
    title: "Nuestra misión",
    content: "Revolucionar cómo aprendes SQL. Nada de clases aburridas ni teoría seca. Aquí aprenderás jugando, practicando y conquistando retos reales en el Abismo.",
    icon: Target,
    voice: "Nuestra misión es revolucionar cómo aprendes SQL. Nada de clases aburridas. Aquí aprenderás jugando, practicando y divirtiéndote en el Abismo.",
    color: 'from-rose-600/40 to-pink-900/80',
    borderColor: 'border-rose-500/30',
    mascotMood: 'excited'
  },
  {
    id: 'levels',
    title: "Niveles de poder",
    content: "Desbloquearás 5 niveles progresivos. Empezarás con comandos básicos y llegarás hasta el diseño arquitectónico de bases de datos completas.",
    icon: Trophy,
    voice: "Desbloquearás 5 niveles épicos. Empezarás con comandos básicos y llegarás hasta diseñar bases de datos completas. Cada nivel te dará nuevos superpoderes SQL.",
    color: 'from-amber-600/40 to-orange-900/80',
    borderColor: 'border-amber-500/30',
    mascotMood: 'happy'
  },
  {
    id: 'features',
    title: "Tus herramientas",
    content: "Tendrás un editor SQL profesional, modo visual para principiantes, diagramas ER interactivos y tu propio tutor de Inteligencia Artificial.",
    icon: BookOpen,
    voice: "Tendrás un editor SQL profesional, diagramas visuales y tu tutor personal de inteligencia artificial que responderá todas tus dudas en tiempo real.",
    color: 'from-violet-600/40 to-purple-900/80',
    borderColor: 'border-violet-500/30',
    mascotMood: 'happy'
  },
  {
    id: 'ready',
    title: "Inicia la aventura",
    content: "El abismo te espera. Recuerda: la práctica constante es el secreto de los grandes Arquitectos de Software. ¡Forja tu destino!",
    icon: Sparkles,
    voice: "¡Estás listo! Recuerda: la práctica hace al maestro. Gana experiencia, sube de nivel y diviértete conquistando el Abismo de los Datos. ¡Iniciemos!",
    color: 'from-indigo-600/50 via-purple-600/40 to-fuchsia-900/80',
    borderColor: 'border-indigo-500/50',
    mascotMood: 'excited'
  }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createTourParticles = () => Array.from({ length: 15 }, (_, index) => {
  const angle = index * 2.399963229728653;
  const radius = 18 + (index % 5) * 9;
  const left = clamp(50 + Math.cos(angle) * radius, 5, 95);
  const top = clamp(50 + Math.sin(angle) * radius * 0.82, 8, 92);

  return {
    id: `tour-particle-${index}`,
    left: `${left}%`,
    top: `${top}%`,
    drift: 82 + (index % 6) * 18,
    duration: 4.2 + (index % 4) * 0.7,
    delay: (index % 5) * 0.32,
    scale: 1 + (index % 3) * 0.22,
  };
});

export const TutorialOverlay = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const particles = useMemo(() => createTourParticles(), []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    } else {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const step = tutorialSteps[currentStep];

  const handleClose = useCallback(() => {
    synthRef.current.cancel();
    setIsSpeaking(false);
    localStorage.setItem('dagon_tutorial_completed', 'true');
    if (onClose) onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    synthRef.current.cancel();
    setCurrentStep(prev => {
      if (prev < tutorialSteps.length - 1) {
        return prev + 1;
      } else {
        setTimeout(handleClose, 0);
        return prev;
      }
    });
  }, [handleClose]);

  const speak = useCallback((text, onFinish) => {
    if (!voiceEnabled || !isOpen) return;
    
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    
    const voices = synthRef.current.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Microsoft')));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onFinish) onFinish();
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [isOpen, voiceEnabled]);

  useEffect(() => {
    if (isOpen && step?.voice && voiceEnabled) {
      const timer = setTimeout(() => speak(step.voice, () => handleNext()), 600);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen, speak, step?.voice, voiceEnabled, handleNext]);

  useEffect(() => {
    const synth = synthRef.current;
    const loadVoices = () => synth.getVoices();
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    return () => synth.cancel();
  }, []);

  const toggleVoice = () => {
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="tour-overlay-shell fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="tour-particle absolute w-1.5 h-1.5 bg-fuchsia-400/30 rounded-full blur-[1px]"
                style={{ left: particle.left, top: particle.top }}
                animate={{
                  y: [0, -particle.drift, 0],
                  opacity: [0, 1, 0],
                  scale: [1, particle.scale, 1]
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          <div className="relative z-[102] flex h-[100dvh] w-full items-center sm:items-end justify-center p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8 overflow-hidden pointer-events-none">
            <motion.div
              initial={{ opacity: 0, rotateX: 8, y: 34, scale: 0.96 }}
              animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotateX: -6, y: -24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              className={`tour-panel relative w-full max-w-3xl max-h-[85dvh] overflow-y-auto bg-black/80 backdrop-blur-3xl bg-gradient-to-br ${step.color} border border-white/10 ${step.borderColor} rounded-[2rem] p-6 md:p-12 shadow-2xl pointer-events-auto`}
            >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="absolute top-6 right-6 flex gap-3 z-20">
            <button
              onClick={toggleVoice}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all group backdrop-blur-md"
            >
              {isSpeaking ? (
                <div className="relative flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-fuchsia-300 relative z-10" />
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 1, repeat: Infinity }} className="absolute inset-0 bg-fuchsia-400/30 rounded-full" />
                </div>
              ) : voiceEnabled ? (
                <Volume2 className="w-4 h-4 text-white/70 group-hover:text-white" />
              ) : (
                <VolumeX className="w-4 h-4 text-white/40 group-hover:text-white/60" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-white/5 hover:bg-red-500/20 hover:bg-white/10 hover:border-red-500/30 rounded-full flex items-center justify-center transition-all group border border-white/10 backdrop-blur-md"
            >
              <X className="w-4 h-4 text-white/70 group-hover:text-red-300" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 relative z-10 mt-8 md:mt-4">
            <div className="flex flex-col items-center gap-4 md:gap-6 w-full md:w-1/3">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="absolute inset-0 bg-fuchsia-500/20 blur-3xl rounded-full scale-150" />
                <DagonMascot size="xlarge" mood={step.mascotMood} />
              </motion.div>

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                <StepIcon className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </motion.div>
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h2 className="text-arcane-title text-2xl md:text-4xl font-display font-black bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent mb-3 md:mb-4 leading-tight">
                  {step.title}
                </h2>
                <p className="text-arcane-body text-sm md:text-lg text-slate-300 mb-6 md:mb-8">
                  {step.content}
                </p>
              </motion.div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-fuchsia-300/70 font-mono font-bold tracking-widest uppercase">
                      Paso {currentStep + 1} // {tutorialSteps.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-500 rounded-full relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'circOut' }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </motion.div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button
                    onClick={handleClose}
                    variant="ghost"
                    className="flex-1 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white transition-colors h-12 rounded-xl"
                  >
                    Omitir Tour
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all font-bold h-12 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] group"
                  >
                    {currentStep === tutorialSteps.length - 1 ? (
                      <span className="flex items-center gap-2">
                        Comenzar <Sparkles className="w-4 h-4 text-fuchsia-600" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Siguiente 
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
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
      onClick={onClick}
      variant="outline"
      size="sm"
      className="relative overflow-hidden group border-2 border-fuchsia-400/60 bg-fuchsia-500/15 hover:bg-fuchsia-500/25 hover:border-fuchsia-300/90 transition-all rounded-xl px-4 shadow-[0_10px_26px_rgba(217,70,239,0.22)] hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/10 to-fuchsia-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      <span className="flex items-center gap-2 text-fuchsia-300 font-medium text-xs tracking-wide">
        <PlayCircle className="w-4 h-4" />
        Tour
      </span>
    </Button>
  );
};
