import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { Trophy, Medal, Award, ArrowLeft, Zap } from 'lucide-react';

export const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockLeaders = [
      { id: 1, name: 'Ana García', xp: 2500, streak: 15, avatar: '👩‍💻', level: 'Pro' },
      { id: 2, name: 'Carlos López', xp: 2100, streak: 12, avatar: '👨‍💻', level: 'Avanzado' },
      { id: 3, name: 'María Ruiz', xp: 1800, streak: 10, avatar: '👩‍🎓', level: 'Avanzado' },
      { id: 4, name: 'Juan Pérez', xp: 1600, streak: 8, avatar: '👨‍🎓', level: 'Medio' },
      { id: 5, name: 'Laura Torres', xp: 1400, streak: 7, avatar: '👩‍💼', level: 'Medio' },
      { id: 6, name: user?.name || 'Tú', xp: user?.xp || 0, streak: user?.streak || 0, avatar: '🎯', level: 'Nivel 0', isCurrentUser: true },
    ].sort((a, b) => b.xp - a.xp);

    setTimeout(() => {
      setLeaders(mockLeaders);
      setLoading(false);
    }, 500);
  }, [user]);

  const getMedalIcon = (position) => {
    if (position === 0) return <Trophy className="w-8 h-8 text-yellow-400" />;
    if (position === 1) return <Medal className="w-7 h-7 text-slate-300" />;
    if (position === 2) return <Award className="w-6 h-6 text-orange-400" />;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <DagonMascot size="large" mood="happy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-bg grid-pattern" data-testid="leaderboard-page">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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

        <div className="text-center mb-8">
          <div className="inline-block animate-float mb-4">
            <DagonMascot size="medium" mood="excited" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">
            Clasificación Global
          </h1>
          <p className="text-slate-400 text-lg">
            Los mejores desarrolladores SQL del mundo
          </p>
        </div>

        <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Top Estudiantes
            </h2>
          </div>

          <div className="divide-y divide-slate-800">
            {leaders.map((leader, index) => (
              <div
                key={leader.id}
                className={`p-6 transition-all duration-300 ${
                  leader.isCurrentUser
                    ? 'bg-blue-900/20 border-l-4 border-blue-500'
                    : 'hover:bg-slate-900/50'
                } ${
                  index < 3 ? 'bg-gradient-to-r from-slate-900/50 to-transparent' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold ${
                          index < 3
                            ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg neon-glow'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {index < 3 ? getMedalIcon(index) : index + 1}
                      </div>
                      {index < 3 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="text-3xl">{leader.avatar}</div>

                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {leader.name}
                        {leader.isCurrentUser && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Tú
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-sm">{leader.level}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-yellow-400 font-bold text-xl">
                        <Zap className="w-5 h-5" />
                        {leader.xp.toLocaleString()} XP
                      </div>
                      <div className="text-slate-400 text-sm mt-1">
                        🔥 {leader.streak} días
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-6 text-center border border-slate-700/50">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-white">1,247</h3>
            <p className="text-slate-400 text-sm">Estudiantes Activos</p>
          </div>

          <div className="glass-card rounded-xl p-6 text-center border border-slate-700/50">
            <Award className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-white">15,892</h3>
            <p className="text-slate-400 text-sm">Ejercicios Completados</p>
          </div>

          <div className="glass-card rounded-xl p-6 text-center border border-slate-700/50">
            <Medal className="w-8 h-8 text-orange-400 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-white">4.8/5</h3>
            <p className="text-slate-400 text-sm">Satisfacción Promedio</p>
          </div>
        </div>
      </div>
    </div>
  );
};