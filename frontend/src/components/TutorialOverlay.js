import { useState } from 'react';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { ChevronRight, X } from 'lucide-react';

const tutorialSteps = [
  {
    title: "¡Bienvenido a Dagon! 🎯",
    content: "Soy Dagon, tu guía personal para dominar SQL. Juntos aprenderás desde cero hasta nivel profesional.",
    highlight: null
  },
  {
    title: "Tu Progreso 📊",
    content: "Aquí verás tus puntos XP, tu racha de días y tu posición en el ranking global. ¡Compite con otros estudiantes!",
    highlight: ".grid.grid-cols-1.lg\\:grid-cols-3"
  },
  {
    title: "Niveles de Aprendizaje 🎓",
    content: "Tenemos 5 niveles: desde cero hasta Pro. Cada nivel tiene ejercicios progresivos que te enseñan paso a paso.",
    highlight: null
  },
  {
    title: "Teoría Interactiva 📚",
    content: "Antes de cada ejercicio, te explicaré la teoría con mi voz. Puedes silenciarme si prefieres leer.",
    highlight: null
  },
  {
    title: "Práctica con Drag & Drop 🎮",
    content: "En los primeros niveles, arrastra palabras SQL para construir consultas. ¡Es súper intuitivo!",
    highlight: null
  },
  {
    title: "Clawbot - Tu Tutor IA 🤖",
    content: "¿Tienes dudas? Haz clic en el botón azul flotante. Clawbot responde todas tus preguntas sobre SQL.",
    highlight: null
  },
  {
    title: "¡Comencemos! 🚀",
    content: "Estás listo para tu primera lección. Recuerda: la práctica hace al maestro. ¡Diviértete aprendiendo!",
    highlight: null
  }
];

export const TutorialOverlay = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(true);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShow(false);
      localStorage.setItem('dagon_tutorial_completed', 'true');
      if (onComplete) onComplete();
    }
  };

  const handleSkip = () => {
    setShow(false);
    localStorage.setItem('dagon_tutorial_completed', 'true');
    if (onComplete) onComplete();
  };

  if (!show) return null;

  const step = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" data-testid="tutorial-overlay">
      {/* Contenedor del tutorial */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <div className="backdrop-blur-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-white/20 rounded-3xl p-10 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-500">
          {/* Botón cerrar */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 w-10 h-10 backdrop-blur-xl bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Dagon animado */}
          <div className="flex justify-center mb-6">
            <div className="animate-bounce">
              <DagonMascot size="large" mood="excited" />
            </div>
          </div>

          {/* Contenido */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              {step.title}
            </h2>
            <p className="text-xl text-slate-200 leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Progreso */}
          <div className="flex justify-center gap-2 mb-6">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-blue-500'
                    : index < currentStep
                    ? 'w-2 bg-green-500'
                    : 'w-2 bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Botones */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Saltar Tutorial
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg"
            >
              {currentStep === tutorialSteps.length - 1 ? (
                '¡Empezar! 🚀'
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Highlight element (si hay) */}
      {step.highlight && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      )}
    </div>
  );
};
