import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import {
  Activity,
  ArrowLeft,
  Clock,
  Cpu,
  Crown,
  Database,
  GitBranch,
  Medal,
  RefreshCw,
  Server,
  Sparkles,
  Target,
  Trophy,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { DagonMascot } from '../components/DagonMascot';
import apiClient from '../services/apiClient';

const numberFormatter = new Intl.NumberFormat('es-MX');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNumber = (value) => numberFormatter.format(toNumber(value));

const formatMs = (value) => {
  const parsed = toNumber(value);
  if (parsed <= 0) return '0 ms';
  if (parsed < 10) return `${parsed.toFixed(2)} ms`;
  if (parsed < 100) return `${parsed.toFixed(1)} ms`;
  return `${Math.round(parsed)} ms`;
};

const leagueFor = (xp) => {
  if (xp >= 2000) return { name: 'Abismo', color: 'from-fuchsia-500 to-indigo-700', text: 'text-fuchsia-200', ring: 'ring-tier-abyss' };
  if (xp >= 1000) return { name: 'Oro',    color: 'from-yellow-300 to-amber-600',   text: 'text-yellow-200', ring: 'ring-tier-gold' };
  if (xp >= 500)  return { name: 'Plata',  color: 'from-slate-200 to-slate-500',    text: 'text-slate-200',  ring: 'ring-tier-silver' };
  return { name: 'Bronce', color: 'from-amber-700 to-orange-900', text: 'text-amber-200', ring: 'ring-tier-bronze' };
};

const MpiAnalyticsPanel = ({
  analytics,
  loading,
  onRefresh,
  colors,
  isLight,
  headingColor,
  mutedColor,
  borderColor,
  surfaceColor
}) => {
  const resultado = analytics?.resultado || {};
  const mpi = resultado.mpi || {};
  const totales = resultado.totales || {};
  const promedios = resultado.promedios || {};
  const ranks = Array.isArray(mpi.por_rank) ? mpi.por_rank : [];
  const distribucion = Object.entries(resultado.distribucion_titulos || {});
  const pipeline = Array.isArray(analytics?.pipeline) ? analytics.pipeline : [
    'LeaderboardService.obtenerRankingGlobal()',
    'AnalyticsController /api/analytics/mpi',
    'mpi_service/server.py',
    'mpi_service/analytics_mpi.py'
  ];
  const online = Boolean(analytics?.ok);
  const status = loading
    ? { label: 'Ejecutando', icon: Activity, color: colors.primary }
    : online
      ? { label: 'En línea', icon: Wifi, color: isLight ? '#15803d' : '#86efac' }
      : { label: 'Sin conexión', icon: WifiOff, color: isLight ? '#b45309' : '#fbbf24' };
  const StatusIcon = status.icon;
  const maxRankUsers = Math.max(1, ...ranks.map((rank) => toNumber(rank.usuarios)));
  const totalUsuarios = toNumber(totales.usuarios, analytics?.ranking_count || 0);
  const procesos = toNumber(mpi.procesos, ranks.length);
  const wallMs = toNumber(resultado.wall_ms);
  const proxyMs = toNumber(analytics?.proxy_ms);
  const rankPreview = ranks.slice(0, 4);
  const pipelinePreview = pipeline.slice(0, 3);
  const distribucionPreview = distribucion.slice(0, 3);
  const metrics = [
    { label: 'Usuarios', value: formatNumber(totalUsuarios), icon: Database },
    { label: 'Procesos', value: procesos ? formatNumber(procesos) : 'Pendiente', icon: Cpu },
    { label: 'MPI', value: formatMs(wallMs), icon: Clock },
    { label: 'Proxy', value: formatMs(proxyMs), icon: Server },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-apple dagon-compact-card relative overflow-hidden rounded-3xl border p-4"
      style={{ borderColor }}
      aria-label="Analytics MPI del ranking"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${colors.primary}, ${isLight ? '#d97706' : '#fde047'}, ${colors.accent})`
        }}
      />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: colors.accent }}>
            Analítica MPI
          </p>
          <h2 className="mt-1 flex items-center gap-2 font-display text-lg font-black" style={{ color: headingColor }}>
            <Cpu className="h-5 w-5 shrink-0" style={{ color: colors.primary }} />
            Motor distribuido
          </h2>
          <p className="mt-1 text-xs font-gameui leading-relaxed" style={{ color: mutedColor }}>
            Ranks paralelos calculan señales del ranking actual.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div
            className="flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase tracking-wider"
            style={{ backgroundColor: surfaceColor, borderColor, color: status.color }}
          >
            <StatusIcon className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
            {status.label}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="h-10 rounded-2xl px-3"
            style={{ borderColor, color: headingColor }}
            aria-label="Actualizar analytics MPI"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <div
              key={metric.label}
              className="min-w-0 rounded-2xl border p-3"
              style={{ backgroundColor: surfaceColor, borderColor }}
            >
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider" style={{ color: mutedColor }}>
                <MetricIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{metric.label}</span>
              </div>
              <p className="mt-1 truncate font-display text-lg font-black" style={{ color: headingColor }}>
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mt-4 rounded-2xl border p-3" style={{ backgroundColor: surfaceColor, borderColor }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-black" style={{ color: headingColor }}>Ranks en ejecución</h3>
            <p className="text-xs" style={{ color: mutedColor }}>Dispersión, cómputo y reducción.</p>
          </div>
          <GitBranch className="h-4 w-4 shrink-0" style={{ color: colors.primary }} />
        </div>

        {rankPreview.length > 0 ? (
          <div className="space-y-2.5">
            {rankPreview.map((rank) => {
              const usuarios = toNumber(rank.usuarios);
              const pct = Math.max(7, (usuarios / maxRankUsers) * 100);
              return (
                <div key={rank.rank} className="grid grid-cols-[52px_1fr_auto] items-center gap-2">
                  <span className="font-mono text-xs font-bold" style={{ color: headingColor }}>
                    R{rank.rank}
                  </span>
                  <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: isLight ? 'rgba(146,64,14,0.12)' : 'rgba(255,255,255,0.08)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }}
                    />
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: mutedColor }}>
                    {formatMs(rank.elapsed_ms)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-3 text-xs" style={{ borderColor, color: mutedColor }}>
            {loading ? 'Esperando ranks MPI...' : analytics?.error || 'MPI sin métricas todavía.'}
          </div>
        )}
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border p-3" style={{ backgroundColor: surfaceColor, borderColor }}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: mutedColor }}>XP promedio</p>
          <p className="mt-1 font-display text-lg font-black" style={{ color: headingColor }}>{formatNumber(promedios.xp)}</p>
        </div>
        <div className="rounded-2xl border p-3" style={{ backgroundColor: surfaceColor, borderColor }}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: mutedColor }}>Misiones</p>
          <p className="mt-1 font-display text-lg font-black" style={{ color: headingColor }}>{formatNumber(promedios.misiones)}</p>
        </div>
      </div>

      {(distribucionPreview.length > 0 || pipelinePreview.length > 0) && (
        <div className="relative z-10 mt-4 space-y-2">
          {distribucionPreview.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {distribucionPreview.map(([titulo, cuenta]) => (
                <span
                  key={titulo}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold"
                  style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.05)', borderColor, color: mutedColor }}
                >
                  <span className="truncate">{titulo}</span>
                  <span className="font-mono" style={{ color: headingColor }}>{formatNumber(cuenta)}</span>
                </span>
              ))}
            </div>
          )}

          {pipelinePreview.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pipelinePreview.map((step, index) => (
                <span
                  key={`${step}-${index}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-mono"
                  title={step}
                  style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.04)', borderColor, color: mutedColor }}
                >
                  <span className="font-bold" style={{ color: colors.primary }}>{index + 1}</span>
                  <span className="max-w-[14rem] truncate">{step}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
};

