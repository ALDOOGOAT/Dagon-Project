import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { RewardAnimation } from '../components/RewardAnimation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LevelTheory, getSubTopicKey } from '../components/LevelTheory';
import { MerDiagramBuilder } from '../components/MerDiagramBuilder';
import { ModuleCinematic } from '../components/ModuleCinematic';
import { sounds } from '../lib/SoundEngine';
import {
  ArrowLeft, CheckCircle, XCircle, Database,
  Play, Loader, GripHorizontal, Bot, Zap, Flame, Lightbulb, ChevronRight, ChevronDown, ChevronUp, RotateCcw, Shield, BookOpen, Target, Film, Award, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';
import apiClient from '../services/apiClient';
import { formatAIMessage, buildRowSignature, buildTransactionDiff, isTransactionExercise, inferLearningFocus, buildLocalClawbotFallback, buildLearningFeedback } from '../lib/exerciseHelpers';
import { LEARNING_CONCEPTS, inferConceptKey, recordLearningAttempt } from '../lib/learningProgress';
import { DataComparisonTable, CompactSection, TransactionPedagogyCard, TransactionSimulationPanel, TransactionOutcomePanel } from '../components/TransactionPanels';

const XPPop = ({ amount }) => (
  <div className="pointer-events-none fixed inset-0 z-[9990] flex items-center justify-center">
    <span className="font-display font-black text-5xl text-gradient-gold animate-float-up drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]">
      +{amount} XP
    </span>
  </div>
);

const SuccessBurst = () => (
  <div className="pointer-events-none fixed inset-0 z-[9989] overflow-hidden">
    {[...Array(24)].map((_, i) => {
      const angle = (i / 24) * 360;
      const dist = 120 + Math.random() * 60;
      const x = Math.cos((angle * Math.PI) / 180) * dist;
      const y = Math.sin((angle * Math.PI) / 180) * dist;
      return (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 w-2.5 h-2.5 rounded-full"
          style={{ background: ['#facc15', '#22d3ee', '#10b981', '#f97316', '#a855f7'][i % 5] }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x, y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
        />
      );
    })}
  </div>
);

export const ExercisePage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { user, token, updateUserXP } = useAuth();
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;
  const headerControlClass = "a11y-top-action border-2 rounded-xl font-display font-black shadow-[0_10px_26px_rgba(2,6,23,0.18)] hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(2,6,23,0.26)] transition-all";
  const headerControlStyle = {
    color: headingColor,
    backgroundColor: isLight ? 'rgba(255,255,255,0.84)' : 'rgba(15,23,42,0.76)',
    borderColor: isLight ? 'rgba(245,158,11,0.34)' : 'rgba(148,163,184,0.30)'
  };

  const [isMounted, setIsMounted] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const cinematicSeenKey = useMemo(() => `dagon_module_cinematic_seen_${user?.idUsuario || 'local'}_${levelId}`, [levelId, user?.idUsuario]);
  const [moduleMetadata, setModuleMetadata] = useState(null);
  const [showTheory, setShowTheory] = useState(true);
  const [showModuleCinematic, setShowModuleCinematic] = useState(true);
  const [resumeTheoryAfterCinematic, setResumeTheoryAfterCinematic] = useState(true);
  const [currentSubTopic, setCurrentSubTopic] = useState(null);
  const [shownSubTopics, setShownSubTopics] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [lastXPGained, setLastXPGained] = useState(0);
  const [levelUpData, setLevelUpData] = useState(null);

  const [droppedWords, setDroppedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);

  const [editorCode, setEditorCode] = useState('');
  const [executionResult, setExecutionResult] = useState(null);

  const [clawbotThinking, setClawbotThinking] = useState(false);
  const [clawbotMessage, setClawbotMessage] = useState(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [learningProgressEvent, setLearningProgressEvent] = useState(null);
  const [progressiveHint, setProgressiveHint] = useState(null);
  const [reinforcementPlan, setReinforcementPlan] = useState(null);

  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(false);
  const [burst, setBurst] = useState(false);
  const [xpPop, setXpPop] = useState(null);
  
  // Estados para intervención pedagógica de Dagon
  const [isDagonIntervening, setIsDagonIntervening] = useState(false);
  const [dagonTypingQuery, setDagonTypingQuery] = useState('');
  const [dagonShowPostMessage, setDagonShowPostMessage] = useState(false);
  const [dagonOriginalQuery, setDagonOriginalQuery] = useState('');

  useEffect(() => { 
    setIsMounted(true); 
    sounds.init();
    sounds.startBackgroundMusic();
    return () => sounds.stopBackgroundMusic();
  }, []);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await apiClient.get(`/api/exercises/${levelId}`);
        const data = response.data;
        const loaded = data.exercises || [];
        const alreadySeen = localStorage.getItem(cinematicSeenKey) === 'true';
        setExercises(loaded);
        setModuleMetadata(data.module || null);
        setResumeTheoryAfterCinematic(true);
        setShowModuleCinematic(!alreadySeen);
        setShowTheory(true);

        // Establecer el subtema inicial basado en el primer ejercicio
        if (loaded.length > 0) {
          const firstOrder = loaded[0].orden || 1;
          const initialKey = getSubTopicKey(levelId, firstOrder);
          if (initialKey) {
            setCurrentSubTopic(initialKey);
          }
        }
      } catch (error) {
        toast.error('Error al cargar ejercicios desde el servidor');
      } finally {
        setLoading(false);
      }
    };
    if (token && levelId) fetchExercises();
  }, [cinematicSeenKey, levelId, token]);

  useEffect(() => {
    if (exercises.length > 0) {
      const exercise = exercises[currentExerciseIndex];

      // Detectar si cambiamos de subtema y mostrar teoría intermedia
      const subKey = getSubTopicKey(levelId, exercise.orden || (currentExerciseIndex + 1));
      if (subKey && !shownSubTopics.has(subKey)) {
        setCurrentSubTopic(subKey);
        setShowTheory(true);
      }

      if (exercise.type === 'drag_drop') {
        const wordObjects = (exercise.wordBank || []).map((word, idx) => ({ id: `word-${idx}`, word }));
        setAvailableWords(wordObjects);
        setDroppedWords([]);
      } else {
        setEditorCode(exercise.starterCode || '');
      }
      setExecutionResult(null);
      setClawbotMessage(null);
      setShowHint(false);
      setProgressiveHint(null);
      setReinforcementPlan(null);
    }
  }, [currentExerciseIndex, exercises, levelId, shownSubTopics]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === 'wordBank' && destination.droppableId === 'dropZone') {
      const wordObj = availableWords[source.index];
      setAvailableWords(prev => prev.filter((_, i) => i !== source.index));
      setDroppedWords(prev => {
        const copy = [...prev];
        copy.splice(destination.index, 0, wordObj);
        return copy;
      });
    } else if (source.droppableId === 'dropZone' && destination.droppableId === 'wordBank') {
      const wordObj = droppedWords[source.index];
      setDroppedWords(prev => prev.filter((_, i) => i !== source.index));
      setAvailableWords(prev => [...prev, wordObj]);
    } else if (source.droppableId === 'dropZone' && destination.droppableId === 'dropZone') {
      setDroppedWords(prev => {
        const copy = [...prev];
        const [moved] = copy.splice(source.index, 1);
        copy.splice(destination.index, 0, moved);
        return copy;
      });
    }
  };

  const invokeClawbot = async (errorData) => {
    setClawbotThinking(true);
    try {
      const response = await apiClient.post('/api/clawbot/analyze', errorData);
      const data = response.data;
      setClawbotMessage(data.mensaje || data.response || "No tengo pistas en este momento.");
    } catch {
      setClawbotMessage(buildLocalClawbotFallback(errorData, exercises[currentExerciseIndex]));
    } finally {
      setClawbotThinking(false);
    }
  };

  const registerGamifiedAttempt = ({ exercise, success, attempts }) => {
    const focus = inferLearningFocus(exercise, levelId);
    const event = recordLearningAttempt({
      userId: user?.idUsuario || 'local',
      moduleId: levelId,
      exercise,
      success,
      attempts,
      focus,
    });

    setLearningProgressEvent(event);
    setProgressiveHint(success ? null : event.progressiveHint);
    setReinforcementPlan(success ? null : event.reinforcement);

    if (event.unlockedBadges.length > 0) {
      event.unlockedBadges.forEach((badge) => {
        toast.success(`Insignia desbloqueada: ${badge.badge}`);
      });
      sounds.playUnlock?.();
    }

    if (event.constancy.attempts === 1) {
      toast.success('Constancia registrada: practicaste SQL hoy.');
    } else if (!success && event.constancy.attempts === 3) {
      toast.message('Refuerzo activado', {
        description: 'Aunque no haya salido perfecto, ya reuniste practica suficiente para detectar patrones.',
      });
    }

    return event;
  };

  const handleValidate = async () => {
    setValidating(true);
    setClawbotMessage(null);
    const exercise = exercises[currentExerciseIndex];
    try {
      // El editorCode guardará el texto SQL, o el JSON si es un diagrama
      const query = exercise.type === 'drag_drop'
        ? droppedWords.map(w => w.word).join(' ')
        : editorCode;

      const response = await apiClient.post(`/api/exercises/${exercise.id}/validate`, { query });
      const result = response.data;

      if (result.success) {
        // === INTERVENCIÓN PEDAGÓGICA ===
        if (result.isPedagogicalIntervention) {
          setExecutionResult({ ...result });
          setIsDagonIntervening(true);
          setDagonTypingQuery('');
          setDagonShowPostMessage(false);
          setDagonOriginalQuery(result.userOriginalQuery || '');
          
          // Animación de máquina de escribir
          let i = 0;
          const queryToType = result.dagonActionQuery || '';
          const typingInterval = setInterval(() => {
            setDagonTypingQuery(prev => prev + queryToType.charAt(i));
            i++;
            if (i >= queryToType.length) {
              clearInterval(typingInterval);
              // Después de terminar de escribir, mostrar mensaje final
              setTimeout(() => {
                setDagonShowPostMessage(true);
              }, 800);
            }
          }, 40);
          
          sounds.playMagic();
          setValidating(false);
          return;
        }
        
        // Limpiar intervención pedagógica si ya se había mostrado
        if (isDagonIntervening || result.dagonPostMessage) {
          setIsDagonIntervening(false);
        }
        // =================================
        
        const prevXP = user?.xp || 0;
        const gained = result.xp_gained || 0;
        const newXP = prevXP + gained;
        if (gained > 0) {
          updateUserXP(newXP);
          setLastXPGained(gained);
          setXpPop(gained);
          setTimeout(() => setXpPop(null), 1700);
          const prevLvl = Math.floor(prevXP / 100) + 1;
          const newLvl = Math.floor(newXP / 100) + 1;
          if (newLvl > prevLvl) {
            setLevelUpData({ newLevel: newLvl });
            sounds.playUnlock?.();
          }
          setShowReward(true);
        } else {
          toast.success(result.message);
        }
        // Guardamos TODO el resultado para que el componente tenga acceso a isDML, beforeData, etc.
        setExecutionResult({ ...result });
        registerGamifiedAttempt({ exercise, success: true, attempts: intentosFallidos + 1 });
        setBurst(true);        setTimeout(() => setBurst(false), 1300);
        setIntentosFallidos(0);
        setCombo(c => c + 1);
        sounds.playSuccess();
      } else if (result.isWarning) {
        toast.warning(result.message);
        registerGamifiedAttempt({ exercise, success: true, attempts: intentosFallidos + 1 });
        setExecutionResult({ 
          ...result,
          success: true,
          isWarning: true 
        });
        sounds.playSoftWarning?.();
      } else {
        toast.error(result.message);
        // Limpiar intervención pedagógica si existe
        setIsDagonIntervening(false);
        setExecutionResult({ ...result, success: false, message: result.message });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setCombo(0);
        sounds.playError();
        if (result.descripcion) {
          const nuevos = intentosFallidos + 1;
          setIntentosFallidos(nuevos);
          registerGamifiedAttempt({ exercise, success: false, attempts: nuevos });
          invokeClawbot({
            descripcion: result.descripcion,
            queryAlumno: result.queryAlumno,
            errorDb: result.errorDb || result.message,
            intentos: nuevos,
            nivelId: parseInt(levelId),
            ejercicioId: exercise.id,
            tituloEjercicio: exercise.title,
          });
        } else {
          const nuevos = intentosFallidos + 1;
          setIntentosFallidos(nuevos);
          registerGamifiedAttempt({ exercise, success: false, attempts: nuevos });
          setClawbotMessage(buildLocalClawbotFallback({
            errorDb: result.errorDb || result.message,
            intentos: nuevos,
            nivelId: parseInt(levelId),
            tituloEjercicio: exercise.title,
          }, exercise));
        }
      }
    } catch (error) {
      toast.error('Error al validar ejercicio');
      setClawbotMessage(buildLocalClawbotFallback({
        errorDb: 'No se pudo validar contra el servidor en este momento.',
        intentos: Math.max(intentosFallidos, 1),
        nivelId: parseInt(levelId),
        tituloEjercicio: exercise.title,
      }, exercise));
      registerGamifiedAttempt({ exercise, success: false, attempts: Math.max(intentosFallidos + 1, 1) });
    } finally {
      setValidating(false);
    }
  };

  const mascotMood = useMemo(() => {
    if (clawbotThinking) return 'nervous';
    if (executionResult?.success) {
      if (currentExerciseIndex === exercises.length - 1) return 'celebrating';
      return 'excited';
    }
    if (intentosFallidos >= 2) return 'nervous';
    if (executionResult?.success === false) return 'sad';
    if (intentosFallidos === 1) return 'disappointed';
    return 'determined';
  }, [clawbotThinking, executionResult, intentosFallidos, currentExerciseIndex, exercises.length]);

  const exerciseProgress = useMemo(() => {
    if (exercises.length === 0) return 0;
    return ((currentExerciseIndex + (executionResult?.success ? 1 : 0)) / exercises.length) * 100;
  }, [currentExerciseIndex, exercises.length, executionResult]);

  const handleResetSandbox = async () => {
    const confirmed = window.confirm(
      '🔄 ¿RESTABLECER BASE DE DATOS?\n\n' +
      'Esto hará que TODOS tus cambios se pierdan:\n' +
      '• Los datos que hayas insertsdo\n' +
      '• Las tablas que hayas creado\n' +
      '• Los registros modificados o borrados\n\n' +
      '⚠️ IMPORTANTE: Esta acción no se puede deshacer.\n\n' +
      'Las tablas volveran a su estado original con los datos de ejemplo.\n\n' +
      '¿Continuar?'
    );
    if (!confirmed) return;
    
    try {
      const response = await apiClient.post('/api/modulos/reset-sandbox');
      if (response.status >= 200 && response.status < 300) {
        toast.success('✅ ¡Base de datos restablecida!\n\nTus tablas ahora tienen los datos originales.');
        sounds.playMagic();
        setExecutionResult(null);
        setDroppedWords([]);
        setEditorCode('');
      } else {
        toast.error('❌ No se pudo restablecer la base de datos.');
      }
    } catch (e) {
      toast.error('❌ Error de conexión al restablecer.');
    }
  };

  const handleLevelJump = (index) => {
    const targetExercise = exercises[index];
    if (!targetExercise) return;

    // 1. Determinar si el nivel al que saltamos tiene teoría nueva
    const subKey = getSubTopicKey(levelId, targetExercise.orden || (index + 1));
    
    // 2. Resetear estados
    if (subKey && !shownSubTopics.has(subKey)) {
      setCurrentSubTopic(subKey);
      setShowTheory(true);
      sounds.playTheoryOpen();
    } else {
      setShowTheory(false);
    }

    setExecutionResult(null);
    setClawbotMessage(null);
    setCurrentExerciseIndex(index);
    setEditorCode(targetExercise.starterCode || ''); 
    setShowHint(false);
  };

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: `${colors.primary}18` }} />
          <DagonMascot size="large" mood="thinking" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-48 h-3 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.74)' : '#334155' }}>
            <div className="h-full rounded-full animate-shimmer-width" style={{ width: '60%', background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }} />
          </div>
          <p className="text-sm font-gameui" style={{ color: colors.primary }}>Cargando misión...</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <DagonMascot size="large" mood="sad" />
        <p className="text-xl font-gameui" style={{ color: headingColor }}>Este módulo aún no tiene misiones.</p>
        <Button onClick={() => navigate('/dashboard')} style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, color: isLight ? '#1f2937' : '#ffffff' }}>Volver al mapa</Button>
      </div>
    );
  }

  const exercise = exercises[currentExerciseIndex];
  const isDragDrop = exercise.type === 'drag_drop';
  const isDiagram = exercise.type === 'diagram'; // <-- DETECTAMOS SI ES UN DIAGRAMA
  const isTransactionLab = isTransactionExercise(exercise, levelId);
  const learningFocus = inferLearningFocus(exercise, levelId);
  const learningFeedback = buildLearningFeedback(executionResult, learningFocus, intentosFallidos);
  const activeConceptKey = learningProgressEvent?.conceptKey || inferConceptKey(exercise, levelId);
  const activeConcept = LEARNING_CONCEPTS[activeConceptKey] || LEARNING_CONCEPTS.select;
  const conceptMasteryValue = learningProgressEvent?.mastery || 0;
  const applyReinforcementScaffold = () => {
    if (isDragDrop || isDiagram || !reinforcementPlan?.scaffold) return;
    setEditorCode(reinforcementPlan.scaffold);
    sounds.playSelect?.();
    toast.message('Plantilla de refuerzo cargada', {
      description: 'Completa los nombres reales de columnas, tablas y condiciones antes de validar.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="exercise-page">
      {showReward && (
        <RewardAnimation
          type="success" xpGained={lastXPGained} isLevelUp={!!levelUpData}
          newLevel={levelUpData?.newLevel}
          onComplete={() => { setShowReward(false); setLevelUpData(null); }}
        />
      )}
      {burst && <SuccessBurst />}
      {xpPop != null && <XPPop amount={xpPop} />}

      {/* HEADER */}
      <header className="border-b backdrop-blur-md z-10 shrink-0" style={{ backgroundColor: isLight ? 'rgba(255,252,245,0.90)' : 'rgba(2,6,23,0.90)', borderColor: isLight ? 'rgba(245,158,11,0.14)' : '#1e293b' }}>
        <div className="px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className={`${headerControlClass} px-2 sm:px-3 shrink-0`} style={headerControlStyle} aria-label="Volver al dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            <div className="hidden sm:block h-6 w-px" style={{ backgroundColor: isLight ? 'rgba(217,119,6,0.18)' : 'rgba(255,255,255,0.10)' }} />
            <Button 
              variant="ghost" 
              onClick={handleResetSandbox} 
              className={`${headerControlClass} px-2 sm:px-3 shrink-0`}
              title="🔄 Restablecer tabla: Borra todos tus cambios y vuelve a los datos originales del ejercicio. Útil si cometiste muchos errores o quieres empezar de nuevo."
              style={{ ...headerControlStyle, color: mutedColor, borderColor: isLight ? 'rgba(251,146,60,0.42)' : 'rgba(251,146,60,0.34)' }}
              aria-label="Restablecer tabla del sandbox"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Restablecer</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                sounds.playCinematicPulse?.();
                setResumeTheoryAfterCinematic(showTheory);
                setShowModuleCinematic(true);
              }}
              className={`${headerControlClass} px-2 sm:px-3 shrink-0`}
              style={{ ...headerControlStyle, borderColor: isLight ? 'rgba(34,211,238,0.42)' : 'rgba(34,211,238,0.36)', color: isLight ? '#0e7490' : '#67e8f9' }}
              title="Volver a ver la cinemática de este módulo"
              aria-label="Volver a ver la cinemática de este módulo"
            >
              <Film className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Cinemática</span>
            </Button>
            </div>
            <h1 className="font-display text-sm sm:text-base font-black flex items-center gap-2 min-w-0" style={{ color: headingColor }}>
              <Database className="w-4 h-4" style={{ color: colors.primary }} />
              Módulo {levelId}
              <span className="text-xs sm:text-sm font-gameui ml-1 truncate" style={{ color: mutedColor }}>
                · Misión {currentExerciseIndex + 1}/{exercises.length}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border-2 overflow-x-auto scrollbar-none w-full lg:w-auto lg:max-w-[40%] shadow-[0_12px_34px_rgba(2,6,23,0.24)]" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.84)' : 'rgba(15,23,42,0.82)', borderColor: isLight ? 'rgba(245,158,11,0.26)' : 'rgba(34,211,238,0.22)' }}>
            {exercises.map((_, i) => {
              const isCompleted = i < currentExerciseIndex;
              const isCurrent = i === currentExerciseIndex;
              const isUnlocked = true; // Navegación libre para pruebas
              
              return (
                <div key={i} className="flex items-center shrink-0">
                  <button 
                    onClick={() => isUnlocked && handleLevelJump(i)}
                    aria-label={`Ir a la misión ${i + 1}`}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`
                      w-9 h-9 rounded-xl flex items-center justify-center font-display text-[10px] font-black transition-all duration-300 border
                      ${isCurrent ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white scale-110 shadow-[0_0_24px_rgba(34,211,238,0.62)] border-cyan-200 z-10' :
                        isCompleted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500 hover:text-white' :
                        'bg-slate-800/80 text-slate-300 border-slate-600 hover:bg-slate-700 hover:border-cyan-400/60 hover:text-white'}
                    `}
                    title={`Misión ${i + 1}`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </button>
                  {i < exercises.length - 1 && (
                    <div className={`w-3 h-0.5 rounded-full mx-0.5 ${i < currentExerciseIndex ? 'bg-emerald-500/30' : 'bg-slate-800'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 shadow-[0_10px_24px_rgba(2,6,23,0.18)]" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.84)' : '#0f172a', borderColor: isLight ? 'rgba(245,158,11,0.34)' : 'rgba(250,204,21,0.28)' }}>
              <Zap className="w-4 h-4" style={{ color: isLight ? '#d97706' : '#fde047' }} />
              <span className="font-display font-black text-sm" style={{ color: isLight ? '#b45309' : '#fef08a' }}>{user?.xp || 0}</span>
            </div>
            <AnimatePresence>
              {combo >= 2 && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-2 bg-orange-500/15 px-3 py-1.5 rounded-full border border-orange-400/40"
                >
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span className="font-display font-black text-orange-300 text-sm">x{combo}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="h-1" style={{ backgroundColor: isLight ? 'rgba(120,113,108,0.14)' : '#0f172a' }}>
          <motion.div className="h-full"
            style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }}
            animate={{ width: `${exerciseProgress}%` }} transition={{ duration: 0.5 }} />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto scroll-fancy pb-24 sm:pb-8">
        {showModuleCinematic ? (
          <ModuleCinematic
            moduleId={levelId}
            moduleMetadata={moduleMetadata}
            exercises={exercises}
            onComplete={() => {
              localStorage.setItem(cinematicSeenKey, 'true');
              setShowModuleCinematic(false);
              setShowTheory(resumeTheoryAfterCinematic);
            }}
          />
        ) : showTheory ? (
          <LevelTheory
            levelId={levelId}
            subTopic={currentSubTopic}
            onComplete={() => {
              if (currentSubTopic) {
                setShownSubTopics(prev => new Set([...prev, currentSubTopic]));
              }
              setShowTheory(false);
            }}
          />
        ) : (
          <div className={`max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-5 sm:space-y-6 ${shake ? 'animate-shake-x' : ''}`}>

            {/* ESTADO PEDAGÓGICO */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
            >
              <div className="rounded-2xl border p-4" style={{ borderColor: `${colors.primary}30`, backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.62)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" style={{ color: colors.primary }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: colors.primary }}>Meta</span>
                </div>
                <p className="text-sm font-gameui leading-relaxed" style={{ color: headingColor }}>
                  {learningFocus.objective}
                </p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(251,146,60,0.30)', backgroundColor: isLight ? 'rgba(255,247,237,0.82)' : 'rgba(124,45,18,0.16)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4" style={{ color: isLight ? '#c2410c' : '#fdba74' }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: isLight ? '#c2410c' : '#fdba74' }}>Presión sana</span>
                </div>
                <p className="text-sm font-gameui leading-relaxed" style={{ color: headingColor }}>
                  {intentosFallidos > 0
                    ? `Intento ${intentosFallidos}. Corrige una parte y vuelve a probar.`
                    : 'Puedes fallar sin perder avance; lo importante es entender el error.'}
                </p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(34,211,238,0.30)', backgroundColor: isLight ? 'rgba(236,254,255,0.78)' : 'rgba(8,47,73,0.20)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4" style={{ color: isLight ? '#0891b2' : '#67e8f9' }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: isLight ? '#0891b2' : '#67e8f9' }}>Concepto</span>
                </div>
                <p className="text-sm font-gameui leading-relaxed" style={{ color: headingColor }}>
                  {learningFocus.concept}
                </p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(168,85,247,0.30)', backgroundColor: isLight ? 'rgba(250,245,255,0.78)' : 'rgba(88,28,135,0.18)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4" style={{ color: isLight ? '#7e22ce' : '#d8b4fe' }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: isLight ? '#7e22ce' : '#d8b4fe' }}>Dominio</span>
                </div>
                <p className="text-sm font-gameui leading-relaxed" style={{ color: headingColor }}>
                  {activeConcept.label}: {conceptMasteryValue}% · {activeConcept.badge}
                </p>
              </div>
            </motion.div>

            {/* MASCOTA + INSTRUCCIONES */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card-apple rounded-3xl p-6 border relative overflow-hidden"
              style={{ borderColor: colors.border }}
            >
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${colors.primary}12` }} />
              <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="shrink-0">
                  <div className="relative">
                    <div className={`absolute -inset-4 rounded-full blur-xl transition-colors duration-500 ${
                      mascotMood === 'nervous' ? 'bg-orange-500/20' :
                      mascotMood === 'excited' ? 'bg-emerald-500/20' :
                      mascotMood === 'sad' ? 'bg-rose-500/15' : 'bg-cyan-500/15'
                    }`} />
                    <DagonMascot size="medium" mood={mascotMood} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold tracking-[0.35em] uppercase" style={{ color: colors.accent }}>
                      {exercise.title}
                    </span>
                    {intentosFallidos > 0 && !executionResult?.success && (
                      <span className="text-orange-300 text-[10px] font-bold tracking-widest uppercase bg-orange-500/10 border border-orange-400/30 px-2 py-0.5 rounded-full">
                        Intento {intentosFallidos}
                      </span>
                    )}
                  </div>
                  <p className="font-gameui text-base leading-relaxed" style={{ color: headingColor }}>
                    {exercise.description}
                  </p>

                  {isTransactionLab && (
                    <TransactionPedagogyCard pedagogia={exercise.pedagogia} colors={colors} />
                  )}

                  {/* Pista inline */}
                  {exercise.hint && !clawbotMessage && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      aria-expanded={showHint}
                      className="mt-3 text-xs font-bold flex items-center gap-1 transition-colors"
                      style={{ color: isLight ? '#b45309' : '#fcd34d' }}
                    >
                      <Lightbulb className="w-3 h-3" />
                      {showHint ? 'Ocultar pista' : 'Necesito una pista'}
                    </button>
                  )}
                  <AnimatePresence>
                    {showHint && !clawbotMessage && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="mt-2 text-sm font-gameui italic"
                        style={{ color: isLight ? '#92400e' : '#fde68a' }}
                      >
                        {exercise.hint}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {progressiveHint && !executionResult?.success && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-2xl border p-4"
                      style={{
                        borderColor: progressiveHint.level >= 3 ? 'rgba(244,63,94,0.34)' : 'rgba(245,158,11,0.34)',
                        backgroundColor: progressiveHint.level >= 3
                          ? (isLight ? 'rgba(255,241,242,0.82)' : 'rgba(127,29,29,0.16)')
                          : (isLight ? 'rgba(255,251,235,0.86)' : 'rgba(120,53,15,0.18)')
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <TrendingUp className="mt-0.5 w-5 h-5 shrink-0" style={{ color: progressiveHint.level >= 3 ? '#fb7185' : '#fbbf24' }} />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: mutedColor }}>
                            Pista progresiva nivel {progressiveHint.level}
                          </p>
                          <h3 className="mt-1 font-display text-base font-black" style={{ color: headingColor }}>
                            {progressiveHint.title}
                          </h3>
                          <p className="mt-2 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                            {progressiveHint.message}
                          </p>
                          {progressiveHint.action.includes('\n') ? (
                            <pre className="mt-3 overflow-x-auto rounded-xl border p-3 text-xs font-mono" style={{ borderColor: isLight ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.08)', backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(2,6,23,0.62)', color: isLight ? '#92400e' : '#fde68a' }}>
                              {progressiveHint.action}
                            </pre>
                          ) : (
                            <p className="mt-3 text-sm font-gameui leading-relaxed" style={{ color: headingColor }}>
                              {progressiveHint.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Clawbot message */}
              <AnimatePresence>
                {(clawbotThinking || clawbotMessage) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="mt-4 relative overflow-hidden rounded-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-rose-500/20 backdrop-blur-xl border border-white/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-rose-400/10 animate-pulse opacity-50" />
                    <div className="relative z-10 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black tracking-[0.4em] uppercase bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                            Dagon responde
                          </p>
                          <p className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: mutedColor }}>
                            {clawbotThinking ? 'Procesando...' : 'IA Generativa'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </div>
                      </div>
                      {clawbotThinking ? (
                        <div className="flex gap-1.5 py-2">
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ animationDelay: '0.15s' }} />
                          <span className="w-2 h-2 bg-rose-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(244,63,94,0.8)]" style={{ animationDelay: '0.3s' }} />
                        </div>
) : (
                        <div className="mt-2 p-4 rounded-xl overflow-hidden border" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : '#0f172a', borderColor: isLight ? 'rgba(245,158,11,0.14)' : '#334155' }}>
                          <div className="text-sm font-gameui leading-relaxed">
                            {formatAIMessage(clawbotMessage, colors)}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {reinforcementPlan && !executionResult?.success && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-2xl border p-4"
                  style={{
                    borderColor: 'rgba(34,211,238,0.30)',
                    backgroundColor: isLight ? 'rgba(236,254,255,0.78)' : 'rgba(8,47,73,0.20)'
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: isLight ? '#0891b2' : '#67e8f9' }}>
                        Práctica de refuerzo
                      </p>
                      <h3 className="mt-1 font-display text-lg font-black" style={{ color: headingColor }}>
                        {reinforcementPlan.title}
                      </h3>
                      <p className="mt-2 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                        {reinforcementPlan.reason}
                      </p>
                    </div>
                    {!isDragDrop && !isDiagram && (
                      <Button
                        onClick={applyReinforcementScaffold}
                        className="shrink-0 rounded-xl bg-cyan-500 px-4 font-display font-black text-slate-950 hover:bg-cyan-300"
                      >
                        Cargar plantilla
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* === INTERVENCIÓN PEDAGÓGICA DE DAGON === */}
              <AnimatePresence>
                {isDagonIntervening && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-900/30 to-purple-900/30"
                  >
                    <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
                    <div className="relative z-10 p-5">
                      {/* Header con Dagon */}
                      <div className="flex items-center gap-3 mb-4">
                        <DagonMascot size="medium" mood="thinking" />
                        <div>
                          <p className="text-[10px] font-black tracking-[0.4em] uppercase text-amber-400">
                            💡 Intervención Pedagógica
                          </p>
                          <p className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                            Dagon te ayuda a entender
                          </p>
                        </div>
                      </div>

                      {/* Mensaje de Dagon */}
                      <div className="mb-4 p-4 rounded-xl bg-slate-900/60 border border-amber-500/30">
                        <p className="text-sm font-gameui text-amber-100 leading-relaxed">
                          {executionResult?.dagonMessage}
                        </p>
                        <p className="mt-3 text-xs font-gameui text-slate-300 leading-relaxed">
                          {executionResult?.dagonExplanation}
                        </p>
                      </div>

                      {/* Consola con animación de escritura */}
                      <div className="mb-4 p-3 rounded-lg bg-black/80 border border-green-500/40 font-mono text-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-green-400 text-[10px] uppercase">Ejecutando en sandbox...</span>
                        </div>
                        <pre className="text-green-300 whitespace-pre-wrap break-all">{dagonTypingQuery}</pre>
                      </div>

                      {/* Mensaje post-ejecución */}
                      {dagonShowPostMessage && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-500/30"
                        >
                          <p className="text-sm font-gameui text-emerald-200">
                            {executionResult?.dagonPostMessage}
                          </p>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                              Tu query original: <code className="text-cyan-300">{dagonOriginalQuery}</code>
                            </p>
                            <button
                              onClick={() => {
                                setEditorCode(dagonOriginalQuery);
                                setIsDagonIntervening(false);
                                setDagonTypingQuery('');
                                setDagonShowPostMessage(false);
                                setExecutionResult(null);
                              }}
                              aria-label="Ejecutar mi consulta original"
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
                            >
                              Ejecutar mi query →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ARENA DE CÓDIGO O DIAGRAMA */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card-apple rounded-3xl border border-white/10 overflow-hidden relative"
            >
              {/* Barra superior */}
              <div className="bg-slate-900/80 px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-xs font-mono text-slate-400 truncate">
                    {isDiagram ? 'Diseña el Modelo Entidad-Relación' : isDragDrop ? 'Arrastra para construir tu consulta' : 'Escribe tu consulta SQL'}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    sounds.playStep();
                    handleValidate();
                  }}
                  disabled={validating || (isDragDrop && droppedWords.length === 0) || (!isDragDrop && !isDiagram && !editorCode) || clawbotThinking}
                  className="w-full sm:w-auto justify-center bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-display font-black px-6 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] transition-all"
                  aria-label="Ejecutar y validar la respuesta del ejercicio"
                >
                  {validating || clawbotThinking
                    ? <Loader className="w-4 h-4 animate-spin mr-2" />
                    : <Play className="w-4 h-4 mr-2 fill-current" />
                  }
                  {validating ? 'Validando...' : clawbotThinking ? 'Analizando...' : 'Ejecutar'}
                </Button>
              </div>

              {/* Contenedor Principal (Diagrama / Editor / Drag-drop) */}
              <div className="p-4 sm:p-5">
                {isDiagram ? (
                  <div className="h-[360px] sm:h-[420px] lg:h-[500px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner relative bg-[#090b10]">
                    <MerDiagramBuilder 
                      onChangeData={(graphData) => {
                        setEditorCode(JSON.stringify(graphData)); 
                      }} 
                    />
                  </div>
                ) : isDragDrop ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="space-y-4 sm:space-y-5">
                      {/* Zona de armado */}
                      <div>
                        <div className="flex flex-col gap-1 mb-2">
                          <p className="text-xs text-cyan-300 uppercase tracking-[0.3em] font-bold">Tu consulta:</p>
                          <p className="text-[11px] font-gameui text-slate-400">
                            En teléfono, mantén presionado un bloque y arrástralo con el dedo hasta la zona de armado.
                          </p>
                        </div>
                        <Droppable droppableId="dropZone" direction="horizontal">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} {...provided.droppableProps}
                              className={`min-h-[120px] sm:min-h-[92px] rounded-2xl border-2 border-dashed p-3 sm:p-4 flex flex-wrap gap-2.5 sm:gap-3 items-start content-start transition-all ${
                                snapshot.isDraggingOver ? 'border-cyan-400' : 'border-slate-600'
                              }`}
                              style={{
                                backgroundColor: snapshot.isDraggingOver ? '#10b9811A' : '#1e293b66'
                              }}
                            >
                              {droppedWords.length === 0 && (
                                <span className="text-slate-500 font-mono text-xs sm:text-sm italic w-full text-center py-4">
                                  Arrastra los bloques aquí para armar tu SQL...
                                </span>
                              )}
                              {droppedWords.map((w, i) => (
                                <Draggable key={`d-${w.id}`} draggableId={`d-${w.id}`} index={i}>
                                  {(prov, snap) => {
                                    const child = (
                                      <div 
                                        ref={prov.innerRef} 
                                        {...prov.draggableProps} 
                                        {...prov.dragHandleProps}
                                        style={{
                                          ...prov.draggableProps.style,
                                          userSelect: 'none',
                                          WebkitUserSelect: 'none',
                                          touchAction: 'none',
                                          pointerEvents: 'auto',
                                        }}
                                        className={`touch-drag-none bg-emerald-900/90 border-2 border-emerald-400/60 text-emerald-200 px-3 py-3 sm:px-4 sm:py-2 rounded-xl font-mono font-bold text-sm sm:text-base cursor-grab active:cursor-grabbing min-h-[52px] flex items-center ${
                                          snap.isDragging ? 'shadow-[0_0_40px_rgba(16,185,129,0.6)] scale-110 z-[9999] border-white ring-4 ring-emerald-400/20' : 'hover:bg-emerald-800'
                                        }`}
                                      >
                                        {w.word}
                                      </div>
                                    );
                                    
                                    if (snap.isDragging) {
                                      return createPortal(child, document.body);
                                    }
                                    return child;
                                  }}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                      {/* Banco de palabras */}
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-[0.3em] font-bold mb-2">Bloques disponibles:</p>
                        <Droppable droppableId="wordBank" direction="horizontal">
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}
                              className={`min-h-[132px] sm:min-h-[100px] rounded-2xl border-2 p-3 sm:p-4 flex flex-wrap gap-2.5 sm:gap-3 items-start content-start transition-all duration-300 ${
                                snapshot.isDraggingOver ? 'border-cyan-500/50 bg-slate-800/60 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]' : 'border-white/5 bg-slate-900/30'
                              }`}
                            >
                              {availableWords.map((w, i) => (
                                <Draggable key={w.id} draggableId={w.id} index={i}>
                                  {(prov, snap) => {
                                    const child = (
                                      <div 
                                        ref={prov.innerRef} 
                                        {...prov.draggableProps} 
                                        {...prov.dragHandleProps}
                                        style={{
                                          ...prov.draggableProps.style,
                                          userSelect: 'none',
                                          WebkitUserSelect: 'none',
                                          touchAction: 'none',
                                          pointerEvents: 'auto',
                                        }}
                                        className={`touch-drag-none bg-slate-800 border-2 border-slate-600 text-slate-200 px-3 py-3 sm:px-4 sm:py-2 rounded-xl font-mono font-medium text-sm sm:text-base cursor-grab active:cursor-grabbing flex items-center gap-2 min-h-[52px] ${
                                          snap.isDragging ? 'shadow-[0_0_40px_rgba(34,211,238,0.6)] scale-110 border-cyan-400 z-[9999] bg-slate-700 ring-4 ring-cyan-400/20' : 'hover:bg-slate-700 hover:-translate-y-1 hover:border-cyan-400/40'
                                        }`}
                                      >
                                        <GripHorizontal className="w-3 h-3 text-slate-500" />
                                        {w.word}
                                      </div>
                                    );

                                    if (snap.isDragging) {
                                      return createPortal(child, document.body);
                                    }
                                    return child;
                                  }}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    </div>
                  </DragDropContext>
                ) : (
                  <div className="h-[320px] sm:h-[360px] rounded-2xl overflow-hidden border border-white/10">
                    <Editor
                      height="100%"
                      defaultLanguage="sql"
                      theme="vs-dark"
                      value={editorCode}
                      onChange={(value) => setEditorCode(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 16,
                        lineNumbers: 'on',
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>

{/* RESULTADOS */}
            <AnimatePresence>
              {executionResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className={`rounded-3xl border overflow-hidden ${
                    executionResult.isWarning
                      ? 'glass-card-apple border-amber-400/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                      : executionResult.success
                        ? 'glass-card-apple border-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                        : 'glass-card-apple border-rose-400/30 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                  }`}
                >
                  <div className={`px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b ${
                    executionResult.isWarning 
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : executionResult.success 
                        ? 'border-emerald-500/20 bg-emerald-500/5' 
                        : 'border-rose-500/20 bg-rose-500/5'
                  }`}>
                    {executionResult.isWarning
                      ? <span className="text-2xl">⚠️</span>
                      : executionResult.success
                        ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                        : <XCircle className="w-5 h-5 text-rose-400" />
                    }
                    <span className={`font-display font-black ${
                      executionResult.isWarning 
                        ? 'text-amber-200' 
                        : executionResult.success 
                          ? 'text-emerald-200' 
                          : 'text-rose-200'
                    }`}>
                      {executionResult.isWarning ? '⚠️ Advertencia' : executionResult.success ? '¡Correcto!' : 'No es correcto'}
                    </span>
                    <span className="font-gameui text-sm text-slate-300 ml-2">{executionResult.message}</span>
                  </div>

                  {learningFeedback && (
                    <div className="p-5 border-b" style={{ borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="rounded-2xl border p-4"
                        style={{
                          borderColor: learningFeedback.tone === 'success'
                            ? 'rgba(16,185,129,0.35)'
                            : learningFeedback.tone === 'warning'
                              ? 'rgba(245,158,11,0.35)'
                              : 'rgba(244,63,94,0.32)',
                          backgroundColor: learningFeedback.tone === 'success'
                            ? (isLight ? 'rgba(236,253,245,0.80)' : 'rgba(6,78,59,0.18)')
                            : learningFeedback.tone === 'warning'
                              ? (isLight ? 'rgba(255,251,235,0.82)' : 'rgba(120,53,15,0.18)')
                              : (isLight ? 'rgba(255,241,242,0.82)' : 'rgba(127,29,29,0.18)')
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(15,23,42,0.55)' }}>
                            {learningFeedback.tone === 'success'
                              ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                              : learningFeedback.tone === 'warning'
                                ? <Lightbulb className="w-5 h-5 text-amber-300" />
                                : <XCircle className="w-5 h-5 text-rose-400" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.28em] font-black" style={{ color: mutedColor }}>
                              Retroalimentación de aprendizaje
                            </p>
                            <h3 className="mt-1 font-display text-lg font-black" style={{ color: headingColor }}>
                              {learningFeedback.title}
                            </h3>
                            <p className="mt-2 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                              {learningFeedback.message}
                            </p>
                            <p className="mt-3 text-sm font-gameui leading-relaxed" style={{ color: headingColor }}>
                              Siguiente acción: {learningFeedback.next}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {executionResult.transactionSimulation && (
                    <TransactionSimulationPanel simulation={executionResult.transactionSimulation} colors={colors} />
                  )}

                  {(executionResult.isTransactionVisual || executionResult.transactionOutcome) && (
                    <TransactionOutcomePanel result={executionResult} colors={colors} />
                  )}

                  {/* Tabla de datos o estructura */}
                  {executionResult.isDML ? (
                    <div className="p-5 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ANTES */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                            Estado Inicial de {executionResult.targetTable}
                          </div>
                          <div className="rounded-xl border border-white/5 bg-slate-900/40 overflow-hidden">
                             <DataComparisonTable data={executionResult.beforeData} colors={colors} />
                          </div>
                        </div>
                        {/* DESPUÉS */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Estado Posterior al Cambio
                          </div>
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                             <DataComparisonTable data={executionResult.afterData} colors={colors} highlight />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-center text-slate-500 italic">
                        Mostrando las primeras 20 filas para comparación visual.
                      </p>
                    </div>
                  ) : executionResult.mockData && executionResult.mockData.length > 0 && (
                    <div className="overflow-x-auto">
                      <div className="text-xs text-amber-400 mb-2 px-5 pt-3">
                        {executionResult.isStructure ? '📋 Estructura de la tabla' : '📊 Datos resultados'}
                      </div>
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-900/60">
                          <tr>
                            {Object.keys(executionResult.mockData[0]).map((col) => (
                              <th key={col} className="px-5 py-3 font-bold text-cyan-300">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {executionResult.mockData.map((fila, ri) => (
                            <motion.tr
                              key={ri}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: ri * 0.05 }}
                              className="border-t border-white/5 hover:bg-slate-800/30"
                            >
                              {Object.values(fila).map((val, ci) => (
                                <td key={ci} className="px-5 py-3 font-mono">{String(val)}</td>
                              ))}
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 🌟 MAGIA DIDÁCTICA: Mostrar Constraints de la tabla */}
                  {executionResult.constraintsData && executionResult.constraintsData.length > 0 && (
                    <div className="p-5 pt-0">
                      <div className="p-4 rounded-xl border bg-emerald-900/10 border-emerald-500/40">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            🛡️ Reglas Activas (Constraints)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {executionResult.constraintsData.map((regla, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-white/5">
                              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-emerald-500/30 text-emerald-400">
                                {regla.tipo === 'PRIMARY KEY' ? '🔑 PK' : 
                                 regla.tipo === 'UNIQUE' ? '✓ UNIQUE' : 
                                 regla.tipo === 'FOREIGN KEY' ? '🔗 FK' : 
                                 regla.tipo === 'CHECK' ? '⚡ CHECK' : '📋'}
                              </span>
                              <span className="text-xs font-mono text-slate-300">{regla.nombre_regla}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Siguiente misión */}
                  {(executionResult.success || executionResult.isWarning) && (
                    <div className="p-5">
                      <Button
                        onClick={() => {
                          sounds.playStep();
                          // Limpiar TODOS los estados antes de avanzar
                          setIsDagonIntervening(false);
                          setDagonTypingQuery('');
                          setDagonShowPostMessage(false);
                          setExecutionResult(null);
                          setIntentosFallidos(0);
                          setClawbotMessage(null);
                          setEditorCode('');
                          setProgressiveHint(null);
                          setReinforcementPlan(null);
                          
                          if (currentExerciseIndex < exercises.length - 1) {
                            setCurrentExerciseIndex(prev => prev + 1);
                          } else {
                            toast.success('¡Módulo completado!');
                            navigate(`/graduation/${levelId}`);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-display font-black py-4 rounded-2xl text-base sm:text-lg shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:scale-[1.01] transition-transform"
                      >
                        {currentExerciseIndex < exercises.length - 1
                          ? <>Siguiente misión <ChevronRight className="w-5 h-5 ml-1 inline" /></>
                          : 'Completar módulo 🏆'
                        }
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};
