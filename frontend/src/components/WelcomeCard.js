import { useState, useEffect, useRef, useCallback } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { X, Volume2, VolumeX, Sparkles, ChevronRight, Database, Code, Trophy, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { sounds } from '../lib/SoundEngine';

const welcomeSteps = [
  {
    icon: Sparkles,
    title: "¡Bienvenido a Dagon, Aventurero!",
    message: "Soy Dagon, tu mentor en este viaje épico hacia el dominio de SQL.",
    detail: "Prepárate para una experiencia de aprendizaje única donde la práctica se divierte."
  },
  {
    icon: Code,
    title: "¿Qué es SQL?",
    message: "SQL es el lenguaje universal para comunicarte con bases de datos.",
    detail: "Es como dar instrucciones precisas para encontrar, guardar y organizar información en el Abismo."
  },
  {
    icon: Database,
    title: "¿Por qué PostgreSQL?",
    message: "Usamos PostgreSQL: el motor más robusto y confiable del mundo open-source.",
    detail: "Lo usan gigantes como Uber, Netflix e Instagram. Es potente y totalmente gratuito."
  },
  {
    icon: Target,
    title: "Nuestra Misión",
    message: "Revolucionar el aprendizaje de SQL con gamificación real.",
    detail: "Nada de clases aburridas. Aquí aprenderás jugando, practicando y divirtiéndote."
  },
  {
    icon: Trophy,
    title: "¿Listo para el Abismo?",
    message: "Ya tienes todo lo necesario. ¡Gana XP, sube de nivel y conquista!",
    detail: "Recuerda: la práctica hace al maestro. ¡Vamos a dominar SQL!"
  }
];

export const WelcomeCard = ({ onDismiss }) => {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(() => sounds.isEnabled());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;

  useEffect(() => {
    const isFirstLogin = localStorage.getItem('dagon_first_login') === 'true';
    const tutorialPending = localStorage.getItem('dagon_tutorial_pending') === 'true';
    if (isFirstLogin && !tutorialPending) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const syncSoundState = (event) => {
      const enabled = event?.detail?.enabled ?? sounds.isEnabled();
      setVoiceEnabled(enabled);
      if (!enabled) {
        synthRef.current?.cancel();
        setIsSpeaking(false);
      }
    };

    window.addEventListener('dagon:soundchange', syncSoundState);
    syncSoundState();
    return () => window.removeEventListener('dagon:soundchange', syncSoundState);
  }, []);

  const speak = useCallback((text) => {
    if (!voiceEnabled || !sounds.speechAllowed()) return;
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    const voices = synthRef.current.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const currentStepData = welcomeSteps[currentStep];
  const StepIcon = currentStepData.icon;

  useEffect(() => {
    if (show && voiceEnabled) {
      const texts = [
        "¡Bienvenido a Dagon! Soy tu mentor en este viaje épico hacia el dominio de SQL.",
        "SQL es el lenguaje universal para comunicarte con bases de datos. Es como dar instrucciones precisas.",
        "Usamos PostgreSQL, el motor más robusto del mundo. Lo usan Uber, Netflix e Instagram.",
        "Nuestra misión es revolucionar cómo aprendes SQL, jugando y divirtiéndote.",
        "¡Ya estás listo! Gana experiencia, sube de nivel y diviértete conquistando el Abismo."
      ];
      const timer = setTimeout(() => speak(texts[currentStep]), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, show, voiceEnabled, speak]);

  useEffect(() => {
    const loadVoices = () => synthRef.current.getVoices();
    loadVoices();
    if (synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleDismiss = () => {
    synthRef.current.cancel();
    setShow(false);
    localStorage.removeItem('dagon_first_login');
    if (onDismiss) onDismiss();
  };

  const handleNext = () => {
    if (currentStep < welcomeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4"
        style={{ backgroundColor: isLight ? 'rgba(255,248,235,0.82)' : 'rgba(0,0,0,0.80)' }}
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-2xl border-2 rounded-3xl p-8 shadow-2xl overflow-hidden"
          style={{
            background: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,248,220,0.92), rgba(255,243,199,0.86))' : 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(88,28,135,0.30), rgba(49,46,129,0.30))',
            borderColor: isLight ? 'rgba(245,158,11,0.28)' : 'rgba(168,85,247,0.30)'
          }}
        >
          {/* Efecto de brillo */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: [-500, 500] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          {/* Botones superiores */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => {
                const enabled = sounds.toggleEnabled({ restart: false });
                setVoiceEnabled(enabled);
                if (!enabled || isSpeaking) { synthRef.current.cancel(); setIsSpeaking(false); }
                if (enabled) sounds.init();
              }}
              className="w-10 h-10 backdrop-blur-xl rounded-full flex items-center justify-center transition-all"
              style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.10)' }}
            >
              {isSpeaking ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
                  <Volume2 className="w-5 h-5" style={{ color: colors.primary }} />
                </motion.div>
              ) : voiceEnabled ? (
                <Volume2 className="w-5 h-5" style={{ color: headingColor }} />
              ) : (
                <VolumeX className="w-5 h-5" style={{ color: mutedColor }} />
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="w-10 h-10 backdrop-blur-xl rounded-full flex items-center justify-center transition-all"
              style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.10)' }}
            >
              <X className="w-5 h-5" style={{ color: headingColor }} />
            </button>
          </div>

          {/* Dagon animado */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <DagonMascot size="xlarge" mood={currentStep === welcomeSteps.length - 1 ? 'excited' : 'happy'} />
            </motion.div>
          </motion.div>

          {/* Icono del paso */}
          <motion.div
            className="flex justify-center mb-4"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, delay: 0.2 }}
          >
            <div className="w-16 h-16 rounded-2xl backdrop-blur-xl flex items-center justify-center border" style={{ backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}40` }}>
              <StepIcon className="w-8 h-8" style={{ color: colors.primary }} />
            </div>
          </motion.div>

          {/* Contenido */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-display font-black mb-4" style={{ color: headingColor }}>
              {currentStepData.title}
            </h2>
            <p className="text-xl leading-relaxed mb-3" style={{ color: headingColor }}>
              {currentStepData.message}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: mutedColor }}>
              {currentStepData.detail}
            </p>
          </motion.div>

          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-mono mb-2" style={{ color: mutedColor }}>
              <span>Paso {currentStep + 1} de {welcomeSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / welcomeSteps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? 'rgba(120,113,108,0.18)' : 'rgba(255,255,255,0.10)' }}>
              <motion.div
                className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / welcomeSteps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {welcomeSteps.map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep ? 'w-6' :
                    i < currentStep ? 'w-1.5 bg-green-400' :
                    'w-1.5'
                  }`}
                  style={i === currentStep ? { backgroundColor: colors.primary } : i < currentStep ? undefined : { backgroundColor: isLight ? 'rgba(120,113,108,0.25)' : 'rgba(255,255,255,0.20)' }}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          </div>

          {/* Botones */}
          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="backdrop-blur-xl"
              style={{ borderColor: isLight ? 'rgba(245,158,11,0.20)' : 'rgba(255,255,255,0.20)', color: headingColor, backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'transparent' }}
            >
              Saltar
            </Button>
            <Button
              onClick={handleNext}
              className="font-bold px-8 py-6 rounded-xl shadow-lg flex items-center gap-2 group"
              style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, color: isLight ? '#1f2937' : '#ffffff' }}
            >
              {currentStep === welcomeSteps.length - 1 ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  ¡Comenzar Aventura!
                </>
              ) : (
                <>
                  Siguiente
                  <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
