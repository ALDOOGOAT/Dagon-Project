import { useState, useEffect, useRef } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from '../components/ui/button';
import { Volume2, VolumeX, MessageCircle, Sparkles, X, RefreshCw, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MENSAJES = {
  intro: [
    "¡Salve, aventurero! Soy Dagon, tu guía en este viaje por las profundidades del SQL.",
    "¡Has cruzado el portal! Prepárate, los secretos de las bases de datos esperan.",
    "¡Por fin! Tu camino hacia el dominio de SQL comienza ahora."
  ],
  theory: [
    "Te explicaré esto con un ejemplo real. Verás cómo funciona en la práctica.",
    "Esto es clave para tu viaje. Presta atención al ejemplo.",
    "Nuevo conocimiento acquired. Vamos a ver cómo aplicarlo."
  ],
  practice_start: [
    "Es hora de actuar. Escribe tu consulta y ve el resultado.",
    "Tu turno de brillar. La base de datos espera tu comando.",
    "El momento ha llegado. Escribe y observa la magia."
  ],
  dragging: [
    "Construye: SELECT + la columna + FROM + la tabla. Observa el orden.",
    "Arrastra en orden: primero qué quieres ver, luego de dónde.",
    "El patrón es: SELECT columna FROM tabla. ¡Inténtalo!"
  ],
  typing: [
    "Escribe tu consulta. Un error solo significa que estás aprendiendo.",
    "Siguiendo el patrón correcto, el éxito llegará.",
    "Piensa en la estructura: SELECT columna FROM tabla."
  ],
  success: [
    "¡Perfecto! Tu consulta devolvió el resultado exacto.",
    "¡Lo lograste! Así se hace. Mira el resultado abajo.",
    "¡Excelente! Tu dominio de SQL crece. El resultado es correcto."
  ],
  error: [
    "La base de datos respondió con un error. Revisa la sintaxis.",
    "Casi lo logras. El mensaje de error indica qué corregir.",
    "Un paso en falso. Lee el error y corrige esa parte."
  ],
  hint: [
    "Pista: Mira el patrón. SELECT columna FROM tabla WHERE condición.",
    "Consejo: Copia la estructura y cambia solo los nombres.",
    "Ayuda: El patrón es siempre el mismo. ¡Úsalo!"
  ],
  level_complete: [
    "¡Felicidades, aventurero! Has conquistado este nivel.",
    "¡Victoria! El conocimiento es ahora parte de ti.",
    "¡Nivel completado! Tu próximo destino espera."
  ],
  encourage: [
    "Confía en ti. El patrón siempre funciona.",
    "Intenta de nuevo. El éxito está garantizado.",
    "Un intento más. Esta vez lo lograrás."
  ]
};

const getRandomMessage = (phase) => {
  const messages = MENSAJES[phase] || MENSAJES.encourage;
  return messages[Math.floor(Math.random() * messages.length)];
};

let vozDisponible = null;

const DagonTTS = {
  synth: null,
  voices: [],
  
  init() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      this.cargarVoces();
    }
  },
  
  cargarVoces() {
    if (!this.synth) return;
    
    const voces = this.synth.getVoices();
    this.voices = voces;
    
    const prioridad = [
      'Google español de España',
      'Google Español', 
      'Microsoft Elvira',
      'Microsoft Montserrat',
      'Microsoft Pablo'
    ];
    
    for (const nombre of prioridad) {
      const voz = voces.find(v => v.name.includes(nombre) && v.lang.includes('es'));
      if (voz) {
        vozDisponible = voz;
        break;
      }
    }
    
    if (!vozDisponible && voces.length > 0) {
      vozDisponible = voces.find(v => v.lang.includes('es')) || voces[0];
    }
  },
  
  speak(texto, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synth || !texto) {
        resolve();
        return;
      }
      
      this.synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1;
      
      if (vozDisponible) {
        utterance.voice = vozDisponible;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = () => {
        resolve();
      };
      
      this.synth.speak(utterance);
    });
  },
  
  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
};

