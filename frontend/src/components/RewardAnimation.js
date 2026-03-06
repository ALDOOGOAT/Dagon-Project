import { useEffect, useState } from 'react';
import { DagonMascot } from './DagonMascot';
import { Trophy, Star, Zap } from 'lucide-react';

export const RewardAnimation = ({ type = 'success', xpGained = 0, onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="text-center animate-in zoom-in duration-500">
        {/* Dagon celebrando */}
        <div className="mb-8 scale-150 animate-bounce">
          <DagonMascot size="large" mood="excited" />
        </div>

        {/* Mensaje principal */}
        <h2 className="text-6xl font-bold text-white mb-4 animate-in slide-in-from-bottom-4 duration-500">
          {type === 'success' ? '¡Perfecto!' : '¡Excelente!'}
        </h2>

        {/* Estrellas animadas */}
        <div className="flex justify-center gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <Star 
              key={i}
              className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        {/* XP ganado */}
        {xpGained > 0 && (
          <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20 rounded-2xl p-6 inline-block animate-in zoom-in duration-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-yellow-900" />
              </div>
              <div className="text-left">
                <p className="text-white text-2xl font-bold">+{xpGained} XP</p>
                <p className="text-blue-200 text-sm">¡Sigue así!</p>
              </div>
            </div>
          </div>
        )}

        {/* Confetti effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
