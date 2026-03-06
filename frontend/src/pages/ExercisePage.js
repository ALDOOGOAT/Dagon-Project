import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { RewardAnimation } from '../components/RewardAnimation';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

const THEORY_CONTENT = {
  "nivel-0": {
    title: "🎯 Fundamentos de Bases de Datos",
    content: "Una base de datos es como una biblioteca digital gigante donde guardamos información de manera super organizada. SQL es el lenguaje que usamos para hablar con estas bases de datos.",
    concepts: [
      { icon: "📊", title: "Base de Datos", desc: "Colección organizada de información" },
      { icon: "🔍", title: "SQL", desc: "Lenguaje para consultar datos" },
      { icon: "📋", title: "Tablas", desc: "Estructura de filas y columnas" }
    ]
  },
  "basico": {
    title: "🔍 SELECT y Filtros",
    content: "SELECT es tu herramienta más importante para obtener datos de la base de datos.",
    concepts: [
      { icon: "🎯", title: "SELECT", desc: "Selecciona columnas de una tabla" },
      { icon: "🔎", title: "WHERE", desc: "Filtra resultados con condiciones" },
      { icon: "📈", title: "ORDER BY", desc: "Ordena los resultados" }
    ]
  },
  "medio": {
    title: "🔗 JOINs y Relaciones",
    content: "Los JOIN te permiten combinar información de múltiples tablas relacionadas.",
    concepts: [
      { icon: "🔗", title: "INNER JOIN", desc: "Une tablas con coincidencias" },
      { icon: "📊", title: "GROUP BY", desc: "Agrupa datos para cálculos" },
      { icon: "🎲", title: "Funciones", desc: "COUNT, SUM, AVG, MAX, MIN" }
    ]
  },
  "avanzado": {
    title: "⚡ Optimización",
    content: "Los índices aceleran las búsquedas en bases de datos grandes.",
    concepts: [
      { icon: "🚀", title: "Índices", desc: "Aceleran búsquedas" },
      { icon: "🔒", title: "Transacciones", desc: "Operaciones seguras" },
      { icon: "📈", title: "EXPLAIN", desc: "Analiza rendimiento" }
    ]
  },
  "pro": {
    title: "🏗️ Arquitectura",
    content: "Diseña sistemas que escalan a millones de usuarios.",
    concepts: [
      { icon: "🌐", title: "Replicación", desc: "Copias en tiempo real" },
      { icon: "⚖️", title: "Sharding", desc: "Distribución de datos" },
      { icon: "🏛️", title: "ACID", desc: "Principios de consistencia" }
    ]
  }
};

