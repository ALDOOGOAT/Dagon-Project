import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { RewardAnimation } from '../components/RewardAnimation';
import { useAuth } from '../contexts/AuthContext';
import { LevelTheory, getSubTopicKey } from '../components/LevelTheory';
import { MerDiagramBuilder } from '../components/MerDiagramBuilder';
import { sounds } from '../lib/SoundEngine';
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeft, CheckCircle, XCircle, Database,
  Play, Loader, GripHorizontal, Bot, Zap, Flame, Lightbulb, ChevronRight, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';

const formatAIMessage = (text) => {
  if (!text) return null;
  
  let cleaned = text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`{3}sql\n?([\s\S]*?)`{3}/g, '\n$1\n')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/font-weight:[^;]*;/g, '')
    .replace(/font-semibold/g, '')
    .replace(/font-bold/g, '');

  const parts = [];
  const lines = cleaned.split('\n');
  
  lines.forEach((line, idx) => {
    line = line.trim();
    if (!line) return;
    
if (line.match(/^(ERROR|Error|error):/i)) {
      parts.push({ type: 'error', text: line.replace(/^(ERROR|Error|error):\s*/i, '') });
    } else if (line.match(/^(CONCEPTO|Concepto|concepto):/i)) {
      parts.push({ type: 'concepto', text: line.replace(/^(CONCEPTO|Concepto|concepto):\s*/i, '') });
    } else if (line.match(/^(AYUDA|Ayuda|ayuda):/i)) {
      parts.push({ type: 'ayuda', text: line.replace(/^(AYUDA|Ayuda|ayuda):\s*/i, '') });
    } else if (line.match(/^(PISTA|Pista|pista):/i)) {
      parts.push({ type: 'pista', text: line.replace(/^(PISTA|Pista|pista):\s*/i, '') });
    } else if (line.match(/^(sql|SQL)/i)) {
      parts.push({ type: 'code', text: line.replace(/^(sql|SQL)\s*/i, '') });
    } else if (line.startsWith('## ') || line.startsWith('### ')) {
      parts.push({ type: 'heading', text: line.replace(/^#+\s*/, '') });
    } else if (line.match(/^SELECT|^FROM|^WHERE|^INSERT|^UPDATE|^DELETE|^JOIN|^ORDER|^GROUP/i)) {
      parts.push({ type: 'code', text: line });
    } else if (line.includes('|') && line.match(/\|/)) {
      parts.push({ type: 'table', text: line });
    } else {
      parts.push({ type: 'text', text: line });
    }
  });
  
  return parts.map((part, i) => {
    if (part.type === 'heading') {
      return <h4 key={i} className="mt-4 mb-2 text-lg font-bold" style={{ color: '#10b981' }}>{part.text}</h4>;
    }
    if (part.type === 'error') {
      return <div key={i} className="mt-3 mb-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderLeft: '4px solid #f87171', color: '#fca5a5' }}>
        <span className="text-xs uppercase tracking-wider opacity-70">❌ Error</span>
        <p className="mt-1 font-semibold">{part.text}</p>
      </div>;
    }
    if (part.type === 'concepto') {
      return <div key={i} className="mt-2 mb-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))', borderLeft: '4px solid #22c55e', color: '#86efac' }}>
        <span className="text-xs uppercase tracking-wider opacity-70">💡 Concepto</span>
        <p className="mt-1 font-semibold">{part.text}</p>
      </div>;
    }
    if (part.type === 'ayuda') {
      return <div key={i} className="mt-2 mb-3 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(251,191,36,0.15)', borderLeft: '3px solid #fbbf24', color: '#fcd34d' }}>
        <span className="text-xs uppercase tracking-wider opacity-70">🔧 Ayuda</span>
        <p className="mt-1">{part.text}</p>
      </div>;
    }
    if (part.type === 'pista') {
      return <div key={i} className="mt-2 mb-2 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(34,211,238,0.1)', borderLeft: '3px solid #22d3ee', color: '#67e8f9' }}>
        <span className="text-xs uppercase tracking-wider opacity-70">💡 Pista</span>
        <p className="mt-1">{part.text}</p>
      </div>;
    }
    if (part.type === 'porque') {
      return <div key={i} className="mt-2 mb-3 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(251,191,36,0.1)', borderLeft: '3px solid #fbbf24', color: '#fcd34d' }}>{part.text}</div>;
    }
    if (part.type === 'code') {
      return <code key={i} className="block my-2 px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto" style={{ backgroundColor: '#0f172a', color: '#6ee7b7', border: '1px solid #1e293b' }}>{part.text}</code>;
    }
    if (part.type === 'table') {
      return <div key={i} className="my-3 p-3 rounded-lg overflow-x-auto text-xs font-mono" style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>{part.text}</div>;
    }
    return <p key={i} className="mt-2 mb-1 text-sm" style={{ color: '#e2e8f0' }}>{part.text}</p>;
  });
};

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

const DataComparisonTable = ({ data, colors, highlight = false }) => {
  if (!data || data.length === 0) {
    return <div className="p-4 text-xs text-slate-500 italic">Tabla vacía</div>;
  }
  const columns = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] text-left border-collapse">
        <thead>
          <tr className="bg-white/5">
            {columns.map(col => (
              <th key={col} className="px-3 py-2 font-bold text-slate-400 uppercase tracking-tighter border-b border-white/5">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={`border-b border-white/5 ${highlight ? 'hover:bg-emerald-500/10' : 'hover:bg-white/5'}`}>
              {Object.values(row).map((val, j) => (
                <td key={j} className="px-3 py-1.5 font-mono text-slate-300">{String(val)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const ExercisePage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { user, token, updateUserXP } = useAuth();
  const { colors } = useTheme();

  const [isMounted, setIsMounted] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const [showTheory, setShowTheory] = useState(true);
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/exercises/${levelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const loaded = data.exercises || [];
        setExercises(loaded);

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
  }, [levelId, token]);

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
    }
  }, [currentExerciseIndex, exercises]);

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
    console.log("Invocando Clawbot analyze con:", errorData);
    setClawbotThinking(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clawbot/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Clawbot response:", data);
        setClawbotMessage(data.mensaje || data.response || "No tengo pistas en este momento.");
      } else {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        setClawbotMessage("Mis circuitos fallaron. Intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error invokeClawbot:", error);
      setClawbotMessage("¡Bzzz! No pude contactar mis servidores.");
    } finally {
      setClawbotThinking(false);
    }
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

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/exercises/${exercise.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query, usuarioId: user?.idUsuario })
      });
      const result = await response.json();

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
          if (newLvl > prevLvl) setLevelUpData({ newLevel: newLvl });
          setShowReward(true);
        } else {
          toast.success(result.message);
        }
        // Guardamos TODO el resultado para que el componente tenga acceso a isDML, beforeData, etc.
        setExecutionResult({ ...result });
        setBurst(true);        setTimeout(() => setBurst(false), 1300);
        setIntentosFallidos(0);
        setCombo(c => c + 1);
        sounds.playSuccess();
      } else if (result.isWarning) {
        toast.warning(result.message);
        setExecutionResult({ 
          success: true, 
          message: result.message, 
          mockData: result.mockData,
          isWarning: true 
        });
        sounds.playMagic();
      } else {
        toast.error(result.message);
        setExecutionResult({ success: false, message: result.message });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setCombo(0);
        sounds.playError();
        if (result.descripcion && result.queryMaestra) {
          const nuevos = intentosFallidos + 1;
          setIntentosFallidos(nuevos);
          invokeClawbot({
            descripcion: result.descripcion,
            queryMaestra: result.queryMaestra,
            queryAlumno: result.queryAlumno,
            errorDb: result.errorDb || result.message,
            intentos: nuevos,
          });
        }
      }
    } catch (error) {
      toast.error('Error al validar ejercicio');
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/modulos/reset-sandbox`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        }
      });
      if (response.ok) {
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
          <div className="absolute -inset-4 rounded-full bg-cyan-500/10 blur-2xl animate-pulse" />
          <DagonMascot size="large" mood="thinking" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-48 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-shimmer-width" style={{ width: '60%' }} />
          </div>
          <p className="text-cyan-300/60 text-sm font-gameui">Cargando misión...</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <DagonMascot size="large" mood="sad" />
        <p className="text-white text-xl font-gameui">Este módulo aún no tiene misiones.</p>
        <Button onClick={() => navigate('/dashboard')} className="bg-blue-600">Volver al mapa</Button>
      </div>
    );
  }

  const exercise = exercises[currentExerciseIndex];
  const isDragDrop = exercise.type === 'drag_drop';
  const isDiagram = exercise.type === 'diagram'; // <-- DETECTAMOS SI ES UN DIAGRAMA

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
      <header className="border-b backdrop-blur-md z-10 shrink-0" style={{ backgroundColor: `${colors.background}CC`, borderColor: colors.border }}>
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ color: colors.textMuted }} className="hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            <div className="h-6 w-px bg-white/10" />
            <Button 
              variant="ghost" 
              onClick={handleResetSandbox} 
              title="🔄 Restablecer tabla: Borra todos tus cambios y vuelve a los datos originales del ejercicio. Útil si cometiste muchos errores o quieres empezar de nuevo."
              className="text-slate-500 hover:text-amber-400 hover:bg-amber-400/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Restablecer
            </Button>
            <div className="h-6 w-px bg-white/10" />
            <h1 className="font-display text-base font-black flex items-center gap-2" style={{ color: colors.text }}>
              <Database className="w-4 h-4" style={{ color: colors.primary }} />
              Módulo {levelId}
              <span className="text-sm font-gameui ml-1" style={{ color: colors.textMuted }}>
                · Misión {currentExerciseIndex + 1}/{exercises.length}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border overflow-x-auto max-w-[40%] scrollbar-none" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {exercises.map((_, i) => {
              const isCompleted = i < currentExerciseIndex;
              const isCurrent = i === currentExerciseIndex;
              const isUnlocked = true; // Navegación libre para pruebas
              
              return (
                <div key={i} className="flex items-center shrink-0">
                  <button 
                    onClick={() => isUnlocked && handleLevelJump(i)}
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-display text-[10px] font-black transition-all duration-300
                      ${isCurrent ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white scale-110 shadow-[0_0_20px_rgba(34,211,238,0.5)] z-10' : 
                        isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white' : 
                        'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white'}
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Zap className="w-4 h-4 text-yellow-300" />
              <span className="font-display font-black text-yellow-200 text-sm">{user?.xp || 0}</span>
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
        <div className="h-1" style={{ backgroundColor: colors.surface }}>
          <motion.div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
            animate={{ width: `${exerciseProgress}%` }} transition={{ duration: 0.5 }} />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto scroll-fancy">
        {showTheory ? (
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
          <div className={`max-w-5xl mx-auto px-4 py-6 space-y-5 ${shake ? 'animate-shake-x' : ''}`}>

            {/* MASCOTA + INSTRUCCIONES */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card-apple rounded-3xl p-6 border border-white/10 relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex items-start gap-5">
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
                    <span className="text-cyan-300 text-[10px] font-bold tracking-[0.35em] uppercase">
                      {exercise.title}
                    </span>
                    {intentosFallidos > 0 && !executionResult?.success && (
                      <span className="text-orange-300 text-[10px] font-bold tracking-widest uppercase bg-orange-500/10 border border-orange-400/30 px-2 py-0.5 rounded-full">
                        Intento {intentosFallidos}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-100 font-gameui text-base leading-relaxed">
                    {exercise.description}
                  </p>

                  {/* Pista inline */}
                  {exercise.hint && !clawbotMessage && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="mt-3 text-amber-300 text-xs font-bold flex items-center gap-1 hover:text-amber-200 transition-colors"
                    >
                      <Lightbulb className="w-3 h-3" />
                      {showHint ? 'Ocultar pista' : 'Necesito una pista'}
                    </button>
                  )}
                  <AnimatePresence>
                    {showHint && !clawbotMessage && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="mt-2 text-amber-200/80 text-sm font-gameui italic"
                      >
                        {exercise.hint}
                      </motion.p>
                    )}
                  </AnimatePresence>
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black tracking-[0.4em] uppercase bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 bg-clip-text text-transparent">
                            Dagon responde
                          </p>
                          <p className="text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase">
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
                        <div className="mt-2 p-4 rounded-xl overflow-hidden" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
                          <div className="text-sm font-gameui leading-relaxed">
                            {formatAIMessage(clawbotMessage)}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                              }}
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
              <div className="bg-slate-900/80 px-5 py-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-xs font-mono text-slate-400">
                    {isDiagram ? 'Diseña el Modelo Entidad-Relación' : isDragDrop ? 'Arrastra para construir tu consulta' : 'Escribe tu consulta SQL'}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    sounds.playStep();
                    handleValidate();
                  }}
                  disabled={validating || (isDragDrop && droppedWords.length === 0) || (!isDragDrop && !isDiagram && !editorCode) || clawbotThinking}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-display font-black px-6 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] transition-all"
                >
                  {validating || clawbotThinking
                    ? <Loader className="w-4 h-4 animate-spin mr-2" />
                    : <Play className="w-4 h-4 mr-2 fill-current" />
                  }
                  {validating ? 'Validando...' : clawbotThinking ? 'Analizando...' : 'Ejecutar'}
                </Button>
              </div>

              {/* Contenedor Principal (Diagrama / Editor / Drag-drop) */}
              <div className="p-5">
                {isDiagram ? (
                  <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner relative bg-[#090b10]">
                    <MerDiagramBuilder 
                      onChangeData={(graphData) => {
                        setEditorCode(JSON.stringify(graphData)); 
                      }} 
                    />
                  </div>
                ) : isDragDrop ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="space-y-5">
                      {/* Zona de armado */}
                      <div>
                        <p className="text-xs text-cyan-300 uppercase tracking-[0.3em] font-bold mb-2">Tu consulta:</p>
                        <Droppable droppableId="dropZone" direction="horizontal">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} {...provided.droppableProps}
                              className={`min-h-[80px] rounded-2xl border-2 border-dashed p-4 flex flex-wrap gap-2 items-start content-start transition-all ${
                                snapshot.isDraggingOver ? 'border-cyan-400' : 'border-slate-600'
                              }`}
                              style={{
                                backgroundColor: snapshot.isDraggingOver ? `${colors.primary}1A` : `${colors.surface}66`
                              }}
                            >
                              {droppedWords.length === 0 && (
                                <span className="text-slate-500 font-mono text-sm italic w-full text-center py-4">
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
                                          pointerEvents: 'auto',
                                        }}
                                        className={`bg-emerald-900/90 border-2 border-emerald-400/60 text-emerald-200 px-4 py-2 rounded-xl font-mono font-bold cursor-grab active:cursor-grabbing ${
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
                              className={`min-h-[100px] rounded-2xl border-2 p-4 flex flex-wrap gap-3 items-start content-start transition-all duration-300 ${
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
                                          pointerEvents: 'auto',
                                        }}
                                        className={`bg-slate-800 border-2 border-slate-600 text-slate-200 px-4 py-2 rounded-xl font-mono font-medium cursor-grab active:cursor-grabbing flex items-center gap-2 ${
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
                  <div className="h-[280px] rounded-2xl overflow-hidden border border-white/10">
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
                  <div className={`px-5 py-4 flex items-center gap-3 border-b ${
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

                  {/* Siguiente misión */}
                  {(executionResult.success || executionResult.isWarning) && (
                    <div className="p-5">
                      <Button
                        onClick={() => {
                          sounds.playStep();
                          if (currentExerciseIndex < exercises.length - 1) {
                            setCurrentExerciseIndex(prev => prev + 1);
                            setExecutionResult(null);
                          } else {
                            toast.success('¡Módulo completado!');
                            navigate(`/graduation/${levelId}`);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-display font-black py-4 rounded-2xl text-lg shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:scale-[1.01] transition-transform"
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