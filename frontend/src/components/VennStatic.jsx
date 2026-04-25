import React from 'react';
import { motion } from 'framer-motion';

const VennStatic = ({ sets = [], headline, lead }) => {
  const colors = {
    cyan: '#22d3ee',
    purple: '#a855f7',
    red: '#ef4444',
    blue: '#3b82f6',
    orange: '#f97316',
    green: '#22c55e',
  };

  if (sets.length === 1) {
    const s = sets[0];
    const color = colors[s.color] || primary;
    return (
      <div className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-[70%] aspect-square rounded-full flex items-center justify-center border-2"
          style={{ 
            backgroundColor: `${color}33`, 
            borderColor: color,
            boxShadow: `0 0 30px ${color}44`
          }}
        >
          <span className="text-white font-bold text-lg drop-shadow-md">{s.label}</span>
        </motion.div>
        {s.elements && (
          <div className="absolute bottom-4 flex gap-2 flex-wrap justify-center max-w-[200px]">
            {s.elements.map((el, i) => (
              <span key={i} className="px-2 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-white/10">
                {el}
              </span>
            ))}
            {s.exclude && s.exclude.map((el, i) => (
              <span key={`ex-${i}`} className="px-2 py-1 rounded-full text-xs font-bold bg-red-900/30 text-red-300 border border-red-500/30 line-through">
                {el}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (sets.length === 2) {
    const s1 = sets[0];
    const s2 = sets[1];
    const c1 = colors[s1.color] || primary;
    const c2 = colors[s2.color] || secondary;
    
    return (
      <div className="relative w-full aspect-square max-w-[300px] mx-auto flex items-center justify-center">
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute left-[15%] w-[55%] aspect-square rounded-full flex items-center justify-start pl-4 border-2"
          style={{ 
            backgroundColor: `${c1}44`, 
            borderColor: c1 
          }}
        >
          <span className="text-white font-bold text-sm">{s1.label}</span>
        </motion.div>
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute right-[15%] w-[55%] aspect-square rounded-full flex items-center justify-end pr-4 border-2"
          style={{ 
            backgroundColor: `${c2}44`, 
            borderColor: c2 
          }}
        >
          <span className="text-white font-bold text-sm text-right">{s2.label}</span>
        </motion.div>
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute w-[30%] aspect-square rounded-full border-2 border-white/50"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.15)',
            mixBlendMode: 'overlay'
          }}
        />
      </div>
    );
  }

  if (sets.length === 3) {
    return (
      <div className="relative w-full aspect-square max-w-[320px] mx-auto flex items-center justify-center">
        {sets.map((s, i) => {
          const pos = [
            { x: '20%', y: '10%' },
            { x: '60%', y: '10%' },
            { x: '40%', y: '55%' }
          ][i];
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ delay: i * 0.1 }}
              className="absolute w-[45%] aspect-square rounded-full border-2"
              style={{ 
                left: pos.x,
                top: pos.y,
                backgroundColor: `${colors[s.color] || primary}33`,
                borderColor: colors[s.color] || primary
              }}
            >
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap">
                {s.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    );
  }

  return null;
};

export default VennStatic;