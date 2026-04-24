import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { QuickPracticeMode } from '../components/QuickPracticeMode';
import { CertificateModal, useCertificado } from '../components/CertificateModal';
import { sounds } from '../lib/SoundEngine';
import {
  Zap, Flame, Lock, Trophy, LogOut, Target, Play, Sparkles, Crown,
  Star, ChevronRight, CalendarDays, Database, Shield, Hammer, Swords,
  User, Calendar, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const TITLES = [
  { min: 0,    name: 'Novato del SELECT',     tier: 'bronze' },
  { min: 100,  name: 'Explorador de Tablas',  tier: 'bronze' },
  { min: 300,  name: 'Guerrero de los JOINs', tier: 'silver' },
  { min: 600,  name: 'Caballero de Datos',    tier: 'silver' },
  { min: 1000, name: 'Maestro Arquitecto SQL', tier: 'gold'  },
  { min: 2000, name: 'Señor del Abismo',      tier: 'abyss'  },
];

const titleFor = (xp) => [...TITLES].reverse().find((t) => xp >= t.min) || TITLES[0];

const tierRing = (tier) => ({
  bronze: 'ring-tier-bronze',
  silver: 'ring-tier-silver',
  gold:   'ring-tier-gold',
  abyss:  'ring-tier-abyss',
}[tier] || 'ring-tier-bronze');

const tierGradient = (tier) => ({
  bronze: 'from-amber-700 to-orange-900',
  silver: 'from-slate-300 to-slate-600',
  gold:   'from-yellow-300 to-amber-600',
  abyss:  'from-fuchsia-500 via-indigo-600 to-blue-700',
}[tier] || 'from-amber-700 to-orange-900');

export const DashboardPage = () => {
  const { user, token, logout, updateUserXP } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();

  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickPractice, setShowQuickPractice] = useState(false);
  const [showCertificado, setShowCertificado] = useState(false);
  const [certificadoData, setCertificadoData] = useState(null);
  const [certificadoCurso, setCertificadoCurso] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);

  useEffect(() => {
    if (showQuickPractice) {
      sounds.startGameMusic();
    } else {
      sounds.stopGameMusic();
      sounds.startBackgroundMusic();
    }
    return () => {
      sounds.stopGameMusic();
      sounds.stopBackgroundMusic();
    };
  }, [showQuickPractice]);

  const { cursosCompletados, generarCertificado } = useCertificado(token);

  const userXP = user?.xp || 0;
  const xpInLevel = userXP % 100;
  const xpFaltante = 100 - xpInLevel;
  const userLevel = Math.floor(userXP / 100) + 1;
