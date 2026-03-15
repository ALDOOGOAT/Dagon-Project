import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { ArrowLeft, Trophy, Medal, Zap, Target, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/leaderboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setLeaderboardData(data);
        } else {
          toast.error("Error al cargar el Salón de la Fama");
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        toast.error("Error de conexión con el servidor");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchLeaderboard();
  }, [token]);

  // Animaciones para la lista
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1: return "bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-900 shadow-[0_0_30px_rgba(234,179,8,0.4)] border-yellow-400";
      case 2: return "bg-gradient-to-br from-slate-300 to-slate-500 text-slate-900 shadow-[0_0_20px_rgba(148,163,184,0.3)] border-slate-300";
      case 3: return "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 shadow-[0_0_20px_rgba(217,119,6,0.3)] border-amber-600";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6" />;
      case 2: return <Medal className="w-6 h-6" />;
      case 3: return <Medal className="w-6 h-6" />;
      default: return <span className="font-black text-lg">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
          <p className="text-blue-400 font-bold tracking-widest uppercase">Forjando la clasificación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-bg grid-pattern py-8" data-testid="leaderboard-page">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Cabecera */}
        <div className="flex items-center gap-4 mb-10">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <div className="h-8 w-px bg-slate-700"></div>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Salón de la Fama
            </h1>
            <p className="text-slate-400 text-sm mt-1">Los aventureros con mayor poder y conocimiento en SQL</p>
          </div>
        </div>

        {/* Lista del Ranking */}
        <div className="glass-card-apple rounded-3xl p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex justify-between items-center px-6 py-3 mb-4 border-b border-slate-700/50 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-20 text-center">Rango</div>
            <div className="flex-1">Aventurero</div>
            <div className="w-32 text-right">Misiones</div>
            <div className="w-32 text-right">Puntos XP</div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
            {leaderboardData.length === 0 ? (
              <p className="text-center text-slate-500 py-10 italic">Aún no hay aventureros en la base de datos.</p>
            ) : (
              leaderboardData.map((jugador) => {
                const isMe = user?.idUsuario === jugador.idUsuario;
                const isTop3 = jugador.rango <= 3;

                return (
                  <motion.div 
                    key={jugador.idUsuario} 
                    variants={itemVariants}
                    className={`flex items-center px-4 py-3 rounded-2xl border transition-all duration-300 ${
                      isMe 
                        ? 'bg-blue-900/40 border-blue-500/50 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)] scale-[1.02] my-4' 
                        : isTop3 
                          ? 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-800' 
                          : 'bg-transparent border-transparent hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Rango */}
                    <div className="w-20 flex justify-center">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl border ${getRankStyle(jugador.rango)}`}>
                        {getRankIcon(jugador.rango)}
                      </div>
                    </div>

                    {/* Nombre y Etiqueta (TÚ) */}
                    <div className="flex-1 flex items-center gap-3 px-4">
                      <span className={`font-bold text-lg ${isMe ? 'text-blue-400' : isTop3 ? 'text-white' : 'text-slate-300'}`}>
                        {jugador.nombre}
                      </span>
                      {isMe && (
                        <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md">
                          Tú
                        </span>
                      )}
                    </div>

                    {/* Misiones Resueltas */}
                    <div className="w-32 text-right flex items-center justify-end gap-2 text-slate-400 font-mono">
                      <Target className="w-4 h-4 text-slate-500" />
                      {jugador.misionesResueltas}
                    </div>

                    {/* Puntos XP */}
                    <div className="w-32 text-right flex items-center justify-end gap-2">
                      <span className={`font-black text-xl font-mono ${
                        jugador.rango === 1 ? 'text-yellow-500' : 
                        jugador.rango === 2 ? 'text-slate-300' : 
                        jugador.rango === 3 ? 'text-amber-500' : 
                        isMe ? 'text-blue-400' : 'text-slate-200'
                      }`}>
                        {jugador.xp}
                      </span>
                      <Zap className={`w-5 h-5 ${
                        jugador.rango === 1 ? 'text-yellow-500 fill-yellow-500/20' : 
                        jugador.rango === 2 ? 'text-slate-300 fill-slate-300/20' : 
                        jugador.rango === 3 ? 'text-amber-500 fill-amber-500/20' : 
                        isMe ? 'text-blue-400 fill-blue-400/20' : 'text-slate-600'
                      }`} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};