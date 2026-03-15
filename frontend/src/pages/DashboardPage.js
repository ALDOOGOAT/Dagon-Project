import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { QuickPracticeMode } from '../components/QuickPracticeMode';
import { Zap, Flame, Lock, Trophy, LogOut, Target, Play } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const DashboardPage = () => {
  const { user, token, logout, updateUserXP } = useAuth();
  const navigate = useNavigate();
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showQuickPractice, setShowQuickPractice] = useState(false);

  // --- VARIABLES DE USUARIO ---
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

  // --- ESTADOS DE MÓDULOS (LA NUEVA LÓGICA) ---
  const [modulos, setModulos] = useState([]);
  const [loadingModulos, setLoadingModulos] = useState(true);

  // 1. Efecto para traer la XP Real del usuario
  useEffect(() => {
    const fetchRealXP = async () => {
      try {
        const miUsuarioId = user?.idUsuario; 
        if (!miUsuarioId) return; 
        
        const response = await fetch(`http://localhost:8080/api/usuarios/${miUsuarioId}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          updateUserXP(data.xp); 
          setUserRank(data.posicion); 
          setUserStreak(data.racha); 
        }
      } catch (error) {
        console.error("Error al cargar la XP del servidor", error);
      }
    };
    
    fetchRealXP();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // 2. Efecto para traer los Módulos Dinámicos desde Java
  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/modulos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setModulos(data);
        }
      } catch (error) {
        console.error("Error al cargar los módulos:", error);
        toast.error('Error al cargar misiones');
      } finally {
        setLoadingModulos(false);
      }
    };

    if (token) fetchModulos();
  }, [token]);

  // Manejador de clics en los módulos
  const handleModuloClick = (mod) => {
    if (mod.bloqueado) {
      toast.error(`Necesitas alcanzar ${mod.xp_requerida} XP para desbloquear esta misión.`);
      return;
    }
    // Si está desbloqueado, lo mandamos a la arena de ejercicios
    navigate(`/exercise/${mod.id_modulo}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Sesión cerrada');
  };

  if (loadingModulos) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <DagonMascot size="large" mood="determined" />
          <p className="text-blue-400 font-bold tracking-widest uppercase text-sm">Cargando mapa de niveles...</p>
        </div>
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
        {/* Cabecera del Dashboard */}
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
              animate={{ backgroundPosition: ['0% center', '100% center', '0% center'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
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
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all hover:scale-105"
            >
              <Target className="w-4 h-4 mr-2" />
              Práctica Rápida
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800/50"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* XP */}
          <div 
            onClick={() => navigate('/profile')}
            className="glass-card rounded-xl p-6 border border-slate-700/50 cursor-pointer hover:border-blue-500/50 hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Puntos XP</p>
                <p className="text-3xl font-bold text-white">{userXP}</p>
              </div>
            </div>
            <Progress value={(userXP % 100)} className="h-2 bg-slate-800" />
            <p className="text-slate-500 text-xs mt-2">{xpFaltante} XP para siguiente nivel</p>
          </div>

          {/* Racha */}
          <div 
            onClick={() => navigate('/streak')}
            className="glass-card rounded-xl p-6 border border-slate-700/50 cursor-pointer hover:border-orange-500/50 hover:shadow-[0_0_25px_rgba(249,115,22,0.2)] transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Racha Actual</p>
                <p className="text-3xl font-bold text-white">{userStreak} días</p>
              </div>
            </div>
            <p className="text-orange-400 text-xs mt-4 font-medium">Click para ver estadísticas →</p>
          </div>

          {/* Leaderboard */}
          <div 
            onClick={() => navigate('/leaderboard')}
            className="glass-card rounded-xl p-6 border border-slate-700/50 cursor-pointer hover:border-yellow-500/50 hover:shadow-[0_0_25px_rgba(234,179,8,0.2)] transition-all duration-300"
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

        {/* MAPA DE NIVELES DINÁMICO */}
        <div className="glass-card rounded-2xl p-8 border border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
              <DagonMascot size="small" mood="determined" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Mapa de Niveles</h2>
              <p className="text-slate-400">Elige tu próxima misión para continuar</p>
            </div>
          </div>

          <div className="grid gap-4 relative z-10">
            {modulos.length === 0 ? (
              <p className="text-slate-500 italic">Aún no hay misiones configuradas.</p>
            ) : (
              modulos.map((mod, index) => (
                <div 
                  key={mod.id_modulo} 
                  onClick={() => handleModuloClick(mod)}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 flex items-center gap-6 overflow-hidden cursor-pointer ${
                    mod.bloqueado 
                      ? 'bg-slate-900/40 border-slate-800 opacity-75 grayscale-[0.5] hover:bg-slate-900/60' 
                      : 'glass-card border-slate-700/50 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group'
                  }`}
                >
                  {/* Número del módulo */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black shadow-inner z-10 flex-shrink-0 ${
                    mod.bloqueado 
                      ? 'bg-slate-800 text-slate-500 border border-slate-700' 
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border border-blue-400/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform'
                  }`}>
                    {mod.bloqueado ? <Lock className="w-6 h-6" /> : index + 1}
                  </div>

                  {/* Textos */}
                  <div className="flex-1 z-10">
                    <h3 className={`text-xl font-bold ${mod.bloqueado ? 'text-slate-400' : 'text-slate-100'}`}>
                      {mod.titulo}
                    </h3>
                    <p className={`text-sm mt-1 ${mod.bloqueado ? 'text-slate-500' : 'text-slate-400'}`}>
                      {mod.descripcion}
                    </p>
                  </div>

                  {/* Botón o Candado */}
                  <div className="z-10 flex-shrink-0">
                    {mod.bloqueado ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-bold text-red-400/80 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                          {mod.xp_requerida} XP Req.
                        </span>
                      </div>
                    ) : (
                      <Button className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                        Comenzar <Play className="w-4 h-4 fill-current" />
                      </Button>
                    )}
                  </div>

                  {/* Fondo decorativo si está desbloqueado */}
                  {!mod.bloqueado && (
                    <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-blue-600/10 to-transparent z-0"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};