export const ClawbotTeacher = ({ 
  currentPhase = 'intro',
  exerciseData = null,
  onPhaseComplete = () => {}
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dagon_muted') === 'true';
    }
    return false;
  });
  const [currentMessage, setCurrentMessage] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [ready, setReady] = useState(false);
  
  const isCancelledRef = useRef(false);
  const isSpeakingRef = useRef(false);

  useEffect(() => {
    DagonTTS.init();
    setReady(true);
    
    if (window.speechSynthesis?.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => DagonTTS.cargarVoces();
    }
    
    return () => {
      DagonTTS.cancel();
    };
  }, []);

  const speak = async (texto) => {
    if (!ready || isMuted || isSpeakingRef.current) return;
    
    isCancelledRef.current = false;
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    
    const chunks = texto.split(/(?<=[.!?])\s+/).filter(Boolean);
    
    for (const chunk of chunks) {
      if (isCancelledRef.current || isMuted) break;
      
      const opciones = chunk.endsWith('!') || chunk.endsWith('¡') 
        ? { rate: 1.0, pitch: 1.15, volume: 1 }
        : chunk.endsWith('.')
          ? { rate: 0.85, pitch: 0.95, volume: 1 }
          : { rate: 0.92, pitch: 1.0, volume: 1 };
      
      await DagonTTS.speak(chunk, opciones);
      
      if (!chunk.match(/[.!?]$/)) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    isSpeakingRef.current = false;
    setIsSpeaking(false);
    
    if (!isCancelledRef.current) {
      onPhaseComplete();
    }
  };

  useEffect(() => {
    if (!ready) return;
    
    const texto = exerciseData?.theoryIntro || exerciseData?.hint || getRandomMessage(currentPhase);
    setCurrentMessage(texto);
    
    if (!isMuted && ready) {
      const timer = setTimeout(() => speak(texto), 1200);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, exerciseData?.theoryIntro, exerciseData?.hint, isMuted, ready]);

  const toggleMute = () => {
    if (isSpeakingRef.current) {
      DagonTTS.cancel();
      isCancelledRef.current = true;
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    }
    const nuevo = !isMuted;
    setIsMuted(nuevo);
    localStorage.setItem('dagon_muted', nuevo.toString());
  };

  const repeat = () => {
    if (currentMessage && !isSpeakingRef.current) {
      speak(currentMessage);
    }
  };

  const getMood = () => {
    if (isSpeaking) return 'excited';
    if (currentPhase === 'success') return 'excited';
    if (currentPhase === 'error') return 'sad';
    if (currentPhase === 'level_complete') return 'celebrating';
    return 'happy';
  };

  if (!showPanel) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setShowPanel(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-[9999]"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </motion.button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-[9998]" data-testid="dagonbot-teacher">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="relative"
        >
          {currentMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-4 w-84"
            >
              <div className="relative">
                <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/20 rounded-3xl p-5 shadow-2xl">
                  <div className="absolute -bottom-2.5 left-8 w-5 h-5 bg-gradient-to-br from-slate-900 to-slate-800 border-r border-b border-white/20 transform rotate-45" />
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm leading-relaxed font-medium">
                        {currentMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={repeat}
                          disabled={isSpeaking}
                          className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSpeaking ? 'animate-spin' : ''}`} />
                          {isSpeaking ? 'Hablando...' : 'Repetir'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {currentPhase === 'error' && exerciseData?.hint && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <Button
                        onClick={() => {
                          setShowHint(!showHint);
                          if (!showHint && exerciseData?.hint) {
                            setCurrentMessage(exerciseData.hint);
                            if (!isMuted) speak(exerciseData.hint);
                          }
                        }}
                        className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-xs"
                        size="sm"
                      >
                        {showHint ? 'Ocultar pista' : '💡 Necesito una pista'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex items-end gap-3">
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: isSpeaking ? Infinity : 0, duration: 0.8 }}
              className="relative"
            >
              <div className={`backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-3xl p-3 shadow-2xl transition-all duration-300 ${
                isSpeaking 
                  ? 'ring-2 ring-cyan-400/50 shadow-cyan-500/30' 
                  : 'hover:scale-105'
              }`}>
                <DagonMascot 
                  size="medium" 
                  mood={getMood()}
                />
              </div>

              {isSpeaking && !isMuted && (
                <div className="absolute -top-1 -right-1 flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0.5, 1.2, 0.5], opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                    />
                  ))}
                </div>
              )}

              {isMuted && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <VolumeX className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>

            <div className="flex flex-col gap-2">
              <button
                onClick={toggleMute}
                className="w-9 h-9 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg hover:scale-110"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-300" />
                )}
              </button>
              
              <button
                onClick={() => setShowPanel(false)}
                className="w-9 h-9 backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all duration-200"
                title="Minimizar"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ClawbotTeacher;
