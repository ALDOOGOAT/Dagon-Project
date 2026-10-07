import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { TutorialOverlay, TourTrigger } from '../components/TutorialOverlayCinematic.jsx';
import { WelcomeCard } from '../components/WelcomeCard';
import { DidacticCard } from '../components/DidacticCard';
import { CertificateModal, useCertificado } from '../components/CertificateModal';
import { cachedGet } from '../services/apiClient';
import { sounds } from '../lib/SoundEngine';
import { getMateria, getSenda } from '../config/materias';
import {
  Zap, Flame, Lock, Trophy, LogOut, Target, Play, Sparkles, Crown,
  Star, ChevronRight, CalendarDays, Database, Shield, Swords,
  User, Award, Heart, BookOpen, Volume2, VolumeX, Repeat, Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const QuickPracticeMode = lazy(() => import('../components/QuickPracticeMode').then(module => ({ default: module.QuickPracticeMode })));

const titleFor = (xp, titulos) => [...titulos].reverse().find((t) => xp >= t.min) || titulos[0];

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCursos = (rawCursos) => {
  if (!Array.isArray(rawCursos)) return [];

  return rawCursos.map((curso) => {
    const idCurso = toFiniteNumber(curso?.id_curso, null);
    const modulos = Array.isArray(curso?.modulos) ? curso.modulos : [];

    return {
      ...curso,
      id_curso: idCurso,
      modulos: modulos.map((modulo) => ({
        ...modulo,
        id_modulo: toFiniteNumber(modulo?.id_modulo, modulo?.id_modulo),
        id_curso: toFiniteNumber(modulo?.id_curso, idCurso),
        orden: toFiniteNumber(modulo?.orden, 0),
        xp_requerida: toFiniteNumber(modulo?.xp_requerida, 0),
        bloqueado: Boolean(modulo?.bloqueado),
      })),
    };
  }).filter((curso) => Number.isFinite(curso.id_curso));
};

const resolveCursoActivoId = (cursos, currentId) => {
  const parsedCurrent = toFiniteNumber(currentId, null);
  const currentCourse = Number.isFinite(parsedCurrent)
    ? cursos.find((curso) => curso.id_curso === parsedCurrent)
    : null;

  if (currentCourse?.modulos?.length > 0) return currentCourse.id_curso;

  const firstWithModules = cursos.find((curso) => (curso.modulos || []).length > 0);
  if (firstWithModules) return firstWithModules.id_curso;
  if (currentCourse) return currentCourse.id_curso;
  return cursos[0]?.id_curso ?? 1;
};

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
  const { colors, materia } = useTheme();
  const esIo = materia === 'io';
  const cfgMateria = getMateria(materia);
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;
  const pillBg = isLight ? 'rgba(250, 204, 21, 0.14)' : 'rgba(6, 182, 212, 0.10)';
  const pillBorder = isLight ? 'rgba(245, 158, 11, 0.24)' : 'rgba(34, 211, 238, 0.30)';
  const pillText = isLight ? '#92400e' : '#cffafe';
  const topActionClass = "a11y-top-action min-h-[44px] border-2 ring-1 ring-white/10 font-display font-black text-sm w-full justify-center rounded-xl px-4 backdrop-blur-xl shadow-[0_10px_28px_rgba(2,6,23,0.16)] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(2,6,23,0.24)] transition-all";
  const topActionStyle = {
    backgroundColor: isLight ? 'rgba(255,255,255,0.90)' : 'rgba(15,23,42,0.82)',
    borderColor: isLight ? 'rgba(245,158,11,0.48)' : 'rgba(148,163,184,0.44)',
    color: headingColor,
    boxShadow: isLight ? '0 14px 32px -20px rgba(180,83,9,0.62)' : '0 16px 40px -22px rgba(34,211,238,0.62)'
  };

  const [canUseHover, setCanUseHover] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? true;
  });

  useEffect(() => {
    const query = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    if (!query) return undefined;
    const syncHover = () => setCanUseHover(query.matches);
    syncHover();
    query.addEventListener?.('change', syncHover);
    query.addListener?.(syncHover);
    return () => {
      query.removeEventListener?.('change', syncHover);
      query.removeListener?.(syncHover);
    };
  }, []);

  const hoverMotion = (motionValue) => (canUseHover ? motionValue : undefined);

  const [showTutorial, setShowTutorial] = useState(() => localStorage.getItem('dagon_tutorial_pending') === 'true' || !localStorage.getItem('dagon_tutorial_completed'));
  const [showQuickPractice, setShowQuickPractice] = useState(false);
  const [showCertificado, setShowCertificado] = useState(false);
  const [certificadoData, setCertificadoData] = useState(null);
  const [certificadoCurso, setCertificadoCurso] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => sounds.isEnabled());
  const [soundVolume, setSoundVolume] = useState(() => sounds.getVolume());
  const [showRecommendedDetails, setShowRecommendedDetails] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);

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

  const userXP = toFiniteNumber(dashboardStats?.xp, toFiniteNumber(user?.xp, 0));
  const xpInLevel = userXP % 100;
  const xpFaltante = 100 - xpInLevel;
  const userLevel = Math.floor(userXP / 100) + 1;
  const title = titleFor(userXP, cfgMateria.titulos);
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
    const parsed = saved ? parseInt(saved, 10) : 1;
    return Number.isFinite(parsed) ? parsed : 1;
  });
  const [loadingModulos, setLoadingModulos] = useState(true);

  useEffect(() => {
    if (Number.isFinite(Number(cursoActivoId))) {
      localStorage.setItem('dagon_active_course', cursoActivoId);
    }
  }, [cursoActivoId]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const fetchDashboard = async () => {
      const activeToken = token || localStorage.getItem('token');
      if (!activeToken) return;
      setLoadingModulos(true);
      try {
        let resumen;
        try {
          const response = await cachedGet('/api/dashboard/resumen', {
            signal: controller.signal,
            params: { materia },
          }, { ttl: 10_000 });
          resumen = response.data || {};
        } catch (endpointError) {
          if (endpointError.name === 'CanceledError' || endpointError.code === 'ERR_CANCELED') {
            throw endpointError;
          }

          const [statsRes, modulosRes, rankingRes] = await Promise.all([
            user?.idUsuario
              ? cachedGet(`/api/usuarios/${user.idUsuario}/stats`, { signal: controller.signal }, { ttl: 10_000 }).catch(() => ({ data: {} }))
              : Promise.resolve({ data: {} }),
            cachedGet('/api/modulos', { signal: controller.signal, params: { materia } }, { ttl: 10_000 }).catch(() => ({ data: [] })),
            cachedGet('/api/leaderboard', { signal: controller.signal, params: { materia } }, { ttl: 10_000 }).catch(() => ({ data: [] }))
          ]);

          resumen = {
            stats: statsRes.data || {},
            modulos: modulosRes.data || [],
            leaderboard: rankingRes.data || []
          };
        }

        if (!isActive) return;

        const stats = resumen.stats || {};
        const modulos = normalizeCursos(resumen.modulos || []);
        const ranking = resumen.leaderboard || [];

        if (stats.success) {
          setDashboardStats(stats);
          updateUserXP(toFiniteNumber(stats.xp, 0));
          setUserRank(stats.posicion ?? '-');
          setUserStreak(toFiniteNumber(stats.racha, 0));
        } else {
          setDashboardStats(null);
        }

        setCursos(modulos);
        setTopPlayers(Array.isArray(ranking) ? ranking.slice(0, 5) : []);
        setCursoActivoId(currentId => resolveCursoActivoId(modulos, currentId));
      } catch (error) {
        if (error.name !== 'CanceledError' && ![401, 403].includes(error?.response?.status)) {
          toast.error('Error al cargar el tablero');
        }
      } finally {
        if (isActive) setLoadingModulos(false);
      }
    };

    fetchDashboard();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [token, user?.idUsuario, updateUserXP, materia]);

  const handleModuloClick = (mod) => {
    if (mod.bloqueado) {
      sounds.playError();
      toast.error(`Necesitas ${mod.xp_requerida} XP para desbloquear esta misión.`);
      sounds.init();
      return;
    }
    sounds.playMissionStart?.();
    navigate(esIo ? `/io/mision/${mod.id_modulo}` : `/exercise/${mod.id_modulo}`);
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
      <div className="dashboard-shell dagon-page-shell dagon-page-shell--wide min-h-screen flex flex-col items-center justify-center gap-6">
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
  const cursoActivo = cursos.find(c => c.id_curso === cursoActivoId && (c.modulos || []).length > 0)
    || cursos.find(c => (c.modulos || []).length > 0)
    || cursos.find(c => c.id_curso === cursoActivoId)
    || cursos[0]
    || { id_curso: cursoActivoId, titulo: cfgMateria.cursoPorDefecto, modulos: [] };
  const cursoVisualActivoId = cursoActivo.id_curso ?? cursoActivoId;
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
  const missionFocuses = cfgMateria.missionFocuses;
  const recommendedFocus = missionFocuses[Math.max(0, recommendedMissionIndex) % missionFocuses.length] || missionFocuses[0];

  return (
    <div className="min-h-screen" data-testid="dashboard-page">
      <TutorialOverlay isOpen={showTutorial} onClose={closeTutorial} />
      <WelcomeCard />
      {showQuickPractice && !esIo && (
        <Suspense fallback={null}>
          <QuickPracticeMode
            userLevel={user?.level || 'nivel-0'}
            userXP={userXP}
            userStreak={userStreak}
            onXPGain={(xp) => updateUserXP((currentXP) => (Number(currentXP) || 0) + xp)}
            onClose={() => setShowQuickPractice(false)}
          />
        </Suspense>
      )}

      <div className="dashboard-shell dagon-page-shell dagon-page-shell--wide">
        {/* CENTRO DE MANDO */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="dashboard-hud glass-card-apple dagon-compact-card mb-8 rounded-3xl border p-4 sm:p-5 lg:mb-10"
          data-tour="header"
          style={{
            borderColor: colors.border,
            '--hud-accent': colors.primary,
            '--hud-secondary': colors.secondary,
            '--hud-surface': colors.surface
          }}
        >
          <div className="dashboard-hud-grid">
            <div className="dashboard-hud-zone dashboard-hud-zone--identity">
              <div className="relative shrink-0">
                <div className={`absolute -inset-2 rounded-[32px] ${tierRing(title.tier)}`} />
                <div className={`dashboard-mascot-card relative flex h-24 w-20 items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br ${tierGradient(title.tier)} shadow-xl sm:h-28 sm:w-24`}>
                  <DagonMascot size="medium" mood={dashboardMood} />
                </div>
              </div>
              <div className="min-w-0">
                <p className="arcane-kicker text-xs font-bold mb-2" style={{ color: colors.accent }}>
                  {todayDay} · Mapa de campaña
                </p>
                <h1 className="text-arcane-title arcane-rune-line font-display text-3xl sm:text-4xl xl:text-5xl font-black leading-none" style={{ color: headingColor }}>
                  Hola, <span className="text-gradient-abyss">{user?.nombre || 'aventurero'}</span>
                </h1>
                <p className="text-arcane-body mt-3 max-w-xl font-gameui text-sm leading-relaxed" style={{ color: mutedColor }}>
                  {cfgMateria.hudTexto}
                </p>
              </div>
            </div>

            <div className="dashboard-hud-zone dashboard-hud-zone--progress" data-tour="progress">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ backgroundColor: pillBg, borderColor: pillBorder }}>
                  <Sparkles className="w-3 h-3" style={{ color: colors.primary }} />
                  <span className="font-gameui text-xs font-bold tracking-widest uppercase" style={{ color: pillText }}>
                    {title.name}
                  </span>
                </span>
                {userStreak > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/streak')}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: isLight ? 'rgba(251,146,60,0.16)' : 'rgba(249,115,22,0.20)', borderColor: 'rgba(251,146,60,0.30)' }}
                  >
                    <Flame className="w-3 h-3" style={{ color: isLight ? '#c2410c' : '#fdba74' }} />
                    <span className="font-gameui text-xs font-bold tracking-widest uppercase" style={{ color: isLight ? '#9a3412' : '#fed7aa' }}>
                      {userStreak} días
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-[auto_1fr_auto] items-end gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: mutedColor }}>Nivel</p>
                  <p className="font-display text-5xl font-black leading-none" style={{ color: colors.primary }}>{userLevel}</p>
                </div>
                <div className="min-w-0 pb-1">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-gameui text-sm" style={{ color: mutedColor }}>Siguiente nivel</span>
                    <span className="font-display font-black" style={{ color: headingColor }}>
                      {xpInLevel}<span style={{ color: mutedColor }}>/100 XP</span>
                    </span>
                  </div>
                  <div className="relative h-4 w-full overflow-hidden rounded-full border xp-bar-shine" style={{ backgroundColor: `${colors.surface}CC`, borderColor: colors.border }}>
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
                <button
                  type="button"
                  onClick={() => navigate('/leaderboard')}
                  className="hidden rounded-2xl border px-4 py-3 text-right transition-transform hover:-translate-y-0.5 sm:block"
                  style={{ borderColor: colors.border, backgroundColor: isLight ? 'rgba(255,255,255,0.68)' : 'rgba(15,23,42,0.58)' }}
                >
                  <p className="text-[10px] uppercase tracking-[0.24em] font-black" style={{ color: colors.accent }}>Ranking</p>
                  <p className="mt-1 font-display text-lg font-black" style={{ color: headingColor }}>#{userRank}</p>
                </button>
              </div>
            </div>

            <div className="dashboard-hud-zone dashboard-hud-zone--actions">
              <div className="dashboard-control-dock">
                <TourTrigger onClick={openTutorial} />
                <Button
                  data-tour="streaks"
                  onClick={() => navigate('/streak')}
                  variant="ghost"
                  className={`${topActionClass} dashboard-streak-action`}
                  style={{
                    ...topActionStyle,
                    background: userStreak > 0
                      ? (isLight ? 'linear-gradient(135deg, rgba(255,247,237,0.96), rgba(254,215,170,0.92))' : 'linear-gradient(135deg, rgba(67,20,7,0.88), rgba(127,29,29,0.76))')
                      : topActionStyle.backgroundColor,
                    borderColor: userStreak > 0 ? 'rgba(251,146,60,0.72)' : topActionStyle.borderColor,
                    color: userStreak > 0 ? (isLight ? '#9a3412' : '#fed7aa') : headingColor,
                  }}
                  aria-label={`Abrir racha actual: ${userStreak || 0} días`}
                  title="Ver y cuidar mi racha"
                >
                  <Flame className="w-4 h-4 mr-2 dashboard-streak-action__flame" />
                  <span>Racha</span>
                  <span className="dashboard-streak-action__count">{userStreak || 0}</span>
                </Button>
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
                  <span>{soundEnabled ? 'Sonido' : 'Silencio'}</span>
                </Button>
                <Button data-tour="profile" onClick={() => navigate('/profile')} className={topActionClass} style={topActionStyle} aria-label="Abrir mi perfil">
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </Button>
                {!esIo && (
                    <Button
                      data-tour="quick-practice"
                      onClick={() => setShowQuickPractice(true)}
                      className={`${topActionClass} dashboard-control-dock__wide tracking-wide hover:scale-[1.02]`}
                      style={{ ...topActionStyle, background: isLight ? 'linear-gradient(90deg, #f59e0b, #fb923c)' : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, borderColor: isLight ? 'rgba(251,146,60,0.72)' : 'rgba(34,211,238,0.72)', color: isLight ? '#1f2937' : '#ffffff' }}
                      aria-label="Abrir práctica rápida"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Práctica rápida
                    </Button>
                )}
                <Button
                  data-tour="switch-materia"
                  onClick={() => { sounds.playClick(); navigate('/materias'); }}
                  className={`${topActionClass} dashboard-control-dock__wide`}
                  style={topActionStyle}
                  aria-label="Cambiar materia"
                >
                  <Repeat className="w-4 h-4 mr-2" />
                  Cambiar materia
                </Button>
                {(user?.idRol === 2 || user?.idRol === 3) && (
                  <Button
                    onClick={() => navigate('/docente')}
                    className={`${topActionClass} dashboard-control-dock__wide`}
                    style={{ ...topActionStyle, borderColor: 'rgba(139,92,246,0.55)', color: isLight ? '#5b21b6' : '#c4b5fd' }}
                    aria-label="Abrir panel docente"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Panel docente
                  </Button>
                )}
                <Button onClick={handleLogout} variant="ghost" className={`${topActionClass} dashboard-control-dock__wide`} style={{ ...topActionStyle, color: mutedColor }} aria-label="Cerrar sesión">
                  <LogOut className="w-5 h-5 mr-2" />
                  Salir
                </Button>
              </div>
              <label
                className="a11y-top-action mt-3 flex min-h-[42px] w-full items-center gap-3 rounded-xl border-2 px-4 text-xs font-display font-black"
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
            </div>
          </div>
        </motion.section>

        {/* ACADEMIA POSTGRESQL (SQL) / CALCULADORA IO (IO) */}
        <motion.button
          data-tour={esIo ? 'calculadora-io' : 'postgres-academy'}
          type="button"
          onClick={() => {
            sounds.playClick();
            navigate(esIo ? '/io/calculadora' : '/postgres');
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="w-full glass-card-apple dagon-compact-card rounded-3xl p-5 sm:p-6 lg:p-7 border mb-8 lg:mb-10 text-left group relative overflow-hidden"
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
                {esIo
                  ? <Calculator className="w-7 h-7" style={{ color: colors.primary }} />
                  : <Database className="w-7 h-7" style={{ color: colors.primary }} />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: colors.primary }}>
                    {esIo ? 'Herramienta de la materia' : 'Nuevo modulo teorico'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: mutedColor, borderColor: `${colors.primary}26` }}>
                    <BookOpen className="w-3 h-3" />
                    {esIo ? 'Calculadora IO' : 'PostgreSQL'}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black" style={{ color: headingColor }}>
                  {esIo ? 'CALCULADORA IO' : 'Aprende PostgreSQL con Dagon'}
                </h2>
                <p className="mt-2 max-w-3xl text-sm sm:text-base font-gameui" style={{ color: mutedColor }}>
                  {esIo
                    ? 'Simplex, método gráfico, transporte, redes, inventarios, colas y Markov: escribe el modelo y obtén el procedimiento paso a paso con sus gráficas.'
                    : 'Historia, usos reales y comandos basicos, medios y avanzados en una experiencia cinematica e interactiva.'}
                </p>
              </div>
            </div>
            <div className="flex w-full shrink-0 sm:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 font-display font-black text-white transition-all group-hover:translate-x-1" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
              {esIo ? 'Abrir calculadora' : 'Entrar a la academia'}
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
              whileHover={hoverMotion({ y: -4, scale: 1.03, transition: { duration: 0.2 } })}
              whileTap={{ scale: 0.97 }}
              className={`glass-card-apple rounded-2xl p-4 border transition-colors group text-left ${stat.borderColor || ''}`}
              style={stat.borderStyle || {}}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.iconBg || ''} ${stat.iconBorder || ''}`}
                  style={stat.iconStyle || {}}
                  whileHover={hoverMotion({ scale: 1.15, rotate: 5 })}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {stat.icon}
                </motion.div>
                <div>
                  <p className={`font-display font-black ${stat.isText ? 'text-base leading-tight' : 'text-2xl'}`} style={{ color: headingColor }}>{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: mutedColor }}>{stat.label}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

          {/* DIDACTIC CARDS */}
          <DidacticCard />

          {/* SELECTOR DE CURSOS / SENDAS */}
        <div className="dashboard-course-selector grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-8 lg:mb-10" data-tour="courses">
            {cursos.map((curso, i) => (
                <motion.button
                  key={curso.id_curso}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 250, damping: 22 }}
                  whileHover={hoverMotion({ y: -3, scale: 1.015, transition: { duration: 0.2 } })}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    sounds.playClick();
                    setCursoActivoId(curso.id_curso);
                  }}
                  className={`dashboard-course-card p-6 rounded-2xl border-2 transition-colors flex items-center justify-between group ${
                      cursoVisualActivoId === curso.id_curso
                        ? 'shadow-[0_0_20px_rgba(0,0,0,0.3)]'
                        : 'border-white/10 hover:border-slate-500'
                  }`}
                  style={{
                    backgroundColor: cursoVisualActivoId === curso.id_curso ? `${colors.primary}20` : `${colors.surface}80`,
                    borderColor: cursoVisualActivoId === curso.id_curso ? colors.primary : colors.border
                  }}
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                          animate={cursoVisualActivoId === curso.id_curso ? { rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.5 }}
                          style={{
                            backgroundColor: cursoVisualActivoId === curso.id_curso ? `${colors.primary}33` : colors.surface,
                            color: cursoVisualActivoId === curso.id_curso ? colors.primary : colors.textMuted
                          }}
                        >
                            {(() => { const SendaIcon = getSenda(materia, curso.id_curso, cursos.indexOf(curso)).icono; return <SendaIcon className="w-6 h-6" />; })()}
                        </motion.div>
                        <div className="text-left">
                            <h3 className="font-display font-black text-xl transition-colors" style={{ color: cursoVisualActivoId === curso.id_curso ? headingColor : mutedColor }}>
                                {getSenda(materia, curso.id_curso, cursos.indexOf(curso)).nombre}
                            </h3>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold mt-1 transition-colors"
                               style={{ color: cursoVisualActivoId === curso.id_curso ? colors.accent : colors.textMuted }}>
                                {curso.titulo}
                            </p>
                        </div>
                    </div>
                    {cursoVisualActivoId === curso.id_curso && (
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
            className="dashboard-briefing-card glass-card-apple rounded-3xl border mb-8 lg:mb-10 relative overflow-hidden"
            data-tour="recommended"
            style={{
              borderColor: `${colors.primary}44`,
              '--briefing-accent': colors.primary,
              '--briefing-secondary': colors.secondary,
              '--briefing-surface': colors.surface
            }}
          >
            <div className="relative z-10 grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-7">
              <button
                type="button"
                onClick={() => setShowRecommendedDetails((prev) => !prev)}
                className="dashboard-briefing-trigger min-w-0 text-left"
                aria-expanded={showRecommendedDetails}
              >
                <div className="flex items-start gap-4">
                  <div className="dashboard-briefing-orb">
                    <Target className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: colors.primary, borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}12` }}>
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
                    <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-display font-black uppercase tracking-widest" style={{ borderColor: `${colors.primary}35`, color: headingColor, backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(15,23,42,0.50)' }}>
                      Briefing táctico
                      <motion.span animate={{ rotate: showRecommendedDetails ? 90 : 0 }} transition={{ duration: 0.22 }}>
                        <ChevronRight className="h-4 w-4" />
                      </motion.span>
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex flex-col gap-3 lg:w-64">
                <Button
                  onClick={() => handleModuloClick(recommendedMission)}
                  disabled={recommendedMission.bloqueado}
                  className="w-full justify-center text-white font-display font-black py-6 rounded-2xl shadow-[0_12px_30px_rgba(16,185,129,0.28)]"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  Entrar ahora
                </Button>
                {!esIo && (
                  <Button
                    onClick={() => setShowQuickPractice(true)}
                    variant="outline"
                    className="w-full justify-center border font-display font-black rounded-2xl"
                    style={{ borderColor: `${colors.primary}40`, color: headingColor, backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(15,23,42,0.50)' }}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Entrenar primero
                  </Button>
                )}
              </div>
            </div>

            <div className="relative z-10 px-5 pb-5 sm:px-6 lg:px-7 lg:pb-7">
                <AnimatePresence initial={false}>
                  {showRecommendedDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.24 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-3 md:grid-cols-3">
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
                    </motion.div>
                  )}
                </AnimatePresence>

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
          </motion.div>
        )}

        {/* MAIN GRID */}
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] 2xl:grid-cols-[minmax(0,1fr)_420px] gap-8 xl:gap-10 2xl:gap-12">
          {/* SENDERO DE NIVELES DEL CURSO ACTIVO */}
          <div className="glass-card-apple dagon-compact-card rounded-3xl p-4 sm:p-5 lg:p-6 border relative overflow-hidden" data-tour="modules" style={{ borderColor: colors.border }}>
            <div className="absolute inset-0 pointer-events-none opacity-70 dagon-circuit-field" />

            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primary}20`, border: `1px solid ${colors.primary}40` }}>
                  {(() => { const SendaIcon = getSenda(materia, cursoVisualActivoId, cursos.findIndex((c) => c.id_curso === cursoVisualActivoId)).icono; return <SendaIcon className="w-5 h-5" style={{ color: colors.primary }} />; })()}
                </div>
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-black" style={{ color: headingColor }}>{cursoActivo.titulo}</h2>
                  <p className="text-sm font-gameui" style={{ color: mutedColor }}>Sigue el flujo, resuelve nodos y alcanza el reto final</p>
                </div>
              </div>
              
              {/* BOTÓN DE CERTIFICADO */}
              {cursosCompletados.find(c => c.id_curso === cursoVisualActivoId) && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={hoverMotion({ scale: 1.05 })}
                  onClick={async () => {
                    const cert = await generarCertificado(cursoVisualActivoId);
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

            <motion.div
              layout
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
                {modulos.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-2xl bg-slate-900/30">
                        <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h3 className="text-white font-display text-xl font-bold">Ruta en Construcción</h3>
                        <p className="text-slate-500">Pronto llegarán nuevas misiones para esta especialidad.</p>
                    </div>
                ) : (
                <div className="dagon-quest-map relative">
                    {modulos.map((mod, index) => {
	                        const isCurrentMission = recommendedMission?.id_modulo === mod.id_modulo;
	                        const isMastered = !mod.bloqueado && recommendedMissionIndex >= 0 && index < recommendedMissionIndex;
	                        const isFinalMission = index === modulos.length - 1;
	                        const statusLabel = mod.bloqueado
	                          ? (isFinalMission ? 'Reto sellado' : 'Sellado')
	                          : isCurrentMission
	                            ? 'Misión actual'
	                            : isMastered
	                              ? (isFinalMission ? 'Reto listo' : 'Dominado')
	                              : (isFinalMission ? 'Reto final' : 'Disponible');
	                        const questAccent = mod.bloqueado
	                          ? mutedColor
	                          : isFinalMission
	                            ? colors.accent
	                            : isCurrentMission
	                            ? colors.primary
	                            : isMastered
	                              ? '#22c55e'
	                              : colors.secondary;
	                        const questSecondary = mod.bloqueado
	                          ? colors.border
	                          : isFinalMission
	                            ? colors.primary
	                            : isCurrentMission
	                            ? colors.accent
	                            : isMastered
	                              ? '#14b8a6'
	                              : colors.primary;
                        const questSurface = mod.bloqueado
                          ? (isLight ? 'rgba(226,232,240,0.64)' : 'rgba(15,23,42,0.74)')
                          : (isLight ? 'rgba(255,255,255,0.78)' : `${colors.surface}d9`);
                        const questText = mod.bloqueado ? mutedColor : headingColor;
                        const questMuted = mod.bloqueado ? mutedColor : colors.textMuted;
                        return (
                        <motion.div
                          key={mod.id_modulo}
                          initial={{ opacity: 0, y: 24, scale: 0.96 }}
	                          animate={{ opacity: 1, x: 0, y: 0 }}
	                          transition={{ delay: 0.08 * index, type: 'spring', stiffness: 200, damping: 22 }}
	                          className={`dagon-quest-node ${isFinalMission ? 'dagon-quest-node--final' : ''}`}
	                          style={{
                            '--quest-accent': questAccent,
                            '--quest-secondary': questSecondary,
                            '--quest-surface': questSurface,
                            '--quest-text': questText,
                            '--quest-muted': questMuted,
                            '--quest-glow': `${questAccent}66`
                          }}
                        >
                            <motion.button
                            onClick={() => handleModuloClick(mod)}
                            aria-current={isCurrentMission ? 'step' : undefined}
                            whileHover={!mod.bloqueado ? hoverMotion({ y: -6, scale: 1.015, transition: { duration: 0.2 } }) : undefined}
                            whileTap={!mod.bloqueado ? { scale: 0.98 } : {}}
	                            className={`dagon-quest-button h-full w-full rounded-[24px] border text-left transition-all duration-300 group relative overflow-hidden ${isFinalMission ? 'dagon-quest-button--final' : ''} ${
	                                mod.bloqueado
	                                ? `dagon-quest-button--locked cursor-not-allowed ${isFinalMission ? '' : 'grayscale'}`
	                                : isCurrentMission
	                                  ? 'dagon-quest-button--current'
	                                  : isMastered
	                                    ? 'dagon-quest-button--mastered'
	                                    : 'dagon-quest-button--open'
	                            }`}
	                            >
	                            <div className="dagon-flow-cap">
	                              <span>{index === 0 ? 'Inicio' : `Nodo ${String(index + 1).padStart(2, '0')}`}</span>
	                              {isFinalMission && <span>Reto final</span>}
	                            </div>
	                            <div className="relative z-10 flex items-start gap-3 p-3 pt-2 sm:p-4 sm:pt-2">
	                                <div className={`dagon-quest-core flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border font-display text-xl font-black ${isFinalMission ? 'dagon-quest-core--final' : ''} ${
	                                  mod.bloqueado
	                                  ? 'dagon-quest-core--locked'
	                                  : isCurrentMission
	                                    ? 'dagon-quest-core--current'
	                                    : isMastered
	                                      ? 'dagon-quest-core--mastered'
                                      : 'dagon-quest-core--open'
                                }`}>
                                  {mod.bloqueado ? <Lock className="w-5 h-5" /> : index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                    <span className={`dagon-quest-status ${mod.bloqueado ? 'dagon-quest-status--locked' : isCurrentMission ? 'dagon-quest-status--current' : isMastered ? 'dagon-quest-status--mastered' : ''}`}>
                                      {statusLabel}
                                    </span>
                                  </div>
	                                  <h3 className="font-display text-base xl:text-lg font-black leading-tight" style={{ color: questText }}>
	                                    {mod.titulo}
	                                  </h3>
	                                  <p className="dagon-quest-description mt-1.5 text-xs sm:text-sm font-gameui leading-relaxed" style={{ color: questMuted }}>
	                                    {mod.descripcion}
	                                  </p>
	                                  <div className="mt-3">
	                                    {mod.bloqueado ? (
	                                      <span className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ borderColor: `${colors.border}88`, color: mutedColor, backgroundColor: isLight ? 'rgba(255,255,255,0.54)' : 'rgba(15,23,42,0.54)' }}>
	                                        <Lock className="w-4 h-4" />
	                                        {mod.xp_requerida} XP
	                                      </span>
	                                    ) : (
	                                      <span className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-display font-black transition-all" style={{ borderColor: `${questAccent}55`, color: isLight ? '#0f172a' : '#ecfeff', backgroundColor: `${questAccent}1f` }}>
	                                        {isFinalMission ? 'Desafiar' : isCurrentMission ? 'Continuar' : 'Entrar'}
	                                        <Play className="w-3 h-3 fill-current" />
	                                      </span>
	                                    )}
	                                  </div>
	                                </div>
	                            </div>
	                            </motion.button>
                        </motion.div>
                        );
                    })}
                </div>
                )}
                </motion.div>
          </div>

          {/* SIDEBAR (Práctica Rápida y Top) */}
          <aside className="dashboard-aside space-y-6 xl:space-y-7">
            {!esIo && (
              <motion.div
                initial={{ opacity: 0, x: 30, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 22 }}
                whileHover={hoverMotion({ y: -3, transition: { duration: 0.2 } })}
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
            )}
            
            {/* Mini leaderboard (RESTAURADO) */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 22 }}
              whileHover={hoverMotion({ y: -3, transition: { duration: 0.2 } })}
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
                  className="-mr-2 flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-gameui font-bold transition-colors hover:bg-white/5"
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
              whileHover={hoverMotion({ y: -3, scale: 1.01, transition: { duration: 0.2 } })}
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
        cursoId={cursoVisualActivoId}
        cursoNombre={certificadoCurso}
      />
    </div>
  );
};
