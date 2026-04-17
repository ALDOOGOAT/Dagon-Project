import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DagonMascot } from '../components/DagonMascot';
import { ArrowLeft, Flame, Trophy, Calendar, Sparkles, Target } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const MILESTONES = [
  { days: 3,  label: '3 días',  reward: 'Racha de Fuego',     icon: Flame },
  { days: 7,  label: '1 semana', reward: 'Semana Imparable',   icon: Trophy },
  { days: 14, label: '2 semanas', reward: 'Guerrero Constante', icon: Target },
  { days: 30, label: '1 mes',   reward: 'Leyenda del Abismo',  icon: Sparkles },
];

export const StreakPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ racha: 0, mejor_racha: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreakStats = async () => {
      if (!user?.idUsuario) return;
      try {
        const response = await fetch(`http://localhost:8080/api/usuarios/${user.idUsuario}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) setStats(data);
      } catch (error) {
        toast.error('Error al cargar tu racha');
      } finally {
        setLoading(false);
      }
    };
    fetchStreakStats();
  }, [user, token]);

  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const today = new Date().getDay();
  const currentDayIndex = today === 0 ? 6 : today - 1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Flame className="w-12 h-12 text-orange-400 animate-pulse" />
          <p className="text-orange-300 font-bold tracking-[0.4em] uppercase text-xs">Despertando el fuego...</p>
        </div>
      </div>
    );
  }

  const nextMilestone = MILESTONES.find(m => m.days > stats.racha) || MILESTONES[MILESTONES.length - 1];
  const msProgress = nextMilestone ? Math.min(100, (stats.racha / nextMilestone.days) * 100) : 100;

  return (
    <div className="min-h-screen" data-testid="streak-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <div className="flex items-center mb-6">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver
          </Button>
        </div>

        {/* HERO: llama + contador */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-apple rounded-3xl p-8 lg:p-12 border border-white/10 holo-border relative overflow-hidden mb-8 text-center"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Mascota con aura de fuego */}
            <div className="relative inline-block mb-6">
              {stats.racha > 0 && (
                <motion.div
                  className="absolute -inset-10 rounded-full bg-gradient-to-t from-rose-600/40 via-orange-500/30 to-yellow-400/20 blur-3xl"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <motion.div
                animate={stats.racha > 0 ? { y: [-4, 4, -4] } : {}}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <DagonMascot size="large" mood={stats.racha > 0 ? "excited" : "sad"} />
              </motion.div>
            </div>

            {/* Número grande */}
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <h1 className="font-display text-[120px] lg:text-[160px] font-black leading-none text-gradient-fire drop-shadow-[0_5px_20px_rgba(239,68,68,0.3)]">
                {stats.racha}
              </h1>
              <p className="font-display text-2xl lg:text-3xl font-black uppercase tracking-[0.3em] text-orange-300 mt-1">
                Días de racha
              </p>
            </motion.div>

            <p className="text-slate-300 mt-6 text-lg max-w-md mx-auto font-gameui">
              {stats.racha > 0
                ? "¡Dagon está imparable! Vuelve mañana para alimentar la bestia."
                : "El fuego se ha apagado. ¡Completa una misión hoy para despertar a Dagon!"}
            </p>
          </div>
        </motion.div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Récord */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card-apple rounded-3xl p-6 border border-white/10 relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/30 to-amber-600/20 border border-yellow-400/40 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tu récord</p>
                  <p className="font-display text-4xl font-black text-white leading-none">{stats.mejor_racha}</p>
                </div>
              </div>
              <p className="text-slate-500 text-xs font-gameui">Mejor racha registrada</p>
            </div>
          </motion.div>

          {/* Calendario semana */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card-apple rounded-3xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Esta semana</span>
            </div>
            <div className="flex justify-between gap-1">
              {weekDays.map((day, index) => {
                const isLit = index <= currentDayIndex && index > (currentDayIndex - stats.racha);
                const isToday = index === currentDayIndex;
                return (
                  <motion.div
                    key={index}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.06 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
                      isLit
                        ? 'bg-gradient-to-b from-orange-400 to-rose-600 border-orange-300 text-white shadow-[0_0_15px_rgba(249,115,22,0.6)]'
                        : isToday
                          ? 'bg-slate-800 border-slate-500 text-slate-400'
                          : 'bg-slate-900/50 border-white/5 text-slate-600'
                    }`}>
                      {isLit && <Flame className="w-4 h-4 drop-shadow-md" />}
                      {isToday && (
                        <span className="absolute -bottom-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                      )}
                    </div>
                    <span className={`text-[10px] font-black ${isToday ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Próximo milestone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card-apple rounded-3xl p-6 border border-white/10 relative overflow-hidden"
          >
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-fuchsia-300" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Próximo logro</span>
              </div>
              <p className="font-display font-black text-white text-lg mb-1">{nextMilestone.reward}</p>
              <p className="text-slate-400 text-xs font-gameui mb-3">Meta: {nextMilestone.label} consecutivos</p>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${msProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                />
              </div>
              <p className="text-slate-500 text-[10px] font-gameui mt-2">
                {stats.racha}/{nextMilestone.days} días ({Math.round(msProgress)}%)
              </p>
            </div>
          </motion.div>
        </div>

        {/* MILESTONES ROAD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10"
        >
          <h2 className="font-display text-xl font-black text-white mb-6 uppercase tracking-wide flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" /> Hitos de racha
          </h2>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scroll-fancy">
            {MILESTONES.map((m, i) => {
              const reached = stats.mejor_racha >= m.days;
              const Icon = m.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className={`flex-shrink-0 w-40 p-4 rounded-2xl border text-center transition-all ${
                    reached
                      ? 'glass-card-apple border-emerald-400/40 shadow-[0_0_20px_rgba(74,222,128,0.15)]'
                      : 'bg-slate-900/40 border-white/5 opacity-60 grayscale'
                  }`}
                >
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${
                    reached ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-display font-black text-sm text-white mb-1">{m.label}</p>
                  <p className="text-[10px] text-slate-400 font-gameui">{m.reward}</p>
                  {reached && (
                    <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                      Logrado
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
