import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { Volume2, VolumeX, SkipForward, ChevronRight } from 'lucide-react';
import { sounds } from '../lib/SoundEngine';

const THEORY_SCRIPTS = {
  "nivel-0": {
    title: "Fundamentos de Bases de Datos",
    scenes: [
      {
        mascotMood: "happy",
        text: "¡Hola! Soy Dagon, y hoy vamos a aprender sobre bases de datos.",
        highlight: null,
        duration: 4000
      },
      {
        mascotMood: "excited",
        text: "Una base de datos es como una biblioteca digital gigante donde guardamos información de manera super organizada.",
        highlight: "database",
        duration: 5000
      },
      {
        mascotMood: "happy",
        text: "SQL es el lenguaje que usamos para hablar con estas bases de datos. Es como el idioma de los datos.",
        highlight: "sql",
        duration: 4500
      },
      {
        mascotMood: "excited",
        text: "Las tablas son estructuras con filas y columnas, como una hoja de cálculo. ¡Muy fácil de entender!",
        highlight: "table",
        duration: 4500
      },
      {
        mascotMood: "happy",
        text: "¡Excelente! Ya conoces los conceptos básicos. ¡Ahora vamos a practicar!",
        highlight: null,
        duration: 3000
      }
    ],
    concepts: [
      { icon: "📊", title: "Base de Datos", desc: "Colección organizada de información", key: "database" },
      { icon: "🔍", title: "SQL", desc: "Lenguaje para consultar datos", key: "sql" },
      { icon: "📋", title: "Tablas", desc: "Estructura de filas y columnas", key: "table" }
    ]
  },
  "basico": {
    title: "SELECT y Filtros",
    scenes: [
      {
        mascotMood: "happy",
        text: "¡Bienvenido de nuevo! Hoy aprenderemos SELECT, la herramienta más importante de SQL.",
        highlight: null,
        duration: 4000
      },
      {
        mascotMood: "excited",
        text: "SELECT es como decir: 'Dame esta información'. Es el comando que más usarás.",
        highlight: "select",
        duration: 4000
      },
      {
        mascotMood: "happy",
        text: "Con WHERE puedes filtrar resultados. Es como buscar con condiciones específicas.",
        highlight: "where",
        duration: 4000
      },
      {
        mascotMood: "excited",
        text: "ORDER BY te permite ordenar los resultados. ¡Organiza todo a tu gusto!",
        highlight: "orderby",
        duration: 4000
      }
    ],
    concepts: [
      { icon: "🎯", title: "SELECT", desc: "Selecciona columnas de una tabla", key: "select" },
      { icon: "🔎", title: "WHERE", desc: "Filtra resultados con condiciones", key: "where" },
      { icon: "📈", title: "ORDER BY", desc: "Ordena los resultados", key: "orderby" }
    ]
  },
  "medio": {
    title: "JOINs y Relaciones",
    scenes: [
      {
        mascotMood: "happy",
        text: "¡Nivel intermedio! Ahora aprenderemos a combinar información de múltiples tablas.",
        highlight: null,
        duration: 4000
      },
      {
        mascotMood: "excited",
        text: "Los JOIN te permiten unir tablas relacionadas. ¡Es como conectar piezas de un rompecabezas!",
        highlight: "join",
        duration: 4500
      },
      {
        mascotMood: "happy",
        text: "GROUP BY agrupa datos similares para hacer cálculos como sumas o promedios.",
        highlight: "groupby",
        duration: 4000
      }
    ],
    concepts: [
      { icon: "🔗", title: "INNER JOIN", desc: "Une tablas con coincidencias", key: "join" },
      { icon: "📊", title: "GROUP BY", desc: "Agrupa datos para cálculos", key: "groupby" },
      { icon: "🎲", title: "Funciones", desc: "COUNT, SUM, AVG, MAX, MIN", key: "functions" }
    ]
  }
};

