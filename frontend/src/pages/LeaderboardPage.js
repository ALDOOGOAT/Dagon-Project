import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Trophy, Medal, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { DagonMascot } from '../components/DagonMascot';

export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth(); // Sacamos el pasaporte y al usuario actual
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/usuarios/ranking', {
          headers: {
            'Authorization': `Bearer ${token}` // Le mostramos el pasaporte al cadenero
          }
        });
        
        if (!response.ok) throw new Error('Error al cargar ranking');
        
        const data = await response.json();
        setRanking(data);
      } catch (error) {
        toast.error('No se pudo cargar el Salón de la Fama');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchRanking();
    }
  }, [token]);

  // Función para darle color a los trofeos según la posición
  const getRankStyle = (index) => {
    switch(index) {
      case 0: return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" /> };
      case 1: return { color: 'text-slate-300', bg: 'bg-slate-300/10', icon: <Medal className="w-7 h-7 text-slate-300" /> };
      case 2: return { color: 'text-amber-600', bg: 'bg-amber-600/10', icon: <Medal className="w-7 h-7 text-amber-600" /> };
      default: return { color: 'text-blue-400', bg: 'bg-slate-800/50', icon: <span className="font-bold text-lg text-slate-500">{index + 1}</span> };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <DagonMascot size="large" mood="excited" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-bg grid-pattern" data-testid="leaderboard-page">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Botón de volver */}
        <div className="flex items-center mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Dashboard
          </Button>
        </div>

        {/* Cabecera */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
              <Trophy className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Salón de la Fama
          </h1>
          <p className="text-slate-400 text-lg">
            Los aventureros con mayor poder y conocimiento en SQL
          </p>
        </div>

        {/* Tabla de Ranking */}
        <div className="glass-card-apple rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50">
          <div className="bg-slate-900/80 px-8 py-4 flex text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
            <div className="w-24 text-center">Rango</div>
            <div className="flex-1">Aventurero</div>
            <div className="w-32 text-right">Puntos XP</div>
          </div>

          <div className="divide-y divide-slate-800/50">
            {ranking.length > 0 ? (
              ranking.map((jugador, index) => {
                const style = getRankStyle(index);
                const isMe = user?.nombre === jugador.nombre;

                return (
                  <div 
                    key={index} 
                    className={`flex items-center px-8 py-5 transition-colors hover:bg-slate-800/40 ${isMe ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
                  >
                    {/* Icono de posición */}
                    <div className="w-24 flex justify-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${style.bg}`}>
                        {style.icon}
                      </div>
                    </div>
                    
                    {/* Nombre del jugador */}
                    <div className="flex-1">
                      <p className={`text-xl font-bold ${isMe ? 'text-blue-400' : 'text-slate-200'}`}>
                        {jugador.nombre}
                        {isMe && <span className="ml-3 text-xs bg-blue-600 text-white px-2 py-1 rounded-full align-middle">TÚ</span>}
                      </p>
                    </div>

                    {/* Puntos XP */}
                    <div className="w-32 text-right">
                      <p className={`text-2xl font-black ${style.color}`}>
                        {jugador.xp_total}
                      </p>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">XP</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-500">
                Aún no hay aventureros en el Salón de la Fama. ¡Sé el primero en resolver una misión!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};