export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { colors, materia } = useTheme();
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;
  const surfaceColor = isLight ? 'rgba(255, 250, 240, 0.82)' : `${colors.surface}66`;
  const borderColor = isLight ? `${colors.border}88` : colors.border;
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mpiAnalytics, setMpiAnalytics] = useState(null);
  const [mpiLoading, setMpiLoading] = useState(false);

  const fetchMpiAnalytics = useCallback(async () => {
    if (!token) return;
    setMpiLoading(true);
    try {
      const response = await apiClient.get('/api/analytics/mpi', { params: { materia } });
      setMpiAnalytics(response.data);
    } catch {
      setMpiAnalytics({
        ok: false,
        estado: 'offline',
        error: 'No se pudo conectar con analytics MPI.'
      });
    } finally {
      setMpiLoading(false);
    }
  }, [token, materia]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await apiClient.get('/api/leaderboard', { params: { materia } });
        setLeaderboardData(response.data);
      } catch {
        toast.error("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchLeaderboard();
      fetchMpiAnalytics();
    }
  }, [token, materia, fetchMpiAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Trophy className="w-12 h-12 animate-pulse" style={{ color: colors.primary }} />
          <p className="font-bold tracking-[0.4em] uppercase text-xs" style={{ color: colors.primary }}>Forjando la clasificación...</p>
        </div>
      </div>
    );
  }

  const top3 = leaderboardData.slice(0, 3);
  const leader = top3[0];
  const totalUsers = leaderboardData.length;
  const maxXP = Math.max(1, ...leaderboardData.map((player) => toNumber(player.xp)));
  const maxMissions = Math.max(1, ...leaderboardData.map((player) => toNumber(player.misionesResueltas)));
  const totalXP = leaderboardData.reduce((sum, player) => sum + toNumber(player.xp), 0);
  const totalMissions = leaderboardData.reduce((sum, player) => sum + toNumber(player.misionesResueltas), 0);
  const averageXP = totalUsers ? Math.round(totalXP / totalUsers) : 0;
  const currentUserEntry = leaderboardData.find((player) => player.idUsuario === user?.idUsuario);
  const podiumGradient = {
    1: 'from-yellow-400 to-amber-700',
    2: 'from-slate-300 to-slate-600',
    3: 'from-amber-700 to-orange-900',
  };
  const podiumSlots = [top3[1] || null, top3[0] || null, top3[2] || null];
  const podiumHeight = {
    1: 'h-36 sm:h-44',
    2: 'h-28 sm:h-36',
    3: 'h-24 sm:h-32',
  };
  const podiumAccent = {
    1: isLight ? '#d97706' : '#facc15',
    2: isLight ? '#64748b' : '#cbd5e1',
    3: isLight ? '#b45309' : '#f59e0b',
  };
  const podiumStepStyle = (place) => ({
    borderColor: `${podiumAccent[place]}66`,
    background: isLight
      ? `linear-gradient(180deg, rgba(255,255,255,0.86), ${podiumAccent[place]}33 46%, ${podiumAccent[place]}66 100%)`
      : `linear-gradient(180deg, ${podiumAccent[place]}44 0%, rgba(15,23,42,0.84) 54%, ${podiumAccent[place]}22 100%)`,
    boxShadow: `0 24px 48px -30px ${podiumAccent[place]}, inset 0 1px 0 rgba(255,255,255,0.24)`,
  });
  const leaderLeague = leagueFor(leader?.xp || 0);
  const rankSummary = [
    {
      label: 'Aventureros',
      value: formatNumber(totalUsers),
      detail: 'en clasificación',
      icon: Trophy,
      accent: colors.primary,
    },
    {
      label: 'Tu lugar',
      value: currentUserEntry ? `#${currentUserEntry.rango}` : '-',
      detail: currentUserEntry ? `${formatNumber(currentUserEntry.xp)} XP` : 'sin actividad registrada',
      icon: Target,
      accent: isLight ? '#d97706' : '#fde047',
    },
    {
      label: 'XP promedio',
      value: formatNumber(averageXP),
      detail: `${formatNumber(totalXP)} XP acumulado`,
      icon: Zap,
      accent: colors.accent,
    },
    {
      label: 'Misiones',
      value: formatNumber(totalMissions),
      detail: 'resueltas en total',
      icon: Activity,
      accent: isLight ? '#047857' : '#34d399',
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" data-testid="leaderboard-page">
      <div className="dagon-page-shell dagon-page-shell--wide">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="shrink-0 rounded-2xl px-3"
              style={{ color: mutedColor }}
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: colors.accent }}>
                Clasificación global
              </p>
              <h1 className="flex items-center gap-2 font-display text-2xl font-black leading-tight sm:text-3xl" style={{ color: headingColor }}>
                <Trophy className="h-6 w-6 shrink-0" style={{ color: isLight ? '#d97706' : '#fde047' }} />
                Salón de la fama
              </h1>
            </div>
          </div>

          {leader && (
            <div
              className="flex items-center gap-3 rounded-2xl border px-3 py-2"
              style={{ backgroundColor: surfaceColor, borderColor }}
            >
              <Crown className="h-5 w-5" style={{ color: isLight ? '#d97706' : '#fde047' }} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: mutedColor }}>Campeón actual</p>
                <p className="truncate font-display text-sm font-black" style={{ color: headingColor }}>{leader.nombre}</p>
              </div>
            </div>
          )}
        </motion.div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {rankSummary.map((card, index) => {
            const CardIcon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, type: 'spring', stiffness: 260, damping: 22 }}
                className="glass-card-apple dagon-compact-card relative overflow-hidden rounded-2xl border p-4"
                style={{ borderColor: `${card.accent}44`, backgroundColor: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(15,23,42,0.54)' }}
              >
                <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${card.accent}18)` }} />
                <div className="relative z-10 flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" style={{ color: card.accent, borderColor: `${card.accent}44`, backgroundColor: `${card.accent}16` }}>
                    <CardIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: mutedColor }}>{card.label}</p>
                    <p className="truncate font-display text-xl font-black leading-tight" style={{ color: headingColor }}>{card.value}</p>
                    <p className="truncate text-[11px] font-gameui" style={{ color: mutedColor }}>{card.detail}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.45fr)]">
          <div className="flex flex-col gap-4">
            <motion.section
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 230, damping: 24 }}
              className="glass-card-apple dagon-compact-card relative overflow-hidden rounded-3xl border p-4 sm:p-5"
              style={{ borderColor: colors.border }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'linear-gradient(135deg, rgba(251,191,36,0.16), transparent 54%)' : `linear-gradient(135deg, ${colors.primary}22, transparent 52%)` }} />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: isLight ? '#d97706' : '#fde047' }}>
                    Podio vivo
                  </p>
                  <h2 className="mt-1 font-display text-xl font-black" style={{ color: headingColor }}>
                    Los más constantes
                  </h2>
                  <p className="mt-1 text-xs font-gameui leading-relaxed" style={{ color: mutedColor }}>
                    Resumen visual del top 3 sin perder el ranking completo.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 shrink-0" style={{ color: isLight ? '#d97706' : '#fde047' }} />
              </div>

              {leader ? (
                <div
                  className="relative z-10 mt-4 overflow-hidden rounded-[2rem] border px-3 pb-4 pt-5 sm:px-4"
                  style={{
                    borderColor,
                    background: isLight
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,248,238,0.56))'
                      : 'linear-gradient(180deg, rgba(15,23,42,0.66), rgba(2,6,23,0.34))',
                  }}
                >
                  <div className="absolute inset-0 grid-pattern opacity-30" />
                  <div
                    className="absolute inset-x-3 bottom-4 h-24 rounded-[2rem] blur-2xl"
                    style={{ background: `linear-gradient(90deg, ${colors.primary}22, ${podiumAccent[1]}33, ${colors.accent}22)` }}
                  />

                  <div className="relative z-10 grid min-h-[19rem] grid-cols-3 items-end gap-2 sm:min-h-[21rem] sm:gap-3">
                    {podiumSlots.map((player, index) => {
                      const place = player?.rango || (index === 0 ? 2 : index === 1 ? 1 : 3);
                      const me = user?.idUsuario === player?.idUsuario;
                      const league = leagueFor(player?.xp || 0);
                      const isChampion = place === 1;

                      return (
                        <motion.div
                          key={player?.idUsuario || `podio-vacio-${place}`}
                          initial={{ opacity: 0, y: 24, scale: 0.94 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.1 + index * 0.08, type: 'spring', stiffness: 250, damping: 20 }}
                          className="flex min-w-0 flex-col items-center"
                        >
                          <div className="relative mb-2 flex min-h-[7.6rem] w-full flex-col items-center justify-end">
                            {isChampion && (
                              <motion.div
                                animate={{ y: [-2, 2, -2], rotate: [-3, 3, -3] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute top-0"
                              >
                                <Crown className="h-8 w-8 text-yellow-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.8)]" />
                              </motion.div>
                            )}

                            <div
                              className={`relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${podiumGradient[place]} ${league.ring} sm:h-16 sm:w-16`}
                              style={{
                                boxShadow: `0 18px 42px -24px ${podiumAccent[place]}`,
                              }}
                            >
                              {player ? (
                                <motion.div
                                  animate={isChampion ? { y: [0, -4, 0] } : { y: [0, -2, 0] }}
                                  transition={{ duration: isChampion ? 2.6 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                  <DagonMascot size="small" mood={isChampion ? 'excited' : 'happy'} />
                                </motion.div>
                              ) : (
                                <Medal className="h-6 w-6 text-white/70" />
                              )}

                              <span
                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border px-2 py-0.5 text-[10px] font-black"
                                style={{
                                  color: isLight ? '#1f2937' : '#fff7ed',
                                  borderColor: `${podiumAccent[place]}66`,
                                  backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.86)',
                                }}
                              >
                                #{place}
                              </span>
                            </div>

                            {me && (
                              <span className="mt-3 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white" style={{ backgroundColor: colors.primary }}>
                                Tú
                              </span>
                            )}
                          </div>

                          <div className="mb-2 min-h-[3.7rem] w-full text-center">
                            <p className="truncate font-display text-sm font-black sm:text-base" style={{ color: player ? headingColor : mutedColor }}>
                              {player?.nombre || 'Pendiente'}
                            </p>
                            <p className={`mt-1 truncate text-[10px] font-black uppercase tracking-widest ${league.text}`}>
                              {player ? `Liga ${league.name}` : 'Sin registro'}
                            </p>
                            <p className="mt-1 truncate font-mono text-[11px] font-bold" style={{ color: isChampion ? podiumAccent[1] : mutedColor }}>
                              {player ? `${formatNumber(player.xp)} XP` : '-'}
                            </p>
                          </div>

                          <div className={`relative flex w-full ${podiumHeight[place]} items-start justify-center overflow-hidden rounded-t-3xl border px-2 pt-4`} style={podiumStepStyle(place)}>
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)] opacity-80" />
                            <div className="absolute inset-x-2 top-2 h-px bg-white/35" />
                            <div className="relative z-10 text-center">
                              <p className="font-display text-3xl font-black leading-none sm:text-4xl" style={{ color: isLight ? '#1f2937' : '#fff7ed' }}>
                                {place}
                              </p>
                              <p className="mt-1 hidden text-[9px] font-black uppercase tracking-[0.24em] sm:block" style={{ color: isLight ? '#374151' : '#e5e7eb' }}>
                                lugar
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="relative z-10 mt-3 grid grid-cols-2 gap-2 rounded-2xl border p-3" style={{ backgroundColor: surfaceColor, borderColor }}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: mutedColor }}>Campeón</p>
                      <p className="truncate font-display text-sm font-black" style={{ color: headingColor }}>{leader.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: mutedColor }}>Liga</p>
                      <p className={`truncate font-display text-sm font-black ${leaderLeague.text}`}>{leaderLeague.name}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 mt-4 rounded-3xl border border-dashed p-5 text-sm font-gameui" style={{ borderColor, color: mutedColor }}>
                  Todavía no hay aventureros en el ranking.
                </div>
              )}
            </motion.section>

            <MpiAnalyticsPanel
              analytics={mpiAnalytics}
              loading={mpiLoading}
              onRefresh={fetchMpiAnalytics}
              colors={colors}
              isLight={isLight}
              headingColor={headingColor}
              mutedColor={mutedColor}
              borderColor={borderColor}
              surfaceColor={surfaceColor}
            />
          </div>

          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 220, damping: 24 }}
            className="glass-card-apple dagon-compact-card relative flex min-h-0 flex-col overflow-hidden rounded-3xl border p-4 sm:p-5 xl:h-[calc(100vh-13.25rem)]"
            style={{ borderColor: colors.border }}
          >
            <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: isLight ? 'rgba(251,146,60,0.12)' : 'rgba(217,70,239,0.10)' }} />
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }} />

            <div className="relative z-10 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: colors.accent }}>
                  Tabla completa
                </p>
                <h2 className="font-display text-xl font-black" style={{ color: headingColor }}>
                  Ranking global
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: mutedColor, borderColor, backgroundColor: surfaceColor }}>
                  {formatNumber(totalUsers)} usuarios
                </span>
                <span className="rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: isLight ? '#d97706' : '#fde047', borderColor: isLight ? 'rgba(217,119,6,0.28)' : 'rgba(250,204,21,0.28)', backgroundColor: surfaceColor }}>
                  Máximo {formatNumber(maxXP)} XP
                </span>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-[58px_1fr_auto] gap-2 border-b px-2 pb-2 text-[10px] font-black uppercase tracking-[0.22em] sm:grid-cols-[72px_1fr_118px_118px_104px]" style={{ borderColor, color: mutedColor }}>
              <div className="text-center">Rango</div>
              <div>Aventurero</div>
              <div className="hidden sm:block">Liga</div>
              <div className="hidden text-right sm:block">Misiones</div>
              <div className="text-right">XP</div>
            </div>

            {leaderboardData.length === 0 ? (
              <div className="relative z-10 grid flex-1 place-items-center rounded-3xl border border-dashed p-8 text-center font-gameui" style={{ borderColor, color: mutedColor }}>
                Aún no hay aventureros en la base de datos.
              </div>
            ) : (
              <div className="relative z-10 mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                <ul className="space-y-2">
                  {leaderboardData.map((player, index) => {
                    const me = user?.idUsuario === player.idUsuario;
                    const league = leagueFor(player.xp);
                    const xpPct = Math.max(7, (toNumber(player.xp) / maxXP) * 100);
                    const missionPct = Math.max(6, (toNumber(player.misionesResueltas) / maxMissions) * 100);
                    const placeColor = player.rango === 1 ? '#facc15' : player.rango === 2 ? '#cbd5e1' : player.rango === 3 ? '#f59e0b' : colors.primary;
                    return (
                      <motion.li
                        key={player.idUsuario}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.025, 0.35) }}
                        whileHover={{ y: -2 }}
                        className="relative grid grid-cols-[58px_1fr_auto] items-center gap-2 overflow-hidden rounded-2xl border px-2 py-2.5 sm:grid-cols-[72px_1fr_118px_118px_104px] sm:px-3"
                        style={{
                          backgroundColor: me ? `${colors.primary}16` : surfaceColor,
                          borderColor: me ? `${colors.primary}66` : borderColor,
                          boxShadow: me ? `0 18px 42px -30px ${colors.primary}` : undefined,
                        }}
                      >
                        <div className="absolute inset-y-0 left-0 opacity-10 pointer-events-none" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />

                        <div className="relative z-10 flex justify-center">
                          <div
                            className="grid h-10 w-10 place-items-center rounded-xl border font-display text-sm font-black"
                            style={{ backgroundColor: colors.background, borderColor: `${placeColor}55`, color: player.rango <= 3 ? placeColor : headingColor }}
                          >
                            {player.rango <= 3 ? <Medal className="h-5 w-5" /> : `#${player.rango}`}
                          </div>
                        </div>

                        <div className="relative z-10 min-w-0 px-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="block truncate font-display font-black" style={{ color: me ? colors.primary : headingColor }}>
                              {player.nombre}
                            </span>
                            {me && (
                              <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white" style={{ backgroundColor: colors.primary }}>
                                Tú
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: isLight ? 'rgba(146,64,14,0.10)' : 'rgba(255,255,255,0.08)' }}>
                              <div className="h-full rounded-full" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})` }} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider sm:hidden ${league.text}`}>
                              {league.name}
                            </span>
                          </div>
                        </div>

                        <div className="relative z-10 hidden sm:block">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${league.text}`} style={{ borderColor: isLight ? 'rgba(217,119,6,0.16)' : 'rgba(255,255,255,0.10)', backgroundColor: isLight ? 'rgba(255,255,255,0.44)' : 'rgba(255,255,255,0.04)' }}>
                            {league.name}
                          </span>
                        </div>

                        <div className="relative z-10 hidden min-w-0 items-center justify-end gap-2 sm:flex">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full" style={{ backgroundColor: isLight ? 'rgba(146,64,14,0.10)' : 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full" style={{ width: `${missionPct}%`, backgroundColor: isLight ? '#d97706' : '#fde047' }} />
                          </div>
                          <span className="font-mono text-sm font-bold" style={{ color: mutedColor }}>
                            {formatNumber(player.misionesResueltas)}
                          </span>
                        </div>

                        <div className="relative z-10 flex items-center justify-end gap-1.5">
                          <span className="font-display text-lg font-black" style={{ color: me ? colors.primary : headingColor }}>
                            {formatNumber(player.xp)}
                          </span>
                          <Zap className="h-4 w-4 shrink-0" style={{ color: me ? colors.primary : (isLight ? '#d97706' : '#fde047') }} />
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};
