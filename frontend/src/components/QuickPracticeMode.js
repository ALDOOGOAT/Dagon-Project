import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Zap, Timer, Flame, Trophy, Star, 
  RefreshCw, ChevronRight, X, Target, Lock, Unlock,
  ArrowUp, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const QUERY_TEMPLATES = {
  'nivel-0': [
    { words: ['SELECT', '*', 'FROM', 'usuarios'], answer: 'SELECT * FROM usuarios', hint: 'Selecciona todo de la tabla usuarios', difficulty: 1 },
    { words: ['SELECT', '*', 'FROM', 'productos'], answer: 'SELECT * FROM productos', hint: 'Selecciona todo de la tabla productos', difficulty: 1 },
    { words: ['SELECT', 'nombre', 'FROM', 'clientes'], answer: 'SELECT nombre FROM clientes', hint: 'Selecciona solo el nombre', difficulty: 1 },
    { words: ['SELECT', 'email', 'FROM', 'usuarios'], answer: 'SELECT email FROM usuarios', hint: 'Selecciona el email de usuarios', difficulty: 1 },
    { words: ['SELECT', '*', 'FROM', 'pedidos'], answer: 'SELECT * FROM pedidos', hint: 'Mira todos los pedidos', difficulty: 1 },
    { words: ['SELECT', 'apellido', 'FROM', 'empleados'], answer: 'SELECT apellido FROM empleados', hint: 'Selecciona los apellidos', difficulty: 1 },
    { words: ['SELECT', 'id', ',', 'nombre', 'FROM', 'categorias'], answer: 'SELECT id , nombre FROM categorias', hint: 'Selecciona ID y nombre', difficulty: 1 },
  ],
  'basico': [
    { words: ['SELECT', '*', 'FROM', 'usuarios', 'WHERE', 'edad', '>', '18'], answer: 'SELECT * FROM usuarios WHERE edad > 18', hint: 'Filtra usuarios mayores de 18', difficulty: 2 },
    { words: ['SELECT', 'nombre', ',', 'email', 'FROM', 'usuarios'], answer: 'SELECT nombre , email FROM usuarios', hint: 'Selecciona dos columnas', difficulty: 2 },
    { words: ['SELECT', '*', 'FROM', 'pedidos', 'ORDER BY', 'fecha'], answer: 'SELECT * FROM pedidos ORDER BY fecha', hint: 'Ordena por fecha', difficulty: 2 },
    { words: ['SELECT', '*', 'FROM', 'usuarios', 'WHERE', 'ciudad', '=', 'Madrid'], answer: 'SELECT * FROM usuarios WHERE ciudad = Madrid', hint: 'Filtra usuarios de Madrid', difficulty: 2 },
    { words: ['SELECT', 'nombre', 'FROM', 'productos', 'WHERE', 'precio', '<', '50'], answer: 'SELECT nombre FROM productos WHERE precio < 50', hint: 'Productos baratos', difficulty: 2 },
    { words: ['SELECT', '*', 'FROM', 'clientes', 'ORDER BY', 'nombre', 'DESC'], answer: 'SELECT * FROM clientes ORDER BY nombre DESC', hint: 'Ordena por nombre descendente', difficulty: 2 },
    { words: ['SELECT', 'DISTINCT', 'ciudad', 'FROM', 'usuarios'], answer: 'SELECT DISTINCT ciudad FROM usuarios', hint: 'Ciudades sin duplicados', difficulty: 2 },
    { words: ['SELECT', 'COUNT(*)', 'FROM', 'usuarios'], answer: 'SELECT COUNT(*) FROM usuarios', hint: 'Cuenta todos los usuarios', difficulty: 2 },
    { words: ['SELECT', '*', 'FROM', 'pedidos', 'WHERE', 'estado', '=', 'pendiente'], answer: 'SELECT * FROM pedidos WHERE estado = pendiente', hint: 'Pedidos pendientes', difficulty: 2 },
  ],
  'medio': [
    { words: ['SELECT', 'COUNT(*)', 'FROM', 'usuarios', 'GROUP BY', 'ciudad'], answer: 'SELECT COUNT(*) FROM usuarios GROUP BY ciudad', hint: 'Cuenta usuarios por ciudad', difficulty: 3 },
    { words: ['SELECT', '*', 'FROM', 'usuarios', 'u', 'JOIN', 'pedidos', 'p', 'ON', 'u.id', '=', 'p.usuario_id'], answer: 'SELECT * FROM usuarios u JOIN pedidos p ON u.id = p.usuario_id', hint: 'Une usuarios con sus pedidos', difficulty: 3 },
    { words: ['SELECT', 'AVG', '(', 'edad', ')', 'FROM', 'usuarios'], answer: 'SELECT AVG ( edad ) FROM usuarios', hint: 'Promedio de edad', difficulty: 3 },
    { words: ['SELECT', 'ciudad', ',', 'COUNT(*)', 'FROM', 'clientes', 'GROUP BY', 'ciudad'], answer: 'SELECT ciudad , COUNT(*) FROM clientes GROUP BY ciudad', hint: 'Clientes por ciudad', difficulty: 3 },
    { words: ['SELECT', '*', 'FROM', 'productos', 'WHERE', 'precio', 'BETWEEN', '10', 'AND', '50'], answer: 'SELECT * FROM productos WHERE precio BETWEEN 10 AND 50', hint: 'Productos en rango de precio', difficulty: 3 },
    { words: ['SELECT', 'MAX', '(', 'salario', ')', 'FROM', 'empleados'], answer: 'SELECT MAX ( salario ) FROM empleados', hint: 'Salario más alto', difficulty: 3 },
    { words: ['SELECT', 'u.nombre', ',', 'p.total', 'FROM', 'usuarios', 'u', 'JOIN', 'pedidos', 'p', 'ON', 'u.id', '=', 'p.usuario_id'], answer: 'SELECT u.nombre , p.total FROM usuarios u JOIN pedidos p ON u.id = p.usuario_id', hint: 'Nombre y total del pedido', difficulty: 3 },
  ],
  'avanzado': [
    { words: ['SELECT', 'ciudad', ',', 'AVG', '(', 'edad', ')', 'FROM', 'usuarios', 'GROUP BY', 'ciudad', 'HAVING', 'AVG', '(', 'edad', ')', '>', '25'], answer: 'SELECT ciudad , AVG ( edad ) FROM usuarios GROUP BY ciudad HAVING AVG ( edad ) > 25', hint: 'Ciudades con promedio mayor a 25', difficulty: 4 },
    { words: ['SELECT', 'nombre', 'FROM', 'usuarios', 'WHERE', 'id', 'IN', '(', 'SELECT', 'usuario_id', 'FROM', 'pedidos', ')'], answer: 'SELECT nombre FROM usuarios WHERE id IN ( SELECT usuario_id FROM pedidos )', hint: 'Usuarios que han pedido', difficulty: 4 },
    { words: ['SELECT', 'p.nombre', ',', 'COUNT', '(', 'DISTINCT', 'u.id', ')', 'FROM', 'productos', 'p', 'LEFT', 'JOIN', 'detalles_pedido', 'dp', 'ON', 'p.id', '=', 'dp.producto_id', 'LEFT', 'JOIN', 'pedidos', 'u', 'ON', 'dp.pedido_id', '=', 'u.id', 'GROUP BY', 'p.nombre'], answer: 'SELECT p.nombre , COUNT ( DISTINCT u.id ) FROM productos p LEFT JOIN detalles_pedido dp ON p.id = dp.producto_id LEFT JOIN pedidos u ON dp.pedido_id = u.id GROUP BY p.nombre', hint: 'Contar pedidos por producto', difficulty: 5 },
    { words: ['SELECT', 'TO_CHAR', '(', 'fecha_registro', ',', "'YYYY-MM'", ')', ',', 'COUNT(*)', 'FROM', 'usuarios', 'GROUP BY', 'TO_CHAR', '(', 'fecha_registro', ',', "'YYYY-MM'", ')'], answer: "SELECT TO_CHAR ( fecha_registro , 'YYYY-MM' ) , COUNT(*) FROM usuarios GROUP BY TO_CHAR ( fecha_registro , 'YYYY-MM' )", hint: 'Usuarios por mes', difficulty: 5 },
    { words: ['SELECT', 'nombre', 'FROM', 'clientes', 'WHERE', 'id', 'NOT', 'IN', '(', 'SELECT', 'cliente_id', 'FROM', 'pedidos', 'WHERE', 'YEAR', '(', 'fecha', ')', '=', '2024', ')'], answer: 'SELECT nombre FROM clientes WHERE id NOT IN ( SELECT cliente_id FROM pedidos WHERE YEAR ( fecha ) = 2024 )', hint: 'Clientes sin pedidos en 2024', difficulty: 5 },
  ],
  'experto': [
    { words: ['WITH', 'ventas_mes', 'AS', '(', 'SELECT', 'producto_id', ',', 'SUM(cantidad)', 'as', 'total', 'FROM', 'ventas', 'GROUP BY', 'producto_id', ')', 'SELECT', 'p.nombre', ',', 'v.total', 'FROM', 'ventas_mes', 'v', 'JOIN', 'productos', 'p', 'ON', 'v.producto_id', '=', 'p.id', 'ORDER BY', 'v.total', 'DESC'], answer: 'WITH ventas_mes AS ( SELECT producto_id , SUM(cantidad) as total FROM ventas GROUP BY producto_id ) SELECT p.nombre , v.total FROM ventas_mes v JOIN productos p ON v.producto_id = p.id ORDER BY v.total DESC', hint: 'CTE para top productos', difficulty: 5 },
    { words: ['SELECT', 'u.nombre', ',', 'COALESCE', '(', 'SUM', '(', 'p.total', ')', ',', '0', ')', 'as', 'gasto_total', 'FROM', 'usuarios', 'u', 'LEFT', 'JOIN', 'pedidos', 'p', 'ON', 'u.id', '=', 'p.usuario_id', 'GROUP BY', 'u.nombre', 'HAVING', 'COALESCE', '(', 'SUM', '(', 'p.total', ')', ',', '0', ')', '>', '100'], answer: 'SELECT u.nombre , COALESCE ( SUM ( p.total ) , 0 ) as gasto_total FROM usuarios u LEFT JOIN pedidos p ON u.id = p.usuario_id GROUP BY u.nombre HAVING COALESCE ( SUM ( p.total ) , 0 ) > 100', hint: 'Gasto total por usuario', difficulty: 5 },
  ]
};

