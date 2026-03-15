import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { RewardAnimation } from '../components/RewardAnimation';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, Volume2, VolumeX, Database, Terminal, Play, Loader, GripHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

const THEORY_CONTENT = {
  "1": {
    title: "🎯 Fundamentos de Bases de Datos",
    content: "Una base de datos es como una biblioteca digital gigante donde guardamos información de manera super organizada. SQL es el lenguaje que usamos para hablar con estas bases de datos.",
    concepts: [
      { icon: "📊", title: "Base de Datos", desc: "Colección organizada de información" },
      { icon: "🔍", title: "SQL", desc: "Lenguaje para consultar datos" },
      { icon: "📋", title: "Tablas", desc: "Estructura de filas y columnas" }
    ]
  },
  "2": {
    title: "🔍 SELECT y Filtros",
    content: "SELECT es tu herramienta más importante para obtener datos de la base de datos.",
    concepts: [
      { icon: "🎯", title: "SELECT", desc: "Selecciona columnas de una tabla" },
      { icon: "🔎", title: "WHERE", desc: "Filtra resultados con condiciones" },
      { icon: "📈", title: "ORDER BY", desc: "Ordena los resultados" }
    ]
  },
  "3": {
    title: "🔗 JOINs y Relaciones",
    content: "Los JOIN te permiten combinar información de múltiples tablas relacionadas.",
    concepts: [
      { icon: "🔗", title: "INNER JOIN", desc: "Une tablas con coincidencias" },
      { icon: "📊", title: "GROUP BY", desc: "Agrupa datos para cálculos" },
      { icon: "🎲", title: "Funciones", desc: "COUNT, SUM, AVG, MAX, MIN" }
    ]
  }
};

