import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DagonMascot } from './DagonMascot';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Zap, Timer, Flame, Trophy, Star, 
  RefreshCw, X, Target, Lock, Unlock,
  ArrowUp, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../services/apiClient';
import { StreakAnimation } from './StreakAnimation';
import { useAuth } from '../contexts/AuthContext';
import { sounds } from '../lib/SoundEngine';

const LEVEL_NAMES = {
  'nivel-0': { name: 'Inicial', icon: 'SQL', description: 'SELECT de una tabla', color: 'from-green-500 to-emerald-600' },
  'basico': { name: 'Básico', icon: 'WH', description: 'Filtros y orden', color: 'from-blue-500 to-cyan-600' },
  'medio': { name: 'Intermedio', icon: 'JN', description: 'JOIN y agrupaciones', color: 'from-purple-500 to-pink-600' },
  'avanzado': { name: 'Avanzado', icon: 'AV', description: 'Subconsultas y composición', color: 'from-orange-500 to-red-600' },
  'experto': { name: 'Experto', icon: 'EX', description: 'DDL, DML y reglas', color: 'from-yellow-500 to-amber-600' },
};

const DAILY_CHALLENGES = [
  { id: 1, title: 'Maestro SELECT', description: 'Completa 5 relámpagos correctos', target: 5, rewardLabel: 'Sello de precisión', icon: 'MS' },
  { id: 2, title: 'Velocista SQL', description: 'Resuelve 3 antes de que el reloj entre en rojo', target: 3, rewardLabel: 'Sello de velocidad', icon: 'VS' },
  { id: 3, title: 'Racha Perfecta', description: 'Encadena 5 aciertos sin error', target: 5, rewardLabel: 'Sello de constancia', icon: 'RC' },
];

const inferPracticeLearning = (query) => {
  if (query?.concept) return query.concept;
  const texto = `${query?.title || ''} ${query?.description || ''}`.toUpperCase();
  if (texto.includes('JOIN')) return 'Relaciones entre tablas';
  if (texto.includes('GROUP') || texto.includes('COUNT') || texto.includes('AVG') || texto.includes('SUM')) return 'Agrupaciones y funciones';
  if (texto.includes('WHERE') || texto.includes('ORDER') || texto.includes('BETWEEN')) return 'Filtros y ordenamiento';
  if (texto.includes('CREATE') || texto.includes('ALTER')) return 'DDL y reglas';
  return 'Lectura basica con SELECT';
};

const buildPracticeRecommendation = (query, success) => {
  const concept = inferPracticeLearning(query);
  if (success) {
    return `Refuerza ${concept.toLowerCase()} intentando resolverlo otra vez sin mirar la pista.`;
  }
  return `Vuelve a separar la consulta en bloques: SELECT, FROM y la parte de ${concept.toLowerCase()}.`;
};

const shuffleWords = (words) => [...words].sort(() => Math.random() - 0.5);

const buildWordObjects = (words) => shuffleWords(words || []).map((word, idx) => ({
  id: `qp-${Date.now()}-${idx}-${String(word).replace(/\W/g, '')}`,
  word
}));

const normalizeExercise = (exercise) => ({
  id: exercise.id,
  title: exercise.title || 'Misión Relámpago',
  description: exercise.description || 'Arma la consulta solicitada.',
  hint: exercise.hint || 'Ordena los bloques de izquierda a derecha.',
  wordBank: Array.isArray(exercise.wordBank) ? exercise.wordBank : [],
  difficulty: Number(exercise.difficulty || 1),
  xpReward: Number(exercise.xpReward || 5),
  timeLimitSeconds: Number(exercise.timeLimitSeconds || 35),
  concept: exercise.concept || inferPracticeLearning(exercise),
});

const completeSqlStatement = (words) => {
  const raw = words.map(w => w.word).join(' ').replace(/\s+;/g, ';').trim();
  if (!raw) return raw;
  return raw.endsWith(';') ? raw : `${raw};`;
};

