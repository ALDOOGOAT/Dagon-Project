import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import {
  Trophy, Download, Linkedin, Share2, Crown, Sparkles,
  ChevronRight, ArrowLeft, Award, Star, Flame, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/apiClient';
import { getModuleLearningSummary } from '../lib/learningProgress';

const Confetti = () => {
  const colors = ['#facc15', '#22d3ee', '#10b981', '#f97316', '#a855f7', '#ec4899'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3"
          style={{
            background: colors[i % colors.length],
            clipPath: i % 2 === 0 ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'circle(50%)'
          }}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 720 - 360,
            x: Math.random() * window.innerWidth + (Math.random() - 0.5) * 200
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: 'linear',
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
};

const DagonCelebration = ({ show }) => {
  if (!show) return null;
  return (
    <motion.div
      className="relative z-10"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', duration: 1.5 }}
    >
      <div className="text-9xl filter drop-shadow-[0_0_50px_rgba(168,85,247,0.8)]">
        🐲
      </div>
      <motion.div
        className="absolute -top-4 -right-4 text-4xl"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 1 }}
      >
        <Crown className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
      </motion.div>
    </motion.div>
  );
};

const CertificatePreview = ({ userName, moduleTitle, xpGained, date }) => (
  <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-1 rounded-3xl shadow-2xl">
    <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 rounded-2xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-amber-600">
          <path d="M50 5 L61 35 L93 35 L67 55 L76 85 L50 65 L24 85 L33 55 L7 35 L39 35 Z" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-amber-600">
          <path d="M50 5 L61 35 L93 35 L67 55 L76 85 L50 65 L24 85 L33 55 L7 35 L39 35 Z" />
        </svg>
      </div>

      <div className="text-center relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-amber-700 text-xs uppercase tracking-[0.3em] mb-2 font-semibold">
            Dagon's Academy
          </div>
          <div className="text-amber-900 text-2xl font-serif font-bold mb-4">
            Certificado de Completación
          </div>
          <div className="w-32 h-0.5 bg-amber-300 mx-auto mb-6" />
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
          className="mb-6"
        >
          <Trophy className="w-20 h-20 mx-auto text-amber-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="text-sm text-amber-800 mb-1">Se certifica que</div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-4">
            {userName}
          </div>
          <div className="text-sm text-amber-800 mb-2">
            ha completado exitosamente
          </div>
          <div className="text-lg font-semibold text-amber-700 mb-4">
            {moduleTitle}
          </div>
          <div className="text-sm text-amber-800 mb-1">
            Conquistando <span className="font-bold text-amber-600">+{xpGained} XP</span>
          </div>
          <div className="text-xs text-amber-600 mt-6">
            Completado el {date}
          </div>
        </motion.div>
      </div>
    </div>
  </div>
);

