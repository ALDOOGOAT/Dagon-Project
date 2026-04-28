import { useState, useEffect, useRef } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { ChevronRight, X, Volume2, VolumeX, Database, Code, Trophy, Sparkles, BookOpen, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const tutorialSteps = [
  {
    id: 'welcome',
    title: "¡Bienvenido a Dagon, Aventurero! 🎯",
    content: "Soy Dagon, tu mentor épico en este viaje hacia el dominio de SQL. Prepárate para una experiencia de aprendizaje única.",
    icon: Sparkles,
    voice: "¡Bienvenido a Dagon! Soy tu mentor Dagon. Juntos dominarás SQL desde cero hasta nivel profesional. ¡Prepárate para una aventura épica!",
    color: 'from-purple-600 to-indigo-700',
    mascotMood: 'excited'
  },
  {
    id: 'what-is-sql',
    title: "¿Qué es SQL? 💾",
    content: "SQL (Structured Query Language) es el lenguaje universal para comunicarte con bases de datos. Es como dar instrucciones precisas para encontrar, guardar y organizar información.",
    icon: Code,
    voice: "SQL es el lenguaje universal para hablar con bases de datos. Imagina que es como dar instrucciones precisas para encontrar cualquier información que necesites en el Abismo.",
    color: 'from-blue-600 to-cyan-700',
    mascotMood: 'happy',
    highlight: null
  },
  {
    id: 'why-postgres',
    title: "¿Por qué PostgreSQL? 🐘",
    content: "PostgreSQL es el motor de base de datos más robusto y confiable del mundo open-source. Lo usan empresas como Uber, Netflix e Instagram. Es potente, confiable y gratuito.",
    icon: Database,
    voice: "Elegimos PostgreSQL porque es el motor más robusto del mundo. Lo usan gigantes como Uber y Netflix. Es potente, confiable y totalmente gratuito para nosotros.",
    color: 'from-green-600 to-emerald-700',
    mascotMood: 'happy',
    highlight: null
  },
  {
    id: 'mission',
    title: "Nuestra Misión 🎯",
    content: "Dagon nació para revolucionar el aprendizaje de SQL. Queremos que domines bases de datos de forma gamificada, divertida y práctica. ¡Sin aburridas diapositivas!",
    icon: Target,
    voice: "Nuestra misión es revolucionar cómo aprendes SQL. Nada de clases aburridas. Aquí aprenderás jugando, practicando y divirtiéndote en el Abismo.",
    color: 'from-fuchsia-600 to-pink-700',
    mascotMood: 'excited',
    highlight: null
  },
  {
    id: 'levels',
    title: "Niveles de Poder 📊",
    content: "Tenemos 5 niveles progresivos: desde SELECT básico hasta diseño de bases de datos complejas. Cada nivel desbloquea nuevos poderes SQL.",
    icon: Trophy,
    voice: "Desbloquearás 5 niveles épicos. Empezarás con SELECT básico y llegarás hasta diseñar bases de datos completas. Cada nivel te dará nuevos superpoderes SQL.",
    color: 'from-amber-600 to-orange-700',
    mascotMood: 'happy',
    highlight: ".grid.grid-cols-1.lg\\:grid-cols-3"
  },
  {
    id: 'features',
    title: "Tus Herramientas 🛠️",
    content: "Contarás con: Editor SQL profesional (Monaco), modo Drag & Drop para principiantes, diagramas ER visuales, tutor IA (Clawbot) y mucho más.",
    icon: BookOpen,
    voice: "Tendrás un editor SQL profesional, modo Drag and Drop para arrastrar palabras, diagramas visuales y tu tutor personal: Clawbot. ¡Él responderá todas tus dudas!",
    color: 'from-indigo-600 to-purple-700',
    mascotMood: 'happy',
    highlight: null
  },
  {
    id: 'ready',
    title: "¡Tu Aventura Comienza! 🚀",
    content: "Ya tienes todo lo necesario. Recuerda: la práctica hace al maestro. ¡Diviértete, gana XP y conquista el Abismo de los Datos!",
    icon: Sparkles,
    voice: "¡Estás listo! Recuerda: la práctica hace al maestro SQL. Gana experiencia, sube de nivel y diviértete conquistando el Abismo de los Datos. ¡Vamos!",
    color: 'from-fuchsia-600 via-purple-600 to-indigo-700',
    mascotMood: 'excited',
    highlight: null
  }
];

export const TutorialOverlay = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const step = tutorialSteps[currentStep];

  // Función para hablar
  const speak = (text) => {
    if (!voiceEnabled) return;
    
    // Cancelar habla anterior
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Intentar usar una voz en español
    const voices = synthRef.current.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Hablar cuando cambia el paso
  useEffect(() => {
    if (show && step.voice && voiceEnabled) {
      const timer = setTimeout(() => speak(step.voice), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, show, voiceEnabled]);

  // Cargar voces (necesario para algunos navegadores)
  useEffect(() => {
    const loadVoices = () => {
      synthRef.current.getVoices();
    };
    loadVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleNext = () => {
    synthRef.current.cancel();
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShow(false);
      localStorage.setItem('dagon_tutorial_completed', 'true');
      if (onComplete) onComplete();
    }
  };

  const handleSkip = () => {
    synthRef.current.cancel();
    setShow(false);
    localStorage.setItem('dagon_tutorial_completed', 'true');
    if (onComplete) onComplete();
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };

  if (!show) return null;

  const StepIcon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
      data-testid="tutorial-overlay"
    >
      {/* Partículas flotantes de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Contenedor principal */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl px-4">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`relative backdrop-blur-2xl bg-gradient-to-br ${step.color} border-2 border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden`}
        >
          {/* Efecto de brillo animado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: [-500, 500] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          {/* Botones superiores */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={toggleVoice}
              className="w-10 h-10 backdrop-blur-xl bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group"
              title={voiceEnabled ? 'Silenciar voz' : 'Activar voz'}
            >
              {isSpeaking ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Volume2 className="w-5 h-5 text-white group-hover:text-fuchsia-300" />
                </motion.div>
              ) : voiceEnabled ? (
                <Volume2 className="w-5 h-5 text-white/70" />
              ) : (
                <VolumeX className="w-5 h-5 text-white/40" />
              )}
            </button>
            <button
              onClick={handleSkip}
              className="w-10 h-10 backdrop-blur-xl bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-white/70 hover:text-white" />
            </button>
          </div>

          {/* Dagon animado */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <DagonMascot size="xlarge" mood={step.mascotMood} />
            </motion.div>
          </motion.div>

          {/* Icono del paso */}
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center">
              <StepIcon className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          {/* Contenido */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-4 leading-tight">
              {step.title}
            </h2>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
              {step.content}
            </p>
          </motion.div>

          {/* Barra de progreso */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-white/50 font-mono">
                Paso {currentStep + 1} de {tutorialSteps.length}
              </span>
              <span className="text-xs text-white/50 font-mono">
                {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-fuchsia-400 to-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-center gap-2 mt-3">
              {tutorialSteps.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-white'
                      : index < currentStep
                      ? 'w-2 bg-green-400'
                      : 'w-2 bg-white/20'
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleSkip}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 backdrop-blur-xl"
            >
              Saltar Tour
            </Button>
            <Button
              onClick={handleNext}
              className="bg-white text-gray-900 hover:bg-white/90 font-bold px-8 py-6 rounded-xl shadow-lg flex items-center gap-2 group"
            >
              {currentStep === tutorialSteps.length - 1 ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  ¡Comenzar Aventura! 🚀
                </>
              ) : (
                <>
                  Siguiente
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Highlight element (si hay) */}
      {step.highlight && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
    </motion.div>
  );
};
