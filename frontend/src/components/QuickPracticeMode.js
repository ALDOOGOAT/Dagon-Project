import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Zap, Timer, Flame, Trophy, Star, 
  RefreshCw, ChevronRight, X, Target 
} from 'lucide-react';

// Generador de consultas aleatorias por nivel
const QUERY_TEMPLATES = {
  'nivel-0': [
    { words: ['SELECT', '*', 'FROM', 'usuarios'], answer: 'SELECT * FROM usuarios', hint: 'Selecciona todo de la tabla usuarios' },
    { words: ['SELECT', '*', 'FROM', 'productos'], answer: 'SELECT * FROM productos', hint: 'Selecciona todo de la tabla productos' },
    { words: ['SELECT', 'nombre', 'FROM', 'clientes'], answer: 'SELECT nombre FROM clientes', hint: 'Selecciona solo el nombre' },
  ],
  'basico': [
    { words: ['SELECT', '*', 'FROM', 'usuarios', 'WHERE', 'edad', '>', '18'], answer: 'SELECT * FROM usuarios WHERE edad > 18', hint: 'Filtra usuarios mayores de 18' },
    { words: ['SELECT', 'nombre', ',', 'email', 'FROM', 'usuarios'], answer: 'SELECT nombre , email FROM usuarios', hint: 'Selecciona dos columnas' },
    { words: ['SELECT', '*', 'FROM', 'pedidos', 'ORDER BY', 'fecha'], answer: 'SELECT * FROM pedidos ORDER BY fecha', hint: 'Ordena por fecha' },
  ],
  'medio': [
    { words: ['SELECT', 'COUNT(*)', 'FROM', 'usuarios', 'GROUP BY', 'ciudad'], answer: 'SELECT COUNT(*) FROM usuarios GROUP BY ciudad', hint: 'Cuenta usuarios por ciudad' },
    { words: ['SELECT', '*', 'FROM', 'usuarios', 'u', 'JOIN', 'pedidos', 'p', 'ON', 'u.id', '=', 'p.usuario_id'], answer: 'SELECT * FROM usuarios u JOIN pedidos p ON u.id = p.usuario_id', hint: 'Une usuarios con sus pedidos' },
  ]
};

const DAILY_CHALLENGES = [
  { id: 1, title: 'Maestro SELECT', description: 'Completa 5 consultas SELECT', target: 5, reward: 50, icon: '🎯' },
  { id: 2, title: 'Velocista SQL', description: 'Resuelve 3 en menos de 30s cada una', target: 3, reward: 75, icon: '⚡' },
  { id: 3, title: 'Racha Perfecta', description: 'Completa 5 sin errores', target: 5, reward: 100, icon: '🔥' },
];

