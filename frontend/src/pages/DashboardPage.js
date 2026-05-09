import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { TutorialOverlay, TourTrigger } from '../components/TutorialOverlay.jsx';
import { WelcomeCard } from '../components/WelcomeCard';
import { DidacticCard } from '../components/DidacticCard';
import { QuickPracticeMode } from '../components/QuickPracticeMode';
import { CertificateModal, useCertificado } from '../components/CertificateModal';
import { sounds } from '../lib/SoundEngine';
import {
  Zap, Flame, Lock, Trophy, LogOut, Target, Play, Sparkles, Crown,
  Star, ChevronRight, CalendarDays, Database, Shield, Hammer, Swords,
  User, Calendar, Award, Heart
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
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;
  const pillBg = isLight ? 'rgba(250, 204, 21, 0.14)' : 'rgba(6, 182, 212, 0.10)';
  const pillBorder = isLight ? 'rgba(245, 158, 11, 0.24)' : 'rgba(34, 211, 238, 0.30)';
  const pillText = isLight ? '#92400e' : '#cffafe';
  const warmSurface = isLight ? 'rgba(255,250,240,0.82)' : `${colors.surface}80`;
  const softBorder = isLight ? `${colors.border}88` : colors.border;

  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('dagon_tutorial_completed'));
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
  const [cursoActivoId, setCursoActivoId] = useState(1); // Inicia en Senda del Guerrero por defecto
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
  }, [token, user?.idUsuario, updateUserXP]);

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
          <div className="absolute -inset-6 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: `${colors.primary}20` }} />
          <DagonMascot size="large" mood="thinking" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-48 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.75)' : '#334155' }}>
            <div className="h-full w-2/3 rounded-full animate-shimmer-width" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }} />
          </div>
          <p className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: colors.primary }}>Cargando la Academia...</p>
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
      <TutorialOverlay isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      <WelcomeCard />
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
            <p className="text-xs font-bold tracking-[0.4em] uppercase mb-2" style={{ color: colors.accent }}>
              {todayDay} · Bienvenido de vuelta
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-none" style={{ color: headingColor }}>
              Hola, <span className="text-gradient-abyss">{user?.nombre || 'aventurero'}</span>
            </h1>
            <p className="mt-3 font-gameui" style={{ color: mutedColor }}>
              Selecciona tu senda y desciende a las profundidades.
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <TourTrigger onClick={() => setShowTutorial(true)} />
            <Button
              onClick={() => navigate('/profile')}
              className="border font-display font-black text-sm w-full sm:w-auto justify-center"
              style={{ backgroundColor: warmSurface, borderColor: softBorder, color: headingColor }}
            >
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Mi Perfil</span>
            </Button>
            {userStreak > 0 ? (
              <Button
                onClick={() => navigate('/streak')}
                className="border font-display font-black shadow-[0_0_20px_rgba(249,115,22,0.3)] text-sm w-full sm:w-auto justify-center"
                style={{ background: isLight ? 'linear-gradient(90deg, #f59e0b, #fb923c)' : undefined, borderColor: 'rgba(251,146,60,0.35)', color: isLight ? '#1f2937' : '#ffffff' }}
              >
                <Flame className="w-4 h-4 mr-2 animate-pulse" />
                {userStreak} días
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/streak')}
                variant="ghost"
                className="text-sm w-full sm:w-auto justify-center"
                style={{ color: isLight ? '#b45309' : '#fdba74' }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Racha</span>
              </Button>
            )}
            <Button
              onClick={() => setShowQuickPractice(true)}
              className="font-display font-black tracking-wide shadow-[0_10px_30px_rgba(249,115,22,0.4)] hover:scale-105 transition-all text-sm w-full sm:w-auto justify-center"
              style={{ background: isLight ? 'linear-gradient(90deg, #f59e0b, #fb923c)' : undefined, color: isLight ? '#1f2937' : '#ffffff' }}
            >
              <Target className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Práctica Rápida</span>
              <span className="sm:hidden">Práctica</span>
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-sm w-full sm:w-auto justify-center" style={{ color: mutedColor }}>
              <LogOut className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>

        {/* PLAYER HERO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="glass-card-apple rounded-3xl p-6 lg:p-8 border mb-8 holo-border relative overflow-hidden"
          style={{ borderColor: colors.border }}
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: isLight ? 'rgba(250,204,21,0.14)' : 'rgba(192,38,211,0.15)' }} />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: isLight ? 'rgba(251,146,60,0.12)' : 'rgba(37,99,235,0.15)' }} />

          <div className="relative z-10 grid gap-6 md:gap-8 lg:grid-cols-[auto_1fr_auto] items-center">
            <div className="flex items-center justify-center lg:justify-start gap-5">
              <div className="relative">
                <div className={`absolute -inset-3 rounded-[54px] ${tierRing(title.tier)}`} />
                <div className={`relative w-32 h-40 sm:w-40 sm:h-52 lg:w-44 lg:h-56 rounded-[40px] sm:rounded-[48px] bg-gradient-to-br ${tierGradient(title.tier)} flex items-center justify-center shadow-2xl overflow-hidden`}>
                  <DagonMascot size="large" mood={dashboardMood} />
                </div>
                <div className="absolute -bottom-3 -right-3 badge-shine text-yellow-950 text-xs font-display font-black px-4 py-2 rounded-xl border border-yellow-300 animate-badge-pulse shadow-xl">
                  Lvl {userLevel}
                </div>
              </div>
            </div>

            <div className="min-w-0 text-center lg:text-left">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {userStreak > 0 && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ backgroundColor: isLight ? 'rgba(251,146,60,0.16)' : 'rgba(249,115,22,0.20)', borderColor: 'rgba(251,146,60,0.30)' }}>
                    <Flame className="w-3 h-3" style={{ color: isLight ? '#c2410c' : '#fdba74' }} />
                    <span className="font-gameui text-xs font-bold tracking-widest uppercase" style={{ color: isLight ? '#9a3412' : '#fed7aa' }}>
                      {userStreak} días
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ backgroundColor: pillBg, borderColor: pillBorder }}>
                  <Sparkles className="w-3 h-3" style={{ color: colors.primary }} />
                  <span className="font-gameui text-xs font-bold tracking-widest uppercase" style={{ color: pillText }}>
                    {title.name}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="font-gameui text-sm" style={{ color: mutedColor }}>Progreso al nivel {userLevel + 1}</span>
                <span className="font-display font-black" style={{ color: headingColor }}>
                  {xpInLevel}<span style={{ color: mutedColor }}>/100 XP</span>
                </span>
              </div>
              <div className="relative w-full h-4 rounded-full border overflow-hidden xp-bar-shine" style={{ backgroundColor: `${colors.surface}CC`, borderColor: colors.border }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInLevel}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`,
                    boxShadow: `0 0 20px ${colors.primary}80`
                  }}
                />
              </div>
            </div>

            <div className="text-center lg:text-right">
              <p className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]" style={{ color: colors.primary }}>
                {userXP}
              </p>
              <p className="text-xs uppercase tracking-[0.4em] font-bold mt-2" style={{ color: mutedColor }}>XP Totales</p>
              {userStreak > 0 && (
                <div className="flex items-center gap-1 mt-3 justify-end">
                  <Flame className="w-4 h-4 animate-pulse" style={{ color: isLight ? '#ea580c' : '#fb923c' }} />
                  <span className="font-display font-black" style={{ color: isLight ? '#c2410c' : '#fdba74' }}>x{userStreak}</span>
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
                <p className="font-display text-2xl font-black" style={{ color: headingColor }}>{userStreak || 0}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: mutedColor }}>Días</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="glass-card-apple rounded-2xl p-4 border transition-all group text-left"
            style={{ borderColor: `${colors.primary}40` }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: `${colors.primary}20`,
                  borderColor: `${colors.primary}40`
                }}
              >
                <Zap className="w-5 h-5" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="font-display text-2xl font-black" style={{ color: headingColor }}>{userXP}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: mutedColor }}>XP Total</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/leaderboard')}
            className="glass-card-apple rounded-2xl p-4 border transition-all group text-left"
            style={{ borderColor: `${colors.accent}40` }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: `${colors.accent}20`,
                  borderColor: `${colors.accent}40`
                }}
              >
                <Trophy className="w-5 h-5" style={{ color: colors.accent }} />
              </div>
              <div>
                <p className="font-display text-2xl font-black" style={{ color: headingColor }}>{userRank !== '-' ? `#${userRank}` : '-'}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: mutedColor }}>Ranking</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="glass-card-apple rounded-2xl p-4 border transition-all group text-left"
            style={{ borderColor: `${colors.secondary}40` }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center border group-hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: `${colors.secondary}20`,
                  borderColor: `${colors.secondary}40`
                }}
              >
                <Crown className="w-5 h-5" style={{ color: colors.secondary }} />
              </div>
              <div>
                <p className="font-display text-lg font-black truncate max-w-[100px]" style={{ color: headingColor }}>{title.name}</p>
                <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: mutedColor }}>Rango</p>
              </div>
            </div>
          </button>
          </motion.div>

          {/* DIDACTIC CARDS */}
          <DidacticCard />

          {/* SELECTOR DE CURSOS / SENDAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {cursos.map(curso => (
                <button 
                  key={curso.id_curso}
                  onClick={() => {
                    sounds.playClick();
                    setCursoActivoId(curso.id_curso);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                      cursoActivoId === curso.id_curso 
                        ? 'shadow-[0_0_20px_rgba(0,0,0,0.3)]' 
                        : 'border-white/10 hover:border-slate-500'
                  }`}
                  style={{
                    backgroundColor: cursoActivoId === curso.id_curso ? `${colors.primary}20` : `${colors.surface}80`,
                    borderColor: cursoActivoId === curso.id_curso ? colors.primary : colors.border
                  }}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors`}
                          style={{
                            backgroundColor: cursoActivoId === curso.id_curso ? `${colors.primary}33` : colors.surface,
                            color: cursoActivoId === curso.id_curso ? colors.primary : colors.textMuted
                          }}
                        >
                            {curso.id_curso === 1 ? <Swords className="w-6 h-6" /> : <Hammer className="w-6 h-6" />}
                        </div>
                        <div className="text-left">
                            <h3 className="font-display font-black text-xl transition-colors" style={{ color: cursoActivoId === curso.id_curso ? headingColor : mutedColor }}>
                                {curso.id_curso === 1 ? 'Senda del Guerrero' : 'Senda del Arquitecto'}
                            </h3>
                            <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mt-1 transition-colors`}
                               style={{ color: cursoActivoId === curso.id_curso ? colors.accent : colors.textMuted }}>
                                {curso.titulo}
                            </p>
                        </div>
                    </div>
                    {cursoActivoId === curso.id_curso && (
                        <div className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ backgroundColor: colors.primary }} />
                    )}
                </button>
            ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* SENDERO DE NIVELES DEL CURSO ACTIVO */}
          <div className="glass-card-apple rounded-3xl p-6 lg:p-8 border relative overflow-hidden" style={{ borderColor: colors.border }}>
            <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: isLight ? 'rgba(250,204,21,0.10)' : 'rgba(59,130,246,0.10)' }} />

            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20`, border: `1px solid ${colors.primary}40` }}>
                  {cursoActivoId === 1 ? <Swords className="w-6 h-6" style={{ color: colors.primary }} /> : <Hammer className="w-6 h-6" style={{ color: colors.primary }} />}
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black" style={{ color: headingColor }}>{cursoActivo.titulo}</h2>
                  <p className="text-sm font-gameui" style={{ color: mutedColor }}>Conquista las misiones para graduarte de esta Senda</p>
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
                        <div key={mod.id_modulo} className={`flex items-stretch gap-4 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                            <button
                            onClick={() => handleModuloClick(mod)}
                            className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-all duration-300 text-left flex flex-col sm:flex-row sm:items-center gap-4 group relative overflow-hidden ${
                                mod.bloqueado
                                ? 'bg-slate-900/30 border-slate-800/60 opacity-70 cursor-not-allowed grayscale'
                                : 'glass-card-apple border-white/10 hover:border-blue-400/60 hover:shadow-[0_15px_40px_-15px_rgba(59,130,246,0.5)] hover:-translate-y-1'
                            }`}
                            >
                            {!mod.bloqueado && (
                                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-500/15 to-transparent pointer-events-none" />
                            )}
                            <div className="flex-1 relative z-10">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                            <div className="relative z-10 w-full sm:w-auto">
                                {mod.bloqueado ? (
                                <div className="flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3 py-2 rounded-lg">
                                    <Lock className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{mod.xp_requerida} XP</span>
                                </div>
                                ) : (
                                <span className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-blue-500/20 text-blue-200 border border-blue-400/40 px-4 py-2 rounded-xl text-sm font-display font-black group-hover:bg-blue-500 group-hover:text-white transition-all">
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
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl" style={{ backgroundColor: isLight ? 'rgba(251,146,60,0.14)' : 'rgba(217,70,239,0.15)' }} />
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4" style={{ color: colors.primary }} />
                <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: colors.primary }}>Reto del día</span>
              </div>
              <h3 className="font-display text-xl font-black mb-2" style={{ color: headingColor }}>Práctica Relámpago</h3>
              <p className="text-sm font-gameui mb-4" style={{ color: mutedColor }}>
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
              className="glass-card-apple rounded-3xl p-6 border"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" style={{ color: colors.accent }} />
                  <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: colors.accent }}>Top aventureros</span>
                </div>
                <button
                  onClick={() => navigate('/leaderboard')}
                  className="text-xs font-gameui font-bold flex items-center gap-1"
                  style={{ color: mutedColor }}
                >
                  Ver todo <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {topPlayers.length === 0 ? (
                <p className="text-sm italic font-gameui" style={{ color: mutedColor }}>Sin datos aún.</p>
              ) : (
                <ul className="space-y-2">
                  {topPlayers.slice(0, 5).map((p) => {
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
                          <span className="font-gameui font-bold truncate" style={{ color: me ? colors.primary : headingColor }}>
                            {p.nombre}{me && ' (tú)'}
                          </span>
                        </div>
                        <span className="font-display font-black text-sm flex items-center gap-1" style={{ color: colors.primary }}>
                          {p.xp}<Zap className="w-3 h-3" />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>

            {/* Botón Créditos / Equipo Dagon */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="glass-card-apple rounded-3xl p-6 border cursor-pointer group"
              style={{ borderColor: colors.border }}
              onClick={() => navigate('/credits')}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: `${colors.primary}20`,
                    borderColor: `${colors.primary}40`
                  }}
                >
                  <Heart className="w-7 h-7" style={{ color: colors.primary }} />
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg font-black" style={{ color: headingColor }}>Equipo Dagon</p>
                  <p className="text-xs font-gameui" style={{ color: mutedColor }}>Ver créditos y agradecimientos</p>
                </div>
                <ChevronRight className="w-5 h-5 transition-colors" style={{ color: mutedColor }} />
              </div>
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
