import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { apiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';

export const ExercisePage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { user, updateUserXP } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [validating, setValidating] = useState(false);
  
  const [droppedWords, setDroppedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  
  const [editorCode, setEditorCode] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [activeTab, setActiveTab] = useState('results');

  useEffect(() => {
    loadExercises();
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

  const loadExercises = async () => {
    try {
      const data = await apiService.getExercises(levelId);
      setExercises(data.exercises);
    } catch (error) {
      toast.error('Error al cargar ejercicios');
    } finally {
      setLoading(false);
    }
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
      <div className="min-h-screen abyss-bg flex items-center justify-center">
        <DagonMascot size="large" mood="happy" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen abyss-bg flex items-center justify-center">
        <div className="text-center">
          <DagonMascot size="large" mood="sad" />
          <p className="text-white text-xl mt-4">No hay ejercicios disponibles</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const exercise = exercises[currentExerciseIndex];
  const isDragDrop = exercise.type === 'drag_drop';

  return (
    <div className="min-h-screen abyss-bg" data-testid="exercise-page">
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
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Ejercicio {currentExerciseIndex + 1} de {exercises.length}</span>
          </div>
        </div>

        {isDragDrop ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-start gap-4">
                <DagonMascot size="small" mood="happy" />
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {exercise.title}
                  </h2>
                  <p className="text-slate-300" style={{ fontFamily: 'Manrope, sans-serif' }}>
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
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                {showHint ? 'Ocultar Pista' : 'Ver Pista'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Zona de Construcción</h3>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="dropZone" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        data-testid="drop-zone"
                        className="min-h-[80px] bg-slate-950 border-2 border-dashed border-slate-700 rounded-lg p-4 flex flex-wrap gap-2 items-center"
                      >
                        {droppedWords.length === 0 && (
                          <p className="text-slate-500 text-sm w-full text-center">Arrastra las palabras aquí</p>
                        )}
                        {droppedWords.map((word, index) => (
                          <Draggable key={`dropped-${index}`} draggableId={`dropped-${index}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg font-mono text-sm cursor-move hover:bg-red-700 transition-colors"
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

              <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Banco de Palabras</h3>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="wordBank" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        data-testid="word-bank"
                        className="min-h-[60px] flex flex-wrap gap-2"
                      >
                        {availableWords.map((word, index) => (
                          <Draggable key={`word-${index}`} draggableId={`word-${index}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-slate-800 text-slate-200 px-4 py-2 rounded-lg font-mono text-sm cursor-move hover:bg-slate-700 transition-colors border border-slate-700"
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
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-medium"
              >
                {validating ? 'Validando...' : 'Validar Consulta'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <DagonMascot size="small" mood="happy" />
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {exercise.title}
                  </h2>
                  <p className="text-slate-300 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
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
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {showHint ? 'Ocultar' : 'Pista'}
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800">
                <span className="text-slate-400 text-sm font-mono">Editor SQL</span>
                <Button
                  onClick={handleValidate}
                  data-testid="validate-button"
                  disabled={validating}
                  className="bg-red-600 hover:bg-red-700 text-white"
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
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2
                }}
              />
            </div>

            {executionResult && (
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex gap-2">
                  <button
                    onClick={() => setActiveTab('results')}
                    data-testid="results-tab"
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      activeTab === 'results'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Resultados
                  </button>
                  <button
                    onClick={() => setActiveTab('explain')}
                    data-testid="explain-tab"
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      activeTab === 'explain'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
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
                        <span className="font-medium">{executionResult.message}</span>
                      </div>
                      {executionResult.mockData && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-800 text-slate-300">
                              <tr>
                                {Object.keys(executionResult.mockData[0]).map((key) => (
                                  <th key={key} className="px-4 py-2">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="text-slate-200">
                              {executionResult.mockData.map((row, i) => (
                                <tr key={i} className="border-b border-slate-800">
                                  {Object.values(row).map((val, j) => (
                                    <td key={j} className="px-4 py-2">{val}</td>
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
                      <pre className="bg-slate-950 p-4 rounded font-mono text-xs overflow-x-auto">
{`QUERY PLAN
----------
Seq Scan on usuarios  (cost=0.00..35.50 rows=2550 width=40)
Planning Time: 0.123 ms
Execution Time: 1.234 ms`}
                      </pre>
                      <p className="text-sm text-slate-400 mt-4">
                        Costo estimado: <span className="text-cyan-400 font-mono">35.50</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};