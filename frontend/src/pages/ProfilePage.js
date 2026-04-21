import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DagonMascot } from '../components/DagonMascot';
import {
  ArrowLeft, BookOpen, Code, Flame, Trophy, Target, Award, BarChart3,
  Sparkles, Crown, Shield, Zap, Camera, Upload,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const TITLES = [
  { min: 0,    name: 'Novato del SELECT',     tier: 'bronze' },
  { min: 100,  name: 'Explorador de Tablas',  tier: 'bronze' },
  { min: 300,  name: 'Guerrero de los JOINs', tier: 'silver' },
  { min: 600,  name: 'Caballero de Datos',    tier: 'silver' },
  { min: 1000, name: 'Maestro Arquitecto SQL', tier: 'gold' },
  { min: 2000, name: 'Señor del Abismo',      tier: 'abyss' },
];
const titleFor = (xp) => [...TITLES].reverse().find((t) => xp >= t.min) || TITLES[0];

const tierGradient = (tier) => ({
  bronze: 'from-amber-700 to-orange-900',
  silver: 'from-slate-200 to-slate-500',
  gold:   'from-yellow-300 to-amber-600',
  abyss:  'from-fuchsia-500 via-indigo-600 to-blue-700',
}[tier] || 'from-amber-700 to-orange-900');

const tierRing = (tier) => ({
  bronze: 'ring-tier-bronze',
  silver: 'ring-tier-silver',
  gold:   'ring-tier-gold',
  abyss:  'ring-tier-abyss',
}[tier] || 'ring-tier-bronze');

const getDifficultyStyles = (level) => ({
  1: { name: 'Básico',     color: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/40' },
  2: { name: 'Intermedio', color: 'bg-blue-500',    text: 'text-blue-400',    glow: 'shadow-blue-500/40' },
  3: { name: 'Avanzado',   color: 'bg-purple-500',  text: 'text-purple-400',  glow: 'shadow-purple-500/40' },
  4: { name: 'Experto',    color: 'bg-orange-500',  text: 'text-orange-400',  glow: 'shadow-orange-500/40' },
  5: { name: 'Maestro',    color: 'bg-rose-500',    text: 'text-rose-400',    glow: 'shadow-rose-500/40' },
}[level] || { name: `Nivel ${level}`, color: 'bg-slate-500', text: 'text-slate-400', glow: '' });

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    xp: 0, ejercicios_completados: 0, consultas_totales: 0,
    racha: 0, mejor_racha: 0, distribucion_xp: []
  });
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const userLevel = Math.floor(stats.xp / 100) + 1;
  const xpInLevel = stats.xp % 100;
  const title = titleFor(stats.xp);

  const profileMood = useMemo(() => {
    if (loading) return 'thinking';
    if (stats.xp >= 2000) return 'celebrating';
    if (stats.xp >= 1000) return 'excited';
    if (stats.ejercicios_completados >= 50) return 'excited';
    if (stats.racha >= 3) return 'happy';
    if (stats.racha > 0) return 'determined';
    return 'sad';
  }, [loading, stats]);

  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!user?.idUsuario) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/${user.idUsuario}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) setStats(data);
      } catch (error) {
        toast.error('Error al cargar las estadísticas del perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileStats();

    const fetchAvatar = async () => {
      if (!user?.idUsuario) return;
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/${user.idUsuario}/foto`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.fotoUrl) {
          const fullUrl = data.fotoUrl.startsWith('http') ? data.fotoUrl : '${process.env.REACT_APP_API_URL}' + data.fotoUrl;
          setAvatarUrl(fullUrl);
        }
      } catch (e) {}
    };
    fetchAvatar();
  }, [user, token]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.idUsuario) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/${user.idUsuario}/foto`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const fullUrl = data.fotoUrl.startsWith('http') ? data.fotoUrl : '${process.env.REACT_APP_API_URL}' + data.fotoUrl;
        setAvatarUrl(fullUrl);
        toast.success('Foto de perfil actualizada!');
      }
    } catch (err) {
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const achievements = [
    {
      id: 'first_query', title: 'Primera Consulta', desc: 'Completaste tu primer ejercicio',
      icon: <Target className="w-6 h-6" />, xpReward: '+10 XP',
      unlocked: stats.ejercicios_completados >= 1,
      gradient: 'from-rose-500/30 to-rose-600/10', border: 'border-rose-500/40',
      iconColor: 'text-rose-400',
    },
    {
      id: 'streak_3', title: 'Racha de Fuego', desc: 'Mantén 3 días de racha',
      icon: <Flame className="w-6 h-6" />, xpReward: '+50 XP',
      unlocked: stats.racha >= 3 || stats.mejor_racha >= 3,
      gradient: 'from-orange-500/30 to-orange-600/10', border: 'border-orange-500/40',
      iconColor: 'text-orange-400',
    },
    {
      id: 'master_select', title: 'Maestro SELECT', desc: 'Alcanza 100 XP totales',
      icon: <BookOpen className="w-6 h-6" />, xpReward: '+100 XP',
      unlocked: stats.xp >= 100,
      gradient: 'from-blue-500/30 to-blue-600/10', border: 'border-blue-500/40',
      iconColor: 'text-blue-400',
    },
    {
      id: 'streak_7', title: 'Semana Imparable', desc: 'Mantén 7 días de racha',
      icon: <Shield className="w-6 h-6" />, xpReward: '+150 XP',
      unlocked: stats.mejor_racha >= 7,
      gradient: 'from-fuchsia-500/30 to-fuchsia-600/10', border: 'border-fuchsia-500/40',
      iconColor: 'text-fuchsia-400',
    },
    {
      id: 'xp_500', title: 'Medio Millar', desc: 'Acumula 500 XP',
      icon: <Crown className="w-6 h-6" />, xpReward: '+200 XP',
      unlocked: stats.xp >= 500,
      gradient: 'from-yellow-500/30 to-yellow-600/10', border: 'border-yellow-500/40',
      iconColor: 'text-yellow-400',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-cyan-500/10 blur-2xl animate-pulse" />
          <DagonMascot size="large" mood="thinking" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-44 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-shimmer-width" />
          </div>
          <p className="text-cyan-300/60 text-xs font-bold tracking-[0.4em] uppercase">Analizando tu poder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="profile-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="flex items-center mb-8">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver
          </Button>
          <div className="h-8 w-px bg-white/10 mx-4" />
          <p className="text-cyan-300 text-xs font-bold tracking-[0.4em] uppercase">Ficha de personaje</p>
        </div>

        {/* HERO: avatar + stats principales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 holo-border mb-8 relative overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-[auto_1fr_auto] gap-8 items-center">
            <div className="relative group">
              <div className={`absolute -inset-3 rounded-3xl ${tierRing(title.tier)}`} />
              <div className={`relative w-28 h-28 rounded-2xl bg-gradient-to-br ${tierGradient(title.tier)} flex items-center justify-center shadow-2xl overflow-hidden`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <DagonMascot size="medium" mood={profileMood} />
                )}
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </label>
              </div>
              <div className="absolute -bottom-3 -right-3 badge-shine text-yellow-950 text-xs font-display font-black px-3 py-1 rounded-lg border border-yellow-300 animate-badge-pulse">
                Lvl {userLevel}
              </div>
            </div>

            <div>
              <h1 className="font-display text-3xl lg:text-4xl font-black text-white mb-2">
                {user?.nombre || user?.email}
              </h1>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span className="font-gameui text-xs font-bold tracking-widest uppercase text-cyan-200">{title.name}</span>
                </span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  Tier <span className="text-slate-300">{title.tier}</span>
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-gameui">Progreso al nivel {userLevel + 1}</span>
                <span className="font-display font-black text-white text-sm">{xpInLevel}/100 XP</span>
              </div>
              <div className="relative w-full h-4 bg-slate-900/80 rounded-full border border-white/5 overflow-hidden xp-bar-shine">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInLevel}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 shadow-[0_0_20px_rgba(99,102,241,0.7)]"
                />
              </div>
            </div>

            <div className="text-right">
              <p className="font-display text-6xl font-black text-gradient-gold leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                {stats.xp}
              </p>
              <p className="text-slate-400 text-xs uppercase tracking-[0.4em] font-bold mt-2">XP totales</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* RESUMEN DE BATALLA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10"
            >
              <h2 className="font-display text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                <Target className="text-cyan-400" /> Resumen de batalla
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, label: 'Completados', value: stats.ejercicios_completados, color: 'text-emerald-400', hover: 'hover:border-emerald-500/30' },
                  { icon: <Code className="w-5 h-5" />, label: 'Consultas', value: stats.consultas_totales, color: 'text-blue-400', hover: 'hover:border-blue-500/30' },
                  { icon: <Flame className="w-5 h-5" />, label: 'Racha actual', value: stats.racha, color: 'text-orange-400', hover: 'hover:border-orange-500/30' },
                  { icon: <Trophy className="w-5 h-5" />, label: 'Mejor racha', value: stats.mejor_racha, color: 'text-yellow-400', hover: 'hover:border-yellow-500/30' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -3 }}
                    className={`flex items-center justify-between p-5 bg-slate-900/50 rounded-2xl border border-white/5 ${s.hover} transition-all`}
                  >
                    <div className={`flex items-center gap-3 font-display font-bold text-sm text-slate-200 ${s.color}`}>
                      {s.icon} <span className="text-slate-300">{s.label}</span>
                    </div>
                    <span className="font-display text-3xl font-black text-white">{s.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* DISTRIBUCIÓN XP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10"
            >
              <h2 className="font-display text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                <BarChart3 className="text-fuchsia-400" /> Origen del poder
              </h2>
              <div className="space-y-5">
                {stats.distribucion_xp && stats.distribucion_xp.length > 0 ? (
                  stats.distribucion_xp.map((item, index) => {
                    const style = getDifficultyStyles(item.dificultad);
                    const percent = stats.xp > 0 ? Math.round((item.xp_ganada / stats.xp) * 100) : 0;
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className={`font-display font-bold ${style.text}`}>{style.name}</span>
                          <span className="text-slate-300 font-display font-bold">
                            {item.xp_ganada} XP <span className="text-slate-600">({percent}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                            className={`h-full ${style.color} shadow-lg ${style.glow}`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-center py-4 font-gameui">Resuelve ejercicios para ver tu análisis de XP.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* LOGROS */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 sticky top-8"
            >
              <h2 className="font-display text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                <Award className="text-yellow-300" /> Trofeos
              </h2>

              <div className="space-y-3">
                {achievements.map((a) => (
                  <motion.div
                    key={a.id}
                    whileHover={a.unlocked ? { scale: 1.02 } : {}}
                    className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 ${
                      a.unlocked
                        ? `bg-gradient-to-br ${a.gradient} ${a.border} shadow-lg`
                        : 'border-slate-800 bg-slate-900/30 opacity-50 grayscale'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${a.unlocked ? 'bg-slate-900/50' : 'bg-slate-900/30'} ${a.iconColor}`}>
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-black text-white text-sm">{a.title}</h3>
                        <p className="text-xs text-slate-400 font-gameui">{a.desc}</p>
                      </div>
                      <span className="font-display font-black text-xs text-yellow-300">{a.xpReward}</span>
                    </div>
                    {a.unlocked && (
                      <div className="absolute top-2 right-2">
                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-slate-500 text-xs font-gameui">
                  {achievements.filter(a => a.unlocked).length}/{achievements.length} desbloqueados
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