export const GraduationPage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { user, token, updateUserXP } = useAuth();

  const [loading, setLoading] = useState(true);
  const [moduleData, setModuleData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [celebrationComplete, setCelebrationComplete] = useState(false);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        const response = await apiClient.get(`/api/exercises/${levelId}`);
        const data = response.data;
        setModuleData(data);
        setShowConfetti(true);
        setTimeout(() => setShowCertificate(true), 1500);
        setTimeout(() => setCelebrationComplete(true), 3500);
      } catch (error) {
        toast.error('Error al cargar datos del módulo');
      } finally {
        setLoading(false);
      }
    };
    if (token && levelId) fetchModuleData();
  }, [levelId, token]);

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(
      `¡He completado "${moduleTitle}" en Dagon's Academy! 🐲\n\n` +
      `Aprendí SQL dominando consultas, joins y más. ¡Únete al viaje!\n\n` +
      `#SQL #Aprendizaje #DagonAcademy #Programación`
    );
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text}`, '_blank');
  };

  const handleDownload = () => {
    toast.success('¡Certificado listo! 🎉', {
      description: 'Pronto podrás descargar tu certificado como imagen',
      duration: 3000
    });
  };

  const handleGoDashboard = () => {
    navigate('/dashboard');
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const xpGained = moduleData?.exercises?.reduce((acc, ex) => acc + (ex.dificultad || 1) * 10, 0) || 40;
  const moduleSummary = getModuleLearningSummary(user?.idUsuario || 'local', levelId);
  const moduleTitle = moduleData?.module?.titulo || moduleData?.moduleName || 'Módulo completado';
  const moduleRecommendations = moduleSummary.recommendations?.length > 0
    ? moduleSummary.recommendations
    : ['Mantén una práctica corta mañana para convertir este logro en memoria real.'];

  if (loading) {
    return (
      <div className="min-h-screen abyss-bg flex items-center justify-center">
        <div className="text-white text-xl">Cargando tu recompensa...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen abyss-bg flex flex-col items-center justify-center py-12 px-4 relative overflow-x-hidden overflow-y-auto">
      {showConfetti && <Confetti />}

      <AnimatePresence mode="wait">
        {!showCertificate && !celebrationComplete && (
          <motion.div
            key="celebration"
            className="text-center z-10"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
          >
            <motion.div
              className="text-8xl mb-6"
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              🐲
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl font-display font-black text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-gradient-gold">¡Módulo Completado!</span>
            </motion.h1>
            <motion.p
              className="text-xl text-cyan-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Dagon está orgulloso de ti
            </motion.p>
            <motion.div
              className="mt-6 flex items-center justify-center gap-2 text-yellow-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Flame className="w-6 h-6" />
              <span className="text-2xl font-bold">+{xpGained} XP</span>
              <Flame className="w-6 h-6" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCertificate && (
          <motion.div
            key="certificate"
            className="z-10 w-full max-w-5xl px-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <motion.h2
                className="text-3xl md:text-4xl font-display font-black text-white mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-gradient-gold">Tu Diploma</span>
              </motion.h2>
              <p className="text-cyan-300">Competencias SQL Dominadas</p>
            </div>

            <CertificatePreview
              userName={user?.nombre || 'Aventurero'}
              moduleTitle={moduleTitle}
              xpGained={xpGained}
              date={formatDate()}
            />

            <motion.div
              className="mt-6 grid gap-4 rounded-3xl border border-cyan-300/20 bg-slate-950/72 p-5 text-left shadow-[0_22px_70px_rgba(2,6,23,0.45)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                  Resumen de aprendizaje
                </p>
                <h3 className="mt-1 font-display text-2xl font-black text-white">
                  Lo que consolidaste en este módulo
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <Trophy className="mb-2 h-5 w-5 text-yellow-300" />
                  <p className="text-2xl font-display font-black text-white">{moduleSummary.successes || 0}</p>
                  <p className="text-xs text-slate-400">respuestas correctas registradas</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <Target className="mb-2 h-5 w-5 text-cyan-300" />
                  <p className="text-2xl font-display font-black text-white">{moduleSummary.attempts || 0}</p>
                  <p className="text-xs text-slate-400">intentos de práctica</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <Award className="mb-2 h-5 w-5 text-fuchsia-300" />
                  <p className="text-2xl font-display font-black text-white">{moduleSummary.concepts?.length || 0}</p>
                  <p className="text-xs text-slate-400">conceptos trabajados</p>
                </div>
              </div>

              {moduleSummary.concepts?.length > 0 && (
                <div className="grid gap-3">
                  {moduleSummary.concepts.map((concept) => (
                    <div key={concept.key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="font-display text-sm font-black text-white">{concept.label}</span>
                        <span className="text-xs font-black text-cyan-200">{concept.mastery}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-300" style={{ width: `${concept.mastery}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">
                  Recomendación personalizada
                </p>
                <ul className="space-y-2 text-sm leading-relaxed text-amber-50">
                  {moduleRecommendations.slice(0, 3).map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleShareLinkedIn}
                className="bg-[#0077b5] hover:bg-[#005885] text-white font-display font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Linkedin className="w-5 h-5" />
                Compartir en LinkedIn
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-slate-700 hover:bg-slate-600 text-white font-display font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Download className="w-5 h-5" />
                Descargar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="mt-8 mb-4 z-10 w-full flex justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <Button
          onClick={handleGoDashboard}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-display font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto max-w-md"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Dashboard
          <ChevronRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </div>
  );
};

export default GraduationPage;
