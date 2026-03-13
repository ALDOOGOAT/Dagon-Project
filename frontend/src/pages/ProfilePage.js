import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, BookOpen, Code, Flame, Trophy, Target, Award, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    xp: 0, ejercicios_completados: 0, consultas_totales: 0, 
    racha: 0, mejor_racha: 0, distribucion_xp: []
  });
  const [loading, setLoading] = useState(true);

  // Sistema de niveles (cada 100 XP es un nivel)
  const userLevel = Math.floor(stats.xp / 100) + 1;
  const xpCurrentLevel = stats.xp % 100;
  
  useEffect(() => {
    const fetchProfileStats = async () => {
      if (!user?.idUsuario) return;
      try {
        const response = await fetch(`http://localhost:8080/api/usuarios/${user.idUsuario}/stats`, {
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
  }, [user, token]);

  // Lógica de validación de logros
  const achievements = [
    {
      id: 'first_query', title: 'Primera Consulta', desc: 'Completaste tu primer ejercicio',
      icon: <Target className="w-6 h-6 text-red-400" />, xpReward: '+10 XP',
      unlocked: stats.ejercicios_completados >= 1, color: 'border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
    },
    {
      id: 'streak_3', title: 'Racha de 3', desc: 'Mantén 3 días de racha',
      icon: <Flame className="w-6 h-6 text-orange-400" />, xpReward: '+50 XP',
      unlocked: stats.racha >= 3 || stats.mejor_racha >= 3, color: 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
    },
    {
      id: 'master_select', title: 'Maestro SELECT', desc: 'Alcanza 100 XP totales',
      icon: <BookOpen className="w-6 h-6 text-blue-400" />, xpReward: '+100 XP',
      unlocked: stats.xp >= 100, color: 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
    }
  ];

  // Diccionario para traducir el número de dificultad a palabras y colores
  const getDifficultyStyles = (level) => {
    const styles = {
      1: { name: 'Básico', color: 'bg-green-500', text: 'text-green-400' },
      2: { name: 'Intermedio', color: 'bg-blue-500', text: 'text-blue-400' },
      3: { name: 'Avanzado', color: 'bg-purple-500', text: 'text-purple-400' },
      4: { name: 'Experto', color: 'bg-orange-500', text: 'text-orange-400' },
      5: { name: 'Maestro', color: 'bg-red-500', text: 'text-red-400' }
    };
    return styles[level] || { name: `Nivel ${level}`, color: 'bg-slate-500', text: 'text-slate-400' };
  };

  if (loading) {
    return <div className="min-h-screen cyber-bg flex items-center justify-center text-blue-400">Analizando tu poder...</div>;
  }

  return (
    <div className="min-h-screen cyber-bg grid-pattern" data-testid="profile-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in-up">
        
        <div className="flex items-center mb-8">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tarjeta de Nivel Principal */}
            <div className="glass-card-apple rounded-2xl p-8 border border-slate-700/50 flex items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl flex items-center justify-center border border-blue-500/50 shadow-inner relative z-10">
                <span className="text-5xl drop-shadow-md">👾</span>
                <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-black px-3 py-1 rounded-lg shadow-lg border border-yellow-300">
                  Lvl {userLevel}
                </div>
              </div>
              <div className="flex-1 z-10">
                <h1 className="text-3xl font-black text-white mb-2 tracking-wide">{user?.nombre || user?.email}</h1>
                <div className="flex justify-between text-sm mb-2 font-bold">
                  <span className="text-slate-400 uppercase tracking-widest text-xs">Progreso al Nivel {userLevel + 1}</span>
                  <span className="text-blue-400">{xpCurrentLevel} / 100 XP</span>
                </div>
                <Progress value={xpCurrentLevel} className="h-3 bg-slate-800 border border-slate-700" />
              </div>
              <div className="text-right z-10">
                <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-sm">
                  {stats.xp}
                </p>
                <p className="text-slate-500 text-xs uppercase tracking-widest font-black mt-1">XP Totales</p>
              </div>
            </div>

            {/* Grid de Estadísticas Rápidas */}
            <div className="glass-card-apple rounded-2xl p-8 border border-slate-700/50">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                <Target className="text-blue-400" /> Resumen de Batalla
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-5 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-3 text-slate-300 font-bold"><BookOpen className="text-emerald-400" /> Completados</div>
                  <span className="text-2xl font-black text-white">{stats.ejercicios_completados}</span>
                </div>
                <div className="flex items-center justify-between p-5 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-colors">
                  <div className="flex items-center gap-3 text-slate-300 font-bold"><Code className="text-blue-400" /> Consultas</div>
                  <span className="text-2xl font-black text-white">{stats.consultas_totales}</span>
                </div>
                <div className="flex items-center justify-between p-5 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-orange-500/30 transition-colors">
                  <div className="flex items-center gap-3 text-slate-300 font-bold"><Flame className="text-orange-500" /> Racha Actual</div>
                  <span className="text-2xl font-black text-white">{stats.racha}</span>
                </div>
                <div className="flex items-center justify-between p-5 bg-slate-900/60 rounded-xl border border-slate-700/50 hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-3 text-slate-300 font-bold"><Trophy className="text-yellow-500" /> Mejor Racha</div>
                  <span className="text-2xl font-black text-white">{stats.mejor_racha}</span>
                </div>
              </div>
            </div>

            {/* ¡NUEVO! Distribución de XP */}
            <div className="glass-card-apple rounded-2xl p-8 border border-slate-700/50">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                <BarChart3 className="text-purple-400" /> Origen del Poder (Distribución XP)
              </h2>
              <div className="space-y-5">
                {stats.distribucion_xp && stats.distribucion_xp.length > 0 ? (
                  stats.distribucion_xp.map((item, index) => {
                    const style = getDifficultyStyles(item.dificultad);
                    // Calculamos el porcentaje basado en la XP total
                    const percent = Math.round((item.xp_ganada / stats.xp) * 100);
                    
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm font-bold mb-2">
                          <span className={style.text}>{style.name}</span>
                          <span className="text-slate-300">{item.xp_ganada} XP <span className="text-slate-600 font-normal">({percent}%)</span></span>
                        </div>
                        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full ${style.color} shadow-[0_0_10px_currentColor]`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 text-center py-4 font-medium">Resuelve ejercicios para ver tu análisis de XP.</p>
                )}
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Logros */}
          <div className="space-y-6">
            <div className="glass-card-apple rounded-2xl p-8 border border-slate-700/50 h-full">
              <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                <Award className="text-yellow-400" /> Trofeos
              </h2>
              
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <motion.div 
                    whileHover={achievement.unlocked ? { scale: 1.02 } : {}}
                    key={achievement.id}
                    className={`relative overflow-hidden rounded-xl p-4 border-2 transition-all duration-300 ${
                      achievement.unlocked 
                        ? achievement.color 
                        : 'border-slate-800 bg-slate-900/30 opacity-60 grayscale'
                    }`}
                  >
                    <div className="flex gap-4 items-center">
                      <div className={`p-3 rounded-lg ${achievement.unlocked ? 'bg-slate-900/50' : 'bg-transparent'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-white text-sm">{achievement.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mb-2 font-medium">{achievement.desc}</p>
                        <p className="text-xs font-black text-yellow-500">{achievement.xpReward}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};