import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Star, Shield, Code, User, ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { Button } from '../components/ui/button';
import { DagonMascot } from '../components/DagonMascot';
import { sounds } from '../lib/SoundEngine';
import { useTheme } from '../contexts/ThemeContext';

export const CreditsPage = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  useEffect(() => {
    sounds.init();
    sounds.startBackgroundMusic();
    return () => sounds.stopBackgroundMusic();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen abyss-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Fondo de Estrellas/Partículas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 10,
              opacity: Math.random() 
            }}
            animate={{ 
              y: -10,
              opacity: [0, 0.8, 0]
            }}
            transition={{ 
              duration: 5 + Math.random() * 10, 
              repeat: Infinity,
              delay: Math.random() * 10
            }}
          />
        ))}
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full text-center relative z-10"
      >
        {/* LOGO / MASCOTA */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="inline-block relative">
            <div className="absolute -inset-8 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" />
            <DagonMascot size="large" mood="excited" />
          </div>
          <h1 className="font-display text-6xl lg:text-7xl font-black text-white mt-6 tracking-tighter">
            SALÓN DE LA <span className="text-gradient-abyss">FAMA</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-12 bg-white/20" />
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-[0.5em]">Dagon Project</span>
            <div className="h-px w-12 bg-white/20" />
          </div>
        </motion.div>

        {/* ASESOR */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="inline-flex flex-col items-center p-8 rounded-[40px] glass-card-apple border-2 border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)] bg-gradient-to-b from-yellow-500/10 to-transparent">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center mb-4 border border-yellow-500/40">
              <Shield className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.4em] mb-2">Asesor de Proyecto</p>
            <h2 className="font-display text-4xl font-black text-white drop-shadow-lg">
              JESÚS ARNULFO ZACARÍAS SANTOS
            </h2>
          </div>
        </motion.div>

        {/* DESARROLLADORES */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="p-8 rounded-[40px] glass-card-apple border border-white/10 hover:border-cyan-400/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 border border-cyan-500/30 group-hover:scale-110 transition-transform">
              <Code className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-left">Desarrollador Legendario</p>
            <h3 className="font-display text-2xl font-black text-white text-left">
              DILHAN JARED MORA LÓPEZ
            </h3>
          </div>

          <div className="p-8 rounded-[40px] glass-card-apple border border-white/10 hover:border-fuchsia-400/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center mb-4 border border-fuchsia-500/30 group-hover:scale-110 transition-transform">
              <Code className="w-6 h-6 text-fuchsia-400" />
            </div>
            <p className="text-fuchsia-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-left">Desarrollador Legendario</p>
            <h3 className="font-display text-2xl font-black text-white text-left">
              ALDO FABIO CONTRERAS MARROQUÍN
            </h3>
          </div>
        </motion.div>

        {/* FOOTER */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-4 text-slate-500 text-sm font-gameui">
            <span>© 2026</span>
            <div className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1">Hecho con <Heart className="w-3 h-3 text-rose-500 fill-current" /> por el equipo Dagon</span>
          </div>

          <Button 
            onClick={() => {
              sounds.playClick();
              navigate('/dashboard');
            }}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-6 rounded-2xl font-display font-black tracking-widest text-sm hover:scale-105 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER A LA ACADEMIA
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
