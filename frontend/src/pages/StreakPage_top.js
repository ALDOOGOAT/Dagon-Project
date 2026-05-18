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
      ? 'linear-gradient(155deg, rgba(255,248,238,0.94) 0%, rgba(255,240,222,0.92) 48%, rgba(250,228,192,0.86) 100%)'
      : 'linear-gradient(155deg, rgba(15,23,42,0.94) 0%, rgba(24,24,27,0.96) 46%, rgba(68,25,18,0.92) 100%)',
    borderColor: isLight ? 'rgba(198,122,29,0.24)' : 'rgba(249,115,22,0.18)',
    boxShadow: isLight
      ? '0 34px 90px -42px rgba(161, 98, 7, 0.42)'
      : '0 34px 90px -38px rgba(249,115,22,0.24)',
  };
  const panelStyle = {
    background: isLight ? 'rgba(255,248,238,0.78)' : 'rgba(15,23,42,0.56)',
