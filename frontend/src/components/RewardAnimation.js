import { useEffect, useState, useMemo } from 'react';
import { DagonMascot } from './DagonMascot';
import { Star, Zap, Sparkles, Crown } from 'lucide-react';

const CONFETTI_COLORS = ['#facc15', '#f97316', '#ef4444', '#22d3ee', '#a855f7', '#10b981'];

const buildConfetti = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.4 + Math.random() * 1.8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }));

export const RewardAnimation = ({
  type = 'success',
  xpGained = 0,
  isLevelUp = false,
  newTitle = null,
  newLevel = null,
  onComplete,
}) => {
  const [show, setShow] = useState(true);
  const confettiCount = isLevelUp ? 90 : 35;
  const confetti = useMemo(() => buildConfetti(confettiCount), [confettiCount]);
  const duration = isLevelUp ? 4500 : 2800;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onComplete) onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  if (!show) return null;

  const title = isLevelUp ? '¡SUBISTE DE NIVEL!' : type === 'success' ? '¡Perfecto!' : '¡Excelente!';

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      {/* Confetti rain */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="absolute top-0 animate-confetti rounded-sm"
            style={{
              left: `${c.left}%`,
              width: `${c.size}px`,
              height: `${c.size * 1.6}px`,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
              boxShadow: `0 0 12px ${c.color}80`,
            }}
          />
        ))}
      </div>

      {/* Aurora bloom */}
      {isLevelUp && (
        <>
          <div className="absolute inset-0 bg-gradient-radial from-yellow-500/20 via-transparent to-transparent animate-pulse" />
          <div className="absolute -inset-20 opacity-60 blur-3xl">
            <div className="absolute inset-0 bg-aurora rounded-full" />
          </div>
        </>
      )}

      <div className="relative text-center max-w-2xl px-8 animate-pop-in">
        {/* Mascot */}
        <div className="mb-6 flex justify-center">
          <div className={`relative ${isLevelUp ? 'animate-level-up' : 'animate-pop-in'}`}>
            {isLevelUp && (
              <div className="absolute -inset-12 rounded-full bg-yellow-400/20 blur-2xl animate-pulse-glow" />
            )}
            <div className="relative">
              <DagonMascot size="large" mood="excited" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2
          className={`font-display font-black mb-4 leading-none ${
            isLevelUp
              ? 'text-7xl text-gradient-gold drop-shadow-[0_0_30px_rgba(250,204,21,0.45)]'
              : 'text-6xl text-white'
          }`}
        >
          {title}
        </h2>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-6">
          {[...Array(3)].map((_, i) => (
            <Star
              key={i}
              className="w-10 h-10 text-yellow-400 fill-yellow-400 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>

        {/* Level up details */}
        {isLevelUp && (newLevel || newTitle) && (
          <div className="mb-6 inline-flex flex-col items-center gap-3 px-8 py-5 rounded-2xl glass-card-apple holo-border">
            {newLevel != null && (
              <div className="flex items-center gap-3">
                <Crown className="w-7 h-7 text-yellow-300" />
                <span className="font-display text-3xl font-black text-white tracking-wide">
                  Nivel <span className="text-gradient-gold">{newLevel}</span>
                </span>
              </div>
            )}
            {newTitle && (
              <div className="flex items-center gap-2 text-cyan-300">
                <Sparkles className="w-4 h-4" />
                <span className="font-gameui font-bold tracking-widest text-sm uppercase">
                  Nuevo título: {newTitle}
                </span>
                <Sparkles className="w-4 h-4" />
              </div>
            )}
          </div>
        )}

        {/* XP gained */}
        {xpGained > 0 && (
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl glass-card-apple border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.25)]">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_18px_rgba(250,204,21,0.5)]">
              <Zap className="w-6 h-6 text-yellow-900" />
            </div>
            <div className="text-left">
              <p className="text-white text-3xl font-black font-display leading-none">+{xpGained} XP</p>
              <p className="text-blue-200 text-xs font-bold tracking-widest uppercase mt-1">
                {isLevelUp ? '¡Las profundidades te recompensan!' : '¡Sigue así, aventurero!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
