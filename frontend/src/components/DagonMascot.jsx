import React from 'react';

export const DagonMascot = ({ mood = 'happy', size = 'medium', animated = true, showFire = false }) => {
  const instanceId = React.useId().replace(/:/g, '');
  const sizeMap = {
    small: 80,
    medium: 120,
    large: 180,
    xlarge: 220
  };
  
  const actualSize = sizeMap[size] || sizeMap.medium;
  
  const getMoodColors = () => {
    switch(mood) {
      case 'love':
      case 'grateful':
        return { primary: '#ff6b9d', secondary: '#ec4899', glow: '#f472b6', accent: '#fbcfe8' };
      case 'excited':
      case 'celebrating':
        return { primary: '#ff6b6b', secondary: '#ff4757', glow: '#ff6b6b', accent: '#ffd93d' };
      case 'happy':
        return { primary: '#ff5555', secondary: '#ff3344', glow: '#ff5555', accent: '#ffa502' };
      case 'determined':
        return { primary: '#ee3333', secondary: '#cc2222', glow: '#ff4444', accent: '#ff6348' };
      case 'angry':
        return { primary: '#8b0000', secondary: '#5c0000', glow: '#ff0000', accent: '#ff2222' };
      case 'sad':
      case 'disappointed':
        return { primary: '#4a5568', secondary: '#2d3748', glow: '#718096', accent: '#a0aec0' };
      case 'nervous':
        return { primary: '#dd6b20', secondary: '#c05621', glow: '#ed8936', accent: '#f6ad55' };
      case 'thinking':
        return { primary: '#805ad5', secondary: '#6b46c1', glow: '#9f7aea', accent: '#b794f4' };
      case 'speaking':
        return { primary: '#d69e2e', secondary: '#b7791f', glow: '#ecc94b', accent: '#f6e05e' };
      case 'afraid':
        return { primary: '#1a365c', secondary: '#0d1f3c', glow: '#3182ce', accent: '#63b3ed' };
      default:
        return { primary: '#ff5555', secondary: '#ff3344', glow: '#ff5555', accent: '#ffa502' };
    }
  };
  
  const getEyeState = () => {
    const colors = getMoodColors();
    switch(mood) {
      case 'love':
      case 'grateful':
        return { scale: 1, opacity: 1, rx: 14, ry: 18, angle: 0, color: colors.glow, heartEyes: true };
      case 'sad':
      case 'disappointed':
        return { scale: 0.7, opacity: 0.5, rx: 14, ry: 12, angle: 15, color: colors.glow };
      case 'excited':
      case 'celebrating':
        return { scale: 1.4, opacity: 1, rx: 16, ry: 22, angle: 0, color: colors.glow, sparkle: true };
      case 'angry':
        return { scale: 0.85, opacity: 1, rx: 16, ry: 10, angle: -8, color: '#ff0000', brow: true };
      case 'nervous':
        return { scale: 1.1, opacity: 1, rx: 18, ry: 20, angle: 5, color: colors.glow, shake: true };
      case 'thinking':
        return { scale: 0.9, opacity: 0.85, rx: 10, ry: 14, angle: 0, color: colors.glow };
      case 'speaking':
        return { scale: 1.15, opacity: 1, rx: 15, ry: 19, angle: 0, color: colors.glow };
      case 'afraid':
        return { scale: 1.3, opacity: 1, rx: 16, ry: 20, angle: 0, color: '#63b3ed', pupils: true };
      case 'happy':
      default:
        return { scale: 1, opacity: 0.95, rx: 12, ry: 16, angle: 0, color: colors.glow };
    }
  };
  
  const getAnimation = () => {
    if (!animated) return '';
    switch(mood) {
      case 'love':
      case 'grateful':
        return 'animate-dagon-love';
      case 'excited':
      case 'celebrating':
        return 'animate-dagon-excited';
      case 'nervous':
        return 'animate-dagon-nervous';
      case 'angry':
        return 'animate-dagon-angry';
      case 'speaking':
        return 'animate-dagon-speaking';
      case 'sad':
      case 'disappointed':
        return 'animate-breathe-slow';
      case 'thinking':
        return 'animate-dagon-thinking';
      case 'afraid':
        return 'animate-dagon-shake';
      default:
        return 'animate-dagon-idle';
    }
  };
  
  const getGlowEffect = () => {
    if (!animated) return '';
    switch(mood) {
      case 'excited':
      case 'celebrating':
        return 'drop-shadow-[0_0_20px_rgba(255,107,107,0.8)]';
      case 'angry':
        return 'drop-shadow-[0_0_25px_rgba(255,0,0,0.9)]';
      case 'nervous':
        return 'drop-shadow-[0_0_15px_rgba(237,137,54,0.7)]';
      case 'thinking':
        return 'drop-shadow-[0_0_15px_rgba(159,122,234,0.6)]';
      default:
        return 'drop-shadow-[0_0_10px_rgba(255,68,68,0.5)]';
    }
  };
  
  const colors = getMoodColors();
  const eyeState = getEyeState();
  const glowClass = getGlowEffect();
  const animationClass = getAnimation();
  const bodyGradientId = `dagonBodyGradient-${instanceId}`;
  const eyeGlowId = `dagonEyeGlow-${instanceId}`;
  const glowId = `dagonGlow-${instanceId}`;
  const innerShadowId = `innerShadow-${instanceId}`;
  const angryBrowId = `angryBrow-${instanceId}`;

  return (
    <div className={`relative inline-block dagon-mascot-shell ${animated ? animationClass : ''}`} data-testid="dagon-mascot">
      <svg
        width={actualSize}
        height={actualSize * 0.85}
        viewBox="0 0 120 100"
        xmlns="http://www.w3.org/2000/svg"
        className={`dagon-mascot-svg ${animated ? 'animate-dagon-breathe' : ''} ${glowClass}`}
      >
        <defs>
          <radialGradient id={bodyGradientId} cx="50%" cy="40%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="50%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.glow} />
          </radialGradient>
          <radialGradient id={eyeGlowId} cx="50%" cy="50%">
            <stop offset="0%" stopColor={colors.glow} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id={innerShadowId}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id={angryBrowId}>
            <feGaussianBlur stdDeviation="1.5"/>
          </filter>
        </defs>
        
        <g opacity="0.4">
          <ellipse cx="30" cy="88" rx="4" ry="10" fill={colors.secondary} />
          <ellipse cx="45" cy="92" rx="3" ry="8" fill={colors.secondary} />
          <ellipse cx="60" cy="93" rx="3" ry="7" fill={colors.secondary} />
          <ellipse cx="75" cy="92" rx="3" ry="8" fill={colors.secondary} />
          <ellipse cx="90" cy="88" rx="4" ry="10" fill={colors.secondary} />
        </g>
        
        <ellipse
          cx="60"
          cy="85"
          rx="50"
          ry="12"
          fill={colors.secondary}
          opacity="0.6"
        />
        
        <path
          d="M 10 85 Q 10 25, 60 15 Q 110 25, 110 85 L 10 85 Z"
          fill={`url(#${bodyGradientId})`}
          filter={`url(#${glowId})`}
        />
        
        <path
          d="M 15 85 Q 15 30, 60 20 Q 105 30, 105 85 L 15 85 Z"
          fill={colors.secondary}
          filter={`url(#${innerShadowId})`}
          opacity="0.15"
        />
        
        {mood === 'angry' && (
          <g stroke={colors.accent} strokeWidth="3" strokeLinecap="round" opacity="0.9">
            <line x1="22" y1="28" x2="45" y2="38" filter={`url(#${angryBrowId})`} />
            <line x1="98" y1="28" x2="75" y2="38" filter={`url(#${angryBrowId})`} />
          </g>
        )}
        
        {mood === 'sad' || mood === 'disappointed' ? (
          <g stroke={colors.accent} strokeWidth="2" strokeLinecap="round" opacity="0.6">
            <path d="M 25 32 Q 40 28, 48 35" />
            <path d="M 95 32 Q 80 28, 72 35" />
          </g>
        ) : null}
        
        <g transform={`translate(35, 50) scale(${eyeState.scale}) rotate(${eyeState.angle}, 0, 0)`} opacity={eyeState.opacity}>
          <ellipse
            cx="0"
            cy="0"
            rx="14"
            ry="18"
            fill={colors.primary}
            filter={`url(#${glowId})`}
          />
          <ellipse
            cx="0"
            cy="0"
            rx="12"
            ry="16"
            fill={eyeState.color || colors.glow}
          />
          <ellipse cx="-4" cy="-6" rx="5" ry="7" fill="rgba(255,255,255,0.9)" />
          <ellipse cx="5" cy="4" rx="2" ry="3" fill="rgba(255,255,255,0.4)" />
          
          {eyeState.pupils && (
            <ellipse cx="0" cy="0" rx="4" ry="6" fill="#1a202c" />
          )}
        </g>
        
        <g transform={`translate(85, 50) scale(${eyeState.scale}) rotate(${-eyeState.angle}, 0, 0)`} opacity={eyeState.opacity}>
          <ellipse
            cx="0"
            cy="0"
            rx="14"
            ry="18"
            fill={colors.primary}
            filter={`url(#${glowId})`}
          />
          <ellipse
            cx="0"
            cy="0"
            rx="12"
            ry="16"
            fill={eyeState.color || colors.glow}
          />
          <ellipse cx="-4" cy="-6" rx="5" ry="7" fill="rgba(255,255,255,0.9)" />
          <ellipse cx="5" cy="4" rx="2" ry="3" fill="rgba(255,255,255,0.4)" />
          
          {eyeState.pupils && (
            <ellipse cx="0" cy="0" rx="4" ry="6" fill="#1a202c" />
          )}
        </g>
        
        {eyeState.sparkle && (
          <g fill={colors.accent}>
            <circle cx="25" cy="35" r="2" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="95" cy="35" r="2" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.5s" repeatCount="indefinite" begin="0.25s" />
            </circle>
            <circle cx="60" cy="20" r="3" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.1;0.6" dur="0.7s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
        
        {/* Corazones en los ojos para mood love/grateful */}
        {eyeState.heartEyes && (
          <g fill="#ff69b4">
            {/* Corazón ojo izquierdo */}
            <path transform="translate(30, 48) scale(0.6)" d="M 0 -5 C -5 -10 -15 -5 -15 2 C -15 10 0 18 0 18 C 0 18 15 10 15 2 C 15 -5 5 -10 0 -5">
              <animate attributeName="opacity" values="1;0.7;1" dur="0.6s" repeatCount="indefinite" />
            </path>
            {/* Corazón ojo derecho */}
            <path transform="translate(80, 48) scale(0.6)" d="M 0 -5 C -5 -10 -15 -5 -15 2 C -15 10 0 18 0 18 C 0 18 15 10 15 2 C 15 -5 5 -10 0 -5">
              <animate attributeName="opacity" values="1;0.7;1" dur="0.6s" repeatCount="indefinite" begin="0.3s" />
            </path>
            {/* Corazoncitos flotando */}
            <circle cx="20" cy="65" r="2" fill="#ff69b4" opacity="0.8">
              <animate attributeName="cy" values="65;55;65" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="60" r="1.5" fill="#ff69b4" opacity="0.7">
              <animate attributeName="cy" values="60;50;60" dur="1.2s" repeatCount="indefinite" begin="0.2s" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
        
        {(mood === 'sad' || mood === 'disappointed') && (
          <g fill={colors.accent} opacity="0.6">
            <ellipse cx="28" cy="72" rx="3" ry="5">
              <animate attributeName="ry" values="5;3;5" dur="2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="92" cy="72" rx="3" ry="5">
              <animate attributeName="ry" values="5;3;5" dur="2s" repeatCount="indefinite" begin="1s" />
            </ellipse>
          </g>
        )}
        
        {mood === 'nervous' && (
          <g fill="#63b3ed">
            <ellipse cx="20" cy="40" rx="2" ry="4">
              <animate attributeName="cy" values="40;50;40" dur="0.8s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="100" cy="40" rx="2" ry="4">
              <animate attributeName="cy" values="40;50;40" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
            </ellipse>
          </g>
        )}
        
        <g opacity="0.15">
          <circle cx="35" cy="55" r="8" fill="white" />
          <circle cx="85" cy="55" r="8" fill="white" />
          <circle cx="60" cy="70" r="10" fill="white" />
        </g>

        {showFire && (
          <g>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="0.6s" repeatCount="indefinite" />
            <path d="M30 95 Q25 75 35 65 Q30 75 35 55" stroke="#ff6b35" strokeWidth="4" fill="none" opacity="0.9">
              <animate attributeName="d" values="M30 95 Q25 75 35 65 Q30 75 35 55;M30 95 Q28 72 32 62 Q27 72 33 50;M30 95 Q25 75 35 65 Q30 75 35 55" dur="0.4s" repeatCount="indefinite" />
            </path>
            <path d="M45 97 Q40 80 48 70 Q43 80 50 60" stroke="#ff8c00" strokeWidth="3" fill="none" opacity="0.95">
              <animate attributeName="d" values="M45 97 Q40 80 48 70 Q43 80 50 60;M45 97 Q42 77 46 67 Q41 77 52 55;M45 97 Q40 80 48 70 Q43 80 50 60" dur="0.35s" repeatCount="indefinite" />
            </path>
            <path d="M60 98 Q55 82 60 72 Q55 82 60 62" stroke="#ffa500" strokeWidth="3" fill="none">
              <animate attributeName="d" values="M60 98 Q55 82 60 72 Q55 82 60 62;M60 98 Q57 79 60 69 Q55 79 60 58;M60 98 Q55 82 60 72 Q55 82 60 62" dur="0.3s" repeatCount="indefinite" />
            </path>
            <path d="M75 97 Q80 80 72 70 Q77 80 70 60" stroke="#ff8c00" strokeWidth="3" fill="none" opacity="0.95">
              <animate attributeName="d" values="M75 97 Q80 80 72 70 Q77 80 70 60;M75 97 Q78 77 74 67 Q79 77 68 55;M75 97 Q80 80 72 70 Q77 80 70 60" dur="0.35s" repeatCount="indefinite" begin="0.1s" />
            </path>
            <path d="M90 95 Q95 75 85 65 Q90 75 85 55" stroke="#ff6b35" strokeWidth="4" fill="none" opacity="0.9">
              <animate attributeName="d" values="M90 95 Q95 75 85 65 Q90 75 85 55;M90 95 Q92 72 88 62 Q93 72 87 50;M90 95 Q95 75 85 65 Q90 75 85 55" dur="0.4s" repeatCount="indefinite" begin="0.15s" />
            </path>
            <circle cx="38" cy="48" r="3" fill="#ffd23f" opacity="0.8">
              <animate attributeName="cy" values="48;30;48" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="52" cy="42" r="2.5" fill="#ff6b35" opacity="0.7">
              <animate attributeName="cy" values="42;25;42" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="68" cy="45" r="2.5" fill="#ffa500" opacity="0.7">
              <animate attributeName="cy" values="45;28;45" dur="0.9s" repeatCount="indefinite" begin="0.1s" />
              <animate attributeName="opacity" values="0.7;0;0.7" dur="0.9s" repeatCount="indefinite" />
            </circle>
            <circle cx="82" cy="50" r="2" fill="#ffd23f" opacity="0.6">
              <animate attributeName="cy" values="50;32;50" dur="0.85s" repeatCount="indefinite" begin="0.25s" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="0.85s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>
    </div>
  );
};
