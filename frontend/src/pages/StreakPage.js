import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { DagonMascot } from '../components/DagonMascot';
import { ArrowLeft, Flame, Trophy, Sparkles, Target, ChevronLeft, ChevronRight, Zap, PartyPopper, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../config/api';

const MILESTONES = [
  { days: 3, label: '3 días', reward: 'Racha de Fuego', icon: Flame },
  { days: 7, label: '1 semana', reward: 'Semana Imparable', icon: Trophy },
  { days: 14, label: '2 semanas', reward: 'Guerrero Constante', icon: Target },
  { days: 30, label: '1 mes', reward: 'Leyenda del Abismo', icon: Sparkles },
];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const FireEffect = ({ intensity = 1 }) => {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: 15 + Math.random() * 70,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 1,
    size: 3 + Math.random() * 4,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: `hsl(${30 + Math.random() * 20}, 100%, ${60 + Math.random() * 20}%)`,
            left: `${p.x}%`,
            bottom: '20%',
          }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: [-150 * intensity, -200 * intensity],
            opacity: [0, 0.9, 0.5, 0],
            scale: [0.5, 1.2, 0.3],
            x: [0, (Math.random() - 0.5) * 30],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

const StreakFlame = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 24, md: 40, lg: 64, xl: 80 };
  const s = sizes[size] || sizes.md;
  
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 64 80"
      className={className}
      fill="none"
    >
      <motion.path
        d="M32 78C32 78 8 52 8 34C8 20 18 8 32 8C46 8 56 20 56 34C56 52 32 78 32 78Z"
        fill="url(#flameGrad)"
        animate={{
          scale: [1, 1.05, 0.98, 1.03, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '32px 70px' }}
      />
      <motion.path
        d="M32 62C32 62 20 46 20 36C20 28 25 18 32 18C39 18 44 28 44 36C44 46 32 62 32 62Z"
        fill="url(#flameInnerGrad)"
        animate={{
          scale: [1, 1.08, 0.95, 1.05, 1],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '32px 50px' }}
      />
      <defs>
        <linearGradient id="flameGrad" x1="32" y1="8" x2="32" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffd23f" />
          <stop offset="0.3" stopColor="#ff9500" />
          <stop offset="0.7" stopColor="#ff6b35" />
          <stop offset="1" stopColor="#ff4500" />
        </linearGradient>
        <linearGradient id="flameInnerGrad" x1="32" y1="18" x2="32" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7e0" />
          <stop offset="0.4" stopColor="#ffdd55" />
          <stop offset="1" stopColor="#ff9500" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const EmberField = ({ amount = 18, color = '#fb923c', areaClassName = '' }) => {
  const embers = useMemo(() => Array.from({ length: amount }, (_, index) => ({
    id: index,
    left: `${6 + Math.random() * 88}%`,
    top: `${4 + Math.random() * 88}%`,
    size: 4 + Math.random() * 10,
    driftX: (Math.random() - 0.5) * 28,
    driftY: 18 + Math.random() * 36,
    delay: Math.random() * 2.5,
    duration: 3.5 + Math.random() * 3,
    opacity: 0.18 + Math.random() * 0.28,
  })), [amount]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${areaClassName}`}>
      {embers.map((ember) => (
        <motion.div
          key={ember.id}
          className="absolute rounded-full blur-[1px]"
          style={{
            left: ember.left,
            top: ember.top,
            width: ember.size,
            height: ember.size,
            background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0.65) 25%, transparent 78%)`,
            opacity: ember.opacity,
          }}
          animate={{
            x: [0, ember.driftX, 0],
            y: [0, -ember.driftY, 0],
            scale: [0.8, 1.2, 0.75],
            opacity: [0, ember.opacity, ember.opacity * 0.75, 0],
          }}
          transition={{
            duration: ember.duration,
            delay: ember.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export const StreakPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const [stats, setStats] = useState({ racha: 0, mejor_racha: 0, fechas_actividad: [] });
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState(new Date());

  useEffect(() => {
    const fetchStreakStats = async () => {
      if (!user?.idUsuario) return;
      try {
        const response = await fetch(apiUrl(`/api/usuarios/${user.idUsuario}/stats`), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const fechas = data.fechas_actividad || [];
        const diasActivos = new Set(fechas.map(f => {
          const date = new Date(f);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }));
        
        if (data.success) setStats({ ...data, diasActivos });
      } catch (error) {
        toast.error('Error al cargar tu racha');
      } finally {
        setLoading(false);
      }
    };
    fetchStreakStats();
  }, [user, token]);

  const diasEnMes = useMemo(() => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    const dias = [];
    const primerDiaSemana = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
    
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push({ num: null, fecha: null });
    }
    
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      const fecha = `${año}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const tieneActividad = stats.diasActivos?.has(fecha);
      dias.push({ num: d, fecha, tieneActividad });
    }
    
    return dias;
  }, [mesActual, stats.diasActivos]);

  const obtenerDiasConsecutivos = () => {
    const dias = [];
    const fechaActual = new Date();
    
    for (let i = 0; i < 35; i++) {
      const fecha = new Date(fechaActual);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      
      if (stats.diasActivos?.has(fechaStr)) {
        dias.push(fechaStr);
      } else {
        break;
      }
    }
    
    return dias;
  };

  const diasConsecutivos = obtenerDiasConsecutivos();

  const mesAnterior = () => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));

  const mesSiguiente = () => {
    const ahora = new Date();
    if (mesActual.getFullYear() < ahora.getFullYear() || 
        (mesActual.getFullYear() === ahora.getFullYear() && mesActual.getMonth() < ahora.getMonth())) {
      setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
    }
  };

  const tieneSiguiente = () => {
    const ahora = new Date();
    return mesActual.getFullYear() < ahora.getFullYear() || mesActual.getMonth() < ahora.getMonth();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.background }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <StreakFlame size="lg" className="text-orange-500" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-orange-300 font-bold tracking-[0.4em] uppercase text-xs mt-6"
        >
          Despertando el fuego...
        </motion.p>
      </div>
    );
  }

  const nextMilestone = MILESTONES.find(m => m.days > stats.racha) || MILESTONES[MILESTONES.length - 1];
  const msProgress = nextMilestone ? Math.min(100, (stats.racha / nextMilestone.days) * 100) : 100;
  const diasActivosEsteMes = diasEnMes.filter(d => d.tieneActividad).length;
  const esHoy = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const streakTier = stats.racha >= 30 ? 'legendaria' : stats.racha >= 14 ? 'heroica' : stats.racha >= 7 ? 'ardiente' : stats.racha >= 3 ? 'encendida' : 'naciente';
  const streakMessage = stats.racha >= 30
    ? 'Tu fuego ya no es racha: es leyenda viva dentro del Abismo.'
    : stats.racha >= 14
      ? 'Tu disciplina ya se siente como ritual. Cada día consolida tu dominio.'
      : stats.racha >= 7
        ? 'La llama ya tiene forma. Estás construyendo una costumbre real.'
        : stats.racha >= 3
          ? 'Ya no es casualidad: estás entrando en ritmo.'
          : stats.racha > 0
            ? 'El fuego ya prendió. Solo hace falta alimentarlo mañana.'
            : 'Hoy es buen día para encender la primera chispa.';
  const heroPanelStyle = {
    background: isLight
      ? 'linear-gradient(155deg, rgba(255,248,238,0.94) 0%, rgba(255,240,222,0.92) 48%, rgba(250,228,192,0.86) 100%)'
      : 'linear-gradient(155deg, rgba(15,23,42,0.94) 0%, rgba(24,24,27,0.96) 46%, rgba(68,25,18,0.92) 100%)',
    borderColor: isLight ? 'rgba(198,122,29,0.24)' : 'rgba(249,115,22,0.18)',
    boxShadow: isLight
      ? '0 34px 90px -42px rgba(161, 98, 7, 0.42)'
      : '0 34px 90px -38px rgba(249,115,22,0.24)',
  };
  const panelStyle = {
    background: isLight ? 'rgba(255,248,238,0.78)' : 'rgba(15,23,42,0.56)',
    borderColor: isLight ? 'rgba(198,122,29,0.16)' : colors.border,
    boxShadow: isLight
      ? '0 24px 64px -36px rgba(161, 98, 7, 0.28)'
      : '0 24px 64px -36px rgba(2, 6, 23, 0.5)',
  };
  const helperText = isLight ? '#7c5f3b' : '#94a3b8';
  const headingText = isLight ? '#352517' : '#ffffff';
  const accentWarm = isLight ? '#b45309' : '#fdba74';
  const accentFire = isLight ? '#ea580c' : '#fb923c';

  return (
    <div className="min-h-screen" data-testid="streak-page">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center mb-6"
        >
          <Button onClick={() => navigate('/dashboard')} variant="ghost" style={{ color: helperText }}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Volver
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={stats.racha}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative overflow-hidden rounded-3xl mb-8"
            style={heroPanelStyle}
          >
            <div className="absolute inset-0" style={{ background: heroPanelStyle.background }} />
            
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="absolute top-0 right-0 w-full h-full" style={{ background: `radial-gradient(ellipse at top right, ${isLight ? 'rgba(234,88,12,0.18)' : 'rgba(249,115,22,0.16)'}, transparent 70%)` }} />
              <div className="absolute bottom-0 left-0 w-full h-full" style={{ background: `radial-gradient(ellipse at bottom left, ${isLight ? 'rgba(217,119,6,0.12)' : 'rgba(239,68,68,0.1)'}, transparent 50%)` }} />
            </motion.div>
            <EmberField amount={22} color={isLight ? '#ea580c' : '#fb923c'} />
            <FireEffect intensity={stats.racha > 0 ? Math.min(1.35, 0.7 + stats.racha * 0.06) : 0.35} />

            <div className="relative z-10 p-5 sm:p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-20">
                <div className="relative">
                  <motion.div
                    className="absolute -inset-10 rounded-full blur-3xl"
                    style={{ background: `radial-gradient(circle, ${isLight ? 'rgba(234,88,12,0.16)' : 'rgba(249,115,22,0.22)'} 0%, transparent 68%)` }}
                    animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.4, 0.72, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="relative"
                    animate={stats.racha > 0 ? { y: [-6, 6, -6] } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <DagonMascot size="xlarge" mood={stats.racha > 0 ? "excited" : "sad"} showFire={stats.racha > 3} />
                  </motion.div>
                  
                  {stats.racha > 0 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="absolute -top-2 -right-4"
                    >
                      <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                        <StreakFlame size="lg" className="drop-shadow-2xl" />
                      </motion.div>
                    </motion.div>
                  )}
                  {stats.racha >= 7 && (
                    <motion.div
                      className="absolute -inset-6 rounded-full border"
                      style={{ borderColor: isLight ? 'rgba(217,119,6,0.18)' : 'rgba(251,146,60,0.2)' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div
                      className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl border backdrop-blur-xl"
                      style={{
                        background: isLight
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,237,213,0.48))'
                          : 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(244,63,94,0.08))',
                        borderColor: isLight ? 'rgba(217,119,6,0.22)' : 'rgba(249,115,22,0.2)'
                      }}
                    >
                      <motion.div
                        animate={stats.racha > 0 ? { rotate: [-8, 8, -8], scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <StreakFlame size="md" />
                      </motion.div>
                      
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.3, stiffness: 500 }}
                        className="font-display text-6xl sm:text-8xl lg:text-9xl font-black text-gradient-fire"
                      >
                        {stats.racha}
                      </motion.span>
                    </div>
                    
                    <p className="font-display text-2xl lg:text-3xl font-black uppercase tracking-[0.15em] mt-4" style={{ color: accentWarm }}>
                      {stats.racha === 1 ? 'día' : 'días'} de racha
                    </p>
                    <div className="flex items-center justify-center lg:justify-start gap-2 mt-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.35em] border" style={{
                        color: accentFire,
                        borderColor: isLight ? 'rgba(217,119,6,0.22)' : 'rgba(251,146,60,0.24)',
                        backgroundColor: isLight ? 'rgba(255,247,237,0.74)' : 'rgba(251,146,60,0.08)'
                      }}>
                        Estado {streakTier}
                      </span>
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 text-lg font-gameui leading-relaxed max-w-2xl"
                    style={{ color: helperText }}
                  >
                    {streakMessage}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-6"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{
                      backgroundColor: isLight ? 'rgba(255,245,227,0.66)' : 'rgba(245,158,11,0.1)',
                      borderColor: isLight ? 'rgba(217,119,6,0.18)' : 'rgba(245,158,11,0.3)'
                    }}>
                      <Trophy className="w-5 h-5" style={{ color: isLight ? '#b45309' : '#fbbf24' }} />
                      <span className="font-display font-black" style={{ color: isLight ? '#8a4b11' : '#fde68a' }}>Mejor: {stats.mejor_racha}</span>
                    </div>
                    
                    {stats.racha > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border"
                        style={{
                          backgroundColor: isLight ? 'rgba(255,240,220,0.66)' : 'rgba(16,185,129,0.1)',
                          borderColor: isLight ? 'rgba(194,95,26,0.16)' : 'rgba(16,185,129,0.3)'
                        }}
                      >
                        <Zap className="w-5 h-5" style={{ color: isLight ? '#c65f1a' : '#34d399' }} />
                        <span className="font-display font-black" style={{ color: isLight ? '#9a4a16' : '#bbf7d0' }}>+{stats.racha * 5} XP diario</span>
                      </motion.div>
                    )}
                    {stats.racha >= 3 && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{
                        backgroundColor: isLight ? 'rgba(255,244,229,0.7)' : 'rgba(244,63,94,0.08)',
                        borderColor: isLight ? 'rgba(217,119,6,0.14)' : 'rgba(244,63,94,0.2)'
                      }}>
                        <PartyPopper className="w-4 h-4" style={{ color: accentFire }} />
                        <span className="font-display font-black text-sm" style={{ color: isLight ? '#7c3d12' : '#fecdd3' }}>Cadencia encendida</span>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <div className="rounded-3xl border p-6 overflow-hidden relative" style={panelStyle}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent 35%)' : 'linear-gradient(180deg, rgba(251,146,60,0.05), transparent 35%)' }} />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: accentFire }} />
                  <h3 className="font-display text-xl font-black uppercase tracking-wide" style={{ color: headingText }}>Calendario de fuego</h3>
                </div>
                
                <div className="flex items-center gap-1 rounded-xl p-1 self-start sm:self-auto" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.54)' : 'rgba(30,41,59,0.5)' }}>
                  <button
                    onClick={mesAnterior}
                    className="p-2 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" style={{ color: helperText }} />
                  </button>
                  <span className="px-3 sm:px-4 font-display font-black min-w-[136px] sm:min-w-[160px] text-center text-sm sm:text-base" style={{ color: accentFire }}>
                    {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                  </span>
                  <button
                    onClick={mesSiguiente}
                    disabled={!tieneSiguiente()}
                    className={`p-2 rounded-lg transition-colors ${
                      tieneSiguiente() ? '' : 'opacity-30 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" style={{ color: tieneSiguiente() ? helperText : (isLight ? '#c4b29a' : '#475569') }} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia} className="text-center text-xs font-black uppercase tracking-widest py-2" style={{ color: helperText }}>
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {diasEnMes.map((dia, idx) => {
                  const esDiaDeRacha = dia.fecha && diasConsecutivos.includes(dia.fecha);
                  const esRachaActivo = esDiaDeRacha && dia.tieneActividad;
                  const esHoyActual = dia.fecha === esHoy;
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.008 }}
                      className={`aspect-square rounded-xl flex items-center justify-center text-sm font-display font-black relative overflow-hidden ${
                        !dia.num ? 'invisible' :
                        esRachaActivo ? '' :
                        esDiaDeRacha ? '' :
                        dia.tieneActividad ? '' :
                        esHoyActual ? '' :
                        ''
                      }`}
                      style={{
                        background: !dia.num
                          ? undefined
                          : esRachaActivo
                            ? 'linear-gradient(145deg, #fbbf24 0%, #f97316 45%, #e11d48 100%)'
                            : esDiaDeRacha
                              ? (isLight ? 'linear-gradient(145deg, rgba(194,95,26,0.92), rgba(154,52,18,0.95))' : 'linear-gradient(145deg, rgba(194,65,12,0.86), rgba(124,45,18,0.94))')
                              : dia.tieneActividad
                                ? (isLight ? 'linear-gradient(145deg, rgba(234,88,12,0.82), rgba(190,24,93,0.8))' : 'linear-gradient(145deg, rgba(234,88,12,0.75), rgba(190,24,93,0.82))')
                                : esHoyActual
                                  ? (isLight ? 'rgba(255,247,237,0.9)' : 'rgba(34,211,238,0.08)')
                                  : (isLight ? 'rgba(255,255,255,0.56)' : 'rgba(30,41,59,0.42)'),
                        borderColor: !dia.num
                          ? 'transparent'
                          : esRachaActivo
                            ? 'rgba(255,255,255,0.18)'
                            : esHoyActual
                              ? (isLight ? 'rgba(194,95,26,0.34)' : 'rgba(34,211,238,0.34)')
                              : (isLight ? 'rgba(198,122,29,0.12)' : 'rgba(255,255,255,0.05)'),
                        color: !dia.num
                          ? undefined
                          : esRachaActivo || esDiaDeRacha || dia.tieneActividad
                            ? '#fff7ed'
                            : esHoyActual
                              ? (isLight ? '#9a4a16' : '#67e8f9')
                              : (isLight ? '#8b6f4e' : '#64748b'),
                        boxShadow: esRachaActivo
                          ? '0 0 22px rgba(249,115,22,0.55)'
                          : undefined
                      }}
                    >
                      {dia.num}
                      
                      {esRachaActivo && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            animate={{ scale: [0.7, 1, 0.7], rotate: [-2, 2, -2] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            <Flame className="w-4 h-4 text-white fill-current" />
                          </motion.div>
                        </motion.div>
                      )}
                      
                      {dia.tieneActividad && !esRachaActivo && (
                        <Flame className="w-3 h-3 text-white/50 absolute bottom-1" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: isLight ? 'rgba(198,122,29,0.12)' : 'rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-yellow-400 via-orange-500 to-rose-600" />
                    <span style={{ color: helperText }}>Racha</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-600 to-rose-700" />
                    <span style={{ color: helperText }}>Activo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded border" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(30,41,59,0.42)', borderColor: isLight ? 'rgba(198,122,29,0.1)' : 'rgba(255,255,255,0.05)' }} />
                    <span style={{ color: helperText }}>Sin actividad</span>
                  </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accentFire }}>
                  {diasActivosEsteMes} días
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-3xl border p-5 relative overflow-hidden" style={panelStyle}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(circle at top right, rgba(217,119,6,0.12), transparent 48%)' : 'radial-gradient(circle at top right, rgba(217,70,239,0.1), transparent 48%)' }} />
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: isLight ? '#c65f1a' : '#e879f9' }} />
                <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: isLight ? '#a16207' : '#f0abfc' }}>Próxima meta</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-display font-black text-xl" style={{ color: headingText }}>{nextMilestone.label}</p>
                <nextMilestone.icon className="w-5 h-5" style={{ color: accentFire }} />
              </div>
              <p className="text-sm mb-4" style={{ color: helperText }}>{nextMilestone.reward}</p>
              
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(30,41,59,0.9)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${msProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                  className="h-full"
                  style={{ background: isLight ? 'linear-gradient(90deg, #ea580c, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #d946ef, #22d3ee)' }}
                />
              </div>
              <p className="text-xs mt-2 text-right" style={{ color: helperText }}>
                {stats.racha}/{nextMilestone.days} días ({Math.round(msProgress)}%)
              </p>
            </div>

            <div className="rounded-3xl border p-5 relative overflow-hidden" style={panelStyle}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'radial-gradient(circle at bottom left, rgba(234,88,12,0.1), transparent 45%)' : 'radial-gradient(circle at bottom left, rgba(250,204,21,0.08), transparent 45%)' }} />
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4" style={{ color: isLight ? '#b45309' : '#facc15' }} />
                <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: isLight ? '#a16207' : '#fde047' }}>Récord</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-black text-gradient-gold">{stats.mejor_racha}</span>
                <span className="text-lg font-bold" style={{ color: helperText }}>días</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Star className="w-4 h-4" style={{ color: accentFire }} />
                <p className="text-sm leading-relaxed" style={{ color: helperText }}>
                  Superar tu récord requiere {Math.max(0, stats.mejor_racha - stats.racha + 1)} día{Math.max(0, stats.mejor_racha - stats.racha + 1) === 1 ? '' : 's'} más.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border p-5 relative overflow-hidden" style={panelStyle}>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4" style={{ color: accentFire }} />
                <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: accentWarm }}>Cadena actual</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.min(10, Math.max(3, stats.racha || 3)) }).map((_, i) => {
                  const active = i < Math.min(stats.racha, 10);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="w-10 h-12 rounded-2xl border flex items-center justify-center"
                      style={{
                        background: active
                          ? 'linear-gradient(180deg, #fbbf24 0%, #f97316 58%, #ea580c 100%)'
                          : (isLight ? 'rgba(255,255,255,0.56)' : 'rgba(30,41,59,0.42)'),
                        borderColor: active
                          ? 'rgba(255,255,255,0.16)'
                          : (isLight ? 'rgba(198,122,29,0.1)' : 'rgba(255,255,255,0.05)'),
                        boxShadow: active ? '0 12px 25px -14px rgba(249,115,22,0.65)' : undefined
                      }}
                    >
                      <Flame className="w-4 h-4" style={{ color: active ? '#fff7ed' : helperText }} />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
