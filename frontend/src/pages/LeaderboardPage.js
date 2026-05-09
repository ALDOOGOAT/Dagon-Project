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

const API_BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '';
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
      ? { label: 'Online', icon: Wifi, color: isLight ? '#15803d' : '#86efac' }
      : { label: 'Offline', icon: WifiOff, color: isLight ? '#b45309' : '#fbbf24' };
  const StatusIcon = status.icon;
  const maxRankUsers = Math.max(1, ...ranks.map((rank) => toNumber(rank.usuarios)));
  const totalUsuarios = toNumber(totales.usuarios, analytics?.ranking_count || 0);
  const procesos = toNumber(mpi.procesos, ranks.length);
  const wallMs = toNumber(resultado.wall_ms);
  const proxyMs = toNumber(analytics?.proxy_ms);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-apple rounded-3xl p-5 sm:p-6 lg:p-8 border mb-8 relative overflow-hidden"
      style={{ borderColor }}
      aria-label="Analytics MPI del ranking"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${colors.primary}, ${isLight ? '#d97706' : '#fde047'}, ${colors.accent})`
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase mb-2" style={{ color: colors.accent }}>
            Analytics distribuido
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-black flex items-center gap-3" style={{ color: headingColor }}>
            <Cpu className="w-7 h-7 shrink-0" style={{ color: colors.primary }} />
            Motor MPI del ranking
          </h2>
          <p className="mt-2 text-sm sm:text-base max-w-3xl" style={{ color: mutedColor }}>
            El backend toma el ranking actual y lo procesa con ranks MPI para calcular metricas paralelas sin bloquear la clasificacion.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="h-11 px-4 rounded-2xl border flex items-center gap-2 font-bold text-sm"
            style={{ backgroundColor: surfaceColor, borderColor, color: status.color }}
          >
            <StatusIcon className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
            {status.label}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="h-11 rounded-2xl"
            style={{ borderColor, color: headingColor }}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Usuarios analizados', value: formatNumber(totalUsuarios), icon: Database },
          { label: 'Procesos MPI', value: procesos ? formatNumber(procesos) : 'Pendiente', icon: Cpu },
          { label: 'Tiempo MPI', value: formatMs(wallMs), icon: Clock },
          { label: 'Proxy backend', value: formatMs(proxyMs), icon: Server },
        ].map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <div
              key={metric.label}
              className="rounded-2xl border p-4 min-w-0"
              style={{ backgroundColor: surfaceColor, borderColor }}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase" style={{ color: mutedColor }}>
                <MetricIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{metric.label}</span>
              </div>
              <p className="font-display text-xl sm:text-2xl font-black mt-2 break-words" style={{ color: headingColor }}>
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mt-6 grid lg:grid-cols-[1.25fr_0.75fr] gap-5">
        <div className="rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: surfaceColor, borderColor }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display text-lg font-black" style={{ color: headingColor }}>Ranks en ejecucion</h3>
              <p className="text-sm" style={{ color: mutedColor }}>Scatter, compute y reduce sobre el ranking actual.</p>
            </div>
            <GitBranch className="w-5 h-5 shrink-0" style={{ color: colors.primary }} />
          </div>

          {ranks.length > 0 ? (
            <div className="space-y-3">
              {ranks.map((rank) => {
                const usuarios = toNumber(rank.usuarios);
                const pct = Math.max(6, (usuarios / maxRankUsers) * 100);
                return (
                  <div key={rank.rank} className="grid grid-cols-[64px_1fr] sm:grid-cols-[72px_1fr_auto] gap-2 sm:gap-3 items-center">
                    <span className="font-mono text-sm font-bold" style={{ color: headingColor }}>
                      Rank {rank.rank}
                    </span>
                    <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? 'rgba(146,64,14,0.12)' : 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs text-right col-span-2 sm:col-span-1" style={{ color: mutedColor }}>
                      {formatNumber(usuarios)} usr / {formatMs(rank.elapsed_ms)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-5" style={{ borderColor, color: mutedColor }}>
              {loading ? 'Esperando respuesta de los procesos MPI...' : analytics?.error || 'MPI no ha entregado metricas todavia.'}
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: surfaceColor, borderColor }}>
          <h3 className="font-display text-lg font-black mb-4" style={{ color: headingColor }}>Resumen paralelo</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: mutedColor }}>XP promedio</span>
              <span className="font-display font-black" style={{ color: headingColor }}>{formatNumber(promedios.xp)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: mutedColor }}>Misiones promedio</span>
              <span className="font-display font-black" style={{ color: headingColor }}>{formatNumber(promedios.misiones)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: mutedColor }}>XP maximo</span>
              <span className="font-display font-black" style={{ color: headingColor }}>{formatNumber(totales.xp_max)}</span>
            </div>
          </div>

          {distribucion.length > 0 && (
            <div className="mt-5 pt-4 border-t space-y-2" style={{ borderColor }}>
              {distribucion.map(([titulo, cuenta]) => (
                <div key={titulo} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate" style={{ color: mutedColor }}>{titulo}</span>
                  <span className="font-mono font-bold" style={{ color: headingColor }}>{formatNumber(cuenta)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap gap-2">
        {pipeline.map((step, index) => (
          <span
            key={`${step}-${index}`}
            className="inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono break-all"
            style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.05)', borderColor, color: mutedColor }}
          >
            <span className="font-bold" style={{ color: colors.primary }}>{index + 1}</span>
            {step}
          </span>
        ))}
      </div>
    </motion.section>
  );
};

export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { colors } = useTheme();
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
      const response = await fetch(`${API_BASE}/api/analytics/mpi`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMpiAnalytics(await response.json());
      } else {
        setMpiAnalytics({
          ok: false,
          estado: 'offline',
          error: 'El backend no pudo consultar el servicio MPI.'
        });
      }
    } catch (error) {
      console.error("Error fetching MPI analytics:", error);
      setMpiAnalytics({
        ok: false,
        estado: 'offline',
        error: 'No se pudo conectar con analytics MPI.'
      });
    } finally {
      setMpiLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/leaderboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setLeaderboardData(await response.json());
        else toast.error("Error al cargar el Salón de la Fama");
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        toast.error("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchLeaderboard();
      fetchMpiAnalytics();
    }
  }, [token, fetchMpiAnalytics]);

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
  const rest = leaderboardData.slice(3);
  const maxXP = leaderboardData[0]?.xp || 1;

  // Reorder podium: [2°, 1°, 3°]
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeight = { 1: 'h-40', 2: 'h-28', 3: 'h-20' };
  const podiumGradient = {
    1: 'from-yellow-400 to-amber-700',
    2: 'from-slate-300 to-slate-600',
    3: 'from-amber-700 to-orange-900',
  };

  return (
    <div className="min-h-screen py-10" data-testid="leaderboard-page">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ color: mutedColor }}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver
          </Button>
          <div className="h-8 w-px" style={{ backgroundColor: isLight ? 'rgba(217,119,6,0.18)' : 'rgba(255,255,255,0.10)' }} />
          <div>
            <p className="text-xs font-bold tracking-[0.4em] uppercase mb-1" style={{ color: colors.accent }}>Hall of Fame</p>
            <h1 className="font-display text-4xl font-black flex items-center gap-3" style={{ color: headingColor }}>
              <Trophy className="w-8 h-8" style={{ color: isLight ? '#d97706' : '#fde047' }} />
              Salón de la Fama
            </h1>
          </div>
        </div>

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

        {/* PODIUM */}
        {top3.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card-apple rounded-3xl p-6 lg:p-10 border mb-8 holo-border relative overflow-hidden"
            style={{ borderColor: colors.border }}
          >
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: isLight ? 'rgba(250,204,21,0.16)' : 'rgba(234,179,8,0.10)' }} />

            <div className="relative z-10">
              <p className="text-center text-xs font-bold tracking-[0.4em] uppercase mb-2" style={{ color: isLight ? '#d97706' : '#fde047' }}>
                Top 3 del abismo
              </p>
              <h2 className="font-display text-3xl font-black text-center mb-10 flex items-center justify-center gap-2" style={{ color: headingColor }}>
                <Sparkles className="w-5 h-5" style={{ color: isLight ? '#d97706' : '#fde047' }} />
                Los más profundos
                <Sparkles className="w-5 h-5" style={{ color: isLight ? '#d97706' : '#fde047' }} />
              </h2>

              <div className="grid grid-cols-3 gap-4 items-end">
                {podiumOrder.map((p) => {
                  if (!p) return <div key="empty" />;
                  const place = p.rango;
                  const me = user?.idUsuario === p.idUsuario;
                  const lg = leagueFor(p.xp);
                  return (
                    <motion.div
                      key={p.idUsuario}
                      initial={{ y: 80, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + (3 - place) * 0.15, type: 'spring', stiffness: 80 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative mb-3">
                        {place === 1 && (
                          <div className="absolute left-1/2 -translate-x-1/2 -top-9">
                            <Crown className="w-9 h-9 text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.7)] animate-badge-pulse" />
                          </div>
                        )}
                        <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${podiumGradient[place]} ${lg.ring} flex items-center justify-center`}>
                          <DagonMascot size="small" mood={place === 1 ? 'excited' : 'happy'} />
                        </div>
                        {me && (
                          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                            Tú
                          </span>
                        )}
                      </div>
                      <p className="font-display font-black text-center truncate max-w-[140px]" style={{ color: headingColor }}>
                        {p.nombre}
                      </p>
                      <p className={`font-display font-black text-2xl ${
                        place === 1 ? 'text-yellow-300' : place === 2 ? 'text-slate-200' : 'text-amber-400'
                      } flex items-center gap-1`}>
                        {p.xp}<Zap className="w-4 h-4" />
                      </p>
                      <span className={`mt-1 text-[10px] font-bold tracking-widest uppercase ${lg.text}`}>
                        Liga {lg.name}
                      </span>

                      <div className={`mt-3 w-full ${podiumHeight[place]} rounded-t-2xl bg-gradient-to-b ${podiumGradient[place]} flex items-start justify-center pt-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.3),0_15px_40px_rgba(0,0,0,0.4)] border-t border-white/30`}>
                        <span className="font-display font-black text-3xl text-white/90 drop-shadow-md">{place}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* LISTA REST */}
        <div className="glass-card-apple rounded-3xl p-6 lg:p-8 border relative overflow-hidden" style={{ borderColor: colors.border }}>
          <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: isLight ? 'rgba(251,146,60,0.12)' : 'rgba(217,70,239,0.10)' }} />

          <div className="flex justify-between items-center px-3 sm:px-4 py-3 mb-3 border-b text-[10px] font-bold uppercase tracking-[0.24em] sm:tracking-[0.3em]" style={{ borderColor: isLight ? 'rgba(217,119,6,0.10)' : 'rgba(255,255,255,0.05)', color: mutedColor }}>
            <div className="w-12 sm:w-16 text-center">Rango</div>
            <div className="flex-1 min-w-0">Aventurero</div>
            <div className="w-32 hidden md:block">Liga</div>
            <div className="w-32 text-right hidden sm:flex justify-end items-center gap-1">
              <Target className="w-3 h-3" /> Misiones
            </div>
            <div className="w-auto sm:w-32 text-right">XP</div>
          </div>

          {leaderboardData.length === 0 ? (
            <p className="text-center py-10 italic font-gameui" style={{ color: mutedColor }}>Aún no hay aventureros en la base de datos.</p>
          ) : (
            <ul className="space-y-2">
              {(top3.length === 0 ? leaderboardData : rest).map((p, i) => {
                const me = user?.idUsuario === p.idUsuario;
                const lg = leagueFor(p.xp);
                const xpPct = Math.max(8, (p.xp / maxXP) * 100);
                return (
                  <motion.li
                    key={p.idUsuario}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
className={`relative flex items-center px-4 py-3 rounded-2xl border transition-all overflow-hidden ${
                      me
                        ? 'border'
                        : 'border-white/5'
                    }`}
                    style={{
                      backgroundColor: me ? `${colors.primary}15` : surfaceColor,
                      borderColor: me ? `${colors.primary}50` : borderColor
                    }}
                  >
                    {/* XP fill backdrop */}
                    <div
                      className="absolute inset-y-0 left-0 opacity-10 pointer-events-none"
                      style={{ width: `${xpPct}%`, backgroundColor: colors.primary }}
                    />
                    <div className="relative z-10 w-12 sm:w-16 flex justify-center shrink-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border font-display font-black text-sm sm:text-base" style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}>
                        {p.rango <= 3 ? <Medal className={`w-5 h-5 ${
                          p.rango === 1 ? 'text-yellow-300' :
                          p.rango === 2 ? 'text-slate-200' : 'text-amber-500'
                        }`} /> : `#${p.rango}`}
                      </div>
                    </div>
                    <div className="relative z-10 flex-1 flex items-center gap-3 px-2 sm:px-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-display font-black truncate block" style={{ color: me ? colors.primary : headingColor }}>
                            {p.nombre}
                          </span>
                          {me && (
                            <span className="text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0" style={{ backgroundColor: colors.primary }}>
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide md:hidden">
                          <span className={lg.text}>Liga {lg.name}</span>
                          <span style={{ color: mutedColor }}>{p.misionesResueltas} misiones</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 w-32 hidden md:flex">
                      <span className={`text-xs font-bold tracking-widest uppercase ${lg.text}`}>{lg.name}</span>
                    </div>
                    <div className="relative z-10 w-32 text-right hidden sm:flex items-center justify-end gap-2 font-mono" style={{ color: mutedColor }}>
                      <Target className="w-4 h-4" style={{ color: mutedColor }} />
                      {p.misionesResueltas}
                    </div>
                    <div className="relative z-10 w-auto sm:w-32 text-right flex items-center justify-end gap-1 sm:gap-2 shrink-0">
                      <span className="font-display font-black text-lg sm:text-xl" style={{ color: me ? colors.primary : headingColor }}>
                        {p.xp}
                      </span>
                      <Zap className="w-4 h-4" style={{ color: me ? colors.primary : (isLight ? '#d97706' : '#fde047') }} />
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
