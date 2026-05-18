import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DagonMascot } from './DagonMascot';
import { Flame, Sparkles } from 'lucide-react';
import { sounds } from '../lib/SoundEngine';

export const StreakAnimation = ({
  streakCount = 0,
  onComplete
}) => {
  const [show, setShow] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const duration = 5000; // 5 seconds

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    // sounds.playPowerUp(); // Optional: Add a specific streak sound if available, otherwise just play magic or success outside
  }, []);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setShow(false);
      if (onComplete) onComplete();
    }, 400); // Wait for fade out
  }, [onComplete]);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(handleComplete, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, handleComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden"
        >
          {/* Flame background effects */}
          <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
            <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[80vh] bg-gradient-radial from-orange-500/80 via-red-600/30 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '2s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-gradient-radial from-yellow-400/30 via-orange-500/10 to-transparent blur-3xl" />
          </div>

          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, filter: 'blur(10px)' }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className="relative z-10 flex flex-col items-center justify-center text-center p-8 max-w-lg w-full"
          >
            {/* Mascot Container */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-8"
            >
              {/* Core glow behind mascot */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5] 
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-t from-orange-500 to-yellow-300 rounded-full blur-[40px] -z-10"
              />
              
              <DagonMascot size="xlarge" mood="excited" showFire={true} />
              
              {/* Overlay sparks */}
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-4 -right-4 text-yellow-300"
              >
                <Sparkles className="w-12 h-12 animate-pulse" />
              </motion.div>
            </motion.div>

            {/* Streak Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <h2 className="text-4xl md:text-6xl font-black font-display text-white mb-4 tracking-tight drop-shadow-[0_0_15px_rgba(255,100,0,0.8)]">
                ¡RACHA SALVADA!
              </h2>
              
              <div className="flex items-center justify-center gap-4 mt-6 bg-gradient-to-r from-orange-900/40 via-red-900/60 to-orange-900/40 px-8 py-4 rounded-2xl border border-orange-500/30 shadow-[0_0_30px_rgba(234,88,12,0.4)]">
                <Flame className="w-10 h-10 md:w-14 md:h-14 text-orange-400 animate-pulse" style={{ animationDuration: '1s' }} />
                <div className="text-left">
                  <motion.div 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.8, bounce: 0.6 }}
                    className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-orange-400 to-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                  >
                    {streakCount}
                  </motion.div>
                  <div className="text-orange-200 text-lg md:text-xl font-bold uppercase tracking-widest mt-1">
                    Días en fuego
                  </div>
                </div>
              </div>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-6 text-slate-300 text-lg md:text-xl"
              >
                Un día más dominando las bases de datos. ¡Sigue así!
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
