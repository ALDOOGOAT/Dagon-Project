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
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 12 }
    }
  };

  return (
    <div className="min-h-screen abyss-bg flex flex-col items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* Fondo de partículas mejorado */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-white rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: window.innerHeight + 10,
              opacity: Math.random() 
            }}
            animate={{ 
              y: -10,
              opacity: [0, 0.9, 0]
            }}
            transition={{ 
              duration: 4 + Math.random() * 8, 
              repeat: Infinity,
              delay: Math.random() * 8
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
        {/* MASCOTA */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="inline-block relative">
            <div className="absolute -inset-12 rounded-full bg-pink-500/25 blur-[50px] animate-pulse" />
            <DagonMascot size="xlarge" mood="love" />
          </div>
        </motion.div>

        {/* TÍTULO PRINCIPAL con gradiente mejorado */}
        <motion.div variants={itemVariants} className="mb-4">
          <h1 className="font-display text-5xl lg:text-7xl font-black text-white tracking-tight">
            SALÓN DE LA <span className="text-gradient-abyss">FAMA</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30" />
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-[0.6em]">✨ Dagon Project ✨</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/30" />
          </div>
        </motion.div>

        {/* TARJETAS DE DESARROLLADORES */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[40px] opacity-50 group-hover:opacity-100 transition-opacity blur" />
            <div className="relative p-8 rounded-[40px] bg-slate-900/80 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Code className="w-7 h-7 text-white" />
                </div>
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
              <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.35em] mb-3 text-left">✨ Desarrollador Legendario</p>
              <h3 className="font-display text-2xl lg:text-3xl font-black text-white text-left leading-tight">
                DILHAN JARED<br/>MORA LÓPEZ
              </h3>
              <p className="text-cyan-300/70 text-xs mt-2 text-left">Frontend Developer</p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-500 to-rose-600 rounded-[40px] opacity-50 group-hover:opacity-100 transition-opacity blur" />
            <div className="relative p-8 rounded-[40px] bg-slate-900/80 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-600 flex items-center justify-center shadow-lg">
                  <Code className="w-7 h-7 text-white" />
                </div>
                <div className="w-3 h-3 rounded-full bg-fuchsia-400 animate-pulse" />
                <div className="w-3 h-3 rounded-full bg-rose-400 animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
              <p className="text-fuchsia-400 text-[10px] font-black uppercase tracking-[0.35em] mb-3 text-left">✨ Desarrollador Legendario</p>
              <h3 className="font-display text-2xl lg:text-3xl font-black text-white text-left leading-tight">
                ALDO FABIO<br/>CONTRERAS MARROQUÍN
              </h3>
              <p className="text-fuchsia-300/70 text-xs mt-2 text-left">Backend Developer</p>
            </div>
          </div>
        </motion.div>

        {/* MENSAJE DE AGRADECIMIENTO - Diseño mejorado */}
        <motion.div variants={itemVariants} className="mb-10">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-pink-500 to-cyan-500 rounded-[40px] opacity-40 blur" />
            <div className="relative p-8 lg:p-10 rounded-[40px] bg-slate-900/90 border border-rose-500/30 backdrop-blur-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-rose-500 rounded-full">
                <span className="text-white text-xs font-bold uppercase tracking-wider">✨ Agradecimiento ✨</span>
              </div>
              <p className="font-gameui text-lg lg:text-xl leading-relaxed text-white mt-2">
                Querido jugador, hicimos este bonito juego tipo duolingo interactivo, 
                poniendo nuestros esfuerzos y dedicación en ello, sabemos que la carrera 
                puede ser muy agotadora y difícil pero solo <span className="text-rose-400 font-bold">no te rindas</span>, 
                cree de corazón en ti mismo ya que hoy por hoy te encuentras aquí, 
                y <span className="text-pink-400 font-bold">siéntete muy orgulloso</span> por ello.
              </p>
              <p className="font-gameui text-lg lg:text-xl leading-relaxed text-white mt-4">
                El equipo Dagon te agradece profundamente el estar aquí 🙏
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="text-3xl">❤️</span>
                <span className="text-2xl">💜</span>
                <span className="text-2xl">💙</span>
                <span className="text-2xl">💚</span>
                <span className="text-2xl">🧡</span>
              </div>
              <p className="mt-4 font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-rose-400">
                ¡MUCHAS GRACIAS! 🤍
              </p>
              <p className="mt-3 text-slate-400 text-sm">
                Si puedes imaginarlo, puedes programarlo &lt;3
              </p>
            </div>
          </div>
        </motion.div>

        {/* FOOTER */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1 text-slate-400 text-sm font-gameui">
            <span className="text-white/80 font-semibold">© 2026</span>
            <span className="text-xs text-slate-500 max-w-md">
              Para la materia de 4to semestre de ADMINISTRACIÓN DE BASE DE DATOS, 
              impartida por el docente <span className="text-yellow-400">JESÚS ARNULFO ZACARÍAS SANTOS</span>
            </span>
          </div>

          <Button 
            onClick={() => {
              sounds.playClick();
              navigate('/dashboard');
            }}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-10 py-6 rounded-2xl font-display font-black tracking-widest text-sm hover:scale-105 transition-all shadow-lg hover:shadow-cyan-500/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> VOLVER A LA ACADEMIA
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};