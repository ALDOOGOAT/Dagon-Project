import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DagonMascot } from '../components/DagonMascot';
import { ArrowLeft, Flame, Trophy, Sparkles, Target, ChevronLeft, ChevronRight, Zap, PartyPopper, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

export const StreakPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ racha: 0, mejor_racha: 0, fechas_actividad: [] });
  const [loading, setLoading] = useState(true);
  const [mesActual, setMesActual] = useState(new Date());

  useEffect(() => {
    const fetchStreakStats = async () => {
      if (!user?.idUsuario) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/usuarios/${user.idUsuario}/stats`, {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
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

  return (
    <div className="min-h-screen bg-slate-950" data-testid="streak-page">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center mb-6"
        >
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-slate-400 hover:text-white">
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
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900" />
            
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent_70%)]" />
              <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(239,68,68,0.1),transparent_50%)]" />
            </motion.div>

            <div className="relative z-10 p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
                <div className="relative">
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
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="inline-flex items-center gap-4 bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 px-6 py-4 rounded-2xl">
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
                        className="font-display text-8xl lg:text-9xl font-black text-gradient-fire"
                      >
                        {stats.racha}
                      </motion.span>
                    </div>
                    
                    <p className="font-display text-2xl lg:text-3xl font-black uppercase tracking-[0.15em] text-orange-300 mt-3">
                      {stats.racha === 1 ? 'día' : 'días'} de racha
                    </p>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-300 mt-4 text-lg font-gameui"
                  >
                    {stats.racha >= 7 ? "¡Imparable! Leyenda del SQL" :
                     stats.racha >= 3 ? "¡El fuego arde! Sigue así" :
                     stats.racha > 0 ? "¡Vamos bien! Mantén el momentum" :
                     "¡Nueva aventura te espera hoy!"}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-6"
                  >
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-xl">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span className="font-display font-black text-amber-200">Mejor: {stats.mejor_racha}</span>
                    </div>
                    
                    {stats.racha > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl"
                      >
                        <Zap className="w-5 h-5 text-emerald-400" />
                        <span className="font-display font-black text-emerald-200">+{stats.racha * 5} XP diario</span>
                      </motion.div>
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
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-display text-xl font-black text-white uppercase tracking-wide">Calendario</h3>
                </div>
                
                <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1">
                  <button
                    onClick={mesAnterior}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <span className="px-4 font-display font-black text-cyan-300 min-w-[160px] text-center">
                    {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                  </span>
                  <button
                    onClick={mesSiguiente}
                    disabled={!tieneSiguiente()}
                    className={`p-2 rounded-lg transition-colors ${
                      tieneSiguiente() ? 'hover:bg-slate-700' : 'opacity-30 cursor-not-allowed'
                    }`}
                  >
                    <ChevronRight className={`w-5 h-5 ${tieneSiguiente() ? 'text-slate-400' : 'text-slate-600'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {DIAS_SEMANA.map((dia) => (
                  <div key={dia} className="text-center text-xs font-black text-slate-500 uppercase tracking-widest py-2">
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
                        esRachaActivo ? 'rounded-xl bg-gradient-to-br from-yellow-400 via-orange-500 to-rose-600 shadow-[0_0_15px_rgba(249,115,22,0.7)]' :
                        esDiaDeRacha ? 'rounded-xl bg-gradient-to-br from-orange-700 to-orange-800 border border-orange-500/30' :
                        dia.tieneActividad ? 'rounded-xl bg-gradient-to-br from-orange-600 to-rose-700 border border-orange-400/40' :
                        esHoyActual ? 'rounded-xl bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300' :
                        'rounded-xl bg-slate-800/40 border border-white/5 text-slate-600'
                      }`}
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

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-yellow-400 via-orange-500 to-rose-600" />
                    <span className="text-slate-400">Racha</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-600 to-rose-700" />
                    <span className="text-slate-400">Activo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-800/40 border border-white/5" />
                    <span className="text-slate-400">Sin actividad</span>
                  </div>
                </div>
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
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
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-fuchsia-300">Próximo Meta</span>
              </div>
              <p className="font-display font-black text-xl text-white">{nextMilestone.label}</p>
              <p className="text-slate-400 text-sm mb-4">{nextMilestone.reward}</p>
              
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${msProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                />
              </div>
              <p className="text-slate-500 text-xs mt-2 text-right">
                {stats.racha}/{nextMilestone.days} días ({Math.round(msProgress)}%)
              </p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-300">Récord</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-black text-gradient-gold">{stats.mejor_racha}</span>
                <span className="text-slate-400 text-lg font-bold">días</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};