export const ExercisePage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { user, updateUserXP } = useAuth();
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
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await apiService.getExercises(levelId);
        setExercises(data.exercises);
      } catch (error) {
        toast.error('Error al cargar ejercicios');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercises();
  }, [levelId]);

  useEffect(() => {
    if (exercises.length > 0) {
      const exercise = exercises[currentExerciseIndex];
      if (exercise.type === 'drag_drop') {
        setAvailableWords(exercise.wordBank || []);
        setDroppedWords([]);
      } else {
        setEditorCode(exercise.starterCode || '');
      }
    }
  }, [currentExerciseIndex, exercises]);

  const speakTheory = () => {
    const theory = THEORY_CONTENT[levelId];
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
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error('Error al reproducir audio');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'wordBank' && destination.droppableId === 'dropZone') {
      const word = availableWords[source.index];
      const newAvailable = availableWords.filter((_, i) => i !== source.index);
      const newDropped = [...droppedWords];
      newDropped.splice(destination.index, 0, word);
      setAvailableWords(newAvailable);
      setDroppedWords(newDropped);
    } else if (source.droppableId === 'dropZone' && destination.droppableId === 'wordBank') {
      const word = droppedWords[source.index];
      const newDropped = droppedWords.filter((_, i) => i !== source.index);
      setDroppedWords(newDropped);
      setAvailableWords([...availableWords, word]);
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
        ? droppedWords.join(' ')
        : editorCode;

      const result = await apiService.validateExercise(exercise.id, query, levelId);
      
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
          mockData: [
            { id: 1, nombre: 'Juan', edad: 25 },
            { id: 2, nombre: 'María', edad: 30 }
          ]
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

  if (loading) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <DagonMascot size="large" mood="happy" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <div className="text-center">
          <DagonMascot size="large" mood="sad" />
          <p className="text-white text-xl mt-4">No hay ejercicios disponibles</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-blue-600">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const exercise = exercises[currentExerciseIndex];
  const isDragDrop = exercise.type === 'drag_drop';
  const theory = THEORY_CONTENT[levelId];

  if (!isMounted) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <DagonMascot size="large" mood="happy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-bg grid-pattern" data-testid="exercise-page">
      {showReward && (
        <RewardAnimation 
          type="success" 
          xpGained={lastXPGained}
          onComplete={() => setShowReward(false)}
        />
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            data-testid="back-button"
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
        </div>

        {showTheory ? (
          <div className="max-w-4xl mx-auto">
            <div className="glass-card-apple rounded-3xl p-12">
              <div className="flex justify-center mb-8">
                <div className={isSpeaking ? 'animate-bounce' : 'animate-float'}>
                  <DagonMascot size="large" mood={isSpeaking ? "excited" : "happy"} />
                </div>
              </div>

              <h2 className="text-4xl font-bold text-white text-center mb-6">
                {theory?.title}
              </h2>

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 mb-6">
                <p className="text-xl text-slate-200 leading-relaxed text-center">
                  {theory?.content}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {theory?.concepts?.map((concept, i) => (
                  <div 
                    key={i}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:scale-105 transition-transform"
                  >
                    <div className="text-4xl mb-2">{concept.icon}</div>
                    <h3 className="font-bold text-white mb-1">{concept.title}</h3>
                    <p className="text-sm text-slate-400">{concept.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-2"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-5 h-5 text-red-400" />
                      <span className="text-white">Silenciado</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5 text-blue-400" />
                      <span className="text-white">Sonido</span>
                    </>
                  )}
                </button>

                <Button
                  onClick={() => setShowTheory(false)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-6 rounded-2xl"
                >
                  Comenzar Práctica →
                </Button>
              </div>
            </div>
          </div>
        ) : isDragDrop ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card-apple rounded-xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <DagonMascot size="small" mood="happy" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{exercise.title}</h2>
                  <p className="text-slate-300">{exercise.description}</p>
                </div>
              </div>

              {showHint && (
                <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-cyan-400" />
                    <p className="text-cyan-300 text-sm">{exercise.hint}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setShowHint(!showHint)}
                variant="outline"
                className="w-full border-slate-700 text-slate-300"
              >
                {showHint ? 'Ocultar Pista' : 'Ver Pista'}
              </Button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-4">
                <div className="glass-card-apple rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Zona de Construcción</h3>
                  <Droppable droppableId="dropZone" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        data-testid="drop-zone"
                        className="min-h-[100px] bg-slate-900 border-2 border-dashed border-blue-500/50 rounded-lg p-4 flex flex-wrap gap-2 items-center hover:border-blue-400 transition-colors"
                      >
                        {droppedWords.length === 0 && (
                          <p className="text-slate-500 text-sm w-full text-center">Arrastra las palabras SQL aquí para construir tu consulta</p>
                        )}
                        {droppedWords.map((word, index) => (
                          <Draggable key={`dropped-${word}-${index}`} draggableId={`dropped-${word}-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-blue-600 text-white px-4 py-2 rounded-lg font-mono font-semibold cursor-move transition-all ${
                                  snapshot.isDragging ? 'shadow-lg scale-105 rotate-2' : 'hover:bg-blue-700'
                                }`}
                              >
                                {word}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <div className="glass-card-apple rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Banco de Palabras SQL</h3>
                  <Droppable droppableId="wordBank" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        data-testid="word-bank"
                        className="min-h-[80px] flex flex-wrap gap-2"
                      >
                        {availableWords.map((word, index) => (
                          <Draggable key={`word-${word}-${index}`} draggableId={`word-${word}-${index}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-slate-800 text-slate-200 px-4 py-2 rounded-lg font-mono font-medium cursor-move border transition-all ${
                                  snapshot.isDragging 
                                    ? 'border-blue-500 shadow-lg scale-105 bg-slate-700' 
                                    : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-700'
                                }`}
                              >
                                {word}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                <Button
                  onClick={handleValidate}
                  data-testid="validate-button"
                  disabled={validating || droppedWords.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-bold rounded-xl shadow-lg"
                >
                  {validating ? '⏳ Validando...' : '✨ Validar Consulta'}
                </Button>
              </div>
            </DragDropContext>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-card-apple rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">{exercise.title}</h2>
              <p className="text-slate-300 mb-4">{exercise.description}</p>
            </div>

            <div className="glass-card-apple rounded-xl overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 flex justify-between border-b border-slate-800">
                <span className="text-slate-400">Editor SQL</span>
                <Button
                  onClick={handleValidate}
                  disabled={validating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {validating ? 'Ejecutando...' : 'Ejecutar'}
                </Button>
              </div>
              <Editor
                height="400px"
                defaultLanguage="sql"
                theme="vs-dark"
                value={editorCode}
                onChange={(value) => setEditorCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on'
                }}
              />
            </div>

            {executionResult && (
              <div className="glass-card-apple rounded-xl p-6">
                <div className={`flex items-center gap-2 mb-4 ${
                  executionResult.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {executionResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  <span>{executionResult.message}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
