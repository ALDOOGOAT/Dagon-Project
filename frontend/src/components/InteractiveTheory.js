import { useState, useEffect } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { Volume2, VolumeX, ChevronRight, CheckCircle } from 'lucide-react';

export const InteractiveTheory = ({ theoryContent, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [completedSlides, setCompletedSlides] = useState(new Set());

  const slides = [
    {
      title: theoryContent.title,
      content: theoryContent.content,
      visual: 'intro'
    },
    ...(theoryContent.concepts?.map((concept, index) => ({
      title: `${concept.icon} ${concept.title}`,
      content: concept.desc,
      detail: concept.detail || '',
      visual: 'concept',
      conceptIndex: index
    })) || [])
  ];

  useEffect(() => {
    if (!isMuted && slides[currentSlide]) {
      const timer = setTimeout(() => speakSlide(slides[currentSlide]), 500);
      return () => clearTimeout(timer);
    }
  }, [currentSlide]);

  useEffect(() => {
    // Auto-play al montar
    if (!isMuted) {
      const timer = setTimeout(() => speakSlide(slides[0]), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const speakSlide = (slide) => {
    if (window.speechSynthesis && !isMuted) {
      window.speechSynthesis.cancel();
      
      const textToSpeak = `${slide.title}. ${slide.content}. ${slide.detail || ''}`;
      
      const speakWithVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.includes('es')) || voices[0];
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        if (voice) utterance.voice = voice;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          setCompletedSlides(prev => new Set([...prev, currentSlide]));
        };
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      };
      
      if (window.speechSynthesis.getVoices().length > 0) {
        speakWithVoice();
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
      }
    } else {
      setTimeout(() => {
        setCompletedSlides(prev => new Set([...prev, currentSlide]));
      }, 2000);
    }
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    onComplete();
  };

  const toggleMute = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-[600px] flex items-center justify-center p-8" data-testid="interactive-theory">
      <div className="max-w-4xl w-full">
        {/* Progreso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              Lección {currentSlide + 1} de {slides.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Saltar a práctica →
            </button>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="glass-card-apple rounded-3xl p-12 relative overflow-hidden">
          {/* Efectos de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            {/* Dagon animado */}
            <div className="flex justify-center mb-8">
              <div className={`transition-transform duration-300 ${
                isSpeaking ? 'scale-110 animate-bounce' : 'animate-float'
              }`}>
                <DagonMascot 
                  size="large" 
                  mood={isSpeaking ? "excited" : "happy"} 
                />
              </div>
            </div>

            {/* Título de la lección */}
            <h2 className="text-4xl font-bold text-white text-center mb-6">
              {currentSlideData.title}
            </h2>

            {/* Contenido */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
              <p className="text-xl text-slate-200 leading-relaxed text-center">
                {currentSlideData.content}
              </p>
              {currentSlideData.detail && (
                <p className="text-lg text-slate-300 leading-relaxed text-center mt-4">
                  {currentSlideData.detail}
                </p>
              )}
            </div>

            {/* Visual de concepto */}
            {currentSlideData.visual === 'concept' && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {['📊', '🔍', '⚡'].map((icon, i) => (
                  <div 
                    key={i}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition-transform"
                  >
                    <div className="text-4xl mb-2">{icon}</div>
                    <div className="text-sm text-slate-400">Concepto {i + 1}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Controles */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={toggleMute}
                className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-2 transition-all"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-5 h-5 text-red-400" />
                    <span className="text-white">Silenciado</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Sonido On</span>
                  </>
                )}
              </button>

              <Button
                onClick={handleNext}
                disabled={isSpeaking && !isMuted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg rounded-2xl shadow-lg neon-glow disabled:opacity-50"
              >
                {currentSlide === slides.length - 1 ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Comenzar Práctica
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Indicador de audio */}
            {isSpeaking && !isMuted && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-8 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-12 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-10 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-14 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-8 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        </div>

        {/* Indicadores de slides */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-blue-500'
                  : completedSlides.has(index)
                  ? 'w-2 bg-green-500'
                  : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
