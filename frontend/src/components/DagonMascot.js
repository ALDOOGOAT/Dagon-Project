export const DagonMascot = ({ mood = 'happy', size = 'medium' }) => {
  const sizeMap = {
    small: 60,
    medium: 100,
    large: 150
  };
  
  const actualSize = sizeMap[size] || sizeMap.medium;
  
  const getEyeExpression = () => {
    switch(mood) {
      case 'sad':
        return {
          leftEye: { cy: 45, height: 8 },
          rightEye: { cy: 45, height: 8 }
        };
      case 'excited':
        return {
          leftEye: { cy: 42, height: 18 },
          rightEye: { cy: 42, height: 18 }
        };
      case 'happy':
      default:
        return {
          leftEye: { cy: 43, height: 14 },
          rightEye: { cy: 43, height: 14 }
        };
    }
  };
  
  const eyes = getEyeExpression();
  
  return (
    <div className="animate-float" data-testid="dagon-mascot">
      <svg
        width={actualSize}
        height={actualSize}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-breathe"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="bodyGradient">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </radialGradient>
        </defs>
        
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="url(#bodyGradient)"
          filter="url(#glow)"
        />
        
        <ellipse
          cx="35"
          cy={eyes.leftEye.cy}
          rx="8"
          ry={eyes.leftEye.height}
          fill="white"
        />
        <ellipse
          cx="65"
          cy={eyes.rightEye.cy}
          rx="8"
          ry={eyes.rightEye.height}
          fill="white"
        />
        
        <ellipse
          cx="35"
          cy="45"
          rx="3"
          ry="5"
          fill="#1E293B"
        />
        <ellipse
          cx="65"
          cy="45"
          rx="3"
          ry="5"
          fill="#1E293B"
        />
        
        {mood === 'happy' && (
          <path
            d="M 35 60 Q 50 70 65 60"
            stroke="#1E293B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        
        {mood === 'sad' && (
          <path
            d="M 35 65 Q 50 55 65 65"
            stroke="#1E293B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        
        <circle cx="20" cy="30" r="5" fill="#B91C1C" opacity="0.6" />
        <circle cx="80" cy="30" r="5" fill="#B91C1C" opacity="0.6" />
        
        <g transform="translate(15, 55)">
          <path d="M 0 0 Q -8 10 -5 15" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(85, 55)">
          <path d="M 0 0 Q 8 10 5 15" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(25, 70)">
          <path d="M 0 0 Q -5 15 -2 20" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(75, 70)">
          <path d="M 0 0 Q 5 15 2 20" stroke="#DC2626" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};