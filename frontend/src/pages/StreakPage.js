import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Flame, Trophy, Zap, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { DagonMascot } from '../components/DagonMascot';

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
        if (data.success) {
          setStats(data);
        }
      } catch (error) {
        toast.error('Error al cargar tu racha');
      } finally {
        setLoading(false);
      }
    };
    fetchStreakStats();
  }, [user, token]);

  // --- LÓGICA DE CALENDARIO CORREGIDA ---
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  // Obtenemos el día real (0 = Domingo, 1 = Lunes, etc.)
  const today = new Date().getDay();
  // Lo ajustamos para que nuestro Lunes sea el índice 0 y Domingo el 6
  const currentDayIndex = today === 0 ? 6 : today - 1; 

  if (loading) {
    return <div className="min-h-screen cyber-bg flex items-center justify-center text-orange-400">Despertando el fuego...</div>;
  }

  return (
    <div className="min-h-screen cyber-bg grid-pattern flex flex-col overflow-hidden" data-testid="streak-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col relative">
        
        <div className="flex items-center mb-4 z-10">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Dashboard
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center z-10">
          
          {/* EL NUEVO DAGON FURIOSO CON AURA DE FUEGO */}
          <div className="relative flex justify-center items-center mb-6">
            {/* Aura palpitante trasera */}
            {stats.racha > 0 && (
              <motion.div 
                className="absolute w-40 h-40 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-full blur-[50px] opacity-60"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            
            <motion.div
              animate={stats.racha > 0 ? { y: [-5, 5, -5] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              {/* Le pasamos mood fierce por si luego quieres modificar el SVG interno de tu mascota */}
              <DagonMascot size="large" mood={stats.racha > 0 ? "fierce" : "sad"} />
            </motion.div>
          </div>

          {/* CONTADOR GIGANTE CON DEGRADADO */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mb-12"
          >
            <h1 className="text-9xl font-black mb-0 tracking-tighter bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 bg-clip-text text-transparent drop-shadow-[0_5px_15px_rgba(239,68,68,0.3)]">
              {stats.racha}
            </h1>
            <p className="text-3xl font-black text-orange-400 uppercase tracking-[0.3em] mt-2 drop-shadow-md">
              Días de Racha
            </p>
            <p className="text-slate-300 mt-6 text-xl max-w-lg mx-auto font-medium">
              {stats.racha > 0 
                ? "¡Dagon está imparable! Vuelve mañana para alimentar la bestia." 
                : "El fuego se ha apagado. ¡Completa una misión hoy para despertar a Dagon!"}
            </p>
          </motion.div>

          {/* TARJETAS MEJORADAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-card-apple rounded-2xl p-6 border-2 border-slate-700/50 flex items-center gap-5 bg-slate-900/60 shadow-xl relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full"></div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-600/20 border border-yellow-500/40 flex items-center justify-center shadow-inner">
                <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-md" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Tu Récord</p>
                <p className="text-4xl font-black text-white">{stats.mejor_racha} <span className="text-xl text-slate-500 font-bold">días</span></p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="glass-card-apple rounded-2xl p-6 border-2 border-slate-700/50 flex flex-col justify-center bg-slate-900/60 shadow-xl"
            >
              <div className="flex justify-between items-center mb-4 text-slate-300 text-sm font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400"/> Esta semana</span>
              </div>
              <div className="flex justify-between w-full">
                {weekDays.map((day, index) => {
                  // NUEVA LÓGICA: Encendemos solo si el día es hoy o anterior, Y está dentro de la racha actual
                  const isLit = index <= currentDayIndex && index > (currentDayIndex - stats.racha);
                  const isToday = index === currentDayIndex;

                  return (
                    <motion.div 
                      key={index} 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isLit 
                          ? 'bg-gradient-to-b from-orange-400 to-red-600 border-orange-300 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)]' 
                          : isToday 
                            ? 'bg-slate-800/80 border-slate-500 text-slate-400' 
                            : 'bg-slate-800/30 border-slate-700/50 text-slate-600'
                      }`}>
                        {isLit ? <Flame className="w-5 h-5 drop-shadow-md" /> : ''}
                        
                        {/* Indicador del día actual */}
                        {isToday && !isLit && <div className="w-2 h-2 bg-slate-400 rounded-full absolute -bottom-4"></div>}
                        {isToday && isLit && <div className="w-2 h-2 bg-orange-500 rounded-full absolute -bottom-4 shadow-[0_0_5px_rgba(249,115,22,1)]"></div>}
                      </div>
                      <span className={`text-xs font-black mt-1 ${isToday ? 'text-white' : 'text-slate-500'}`}>{day}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};