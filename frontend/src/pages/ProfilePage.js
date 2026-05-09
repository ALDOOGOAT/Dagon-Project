import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { sounds } from '../lib/SoundEngine';
import { DagonMascot } from '../components/DagonMascot';
import {
  ArrowLeft, BookOpen, Code, Flame, Trophy, Target, Award, BarChart3,
  Sparkles, Crown, Shield, Zap, Camera, ChevronRight
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

const MAX_AVATAR_SOURCE_BYTES = 12 * 1024 * 1024;
const AVATAR_CANVAS_SIZE = 720;
const AVATAR_UPLOAD_QUALITY = 0.82;
const API_BASE = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '';

const buildImageUrl = (fotoUrl) => {
  if (!fotoUrl) return '';
  const fullUrl = fotoUrl.startsWith('http') ? fotoUrl : `${API_BASE}${fotoUrl}`;
  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}v=${Date.now()}`;
};

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => {
  canvas.toBlob(resolve, type, quality);
});

const compressAvatarImage = async (file) => {
  if (!file.type?.startsWith('image/')) {
    throw new Error('Selecciona una imagen válida.');
  }

  if (/heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name || '')) {
    throw new Error('Ese formato no es compatible. En tu galería elige JPG, PNG o WebP.');
  }

  if (file.size > MAX_AVATAR_SOURCE_BYTES) {
    throw new Error('La imagen es demasiado pesada. Usa una foto menor a 12 MB.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No pude leer la imagen. Intenta con otra foto.'));
      img.src = objectUrl;
    });

    const scale = Math.min(1, AVATAR_CANVAS_SIZE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, 'image/jpeg', AVATAR_UPLOAD_QUALITY);
    if (!blob) {
      throw new Error('No pude preparar la imagen para subirla.');
    }

    return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { palette, changePalette, palettes, colors } = useTheme();
  const isLight = colors.mode === 'light';
  const [stats, setStats] = useState({
    xp: 0, ejercicios_completados: 0, consultas_totales: 0,
    racha: 0, mejor_racha: 0, distribucion_xp: []
  });
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const userLevel = Math.floor(stats.xp / 100) + 1;
  const xpInLevel = stats.xp % 100;
  const title = titleFor(stats.xp);
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;
  const softSurface = isLight ? 'rgba(255, 250, 240, 0.82)' : 'rgba(15, 23, 42, 0.5)';
  const softSurfaceBorder = isLight ? `${colors.border}aa` : 'rgba(255,255,255,0.05)';
  const statCardStyle = {
    backgroundColor: softSurface,
    borderColor: softSurfaceBorder,
    boxShadow: isLight ? '0 18px 40px -28px rgba(245, 158, 11, 0.35)' : undefined,
  };
  const chipStyle = {
    backgroundColor: isLight ? 'rgba(250, 204, 21, 0.16)' : 'rgba(6, 182, 212, 0.10)',
    borderColor: isLight ? 'rgba(245, 158, 11, 0.28)' : 'rgba(34, 211, 238, 0.30)',
  };
  const chipIconColor = isLight ? colors.primary : '#67e8f9';
  const chipTextColor = isLight ? '#92400e' : '#cffafe';
  const progressTrackStyle = {
    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.82)' : 'rgba(15, 23, 42, 0.8)',
    borderColor: isLight ? `${colors.border}88` : 'rgba(255,255,255,0.05)',
  };
  const lockedAchievementStyle = isLight
    ? { borderColor: 'rgba(216, 180, 84, 0.18)', backgroundColor: 'rgba(255, 248, 230, 0.62)', opacity: 0.72 }
    : undefined;
  const heroOrbStyle = isLight
    ? { background: 'radial-gradient(circle, rgba(250,204,21,0.18) 0%, rgba(255,255,255,0) 72%)' }
    : undefined;

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
        const response = await fetch(`${API_BASE}/api/usuarios/${user.idUsuario}/stats`, {
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
      
      const cachedAvatar = localStorage.getItem('userAvatar');
      if (cachedAvatar) {
        setAvatarUrl(cachedAvatar);
      }
      
      try {
        const res = await fetch(`${API_BASE}/api/usuarios/${user.idUsuario}/foto`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.fotoUrl) {
          const fullUrl = buildImageUrl(data.fotoUrl);
          setAvatarUrl(fullUrl);
          localStorage.setItem('userAvatar', fullUrl);
        } else {
          localStorage.removeItem('userAvatar');
        }
      } catch (e) {}
    };
    fetchAvatar();
  }, [user, token]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.idUsuario) return;

    setUploading(true);
    try {
      const avatarFile = await compressAvatarImage(file);
      const formData = new FormData();
      formData.append('file', avatarFile);

      const res = await fetch(`${API_BASE}/api/usuarios/${user.idUsuario}/foto`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || text || 'El servidor rechazó la imagen.');
      }

      if (data.success) {
        const fullUrl = buildImageUrl(data.fotoUrl);
        setAvatarUrl(fullUrl);
        localStorage.setItem('userAvatar', fullUrl);
        toast.success('Foto de perfil actualizada');
      } else {
        throw new Error(data.message || 'No se pudo actualizar la foto.');
      }
    } catch (err) {
      toast.error(err.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      e.target.value = '';
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
          <div className="absolute -inset-6 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: `${colors.primary}20` }} />
          <DagonMascot size="large" mood="thinking" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-44 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-2/3 rounded-full animate-shimmer-width" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }} />
          </div>
          <p className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: colors.primary }}>Analizando tu poder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" data-testid="profile-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="flex items-center mb-8">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="transition-colors" style={{ color: mutedColor }}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver
          </Button>
          <div className="h-8 w-px mx-4" style={{ backgroundColor: isLight ? 'rgba(217, 119, 6, 0.18)' : 'rgba(255,255,255,0.10)' }} />
          <p className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: colors.primary }}>Ficha de personaje</p>
        </div>

        {/* PERSONALIZACIÓN DE TEMA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-apple rounded-3xl p-6 border mb-8"
          style={{ borderColor: colors.border }}
        >
          <h3 className="font-display text-xl font-black mb-4 flex items-center gap-2" style={{ color: headingColor }}>
            <Sparkles className="w-5 h-5" style={{ color: colors.primary }} />
            Personalización
          </h3>
          <p className="text-sm mb-4" style={{ color: mutedColor }}>Elige el tema de color que más te guste</p>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(palettes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => changePalette(key)}
                className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                  palette === key 
                    ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' 
                    : 'border-transparent hover:border-white/30 hover:scale-105'
                }`}
                style={palette === key ? { borderColor: colors.primary, boxShadow: `0 0 20px ${colors.primary}40` } : {}}
              >
                <div className="flex flex-col gap-1">
                  <div 
                    className="w-full h-8 rounded-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` 
                    }}
                  />
                  <span className="text-xs font-medium truncate" style={{ color: isLight ? '#5b4636' : '#cbd5e1' }}>{theme.name}</span>
                </div>
                {palette === key && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <Sparkles className="w-2 h-2" style={{ color: isLight ? '#ffffff' : '#000000' }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* HERO: avatar + stats principales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 holo-border mb-8 relative overflow-hidden"
          style={{ borderColor: colors.border }}
        >
          <div
            className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none ${isLight ? '' : 'bg-fuchsia-600/15'}`}
            style={heroOrbStyle}
          />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[auto_1fr_auto] items-center">
            <div className="relative group">
              <div className={`absolute -inset-3 rounded-3xl ${tierRing(title.tier)}`} />
              <div className={`relative w-28 h-28 rounded-2xl bg-gradient-to-br ${tierGradient(title.tier)} flex items-center justify-center shadow-2xl overflow-hidden`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <DagonMascot size="medium" mood={profileMood} />
                )}
                <label
                  aria-label="Cambiar foto de perfil"
                  className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-7 h-7 text-white" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Cambiar</span>
                    </>
                  )}
                </label>
              </div>
              <div className="absolute -bottom-3 -right-3 badge-shine text-yellow-950 text-xs font-display font-black px-3 py-1 rounded-lg border border-yellow-300 animate-badge-pulse">
                Lvl {userLevel}
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h1 className="font-display text-3xl lg:text-4xl font-black mb-2 break-words" style={{ color: headingColor }}>
                {user?.nombre || user?.email}
              </h1>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={chipStyle}>
                  <Sparkles className="w-3 h-3" style={{ color: chipIconColor }} />
                  <span className="font-gameui text-xs font-bold tracking-widest uppercase" style={{ color: chipTextColor }}>{title.name}</span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: mutedColor }}>
                  Tier <span style={{ color: headingColor }}>{title.tier}</span>
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-gameui" style={{ color: mutedColor }}>Progreso al nivel {userLevel + 1}</span>
                <span className="font-display font-black text-sm" style={{ color: headingColor }}>{xpInLevel}/100 XP</span>
              </div>
              <div className="relative w-full h-4 rounded-full border overflow-hidden xp-bar-shine" style={progressTrackStyle}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInLevel}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full shadow-[0_0_20px_rgba(99,102,241,0.7)]"
                  style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }}
                />
              </div>
            </div>

            <div className="text-center lg:text-right">
              <p className="font-display text-5xl sm:text-6xl font-black leading-none drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]" style={{ color: colors.primary }}>
                {stats.xp}
              </p>
              <p className="text-xs uppercase tracking-[0.4em] font-bold mt-2" style={{ color: mutedColor }}>XP totales</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* RESUMEN DE BATALLA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card-apple rounded-3xl p-6 lg:p-8 border"
              style={{ borderColor: colors.border }}
            >
              <h2 className="font-display text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-wide" style={{ color: headingColor }}>
                <Target /> Resumen de batalla
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <BookOpen className="w-5 h-5" />, label: 'Completados', value: stats.ejercicios_completados, hover: 'hover:border-emerald-500/30' },
                  { icon: <Code className="w-5 h-5" />, label: 'Consultas', value: stats.consultas_totales, hover: 'hover:border-blue-500/30' },
                  { icon: <Flame className="w-5 h-5" />, label: 'Racha actual', value: stats.racha, hover: 'hover:border-orange-500/30' },
                  { icon: <Trophy className="w-5 h-5" />, label: 'Mejor racha', value: stats.mejor_racha, hover: 'hover:border-yellow-500/30' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -3 }}
                    className={`flex items-center justify-between p-5 rounded-2xl border ${s.hover} transition-all`}
                    style={statCardStyle}
                  >
                    <div className="flex items-center gap-3 font-display font-bold text-sm" style={{ color: headingColor }}>
                      <span style={{ color: colors.primary }}>{s.icon}</span> <span style={{ color: mutedColor }}>{s.label}</span>
                    </div>
                    <span className="font-display text-3xl font-black" style={{ color: headingColor }}>{s.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* DISTRIBUCIÓN XP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10"
              style={{ borderColor: colors.border }}
            >
              <h2 className="font-display text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-wide" style={{ color: headingColor }}>
                <BarChart3 style={{ color: colors.primary }} /> Origen del poder
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
                          <span className="font-display font-bold" style={{ color: headingColor }}>
                            {item.xp_ganada} XP <span style={{ color: mutedColor }}>({percent}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-3 rounded-full overflow-hidden border" style={progressTrackStyle}>
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
                  <p className="text-center py-4 font-gameui" style={{ color: mutedColor }}>Resuelve ejercicios para ver tu análisis de XP.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* LOGROS */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 lg:sticky lg:top-8"
              style={{ borderColor: colors.border }}
            >
              <h2 className="font-display text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-wide" style={{ color: headingColor }}>
                <Award style={{ color: isLight ? '#d97706' : '#fde047' }} /> Trofeos
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
                    style={!a.unlocked ? lockedAchievementStyle : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${a.iconColor}`}
                        style={{ backgroundColor: a.unlocked ? (isLight ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.5)') : (isLight ? 'rgba(255,255,255,0.42)' : 'rgba(15,23,42,0.3)') }}
                      >
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-black text-sm" style={{ color: headingColor }}>{a.title}</h3>
                        <p className="text-xs font-gameui" style={{ color: mutedColor }}>{a.desc}</p>
                      </div>
                      <span className="font-display font-black text-xs" style={{ color: isLight ? '#b45309' : '#fde047' }}>{a.xpReward}</span>
                    </div>
                    {a.unlocked && (
                      <div className="absolute top-2 right-2">
                        <Sparkles className="w-4 h-4 animate-pulse" style={{ color: isLight ? '#d97706' : '#fde047' }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs font-gameui" style={{ color: mutedColor }}>
                  {achievements.filter(a => a.unlocked).length}/{achievements.length} desbloqueados
                </p>
              </div>
            </motion.div>

            {/* BOTÓN SALÓN DE LA FAMA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8"
            >
              <Button
                onClick={() => {
                  sounds.playClick();
                  navigate('/credits');
                }}
                className="w-full py-8 rounded-[32px] glass-card-apple border group transition-all"
                style={{ 
                  borderColor: `${colors.primary}30`,
                  background: `linear-gradient(90deg, ${colors.primary}10, transparent)`
                }}
              >
                <div className="flex items-center justify-between w-full px-2 sm:px-4 gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div 
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform shrink-0"
                      style={{ 
                        backgroundColor: `${colors.primary}20`,
                        borderColor: `${colors.primary}40`
                      }}
                    >
                      <Trophy className="w-6 h-6" style={{ color: colors.primary }} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.primary }}>Descubre a los creadores</p>
                      <h3 className="font-display text-lg sm:text-xl font-black" style={{ color: headingColor }}>SALÓN DE LA FAMA</h3>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:transition-colors shrink-0" style={{ color: colors.primary, opacity: 0.5 }} />
                </div>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
