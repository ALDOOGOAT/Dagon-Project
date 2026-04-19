import { useState, useEffect, useRef } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from '../components/ui/button';
import { Volume2, VolumeX, MessageCircle, Sparkles, X, RefreshCw, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MENSAJES = {
  intro: [
    "¡Hola! Soy Dagon, tu guía en este viaje por el mundo de SQL. ¡Vamos a aprender juntos!",
    "¡Bienvenido, aventurero! Prepárate para descubrir los secretos de las bases de datos.",
    "¡Qué gusto verte por aquí! Soy Dagon y seré tu compañero en esta aventura."
  ],
  theory: [
    "Es hora de aprender algo nuevo. Presta atención, esto te servirá mucho.",
    "Vamos con la teoría. Te explico esto de forma clara y simple.",
    "El conocimiento es poder. Escucha bien lo que te voy a contar."
  ],
  practice_start: [
    "¡Ahora es tu turno! Tú puedes, estoy aquí para ayudarte.",
    "Es momento de poner en práctica lo que sabes. ¡Tú puedes!",
    "¡Vamos a la acción! Estaré pendiente de cada paso que des."
  ],
  dragging: [
    "¡Arrastra las palabras y construye tu consulta! Piensa en el orden: qué y de dónde.",
    "Piensa en tu consulta como una oración. ¿Qué quieres obtener? ¿De dónde?",
    "¡Muy bien! Arrastra cada palabra a su lugar. SELECT primero, luego FROM."
  ],
  typing: [
    "Escribe tu consulta con confianza. Los errores son parte del aprendizaje.",
    "No te preocupes si no sale perfecto. ¡Estamos aquí para aprender!",
    "Escribe tu SQL y veamos qué pasa. ¡Tú puedes!"
  ],
  success: [
    "¡Eso fue increíble! ¡Lo lograste! ¡Eres un crack!",
    "¡Perfecto! ¡Estás aprendiendo muy rápido! ¡Me impresionas!",
    "¡Excelente trabajo! ¡Exactamente eso! ¡Sigue así!",
    "¡WOW! ¡Lo hiciste perfecto! ¡Eres un maestro de SQL!"
  ],
  error: [
    "No te preocupes, los errores son normales. ¡Analicemos qué pasó!",
    "¡Tranquilo! Esto es parte del aprendizaje. ¡Intenta de nuevo!",
    "¡No pasa nada! Los mejores también cometen errores. ¡Vamos a intentarlo otra vez!",
    "¡Casi lo logras! Revisa con calma y verás dónde está el detalle."
  ],
  hint: [
    "¿Necesitas una pista? ¡Claro! Mira esto...",
    "¡Te ayudo un poco! Presta atención...",
    "¡Una pista para ti! Esto te servirá..."
  ],
  level_complete: [
    "¡Felicidades! ¡Completaste el nivel! ¡Eres increíble!",
    "¡Lo lograste! ¡El conocimiento es tuyo!",
    "¡Nivel completado! ¡Eres un crack!"
  ],
  encourage: [
    "¡Tú puedes! Confío en ti.",
    "¡Sigue así! ¡Vas muy bien!",
    "¡No te rindas! ¡Estoy aquí para ayudarte!"
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
      utterance.onerror = (e) => {
        console.warn('TTS Error:', e);
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