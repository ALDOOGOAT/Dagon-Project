import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { DagonMascot } from '../components/DagonMascot';
import {
  ArrowLeft, Flame, Trophy, Sparkles, Target, ChevronLeft, ChevronRight,
  Zap, PartyPopper, Star, ShieldAlert, Dumbbell, CalendarCheck, Clock3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import apiClient from '../services/apiClient';

const MILESTONES = [
  { days: 3, label: '3 días', reward: 'Racha de Fuego', icon: Flame },
  { days: 7, label: '1 semana', reward: 'Semana Imparable', icon: Trophy },
  { days: 14, label: '2 semanas', reward: 'Guerrero Constante', icon: Target },
  { days: 30, label: '1 mes', reward: 'Leyenda del Abismo', icon: Sparkles },
];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const FireEffect = ({ intensity = 1 }) => {
  const shouldReduceMotion = useReducedMotion();
  const particleCount = shouldReduceMotion ? 0 : 12;
  const particles = useMemo(() => Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: 15 + Math.random() * 70,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 1,
    size: 3 + Math.random() * 4,
    hue: 30 + Math.random() * 20,
    lightness: 60 + Math.random() * 20,
    driftX: (Math.random() - 0.5) * 30,
  })), [particleCount]);

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-full">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: `hsl(${p.hue}, 100%, ${p.lightness}%)`,
            left: `${p.x}%`,
            bottom: '20%',
          }}
          initial={{ y: 0, opacity: 0, scale: 0 }}
          animate={{
            y: [-150 * intensity, -200 * intensity],
            opacity: [0, 0.9, 0.5, 0],
            scale: [0.5, 1.2, 0.3],
            x: [0, p.driftX],
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
  const shouldReduceMotion = useReducedMotion();
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
        animate={shouldReduceMotion ? undefined : {
          scale: [1, 1.05, 0.98, 1.03, 1],
        }}
        transition={shouldReduceMotion ? undefined : {
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: '32px 70px' }}
      />
      <motion.path
        d="M32 62C32 62 20 46 20 36C20 28 25 18 32 18C39 18 44 28 44 36C44 46 32 62 32 62Z"
        fill="url(#flameInnerGrad)"
        animate={shouldReduceMotion ? undefined : {
          scale: [1, 1.08, 0.95, 1.05, 1],
        }}
        transition={shouldReduceMotion ? undefined : {
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
  const shouldReduceMotion = useReducedMotion();
  const emberCount = shouldReduceMotion ? Math.min(4, amount) : amount;
  const embers = useMemo(() => Array.from({ length: emberCount }, (_, index) => ({
    id: index,
    left: `${6 + Math.random() * 88}%`,
    top: `${4 + Math.random() * 88}%`,
    size: 4 + Math.random() * 10,
    driftX: (Math.random() - 0.5) * 28,
    driftY: 18 + Math.random() * 36,
    delay: Math.random() * 2.5,
    duration: 3.5 + Math.random() * 3,
    opacity: 0.18 + Math.random() * 0.28,
  })), [emberCount]);

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
          animate={shouldReduceMotion ? undefined : {
            x: [0, ember.driftX, 0],
            y: [0, -ember.driftY, 0],
            scale: [0.8, 1.2, 0.75],
            opacity: [0, ember.opacity, ember.opacity * 0.75, 0],
          }}
          transition={shouldReduceMotion ? undefined : {
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

const StreakDagonStage = ({ state, mood, showFire, size = 'large' }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`dagon-streak-stage dagon-streak-stage--${state}`}
      animate={shouldReduceMotion ? undefined : state === 'danger'
        ? { x: [-3, 3, -2, 2, 0], rotate: [-1.5, 1.5, -1, 1, 0] }
        : { y: [-6, 6, -6] }}
      transition={shouldReduceMotion ? undefined : {
        duration: state === 'danger' ? 0.7 : 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {state === 'powered' && (
        <>
          <motion.div
            className="dagon-streak-muscle dagon-streak-muscle--left"
            animate={shouldReduceMotion ? undefined : { rotate: [-16, -24, -16], scale: [1, 1.08, 1] }}
            transition={shouldReduceMotion ? undefined : { duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Dumbbell className="h-5 w-5" />
          </motion.div>
          <motion.div
            className="dagon-streak-muscle dagon-streak-muscle--right"
            animate={shouldReduceMotion ? undefined : { rotate: [16, 24, 16], scale: [1, 1.08, 1] }}
            transition={shouldReduceMotion ? undefined : { duration: 1.05, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
          >
            <Dumbbell className="h-5 w-5" />
          </motion.div>
        </>
      )}

      {state === 'danger' && (
        <motion.div
          className="dagon-streak-warning-badge"
          animate={shouldReduceMotion ? undefined : { y: [-3, 3, -3], scale: [1, 1.08, 1] }}
          transition={shouldReduceMotion ? undefined : { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ShieldAlert className="h-4 w-4" />
        </motion.div>
      )}

      <DagonMascot size={size} mood={mood} showFire={showFire} animated={!shouldReduceMotion} />
    </motion.div>
  );
};

export const StreakPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const shouldReduceMotion = useReducedMotion();
  const [stats, setStats] = useState({ racha: 0, mejor_racha: 0, fechas_actividad: [] });
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState(new Date());

  useEffect(() => {
    const fetchStreakStats = async () => {
      if (!user?.idUsuario) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get(`/api/usuarios/${user.idUsuario}/stats`);
        const data = response.data;
        
        const fechas = data.fechas_actividad || [];
        const diasActivos = new Set(fechas.map(f => {
          if (typeof f === 'string') return f.slice(0, 10);
          const date = new Date(f);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }));
        
        if (data.success) {
          setStats({ ...data, diasActivos });
        } else {
          throw new Error('El backend no pudo calcular las estadisticas.');
        }
      } catch (error) {
        if (![401, 403].includes(error?.response?.status)) {
          toast.error('Error al cargar tu racha');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStreakStats();
  }, [user?.idUsuario, token]);

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

  const ultimosSieteDias = useMemo(() => {
    const hoy = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - (6 - index));
      const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      const diaSemana = DIAS_SEMANA[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1];

      return {
        fecha: fechaStr,
        dia: fecha.getDate(),
        etiqueta: diaSemana,
        activo: stats.diasActivos?.has(fechaStr),
      };
    });
  }, [stats.diasActivos]);

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
          animate={shouldReduceMotion ? undefined : { rotate: 360 }}
          transition={shouldReduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: 'linear' }}
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
  const tieneActividadHoy = Boolean(stats.actividad_hoy ?? stats.diasActivos?.has(esHoy));
  const rachaExpirada = Boolean(stats.racha_expirada);
  const rachaEnRiesgo = Boolean(stats.racha_en_riesgo ?? (stats.racha > 0 && !tieneActividadHoy));
  const rachaCelebradaHoy = Boolean(stats.racha_protegida_hoy ?? (stats.racha > 0 && tieneActividadHoy));
  const horasParaExpirar = stats.racha_expira_en_horas;
  const streakState = rachaExpirada ? 'expired' : rachaEnRiesgo ? 'danger' : rachaCelebradaHoy ? 'powered' : stats.racha > 0 ? 'active' : 'empty';
  const streakMood = rachaExpirada ? 'sad' : rachaEnRiesgo ? 'afraid' : rachaCelebradaHoy ? 'celebrating' : stats.racha > 0 ? 'excited' : 'sad';
  const streakStatus = rachaExpirada
    ? {
        icon: ShieldAlert,
        title: 'Tu racha anterior expiró',
        body: 'La racha vuelve a cero cuando pasa más de un día sin práctica. Puedes iniciar una nueva hoy.',
        action: 'Reencender',
      }
    : rachaEnRiesgo
    ? {
        icon: ShieldAlert,
        title: 'Tu racha está en peligro',
        body: `Resuelve una misión hoy para conservarla${Number.isFinite(horasParaExpirar) ? `: quedan ${horasParaExpirar} h antes del reinicio.` : '.'}`,
        action: 'Salvar racha',
      }
    : rachaCelebradaHoy
      ? {
          icon: CalendarCheck,
          title: 'Racha protegida por hoy',
          body: 'Dagon se puso en modo campeón: ya sumaste actividad y tu fuego sigue vivo.',
          action: 'Sumar otra misión',
        }
      : stats.racha > 0
        ? {
            icon: Flame,
            title: 'Tu llama sigue activa',
            body: 'Mantén el ritmo con una práctica corta antes de cerrar el día.',
            action: 'Practicar',
          }
        : {
            icon: Clock3,
            title: 'Enciende la primera chispa',
            body: 'Haz una misión hoy y convierte el aprendizaje en una rutina visible.',
            action: 'Empezar racha',
          };
  const StatusIcon = streakStatus.icon;
  const streakTier = stats.racha >= 30 ? 'legendaria' : stats.racha >= 14 ? 'heroica' : stats.racha >= 7 ? 'ardiente' : stats.racha >= 3 ? 'encendida' : 'naciente';
  const streakMessage = rachaEnRiesgo
    ? 'A Dagon se le está apagando la llama. Una sola misión hoy salva tu avance antes de que el contador vuelva a cero.'
    : rachaCelebradaHoy
      ? 'Dagon celebra contigo: hoy ya cumpliste, tu racha quedó protegida y el hábito ganó fuerza.'
      : rachaExpirada
        ? 'La llama anterior se apagó por inactividad. Hoy puedes empezar otra cadena sin perder lo aprendido.'
        : stats.racha >= 30
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
      ? 'linear-gradient(145deg, rgba(255,248,238,0.96) 0%, rgba(255,243,226,0.90) 48%, rgba(253,230,181,0.84) 100%)'
      : 'linear-gradient(145deg, rgba(15,23,42,0.94) 0%, rgba(24,24,27,0.96) 50%, rgba(67,20,7,0.88) 100%)',
    borderColor: isLight ? 'rgba(198,122,29,0.24)' : 'rgba(251,146,60,0.20)',
    boxShadow: isLight
      ? '0 28px 80px -44px rgba(161, 98, 7, 0.44)'
      : '0 28px 82px -44px rgba(249,115,22,0.34)',
  };
  const panelStyle = {
    background: isLight ? 'rgba(255,248,238,0.78)' : 'rgba(15,23,42,0.58)',
    borderColor: isLight ? 'rgba(198,122,29,0.16)' : colors.border,
    boxShadow: isLight
      ? '0 22px 58px -38px rgba(161, 98, 7, 0.28)'
      : '0 22px 58px -38px rgba(2, 6, 23, 0.54)',
  };
  const helperText = isLight ? '#7c5f3b' : '#94a3b8';
  const headingText = isLight ? '#352517' : '#ffffff';
  const accentWarm = isLight ? '#b45309' : '#fdba74';
  const accentFire = isLight ? '#ea580c' : '#fb923c';
  const statusAccent = rachaEnRiesgo || rachaExpirada ? '#ef4444' : rachaCelebradaHoy ? '#10b981' : accentFire;
  const diasParaMeta = Math.max(0, nextMilestone.days - stats.racha);
  const diasParaRecord = Math.max(0, stats.mejor_racha - stats.racha + 1);
  const progresoRecord = stats.mejor_racha > 0 ? Math.min(100, (stats.racha / stats.mejor_racha) * 100) : (stats.racha > 0 ? 100 : 0);
  const actividadReciente = ultimosSieteDias.filter(dia => dia.activo).length;
  const MilestoneIcon = nextMilestone.icon;
  const statCards = [
    {
      label: 'Meta',
      value: nextMilestone.label,
      detail: diasParaMeta === 0 ? 'Meta desbloqueada' : `${diasParaMeta} día${diasParaMeta === 1 ? '' : 's'} restante${diasParaMeta === 1 ? '' : 's'}`,
      icon: <MilestoneIcon className="h-4 w-4" />,
      accent: isLight ? '#b45309' : '#fbbf24',
    },
    {
      label: 'Récord',
      value: `${stats.mejor_racha}`,
      detail: diasParaRecord === 0 ? 'Estás superando tu marca' : `${diasParaRecord} día${diasParaRecord === 1 ? '' : 's'} para romperlo`,
      icon: <Trophy className="h-4 w-4" />,
      accent: isLight ? '#a16207' : '#facc15',
    },
    {
      label: 'Mes activo',
      value: `${diasActivosEsteMes}`,
      detail: `${actividadReciente}/7 días recientes`,
      icon: <CalendarCheck className="h-4 w-4" />,
      accent: isLight ? '#047857' : '#34d399',
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: colors.background }} data-testid="streak-page">
      <div className="dagon-page-shell dagon-page-shell--wide streak-page-shell">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 flex flex-col gap-3 lg:mb-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="shrink-0 rounded-2xl px-3"
              style={{ color: helperText }}
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: accentFire }}>
                Ritual diario
              </p>
              <h1 className="font-display text-2xl font-black leading-tight sm:text-3xl" style={{ color: headingText }}>
                Racha de constancia
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em]"
              style={{
                color: rachaCelebradaHoy ? (isLight ? '#047857' : '#bbf7d0') : statusAccent,
                borderColor: `${statusAccent}55`,
                backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.54)',
              }}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {streakStatus.title}
            </span>
            <Button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-2xl px-4 py-3 font-display text-xs font-black uppercase tracking-widest shadow-lg transition-transform hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${statusAccent}, ${isLight ? '#f59e0b' : '#22d3ee'})`,
                color: isLight ? '#1f2937' : '#06111f',
              }}
            >
              <Target className="mr-2 h-4 w-4" />
              {streakStatus.action}
            </Button>
          </div>
        </motion.div>

        <div className="grid items-stretch gap-4 xl:grid-cols-12 xl:gap-5">
          <motion.div
            key={stats.racha}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass-card-apple dagon-compact-card relative flex flex-col overflow-hidden rounded-3xl border p-4 shadow-2xl sm:p-5 xl:col-span-4 xl:min-h-[calc(100vh-10rem)]"
            style={heroPanelStyle}
          >
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={shouldReduceMotion ? undefined : { opacity: [0.32, 0.58, 0.32] }}
              transition={shouldReduceMotion ? undefined : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute top-0 right-0 w-full h-full" style={{ background: `radial-gradient(ellipse at top right, ${isLight ? 'rgba(234,88,12,0.18)' : 'rgba(249,115,22,0.16)'}, transparent 70%)` }} />
              <div className="absolute bottom-0 left-0 w-full h-full" style={{ background: `radial-gradient(ellipse at bottom left, ${isLight ? 'rgba(6,182,212,0.12)' : 'rgba(34,211,238,0.10)'}, transparent 54%)` }} />
            </motion.div>
            <EmberField amount={shouldReduceMotion ? 3 : 10} color={isLight ? '#ea580c' : '#fb923c'} />
            <FireEffect intensity={stats.racha > 0 ? Math.min(1.35, 0.7 + stats.racha * 0.06) : 0.35} />

            <div className="relative z-10 flex h-full flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xs font-black uppercase tracking-[0.28em]" style={{ color: accentWarm }}>
                    Estado {streakTier}
                  </p>
                  <p className="mt-1 max-w-[18rem] text-sm font-gameui leading-relaxed" style={{ color: helperText }}>
                    {streakMessage}
                  </p>
                </div>
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
                  style={{
                    borderColor: `${statusAccent}55`,
                    background: `linear-gradient(135deg, ${statusAccent}28, ${isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.74)'})`,
                    color: statusAccent,
                  }}
                >
                  {rachaCelebradaHoy ? <PartyPopper className="h-5 w-5" /> : <StatusIcon className="h-5 w-5" />}
                </div>
              </div>

              <div className="grid flex-1 items-center gap-4 sm:grid-cols-[auto_1fr] xl:grid-cols-1">
                <div className="relative mx-auto w-full max-w-[15.5rem]">
                  <motion.div
                    className="absolute -inset-8 rounded-full blur-3xl"
                    style={{ background: `radial-gradient(circle, ${isLight ? 'rgba(234,88,12,0.18)' : 'rgba(249,115,22,0.24)'} 0%, transparent 68%)` }}
                    animate={shouldReduceMotion ? undefined : { scale: [0.94, 1.08, 0.94], opacity: [0.44, 0.76, 0.44] }}
                    transition={shouldReduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="relative grid place-items-center"
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  >
                    <StreakDagonStage state={streakState} mood={streakMood} showFire={stats.racha > 3 || rachaCelebradaHoy} size="large" />
                    {stats.racha > 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -140 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="absolute right-4 top-2"
                      >
                        <motion.div animate={shouldReduceMotion ? undefined : { y: [-2, 2, -2], scale: [1, 1.12, 1] }} transition={shouldReduceMotion ? undefined : { duration: 1.2, repeat: Infinity }}>
                          <StreakFlame size="md" className="drop-shadow-2xl" />
                        </motion.div>
                      </motion.div>
                    )}
                    {stats.racha >= 7 && (
                      <motion.div
                        className="absolute inset-6 rounded-full border border-dashed"
                        style={{ borderColor: isLight ? 'rgba(217,119,6,0.25)' : 'rgba(251,146,60,0.3)' }}
                        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                        transition={shouldReduceMotion ? undefined : { duration: 25, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="min-w-0 text-center sm:text-left xl:text-center"
                >
                  <div
                    className="mx-auto inline-flex items-end justify-center gap-3 rounded-[2rem] border px-5 py-4 shadow-xl backdrop-blur-xl sm:mx-0 xl:mx-auto"
                    style={{
                      background: isLight
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,237,213,0.66))'
                        : 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(34,211,238,0.08))',
                      borderColor: isLight ? 'rgba(217,119,6,0.30)' : 'rgba(251,146,60,0.26)'
                    }}
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.22, stiffness: 400 }}
                      className="font-display text-7xl font-black leading-none text-gradient-fire sm:text-8xl xl:text-7xl 2xl:text-8xl"
                    >
                      {stats.racha}
                    </motion.span>
                    <span className="pb-2 font-display text-lg font-black uppercase tracking-[0.16em]" style={{ color: accentWarm }}>
                      {stats.racha === 1 ? 'día' : 'días'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start xl:justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]" style={{
                      color: accentFire,
                      borderColor: isLight ? 'rgba(217,119,6,0.30)' : 'rgba(251,146,60,0.30)',
                      backgroundColor: isLight ? 'rgba(255,247,237,0.82)' : 'rgba(251,146,60,0.10)'
                    }}>
                      <Star className="h-3.5 w-3.5" />
                      {streakTier}
                    </span>
                    {stats.racha > 0 && (
                      <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]" style={{
                        color: isLight ? '#047857' : '#34d399',
                        borderColor: isLight ? 'rgba(4,120,87,0.22)' : 'rgba(16,185,129,0.30)',
                        backgroundColor: isLight ? 'rgba(236,253,245,0.72)' : 'rgba(16,185,129,0.10)'
                      }}>
                        <Zap className="h-3.5 w-3.5" />
                        +{stats.racha * 5} XP
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className={`streak-status-ribbon streak-status-ribbon--${streakState} w-full rounded-2xl p-3 text-left shadow-lg`}
                style={{
                  '--streak-accent': accentFire,
                  '--streak-secondary': isLight ? '#f59e0b' : '#fbbf24',
                  '--streak-text': headingText,
                  '--streak-muted': helperText,
                  border: `1px solid ${statusAccent}55`,
                  background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.65)',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <div className="streak-status-ribbon__icon shrink-0 shadow-lg" style={{ background: `linear-gradient(135deg, ${statusAccent}, ${isLight ? '#f59e0b' : '#22d3ee'})`}}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-black uppercase tracking-[0.18em]" style={{ color: headingText }}>{streakStatus.title}</p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={streakState}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-1 text-xs font-gameui leading-relaxed"
                      style={{ color: helperText }}
                    >
                      {streakStatus.body}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>

              <div className="mt-auto">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: helperText }}>
                    Últimos 7 días
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: accentFire }}>
                    {actividadReciente}/7
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {ultimosSieteDias.map((dia, index) => (
                    <motion.div
                      key={dia.fecha}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * index }}
                      className="rounded-2xl border px-1.5 py-2 text-center"
                      style={{
                        borderColor: dia.activo ? 'rgba(251,146,60,0.42)' : (isLight ? 'rgba(198,122,29,0.16)' : 'rgba(255,255,255,0.08)'),
                        background: dia.activo
                          ? 'linear-gradient(145deg, rgba(251,191,36,0.95), rgba(249,115,22,0.86), rgba(225,29,72,0.78))'
                          : (isLight ? 'rgba(255,255,255,0.58)' : 'rgba(15,23,42,0.48)'),
                        color: dia.activo ? '#fff7ed' : helperText,
                      }}
                    >
                      <p className="text-[9px] font-black uppercase tracking-wider">{dia.etiqueta}</p>
                      <p className="font-display text-sm font-black leading-tight">{dia.dia}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 24 }}
            className="flex min-w-0 flex-col gap-4 xl:col-span-8 xl:min-h-[calc(100vh-10rem)]"
          >
            <div className="grid gap-3 sm:grid-cols-3">
              {statCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16 + index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
                  className="glass-card-apple dagon-compact-card relative overflow-hidden rounded-2xl border p-4"
                  style={{
                    borderColor: `${card.accent}44`,
                    background: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(15,23,42,0.54)',
                  }}
                >
                  <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, ${card.accent}16)` }} />
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" style={{ color: card.accent, borderColor: `${card.accent}44`, backgroundColor: `${card.accent}16` }}>
                      {card.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: helperText }}>{card.label}</p>
                      <p className="truncate font-display text-xl font-black leading-tight" style={{ color: headingText }}>{card.value}</p>
                      <p className="truncate text-[11px] font-gameui" style={{ color: helperText }}>{card.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="streak-calendar-panel relative flex flex-1 flex-col overflow-hidden rounded-3xl border p-4 shadow-sm sm:p-5 lg:p-6" style={panelStyle}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: isLight ? 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent 35%)' : 'linear-gradient(180deg, rgba(251,146,60,0.05), transparent 35%)' }} />
              
              <div className="relative z-10 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <CalendarCheck className="h-5 w-5 shrink-0" style={{ color: accentFire }} />
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-black uppercase tracking-wide" style={{ color: headingText }}>Historial mensual</h3>
                    <p className="text-xs font-gameui" style={{ color: helperText }}>
                      {nextMilestone.reward} · {stats.racha}/{nextMilestone.days} días
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 self-start rounded-2xl p-1.5 backdrop-blur-sm lg:self-auto" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.64)' : 'rgba(30,41,59,0.60)' }}>
                  <button type="button" onClick={mesAnterior} className="rounded-xl p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5" aria-label="Mes anterior">
                    <ChevronLeft className="h-5 w-5" style={{ color: helperText }} />
                  </button>
                  <span className="min-w-[136px] px-3 text-center font-display text-sm font-black sm:min-w-[168px] sm:text-base" style={{ color: accentFire }}>
                    {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                  </span>
                  <button type="button" onClick={mesSiguiente} disabled={!tieneSiguiente()} className={`rounded-xl p-2 transition-colors ${tieneSiguiente() ? 'hover:bg-black/5 dark:hover:bg-white/5' : 'opacity-30 cursor-not-allowed'}`} aria-label="Mes siguiente">
                    <ChevronRight className="h-5 w-5" style={{ color: tieneSiguiente() ? helperText : (isLight ? '#c4b29a' : '#475569') }} />
                  </button>
                </div>
              </div>

              <div className="relative z-10 mb-3 grid grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border px-3 py-3" style={{ borderColor: isLight ? 'rgba(198,122,29,0.15)' : 'rgba(255,255,255,0.08)', backgroundColor: isLight ? 'rgba(255,255,255,0.48)' : 'rgba(15,23,42,0.38)' }}>
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: helperText }}>Progreso a meta</span>
                    <span className="font-display text-xs font-black" style={{ color: accentFire }}>{Math.round(msProgress)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: isLight ? 'rgba(120,53,15,0.10)' : 'rgba(255,255,255,0.08)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${msProgress}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.25 }}
                      className="h-full"
                      style={{ background: isLight ? 'linear-gradient(90deg, #ea580c, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #fb923c, #22d3ee)' }}
                    />
                  </div>
                </div>
                <div className="hidden min-w-[7rem] border-l pl-4 text-right sm:block" style={{ borderColor: isLight ? 'rgba(198,122,29,0.15)' : 'rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.20em]" style={{ color: helperText }}>Récord</p>
                  <p className="font-display text-lg font-black" style={{ color: headingText }}>{Math.round(progresoRecord)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 relative z-10">
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia} className="py-1 text-center text-[10px] font-black uppercase tracking-widest sm:text-xs" style={{ color: helperText }}>
                    {dia}
                  </div>
                ))}
              </div>

              <div className="relative z-10 grid flex-1 grid-cols-7 gap-1.5 sm:gap-2">
                {diasEnMes.map((dia, idx) => {
                  const esDiaDeRacha = dia.fecha && diasConsecutivos.includes(dia.fecha);
                  const esRachaActivo = esDiaDeRacha && dia.tieneActividad;
                  const esHoyActual = dia.fecha === esHoy;
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.01, duration: 0.3 }}
                      className={`streak-calendar-day !min-h-[2.25rem] h-9 sm:h-10 lg:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-display font-black relative overflow-hidden transition-transform hover:scale-105 ${
                        !dia.num ? 'invisible' : ''
                      } ${esRachaActivo ? 'is-streak' : ''} ${esHoyActual ? 'is-today shadow-xl ring-2 ring-orange-500/50' : ''} ${esHoyActual && rachaEnRiesgo ? 'is-danger' : ''} ${esHoyActual && tieneActividadHoy ? 'is-complete' : ''}`}
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
                                  ? (isLight ? 'rgba(255,247,237,0.95)' : 'rgba(34,211,238,0.12)')
                                  : (isLight ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.5)'),
                        borderColor: !dia.num
                          ? 'transparent'
                          : esRachaActivo
                            ? 'rgba(255,255,255,0.2)'
                            : esHoyActual
                              ? (isLight ? 'rgba(194,95,26,0.4)' : 'rgba(34,211,238,0.4)')
                              : (isLight ? 'rgba(198,122,29,0.15)' : 'rgba(255,255,255,0.08)'),
                        color: !dia.num
                          ? undefined
                          : esRachaActivo || esDiaDeRacha || dia.tieneActividad
                            ? '#fff7ed'
                            : esHoyActual
                              ? (isLight ? '#9a4a16' : '#67e8f9')
                              : (isLight ? '#8b6f4e' : '#64748b'),
                        boxShadow: esRachaActivo ? '0 0 15px rgba(249,115,22,0.4)' : undefined
                      }}
                    >
                      {dia.num}
                      
                      {esRachaActivo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <Flame className="h-4 w-4 text-white/80 fill-current drop-shadow-md sm:h-5 sm:w-5" />
                        </div>
                      )}
                      
                      {dia.tieneActividad && !esRachaActivo && (
                        <Flame className="absolute bottom-1 h-3 w-3 text-white/40 pointer-events-none sm:h-3.5 sm:w-3.5" />
                      )}

                      {esHoyActual && rachaEnRiesgo && (
                        <div className="absolute bottom-0.5 right-0.5">
                          <ShieldAlert className="h-3.5 w-3.5 text-red-500 drop-shadow" />
                        </div>
                      )}

                      {esHoyActual && tieneActividadHoy && (
                        <div className="absolute bottom-0.5 right-0.5">
                          <CalendarCheck className="h-3.5 w-3.5 text-emerald-400 drop-shadow" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: isLight ? 'rgba(198,122,29,0.15)' : 'rgba(255,255,255,0.08)' }}>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-rose-600 shadow-sm" />
                    <span style={{ color: helperText }}>Racha</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-orange-600 to-rose-700 shadow-sm" />
                    <span style={{ color: helperText }}>Activo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-dashed" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(30,41,59,0.42)', borderColor: helperText }} />
                    <span style={{ color: helperText }}>Sin actividad</span>
                  </div>
                </div>
                <span className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider sm:text-sm" style={{ color: accentFire, backgroundColor: isLight ? 'rgba(234,88,12,0.1)' : 'rgba(251,146,60,0.1)' }}>
                  {diasActivosEsteMes} días activos
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
