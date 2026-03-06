import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { apiService } from '../services/apiService';
import { Zap, Flame, Lock, Trophy, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    loadLevels();
    
    // Mostrar tutorial solo en primera visita
    const tutorialCompleted = localStorage.getItem('dagon_tutorial_completed');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  const loadLevels = async () => {
    try {
      const data = await apiService.getLevels();
      setLevels(data.levels);
    } catch (error) {
      toast.error('Error al cargar niveles');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelClick = (level) => {
    if (level.locked) {
      toast.error('Este nivel aún está bloqueado');
      return;
    }
    navigate(`/exercise/${level.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Sesión cerrada');
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('dagon_tutorial_completed', 'true');
  };

  if (loading) {
    return (
      <div className="min-h-screen abyss-bg flex items-center justify-center">
        <DagonMascot size="large" mood="happy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-bg grid-pattern" data-testid="dashboard-page">
      {showTutorial && <TutorialOverlay onComplete={() => setShowTutorial(false)} />}
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              ¡Hola, {user?.name}!
            </h1>
            <p className="text-slate-400 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Continúa tu viaje en las profundidades del SQL
            </p>
          </div>
          <Button
            onClick={handleLogout}
            data-testid="logout-button"
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Salir
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div 
            onClick={() => navigate('/profile')}
            className="glass-card rounded-xl p-6 border border-slate-700/50 cursor-pointer hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all duration-300"
            data-testid="xp-card"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Puntos XP</p>
                <p className="text-3xl font-bold text-white" data-testid="user-xp">{user?.xp || 0}</p>
              </div>
            </div>
            <Progress value={(user?.xp % 100)} className="h-2 bg-slate-800" />
            <p className="text-slate-500 text-xs mt-2">{100 - (user?.xp % 100)} XP para siguiente nivel</p>
            <p className="text-blue-400 text-xs mt-2 font-medium">Click para ver detalles →</p>
          </div>

          <div 
            onClick={() => navigate('/profile')}
            className="glass-card rounded-xl p-6 border border-slate-700/50 cursor-pointer hover:border-orange-500/50 hover:shadow-[0_0_25px_rgba(249,115,22,0.2)] transition-all duration-300"
            data-testid="streak-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Racha Actual</p>
                <p className="text-3xl font-bold text-white" data-testid="user-streak">{user?.streak || 0} días</p>
              </div>
            </div>
            <p className="text-orange-400 text-xs mt-4 font-medium">Click para ver estadísticas →</p>
          </div>

          <div 
            onClick={() => navigate('/leaderboard')}
            className="glass-card rounded-xl p-6 border border-slate-700/50 cursor-pointer hover:border-yellow-500/50 hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] transition-all duration-300"
            data-testid="leaderboard-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Tu Posición</p>
                <p className="text-3xl font-bold text-white">#-</p>
              </div>
            </div>
            <p className="text-yellow-400 text-xs mt-4 font-medium">Click para ver ranking →</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-slate-700/50">
          <div className="flex items-center gap-4 mb-8">
            <DagonMascot size="small" mood="happy" />
            <div>
              <h2 className="text-3xl font-bold text-white">
                Mapa de Niveles
              </h2>
              <p className="text-slate-400">
                Selecciona un nivel para comenzar
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {levels.map((level, index) => (
              <div
                key={level.id}
                data-testid={`level-card-${level.id}`}
                onClick={() => handleLevelClick(level)}
                className={`
                  relative p-6 rounded-xl border transition-all duration-300 cursor-pointer
                  ${
                    level.locked
                      ? 'bg-slate-900/30 border-slate-800 opacity-50 cursor-not-allowed'
                      : 'glass-card border-slate-700/50 hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)]'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                        w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold
                        ${
                          level.locked
                            ? 'bg-slate-800 text-slate-600'
                            : 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg neon-glow'
                        }
                      `}
                    >
                      {level.locked ? <Lock className="w-8 h-8" /> : index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {level.name}
                      </h3>
                      <p className="text-slate-400">
                        {level.description}
                      </p>
                    </div>
                  </div>
                  {!level.locked && (
                    <Button
                      data-testid={`start-level-${level.id}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold neon-glow"
                    >
                      Comenzar
                    </Button>
                  )}
                </div>
                {index < levels.length - 1 && (
                  <div className="absolute left-8 -bottom-4 w-0.5 h-8 bg-gradient-to-b from-blue-500/30 to-transparent" />
                )}
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};