const title = titleFor(userXP);
  const [userStreak, setUserStreak] = useState(0);

  const dashboardMood = useMemo(() => {
    if (userXP >= 2000) return 'celebrating';
    if (userXP >= 1000) return 'excited';
    if (userXP >= 600) return 'happy';
    if (userStreak >= 3) return 'excited';
    if (userStreak > 0) return 'happy';
    if (userLevel < 3) return 'determined';
    return 'thinking';
  }, [userXP, userStreak, userLevel]);

  const [userRank, setUserRank] = useState('-');
  const [topPlayers, setTopPlayers] = useState([]);

  useEffect(() => {
    const cachedAvatar = localStorage.getItem('userAvatar');
    if (cachedAvatar) {
      setUserAvatar(cachedAvatar);
    }
  }, []);

  // Estructura de Cursos y Selección
  const [cursos, setCursos] = useState([]);
  const [cursoActivoId, setCursoActivoId] = useState(2); // Inicia en Diseño de BD por defecto
  const [loadingModulos, setLoadingModulos] = useState(true);

  useEffect(() => {
    const fetchRealXP = async () => {
      try {
        const miUsuarioId = user?.idUsuario;
        if (!miUsuarioId) return;
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/${miUsuarioId}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          updateUserXP(data.xp);
          setUserRank(data.posicion);
          setUserStreak(data.racha);
        }
      } catch (error) {
        console.error("Error al cargar la XP del servidor", error);
      }
    };
    fetchRealXP();
  }, [token, user?.idUsuario]);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/modulos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
           const data = await response.json();
           setCursos(data);
           // Si el curso 2 no existe (raro), seteamos el primero
           if(data.length > 0 && !data.find(c => c.id_curso === 2)) setCursoActivoId(data[0].id_curso);
        }
      } catch (error) {
        console.error("Error al cargar los módulos:", error);
        toast.error('Error al cargar misiones');
      } finally {
        setLoadingModulos(false);
      }
    };
    if (token) fetchModulos();
  }, [token]);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/leaderboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTopPlayers(data.slice(0, 5));
        }
      } catch (e) {
        // silencioso
      }
    };
    if (token) fetchTop();
  }, [token]);

  const handleModuloClick = (mod) => {
    if (mod.bloqueado) {
      sounds.playError();
      toast.error(`Necesitas ${mod.xp_requerida} XP para desbloquear esta misión.`);
      sounds.init();
      return;
    }
    sounds.playStep();
    navigate(`/exercise/${mod.id_modulo}`);
  };

  const handleLogout = () => {
    sounds.playClick();
    logout();
    navigate('/');
    toast.success('Sesión cerrada');
  };

  const todayDay = useMemo(() => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  }, []);

  if (loadingModulos) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-fuchsia-500/10 blur-2xl animate-pulse" />
          <DagonMascot size="large" mood="thinking" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-fuchsia-500 to-blue-500 rounded-full animate-shimmer-width" />
          </div>
          <p className="text-fuchsia-300/60 text-xs font-bold tracking-[0.4em] uppercase">Cargando la Academia...</p>
        </div>
      </div>
    );
  }

  // Filtrar los módulos del curso seleccionado actualmente
  const cursoActivo = cursos.find(c => c.id_curso === cursoActivoId) || { modulos: [] };
  const modulos = cursoActivo.modulos || [];
  
  const completedCount = modulos.filter((m) => !m.bloqueado).length;
  const totalCount = modulos.length;
  const moduleProgress = totalCount ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen" data-testid="dashboard-page">
      {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}
      {showQuickPractice && (
        <QuickPracticeMode
          userLevel={user?.level || 'nivel-0'}
          userXP={userXP}
          userStreak={userStreak}
          onXPGain={(xp) => updateUserXP(userXP + xp)}
          onClose={() => setShowQuickPractice(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8 gap-4 flex-wrap">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-[260px]">
            <p className="text-cyan-300 text-xs font-bold tracking-[0.4em] uppercase mb-2">
              {todayDay} · Bienvenido de vuelta
            </p>
            <h1 className="font-display text-5xl lg:text-6xl font-black text-white leading-none">
              Hola, <span className="text-gradient-abyss">{user?.nombre || 'aventurero'}</span>
            </h1>
            <p className="text-slate-400 mt-3 font-gameui">
              Selecciona tu senda y desciende a las profundidades.
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => navigate('/profile')}
              className="bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-slate-200 hover:text-white font-display font-black text-sm"
            >
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Mi Perfil</span>
            </Button>
            {userStreak > 0 ? (
              <Button
                onClick={() => navigate('/streak')}
                className="bg-gradient-to-r from-orange-600/80 to-rose-600/80 hover:from-orange-500 hover:to-rose-500 border border-orange-400/40 text-white font-display font-black shadow-[0_0_20px_rgba(249,115,22,0.3)] text-sm"
              >
                <Flame className="w-4 h-4 mr-2 animate-pulse" />
                {userStreak} días
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/streak')}
                variant="ghost"
                className="text-orange-300 hover:text-orange-200 hover:bg-orange-500/10 text-sm"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Racha</span>
              </Button>
            )}
            <Button
              onClick={() => setShowQuickPractice(true)}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-display font-black tracking-wide shadow-[0_10px_30px_rgba(249,115,22,0.4)] hover:scale-105 transition-all text-sm"
            >
              <Target className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Práctica Rápida</span>
              <span className="sm:hidden">Práctica</span>
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5 text-sm">
              <LogOut className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>

        {/* PLAYER HERO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 mb-8 holo-border relative overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className={`absolute -inset-3 rounded-3xl ${tierRing(title.tier)}`} />
                <div className={`relative w-28 h-28 rounded-2xl bg-gradient-to-br ${tierGradient(title.tier)} flex items-center justify-center shadow-2xl`}>
                  <DagonMascot size="medium" mood={dashboardMood} />
                </div>
                <div className="absolute -bottom-3 -right-3 badge-shine text-yellow-950 text-xs font-display font-black px-3 py-1 rounded-lg border border-yellow-300 animate-badge-pulse">
                  Lvl {userLevel}
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {userStreak > 0 && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/40">
                    <Flame className="w-3 h-3 text-orange-300" />
                    <span className="font-gameui text-xs font-bold tracking-widest uppercase text-orange-200">
                      {userStreak} días
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span className="font-gameui text-xs font-bold tracking-widest uppercase text-cyan-200">
                    {title.name}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-gameui text-sm">Progreso al nivel {userLevel + 1}</span>
                <span className="font-display font-black text-white">
                  {xpInLevel}<span className="text-slate-500">/100 XP</span>
                </span>
              </div>
              <div className="relative w-full h-4 rounded-full border overflow-hidden xp-bar-shine" style={{ backgroundColor: `${colors.surface}CC`, borderColor: colors.border }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInLevel}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
                />
              </div>
            </div>

            <div className="text-right">
              <p className="font-display text-7xl font-black text-gradient-gold leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                {userXP}
              </p>
              <p className="text-slate-400 text-xs uppercase tracking-[0.4em] font-bold mt-2">XP Totales</p>
              {userStreak > 0 && (
                <div className="flex items-center gap-1 mt-3 justify-end">
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span className="font-display font-black text-orange-300">x{userStreak}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* STATS QUICK BAR */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
        >
          <button
            onClick={() => navigate('/streak')}
            className="glass-card-apple rounded-2xl p-4 border border-orange-500/30 hover:border-orange-400/60 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/30 to-rose-500/20 flex items-center justify-center border border-orange-400/30 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="font-display text-2xl font-black text-white">{userStreak || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Días</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="glass-card-apple rounded-2xl p-4 border border-cyan-500/30 hover:border-cyan-400/60 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center border border-cyan-400/30 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-display text-2xl font-black text-white">{userXP}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">XP Total</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="glass-card-apple rounded-2xl p-4 border border-yellow-500/30 hover:border-yellow-400/60 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-500/20 flex items-center justify-center border border-yellow-400/30 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-display text-2xl font-black text-white">{userRank !== '-' ? `#${userRank}` : '-'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Ranking</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="glass-card-apple rounded-2xl p-4 border border-fuchsia-500/30 hover:border-fuchsia-400/60 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-purple-500/20 flex items-center justify-center border border-fuchsia-400/30 group-hover:scale-110 transition-transform">
                <Crown className="w-5 h-5 text-fuchsia-400" />
              </div>
              <div>
                <p className="font-display text-lg font-black text-white truncate max-w-[100px]">{title.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Rango</p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* SELECTOR DE CURSOS / SENDAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {cursos.map(curso => (
                <button 
                  key={curso.id_curso}
                  onClick={() => setCursoActivoId(curso.id_curso)}
                  className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                      cursoActivoId === curso.id_curso 
                        ? 'bg-blue-900/40 border-blue-400/80 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                        : 'bg-slate-900/50 border-white/10 hover:border-slate-500'
                  }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                            cursoActivoId === curso.id_curso ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                            {curso.id_curso === 1 ? <Swords className="w-6 h-6" /> : <Hammer className="w-6 h-6" />}
                        </div>
                        <div className="text-left">
                            <h3 className={`font-display font-black text-xl ${cursoActivoId === curso.id_curso ? 'text-white' : 'text-slate-400'}`}>
                                {curso.titulo.split(':')[0]}
                            </h3>
                            <p className={`text-xs uppercase tracking-widest font-bold mt-1 ${cursoActivoId === curso.id_curso ? 'text-blue-300' : 'text-slate-600'}`}>
                                {curso.titulo.split(':')[1] || 'Especialización'}
                            </p>
                        </div>
                    </div>
                    {cursoActivoId === curso.id_curso && (
                        <div className="w-4 h-4 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,1)]" />
                    )}
                </button>
            ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* SENDERO DE NIVELES DEL CURSO ACTIVO */}
          <div className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                  {cursoActivoId === 1 ? <Swords className="w-6 h-6 text-blue-300" /> : <Hammer className="w-6 h-6 text-blue-300" />}
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black text-white">{cursoActivo.titulo}</h2>
                  <p className="text-slate-400 text-sm font-gameui">Conquista las misiones para graduarte de esta Senda</p>
                </div>
              </div>
              
              {/* BOTÓN DE CERTIFICADO */}
              {cursosCompletados.find(c => c.id_curso === cursoActivoId) && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={async () => {
                    const cert = await generarCertificado(cursoActivoId);
                    if (cert) {
                      setCertificadoData(cert);
                      setCertificadoCurso(cursoActivo.titulo);
                      setShowCertificado(true);
                    } else {
                      toast.error('No has completado todos los ejercicios aún');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl text-black font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  <Award className="w-5 h-5" />
                  Ver Certificado
                </motion.button>
              )}
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={cursoActivoId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                {modulos.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-900/30">
                        <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-white font-display text-xl font-bold">Ruta en Construcción</h3>
                        <p className="text-slate-500">Pronto llegarán nuevas misiones para esta especialidad.</p>
                    </div>
                ) : (
                <div className="relative">
                    <div className="absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-1 path-glow rounded-full hidden md:block" />
                    <div className="space-y-6 relative">
                    {modulos.map((mod, index) => {
                        const isLeft = index % 2 === 0;
                        return (
                        <div key={mod.id_modulo} className={`flex items-center gap-4 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                            <button
                            onClick={() => handleModuloClick(mod)}
                            className={`flex-1 p-5 rounded-2xl border transition-all duration-300 text-left flex items-center gap-4 group relative overflow-hidden ${
                                mod.bloqueado
                                ? 'bg-slate-900/30 border-slate-800/60 opacity-70 cursor-not-allowed grayscale'
                                : 'glass-card-apple border-white/10 hover:border-blue-400/60 hover:shadow-[0_15px_40px_-15px_rgba(59,130,246,0.5)] hover:-translate-y-1'
                            }`}
                            >
                            {!mod.bloqueado && (
                                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-500/15 to-transparent pointer-events-none" />
                            )}
                            <div className="flex-1 relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-cyan-400">
                                    Módulo {String(index + 1).padStart(2, '0')}
                                </span>
                                </div>
                                <h3 className={`font-display text-xl font-black mb-1 ${mod.bloqueado ? 'text-slate-500' : 'text-white'}`}>
                                {mod.titulo}
                                </h3>
                                <p className={`text-sm font-gameui ${mod.bloqueado ? 'text-slate-600' : 'text-slate-400'}`}>
                                {mod.descripcion}
                                </p>
                            </div>
                            <div className="relative z-10">
                                {mod.bloqueado ? (
                                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-2 rounded-lg">
                                    <Lock className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{mod.xp_requerida} XP</span>
                                </div>
                                ) : (
                                <span className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 border border-blue-400/40 px-4 py-2 rounded-xl text-sm font-display font-black group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    Entrar <Play className="w-3 h-3 fill-current" />
                                </span>
                                )}
                            </div>
                            </button>

                            <div className="hidden md:flex flex-col items-center justify-center w-20 shrink-0">
                            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center font-display font-black text-xl border-2 ${
                                mod.bloqueado
                                ? 'bg-slate-900 border-slate-700 text-slate-600'
                                : 'bg-gradient-to-br from-cyan-400 to-blue-700 border-cyan-300 text-white shadow-[0_0_25px_rgba(34,211,238,0.55)]'
                            }`}>
                                {mod.bloqueado ? <Lock className="w-6 h-6" /> : index + 1}
                            </div>
                            </div>
                            <div className="hidden md:block flex-1" />
                        </div>
                        );
                    })}
                    </div>
                </div>
                )}
                </motion.div>
            </AnimatePresence>
          </div>

          {/* SIDEBAR (Práctica Rápida y Top) */}
          <aside className="space-y-6">
            <motion.div className="glass-card-apple rounded-3xl p-6 border border-white/10 relative overflow-hidden holo-border">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/15 rounded-full blur-3xl" />
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-fuchsia-300" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Reto del día</span>
              </div>
              <h3 className="font-display text-xl font-black text-white mb-2">Práctica Relámpago</h3>
              <p className="text-slate-400 text-sm font-gameui mb-4">
                Resuelve 3 ejercicios rápidos antes de acabar el día y gana XP bonus.
              </p>
              <Button
                onClick={() => setShowQuickPractice(true)}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-display font-black tracking-wide shadow-[0_10px_30px_rgba(168,85,247,0.4)]"
              >
                <Zap className="w-4 h-4 mr-2" />
                Empezar reto
              </Button>
            </motion.div>
            
            {/* Mini leaderboard (RESTAURADO) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="glass-card-apple rounded-3xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-300">Top aventureros</span>
                </div>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="text-slate-400 hover:text-white text-xs font-gameui font-bold flex items-center gap-1"
                >
                  Ver todo <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {topPlayers.length === 0 ? (
                <p className="text-slate-500 text-sm italic font-gameui">Sin datos aún.</p>
              ) : (
                <ul className="space-y-2">
                  {topPlayers.map((p) => {
                    const me = user?.idUsuario === p.idUsuario;
                    const medalColor =
                      p.rango === 1 ? 'text-yellow-300' :
                      p.rango === 2 ? 'text-slate-300' :
                      p.rango === 3 ? 'text-amber-500' :
                      'text-slate-500';
                    return (
                      <li
                        key={p.idUsuario}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          me ? 'bg-blue-500/10 border-blue-400/40' : 'bg-slate-900/50 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`font-display font-black text-lg w-6 text-center ${medalColor}`}>
                            {p.rango <= 3 ? <Star className="w-4 h-4 inline fill-current" /> : `#${p.rango}`}
                          </span>
                          <span className={`font-gameui font-bold truncate ${me ? 'text-blue-200' : 'text-slate-200'}`}>
                            {p.nombre}{me && ' (tú)'}
                          </span>
                        </div>
                        <span className="font-display font-black text-sm text-cyan-300 flex items-center gap-1">
                          {p.xp}<Zap className="w-3 h-3" />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          </aside>
        </div>
      </div>

      {/* MODAL DE CERTIFICADO */}
      <CertificateModal
        isOpen={showCertificado}
        onClose={() => setShowCertificado(false)}
        certificado={certificadoData}
        cursoId={cursoActivoId}
        cursoNombre={certificadoCurso}
      />
    </div>
  );
};