export const QuickPracticeMode = ({ 
  userLevel = 'nivel-0', 
  userXP = 0,
  userStreak = 0,
  onXPGain = () => {},
  onClose = () => {} 
}) => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [query, setQuery] = useState(null);
  const [droppedWords, setDroppedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [timer, setTimer] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [dailyProgress, setDailyProgress] = useState(() => {
    const saved = localStorage.getItem('dagon_daily_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      if (parsed.date === today) return parsed;
    }
    return { date: new Date().toDateString(), challenges: {}, totalCompleted: 0 };
  });

  // Timer countdown
  useEffect(() => {
    let interval;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0 && isRunning) {
      handleTimeout();
    }
    return () => clearInterval(interval);
  }, [isRunning, timer]);

  // Save daily progress
  useEffect(() => {
    localStorage.setItem('dagon_daily_progress', JSON.stringify(dailyProgress));
  }, [dailyProgress]);

  const generateNewQuery = useCallback(() => {
    const templates = QUERY_TEMPLATES[userLevel] || QUERY_TEMPLATES['nivel-0'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Shuffle words
    const shuffled = [...template.words].sort(() => Math.random() - 0.5);
    const wordObjects = shuffled.map((word, idx) => ({ id: `qp-${idx}`, word }));
    
    setQuery(template);
    setAvailableWords(wordObjects);
    setDroppedWords([]);
    setTimer(30);
    setIsRunning(true);
    setShowResult(false);
  }, [userLevel]);

  const handleDrop = (wordObj) => {
    setAvailableWords(prev => prev.filter(w => w.id !== wordObj.id));
    setDroppedWords(prev => [...prev, wordObj]);
  };

  const handleRemove = (wordObj) => {
    setDroppedWords(prev => prev.filter(w => w.id !== wordObj.id));
    setAvailableWords(prev => [...prev, wordObj]);
  };

  const checkAnswer = () => {
    setIsRunning(false);
    const userAnswer = droppedWords.map(w => w.word).join(' ');
    const isCorrect = userAnswer === query.answer;
    
    setQuestionsAnswered(prev => prev + 1);
    
    if (isCorrect) {
      const timeBonus = Math.floor(timer * 2);
      const comboBonus = combo * 5;
      const baseXP = 10;
      const totalXP = baseXP + timeBonus + comboBonus;
      
      setCorrectAnswers(prev => prev + 1);
      setCombo(prev => prev + 1);
      setScore(prev => prev + totalXP);
      setLastResult({ success: true, xp: totalXP, timeBonus, comboBonus });
      onXPGain(totalXP);
      
      // Update daily progress
      setDailyProgress(prev => ({
        ...prev,
        totalCompleted: prev.totalCompleted + 1
      }));
    } else {
      setCombo(0);
      setLastResult({ success: false, correctAnswer: query.answer });
    }
    
    setShowResult(true);
  };

  const handleTimeout = () => {
    setIsRunning(false);
    setCombo(0);
    setQuestionsAnswered(prev => prev + 1);
    setLastResult({ success: false, timeout: true, correctAnswer: query.answer });
    setShowResult(true);
  };

  const startChallenge = (challenge) => {
    setCurrentChallenge(challenge);
    setScore(0);
    setCombo(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    generateNewQuery();
  };

  // Render challenge selection
  if (!currentChallenge) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="glass-card-apple rounded-3xl p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <DagonMascot size="medium" mood="excited" />
                <div>
                  <h2 className="text-3xl font-bold text-white">Práctica Rápida</h2>
                  <p className="text-slate-400">Mejora tus habilidades SQL</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Flame className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{userStreak}</p>
                <p className="text-xs text-slate-400">Racha</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{userXP}</p>
                <p className="text-xs text-slate-400">XP Total</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <Trophy className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{dailyProgress.totalCompleted}</p>
                <p className="text-xs text-slate-400">Hoy</p>
              </div>
            </div>

            {/* Daily Challenges */}
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Desafíos Diarios
            </h3>
            <div className="space-y-3">
              {DAILY_CHALLENGES.map(challenge => {
                const progress = dailyProgress.challenges[challenge.id] || 0;
                const completed = progress >= challenge.target;
                
                return (
                  <motion.div
                    key={challenge.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !completed && startChallenge(challenge)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      completed 
                        ? 'bg-green-500/20 border-green-500/50' 
                        : 'bg-white/5 border-white/10 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{challenge.icon}</span>
                        <div>
                          <p className="font-semibold text-white">{challenge.title}</p>
                          <p className="text-sm text-slate-400">{challenge.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold">+{challenge.reward} XP</p>
                        {completed ? (
                          <span className="text-green-400 text-sm">✓ Completado</span>
                        ) : (
                          <span className="text-slate-500 text-sm">{progress}/{challenge.target}</span>
                        )}
                      </div>
                    </div>
                    {!completed && (
                      <Progress value={(progress / challenge.target) * 100} className="h-1 mt-3" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Start */}
            <Button
              onClick={() => startChallenge({ id: 'free', title: 'Práctica Libre', target: Infinity, reward: 0 })}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg font-bold rounded-xl"
            >
              <Zap className="w-5 h-5 mr-2" />
              Práctica Libre
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Render active challenge
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <DagonMascot size="small" mood={isRunning ? "excited" : "happy"} />
            <div>
              <h3 className="text-xl font-bold text-white">{currentChallenge.title}</h3>
              <p className="text-slate-400">Pregunta {questionsAnswered + 1}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              timer <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
            }`}>
              <Timer className="w-5 h-5" />
              <span className="text-xl font-mono font-bold">{timer}s</span>
            </div>
            
            {/* Combo */}
            {combo > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-xl"
              >
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-orange-400 font-bold">x{combo}</span>
              </motion.div>
            )}
            
            {/* Score */}
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-xl">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{score} XP</span>
            </div>
            
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Question */}
        {query && !showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-apple rounded-2xl p-6"
          >
            <p className="text-slate-300 mb-2">💡 {query.hint}</p>
            
            {/* Drop Zone */}
            <div className="min-h-[80px] bg-slate-900/50 border-2 border-dashed border-blue-500/50 rounded-xl p-4 mb-6 flex flex-wrap gap-2 items-center">
              {droppedWords.length === 0 ? (
                <p className="text-slate-500 text-sm w-full text-center">Toca las palabras para construir la consulta</p>
              ) : (
                droppedWords.map((wordObj) => (
                  <motion.button
                    key={wordObj.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => handleRemove(wordObj)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-mono font-semibold hover:bg-blue-700 transition-colors"
                  >
                    {wordObj.word}
                  </motion.button>
                ))
              )}
            </div>
            
            {/* Word Bank */}
            <div className="flex flex-wrap gap-2 mb-6">
              {availableWords.map((wordObj) => (
                <motion.button
                  key={wordObj.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDrop(wordObj)}
                  className="bg-slate-800 text-slate-200 px-4 py-2 rounded-lg font-mono font-medium border border-slate-700 hover:border-blue-500/50 hover:bg-slate-700 transition-all"
                >
                  {wordObj.word}
                </motion.button>
              ))}
            </div>
            
            <Button
              onClick={checkAnswer}
              disabled={droppedWords.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-4 text-lg font-bold rounded-xl"
            >
              Verificar Respuesta
            </Button>
          </motion.div>
        )}

        {/* Result */}
        <AnimatePresence>
          {showResult && lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card-apple rounded-2xl p-8 text-center"
            >
              <DagonMascot size="large" mood={lastResult.success ? "excited" : "sad"} />
              
              <h2 className={`text-4xl font-bold mt-4 ${lastResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {lastResult.success ? '¡Correcto!' : lastResult.timeout ? '¡Tiempo agotado!' : 'Incorrecto'}
              </h2>
              
              {lastResult.success ? (
                <div className="mt-4 space-y-2">
                  <p className="text-2xl text-yellow-400 font-bold">+{lastResult.xp} XP</p>
                  <div className="text-sm text-slate-400">
                    <span>Base: 10 XP</span>
                    {lastResult.timeBonus > 0 && <span> • Tiempo: +{lastResult.timeBonus}</span>}
                    {lastResult.comboBonus > 0 && <span> • Combo: +{lastResult.comboBonus}</span>}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-slate-400 text-sm mb-2">Respuesta correcta:</p>
                  <p className="text-white font-mono">{lastResult.correctAnswer}</p>
                </div>
              )}
              
              <div className="flex gap-4 mt-6 justify-center">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Terminar
                </Button>
                <Button
                  onClick={generateNewQuery}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Siguiente
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