const LEVEL_NAMES = {
  'nivel-0': { name: 'Básico', icon: '📖', description: 'SELECT simple', color: 'from-green-500 to-emerald-600' },
  'basico': { name: 'Intermedio', icon: '🔧', description: 'WHERE y ORDER BY', color: 'from-blue-500 to-cyan-600' },
  'medio': { name: 'Medio', icon: '⚡', description: 'JOIN y GROUP BY', color: 'from-purple-500 to-pink-600' },
  'avanzado': { name: 'Avanzado', icon: '🔥', description: 'Subconsultas complejas', color: 'from-orange-500 to-red-600' },
  'experto': { name: 'Experto', icon: '👑', description: 'CTEs y funciones', color: 'from-yellow-500 to-amber-600' },
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
  const [completedLevels, setCompletedLevels] = useState([1, 2]);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [showDifficultySelect, setShowDifficultySelect] = useState(true);
  const [dailyProgress, setDailyProgress] = useState(() => {
    const saved = localStorage.getItem('dagon_daily_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      if (parsed.date === today) return parsed;
    }
    return { date: new Date().toDateString(), challenges: {}, totalCompleted: 0 };
  });

  useEffect(() => {
    const fetchCompletedLevels = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/api/modulos/completados', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCompletedLevels(data);
        }
      } catch (error) {
        console.log('Error fetching completed levels:', error);
      }
    };
    fetchCompletedLevels();
  }, []);

  const getAvailableLevels = useCallback(() => {
    const xpLevel = Math.floor(userXP / 100);
    const levelKeys = Object.keys(QUERY_TEMPLATES);
    const available = [];
    
    levelKeys.forEach((key, index) => {
      if (index <= xpLevel + 1) {
        available.push(key);
      }
    });
    
    return available;
  }, [userXP]);

  const getRandomQueryFromLevels = useCallback((levels, allowChallenge = true) => {
    if (!levels || levels.length === 0) {
      levels = ['nivel-0'];
    }
    
    let pool = [];
    
    if (allowChallenge && Math.random() > 0.5 && levels.length > 1) {
      const challengeLevel = levels[Math.min(levels.length - 1, Math.floor(Math.random() * levels.length))];
      pool = [...QUERY_TEMPLATES[challengeLevel]];
    } else {
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      pool = [...QUERY_TEMPLATES[randomLevel]];
    }
    
    if (pool.length === 0) pool = QUERY_TEMPLATES['nivel-0'];
    
    const template = pool[Math.floor(Math.random() * pool.length)];
    
    const shuffled = [...template.words].sort(() => Math.random() - 0.5);
    const wordObjects = shuffled.map((word, idx) => ({ id: `qp-${idx}-${Date.now()}`, word }));
    
    return { template, wordObjects };
  }, []);

  const generateNewQuery = useCallback(() => {
    const availableLevels = getAvailableLevels();
    const { template, wordObjects } = getRandomQueryFromLevels(availableLevels);
    
    setQuery(template);
    setAvailableWords(wordObjects);
    setDroppedWords([]);
    setTimer(Math.max(15, 35 - template.difficulty * 3));
    setIsRunning(true);
    setShowResult(false);
  }, [getAvailableLevels, getRandomQueryFromLevels]);

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
    setShowDifficultySelect(false);
    startChallenge({ 
      id: 'custom', 
      title: LEVEL_NAMES[difficulty]?.name || 'Práctica', 
      target: Infinity, 
      reward: 0 
    });
  };

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

  useEffect(() => {
    localStorage.setItem('dagon_daily_progress', JSON.stringify(dailyProgress));
  }, [dailyProgress]);

  const handleDragStart = (e, wordObj) => {
    e.dataTransfer.setData('text/plain', wordObj.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropZone = (e) => {
    e.preventDefault();
    const wordId = e.dataTransfer.getData('text/plain');
    const wordObj = availableWords.find(w => w.id === wordId);
    if (wordObj) {
      setAvailableWords(prev => prev.filter(w => w.id !== wordId));
      setDroppedWords(prev => [...prev, wordObj]);
    }
  };

  const handleDropBack = (e, wordObj) => {
    e.preventDefault();
    e.stopPropagation();
    setDroppedWords(prev => prev.filter(w => w.id !== wordObj.id));
    setAvailableWords(prev => [...prev, wordObj]);
  };

  const handleDropRemove = (wordObj) => {
    setDroppedWords(prev => prev.filter(w => w.id !== wordObj.id));
    setAvailableWords(prev => [...prev, wordObj]);
  };

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
      const baseXP = 10 + (query.difficulty || 1) * 5;
      const timeBonus = Math.floor(timer * 2);
      const comboBonus = combo * 5;
      const totalXP = baseXP + timeBonus + comboBonus;
      
      setCorrectAnswers(prev => prev + 1);
      setCombo(prev => prev + 1);
      setScore(prev => prev + totalXP);
      setLastResult({ success: true, xp: totalXP, timeBonus, comboBonus, difficulty: query.difficulty });
      onXPGain(totalXP);
      
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
    setShowDifficultySelect(false);
    generateNewQuery();
  };

  const handleFreePractice = () => {
    startChallenge({ id: 'free', title: 'Práctica Libre', target: Infinity, reward: 0 });
  };

  if (showDifficultySelect) {
    const availableLevels = getAvailableLevels();
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="quick-practice-container my-4"
        >
          <div className="glass-card-apple rounded-2xl sm:rounded-3xl quick-practice-card">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <DagonMascot size="medium" mood="excited" />
                <div>
                  <h2 className="quick-practice-title text-white">Práctica Rápida</h2>
                  <p className="text-slate-400 text-sm sm:text-base">Elige tu nivel de dificultad</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-5 text-white" />
              </button>
            </div>

            <div className="quick-practice-stats mb-4 sm:mb-6">
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{userStreak}</p>
                <p className="text-xs text-slate-400">Racha</p>
              </div>
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{userXP}</p>
                <p className="text-xs text-slate-400">XP Total</p>
              </div>
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{dailyProgress.totalCompleted}</p>
                <p className="text-xs text-slate-400">Hoy</p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                Selecciona Dificultad
              </h3>
              <div className="difficulty-grid">
                {availableLevels.map((levelKey) => {
                  const level = LEVEL_NAMES[levelKey] || { name: levelKey, icon: '📚', description: '', color: 'from-gray-500 to-slate-600' };
                  const isUnlocked = true;
                  
                  return (
                    <motion.button
                      key={levelKey}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDifficultySelect(levelKey)}
                      className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                        isUnlocked
                          ? `bg-gradient-to-r ${level.color} border-white/20 hover:border-white/40`
                          : 'bg-slate-800/50 border-slate-700 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl">{level.icon}</span>
                          <div>
                            <p className="font-bold text-white text-sm sm:text-base">{level.name}</p>
                            <p className="text-xs text-white/70 hidden sm:block">{level.description}</p>
                          </div>
                        </div>
                        {isUnlocked ? (
                          <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        ) : (
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                Desafíos Diarios
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {DAILY_CHALLENGES.map(challenge => {
                  const progress = dailyProgress.challenges[challenge.id] || 0;
                  const completed = progress >= challenge.target;
                  
                  return (
                    <motion.div
                      key={challenge.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => !completed && setShowDifficultySelect(false) && startChallenge(challenge)}
                      className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                        completed 
                          ? 'bg-green-500/20 border-green-500/50' 
                          : 'bg-white/5 border-white/10 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xl sm:text-2xl">{challenge.icon}</span>
                          <div>
                            <p className="font-semibold text-white text-sm sm:text-base">{challenge.title}</p>
                            <p className="text-xs sm:text-sm text-slate-400">{challenge.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-bold text-sm sm:text-base">+{challenge.reward} XP</p>
                          {completed ? (
                            <span className="text-green-400 text-xs sm:text-sm">✓ Completado</span>
                          ) : (
                            <span className="text-slate-500 text-xs sm:text-sm">{progress}/{challenge.target}</span>
                          )}
                        </div>
                      </div>
                      {!completed && (
                        <Progress value={(progress / challenge.target) * 100} className="h-1 mt-2 sm:mt-3" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleFreePractice}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-xl"
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Práctica Libre (Mixta)
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (!currentChallenge) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="quick-practice-container my-4"
        >
          <div className="glass-card-apple rounded-2xl sm:rounded-3xl quick-practice-card">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <DagonMascot size="medium" mood="excited" />
                <div>
                  <h2 className="quick-practice-title text-white">Práctica Rápida</h2>
                  <p className="text-slate-400 text-sm sm:text-base">Mejora tus habilidades SQL</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <X className="w-4 h-5 text-white" />
              </button>
            </div>

            <div className="quick-practice-stats mb-4 sm:mb-6">
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{userStreak}</p>
                <p className="text-xs text-slate-400">Racha</p>
              </div>
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{userXP}</p>
                <p className="text-xs text-slate-400">XP Total</p>
              </div>
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1 sm:mb-2" />
                <p className="text-xl sm:text-2xl font-bold text-white">{dailyProgress.totalCompleted}</p>
                <p className="text-xs text-slate-400">Hoy</p>
              </div>
            </div>

            <Button
              onClick={() => setShowDifficultySelect(true)}
              className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-xl"
            >
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Elegir Dificultad
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl sm:max-w-4xl">
        <div className="quick-practice-header mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <DagonMascot size="small" mood={isRunning ? "excited" : "happy"} />
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">{currentChallenge.title}</h3>
              <p className="text-slate-400 text-sm">Pregunta {questionsAnswered + 1}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowDifficultySelect(true)}
              className="px-2 sm:px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-300"
            >
              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Cambiar nivel</span>
            </button>
            
            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl ${
              timer <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
            }`}>
              <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-xl font-mono font-bold">{timer}s</span>
            </div>
            
            {combo > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-orange-500/20 rounded-xl"
              >
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                <span className="text-orange-400 font-bold text-sm sm:text-base">x{combo}</span>
              </motion.div>
            )}
            
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-yellow-500/20 rounded-xl">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm sm:text-base">{score} XP</span>
            </div>
            
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <X className="w-4 h-5 text-white" />
            </button>
          </div>
        </div>

        {query && !showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-apple rounded-2xl p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row items-start sm:justify-between sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <p className="text-slate-300 text-base sm:text-lg">💡 {query.hint}</p>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                query.difficulty <= 2 ? 'bg-green-500/20 text-green-400' :
                query.difficulty <= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                Nivel {query.difficulty}
              </span>
            </div>
            
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDropZone}
              className="bg-slate-900/90 border-2 border-dashed border-blue-500/50 rounded-xl mb-4 sm:mb-6 flex flex-wrap gap-2 items-center justify-center min-h-[60px] sm:min-h-[70px] p-2 sm:p-3 transition-colors hover:border-blue-400"
            >
              {droppedWords.length === 0 ? (
                <p className="text-slate-500 text-xs sm:text-sm w-full text-center">Arrastra las palabras aquí o toca para añadir</p>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {droppedWords.map((wordObj) => (
                    <div
                      key={wordObj.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, wordObj)}
                      onClick={() => handleDropRemove(wordObj)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-mono font-bold text-xs sm:text-sm hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-grab"
                    >
                      {wordObj.word}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center mb-4 sm:mb-6 p-2">
              {availableWords.map((wordObj) => (
                <div
                  key={wordObj.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, wordObj)}
                  onClick={() => handleDrop(wordObj)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-mono font-medium text-xs sm:text-sm border border-slate-600 hover:border-cyan-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                >
                  {wordObj.word}
                </div>
              ))}
            </div>
            
            <Button
              onClick={checkAnswer}
              disabled={droppedWords.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl"
            >
              Verificar Respuesta
            </Button>
          </motion.div>
        )}

        <AnimatePresence>
          {showResult && lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card-apple rounded-2xl p-4 sm:p-8 text-center"
            >
              <DagonMascot size="large" mood={lastResult.success ? "excited" : "sad"} />
              
              <h2 className={`text-2xl sm:text-4xl font-bold mt-3 sm:mt-4 ${lastResult.success ? 'text-green-400' : lastResult.timeout ? 'text-orange-400' : 'text-red-400'}`}>
                {lastResult.success ? '¡Correcto!' : lastResult.timeout ? '¡Tiempo agotado!' : 'Incorrecto'}
              </h2>
              
              {lastResult.success ? (
                <div className="mt-3 sm:mt-4 space-y-2">
                  <p className="text-xl sm:text-2xl text-yellow-400 font-bold">+{lastResult.xp} XP</p>
                  <div className="text-xs sm:text-sm text-slate-400">
                    <span>Base: {10 + (lastResult.difficulty || 1) * 5} XP</span>
                    {lastResult.timeBonus > 0 && <span> • Tiempo: +{lastResult.timeBonus}</span>}
                    {lastResult.comboBonus > 0 && <span> • Combo: +{lastResult.comboBonus}</span>}
                  </div>
                </div>
              ) : (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-slate-400 text-xs sm:text-sm mb-2">Respuesta correcta:</p>
                  <p className="text-white font-mono text-sm sm:text-lg">{lastResult.correctAnswer}</p>
                </div>
              )}
              
              <div className="quick-practice-buttons mt-4 sm:mt-6">
                <Button
                  onClick={() => setShowDifficultySelect(true)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 text-sm sm:text-base"
                >
                  Cambiar Nivel
                </Button>
                <Button
                  onClick={generateNewQuery}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm sm:text-base"
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
