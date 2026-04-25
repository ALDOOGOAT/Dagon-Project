import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, GitMerge, Shield, XCircle, Merge, List, Zap, ArrowRight } from 'lucide-react';

const VennStatic = ({ sets = [], headline, lead, onOperationChange }) => {
  const [activeSet, setActiveSet] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const colors = {
    cyan: '#22d3ee',
    purple: '#a855f7',
    red: '#ef4444',
    blue: '#3b82f6',
    orange: '#f97316',
    green: '#22c55e',
  };

  const getLabel = (idx) => sets[idx]?.label || `Set ${idx + 1}`;
  const getColor = (idx) => colors[sets[idx]?.color] || colors.cyan;

  if (sets.length === 1) {
    const s = sets[0];
    const color = colors[s.color] || colors.cyan;
    return (
      <div className="w-full max-w-md mx-auto p-4">
        {headline && (
          <h3 className="text-center text-lg font-bold text-white mb-2">{headline}</h3>
        )}
        {lead && (
          <p className="text-center text-sm text-slate-400 mb-4">{lead}</p>
        )}
        <div className="relative w-full aspect-square max-w-[280px] mx-auto flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            className="w-[70%] aspect-square rounded-full flex flex-col items-center justify-center border-2 cursor-pointer"
            style={{ 
              backgroundColor: `${color}22`, 
              borderColor: color,
              boxShadow: `0 0 30px ${color}33`,
              minWidth: '180px',
              minHeight: '180px'
            }}
          >
            <Database className="w-8 h-8 mb-2" style={{ color }} />
            <span className="text-white font-bold text-xl drop-shadow-md">{s.label}</span>
            {s.elements && (
              <span className="text-xs mt-1" style={{ color: `${color}88` }}>
                {s.elements.length} elementos
              </span>
            )}
          </motion.div>
          {s.elements && (
            <div className="absolute bottom-0 flex gap-2 flex-wrap justify-center max-w-[240px] px-4">
              {s.elements.map((el, i) => (
                <motion.span 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-2 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-white/10"
                >
                  {el}
                </motion.span>
              ))}
              {s.exclude && s.exclude.map((el, i) => (
                <motion.span 
                  key={`ex-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="px-2 py-1 rounded-full text-xs font-bold bg-red-900/30 text-red-300 border border-red-500/30 line-through"
                >
                  {el}
                </motion.span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (sets.length === 2) {
    const s1 = sets[0];
    const s2 = sets[1];
    const c1 = colors[s1.color] || colors.cyan;
    const c2 = colors[s2.color] || colors.purple;
    
    return (
      <div className="w-full max-w-md mx-auto p-4">
        {headline && (
          <h3 className="text-center text-lg font-bold text-white mb-2">{headline}</h3>
        )}
        {lead && (
          <p className="text-center text-sm text-slate-400 mb-4">{lead}</p>
        )}
        <div className="relative w-full aspect-square max-w-[300px] mx-auto flex items-center justify-center">
          {/* Set A */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ delay: 0.1 }}
            onMouseEnter={() => setActiveSet(0)}
            onMouseLeave={() => setActiveSet(null)}
            className="absolute left-[12%] top-[25%] w-[50%] aspect-square rounded-full flex flex-col items-center justify-center border-2 cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(34,211,238,0.12)', 
              borderColor: c1,
              boxShadow: activeSet === 0 ? `0 0 25px ${c1}44` : 'none'
            }}
          >
            <Filter className="w-5 h-5 mb-1" style={{ color: c1 }} />
            <span className="text-white font-bold text-sm">{s1.label}</span>
            {s1.elements && (
              <span className="text-xs mt-1" style={{ color: `${c1}88` }}>
                {s1.elements.length}
              </span>
            )}
          </motion.div>

          {/* Set B */}
          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ delay: 0.2 }}
            onMouseEnter={() => setActiveSet(1)}
            onMouseLeave={() => setActiveSet(null)}
            className="absolute right-[12%] top-[25%] w-[50%] aspect-square rounded-full flex flex-col items-center justify-center border-2 cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(168,85,247,0.12)', 
              borderColor: c2,
              boxShadow: activeSet === 1 ? `0 0 25px ${c2}44` : 'none'
            }}
          >
            <Zap className="w-5 h-5 mb-1" style={{ color: c2 }} />
            <span className="text-white font-bold text-sm text-right w-full pr-4">{s2.label}</span>
            {s2.elements && (
              <span className="text-xs mt-1" style={{ color: `${c2}88` }}>
                {s2.elements.length}
              </span>
            )}
          </motion.div>

          {/* Intersección */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute top-[40%] left-[38%] w-[24%] aspect-square rounded-full border-2 border-white/50 flex items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <Merge className="w-4 h-4 text-white/70" />
          </motion.div>

          {/* Labels de operación */}
          <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-4">
            <span className="text-xs text-cyan-400">A ∩ B = AND</span>
            <span className="text-xs text-purple-400">A ∪ B = OR</span>
          </div>
        </div>
      </div>
    );
  }

  if (sets.length === 3) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        {headline && (
          <h3 className="text-center text-lg font-bold text-white mb-2">{headline}</h3>
        )}
        {lead && (
          <p className="text-center text-sm text-slate-400 mb-4">{lead}</p>
        )}
        <div className="relative w-full aspect-square max-w-[320px] mx-auto flex items-center justify-center">
          {sets.map((s, i) => {
            const pos = [
              { x: '15%', y: '10%' },
              { x: '60%', y: '10%' },
              { x: '38%', y: '55%' }
            ][i];
            const color = colors[s.color] || colors.cyan;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.6 }}
                whileHover={{ scale: 1.05, opacity: 0.85 }}
                transition={{ delay: i * 0.1 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="absolute w-[45%] aspect-square rounded-full border-2 flex flex-col items-center justify-center cursor-pointer"
                style={{ 
                  left: pos.x,
                  top: pos.y,
                  backgroundColor: `${color}22`,
                  borderColor: color,
                  boxShadow: hoveredIdx === i ? `0 0 25px ${color}44` : 'none'
                }}
              >
                <span className="text-white font-bold text-sm">{s.label}</span>
                {s.elements && (
                  <span className="text-xs" style={{ color: `${color}88` }}>
                    {s.elements.length}
                  </span>
                )}
              </motion.div>
            );
          })}
          <div className="absolute -bottom-8 w-full text-center">
            <span className="text-xs text-slate-400">Triple Intersección (A ∧ B ∧ C)</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VennStatic;