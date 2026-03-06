import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { InteractiveTheory } from '../components/InteractiveTheory';
import { ClawbotTeacher } from '../components/ClawbotTeacher';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

const THEORY_CONTENT = {
  "nivel-0": {
    title: "🎯 Fundamentos de Bases de Datos",
    content: "Una base de datos es como una biblioteca digital gigante donde guardamos información de manera super organizada. SQL es el lenguaje que usamos para hablar con estas bases de datos y pedirles información.",
    concepts: [
      { 
        icon: "📊", 
        title: "Base de Datos", 
        desc: "Colección organizada de información",
        detail: "Imagina un archivero con cajones perfectamente organizados. Cada cajón es una tabla con filas y columnas de datos."
      },
      { 
        icon: "🔍", 
        title: "SQL", 
        desc: "Lenguaje para consultar datos",
        detail: "SQL es como el idioma que hablas para pedirle a la base de datos que te muestre información específica. Es simple y poderoso."
      },
      { 
        icon: "📋", 
        title: "Tablas", 
        desc: "Estructura de filas y columnas",
        detail: "Las tablas son como hojas de Excel: tienen columnas (campos) y filas (registros). Cada fila es un dato completo."
      }
    ]
  },
  "basico": {
    title: "🔍 SELECT y Filtros",
    content: "SELECT es tu herramienta más importante. Es como un control remoto que te permite ver exactamente lo que necesitas de tu base de datos.",
    concepts: [
      { 
        icon: "🎯", 
        title: "SELECT", 
        desc: "Selecciona columnas de una tabla",
        detail: "SELECT te dice QUÉ campos quieres ver. Puedes elegir todos con * o solo los que necesitas."
      },
      { 
        icon: "🔎", 
        title: "WHERE", 
        desc: "Filtra resultados con condiciones",
        detail: "WHERE es como un filtro de búsqueda. Solo te muestra las filas que cumplen tu condición."
      },
      { 
        icon: "📈", 
        title: "ORDER BY", 
        desc: "Ordena los resultados",
        detail: "ORDER BY organiza tus resultados alfabéticamente, numéricamente, ascendente o descendente."
      }
    ]
  },
  "medio": {
    title: "🔗 JOINs y Relaciones",
    content: "Los JOIN son el superpoder de SQL. Te permiten combinar información de diferentes tablas como si fueran piezas de un rompecabezas.",
    concepts: [
      { 
        icon: "🔗", 
        title: "INNER JOIN", 
        desc: "Une tablas con coincidencias",
        detail: "INNER JOIN conecta dos tablas y solo muestra las filas donde ambas tienen información relacionada."
      },
      { 
        icon: "📊", 
        title: "GROUP BY", 
        desc: "Agrupa datos para cálculos",
        detail: "GROUP BY es perfecto para hacer resúmenes: contar, sumar, promediar datos agrupados."
      },
      { 
        icon: "🎲", 
        title: "Funciones", 
        desc: "COUNT, SUM, AVG, MAX, MIN",
        detail: "Las funciones agregadas te dan estadísticas: cuántos hay, el total, el promedio, etc."
      }
    ]
  },
  "avanzado": {
    title: "⚡ Optimización e Índices",
    content: "Los índices son como el índice de un libro: te ayudan a encontrar información super rápido sin tener que buscar en todas las páginas.",
    concepts: [
      { 
        icon: "🚀", 
        title: "Índices", 
        desc: "Aceleran búsquedas de datos",
        detail: "Un índice es una estructura que hace que tus consultas vuelen. Especialmente útil en tablas grandes."
      },
      { 
        icon: "🔒", 
        title: "Transacciones", 
        desc: "Operaciones seguras y atómicas",
        detail: "Las transacciones garantizan que todo se ejecute correctamente o nada se ejecute. Todo o nada."
      },
      { 
        icon: "📈", 
        title: "EXPLAIN", 
        desc: "Analiza rendimiento de queries",
        detail: "EXPLAIN te muestra cómo la base de datos ejecuta tu consulta y dónde puedes optimizar."
      }
    ]
  },
  "pro": {
    title: "🏗️ Arquitectura y Escalabilidad",
    content: "A nivel profesional, manejas sistemas que sirven a millones de usuarios. Necesitas diseñar para escalar y mantener la consistencia.",
    concepts: [
      { 
        icon: "🌐", 
        title: "Replicación", 
        desc: "Copias en tiempo real",
        detail: "La replicación mantiene múltiples copias sincronizadas de tus datos para alta disponibilidad."
      },
      { 
        icon: "⚖️", 
        title: "Sharding", 
        desc: "Distribución de datos",
        detail: "Sharding divide tu base de datos entre múltiples servidores para manejar más carga."
      },
      { 
        icon: "🏛️", 
        title: "ACID", 
        desc: "Principios de consistencia",
        detail: "ACID garantiza que tus datos siempre sean confiables: Atomicidad, Consistencia, Aislamiento, Durabilidad."
      }
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
  const [showHint, setShowHint] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const utterance = new SpeechSynthesisUtterance(theory.content);
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
        toast.success(result.message);
        if (result.xp_gained > 0) {
          updateUserXP((user?.xp || 0) + result.xp_gained);
        }
        setExecutionResult({
          success: true,
          message: result.message,
          mockData: [
            { id: 1, nombre: 'Juan', edad: 25 },
            { id: 2, nombre: 'María', edad: 30 },
            { id: 3, nombre: 'Pedro', edad: 22 }
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
          <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const exercise = exercises[currentExerciseIndex];
  const isDragDrop = exercise.type === 'drag_drop';
  const theory = THEORY_CONTENT[levelId];

  // Evitar renderizar DragDropContext antes de montar en cliente
  if (!isMounted) {
    return (
      <div className="min-h-screen cyber-bg flex items-center justify-center">
        <DagonMascot size="large" mood="happy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cyber-bg grid-pattern" data-testid="exercise-page">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            data-testid="back-button"
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Ejercicio {currentExerciseIndex + 1} de {exercises.length}</span>
          </div>
        </div>

        <Tabs defaultValue="theory" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-700/50">
            <TabsTrigger value="theory" className="data-[state=active]:bg-blue-600">
              <BookOpen className="w-4 h-4 mr-2" />
              Teoría
            </TabsTrigger>
            <TabsTrigger value="practice" className="data-[state=active]:bg-blue-600">
              Práctica
            </TabsTrigger>
          </TabsList>

          <TabsContent value="theory" className="space-y-6">
            <div className="glass-card rounded-2xl p-8 border border-slate-700/50">
              <div className="flex items-start gap-6 mb-8">
                <div className={`transition-transform duration-300 ${isSpeaking ? 'animate-bounce' : 'animate-float'}`}>
                  <DagonMascot size="large" mood={isSpeaking ? "excited" : "happy"} />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-white mb-4">{theory?.title}</h2>
                  <p className="text-slate-300 text-lg leading-relaxed mb-6">{theory?.content}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {theory?.concepts?.map((concept, index) => (
                      <div 
                        key={index}
                        className="glass-card p-4 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
                      >
                        <div className="text-4xl mb-2">{concept.icon}</div>
                        <h3 className="font-bold text-white mb-1">{concept.title}</h3>
                        <p className="text-sm text-slate-400">{concept.desc}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={speakTheory}
                      data-testid="speak-theory-button"
                      className={`${
                        isSpeaking 
                          ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white font-semibold neon-glow`}
                    >
                      <Volume2 className="w-5 h-5 mr-2" />
                      {isSpeaking ? '⏹ Detener Lectura' : '🔊 Escuchar Teoría'}
                    </Button>
                    
                    <Button
                      onClick={() => {
                        const practiceTab = document.querySelector('[value="practice"]');
                        if (practiceTab) practiceTab.click();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      Comenzar Práctica →
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tips adicionales */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  💡 Consejo de Dagon
                </h3>
                <p className="text-slate-300">
                  {levelId === 'nivel-0' && "Empieza construyendo consultas simples. La práctica hace al maestro."}
                  {levelId === 'basico' && "Practica diferentes condiciones con WHERE. ¡Experimenta sin miedo!"}
                  {levelId === 'medio' && "Los JOINs pueden parecer complejos al inicio, pero pronto serán tu mejor aliado."}
                  {levelId === 'avanzado' && "Siempre analiza el rendimiento de tus queries con EXPLAIN antes de producción."}
                  {levelId === 'pro' && "En sistemas reales, la escalabilidad y consistencia son más importantes que la velocidad pura."}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="practice">
            {isDragDrop ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card rounded-xl p-6 space-y-6 border border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <DagonMascot size="small" mood="happy" />
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {exercise.title}
                      </h2>
                      <p className="text-slate-300">
                        {exercise.description}
                      </p>
                    </div>
                  </div>

                  {showHint && (
                    <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4" data-testid="hint-box">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                        <p className="text-cyan-300 text-sm">{exercise.hint}</p>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => setShowHint(!showHint)}
                    data-testid="hint-button"
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-blue-500"
                  >
                    {showHint ? 'Ocultar Pista' : 'Ver Pista'}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Zona de Construcción</h3>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="dropZone" direction="horizontal">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            data-testid="drop-zone"
                            className="min-h-[100px] bg-slate-900 border-2 border-dashed border-blue-500/30 rounded-lg p-4 flex flex-wrap gap-2 items-center hover:border-blue-500/60 transition-colors"
                          >
                            {droppedWords.length === 0 && (
                              <p className="text-slate-500 text-sm w-full text-center">Arrastra las palabras aquí para construir tu consulta SQL</p>
                            )}
                            {droppedWords.map((word, index) => (
                              <Draggable key={`dropped-${index}`} draggableId={`dropped-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-blue-600 text-white px-4 py-2 rounded-lg font-mono text-sm font-semibold cursor-move transition-all ${
                                      snapshot.isDragging ? 'shadow-lg neon-glow scale-105' : 'hover:bg-blue-700'
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
                    </DragDropContext>
                  </div>

                  <div className="glass-card rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Banco de Palabras SQL</h3>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="wordBank" direction="horizontal">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            data-testid="word-bank"
                            className="min-h-[80px] flex flex-wrap gap-2"
                          >
                            {availableWords.map((word, index) => (
                              <Draggable key={`word-${index}`} draggableId={`word-${index}`} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-slate-800 text-slate-200 px-4 py-2 rounded-lg font-mono text-sm font-medium cursor-move border transition-all ${
                                      snapshot.isDragging 
                                        ? 'border-blue-500 shadow-lg scale-105' 
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
                    </DragDropContext>
                  </div>

                  <Button
                    onClick={handleValidate}
                    data-testid="validate-button"
                    disabled={validating || droppedWords.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold neon-glow"
                  >
                    {validating ? 'Validando...' : 'Validar Consulta'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-start gap-4 mb-4">
                    <DagonMascot size="small" mood="happy" />
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {exercise.title}
                      </h2>
                      <p className="text-slate-300 mb-4">
                        {exercise.description}
                      </p>
                      {showHint && (
                        <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-4" data-testid="hint-box">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                            <p className="text-cyan-300 text-sm">{exercise.hint}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => setShowHint(!showHint)}
                      data-testid="hint-button"
                      variant="outline"
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-blue-500"
                    >
                      {showHint ? 'Ocultar' : 'Pista'}
                    </Button>
                  </div>
                </div>

                <div className="glass-card rounded-xl overflow-hidden border border-slate-700/50">
                  <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                    <span className="text-slate-400 text-sm font-mono font-semibold">Editor SQL</span>
                    <Button
                      onClick={handleValidate}
                      data-testid="validate-button"
                      disabled={validating}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold neon-glow"
                    >
                      {validating ? 'Ejecutando...' : 'Ejecutar'}
                    </Button>
                  </div>
                  <Editor
                    height="450px"
                    defaultLanguage="sql"
                    theme="vs-dark"
                    value={editorCode}
                    onChange={(value) => setEditorCode(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      padding: { top: 16, bottom: 16 }
                    }}
                  />
                </div>

                {executionResult && (
                  <div className="glass-card rounded-xl overflow-hidden border border-slate-700/50">
                    <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex gap-2">
                      <button
                        onClick={() => setActiveTab('results')}
                        data-testid="results-tab"
                        className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                          activeTab === 'results'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        Resultados
                      </button>
                      <button
                        onClick={() => setActiveTab('explain')}
                        data-testid="explain-tab"
                        className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                          activeTab === 'explain'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        Explain Analyze
                      </button>
                    </div>
                    <div className="p-6">
                      {activeTab === 'results' && (
                        <div data-testid="results-panel">
                          <div className={`flex items-center gap-2 mb-4 ${
                            executionResult.success ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {executionResult.success ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                            <span className="font-semibold">{executionResult.message}</span>
                          </div>
                          {executionResult.mockData && (
                            <div className="overflow-x-auto rounded-lg border border-slate-800">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-900 text-slate-300">
                                  <tr>
                                    {Object.keys(executionResult.mockData[0]).map((key) => (
                                      <th key={key} className="px-4 py-3 text-left font-semibold">{key}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="text-slate-200">
                                  {executionResult.mockData.map((row, i) => (
                                    <tr key={i} className="border-t border-slate-800 hover:bg-slate-900/50">
                                      {Object.values(row).map((val, j) => (
                                        <td key={j} className="px-4 py-3">{val}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                      {activeTab === 'explain' && (
                        <div data-testid="explain-panel" className="text-slate-300">
                          <pre className="bg-slate-950 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800">
{`QUERY PLAN
----------
Seq Scan on usuarios  (cost=0.00..35.50 rows=2550 width=40)
Planning Time: 0.123 ms
Execution Time: 1.234 ms`}
                          </pre>
                          <p className="text-sm text-slate-400 mt-4">
                            Costo estimado: <span className="text-cyan-400 font-mono font-semibold">35.50</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
