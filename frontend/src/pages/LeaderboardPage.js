import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { ArrowLeft, Trophy, Medal, Zap, Target, Crown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { DagonMascot } from '../components/DagonMascot';

const leagueFor = (xp) => {
  if (xp >= 2000) return { name: 'Abismo', color: 'from-fuchsia-500 to-indigo-700', text: 'text-fuchsia-200', ring: 'ring-tier-abyss' };
  if (xp >= 1000) return { name: 'Oro',    color: 'from-yellow-300 to-amber-600',   text: 'text-yellow-200', ring: 'ring-tier-gold' };
  if (xp >= 500)  return { name: 'Plata',  color: 'from-slate-200 to-slate-500',    text: 'text-slate-200',  ring: 'ring-tier-silver' };
  return { name: 'Bronce', color: 'from-amber-700 to-orange-900', text: 'text-amber-200', ring: 'ring-tier-bronze' };
};

export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('${process.env.REACT_APP_API_URL}/api/leaderboard', {
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
    if (token) fetchLeaderboard();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Trophy className="w-12 h-12 text-yellow-400 animate-pulse" />
          <p className="text-cyan-300 font-bold tracking-[0.4em] uppercase text-xs">Forjando la clasificación...</p>
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
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver
          </Button>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <p className="text-cyan-300 text-xs font-bold tracking-[0.4em] uppercase mb-1">Hall of Fame</p>
            <h1 className="font-display text-4xl font-black text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-300" />
              Salón de la Fama
            </h1>
          </div>
        </div>

        {/* PODIUM */}
        {top3.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card-apple rounded-3xl p-6 lg:p-10 border border-white/10 mb-8 holo-border relative overflow-hidden"
          >
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <p className="text-center text-yellow-300 text-xs font-bold tracking-[0.4em] uppercase mb-2">
                Top 3 del abismo
              </p>
              <h2 className="font-display text-3xl font-black text-white text-center mb-10 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                Los más profundos
                <Sparkles className="w-5 h-5 text-yellow-300" />
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
                      <p className="font-display font-black text-white text-center truncate max-w-[140px]">
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
        <div className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 relative overflow-hidden">
          <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />

          <div className="flex justify-between items-center px-4 py-3 mb-3 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            <div className="w-16 text-center">Rango</div>
            <div className="flex-1">Aventurero</div>
            <div className="w-32 hidden md:block">Liga</div>
            <div className="w-32 text-right hidden sm:flex justify-end items-center gap-1">
              <Target className="w-3 h-3" /> Misiones
            </div>
            <div className="w-32 text-right">Puntos XP</div>
          </div>

          {leaderboardData.length === 0 ? (
            <p className="text-center text-slate-500 py-10 italic font-gameui">Aún no hay aventureros en la base de datos.</p>
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
                        ? 'bg-blue-500/10 border-blue-400/40 shadow-[inset_0_0_25px_rgba(59,130,246,0.15)]'
                        : 'bg-slate-900/40 border-white/5 hover:border-cyan-400/30 hover:bg-slate-900/70'
                    }`}
                  >
                    {/* XP fill backdrop */}
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${lg.color} opacity-10 pointer-events-none`}
                      style={{ width: `${xpPct}%` }}
                    />
                    <div className="relative z-10 w-16 flex justify-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 font-display font-black text-slate-300">
                        {p.rango <= 3 ? <Medal className={`w-5 h-5 ${
                          p.rango === 1 ? 'text-yellow-300' :
                          p.rango === 2 ? 'text-slate-200' : 'text-amber-500'
                        }`} /> : `#${p.rango}`}
                      </div>
                    </div>
                    <div className="relative z-10 flex-1 flex items-center gap-3 px-3 min-w-0">
                      <span className={`font-display font-black truncate ${me ? 'text-blue-200' : 'text-white'}`}>
                        {p.nombre}
                      </span>
                      {me && (
                        <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                          Tú
                        </span>
                      )}
                    </div>
                    <div className="relative z-10 w-32 hidden md:flex">
                      <span className={`text-xs font-bold tracking-widest uppercase ${lg.text}`}>{lg.name}</span>
                    </div>
                    <div className="relative z-10 w-32 text-right hidden sm:flex items-center justify-end gap-2 text-slate-400 font-mono">
                      <Target className="w-4 h-4 text-slate-500" />
                      {p.misionesResueltas}
                    </div>
                    <div className="relative z-10 w-32 text-right flex items-center justify-end gap-2">
                      <span className={`font-display font-black text-xl ${me ? 'text-blue-200' : 'text-white'}`}>
                        {p.xp}
                      </span>
                      <Zap className={`w-4 h-4 ${me ? 'text-blue-300' : 'text-yellow-300'}`} />
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
