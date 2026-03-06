export const DagonMascot = ({ mood = 'happy', size = 'medium' }) => {
  const sizeMap = {
    small: 80,
    medium: 120,
    large: 180
  };
  
  const actualSize = sizeMap[size] || sizeMap.medium;
  
  const getEyeState = () => {
    switch(mood) {
      case 'sad':
        return { scale: 0.8, opacity: 0.6 };
      case 'excited':
        return { scale: 1.2, opacity: 1 };
      case 'happy':
      default:
        return { scale: 1, opacity: 0.95 };
    }
  };
  
  const eyeState = getEyeState();
  
  return (
    <div className="relative inline-block animate-float" data-testid="dagon-mascot">
      <svg
        width={actualSize}
        height={actualSize * 0.85}
        viewBox="0 0 120 100"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-breathe"
      >
        <defs>
          <radialGradient id="dagonBodyGradient" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#ff4444" />
            <stop offset="50%" stopColor="#ee3333" />
            <stop offset="100%" stopColor="#cc2222" />
          </radialGradient>
          <filter id="dagonGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerShadow">
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
        </defs>
        
        {/* Tentáculos base */}
        <g opacity="0.4">
          <ellipse cx="30" cy="88" rx="4" ry="10" fill="#cc2222" />
          <ellipse cx="45" cy="92" rx="3" ry="8" fill="#cc2222" />
          <ellipse cx="60" cy="93" rx="3" ry="7" fill="#cc2222" />
          <ellipse cx="75" cy="92" rx="3" ry="8" fill="#cc2222" />
          <ellipse cx="90" cy="88" rx="4" ry="10" fill="#cc2222" />
        </g>
        
        {/* Cuerpo domo */}
        <ellipse
          cx="60"
          cy="85"
          rx="50"
          ry="12"
          fill="#aa1111"
          opacity="0.6"
        />
        
        <path
          d="M 10 85 Q 10 25, 60 15 Q 110 25, 110 85 L 10 85 Z"
          fill="url(#dagonBodyGradient)"
          filter="url(#dagonGlow)"
        />
        
        {/* Sombra interna */}
        <path
          d="M 15 85 Q 15 30, 60 20 Q 105 30, 105 85 L 15 85 Z"
          fill="url(#innerShadow)"
          opacity="0.2"
        />
        
        {/* Ojo izquierdo - sin pupila, solo blanco */}
        <g transform={`translate(35, 50) scale(${eyeState.scale})`} opacity={eyeState.opacity}>
          <ellipse
            cx="0"
            cy="0"
            rx="14"
            ry="18"
            fill="white"
            filter="url(#dagonGlow)"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="12"
            ry="16"
            fill="#ffffff"
          />
        </g>
        
        {/* Ojo derecho - sin pupila, solo blanco */}
        <g transform={`translate(85, 50) scale(${eyeState.scale})`} opacity={eyeState.opacity}>
          <ellipse
            cx="0"
            cy="0"
            rx="14"
            ry="18"
            fill="white"
            filter="url(#dagonGlow)"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="12"
            ry="16"
            fill="#ffffff"
          />
        </g>
        
        {/* Brillo en los ojos */}
        <ellipse cx="32" cy="45" rx="4" ry="6" fill="rgba(255,255,255,0.8)" />
        <ellipse cx="82" cy="45" rx="4" ry="6" fill="rgba(255,255,255,0.8)" />
        
        {/* Textura gelatinosa */}
        <g opacity="0.15">
          <circle cx="35" cy="55" r="8" fill="white" />
          <circle cx="85" cy="55" r="8" fill="white" />
          <circle cx="60" cy="70" r="10" fill="white" />
        </g>
      </svg>
    </div>
  );
};