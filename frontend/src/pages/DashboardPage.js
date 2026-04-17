import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { QuickPracticeMode } from '../components/QuickPracticeMode';
import {
  Zap, Flame, Lock, Trophy, LogOut, Target, Play, Sparkles, Crown,
  Star, ChevronRight, CalendarDays, Database, Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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

  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickPractice, setShowQuickPractice] = useState(false);

  const userXP = user?.xp || 0;
  const xpInLevel = userXP % 100;
  const xpFaltante = 100 - xpInLevel;
  const userLevel = Math.floor(userXP / 100) + 1;
  const title = titleFor(userXP);

  const [userRank, setUserRank] = useState('-');
  const [userStreak, setUserStreak] = useState(0);
  const [topPlayers, setTopPlayers] = useState([]);

  const [modulos, setModulos] = useState([]);
  const [loadingModulos, setLoadingModulos] = useState(true);

  useEffect(() => {
    const fetchRealXP = async () => {
      try {
        const miUsuarioId = user?.idUsuario;
        if (!miUsuarioId) return;
        const response = await fetch(`http://localhost:8080/api/usuarios/${miUsuarioId}/stats`, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/modulos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setModulos(await response.json());
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
        const response = await fetch('http://localhost:8080/api/leaderboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTopPlayers(data.slice(0, 5));
        }
      } catch (e) {
        // silencioso — el dashboard sigue siendo útil sin esto
      }
    };
    if (token) fetchTop();
  }, [token]);

  const handleModuloClick = (mod) => {
    if (mod.bloqueado) {
      toast.error(`Necesitas ${mod.xp_requerida} XP para desbloquear esta misión.`);
      return;
    }
    navigate(`/exercise/${mod.id_modulo}`);
  };

  const handleLogout = () => {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <DagonMascot size="large" mood="determined" />
          </div>
          <p className="text-cyan-300 font-bold tracking-[0.4em] uppercase text-xs">Cargando el abismo...</p>
        </div>
      </div>
    );
  }

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
              Continúa tu viaje en las profundidades del SQL.
            </p>
          </motion.div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowQuickPractice(true)}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white font-display font-black tracking-wide shadow-[0_10px_30px_rgba(249,115,22,0.4)] hover:scale-105 transition-all"
            >
              <Target className="w-4 h-4 mr-2" />
              Práctica Rápida
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/5">
              <LogOut className="w-5 h-5 mr-2" /> Salir
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
            {/* Avatar with ring */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className={`absolute -inset-3 rounded-3xl ${tierRing(title.tier)}`} />
                <div className={`relative w-28 h-28 rounded-2xl bg-gradient-to-br ${tierGradient(title.tier)} flex items-center justify-center shadow-2xl`}>
                  <DagonMascot size="medium" mood="excited" />
                </div>
                <div className="absolute -bottom-3 -right-3 badge-shine text-yellow-950 text-xs font-display font-black px-3 py-1 rounded-lg border border-yellow-300 animate-badge-pulse">
                  Lvl {userLevel}
                </div>
              </div>
            </div>

            {/* Title + XP bar */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span className="font-gameui text-xs font-bold tracking-widest uppercase text-cyan-200">
                    {title.name}
                  </span>
                </span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  Tier <span className="text-slate-300">{title.tier}</span>
                </span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 font-gameui text-sm">Progreso al nivel {userLevel + 1}</span>
                <span className="font-display font-black text-white">
                  {xpInLevel}<span className="text-slate-500">/100 XP</span>
                </span>
              </div>
              <div className="relative w-full h-4 bg-slate-900/80 rounded-full border border-white/5 overflow-hidden xp-bar-shine">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInLevel}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 shadow-[0_0_20px_rgba(99,102,241,0.7)]"
                />
              </div>
              <p className="text-slate-500 text-xs mt-2 font-gameui">
                Te faltan <span className="text-cyan-300 font-bold">{xpFaltante} XP</span> para tu siguiente título
              </p>
            </div>

            {/* Big XP number */}
            <div className="text-right">
              <p className="font-display text-7xl font-black text-gradient-gold leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                {userXP}
              </p>
              <p className="text-slate-400 text-xs uppercase tracking-[0.4em] font-bold mt-2">XP Totales</p>
            </div>
          </div>
        </motion.div>

        {/* STAT TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <motion.button
            whileHover={{ y: -6 }}
            onClick={() => navigate('/streak')}
            className="text-left glass-card-apple rounded-2xl p-6 border border-white/10 hover:border-orange-500/50 transition-all card-hover-pop relative overflow-hidden group"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-600/20 border border-orange-400/40 flex items-center justify-center">
                <Flame className="w-7 h-7 text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.6)]" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Racha actual</p>
                <p className="font-display text-4xl font-black text-white leading-none mt-1">
                  {userStreak}<span className="text-base text-slate-500 ml-1">días</span>
                </p>
              </div>
            </div>
            <p className="text-orange-300 text-xs mt-4 font-gameui font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
              Ver estadísticas <ChevronRight className="w-3 h-3" />
            </p>
          </motion.button>

          <motion.button
            whileHover={{ y: -6 }}
            onClick={() => navigate('/leaderboard')}
            className="text-left glass-card-apple rounded-2xl p-6 border border-white/10 hover:border-yellow-500/50 transition-all card-hover-pop relative overflow-hidden group"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-colors" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-700/20 border border-yellow-400/40 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Posición global</p>
                <p className="font-display text-4xl font-black text-white leading-none mt-1">#{userRank}</p>
              </div>
            </div>
            <p className="text-yellow-300 text-xs mt-4 font-gameui font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
              Ver ranking <ChevronRight className="w-3 h-3" />
            </p>
          </motion.button>

          <motion.button
            whileHover={{ y: -6 }}
            onClick={() => navigate('/profile')}
            className="text-left glass-card-apple rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all card-hover-pop relative overflow-hidden group"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-700/20 border border-cyan-400/40 flex items-center justify-center">
                <Shield className="w-7 h-7 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Misiones desbloqueadas</p>
                <p className="font-display text-4xl font-black text-white leading-none mt-1">
                  {completedCount}<span className="text-base text-slate-500">/{totalCount}</span>
                </p>
              </div>
            </div>
            <p className="text-cyan-300 text-xs mt-4 font-gameui font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
              Ver perfil <ChevronRight className="w-3 h-3" />
            </p>
          </motion.button>
        </div>

        {/* MAIN GRID — sendero + sidebar */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* SENDERO DE NIVELES */}
          <div className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <h2 className="font-display text-3xl font-black text-white">Sendero del Abismo</h2>
                  <p className="text-slate-400 text-sm font-gameui">Conquista cada misión para descender más profundo</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-full border border-white/5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progreso</span>
                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${moduleProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                  />
                </div>
                <span className="text-cyan-300 font-display font-black text-sm">{Math.round(moduleProgress)}%</span>
              </div>
            </div>

            {modulos.length === 0 ? (
              <p className="text-slate-500 italic">Aún no hay misiones configuradas.</p>
            ) : (
              <div className="relative">
                {/* línea conectora vertical */}
                <div className="absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-1 path-glow rounded-full hidden md:block" />
                <div className="space-y-6 relative">
                  {modulos.map((mod, index) => {
                    const isLeft = index % 2 === 0;
                    return (
                      <motion.div
                        key={mod.id_modulo}
                        initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.5 }}
                        className={`flex items-center gap-4 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                      >
                        {/* Card */}
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
                                Misión {String(index + 1).padStart(2, '0')}
                              </span>
                              {!mod.bloqueado && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                  Disponible
                                </span>
                              )}
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
                              <span className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 border border-blue-400/40 px-4 py-2 rounded-xl text-sm font-display font-black group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all">
                                Jugar <Play className="w-3 h-3 fill-current" />
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Nodo central */}
                        <div className="hidden md:flex flex-col items-center justify-center w-20 shrink-0">
                          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center font-display font-black text-xl border-2 ${
                            mod.bloqueado
                              ? 'bg-slate-900 border-slate-700 text-slate-600'
                              : 'bg-gradient-to-br from-cyan-400 to-blue-700 border-cyan-300 text-white shadow-[0_0_25px_rgba(34,211,238,0.55)]'
                          }`}>
                            {mod.bloqueado ? <Lock className="w-6 h-6" /> : index + 1}
                            {!mod.bloqueado && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                            )}
                          </div>
                        </div>

                        {/* Espaciador del lado opuesto */}
                        <div className="hidden md:block flex-1" />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-6">
            {/* Daily challenge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="glass-card-apple rounded-3xl p-6 border border-white/10 relative overflow-hidden holo-border"
            >
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
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-display font-black tracking-wide shadow-[0_10px_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-transform"
              >
                <Zap className="w-4 h-4 mr-2" />
                Empezar reto
              </Button>
            </motion.div>

            {/* Mini leaderboard */}
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
    </div>
  );
};
