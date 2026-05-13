import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { TutorialOverlay, TourTrigger } from '../components/TutorialOverlayCinematic.jsx';
import { WelcomeCard } from '../components/WelcomeCard';
import { DidacticCard } from '../components/DidacticCard';
import { QuickPracticeMode } from '../components/QuickPracticeMode';
import { CertificateModal, useCertificado } from '../components/CertificateModal';
import apiClient from '../services/apiClient';
import { sounds } from '../lib/SoundEngine';
import {
  Zap, Flame, Lock, Trophy, LogOut, Target, Play, Sparkles, Crown,
  Star, ChevronRight, CalendarDays, Database, Shield, Hammer, Swords,
  User, Calendar, Award, Heart, BookOpen, Terminal, Volume2, VolumeX
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
  const topActionClass = "a11y-top-action min-h-[44px] border-2 ring-1 ring-white/10 font-display font-black text-sm w-full sm:w-auto justify-center rounded-xl px-4 backdrop-blur-xl shadow-[0_10px_28px_rgba(2,6,23,0.16)] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(2,6,23,0.24)] transition-all";
  const topActionStyle = {
    backgroundColor: isLight ? 'rgba(255,255,255,0.90)' : 'rgba(15,23,42,0.82)',
    borderColor: isLight ? 'rgba(245,158,11,0.48)' : 'rgba(148,163,184,0.44)',
    color: headingColor,
    boxShadow: isLight ? '0 14px 32px -20px rgba(180,83,9,0.62)' : '0 16px 40px -22px rgba(34,211,238,0.62)'
  };

  const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem('dagon_tutorial_pending') === 'true' || !localStorage.getItem('dagon_tutorial_completed'));
  const [showQuickPractice, setShowQuickPractice] = useState(false);
  const [showCertificado, setShowCertificado] = useState(false);
  const [certificadoData, setCertificadoData] = useState(null);
  const [certificadoCurso, setCertificadoCurso] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => sounds.isEnabled());
  const [soundVolume, setSoundVolume] = useState(() => sounds.getVolume());

  useEffect(() => {
    const syncSoundState = (event) => {
      setSoundEnabled(event?.detail?.enabled ?? sounds.isEnabled());
      setSoundVolume(event?.detail?.volume ?? sounds.getVolume());
    };
    window.addEventListener('dagon:soundchange', syncSoundState);
    syncSoundState();
    return () => window.removeEventListener('dagon:soundchange', syncSoundState);
  }, []);

  useEffect(() => {
    if (!soundEnabled) {
      sounds.stopGameMusic();
      sounds.stopBackgroundMusic();
      return undefined;
    }

    sounds.init();
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
  }, [showQuickPractice, soundEnabled]);

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
  const [cursoActivoId, setCursoActivoId] = useState(() => {
    const saved = localStorage.getItem('dagon_active_course');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [loadingModulos, setLoadingModulos] = useState(true);

  useEffect(() => {
    localStorage.setItem('dagon_active_course', cursoActivoId);
  }, [cursoActivoId]);

  useEffect(() => {
    const fetchRealXP = async () => {
      try {
        const miUsuarioId = user?.idUsuario;
        if (!miUsuarioId) return;
        const response = await apiClient.get(`/api/usuarios/${miUsuarioId}/stats`);
        const data = response.data;
        if (data.success) {
          updateUserXP(data.xp);
          setUserRank(data.posicion);
          setUserStreak(data.racha);
        }
      } catch {
        toast.error('No se pudo actualizar tu XP');
      }
    };
    fetchRealXP();
  }, [token, user?.idUsuario, updateUserXP]);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const response = await apiClient.get('/api/modulos');
        const data = response.data;
        setCursos(data);
        
        // Ensure the active course exists in the fetched data.
        // If not, default to the first available course.
        setCursoActivoId(currentId => {
          if (data.length > 0 && !data.find(c => c.id_curso === currentId)) {
            return data[0].id_curso;
          }
          return currentId;
        });
      } catch {
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
        const response = await apiClient.get('/api/leaderboard');
        const data = response.data;
        setTopPlayers(data.slice(0, 5));
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
    sounds.playMissionStart?.();
    navigate(`/exercise/${mod.id_modulo}`);
  };

  const handleToggleSound = async () => {
    const next = sounds.toggleEnabled({ restart: false });
    setSoundEnabled(next);
    if (next) {
      await sounds.init();
      sounds.playMagic();
    }
  };

  const handleVolumeChange = async (event) => {
    const nextVolume = Number(event.target.value) / 100;
    sounds.setVolume(nextVolume);
    setSoundVolume(nextVolume);
    if (!sounds.isEnabled() && nextVolume > 0) {
      sounds.setEnabled(true, { restart: false });
      setSoundEnabled(true);
      await sounds.init();
    }
  };

  const openTutorial = () => {
    sounds.playSelect?.();
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    localStorage.setItem('dagon_tutorial_completed', 'true');
    localStorage.removeItem('dagon_tutorial_pending');
    localStorage.removeItem('dagon_first_login');
    setShowTutorial(false);
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
  const unlockedModules = modulos.filter((m) => !m.bloqueado);
  const recommendedMission = unlockedModules[unlockedModules.length - 1] || modulos[0] || null;
  const recommendedMissionIndex = recommendedMission
    ? modulos.findIndex((m) => m.id_modulo === recommendedMission.id_modulo)
    : -1;
  const nextLockedMission = modulos.find((m) => m.bloqueado);
  const xpToUnlockNext = nextLockedMission
    ? Math.max((nextLockedMission.xp_requerida || 0) - userXP, 0)
    : 0;
  const missionFocuses = [
    'Leer datos con calma antes de escribir SQL completo.',
    'Filtrar informacion con condiciones simples y verificables.',
    'Conectar tablas para responder preguntas reales.',
    'Modificar datos con seguridad y entender sus consecuencias.',
    'Modelar reglas para proteger la informacion.'
  ];
  const recommendedFocus = missionFocuses[Math.max(0, recommendedMissionIndex) % missionFocuses.length] || missionFocuses[0];

  return (
    <div className="min-h-screen" data-testid="dashboard-page">
      <TutorialOverlay isOpen={showTutorial} onClose={closeTutorial} />
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

      <div className="dashboard-shell container mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 lg:py-12 max-w-[1560px]">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8 lg:mb-12 gap-6 lg:gap-10 flex-wrap" data-tour="header">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="flex-1 min-w-[260px] max-w-3xl">
            <p className="arcane-kicker text-xs font-bold mb-2" style={{ color: colors.accent }}>
              {todayDay} · Bienvenido de vuelta
            </p>
            <h1 className="text-arcane-title arcane-rune-line font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-none" style={{ color: headingColor }}>
              Hola, <span className="text-gradient-abyss">{user?.nombre || 'aventurero'}</span>
            </h1>
            <p className="text-arcane-body mt-5 font-gameui" style={{ color: mutedColor }}>
              Selecciona tu senda y desciende a las profundidades.
            </p>
          </motion.div>

          <div className="dashboard-top-actions flex flex-wrap items-center gap-2.5 lg:gap-3 w-full lg:w-auto lg:max-w-[720px] lg:justify-end">
            <TourTrigger onClick={openTutorial} />
            <Button
              data-tour="sound-toggle"
              onClick={handleToggleSound}
              variant="ghost"
              className={topActionClass}
              style={{ ...topActionStyle, color: soundEnabled ? colors.primary : mutedColor, borderColor: soundEnabled ? `${colors.primary}80` : topActionStyle.borderColor }}
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
              aria-label={soundEnabled ? 'Silenciar sonidos de Dagon' : 'Activar sonidos de Dagon'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sonido' : 'Silencio'}</span>
            </Button>
            <label
              className="a11y-top-action flex min-h-[44px] w-full items-center gap-3 rounded-xl border-2 px-4 text-xs font-display font-black sm:w-[178px]"
              style={{ ...topActionStyle, color: mutedColor }}
            >
              <Volume2 className="h-4 w-4 shrink-0" style={{ color: soundEnabled ? colors.primary : mutedColor }} />
              <span className="sr-only">Volumen general</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(soundVolume * 100)}
                onChange={handleVolumeChange}
                className="dagon-volume-slider"
                aria-label="Volumen general de música, efectos y narración"
              />
            </label>
            <Button
              data-tour="profile"
              onClick={() => navigate('/profile')}
              className={topActionClass}
              style={topActionStyle}
              aria-label="Abrir mi perfil"
            >
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Mi Perfil</span>
            </Button>
            {userStreak > 0 ? (
              <Button
                data-tour="streaks"
                onClick={() => navigate('/streak')}
                className={topActionClass}
                style={{ ...topActionStyle, background: isLight ? 'linear-gradient(90deg, rgba(245,158,11,0.95), rgba(251,146,60,0.95))' : 'rgba(124,45,18,0.34)', borderColor: 'rgba(251,146,60,0.70)', color: isLight ? '#1f2937' : '#ffffff' }}
                aria-label={`Abrir racha actual de ${userStreak} días`}
              >
                <Flame className="w-4 h-4 mr-2 animate-pulse" />
                {userStreak} días
              </Button>
            ) : (
              <Button
                data-tour="streaks"
                onClick={() => navigate('/streak')}
                variant="ghost"
                className={topActionClass}
                style={{ ...topActionStyle, color: isLight ? '#b45309' : '#fdba74', borderColor: 'rgba(251,146,60,0.44)' }}
                aria-label="Abrir rachas"
              >
                <Calendar className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Racha</span>
              </Button>
            )}
            <Button
              data-tour="quick-practice"
              onClick={() => setShowQuickPractice(true)}
              className={`${topActionClass} tracking-wide hover:scale-[1.03]`}
              style={{ ...topActionStyle, background: isLight ? 'linear-gradient(90deg, #f59e0b, #fb923c)' : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, borderColor: isLight ? 'rgba(251,146,60,0.72)' : 'rgba(34,211,238,0.72)', color: isLight ? '#1f2937' : '#ffffff' }}
              aria-label="Abrir práctica rápida"
            >
              <Target className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Práctica Rápida</span>
              <span className="sm:hidden">Práctica</span>
            </Button>
            <Button onClick={handleLogout} variant="ghost" className={topActionClass} style={{ ...topActionStyle, color: mutedColor }} aria-label="Cerrar sesión">
              <LogOut className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>

        {/* PLAYER HERO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card-apple rounded-3xl p-6 lg:p-9 xl:p-10 border mb-8 lg:mb-10 holo-border relative overflow-hidden"
          data-tour="progress"
          style={{ borderColor: colors.border }}
        >
          <motion.div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: isLight ? 'rgba(250,204,21,0.14)' : 'rgba(192,38,211,0.15)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: isLight ? 'rgba(251,146,60,0.12)' : 'rgba(37,99,235,0.15)' }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

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
              <motion.p
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 15 }}
                className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]" style={{ color: colors.primary }}
              >
                {userXP}
              </motion.p>
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

        {/* ACADEMIA POSTGRESQL */}
        <motion.button
          data-tour="postgres-academy"
          type="button"
          onClick={() => {
            sounds.playClick();
            navigate('/postgres');
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="w-full glass-card-apple rounded-3xl p-5 sm:p-6 lg:p-7 border mb-8 lg:mb-10 text-left group relative overflow-hidden"
          style={{ borderColor: `${colors.primary}3d` }}
        >
          <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}14, ${colors.secondary}12)` }} />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  borderColor: `${colors.primary}40`,
                  background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}18)`
                }}
              >
                <Database className="w-7 h-7" style={{ color: colors.primary }} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: colors.primary }}>
                    Nuevo modulo teorico
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: mutedColor, borderColor: `${colors.primary}26` }}>
                    <BookOpen className="w-3 h-3" />
                    PostgreSQL
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black" style={{ color: headingColor }}>
                  Aprende PostgreSQL con Dagon
                </h2>
                <p className="mt-2 max-w-3xl text-sm sm:text-base font-gameui" style={{ color: mutedColor }}>
                  Historia, usos reales y comandos basicos, medios y avanzados en una experiencia cinematica e interactiva.
                </p>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl px-5 py-3 font-display font-black text-white transition-all group-hover:translate-x-1" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
              <Terminal className="w-4 h-4" />
              Entrar a la academia
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </motion.button>

        {/* STATS QUICK BAR */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-5 mb-6 lg:mb-8"
          data-tour="stats"
        >
          {[
            { onClick: () => navigate('/streak'), borderColor: 'border-orange-500/30 hover:border-orange-400/60', iconBg: 'bg-gradient-to-br from-orange-500/30 to-rose-500/20', iconBorder: 'border-orange-400/30', icon: <Flame className="w-5 h-5 text-orange-400" />, value: userStreak || 0, label: 'Días', delay: 0.1 },
            { onClick: () => navigate('/profile'), borderStyle: { borderColor: `${colors.primary}40` }, iconStyle: { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }, icon: <Zap className="w-5 h-5" style={{ color: colors.primary }} />, value: userXP, label: 'XP Total', delay: 0.17 },
            { onClick: () => navigate('/leaderboard'), borderStyle: { borderColor: `${colors.accent}40` }, iconStyle: { backgroundColor: `${colors.accent}20`, borderColor: `${colors.accent}40` }, icon: <Trophy className="w-5 h-5" style={{ color: colors.accent }} />, value: userRank !== '-' ? `#${userRank}` : '-', label: 'Ranking', delay: 0.24 },
            { onClick: () => navigate('/profile'), borderStyle: { borderColor: `${colors.secondary}40` }, iconStyle: { backgroundColor: `${colors.secondary}20`, borderColor: `${colors.secondary}40` }, icon: <Crown className="w-5 h-5" style={{ color: colors.secondary }} />, value: title.name, label: 'Rango', delay: 0.31, isText: true },
          ].map((stat, i) => (
            <motion.button
              key={i}
              onClick={stat.onClick}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: stat.delay, type: 'spring', stiffness: 300, damping: 22 }}
              whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              className={`glass-card-apple rounded-2xl p-4 border transition-colors group text-left ${stat.borderColor || ''}`}
              style={stat.borderStyle || {}}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.iconBg || ''} ${stat.iconBorder || ''}`}
                  style={stat.iconStyle || {}}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {stat.icon}
                </motion.div>
                <div>
                  <p className={`font-display font-black ${stat.isText ? 'text-lg truncate max-w-[100px]' : 'text-2xl'}`} style={{ color: headingColor }}>{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: mutedColor }}>{stat.label}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

          {/* DIDACTIC CARDS */}
          <DidacticCard />

          {/* SELECTOR DE CURSOS / SENDAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:mb-10" data-tour="courses">
            {cursos.map((curso, i) => (
                <motion.button
                  key={curso.id_curso}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 250, damping: 22 }}
                  whileHover={{ y: -3, scale: 1.015, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    sounds.playClick();
                    setCursoActivoId(curso.id_curso);
                  }}
                  className={`p-6 rounded-2xl border-2 transition-colors flex items-center justify-between group ${
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
                        <motion.div
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                          animate={cursoActivoId === curso.id_curso ? { rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.5 }}
                          style={{
                            backgroundColor: cursoActivoId === curso.id_curso ? `${colors.primary}33` : colors.surface,
                            color: cursoActivoId === curso.id_curso ? colors.primary : colors.textMuted
                          }}
                        >
                            {curso.id_curso === 1 ? <Swords className="w-6 h-6" /> : <Hammer className="w-6 h-6" />}
                        </motion.div>
                        <div className="text-left">
                            <h3 className="font-display font-black text-xl transition-colors" style={{ color: cursoActivoId === curso.id_curso ? headingColor : mutedColor }}>
                                {curso.id_curso === 1 ? 'Senda del Guerrero' : 'Senda del Arquitecto'}
                            </h3>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold mt-1 transition-colors"
                               style={{ color: cursoActivoId === curso.id_curso ? colors.accent : colors.textMuted }}>
                                {curso.titulo}
                            </p>
                        </div>
                    </div>
                    {cursoActivoId === curso.id_curso && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <motion.div
                            className="w-full h-full rounded-full"
                            animate={{ boxShadow: ['0 0 6px rgba(255,255,255,0.3)', '0 0 14px rgba(255,255,255,0.7)', '0 0 6px rgba(255,255,255,0.3)'] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        </motion.div>
                    )}
                </motion.button>
            ))}
        </div>

        {recommendedMission && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 200, damping: 24 }}
            className="glass-card-apple rounded-3xl p-5 sm:p-6 lg:p-7 border mb-8 lg:mb-10 relative overflow-hidden"
            data-tour="recommended"
            style={{ borderColor: `${colors.primary}40` }}
          >
            <div className="absolute inset-y-0 right-0 w-2/5 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}16)` }} />
            <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: colors.primary, borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}12` }}>
                    <Target className="w-3 h-3" />
                    Siguiente misión recomendada
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: mutedColor, borderColor: colors.border }}>
                    {completedCount}/{totalCount || 1} disponibles
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black" style={{ color: headingColor }}>
                  {recommendedMission.titulo}
                </h2>
                <p className="mt-2 max-w-3xl text-sm sm:text-base font-gameui" style={{ color: mutedColor }}>
                  {recommendedMission.descripcion}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border p-4" style={{ borderColor: `${colors.primary}30`, backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(15,23,42,0.55)' }}>
                    <p className="text-[10px] uppercase tracking-[0.24em] font-black" style={{ color: colors.primary }}>Meta clara</p>
                    <p className="mt-2 text-sm font-gameui" style={{ color: headingColor }}>{recommendedFocus}</p>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(251,146,60,0.30)', backgroundColor: isLight ? 'rgba(255,247,237,0.80)' : 'rgba(124,45,18,0.16)' }}>
                    <p className="text-[10px] uppercase tracking-[0.24em] font-black" style={{ color: isLight ? '#c2410c' : '#fdba74' }}>Presión sana</p>
                    <p className="mt-2 text-sm font-gameui" style={{ color: headingColor }}>
                      {userStreak > 0 ? `Mantén tu racha de ${userStreak} días con una práctica corta.` : 'Empieza una racha resolviendo una misión hoy.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(16,185,129,0.30)', backgroundColor: isLight ? 'rgba(236,253,245,0.78)' : 'rgba(6,78,59,0.18)' }}>
                    <p className="text-[10px] uppercase tracking-[0.24em] font-black" style={{ color: isLight ? '#047857' : '#6ee7b7' }}>Próximo desbloqueo</p>
                    <p className="mt-2 text-sm font-gameui" style={{ color: headingColor }}>
                      {nextLockedMission ? `Faltan ${xpToUnlockNext} XP para ${nextLockedMission.titulo}.` : 'Todas las misiones de esta senda están disponibles.'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full overflow-hidden border" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.80)', borderColor: colors.border }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${moduleProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full"
                    style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:w-64">
                <Button
                  onClick={() => handleModuloClick(recommendedMission)}
                  disabled={recommendedMission.bloqueado}
                  className="w-full justify-center bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-display font-black py-6 rounded-2xl shadow-[0_12px_30px_rgba(16,185,129,0.28)]"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Entrar ahora
                </Button>
                <Button
                  onClick={() => setShowQuickPractice(true)}
                  variant="outline"
                  className="w-full justify-center border font-display font-black rounded-2xl"
                  style={{ borderColor: `${colors.primary}40`, color: headingColor, backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(15,23,42,0.50)' }}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Entrenar primero
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* MAIN GRID */}
        <div className="grid xl:grid-cols-[minmax(0,1fr)_360px] gap-8 xl:gap-10 2xl:gap-12">
          {/* SENDERO DE NIVELES DEL CURSO ACTIVO */}
          <div className="glass-card-apple rounded-3xl p-6 lg:p-8 xl:p-10 border relative overflow-hidden" data-tour="modules" style={{ borderColor: colors.border }}>
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
                        <motion.div
                          key={mod.id_modulo}
                          initial={{ opacity: 0, x: isLeft ? -30 : 30, y: 10 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ delay: 0.08 * index, type: 'spring', stiffness: 200, damping: 22 }}
                          className={`flex items-stretch gap-4 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                        >
                            <motion.button
                            onClick={() => handleModuloClick(mod)}
                            whileHover={!mod.bloqueado ? { y: -4, scale: 1.01, transition: { duration: 0.2 } } : {}}
                            whileTap={!mod.bloqueado ? { scale: 0.98 } : {}}
                            className={`flex-1 p-4 sm:p-5 rounded-2xl border transition-colors duration-300 text-left flex flex-col sm:flex-row sm:items-center gap-4 group relative overflow-hidden ${
                                mod.bloqueado
                                ? 'bg-slate-900/30 border-slate-800/60 opacity-70 cursor-not-allowed grayscale'
                                : 'glass-card-apple border-white/10 hover:border-blue-400/60 hover:shadow-[0_15px_40px_-15px_rgba(59,130,246,0.5)]'
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
                            </motion.button>

                            <div className="hidden md:flex flex-col items-center justify-center w-20 shrink-0">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 * index + 0.15, type: 'spring', stiffness: 400, damping: 15 }}
                              className={`relative w-16 h-16 rounded-full flex items-center justify-center font-display font-black text-xl border-2 ${
                                mod.bloqueado
                                ? 'bg-slate-900 border-slate-700 text-slate-600'
                                : 'bg-gradient-to-br from-cyan-400 to-blue-700 border-cyan-300 text-white shadow-[0_0_25px_rgba(34,211,238,0.55)]'
                            }`}>
                                {mod.bloqueado ? <Lock className="w-6 h-6" /> : index + 1}
                            </motion.div>
                            </div>
                            <div className="hidden md:block flex-1" />
                        </motion.div>
                        );
                    })}
                    </div>
                </div>
                )}
                </motion.div>
            </AnimatePresence>
          </div>

          {/* SIDEBAR (Práctica Rápida y Top) */}
          <aside className="space-y-6 xl:space-y-7">
            <motion.div
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 22 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-card-apple rounded-3xl p-6 xl:p-7 border border-white/10 relative overflow-hidden holo-border" data-tour="daily-challenge">
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
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 22 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-card-apple rounded-3xl p-6 xl:p-7 border"
              data-tour="ranking"
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
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 22 }}
              whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.2 } }}
              className="glass-card-apple rounded-3xl p-6 xl:p-7 border cursor-pointer group"
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