export const ExercisePage = () => {
  const { levelId } = useParams(); // ¡CORREGIDO! Ahora atrapa el levelId de App.js
  const navigate = useNavigate();
  const { user, token, updateUserXP } = useAuth();
  
  const [isMounted, setIsMounted] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  
  const [showTheory, setShowTheory] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [lastXPGained, setLastXPGained] = useState(0);
  
  const [droppedWords, setDroppedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  
  const [editorCode, setEditorCode] = useState('');
  const [executionResult, setExecutionResult] = useState(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // FETCH A TU JAVA REAL
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/exercises/${levelId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setExercises(data.exercises || []);
      } catch (error) {
        toast.error('Error al cargar ejercicios desde el servidor');
      } finally {
        setLoading(false);
      }
    };
    
    if (token && levelId) {
      fetchExercises();
    }
  }, [levelId, token]);

  useEffect(() => {
    if (exercises.length > 0) {
      const exercise = exercises[currentExerciseIndex];
      if (exercise.type === 'drag_drop') {
        const wordObjects = (exercise.wordBank || []).map((word, idx) => ({
          id: `word-${idx}`,
          word: word
        }));
        setAvailableWords(wordObjects);
        setDroppedWords([]);
      } else {
        setEditorCode(exercise.starterCode || '');
      }
    }
  }, [currentExerciseIndex, exercises]);

  const speakTheory = () => {
    const theory = THEORY_CONTENT[levelId] || THEORY_CONTENT["1"];
    if (!theory) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${theory.title}. ${theory.content}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'wordBank' && destination.droppableId === 'dropZone') {
      const wordObj = availableWords[source.index];
      const newAvailable = availableWords.filter((_, i) => i !== source.index);
      const newDropped = [...droppedWords];
      newDropped.splice(destination.index, 0, wordObj);
      setAvailableWords(newAvailable);
      setDroppedWords(newDropped);
    } else if (source.droppableId === 'dropZone' && destination.droppableId === 'wordBank') {
      const wordObj = droppedWords[source.index];
      const newDropped = droppedWords.filter((_, i) => i !== source.index);
      setDroppedWords(newDropped);
      setAvailableWords([...availableWords, wordObj]);
    } else if (source.droppableId === 'dropZone' && destination.droppableId === 'dropZone') {
      const newDropped = Array.from(droppedWords);
      const [moved] = newDropped.splice(source.index, 1);
      newDropped.splice(destination.index, 0, moved);
      setDroppedWords(newDropped);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    const exercise = exercises[currentExerciseIndex];
    
    try {
      const query = exercise.type === 'drag_drop' 
        ? droppedWords.map(w => w.word).join(' ')
        : editorCode;

      const miUsuarioId = user?.idUsuario; 

      const response = await fetch(`http://localhost:8080/api/exercises/${exercise.id}/validate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: query,
          usuarioId: miUsuarioId
        }) 
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.xp_gained > 0) {
          updateUserXP((user?.xp || 0) + result.xp_gained);
          setLastXPGained(result.xp_gained);
          setShowReward(true);
        } else {
          toast.success(result.message);
        }
        setExecutionResult({
          success: true,
          message: result.message,
          mockData: result.mockData || []
        });
      } else {
        toast.error(result.message);
        setExecutionResult({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      toast.error('Error al validar ejercicio');
    } finally {
      setValidating(false);
    }
  };

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <DagonMascot size="large" mood="determined" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen cyber-bg flex flex-col items-center justify-center">
        <DagonMascot size="large" mood="sad" />
        <p className="text-white text-xl mt-4">Este módulo aún no tiene misiones disponibles.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-6 bg-blue-600">
          Volver al Mapa
        </Button>
      </div>
    );
  }

  const exercise = exercises[currentExerciseIndex];
  const isDragDrop = exercise.type === 'drag_drop';
  const theory = THEORY_CONTENT[levelId] || THEORY_CONTENT["1"];

  return (
    <div className="min-h-screen cyber-bg grid-pattern flex flex-col h-screen" data-testid="exercise-page">
      {showReward && (
        <RewardAnimation type="success" xpGained={lastXPGained} onComplete={() => setShowReward(false)} />
      )}
      
      {/* BARRA SUPERIOR */}
      <header className="bg-slate-900/80 border-b border-slate-800 p-4 flex items-center justify-between backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Abandonar Misión
          </Button>
          <div className="h-6 w-px bg-slate-700"></div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Módulo {levelId} - Misión {currentExerciseIndex + 1}/{exercises.length}
          </h1>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* PANTALLA DE TEORÍA INICIAL */}
        {showTheory ? (
          <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
            <div className="glass-card-apple rounded-3xl p-12 max-w-4xl w-full">
              <div className="flex justify-center mb-8">
                <div onClick={speakTheory} className={`cursor-pointer ${isSpeaking ? 'animate-bounce' : 'animate-float'}`}>
                  <DagonMascot size="large" mood={isSpeaking ? "excited" : "happy"} />
                </div>
              </div>

              <h2 className="text-4xl font-bold text-white text-center mb-6">{theory.title}</h2>

              <div className="backdrop-blur-xl bg-slate-900/50 border border-slate-700 rounded-2xl p-8 mb-6 text-center">
                <p className="text-xl text-slate-200 leading-relaxed">{theory.content}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {theory.concepts?.map((concept, i) => (
                  <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center hover:scale-105 transition-transform">
                    <div className="text-4xl mb-2">{concept.icon}</div>
                    <h3 className="font-bold text-white mb-1">{concept.title}</h3>
                    <p className="text-sm text-slate-400">{concept.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setIsMuted(!isMuted)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl px-6 py-3 flex items-center gap-2 transition-colors">
                  {isMuted ? (
                    <><VolumeX className="w-5 h-5 text-red-400" /><span className="text-slate-300">Silenciado</span></>
                  ) : (
                    <><Volume2 className="w-5 h-5 text-blue-400" /><span className="text-slate-300">Sonido Activo</span></>
                  )}
                </button>
                <Button onClick={() => setShowTheory(false)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-6 rounded-2xl text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                  Comenzar Práctica →
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* PANTALLA DIVIDIDA DE EJERCICIO */
          <>
            {/* PANEL IZQUIERDO: INSTRUCCIONES */}
            <section className="w-1/3 min-w-[350px] max-w-[450px] border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col overflow-y-auto">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-500/30">
                  <DagonMascot size="medium" mood="determined" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">{exercise.title}</h2>
                  <p className="text-blue-400 text-xs font-bold tracking-wide uppercase mt-1">Misión Activa</p>
                </div>
              </div>

              <div className="glass-card rounded-xl p-5 border border-slate-700/50 mb-6 flex-1">
                <h3 className="text-slate-300 font-bold mb-3 uppercase text-xs tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Instrucciones
                </h3>
                <p className="text-slate-300 leading-relaxed font-medium text-sm">{exercise.description}</p>
              </div>

              {showHint && exercise.hint && (
                <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-xl p-4 mb-4 animate-in fade-in zoom-in duration-300">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0" />
                    <p className="text-cyan-300 text-sm italic">{exercise.hint}</p>
                  </div>
                </div>
              )}
              
              {exercise.hint && (
                <Button onClick={() => setShowHint(!showHint)} variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                  {showHint ? 'Ocultar Pista' : 'Pedir pista a Clawbot'}
                </Button>
              )}
            </section>

            {/* PANEL DERECHO: EDITOR / DRAG & DROP */}
            <section className="flex-1 flex flex-col bg-[#0d1117] relative">
              <div className="bg-[#161b22] px-4 py-2 flex items-center justify-between border-b border-slate-800/50 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                  <span className="ml-2 text-xs font-mono text-slate-400 tracking-wider">
                    {isDragDrop ? 'constructor.sql' : 'query.sql'}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {isDragDrop ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex flex-col h-full gap-6">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">Tu Consulta SQL:</p>
                        <Droppable droppableId="dropZone" direction="horizontal">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`w-full min-h-[120px] bg-[#0f141a] border-2 border-dashed rounded-xl p-4 flex flex-wrap gap-2 items-start content-start transition-colors ${snapshot.isDraggingOver ? 'border-blue-400 bg-blue-900/10' : 'border-slate-700'}`}
                            >
                              {droppedWords.length === 0 && (
                                <span className="text-slate-600 font-mono text-sm italic w-full text-center mt-8">Arrastra los bloques aquí...</span>
                              )}
                              {droppedWords.map((wordObj, index) => (
                                <Draggable key={`dropped-${wordObj.id}`} draggableId={`dropped-${wordObj.id}`} index={index}>
                                  {(provided, snap) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-emerald-900/80 border border-emerald-500 text-emerald-300 px-4 py-2 rounded-lg font-mono font-bold cursor-move transition-all ${snap.isDragging ? 'shadow-lg scale-110' : 'hover:bg-emerald-800'}`}
                                    >
                                      {wordObj.word}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>

                      <div className="h-[200px]">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-3">Bloques Disponibles:</p>
                        <Droppable droppableId="wordBank" direction="horizontal">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`w-full h-full bg-[#161b22] border rounded-xl p-4 flex flex-wrap gap-3 items-start content-start overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'border-slate-500 bg-slate-800' : 'border-slate-800'}`}
                            >
                              {availableWords.map((wordObj, index) => (
                                <Draggable key={wordObj.id} draggableId={wordObj.id} index={index}>
                                  {(provided, snap) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-slate-800 border border-slate-600 text-slate-300 px-4 py-2 rounded-lg font-mono font-medium cursor-move transition-all flex items-center gap-2 ${snap.isDragging ? 'shadow-xl scale-110 bg-slate-700 border-blue-500' : 'hover:bg-slate-700 hover:text-white hover:-translate-y-1'}`}
                                    >
                                      <GripHorizontal className="w-4 h-4 text-slate-500" />
                                      {wordObj.word}
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
                  <div className="h-full w-full rounded-xl overflow-hidden border border-slate-800">
                    <Editor
                      height="100%"
                      defaultLanguage="sql"
                      theme="vs-dark"
                      value={editorCode}
                      onChange={(value) => setEditorCode(value || '')}
                      options={{ minimap: { enabled: false }, fontSize: 16, lineNumbers: 'on', padding: { top: 16 } }}
                    />
                  </div>
                )}
              </div>

              {/* CONSOLA DE RESULTADOS / EJECUCIÓN */}
              <div className="h-1/3 min-h-[250px] bg-[#0f141a] border-t border-slate-800 flex flex-col shrink-0">
                <div className="bg-[#161b22] px-4 py-3 flex items-center justify-between border-b border-slate-800/50">
                  <span className="text-xs font-mono text-slate-400 tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4" /> Resultados de Ejecución
                  </span>
                  <Button 
                    onClick={handleValidate}
                    disabled={validating || (isDragDrop && droppedWords.length === 0) || (!isDragDrop && !editorCode)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold h-9 px-6 text-sm shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all"
                  >
                    {validating ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                    {validating ? 'Validando...' : 'Ejecutar Consulta'}
                  </Button>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                  {!executionResult ? (
                    <p className="text-slate-600 font-mono text-sm italic">Esperando ejecución de código...</p>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                      <div className={`flex items-center gap-2 mb-4 ${executionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {executionResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="font-bold">{executionResult.message}</span>
                      </div>

                      {/* TABLA DE RESULTADOS */}
                      {executionResult.mockData && executionResult.mockData.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-slate-700 shadow-xl mb-4">
                          <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-900">
                              <tr>
                                {Object.keys(executionResult.mockData[0]).map((col) => (
                                  <th key={col} className="px-6 py-3 font-bold text-blue-400">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {executionResult.mockData.map((fila, index) => (
                                <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                                  {Object.values(fila).map((valor, i) => (
                                    <td key={i} className="px-6 py-3 font-mono">{String(valor)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* BOTÓN DE SIGUIENTE MISIÓN */}
                      {executionResult.success && (
                        <Button
                          onClick={() => {
                            if (currentExerciseIndex < exercises.length - 1) {
                              setCurrentExerciseIndex(prev => prev + 1);
                              setExecutionResult(null); 
                            } else {
                              toast.success('¡Módulo completado!');
                              navigate('/dashboard');
                            }
                          }}
                          className="mt-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg"
                        >
                          {currentExerciseIndex < exercises.length - 1 ? 'Siguiente Misión 🚀' : 'Terminar Módulo 🏆'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};