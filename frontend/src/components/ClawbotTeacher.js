import { useState, useEffect } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { Volume2, VolumeX, MessageCircle } from 'lucide-react';

export const ClawbotTeacher = ({ 
  currentPhase = 'intro',
  exerciseData = null,
  onPhaseComplete = () => {},
  userProgress = {}
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showHint, setShowHint] = useState(false);

  const messages = {
    intro: {
      text: "¡Hola! Soy Dagon, tu guía personal en SQL. Voy a enseñarte paso a paso. ¿Listo para comenzar?",
      duration: 4000
    },
    theory: {
      text: exerciseData?.theoryIntro || "Primero, entendamos la teoría. Presta mucha atención...",
      duration: 3000
    },
    practice_start: {
      text: "¡Perfecto! Ahora es tu turno. Voy a estar aquí ayudándote.",
      duration: 3000
    },
    dragging: {
      text: "¡Muy bien! Arrastra las palabras para construir tu consulta SQL.",
      duration: 2500
    },
    success: {
      text: "¡Excelente trabajo! Lo hiciste perfecto. Sigue así.",
      duration: 3000
    },
    error: {
      text: "No te preocupes, todos cometemos errores. Inténtalo de nuevo, yo te ayudo.",
      duration: 3500
    },
    hint: {
      text: exerciseData?.hint || "Recuerda: empieza con SELECT, luego indica qué campos quieres.",
      duration: 4000
    }
  };

  useEffect(() => {
    if (currentPhase && messages[currentPhase]) {
      setCurrentMessage(messages[currentPhase].text);
      if (!isMuted) {
        speak(messages[currentPhase].text);
      }
    }
  }, [currentPhase, isMuted]);

  const speak = (text) => {
    if (window.speechSynthesis && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        setTimeout(() => {
          onPhaseComplete();
        }, 500);
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        onPhaseComplete();
      }, messages[currentPhase]?.duration || 3000);
    }
  };

  const toggleMute = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-24 left-6 z-50" data-testid="clawbot-teacher">
      {/* Contenedor principal con glassmorphism Apple-style */}
      <div className="relative">
        {/* Burbuja de diálogo */}
        {currentMessage && (
          <div className="absolute bottom-full left-0 mb-4 w-80 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
              <div className="absolute -bottom-3 left-8 w-6 h-6 backdrop-blur-2xl bg-white/10 border-r border-b border-white/20 transform rotate-45"></div>
              
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <p className="text-white text-sm leading-relaxed font-medium">
                  {currentMessage}
                </p>
              </div>

              {currentPhase === 'error' && exerciseData?.hint && (
                <Button
                  onClick={() => setShowHint(!showHint)}
                  className="mt-4 w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30"
                  size="sm"
                >
                  {showHint ? 'Ocultar Pista' : '💡 Ver Pista'}
                </Button>
              )}

              {showHint && (
                <div className="mt-3 p-3 bg-cyan-500/20 border border-cyan-400/30 rounded-xl">
                  <p className="text-cyan-200 text-xs">{exerciseData?.hint}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dagon animado */}
        <div className="relative">
          <div className={`backdrop-blur-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20 rounded-3xl p-4 shadow-2xl transition-all duration-300 ${
            isSpeaking ? 'scale-110 shadow-blue-500/50' : 'scale-100'
          }`}>
            <DagonMascot 
              size="large" 
              mood={
                currentPhase === 'success' ? 'excited' :
                currentPhase === 'error' ? 'sad' :
                isSpeaking ? 'excited' : 'happy'
              } 
            />
          </div>

          {/* Indicador de voz */}
          {isSpeaking && !isMuted && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
          )}

          {/* Botón de mute/unmute */}
          <button
            onClick={toggleMute}
            className="absolute -top-2 -left-2 w-10 h-10 backdrop-blur-2xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-blue-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
