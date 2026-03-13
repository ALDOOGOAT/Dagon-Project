import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { QuickPracticeMode } from '../components/QuickPracticeMode';
import { apiService } from '../services/apiService';
import { Zap, Flame, Lock, Trophy, LogOut, Target } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const DashboardPage = () => {
  // ¡NUEVO: Sacamos el token de la mochila!
  const { user, token, logout, updateUserXP } = useAuth();
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickPractice, setShowQuickPractice] = useState(false);

  // --- VARIABLES SEGURAS (FALLBACKS) ---
  const userXP = user?.xp || 0;
  const xpFaltante = 100 - (userXP % 100);
  const [userRank, setUserRank] = useState('-');
  const [userStreak, setUserStreak] = useState(0); 

  // Sistema de Títulos RPG basado en XP
  const getPlayerTitle = (xp) => {
    if (xp < 100) return 'Novato del SELECT';
    if (xp < 300) return 'Explorador de Tablas';
    if (xp < 600) return 'Guerrero de los JOINs';
    if (xp < 1000) return 'Caballero de Datos';
    return 'Maestro Arquitecto SQL';
  };

  useEffect(() => {
    const fetchRealXP = async () => {
      try {
        const miUsuarioId = user?.idUsuario; 
        
        if (!miUsuarioId) return; 
        
        const response = await fetch(`http://localhost:8080/api/usuarios/${miUsuarioId}/stats`, {
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        });
        const data = await response.json();
        
        if (data.success) {
          updateUserXP(data.xp); 
          setUserRank(data.posicion); 
          setUserStreak(data.racha); 
        } else {
          toast.error('Error al cargar tu XP real desde el servidor');
        }
      } catch (error) {
        console.error("Error al cargar la XP del servidor", error);
      }
    };
    
    fetchRealXP();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const loadLevels = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/levels', {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      setLevels(data.levels);
    } catch (error) {
      toast.error('Error al cargar niveles desde el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    //eslint-disable-next-line react-hooks/exhaustive-deps
    loadLevels();
  }, []);

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
      {showQuickPractice && (
        <QuickPracticeMode
          userLevel={user?.level || 'nivel-0'}
          userXP={userXP}
          userStreak={userStreak}
          onXPGain={(xp) => updateUserXP(userXP + xp)}
          onClose={() => setShowQuickPractice(false)}
        />
      )}
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-start mb-8">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            <motion.h1 
              className="text-5xl font-bold mb-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
              animate={{
                backgroundPosition: ['0% center', '100% center', '0% center'],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 bg-clip-text text-transparent bg-size-200 animate-gradient">
                ¡Hola, {user?.nombre || 'usuario'}!
              </span>
            </motion.h1>
            
            <div className="inline-block bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50 text-blue-300 px-3 py-1 rounded-full text-sm font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(37,99,235,0.3)] backdrop-blur-sm">
              {getPlayerTitle(userXP)}
            </div>
            
            <p className="text-slate-400 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Continúa tu viaje en las profundidades del SQL
            </p>
          </motion.div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowQuickPractice(true)}
              data-testid="quick-practice-button"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
            >
              <Target className="w-4 h-4 mr-2" />
              Práctica Rápida
            </Button>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Tarjeta de XP */}
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
                <p className="text-3xl font-bold text-white" data-testid="user-xp">{userXP}</p>
              </div>
            </div>
            <Progress value={(userXP % 100)} className="h-2 bg-slate-800" />
            <p className="text-slate-500 text-xs mt-2">{xpFaltante} XP para siguiente nivel</p>
            <p className="text-blue-400 text-xs mt-2 font-medium">Click para ver detalles →</p>
          </div>

          {/* Tarjeta de Racha - ¡AQUÍ ESTÁ EL CAMBIO A /streak! */}
          <div 
            onClick={() => navigate('/streak')}
            className="glass-card rounded-xl p-6 border border-slate-700/50 cursor-pointer hover:border-orange-500/50 hover:shadow-[0_0_25px_rgba(249,115,22,0.2)] transition-all duration-300"
            data-testid="streak-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Racha Actual</p>
                <p className="text-3xl font-bold text-white" data-testid="user-streak">{userStreak} días</p>
              </div>
            </div>
            <p className="text-orange-400 text-xs mt-4 font-medium">Click para ver estadísticas →</p>
          </div>

          {/* Tarjeta de Leaderboard */}
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
                <p className="text-slate-400 text-sm">Tu Posición Global</p>
                <p className="text-3xl font-bold text-white">#{userRank}</p>
              </div>
            </div>
            <p className="text-yellow-400 text-xs mt-4 font-medium">Click para ver ranking →</p>
          </div>
        </div>

        {/* Mapa de Niveles */}
        <div className="glass-card rounded-2xl p-8 border border-slate-700/50">
          <div className="flex items-center gap-4 mb-8">
            <DagonMascot size="small" mood="happy" />
            <div>
              <h2 className="text-3xl font-bold text-white">
                Mapa de Niveles
              </h2>
          <p className="text-slate-400">
            {levels.length > 0 ? 'Elige tu próxima misión para continuar' : 'Aún no hay niveles disponibles'}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};