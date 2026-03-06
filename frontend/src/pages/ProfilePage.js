import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { ArrowLeft, Zap, Trophy, Target, BookOpen, Code, Award } from 'lucide-react';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const achievements = [
    { id: 1, title: 'Primera Consulta', description: 'Completaste tu primer ejercicio', icon: '🎯', unlocked: true, xp: 10 },
    { id: 2, title: 'Racha de 3', description: 'Mantén 3 días de racha', icon: '🔥', unlocked: false, xp: 50 },
    { id: 3, title: 'Maestro SELECT', description: 'Domina las consultas SELECT', icon: '📚', unlocked: false, xp: 100 },
    { id: 4, title: 'Experto JOIN', description: 'Completa todos los ejercicios de JOIN', icon: '🔗', unlocked: false, xp: 200 },
    { id: 5, title: 'SQL Ninja', description: 'Alcanza 1000 XP', icon: '⚡', unlocked: false, xp: 500 },
    { id: 6, title: 'Perfeccionista', description: 'Completa un nivel sin errores', icon: '✨', unlocked: false, xp: 150 },
  ];

  const currentLevel = Math.floor((user?.xp || 0) / 100);
  const xpInCurrentLevel = (user?.xp || 0) % 100;
  const xpForNextLevel = 100;

  return (
    <div className="min-h-screen cyber-bg grid-pattern" data-testid="profile-page">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-8 mb-8 border border-slate-700/50">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg neon-glow">
                <DagonMascot size="medium" mood="happy" />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-yellow-500 text-yellow-900 font-bold px-3 py-1 rounded-lg shadow-lg">
                Lvl {currentLevel}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{user?.name}</h1>
              <p className="text-slate-400 text-lg mb-4">{user?.email}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Progreso al Nivel {currentLevel + 1}</span>
                  <span className="text-white font-bold">{xpInCurrentLevel} / {xpForNextLevel} XP</span>
                </div>
                <Progress value={(xpInCurrentLevel / xpForNextLevel) * 100} className="h-3 bg-slate-800" />
              </div>
            </div>

            <div className="text-right">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse">
                {user?.xp || 0}
              </div>
              <p className="text-slate-400 text-sm">Puntos XP Totales</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-400" />
              Estadísticas
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">Ejercicios Completados</span>
                </div>
                <span className="text-2xl font-bold text-white">0</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">Consultas Ejecutadas</span>
                </div>
                <span className="text-2xl font-bold text-white">0</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-slate-300">Racha Actual</span>
                </div>
                <span className="text-2xl font-bold text-white">{user?.streak || 0} días</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-orange-400" />
                  <span className="text-slate-300">Mejor Racha</span>
                </div>
                <span className="text-2xl font-bold text-white">{user?.streak || 0} días</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              Logros Desbloqueados
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    achievement.unlocked
                      ? 'bg-gradient-to-r from-blue-900/50 to-transparent border-blue-500/50'
                      : 'bg-slate-900/30 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white flex items-center gap-2">
                        {achievement.title}
                        {achievement.unlocked && (
                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                            Desbloqueado
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-400">{achievement.description}</p>
                    </div>
                    <div className="text-yellow-400 font-bold">+{achievement.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6">Distribución de XP por Nivel</h2>
          <div className="space-y-4">
            {['Nivel 0', 'Básico', 'Medio', 'Avanzado', 'Pro'].map((level, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 font-medium">{level}</span>
                  <span className="text-slate-400 text-sm">0 XP</span>
                </div>
                <Progress value={0} className="h-2 bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};