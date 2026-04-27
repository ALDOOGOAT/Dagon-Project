import React from 'react';

export const DagonMascot = ({ mood = 'happy', size = 'medium', animated = true, showFire = false }) => {
  const sizeMap = {
    small: 80,
    medium: 120,
    large: 160,
    xlarge: 200
  };
  
  const actualSize = sizeMap[size] || sizeMap.medium;
  
  const getMoodColors = () => {
    const redPrimary = '#ff4757';
    switch(mood) {
      case 'excited': return { primary: '#ff6b6b', secondary: '#ee5253', glow: '#ff9f43' };
      case 'angry':   return { primary: '#eb4d4b', secondary: '#4834d4', glow: '#ff0000' };
      case 'sad':     return { primary: '#95afc0', secondary: '#535c68', glow: '#dff9fb' };
      default:        return { primary: redPrimary, secondary: '#8b0000', glow: '#ff7f50' };
    }
  };
  
  const getAnimation = () => {
    if (!animated) return '';
    switch(mood) {
      case 'excited': return 'animate-dagon-excited';
      case 'thinking': return 'animate-dagon-thinking';
      default: return 'animate-float';
    }
  };

  const getGlowEffect = () => {
    if (!animated) return '';
    return 'drop-shadow-[0_0_20px_rgba(255,71,87,0.4)]';
  };
  
  const colors = getMoodColors();
  const animationClass = getAnimation();
  const glowClass = getGlowEffect();

  return (
    <div className={`relative inline-block ${animationClass}`} data-testid="dagon-mascot">
      <svg
        width={actualSize}
        height={actualSize * 1.1}
        viewBox="0 0 120 140"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-breathe"
        style={{ transformOrigin: 'center 60px' }}
      >
        <defs>
          <radialGradient id="bodyGrad" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#ff9f9f" />
            <stop offset="50%" stopColor="#ff4757" />
            <stop offset="100%" stopColor="#5c0000" />
          </radialGradient>
          
          <radialGradient id="eyeGrad" cx="40%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f0fdfa" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>

          <linearGradient id="headShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <g className={glowClass} transform="translate(0, 10)">
          
          {/* 1. CONTORNO STICKER */}
          <g fill="black" stroke="black" strokeWidth="5" strokeLinejoin="round">
             <path d="M 10 85 Q 10 20, 60 10 Q 110 20, 110 85 L 10 85 Z" />
             <ellipse cx="60" cy="85" rx="52" ry="14" />
          </g>

          {/* 2. BASE OSCURA */}
          <ellipse cx="60" cy="85" rx="50" ry="12" fill="#1e2124" />

          {/* 3. TENTÁCULOS DE GOMINOLA */}
          <g>
            {[
              { x: 30, delay: '0s', len: 25 },
              { x: 45, delay: '0.4s', len: 35 },
              { x: 60, delay: '0.8s', len: 45 },
              { x: 75, delay: '1.2s', len: 35 },
              { x: 90, delay: '1.6s', len: 25 }
            ].map((t, i) => (
              <g key={i}>
                <path
                  d={`M ${t.x-5} 85 Q ${t.x} ${85+t.len+5}, ${t.x+5} 85`}
                  fill="black"
                >
                   <animate attributeName="d" 
                    values={`M ${t.x-5} 85 Q ${t.x} ${85+t.len+5}, ${t.x+5} 85; M ${t.x-7} 85 Q ${t.x-3} ${85+t.len+10}, ${t.x+3} 85; M ${t.x-5} 85 Q ${t.x} ${85+t.len+5}, ${t.x+5} 85`} 
                    dur="3s" begin={t.delay} repeatCount="indefinite" />
                </path>
                <path
                  d={`M ${t.x-3} 85 Q ${t.x} ${85+t.len}, ${t.x+3} 85`}
                  fill="#8b0000"
                >
                  <animate attributeName="d" 
                    values={`M ${t.x-3} 85 Q ${t.x} ${85+t.len}, ${t.x+3} 85; M ${t.x-5} 85 Q ${t.x-3} ${85+t.len+5}, ${t.x+1} 85; M ${t.x-3} 85 Q ${t.x} ${85+t.len}, ${t.x+3} 85`} 
                    dur="3s" begin={t.delay} repeatCount="indefinite" />
                </path>
                {/* Brillo en tentáculo */}
                <circle cx={t.x-1} cy={95} r="1.5" fill="white" opacity="0.2" />
              </g>
            ))}
          </g>
          
          {/* 4. CUERPO PRINCIPAL */}
          <path
            d="M 10 85 Q 10 20, 60 10 Q 110 20, 110 85 L 10 85 Z"
            fill="url(#bodyGrad)"
            stroke="black"
            strokeWidth="1.2"
          />

          {/* BRILLO GLOSSY EN LA CABEZA */}
          <path
            d="M 30 35 Q 60 18, 90 35 Q 60 25, 30 35"
            fill="url(#headShine)"
            opacity="0.6"
          />

          {/* 5. OJOS MASTER (Líquidos y expresivos) */}
          <g transform="translate(35, 52)">
             <circle r="16" fill="black" />
             <circle r="13" fill="url(#eyeGrad)" />
             <circle r="6.5" cy="1" fill="#0f172a" />
             <circle cx="-4" cy="-5" r="3.5" fill="white" opacity="0.9" />
             <circle cx="4" cy="4" r="1.8" fill="white" opacity="0.4" />
          </g>

          <g transform="translate(85, 52)">
             <circle r="16" fill="black" />
             <circle r="13" fill="url(#eyeGrad)" />
             <circle r="6.5" cy="1" fill="#0f172a" />
             <circle cx="-4" cy="-5" r="3.5" fill="white" opacity="0.9" />
             <circle cx="4" cy="4" r="1.8" fill="white" opacity="0.4" />
          </g>

          {/* BOCA CARISMÁTICA */}
          <path 
            d="M 53 78 Q 60 83, 67 78" 
            fill="none" 
            stroke="black" 
            strokeWidth="3" 
            strokeLinecap="round" 
            opacity="0.8" 
          />

        </g>

        {showFire && (
          <g transform="translate(0, 15)">
            <path d="M30 95 Q25 75 35 65 Q30 75 35 55" stroke="#ff6b35" strokeWidth="4" fill="none" opacity="0.9">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="0.4s" repeatCount="indefinite" />
            </path>
          </g>
        )}
      </svg>
    </div>
  );
};

const getEyeState = () => ({ scale: 1, opacity: 1, angle: 0, pupils: false });
