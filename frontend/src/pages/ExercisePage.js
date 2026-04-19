import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { RewardAnimation } from '../components/RewardAnimation';
import { useAuth } from '../contexts/AuthContext';
import { LevelTheory } from '../components/LevelTheory';
import { MerDiagramBuilder } from '../components/MerDiagramBuilder'; // <-- IMPORTACIÓN DEL LIENZO MER
import {
  ArrowLeft, CheckCircle, XCircle, Database,
  Play, Loader, GripHorizontal, Bot, Zap, Flame, Lightbulb, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';

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

  const [isMounted, setIsMounted] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const [showTheory, setShowTheory] = useState(true);
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

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/exercises/${levelId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setExercises(data.exercises || []);
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
    setClawbotThinking(true);
    try {
      const response = await fetch('http://localhost:8080/api/clawbot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(errorData)
      });
      if (response.ok) {
        const data = await response.json();
        setClawbotMessage(data.mensaje);
      } else {
        setClawbotMessage("Mis circuitos fallaron. ¡Revisa tu sintaxis!");
      }
    } catch (error) {
      setClawbotMessage("¡Bzzz! Hubo interferencia al contactar mis servidores.");
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

      const response = await fetch(`http://localhost:8080/api/exercises/${exercise.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ query, usuarioId: user?.idUsuario })
      });
      const result = await response.json();

      if (result.success) {
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
        setExecutionResult({ success: true, message: result.message, mockData: result.mockData || [] });
        setBurst(true);
        setTimeout(() => setBurst(false), 1300);
        setIntentosFallidos(0);
        setCombo(c => c + 1);
      } else {
        toast.error(result.message);
        setExecutionResult({ success: false, message: result.message });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setCombo(0);
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
      <header className="bg-slate-950/80 border-b border-white/5 backdrop-blur-md z-10 shrink-0">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            <div className="h-6 w-px bg-white/10" />
            <h1 className="font-display text-base font-black text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Módulo {levelId}
              <span className="text-cyan-300 text-sm font-gameui ml-1">
                · Misión {currentExerciseIndex + 1}/{exercises.length}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            {exercises.map((_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all duration-300 ${
                i < currentExerciseIndex ? 'w-6 bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.7)]'
                : i === currentExerciseIndex ? 'w-10 bg-gradient-to-r from-cyan-400 to-fuchsia-500'
                : 'w-2 bg-slate-700'
              }`} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/5">
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
        <div className="h-1 bg-slate-900">
          <motion.div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
            animate={{ width: `${exerciseProgress}%` }} transition={{ duration: 0.5 }} />
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto scroll-fancy">
        {showTheory ? (
          <LevelTheory levelId={levelId} onComplete={() => setShowTheory(false)} />
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
                    className="mt-4 bg-slate-950/70 border border-amber-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                  >
                    <div className="flex items-start gap-3">
                      <Bot className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
                      <div className="flex-1">
                        <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1 text-amber-400">
                          {clawbotThinking ? 'Clawbot está pensando...' : 'Clawbot dice:'}
                        </p>
                        {clawbotThinking ? (
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </div>
                        ) : (
                          <p className="text-amber-100 text-sm font-gameui leading-relaxed">{clawbotMessage}</p>
                        )}
                      </div>
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
                  onClick={handleValidate}
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
                                snapshot.isDraggingOver ? 'border-cyan-400 bg-cyan-500/5' : 'border-slate-600 bg-slate-900/40'
                              }`}
                            >
                              {droppedWords.length === 0 && (
                                <span className="text-slate-500 font-mono text-sm italic w-full text-center py-4">
                                  Arrastra los bloques aquí para armar tu SQL...
                                </span>
                              )}
                              {droppedWords.map((w, i) => (
                                <Draggable key={`d-${w.id}`} draggableId={`d-${w.id}`} index={i}>
                                  {(prov, snap) => (
                                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                      className={`bg-emerald-900/80 border border-emerald-400/60 text-emerald-200 px-4 py-2 rounded-xl font-mono font-bold cursor-move transition-all ${
                                        snap.isDragging ? 'shadow-lg scale-110 shadow-emerald-500/40' : 'hover:bg-emerald-800'
                                      }`}
                                    >
                                      {w.word}
                                    </div>
                                  )}
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
                              className={`min-h-[80px] rounded-2xl border p-4 flex flex-wrap gap-3 items-start content-start transition-all ${
                                snapshot.isDraggingOver ? 'border-slate-500 bg-slate-800/60' : 'border-white/5 bg-slate-900/30'
                              }`}
                            >
                              {availableWords.map((w, i) => (
                                <Draggable key={w.id} draggableId={w.id} index={i}>
                                  {(prov, snap) => (
                                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                      className={`bg-slate-800 border border-slate-600 text-slate-200 px-4 py-2 rounded-xl font-mono font-medium cursor-move transition-all flex items-center gap-2 ${
                                        snap.isDragging ? 'shadow-xl scale-110 border-cyan-400' : 'hover:bg-slate-700 hover:-translate-y-1 hover:border-cyan-400/40'
                                      }`}
                                    >
                                      <GripHorizontal className="w-3 h-3 text-slate-500" />
                                      {w.word}
                                    </div>
                                  )}
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
                    executionResult.success
                      ? 'glass-card-apple border-emerald-400/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                      : 'glass-card-apple border-rose-400/30 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                  }`}
                >
                  <div className={`px-5 py-4 flex items-center gap-3 border-b ${
                    executionResult.success ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
                  }`}>
                    {executionResult.success
                      ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                      : <XCircle className="w-5 h-5 text-rose-400" />
                    }
                    <span className={`font-display font-black ${executionResult.success ? 'text-emerald-200' : 'text-rose-200'}`}>
                      {executionResult.success ? '¡Correcto!' : 'No es correcto'}
                    </span>
                    <span className="font-gameui text-sm text-slate-300 ml-2">{executionResult.message}</span>
                  </div>

                  {/* Tabla de datos */}
                  {executionResult.mockData && executionResult.mockData.length > 0 && (
                    <div className="overflow-x-auto">
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
                  {executionResult.success && (
                    <div className="p-5">
                      <Button
                        onClick={() => {
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