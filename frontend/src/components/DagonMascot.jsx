import React from 'react';

export const DagonMascot = ({ mood = 'happy', size = 'medium', animated = true, showFire = false }) => {
  const sizeMap = {
    small: 80,
    medium: 120,
    large: 180,
    xlarge: 220
  };
  
  const actualSize = sizeMap[size] || sizeMap.medium;
  
  const getMoodColors = () => {
    const dagonRed = '#ff3e3e';
    const dagonDarkRed = '#8b0000';
    const dagonWhite = '#ffffff';

    switch(mood) {
      case 'excited':
      case 'celebrating':
        return { primary: dagonRed, secondary: dagonDarkRed, glow: '#ff6b6b', accent: dagonWhite };
      case 'angry':
        return { primary: '#b91c1c', secondary: '#450a0a', glow: '#ef4444', accent: dagonWhite };
      case 'sad':
      case 'disappointed':
        return { primary: '#991b1b', secondary: '#450a0a', glow: '#7f1d1d', accent: '#cbd5e1' };
      case 'thinking':
        return { primary: dagonRed, secondary: '#5b21b6', glow: '#a78bfa', accent: dagonWhite };
      default:
        return { primary: dagonRed, secondary: dagonDarkRed, glow: '#ff4444', accent: dagonWhite };
    }
  };
  
  const getAnimation = () => {
    if (!animated) return '';
    switch(mood) {
      case 'excited': return 'animate-dagon-excited';
      case 'nervous': return 'animate-dagon-nervous';
      case 'thinking': return 'animate-dagon-thinking';
      case 'angry': return 'animate-dagon-angry';
      case 'afraid': return 'animate-dagon-shake';
      default: return 'animate-float';
    }
  };

  const getGlowEffect = () => {
    if (!animated) return '';
    switch(mood) {
      case 'excited': return 'drop-shadow-[0_0_20px_rgba(255,107,107,0.8)]';
      case 'angry': return 'drop-shadow-[0_0_25px_rgba(255,0,0,0.9)]';
      case 'thinking': return 'drop-shadow-[0_0_15px_rgba(159,122,234,0.6)]';
      default: return 'drop-shadow-[0_0_15px_rgba(255,68,68,0.5)]';
    }
  };
  
  const colors = getMoodColors();
  const eyeState = getEyeState();
  const animationClass = getAnimation();
  const glowClass = getGlowEffect();

  return (
    <div className={`relative inline-block ${animationClass}`} data-testid="dagon-mascot">
      <svg
        width={actualSize}
        height={actualSize * 0.85}
        viewBox="0 0 120 100"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-breathe"
        style={{ transformOrigin: 'center bottom' }}
      >
        <defs>
          <radialGradient id="dagonBodyGradient" cx="50%" cy="40%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.glow} />
          </radialGradient>
          <radialGradient id="eyeIrisGradient">
            <stop offset="0%" stopColor="#fee2e2" />
            <stop offset="40%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <filter id="dagonGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="eyeDarkness">
            <feGaussianBlur stdDeviation="2"/>
          </filter>
        </defs>
        
        <g className={glowClass}>
          {/* Tentáculos */}
          <g opacity="0.4">
            <ellipse cx="30" cy="88" rx="4" ry="10" fill={colors.secondary}>
              <animate attributeName="ry" values="10;12;10" dur="3s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="45" cy="92" rx="3" ry="8" fill={colors.secondary}>
              <animate attributeName="ry" values="8;10;8" dur="4s" repeatCount="indefinite" begin="0.5s" />
            </ellipse>
            <ellipse cx="60" cy="93" rx="3" ry="7" fill={colors.secondary}>
              <animate attributeName="ry" values="7;9;7" dur="3.5s" repeatCount="indefinite" begin="1s" />
            </ellipse>
            <ellipse cx="75" cy="92" rx="3" ry="8" fill={colors.secondary}>
              <animate attributeName="ry" values="8;10;8" dur="4.2s" repeatCount="indefinite" begin="0.2s" />
            </ellipse>
            <ellipse cx="90" cy="88" rx="4" ry="10" fill={colors.secondary}>
              <animate attributeName="ry" values="10;12;10" dur="3.2s" repeatCount="indefinite" begin="0.8s" />
            </ellipse>
          </g>
          
          {/* Cuerpo */}
          <ellipse cx="60" cy="85" rx="50" ry="12" fill={colors.secondary} opacity="0.6" />
          <path
            d="M 10 85 Q 10 25, 60 15 Q 110 25, 110 85 L 10 85 Z"
            fill="url(#dagonBodyGradient)"
            filter="url(#dagonGlow)"
          />

          {/* CAPUCHA BLANCA */}
          <path
            d="M 25 35 Q 60 5, 95 35 Q 90 20, 60 18 Q 30 20, 25 35 Z"
            fill="white"
            opacity="0.95"
          >
            <animate attributeName="d" values="M 25 35 Q 60 5, 95 35 Q 90 20, 60 18 Q 30 20, 25 35 Z;M 25 37 Q 60 3, 95 37 Q 90 18, 60 16 Q 30 18, 25 37 Z;M 25 35 Q 60 5, 95 35 Q 90 20, 60 18 Q 30 20, 25 35 Z" dur="6s" repeatCount="indefinite" />
          </path>
          <path
            d="M 20 50 Q 20 20, 60 15 Q 100 20, 100 50 Q 85 42, 60 42 Q 35 42, 20 50 Z"
            fill="white"
            opacity="0.85"
          />

          {/* Marcas de los ojos */}
          <g opacity="0.3" fill="black">
            <ellipse cx="35" cy="58" rx="16" ry="10" filter="url(#eyeDarkness)" />
            <ellipse cx="85" cy="58" rx="16" ry="10" filter="url(#eyeDarkness)" />
          </g>
          
          {/* Ojos */}
          <g transform="translate(35, 50)">
            <ellipse cx="0" cy="0" rx="14" ry="18" fill="#450a0a" filter="url(#dagonGlow)" />
            <ellipse cx="0" cy="0" rx="12" ry="16" fill="url(#eyeIrisGradient)" />
            <ellipse cx="0" cy="1" rx="7" ry="9" fill="#000000" />
            <circle cx="-3" cy="-4" r="3" fill="white" opacity="0.8" />
          </g>
          
          <g transform="translate(85, 50)">
            <ellipse cx="0" cy="0" rx="14" ry="18" fill="#450a0a" filter="url(#dagonGlow)" />
            <ellipse cx="0" cy="0" rx="12" ry="16" fill="url(#eyeIrisGradient)" />
            <ellipse cx="0" cy="1" rx="7" ry="9" fill="#000000" />
            <circle cx="-3" cy="-4" r="3" fill="white" opacity="0.8" />
          </g>
        </g>
      </svg>
    </div>
  );
};

const getEyeState = () => {
  // Función auxiliar movida fuera para limpieza o podrías dejarla dentro
  // Por ahora la dejaré vacía para que el compilador no falle si no se usa
  return { scale: 1, opacity: 1, angle: 0, pupils: false }; 
};