export const QuickPracticeMode = ({
  userXP = 0,
  userStreak = 0,
  onXPGain = () => {},
  onClose = () => {}
}) => {
  const { updateUserStreak } = useAuth();
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [streakData, setStreakData] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [practicePool, setPracticePool] = useState([]);
  const [poolIndex, setPoolIndex] = useState(0);
  const [query, setQuery] = useState(null);
  const [droppedWords, setDroppedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [timer, setTimer] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [validatingAnswer, setValidatingAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [dailyQuickRemaining, setDailyQuickRemaining] = useState(null);
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

  const getAvailableLevels = useCallback(() => {
    const xpLevel = Math.floor(userXP / 100);
    const levelKeys = Object.keys(LEVEL_NAMES);
    const available = [];

    levelKeys.forEach((key, index) => {
      if (index <= xpLevel + 1) {
        available.push(key);
      }
    });

    return available;
  }, [userXP]);

  const activateExercise = useCallback((exercise) => {
    const normalized = normalizeExercise(exercise);
    setQuery(normalized);
    setAvailableWords(buildWordObjects(normalized.wordBank));
    setDroppedWords([]);
    setTimer(Math.max(20, normalized.timeLimitSeconds));
    setIsRunning(true);
    setShowResult(false);
    setLastResult(null);

    sounds.playMagic();
  }, []);

  const fetchPracticeSet = useCallback(async (difficulty) => {
    const response = await apiClient.get('/api/practica-rapida', {
      params: {
        nivel: difficulty || 'mixto',
        limite: 8
      }
    });
    const data = response.data || {};
    const exercises = (data.exercises || []).map(normalizeExercise);
    if (typeof data.daily_quick_xp_remaining === 'number') {
      setDailyQuickRemaining(data.daily_quick_xp_remaining);
    }
    if (exercises.length === 0) {
      throw new Error('No hay ejercicios relámpago disponibles para este nivel.');
    }
    return exercises;
  }, []);

  const startChallenge = useCallback(async (challenge, difficulty = selectedDifficulty || 'mixto') => {
    setLoadingPractice(true);
    setCurrentChallenge(challenge);
    setScore(0);
    setCombo(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setShowResult(false);

    try {
      const exercises = await fetchPracticeSet(difficulty);
      setPracticePool(exercises);
      setPoolIndex(1);
      setShowDifficultySelect(false);
      activateExercise(exercises[0]);
    } catch (error) {
      setCurrentChallenge(null);
      setShowDifficultySelect(true);
      toast.error(error?.response?.data?.message || error.message || 'No se pudo cargar la práctica relámpago.');
    } finally {
      setLoadingPractice(false);
    }
  }, [activateExercise, fetchPracticeSet, selectedDifficulty]);

  const generateNewQuery = useCallback(async () => {
    if (practicePool.length > poolIndex) {
      activateExercise(practicePool[poolIndex]);
      setPoolIndex(prev => prev + 1);
      return;
    }

    setLoadingPractice(true);
    try {
      const exercises = await fetchPracticeSet(selectedDifficulty || 'mixto');
      setPracticePool(exercises);
      setPoolIndex(1);
      activateExercise(exercises[0]);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'No se pudo cargar otra misión relámpago.');
    } finally {
      setLoadingPractice(false);
    }
  }, [activateExercise, fetchPracticeSet, poolIndex, practicePool, selectedDifficulty]);

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
    sounds.playSelect();
    startChallenge({
      id: 'custom',
      title: LEVEL_NAMES[difficulty]?.name || 'Práctica',
      target: Infinity,
      reward: 0
    }, difficulty);
  };

  useEffect(() => {
    let interval;
    if (isRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => {
          const nextTimer = t - 1;
          if (nextTimer <= 6 && nextTimer > 0) {
            sounds.playCountdown?.(nextTimer);
          } else if (nextTimer > 10 && nextTimer % 2 === 0) {
            sounds.playClockTicking?.();
          }
          return nextTimer;
        });
      }, 1000);
    } else if (timer === 0 && isRunning) {
      setIsRunning(false);
      setCombo(0);
      setQuestionsAnswered(prev => prev + 1);
      setLastResult({
        success: false,
        timeout: true,
        message: 'El reloj se agotó. No se pierde progreso, pero este intento no salva racha ni entrega XP.',
        correctAnswer: ''
      });
      setShowResult(true);
      sounds.playTimeWarning();
    }
    return () => {
      clearInterval(interval);
      sounds.stopTimerLoop?.();
    };
  }, [isRunning, timer, query]);

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

  const checkAnswer = async () => {
    if (!query?.id || validatingAnswer || droppedWords.length === 0) return;

    setIsRunning(false);
    setValidatingAnswer(true);
    const userAnswer = completeSqlStatement(droppedWords);

    setQuestionsAnswered(prev => prev + 1);

    try {
      const response = await apiClient.post(`/api/exercises/${query.id}/validate`, { query: userAnswer });
      const result = response.data || {};
      const isCorrect = Boolean(result.success);
      const xpGained = Number(result.xp_gained || 0);

      if (isCorrect) {
        const nextCombo = combo + 1;
        setCorrectAnswers(prev => prev + 1);
        setCombo(nextCombo);
        setScore(prev => prev + xpGained);
        if (xpGained > 0) {
          onXPGain(xpGained);
        }
        if (typeof result.daily_quick_xp_remaining === 'number') {
          setDailyQuickRemaining(result.daily_quick_xp_remaining);
        }

        if (result.streak_activated_today) {
          updateUserStreak(result.new_streak);
          setStreakData({ count: result.new_streak });
          setShowStreakAnimation(true);
        }

        setLastResult({
          success: true,
          xp: xpGained,
          difficulty: query.difficulty,
          backendMessage: result.message,
          streakSaved: result.streak_saved || result.quick_practice,
          xpCapReached: xpGained === 0 && result.daily_quick_xp_remaining === 0,
          dailyQuickRemaining: result.daily_quick_xp_remaining,
          combo: nextCombo,
          userAnswer
        });
        sounds.playSuccess();

        setDailyProgress(prev => ({
          ...prev,
          totalCompleted: prev.totalCompleted + 1,
          challenges: {
            ...prev.challenges,
            ...(currentChallenge?.id ? {
              [currentChallenge.id]: Math.min((prev.challenges[currentChallenge.id] || 0) + 1, currentChallenge.target || 999)
            } : {}),
            1: Math.min((prev.challenges[1] || 0) + 1, DAILY_CHALLENGES[0].target),
            ...(timer > 10 ? { 2: Math.min((prev.challenges[2] || 0) + 1, DAILY_CHALLENGES[1].target) } : {}),
            ...(nextCombo >= 1 ? { 3: Math.min((prev.challenges[3] || 0) + 1, DAILY_CHALLENGES[2].target) } : {})
          }
        }));
      } else {
        setCombo(0);
        setLastResult({
          success: false,
          backendMessage: result.message || 'La consulta no coincide con el objetivo esperado.',
          correctAnswer: result.queryMaestra || result.correctAnswer || '',
          userAnswer,
          errorDb: result.errorDb
        });
        sounds.playError();
      }
    } catch (error) {
      setCombo(0);
      setLastResult({
        success: false,
        backendMessage: error?.response?.data?.message || 'No se pudo validar el intento. Revisa conexión y sesión.',
        correctAnswer: '',
        userAnswer
      });
      sounds.playError();
    } finally {
      setValidatingAnswer(false);
      setShowResult(true);
    }
  };

  const handleFreePractice = () => {
    setSelectedDifficulty('mixto');
    startChallenge({ id: 'free', title: 'Práctica Libre', target: Infinity, reward: 0 }, 'mixto');
  };

  const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
  const visibleQuickReward = query
    ? dailyQuickRemaining === null
      ? query.xpReward
      : Math.max(0, Math.min(query.xpReward, dailyQuickRemaining))
    : 0;

  if (loadingPractice) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
      >
        <div className="glass-card-apple rounded-3xl p-8 text-center max-w-md w-full">
          <DagonMascot size="large" mood="excited" />
          <div className="mt-4 flex items-center justify-center gap-3 text-cyan-200">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-lg font-black">Preparando práctica relámpago</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Cargando ejercicios reales de tu nivel y ajustando el reloj.
          </p>
        </div>
      </motion.div>
    );
  }

  if (showDifficultySelect) {
    const availableLevels = getAvailableLevels();
    const recommendedLevelKey = availableLevels[availableLevels.length - 1] || 'nivel-0';
    
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

            <div className="mb-4 sm:mb-6 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 sm:p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] font-black text-cyan-300 mb-2">
                Entrenamiento con presión controlada
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Cada acierto correcto protege o revive tu racha. La XP es real y limitada a 25 XP diarios para que ayude sin romper tu progreso principal.
                {dailyQuickRemaining !== null && ` Restan ${dailyQuickRemaining} XP relámpago por ganar hoy.`}
              </p>
            </div>

            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                Selecciona Dificultad
              </h3>
              <div className="difficulty-grid">
                {availableLevels.map((levelKey) => {
                  const level = LEVEL_NAMES[levelKey] || { name: levelKey, icon: 'SQL', description: '', color: 'from-gray-500 to-slate-600' };
                  const isUnlocked = true;
                  const isRecommended = levelKey === recommendedLevelKey;
                  
                  return (
                    <motion.button
                      key={levelKey}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDifficultySelect(levelKey)}
                      disabled={loadingPractice}
                      className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                        isUnlocked
                          ? `bg-gradient-to-r ${level.color} ${isRecommended ? 'border-yellow-300/80 shadow-[0_0_22px_rgba(250,204,21,0.22)]' : 'border-white/20 hover:border-white/40'}`
                          : 'bg-slate-800/50 border-slate-700 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-black/20 font-mono text-xs font-black text-white ring-1 ring-white/20">
                            {level.icon}
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-white text-sm sm:text-base">{level.name}</p>
                              {isRecommended && (
                                <span className="rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-yellow-100">
                                  Recomendado
                                </span>
                              )}
                            </div>
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
                      onClick={() => {
                        if (!completed) {
                          setShowDifficultySelect(false);
                          startChallenge(challenge);
                        }
                      }}
                      className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                        completed 
                          ? 'bg-green-500/20 border-green-500/50' 
                          : 'bg-white/5 border-white/10 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10 font-mono text-xs font-black text-cyan-100 ring-1 ring-cyan-300/20">
                            {challenge.icon}
                          </span>
                          <div>
                            <p className="font-semibold text-white text-sm sm:text-base">{challenge.title}</p>
                            <p className="text-xs sm:text-sm text-slate-400">{challenge.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-bold text-xs sm:text-sm">{challenge.rewardLabel}</p>
                          {completed ? (
                            <span className="text-green-400 text-xs sm:text-sm">Completado</span>
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
              className="w-full py-4 sm:py-6 text-base sm:text-lg font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 shadow-lg shadow-emerald-500/25"
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
              className="w-full mt-4 sm:mt-6 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 shadow-lg shadow-emerald-500/25"
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
              <div>
                <p className="text-white text-base sm:text-lg font-bold">{query.description}</p>
                <p className="mt-1 flex items-start gap-2 text-slate-300 text-sm sm:text-base">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <span>{query.hint}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${
                  query.difficulty <= 2 ? 'bg-green-500/20 text-green-400' :
                  query.difficulty <= 3 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  Nivel {query.difficulty}
                </span>
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-bold text-cyan-200">
                  {query.concept}
                </span>
                <span className="rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-bold text-yellow-200">
                  {visibleQuickReward > 0 ? `+${visibleQuickReward} XP` : 'Racha'}
                </span>
              </div>
            </div>

            <Progress
              value={(timer / Math.max(query.timeLimitSeconds || 30, 1)) * 100}
              className="h-1.5 mb-4"
            />
            
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
              disabled={droppedWords.length === 0 || validatingAnswer}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl"
            >
              {validatingAnswer ? 'Validando en el sandbox...' : 'Verificar Respuesta'}
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
                  <p className="text-xl sm:text-2xl text-yellow-400 font-bold">
                    {lastResult.xp > 0 ? `+${lastResult.xp} XP reales` : 'Racha protegida'}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {lastResult.backendMessage || 'Intento correcto registrado en el backend.'}
                  </p>
                  {lastResult.streakSaved && (
                    <p className="text-xs sm:text-sm font-bold text-orange-300">
                      Este acierto cuenta para revivir o proteger tu racha de hoy.
                    </p>
                  )}
                  {lastResult.xpCapReached && (
                    <p className="text-xs sm:text-sm text-cyan-200">
                      Ya cubriste el cupo diario de 25 XP relámpago; puedes seguir practicando por racha y fluidez.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-800/50 rounded-xl">
                  <p className="text-slate-300 text-sm mb-2">
                    {lastResult.backendMessage || lastResult.message || 'La consulta necesita corrección.'}
                  </p>
                  {lastResult.userAnswer && (
                    <>
                      <p className="text-slate-500 text-xs sm:text-sm mb-1">Tu intento:</p>
                      <p className="mb-3 text-white font-mono text-xs sm:text-sm break-words">{lastResult.userAnswer}</p>
                    </>
                  )}
                  {lastResult.correctAnswer && (
                    <>
                      <p className="text-slate-500 text-xs sm:text-sm mb-1">Consulta esperada:</p>
                      <p className="text-cyan-100 font-mono text-xs sm:text-sm break-words">{lastResult.correctAnswer}</p>
                    </>
                  )}
                </div>
              )}

              <div className="mt-4 sm:mt-6 rounded-xl border border-white/10 bg-slate-900/50 p-4 text-left">
                <p className="text-[10px] uppercase tracking-[0.24em] font-black text-cyan-300 mb-3">
                  Cierre formativo
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Precisión</p>
                    <p className="mt-1 text-lg font-black text-white">{accuracy}%</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Concepto</p>
                    <p className="mt-1 text-sm font-bold text-white">{inferPracticeLearning(query)}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">XP de sesión</p>
                    <p className="mt-1 text-lg font-black text-yellow-300">{score}</p>
                  </div>
                </div>
                {dailyQuickRemaining !== null && (
                  <p className="mt-3 text-xs font-bold uppercase tracking-widest text-cyan-300">
                    XP relámpago restante hoy: {dailyQuickRemaining}
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {buildPracticeRecommendation(query, lastResult.success)}
                </p>
              </div>
              
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
                  className="text-sm sm:text-base bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Siguiente
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showStreakAnimation && streakData && (
        <StreakAnimation 
          streakCount={streakData.count} 
          onComplete={() => { setShowStreakAnimation(false); setStreakData(null); }} 
        />
      )}
    </motion.div>
  );
};