export const TheoryCinematic = ({ 
  levelId = 'nivel-0',
  onComplete = () => {},
  onSkip = () => {}
}) => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(() => !sounds.isEnabled());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showConcepts, setShowConcepts] = useState(false);
  const [highlightedConcept, setHighlightedConcept] = useState(null);
  const [progress, setProgress] = useState(0);
  const speechRef = useRef(null);
  const timerRef = useRef(null);

  const theoryData = THEORY_SCRIPTS[levelId] || THEORY_SCRIPTS['nivel-0'];
  const scene = theoryData.scenes[currentScene];

  useEffect(() => {
    const syncSoundState = (event) => {
      const enabled = event?.detail?.enabled ?? sounds.isEnabled();
      setIsMuted(!enabled);
      if (!enabled) {
        sounds.stopSpeech();
        setIsSpeaking(false);
      }
    };

    window.addEventListener('dagon:soundchange', syncSoundState);
    syncSoundState();
    return () => window.removeEventListener('dagon:soundchange', syncSoundState);
  }, []);

  useEffect(() => {
    if (isPlaying && scene && currentScene === 0) {
      // Auto-play en mounting
    }
  }, []);

  useEffect(() => {
    if (isPlaying && scene) {
      setHighlightedConcept(scene.highlight);
      
      // Speech synthesis with better voice loading
      if (!isMuted) {
        sounds.speakTTS(scene.text, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false)
        });
      }
      
      // Progress bar animation
      setProgress(0);
      const startTime = Date.now();
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / scene.duration) * 100, 100);
        setProgress(newProgress);
        if (newProgress < 100) {
          requestAnimationFrame(updateProgress);
        }
      };
      requestAnimationFrame(updateProgress);
      
      // Auto-advance
      timerRef.current = setTimeout(() => {
        if (currentScene < theoryData.scenes.length - 1) {
          setCurrentScene(prev => prev + 1);
        } else {
          setShowConcepts(true);
          setIsPlaying(false);
        }
      }, scene.duration);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      sounds.stopSpeech();
    };
  }, [currentScene, isPlaying, isMuted, scene, theoryData.scenes.length]);

  const toggleMute = () => {
    const enabled = sounds.toggleEnabled({ restart: false });
    setIsMuted(!enabled);
    if (!enabled) {
      sounds.stopSpeech();
      setIsSpeaking(false);
    }
    if (enabled) sounds.init();
  };

  const skipToEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    sounds.stopSpeech();
    setShowConcepts(true);
    setIsPlaying(false);
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen cyber-bg grid-pattern flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        <div className="glass-card-apple rounded-3xl p-8 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📚</span>
              {theoryData.title}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-blue-400" />
                )}
              </button>
              {!showConcepts && (
                <button
                  onClick={skipToEnd}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm flex items-center gap-1 transition-all"
                >
                  <SkipForward className="w-4 h-4" />
                  Saltar
                </button>
              )}
            </div>
          </div>

          {/* Scene Progress */}
          {!showConcepts && (
            <div className="flex gap-1 mb-6">
              {theoryData.scenes.map((_, idx) => (
                <div key={idx} className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: idx < currentScene ? '100%' : 
                             idx === currentScene ? `${progress}%` : '0%'
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!showConcepts ? (
              /* Cinematic Scene */
              <motion.div
                key={`scene-${currentScene}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                {/* Dagon Animation */}
                <motion.div 
                  className="flex justify-center mb-8"
                  animate={{ 
                    y: [0, -10, 0],
                    scale: scene?.mascotMood === 'excited' ? [1, 1.1, 1] : 1
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  <DagonMascot size="large" mood={scene?.mascotMood || 'happy'} />
                </motion.div>

                {/* Speech Bubble */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 max-w-2xl mx-auto"
                >
                  <p className="text-xl text-white leading-relaxed">
                    {scene?.text}
                  </p>
                </motion.div>

                {/* Concept Cards Preview */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  {theoryData.concepts.map((concept, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0.3, scale: 0.95 }}
                      animate={{ 
                        opacity: highlightedConcept === concept.key ? 1 : 0.4,
                        scale: highlightedConcept === concept.key ? 1.05 : 0.95,
                        borderColor: highlightedConcept === concept.key ? 'rgba(59, 130, 246, 0.5)' : 'transparent'
                      }}
                      className="bg-white/5 border-2 border-transparent rounded-xl p-4 text-center transition-all"
                    >
                      <div className="text-3xl mb-2">{concept.icon}</div>
                      <h4 className="font-semibold text-white text-sm">{concept.title}</h4>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* Concepts Summary */
              <motion.div
                key="concepts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <DagonMascot size="large" mood="excited" />
                </div>

                <h3 className="text-3xl font-bold text-white mb-2">
                  ¡Teoría Completada!
                </h3>
                <p className="text-slate-400 mb-8">
                  Recuerda estos conceptos clave:
                </p>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {theoryData.concepts.map((concept, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-blue-500/50 transition-all"
                    >
                      <div className="text-4xl mb-3">{concept.icon}</div>
                      <h4 className="font-bold text-white mb-1">{concept.title}</h4>
                      <p className="text-sm text-slate-400">{concept.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <Button
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg rounded-2xl shadow-lg"
                >
                  Comenzar Práctica
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
