import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DagonMascot } from '../components/DagonMascot';
import { Button } from '../components/ui/button';
import { RewardAnimation } from '../components/RewardAnimation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LevelTheory, getSubTopicKey } from '../components/LevelTheory';
import { MerDiagramBuilder, generateSqlFromDiagramData } from '../components/MerDiagramBuilder';
import { ModuleCinematic } from '../components/ModuleCinematic';
import { sounds } from '../lib/SoundEngine';
import {
  ArrowLeft, CheckCircle, XCircle, Database,
  Play, Loader, GripHorizontal, Bot, Zap, Flame, Lightbulb, ChevronLeft, ChevronRight, RotateCcw, Film, TrendingUp,
  AlertTriangle, Sparkles, Layers, Code2, ListChecks, MousePointer2, Eraser, Trophy, Volume2, BadgeCheck, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import apiClient, { cachedGet } from '../services/apiClient';
import { formatAIMessage, inferLearningFocus, buildLocalClawbotFallback, buildLearningFeedback } from '../lib/exerciseHelpers';
import { LEARNING_CONCEPTS, inferConceptKey, recordLearningAttempt } from '../lib/learningProgress';
import { QueryResultShowcase } from '../components/QueryResultShowcase';

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

const performanceNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatPerformanceNumber = (value, decimals = 2) => {
  const parsed = performanceNumber(value);
  if (parsed === null) return '-';
  if (Math.abs(parsed) >= 100) return String(Math.round(parsed));
  return parsed.toFixed(decimals);
};

const formatPerformanceMs = (value) => {
  const parsed = performanceNumber(value);
  if (parsed === null) return '-';
  if (parsed < 10) return `${parsed.toFixed(2)} ms`;
  if (parsed < 100) return `${parsed.toFixed(1)} ms`;
  return `${Math.round(parsed)} ms`;
};

const PerformanceAnalysisPanel = ({ performance, colors, isLight, headingColor, mutedColor }) => {
  if (!performance?.available) return null;

  const borderColor = isLight ? 'rgba(14,116,144,0.18)' : 'rgba(34,211,238,0.18)';
  const surfaceColor = isLight ? 'rgba(236,254,255,0.70)' : 'rgba(8,47,73,0.18)';
  const metrics = [
    { label: 'Costo', value: formatPerformanceNumber(performance.totalCost), icon: Gauge },
    { label: 'Motor', value: formatPerformanceMs(performance.executionTimeMs), icon: Clock },
    { label: 'Nodo', value: performance.topNode || 'Plan SQL', icon: Database },
    { label: 'Filas', value: formatPerformanceNumber(performance.planRows, 0), icon: TrendingUp },
  ];
  const operations = Array.isArray(performance.operations) ? performance.operations.slice(0, 5) : [];

  return (
    <div className="border-b px-4 py-4" style={{ borderColor }}>
      <div className="rounded-2xl border p-3 sm:p-4" style={{ borderColor, backgroundColor: surfaceColor }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: colors.secondary }}>
              Analista de rendimiento
            </p>
            <h3 className="mt-1 flex items-center gap-2 font-display text-lg font-black" style={{ color: headingColor }}>
              <Gauge className="h-5 w-5" style={{ color: colors.secondary }} />
              EXPLAIN ANALYZE
            </h3>
          </div>
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wider"
            style={{ borderColor, color: performance.seqScan ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#047857' : '#34d399'), backgroundColor: isLight ? 'rgba(255,255,255,0.58)' : 'rgba(2,6,23,0.26)' }}
          >
            <Zap className="h-3.5 w-3.5" />
            {performance.seqScan ? 'Seq Scan detectado' : 'Plan estable'}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="min-w-0 rounded-xl border px-3 py-2" style={{ borderColor, backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(2,6,23,0.20)' }}>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider" style={{ color: mutedColor }}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{metric.label}</span>
                </div>
                <p className="mt-1 truncate font-mono text-sm font-black" style={{ color: headingColor }}>
                  {metric.value}
                </p>
              </div>
            );
          })}
        </div>

        {operations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {operations.map((operation, index) => (
              <span
                key={`${operation}-${index}`}
                className="rounded-full border px-3 py-1 text-[11px] font-mono"
                style={{ borderColor, color: mutedColor, backgroundColor: isLight ? 'rgba(255,255,255,0.52)' : 'rgba(2,6,23,0.18)' }}
              >
                {operation}
              </span>
            ))}
          </div>
        )}

        {performance.analysis && (
          <div className="mt-3 rounded-xl border px-3 py-2 text-sm font-gameui leading-relaxed" style={{ borderColor, color: mutedColor, backgroundColor: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(2,6,23,0.24)' }}>
            {formatAIMessage(performance.analysis, colors)}
          </div>
        )}
      </div>
    </div>
  );
};

const ExerciseLeaderboardPanel = ({ leaderboard, loading, colors, isLight, headingColor, mutedColor }) => {
  const [mode, setMode] = useState('eficiencia');
  const rows = Array.isArray(leaderboard?.[mode]) ? leaderboard[mode] : [];
  const borderColor = isLight ? 'rgba(245,158,11,0.20)' : 'rgba(250,204,21,0.18)';
  const surfaceColor = isLight ? 'rgba(255,251,235,0.70)' : 'rgba(113,63,18,0.14)';
  const modes = [
    { id: 'eficiencia', label: 'Eficiencia', icon: Gauge },
    { id: 'golf', label: 'SQL Golf', icon: Code2 },
  ];

  return (
    <div className="border-b px-4 py-4" style={{ borderColor }}>
      <div className="rounded-2xl border p-3 sm:p-4" style={{ borderColor, backgroundColor: surfaceColor }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: isLight ? '#b45309' : '#fde047' }}>
              Batalla por ejercicio
            </p>
            <h3 className="mt-1 flex items-center gap-2 font-display text-lg font-black" style={{ color: headingColor }}>
              <Trophy className="h-5 w-5" style={{ color: isLight ? '#d97706' : '#facc15' }} />
              Ranking de la misión
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl border p-1" style={{ borderColor, backgroundColor: isLight ? 'rgba(255,255,255,0.54)' : 'rgba(2,6,23,0.22)' }}>
            {modes.map((item) => {
              const Icon = item.icon;
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors"
                  style={{
                    color: active ? '#fff' : mutedColor,
                    backgroundColor: active ? colors.primary : 'transparent'
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor, backgroundColor: isLight ? 'rgba(255,255,255,0.58)' : 'rgba(2,6,23,0.20)' }}>
          <div className="grid grid-cols-[52px_1fr_96px] gap-2 border-b px-3 py-2 text-[10px] font-black uppercase tracking-[0.20em]" style={{ borderColor, color: mutedColor }}>
            <span>Rank</span>
            <span>Aventurero</span>
            <span className="text-right">{mode === 'eficiencia' ? 'Costo' : 'Chars'}</span>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm" style={{ color: mutedColor }}>
              <Loader className="h-4 w-4 animate-spin" />
              Actualizando ranking...
            </div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-4 text-sm font-gameui" style={{ color: mutedColor }}>
              Aún no hay intentos correctos con métricas para esta misión.
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor }}>
              {rows.slice(0, 5).map((row) => {
                const metric = mode === 'eficiencia'
                  ? formatPerformanceNumber(row.costoEjecucion)
                  : row.longitudCaracteres ?? '-';
                return (
                  <li key={`${mode}-${row.idUsuario}-${row.rango}`} className="grid grid-cols-[52px_1fr_96px] items-center gap-2 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {row.rango <= 3 ? (
                        <Medal className="h-4 w-4" style={{ color: row.rango === 1 ? '#facc15' : row.rango === 2 ? '#cbd5e1' : '#f59e0b' }} />
                      ) : (
                        <span className="font-mono text-xs font-black" style={{ color: mutedColor }}>#{row.rango}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-black" style={{ color: headingColor }}>{row.nombre || 'Sin nombre'}</p>
                      <p className="truncate font-mono text-[11px]" style={{ color: mutedColor }}>
                        {formatPerformanceMs(row.tiempoMs)}
                      </p>
                    </div>
                    <p className="text-right font-mono text-sm font-black" style={{ color: mode === 'eficiencia' ? colors.secondary : (isLight ? '#b45309' : '#fde047') }}>
                      {metric}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const ModelingLabPanel = ({ sql, onUseSql, colors, isLight, headingColor, mutedColor }) => {
  const [loading, setLoading] = useState(false);
  const [diagram, setDiagram] = useState(null);
  const [error, setError] = useState(null);
  const borderColor = isLight ? 'rgba(14,116,144,0.18)' : 'rgba(34,211,238,0.18)';
  const surfaceColor = isLight ? 'rgba(236,254,255,0.68)' : 'rgba(8,47,73,0.18)';

  const buildPreview = async () => {
    if (!sql || !sql.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/modeling/ddl-to-erd', { sql });
      setDiagram(response.data);
    } catch {
      setError('No se pudo construir el diagrama desde este DDL.');
      setDiagram(null);
    } finally {
      setLoading(false);
    }
  };

  const generatedSql = diagram?.ddl || '';

  return (
    <div className="mt-4 rounded-2xl border p-4" style={{ borderColor, backgroundColor: surfaceColor }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: colors.secondary }}>
            Laboratorio ERD
          </p>
          <h3 className="mt-1 flex items-center gap-2 font-display text-base font-black" style={{ color: headingColor }}>
            <Network className="h-4 w-4" style={{ color: colors.secondary }} />
            DDL a diagrama
          </h3>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={buildPreview}
            disabled={loading || !sql?.trim()}
            className="rounded-xl bg-cyan-500 px-4 font-display font-black text-slate-950 hover:bg-cyan-300"
          >
            {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Network className="mr-2 h-4 w-4" />}
            Visualizar ERD
          </Button>
          {generatedSql && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onUseSql(generatedSql)}
              className="rounded-xl"
              style={{ borderColor, color: headingColor }}
            >
              <Code2 className="mr-2 h-4 w-4" />
              Usar DDL
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgba(244,63,94,0.26)', color: isLight ? '#be123c' : '#fb7185' }}>
          {error}
        </p>
      )}

      {diagram && (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.78fr)]">
          <div className="h-[360px] overflow-hidden rounded-2xl border bg-[#090b10]" style={{ borderColor }}>
            <MerDiagramBuilder
              initialNodes={diagram.nodes || []}
              initialEdges={diagram.edges || []}
              readOnly
            />
          </div>
          <div className="min-w-0 rounded-2xl border p-3" style={{ borderColor, backgroundColor: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(2,6,23,0.24)' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: mutedColor }}>DDL normalizado</p>
            <pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 font-mono text-xs leading-relaxed text-cyan-100">
              {generatedSql || '-- Sin DDL generado'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const DiagramSqlPreview = ({ graphJson, colors, isLight, headingColor, mutedColor }) => {
  const parsed = useMemo(() => {
    try {
      return graphJson ? JSON.parse(graphJson) : null;
    } catch {
      return null;
    }
  }, [graphJson]);

  const generatedSql = useMemo(() => (
    parsed ? generateSqlFromDiagramData(parsed) : ''
  ), [parsed]);

  if (!generatedSql) return null;

  const borderColor = isLight ? 'rgba(245,158,11,0.20)' : 'rgba(250,204,21,0.16)';
  return (
    <div className="mt-4 rounded-2xl border p-4" style={{ borderColor, backgroundColor: isLight ? 'rgba(255,251,235,0.72)' : 'rgba(113,63,18,0.14)' }}>
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4" style={{ color: isLight ? '#b45309' : '#fde047' }} />
        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: mutedColor }}>
          DDL generado
        </p>
      </div>
      <pre className="mt-3 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 font-mono text-xs leading-relaxed text-amber-100">
        {generatedSql}
      </pre>
    </div>
  );
};

const motionIn = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const buildWordObjects = (words, exerciseId = 'actual') => (
  (words || []).map((word, idx) => ({
    id: `word-${exerciseId}-${idx}-${String(word).replace(/[^\w]+/g, '_')}`,
    word,
    originIndex: idx
  }))
);

const normalizeWordList = (words = []) => (
  (Array.isArray(words) ? words : [])
    .filter((item) => item && typeof item.word !== 'undefined' && item.id)
);

const reorderWordList = (list, sourceIndex, destinationIndex) => {
  const copy = normalizeWordList(list);
  const [moved] = copy.splice(sourceIndex, 1);
  if (!moved) return copy;
  copy.splice(destinationIndex, 0, moved);
  return copy;
};

const insertWordAt = (list, word, destinationIndex) => {
  const copy = normalizeWordList(list);
  if (!word?.id || copy.some((item) => item.id === word.id)) return copy;
  copy.splice(destinationIndex, 0, word);
  return copy;
};

const returnWordToBank = (list, word) => {
  const copy = normalizeWordList(list);
  if (!word?.id || copy.some((item) => item.id === word.id)) return copy;

  return [...copy, word].sort((a, b) => {
    const left = Number.isFinite(a.originIndex) ? a.originIndex : Number.MAX_SAFE_INTEGER;
    const right = Number.isFinite(b.originIndex) ? b.originIndex : Number.MAX_SAFE_INTEGER;
    return left - right;
  });
};

const moveWordById = (list, wordId, offset) => {
  const copy = normalizeWordList(list);
  const currentIndex = copy.findIndex((item) => item.id === wordId);
  if (currentIndex === -1) return copy;

  const nextIndex = Math.max(0, Math.min(copy.length - 1, currentIndex + offset));
  if (nextIndex === currentIndex) return copy;

  const [moved] = copy.splice(currentIndex, 1);
  copy.splice(nextIndex, 0, moved);
  return copy;
};

const formatSqlPreview = (words) => (
  normalizeWordList(words)
    .map((w) => w.word)
    .join(' ')
    .replace(/\s+;/g, ';')
    .replace(/\s+,/g, ',')
    .trim()
);

const runTokenActionFromKeyboard = (event, action) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
};

const buildExerciseSpeech = (exerciseToRead, exerciseIndex) => {
  if (!exerciseToRead) return '';
  const title = exerciseToRead.title ? `Misión: ${exerciseToRead.title}.` : `Misión ${exerciseIndex + 1}.`;
  const description = exerciseToRead.description ? `Tu reto es: ${exerciseToRead.description}.` : '';
  const hint = exerciseToRead.hint ? `Pista breve: ${exerciseToRead.hint}.` : '';
  return [title, description, hint].filter(Boolean).join(' ');
};

const splitStatementSentences = (text = '') => (
  String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
);

export const ExercisePage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { user, token, updateUserXP, updateUserStreak } = useAuth();
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

  const [moduleMetadata, setModuleMetadata] = useState(null);
  const [showTheory, setShowTheory] = useState(true);
  const [showModuleCinematic, setShowModuleCinematic] = useState(true);
  const [resumeTheoryAfterCinematic, setResumeTheoryAfterCinematic] = useState(true);
  const [currentSubTopic, setCurrentSubTopic] = useState(null);
  const [shownSubTopics, setShownSubTopics] = useState(new Set());
  const [showHint, setShowHint] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [isReadingStatement, setIsReadingStatement] = useState(false);
  const [lastXPGained, setLastXPGained] = useState(0);
  const [levelUpData, setLevelUpData] = useState(null);
  const [lastAlertedExerciseKey, setLastAlertedExerciseKey] = useState(null);

  const [droppedWords, setDroppedWords] = useState([]);
  const [availableWords, setAvailableWords] = useState([]);
  const [draggingWord, setDraggingWord] = useState(null);
  const [dragDestination, setDragDestination] = useState(null);

  const [editorCode, setEditorCode] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [exerciseLeaderboard, setExerciseLeaderboard] = useState(null);
  const [exerciseLeaderboardLoading, setExerciseLeaderboardLoading] = useState(false);

  const [clawbotThinking, setClawbotThinking] = useState(false);
  const [clawbotMessage, setClawbotMessage] = useState(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);
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
  const dagonTypingIntervalRef = useRef(null);
  const dagonPostMessageTimeoutRef = useRef(null);
  const dragClickGuardRef = useRef(false);
  const dragStartedAtRef = useRef(0);
  const dragEndedAtRef = useRef(0);
  const dropZoneScrollRef = useRef(null);
  const wordBankScrollRef = useRef(null);
  const resultPanelRef = useRef(null);
  const spokenExerciseRef = useRef(null);
  const lastTypingSoundRef = useRef(0);

  const managedTimeoutsRef = useRef(new Set());

  const setManagedTimeout = useCallback((callback, delay) => {
    const timeoutId = window.setTimeout(() => {
      managedTimeoutsRef.current.delete(timeoutId);
      callback();
    }, delay);
    managedTimeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  useEffect(() => { 
    setIsMounted(true); 
    sounds.init();
    sounds.startBackgroundMusic();
    return () => sounds.stopBackgroundMusic();
  }, []);

  useEffect(() => {
    const managedTimeouts = managedTimeoutsRef.current;
    return () => {
      if (dagonTypingIntervalRef.current) {
        clearInterval(dagonTypingIntervalRef.current);
      }
      if (dagonPostMessageTimeoutRef.current) {
        clearTimeout(dagonPostMessageTimeoutRef.current);
      }
      managedTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      managedTimeouts.clear();
      sounds.stopSpeech?.();
    };
  }, []);

  const fetchExerciseLeaderboard = useCallback(async (exerciseId) => {
    if (!token || !exerciseId) {
      setExerciseLeaderboard(null);
      return;
    }

    setExerciseLeaderboard(null);
    setExerciseLeaderboardLoading(true);
    try {
      const response = await apiClient.get(`/api/leaderboard/exercises/${exerciseId}`);
      setExerciseLeaderboard(response.data);
    } catch {
      setExerciseLeaderboard(null);
    } finally {
      setExerciseLeaderboardLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let isActive = true;

    const fetchExercises = async () => {
      setLoading(true);
      setExercises([]);
      setCurrentExerciseIndex(0);
      setExecutionResult(null);
      setExerciseLeaderboard(null);
      setExerciseLeaderboardLoading(false);
      setEditorCode('');
      setDroppedWords([]);
      setAvailableWords([]);
      setCurrentSubTopic(null);
      setShownSubTopics(new Set());
      setShowHint(false);
      setClawbotMessage(null);
      setProgressiveHint(null);
      setReinforcementPlan(null);
      setIntentosFallidos(0);
      setCombo(0);
      setShowReward(false);
      setLevelUpData(null);
      setLastXPGained(0);
      setLastAlertedExerciseKey(null);
      setResumeTheoryAfterCinematic(true);
      setShowModuleCinematic(true);
      setShowTheory(false);

      try {
        const response = await cachedGet(`/api/exercises/${levelId}`, {}, { ttl: 30_000 });
        if (!isActive) return;

        const data = response.data;
        const loaded = data.exercises || [];
        setExercises(loaded);
        setModuleMetadata(data.module || null);
        setResumeTheoryAfterCinematic(true);
        setShowModuleCinematic(true);
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
        if (isActive) toast.error('Error al cargar ejercicios desde el servidor');
      } finally {
        if (isActive) setLoading(false);
      }
    };
    if (token && levelId) fetchExercises();

    return () => {
      isActive = false;
    };
  }, [levelId, token]);

  useEffect(() => {
    if (exercises.length > 0) {
      if (dagonTypingIntervalRef.current) {
        clearInterval(dagonTypingIntervalRef.current);
        dagonTypingIntervalRef.current = null;
      }
      if (dagonPostMessageTimeoutRef.current) {
        clearTimeout(dagonPostMessageTimeoutRef.current);
        dagonPostMessageTimeoutRef.current = null;
      }
      sounds.stopSpeech?.();
      setIsReadingStatement(false);

      const exercise = exercises[currentExerciseIndex];

      // Detectar si cambiamos de subtema y mostrar teoría intermedia
      const subKey = getSubTopicKey(levelId, exercise.orden || (currentExerciseIndex + 1));
      if (subKey && !shownSubTopics.has(subKey)) {
        setCurrentSubTopic(subKey);
        setShowTheory(true);
      }

      if (exercise.type === 'drag_drop') {
        setAvailableWords(buildWordObjects(exercise.wordBank || [], exercise.id || currentExerciseIndex));
        setDroppedWords([]);
      } else {
        setEditorCode(exercise.starterCode || '');
      }
      setExecutionResult(null);
      setClawbotMessage(null);
      setShowHint(false);
      setProgressiveHint(null);
      setReinforcementPlan(null);
      fetchExerciseLeaderboard(exercise.id);
    }
  }, [currentExerciseIndex, exercises, levelId, shownSubTopics, fetchExerciseLeaderboard]);

  const armDragClickGuard = () => {
    dragClickGuardRef.current = true;
    dragStartedAtRef.current = Date.now();
    dragEndedAtRef.current = 0;
  };

  const releaseDragClickGuard = () => {
    dragEndedAtRef.current = Date.now();
    setManagedTimeout(() => {
      dragClickGuardRef.current = false;
    }, 120);
  };

  const shouldIgnoreTokenClick = () => {
    if (!dragClickGuardRef.current) return false;

    const now = Date.now();
    if (dragEndedAtRef.current && now - dragEndedAtRef.current < 160) return true;
    if (!dragEndedAtRef.current && now - dragStartedAtRef.current > 900) {
      dragClickGuardRef.current = false;
      return false;
    }

    return !dragEndedAtRef.current;
  };

  const handleDragEnd = (result) => {
    releaseDragClickGuard();

    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const currentAvailableWords = normalizeWordList(availableWords);
    const currentDroppedWords = normalizeWordList(droppedWords);
    sounds.playStep?.();

    if (source.droppableId === 'wordBank' && destination.droppableId === 'dropZone') {
      const wordObj = currentAvailableWords[source.index];
      if (!wordObj) return;
      setAvailableWords(currentAvailableWords.filter((_, i) => i !== source.index));
      setDroppedWords(insertWordAt(currentDroppedWords, wordObj, currentDroppedWords.length));
    } else if (source.droppableId === 'dropZone' && destination.droppableId === 'wordBank') {
      const wordObj = currentDroppedWords[source.index];
      if (!wordObj) return;
      setDroppedWords(currentDroppedWords.filter((_, i) => i !== source.index));
      setAvailableWords(returnWordToBank(currentAvailableWords, wordObj));
    } else if (source.droppableId === 'dropZone' && destination.droppableId === 'dropZone') {
      setDroppedWords(reorderWordList(currentDroppedWords, source.index, destination.index));
    } else if (source.droppableId === 'wordBank' && destination.droppableId === 'wordBank') {
      setAvailableWords(reorderWordList(currentAvailableWords, source.index, destination.index));
    }
  };

  const scrollDragRail = (ref, target = 'end') => {
    const element = ref.current;
    if (!element) return;
    const left = target === 'start' ? 0 : element.scrollWidth;
    element.scrollTo({ left, behavior: 'smooth' });
  };

  const handleUseWord = (wordObj) => {
    if (shouldIgnoreTokenClick() || !wordObj?.id) return;
    setAvailableWords(prev => {
      const clean = normalizeWordList(prev);
      if (!clean.some(item => item.id === wordObj.id)) return clean;
      return clean.filter(item => item.id !== wordObj.id);
    });
    setDroppedWords(prev => {
      const clean = normalizeWordList(prev);
      if (clean.some(item => item.id === wordObj.id)) return clean;
      return [...clean, wordObj];
    });
    sounds.playSelect?.();
  };

  const handleReturnWord = (wordObj) => {
    if (shouldIgnoreTokenClick() || !wordObj?.id) return;
    setDroppedWords(prev => {
      const clean = normalizeWordList(prev);
      if (!clean.some(item => item.id === wordObj.id)) return clean;
      return clean.filter(item => item.id !== wordObj.id);
    });
    setAvailableWords(prev => {
      return returnWordToBank(prev, wordObj);
    });
    sounds.playSelect?.();
  };

  const handleMovePlacedWord = (wordObj, offset) => {
    if (!wordObj?.id) return;
    setDroppedWords(prev => moveWordById(prev, wordObj.id, offset));
    sounds.playStep?.();
  };

  const resetDragDropAnswer = () => {
    const exercise = exercises[currentExerciseIndex];
    if (!exercise || exercise.type !== 'drag_drop') return;
    dragClickGuardRef.current = false;
    dragStartedAtRef.current = 0;
    dragEndedAtRef.current = 0;
    setDraggingWord(null);
    setDragDestination(null);
    setDroppedWords([]);
    setAvailableWords(buildWordObjects(exercise.wordBank || [], exercise.id || currentExerciseIndex));
    sounds.playStep?.();
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
        ? formatSqlPreview(droppedWords)
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
          if (dagonTypingIntervalRef.current) {
            clearInterval(dagonTypingIntervalRef.current);
          }
          if (dagonPostMessageTimeoutRef.current) {
            clearTimeout(dagonPostMessageTimeoutRef.current);
          }
          
          // Animación de máquina de escribir
          let i = 0;
          const queryToType = result.dagonActionQuery || '';
          dagonTypingIntervalRef.current = setInterval(() => {
            setDagonTypingQuery(prev => prev + queryToType.charAt(i));
            i++;
            if (i >= queryToType.length) {
              clearInterval(dagonTypingIntervalRef.current);
              dagonTypingIntervalRef.current = null;
              // Después de terminar de escribir, mostrar mensaje final
              dagonPostMessageTimeoutRef.current = setTimeout(() => {
                setDagonShowPostMessage(true);
                dagonPostMessageTimeoutRef.current = null;
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
          setManagedTimeout(() => setXpPop(null), 1700);
          const prevLvl = Math.floor(prevXP / 100) + 1;
          const newLvl = Math.floor(newXP / 100) + 1;
          if (newLvl > prevLvl) {
            setLevelUpData({ newLevel: newLvl });
            sounds.playUnlock?.();
          }
        }

        if (result.streak_activated_today) {
          updateUserStreak(result.new_streak);
          window.dispatchEvent(new CustomEvent('dagon_streak_activated', { detail: result.new_streak }));
        }

        if (gained > 0 || result.streak_activated_today) {
          setShowReward(true);
        } else {
          toast.success(result.message);
        }
        // Guardamos TODO el resultado para que el componente tenga acceso a isDML, beforeData, etc.
        setExecutionResult({ ...result });
        if (result.exerciseLeaderboard) {
          setExerciseLeaderboard(result.exerciseLeaderboard);
        } else {
          fetchExerciseLeaderboard(exercise.id);
        }
        registerGamifiedAttempt({ exercise, success: true, attempts: intentosFallidos + 1 });
        setBurst(true);        setManagedTimeout(() => setBurst(false), 1300);
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
        if (result.exerciseLeaderboard) {
          setExerciseLeaderboard(result.exerciseLeaderboard);
        } else {
          fetchExerciseLeaderboard(exercise.id);
        }
        sounds.playSoftWarning?.();
      } else {
        toast.error(result.message);
        // Limpiar intervención pedagógica si existe
        setIsDagonIntervening(false);
        setExecutionResult({ ...result, success: false, message: result.message });
        setShake(true);
        setManagedTimeout(() => setShake(false), 500);
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
      const nuevos = Math.max(intentosFallidos + 1, 1);
      setIntentosFallidos(nuevos);
      setClawbotMessage(buildLocalClawbotFallback({
        errorDb: 'No se pudo validar contra el servidor en este momento.',
        intentos: nuevos,
        nivelId: parseInt(levelId),
        tituloEjercicio: exercise.title,
      }, exercise));
      registerGamifiedAttempt({ exercise, success: false, attempts: nuevos });
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

  useEffect(() => {
    if (!(executionResult?.success || executionResult?.isWarning) || !resultPanelRef.current) return;

    const timeout = window.setTimeout(() => {
      const mobileResultViewport = window.matchMedia?.('(max-width: 640px)').matches;
      resultPanelRef.current?.scrollIntoView({
        behavior: mobileResultViewport ? 'auto' : 'smooth',
        block: mobileResultViewport ? 'nearest' : 'center',
      });
      resultPanelRef.current?.focus({ preventScroll: true });
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [executionResult]);

  useEffect(() => {
    if (!executionResult?.success || currentExerciseIndex < exercises.length - 1) return;
    const nextLevelId = Number(levelId) + 1;
    if (!Number.isFinite(nextLevelId)) return;

    cachedGet(`/api/exercises/${nextLevelId}`, {}, { ttl: 30_000 }).catch(() => {
      // Prefetch silencioso: si no existe el siguiente modulo, no afecta la experiencia actual.
    });
  }, [currentExerciseIndex, executionResult?.success, exercises.length, levelId]);

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

  const exerciseForSpeech = exercises[currentExerciseIndex] || null;
  const readExerciseStatement = useCallback((manual = false) => {
    if (!exerciseForSpeech) return;

    if (isReadingStatement) {
      sounds.stopSpeech?.();
      setIsReadingStatement(false);
      return;
    }

    const text = buildExerciseSpeech(exerciseForSpeech, currentExerciseIndex);
    const utterance = sounds.speakTTS?.(text, {
      rate: 0.96,
      pitch: 1.01,
      onStart: () => setIsReadingStatement(true),
      onEnd: () => setIsReadingStatement(false),
      onError: () => setIsReadingStatement(false),
    });

    if (!utterance) {
      setIsReadingStatement(false);
      if (manual) {
        toast.message('Activa el sonido para escuchar el enunciado.');
      }
    }
  }, [currentExerciseIndex, exerciseForSpeech, isReadingStatement]);

  useEffect(() => {
    if (!exerciseForSpeech || loading || showModuleCinematic || showTheory) return;
    const speechKey = `${exerciseForSpeech.id || currentExerciseIndex}-${exerciseForSpeech.orden || currentExerciseIndex}`;

    // We remove the strict return if spokenExerciseRef.current === speechKey,
    // to ensure it always plays on visit. We just update it to avoid rapid repeats.
    spokenExerciseRef.current = speechKey;
    if (lastAlertedExerciseKey !== speechKey) {
      setLastAlertedExerciseKey(speechKey);
      sounds.playMissionStart?.();
    }

    // Always attempt to speak TTS when loading a new screen/exercise
    const timeout = window.setTimeout(() => {
      // Force read by bypassing the isReadingStatement check temporarily
      // or trusting that the cleanup in other places stopped previous readings
      sounds.stopSpeech?.();
      const text = buildExerciseSpeech(exerciseForSpeech, currentExerciseIndex);
      sounds.speakTTS?.(text, {
        rate: 0.96,
        pitch: 1.01,
        onStart: () => setIsReadingStatement(true),
        onEnd: () => setIsReadingStatement(false),
        onError: () => setIsReadingStatement(false),
      });
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [currentExerciseIndex, exerciseForSpeech, lastAlertedExerciseKey, loading, showModuleCinematic, showTheory]);

  const scrollToExerciseSection = (sectionId) => {
    const target = document.getElementById(`exercise-${sectionId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDiagramChange = useCallback((graphData) => {
    setEditorCode(JSON.stringify(graphData));
  }, []);

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
  const isDocenteMode = user?.idRol === 2 || user?.idRol === 3;
  const teacherExpectedQuery = isDocenteMode ? exercise.expectedQuery : null;
  const isDragDrop = exercise.type === 'drag_drop';
  const isDiagram = exercise.type === 'diagram'; // <-- DETECTAMOS SI ES UN DIAGRAMA
  const isModelingLab = exercise.pedagogia?.modo === 'laboratorio_modelado';
  const learningFocus = inferLearningFocus(exercise, levelId);
  const learningFeedback = buildLearningFeedback(executionResult, learningFocus, intentosFallidos);
  const statementSentences = splitStatementSentences(exercise.description);
  const safeDroppedWords = normalizeWordList(droppedWords);
  const safeAvailableWords = normalizeWordList(availableWords);
  const assembledSql = isDragDrop ? formatSqlPreview(safeDroppedWords) : '';
  const totalDragBlocks = isDragDrop ? safeAvailableWords.length + safeDroppedWords.length : 0;
  const placedDragBlocks = isDragDrop ? safeDroppedWords.length : 0;
  const modeMeta = isDiagram
    ? { icon: Layers, label: 'Modelo visual', detail: 'Construye entidades y relaciones' }
    : isDragDrop
      ? { icon: MousePointer2, label: 'Bloques SQL', detail: 'Arma la consulta con un banco compacto' }
      : { icon: Code2, label: 'Editor SQL', detail: 'Escribe y valida contra el sandbox' };
  const ModeIcon = modeMeta.icon;
  const guideSteps = [
    ['1', 'Identifica', 'Qué datos pide el enunciado.'],
    ['2', 'Construye', isDragDrop ? 'Coloca solo los bloques necesarios.' : 'Escribe la estructura principal.'],
    ['3', 'Valida', 'Ejecuta y compara el resultado.'],
  ];
  const isFailureResult = executionResult && !executionResult.success && !executionResult.isWarning;
  const hasTopSupport = isFailureResult || clawbotThinking || clawbotMessage || progressiveHint || isDagonIntervening;
  const resultTone = executionResult?.isWarning
    ? {
        icon: AlertTriangle,
        label: 'Advertencia',
        accent: isLight ? '#b45309' : '#fbbf24',
        border: 'rgba(245,158,11,0.36)',
        surface: isLight ? 'rgba(255,251,235,0.90)' : 'rgba(120,53,15,0.20)'
      }
    : executionResult?.success
      ? {
          icon: CheckCircle,
          label: 'Respuesta correcta',
          accent: isLight ? '#047857' : '#34d399',
          border: 'rgba(16,185,129,0.36)',
          surface: isLight ? 'rgba(236,253,245,0.90)' : 'rgba(6,78,59,0.20)'
        }
      : {
          icon: XCircle,
          label: 'Ajuste necesario',
          accent: isLight ? '#be123c' : '#fb7185',
          border: 'rgba(244,63,94,0.36)',
          surface: isLight ? 'rgba(255,241,242,0.90)' : 'rgba(127,29,29,0.20)'
        };
  const ResultIcon = resultTone.icon;
  const activeConceptKey = inferConceptKey(exercise, levelId);
  const activeConcept = LEARNING_CONCEPTS[activeConceptKey] || LEARNING_CONCEPTS.select;
  const rescueScaffold = {
    title: `Plantilla guiada de ${activeConcept.label}`,
    reason: `Usala como estructura de ${learningFocus.concept}; reemplaza los marcadores con datos del enunciado sin copiar una respuesta final.`,
    scaffold: activeConcept.scaffold,
  };
  const scaffoldUnlocked = isFailureResult && intentosFallidos > 3;
  const attemptsUntilScaffold = Math.max(0, 4 - intentosFallidos);
  const applyReinforcementScaffold = () => {
    if (!scaffoldUnlocked) return;
    sounds.playSelect?.();
    if (isDragDrop || isDiagram) {
      setShowHint(true);
      toast.message('Plantilla de referencia activada', {
        description: 'Usala como mapa de estructura sin completar automaticamente la respuesta.',
      });
      return;
    }
    setEditorCode(rescueScaffold.scaffold);
    toast.message('Plantilla de refuerzo cargada', {
      description: 'Completa los marcadores con columnas, tablas y condiciones del enunciado.',
    });
  };
  const rescueScaffoldPanel = isFailureResult ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="mt-4 rounded-2xl border p-4"
      style={{
        borderColor: scaffoldUnlocked ? 'rgba(34,211,238,0.34)' : (isLight ? 'rgba(245,158,11,0.26)' : 'rgba(250,204,21,0.18)'),
        backgroundColor: scaffoldUnlocked
          ? (isLight ? 'rgba(236,254,255,0.76)' : 'rgba(8,47,73,0.22)')
          : (isLight ? 'rgba(255,251,235,0.72)' : 'rgba(113,63,18,0.14)')
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: scaffoldUnlocked ? colors.secondary : (isLight ? '#b45309' : '#fbbf24') }} />
            <p className="text-[10px] font-display font-black uppercase tracking-[0.24em]" style={{ color: scaffoldUnlocked ? colors.secondary : mutedColor }}>
              Plantilla de rescate
            </p>
            {!scaffoldUnlocked && (
              <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ borderColor: isLight ? 'rgba(245,158,11,0.24)' : 'rgba(250,204,21,0.20)', color: isLight ? '#92400e' : '#fde68a' }}>
                Faltan {attemptsUntilScaffold} intento{attemptsUntilScaffold === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <h3 className="mt-2 font-display text-base font-black" style={{ color: headingColor }}>
            {rescueScaffold.title}
          </h3>
          <p className="mt-1 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
            {scaffoldUnlocked
              ? rescueScaffold.reason
              : 'Se desbloquea despues de mas de 3 fallos en este ejercicio para evitar darte demasiada ayuda antes de tiempo.'}
          </p>
        </div>
        <Button
          type="button"
          onClick={applyReinforcementScaffold}
          disabled={!scaffoldUnlocked}
          className="shrink-0 rounded-xl bg-cyan-500 px-4 font-display font-black text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Cargar plantilla
        </Button>
      </div>
      <pre
        className="mt-3 max-h-36 overflow-x-auto rounded-xl border p-3 text-xs font-mono leading-relaxed"
        style={{
          borderColor: isLight ? 'rgba(14,116,144,0.14)' : 'rgba(255,255,255,0.08)',
          backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(2,6,23,0.56)',
          color: scaffoldUnlocked ? headingColor : mutedColor,
          opacity: scaffoldUnlocked ? 1 : 0.78
        }}
      >
        {scaffoldUnlocked ? rescueScaffold.scaffold : '-- La plantilla se muestra a partir del cuarto fallo --'}
      </pre>
      {(isDragDrop || isDiagram) && (
        <p className="mt-2 text-xs font-gameui leading-snug" style={{ color: mutedColor }}>
          En este tipo de ejercicio la plantilla funciona como mapa de estructura para no resolverlo automaticamente por ti.
        </p>
      )}
    </motion.div>
  ) : null;

  const renderDragChip = (word, provided, snapshot, variant = 'bank', marker = {}) => {
    if (!word) return null;
    const isPlaced = variant === 'placed';
    const isClone = Boolean(snapshot?.isDragging);
    const showInsertBefore = Boolean(marker.insertBefore && !isClone);
    const showInsertAfter = Boolean(marker.insertAfter && !isClone);
    const isFirstPlaced = Boolean(marker.isFirst);
    const isLastPlaced = Boolean(marker.isLast);
    const stopDragHandlePropagation = (event) => {
      event.stopPropagation();
    };
    const chipTone = isPlaced
      ? {
          color: isLight ? '#064e3b' : '#bbf7d0',
          backgroundColor: isLight ? 'rgba(209,250,229,0.94)' : 'rgba(6,78,59,0.86)',
          borderColor: isLight ? 'rgba(5,150,105,0.46)' : 'rgba(52,211,153,0.58)',
          glow: 'rgba(16,185,129,0.46)',
          ring: 'ring-emerald-400/20'
        }
      : {
          color: isLight ? '#164e63' : '#cffafe',
          backgroundColor: isLight ? 'rgba(236,254,255,0.92)' : 'rgba(15,23,42,0.86)',
          borderColor: isLight ? 'rgba(14,116,144,0.22)' : 'rgba(34,211,238,0.24)',
          glow: 'rgba(34,211,238,0.45)',
          ring: 'ring-cyan-400/20'
        };

    return (
      <div
        role={!isPlaced ? 'button' : undefined}
        tabIndex={!isPlaced ? 0 : undefined}
        ref={provided?.innerRef}
        {...(provided?.draggableProps || {})}
        {...(provided?.dragHandleProps || {})}
        onClick={!isPlaced ? () => handleUseWord(word) : undefined}
        onKeyDown={!isPlaced ? (event) => runTokenActionFromKeyboard(event, () => handleUseWord(word)) : undefined}
        aria-label={isPlaced
          ? `Bloque colocado ${word.word}. Usa los botones para moverlo o quitarlo.`
          : `Agregar bloque ${word.word}`}
        className={`touch-drag-none relative max-w-[calc(100vw-4rem)] shrink-0 border-2 px-2.5 py-2 sm:max-w-none sm:px-4 rounded-xl font-mono text-sm sm:text-base min-h-[52px] flex items-center gap-2 transition-all ${
          isPlaced ? 'animate-dnd-placed font-bold' : 'font-semibold'
        } ${isPlaced ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isClone ? `scale-105 z-[9999] border-white ring-4 ${chipTone.ring}` : 'hover:-translate-y-0.5'}`}
        style={{
          ...(provided?.draggableProps?.style || {}),
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: isPlaced ? 'manipulation' : 'none',
          pointerEvents: 'auto',
          color: chipTone.color,
          backgroundColor: chipTone.backgroundColor,
          borderColor: isClone ? '#ffffff' : chipTone.borderColor,
          boxShadow: isClone ? `0 0 40px ${chipTone.glow}` : '0 10px 22px rgba(2,6,23,0.10)'
        }}
      >
        {showInsertBefore && (
          <span
            className="pointer-events-none absolute -left-2 top-1/2 h-14 w-1 -translate-y-1/2 rounded-full shadow-[0_0_18px_rgba(34,211,238,0.80)]"
            style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }}
          />
        )}
        {showInsertAfter && (
          <span
            className="pointer-events-none absolute -right-2 top-1/2 h-14 w-1 -translate-y-1/2 rounded-full shadow-[0_0_18px_rgba(34,211,238,0.80)]"
            style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }}
          />
        )}
        {isPlaced
          ? <ListChecks className="h-3.5 w-3.5 opacity-60" />
          : <GripHorizontal className="h-3.5 w-3.5 opacity-60" />}
        <span className="max-w-[56vw] whitespace-normal break-words leading-tight sm:max-w-none sm:whitespace-nowrap">{word.word}</span>
        {isPlaced && !isClone && (
          <div className="ml-1 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onMouseDown={stopDragHandlePropagation}
              onTouchStart={stopDragHandlePropagation}
              onClick={(event) => {
                event.stopPropagation();
                handleMovePlacedWord(word, -1);
              }}
              disabled={isFirstPlaced}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: isLight ? 'rgba(5,150,105,0.28)' : 'rgba(187,247,208,0.22)' }}
              aria-label={`Mover bloque ${word.word} a la izquierda`}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={stopDragHandlePropagation}
              onTouchStart={stopDragHandlePropagation}
              onClick={(event) => {
                event.stopPropagation();
                handleMovePlacedWord(word, 1);
              }}
              disabled={isLastPlaced}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35"
              style={{ borderColor: isLight ? 'rgba(5,150,105,0.28)' : 'rgba(187,247,208,0.22)' }}
              aria-label={`Mover bloque ${word.word} a la derecha`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={stopDragHandlePropagation}
              onTouchStart={stopDragHandlePropagation}
              onClick={(event) => {
                event.stopPropagation();
                handleReturnWord(word);
              }}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors hover:bg-white/20"
              style={{ borderColor: isLight ? 'rgba(5,150,105,0.28)' : 'rgba(187,247,208,0.22)' }}
              aria-label={`Quitar bloque ${word.word}`}
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
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
      <main className="flex-1 overflow-y-auto scroll-fancy pb-10">
        {showModuleCinematic ? (
          <ModuleCinematic
            moduleId={levelId}
            moduleMetadata={moduleMetadata}
            exercises={exercises}
            onComplete={() => {
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
          <div className={`w-full max-w-[1880px] mx-auto px-4 py-5 sm:px-6 lg:px-8 grid gap-5 lg:gap-6 ${shake ? 'animate-shake-x' : ''}`}>
            <nav className="exercise-mobile-stepper" aria-label="Secciones del ejercicio">
              {[
                ['reto', 'Reto'],
                ['editor', isDragDrop ? 'Armar' : isDiagram ? 'Diagrama' : 'Editor'],
                ['resultado', 'Resultado'],
              ].map(([sectionId, label]) => {
                const disabled = sectionId === 'resultado' && !executionResult;
                return (
                  <button
                    key={sectionId}
                    type="button"
                    onClick={() => !disabled && scrollToExerciseSection(sectionId)}
                    disabled={disabled}
                    className="exercise-mobile-stepper__item"
                    aria-label={`Ir a ${label.toLowerCase()}`}
                  >
                    {label}
                  </button>
                );
              })}
            </nav>

            <motion.div
              variants={motionIn}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.32, ease: 'easeOut' }}
              id="exercise-reto"
              className="glass-card-apple dagon-compact-card rounded-3xl border px-5 py-5 sm:px-6 lg:px-7 relative overflow-hidden scroll-mt-24"
              style={{ borderColor: colors.border }}
            >
              <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }} />
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${colors.primary}12` }} />
              <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                <div className="min-w-0 flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="shrink-0 self-start">
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-full blur-2xl" style={{ backgroundColor: `${colors.primary}18` }} />
                      <DagonMascot size="medium" mood={mascotMood} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border px-3 py-1 text-[10px] font-display font-black uppercase tracking-[0.22em]" style={{ borderColor: `${colors.primary}32`, color: colors.primary, backgroundColor: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(15,23,42,0.46)' }}>
                        Dagon explica el reto
                      </span>
                      <span className="rounded-full border px-3 py-1 text-[10px] font-display font-black uppercase tracking-[0.18em]" style={{ borderColor: `${colors.secondary}26`, color: mutedColor, backgroundColor: isLight ? 'rgba(255,255,255,0.52)' : 'rgba(15,23,42,0.36)' }}>
                        {modeMeta.label}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-black leading-tight sm:text-3xl" style={{ color: headingColor }}>
                      {exercise.title}
                    </h2>
                    <div
                      className="mt-4 rounded-3xl border p-4 sm:p-5"
                      style={{
                        borderColor: isLight ? 'rgba(14,116,144,0.22)' : 'rgba(34,211,238,0.22)',
                        background: isLight
                          ? 'linear-gradient(135deg, rgba(236,254,255,0.86), rgba(255,255,255,0.72))'
                          : 'linear-gradient(135deg, rgba(8,47,73,0.36), rgba(2,6,23,0.44))',
                        boxShadow: isLight ? '0 18px 46px -34px rgba(8,145,178,0.38)' : '0 18px 46px -34px rgba(34,211,238,0.40)'
                      }}
                    >
                      <p className="text-[10px] font-display font-black uppercase tracking-[0.26em]" style={{ color: isLight ? '#0e7490' : '#67e8f9' }}>
                        Premisa del ejercicio
                      </p>
                      <div className="mt-3 grid gap-2">
                        {statementSentences.length > 0 ? statementSentences.map((sentence, index) => (
                          <p
                            key={`${sentence}-${index}`}
                            className="font-gameui text-base font-semibold leading-relaxed sm:text-lg"
                            style={{ color: index === 0 ? (isLight ? '#0f172a' : '#f8fafc') : (isLight ? '#334155' : '#cbd5e1') }}
                          >
                            {sentence}
                          </p>
                        )) : (
                          <p className="font-gameui text-base font-semibold leading-relaxed sm:text-lg" style={{ color: headingColor }}>
                            {exercise.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch">
                      <div className="rounded-2xl border px-4 py-3" style={{ borderColor: `${colors.primary}22`, backgroundColor: isLight ? 'rgba(255,255,255,0.58)' : 'rgba(2,6,23,0.28)' }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: colors.accent }}>
                          Objetivo de aprendizaje
                        </p>
                        <p className="mt-1 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                          {learningFocus.objective}
                        </p>
                      </div>
                      <div className="grid min-w-[180px] content-center rounded-2xl border px-4 py-3 text-sm font-display font-black" style={{ borderColor: `${colors.primary}28`, color: headingColor, backgroundColor: isLight ? 'rgba(255,255,255,0.58)' : 'rgba(15,23,42,0.40)' }}>
                        <span>Nivel {exercise.difficulty || 1}</span>
                        <span className="text-xs font-gameui font-bold" style={{ color: mutedColor }}>{exercise.xpReward || 0} XP al completar</span>
                      </div>
                    </div>

                    {teacherExpectedQuery && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 overflow-hidden rounded-3xl border"
                        style={{
                          borderColor: isLight ? 'rgba(124,58,237,0.28)' : 'rgba(196,181,253,0.26)',
                          background: isLight
                            ? 'linear-gradient(135deg, rgba(245,243,255,0.90), rgba(255,255,255,0.74))'
                            : 'linear-gradient(135deg, rgba(46,16,101,0.32), rgba(15,23,42,0.52))'
                        }}
                      >
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-[10px] font-display font-black uppercase tracking-[0.24em]" style={{ color: isLight ? '#6d28d9' : '#c4b5fd' }}>
                              <BadgeCheck className="h-4 w-4" /> Vista docente
                            </p>
                            <p className="mt-1 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                              Respuesta esperada para guiar revisión, explicar variantes y preparar retroalimentación sin afectar el intento del alumno.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard?.writeText(teacherExpectedQuery);
                              toast.success('Query esperada copiada');
                            }}
                            className="min-h-10 shrink-0 rounded-xl font-display font-black"
                            style={{ borderColor: isLight ? 'rgba(124,58,237,0.30)' : 'rgba(196,181,253,0.28)', color: isLight ? '#5b21b6' : '#ddd6fe' }}
                          >
                            <Copy className="mr-2 h-4 w-4" /> Copiar
                          </Button>
                        </div>
                        <pre className="mx-4 mb-4 max-h-44 overflow-auto rounded-2xl border p-4 font-mono text-xs leading-relaxed" style={{ borderColor: isLight ? 'rgba(124,58,237,0.18)' : 'rgba(196,181,253,0.16)', backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(2,6,23,0.72)', color: isLight ? '#312e81' : '#e0e7ff' }}>
                          {teacherExpectedQuery}
                        </pre>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch xl:justify-self-end">
                  <Button
                    type="button"
                    onClick={() => readExerciseStatement(true)}
                    className="min-h-11 rounded-2xl px-5 font-display font-black text-white shadow-[0_16px_34px_rgba(16,185,129,0.24)]"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                    aria-label={isReadingStatement ? 'Detener lectura del enunciado' : 'Leer enunciado de la misión'}
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    {isReadingStatement ? 'Detener lectura' : 'Leer enunciado'}
                  </Button>
                </div>

                <AnimatePresence initial={false}>
                  {hasTopSupport && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: 8, height: 0 }}
                      transition={{ duration: 0.26, ease: 'easeOut' }}
                      className="xl:col-span-2 overflow-hidden"
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)]">
                        <div
                          className="rounded-3xl border p-4"
                          style={{
                            borderColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)',
                            backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(2,6,23,0.30)'
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                              <Lightbulb className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[10px] font-display font-black uppercase tracking-[0.24em]" style={{ color: colors.accent }}>
                                  Guía rápida
                                </p>
                                {intentosFallidos > 0 && !executionResult?.success && (
                                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ borderColor: 'rgba(251,146,60,0.30)', color: isLight ? '#c2410c' : '#fdba74', backgroundColor: isLight ? 'rgba(255,237,213,0.70)' : 'rgba(154,52,18,0.18)' }}>
                                    Intento {intentosFallidos}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 font-display text-base font-black leading-tight" style={{ color: headingColor }}>
                                {learningFocus.concept}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
                            {guideSteps.map(([step, title, detail]) => (
                              <div
                                key={step}
                                className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-2xl border px-3 py-2.5"
                                style={{
                                  borderColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)',
                                  backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(15,23,42,0.36)'
                                }}
                              >
                                <span className="grid h-7 w-7 place-items-center rounded-xl font-display text-xs font-black" style={{ color: '#fff', background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                                  {step}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-display text-sm font-black leading-tight" style={{ color: headingColor }}>{title}</p>
                                  <p className="mt-0.5 text-xs font-gameui leading-snug" style={{ color: mutedColor }}>{detail}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {exercise.hint && (
                            <button
                              type="button"
                              onClick={() => {
                                sounds.playMagic?.();
                                setShowHint(!showHint);
                              }}
                              aria-expanded={showHint}
                              className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-display font-black transition-colors"
                              style={{
                                color: isLight ? '#b45309' : '#fcd34d',
                                borderColor: isLight ? 'rgba(245,158,11,0.22)' : 'rgba(252,211,77,0.22)',
                                backgroundColor: isLight ? 'rgba(255,251,235,0.72)' : 'rgba(120,53,15,0.18)'
                              }}
                            >
                              <Lightbulb className="h-3.5 w-3.5" />
                              {showHint ? 'Ocultar pista' : 'Ver pista'}
                            </button>
                          )}
                          <AnimatePresence>
                            {showHint && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 overflow-hidden rounded-2xl border px-3 py-2 text-sm font-gameui leading-snug"
                                style={{
                                  borderColor: isLight ? 'rgba(245,158,11,0.18)' : 'rgba(252,211,77,0.14)',
                                  backgroundColor: isLight ? 'rgba(255,251,235,0.64)' : 'rgba(2,6,23,0.28)',
                                  color: isLight ? '#92400e' : '#fde68a'
                                }}
                              >
                                {exercise.hint}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div
                          className="rounded-3xl border p-4"
                          style={{
                            borderColor: clawbotMessage || clawbotThinking
                              ? (isLight ? 'rgba(14,116,144,0.20)' : 'rgba(34,211,238,0.20)')
                              : (isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)'),
                            background: clawbotMessage || clawbotThinking
                              ? (isLight ? 'linear-gradient(135deg, rgba(236,254,255,0.78), rgba(255,255,255,0.64))' : 'linear-gradient(135deg, rgba(8,47,73,0.30), rgba(15,23,42,0.38))')
                              : (isLight ? 'rgba(255,255,255,0.58)' : 'rgba(15,23,42,0.32)')
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ background: `linear-gradient(135deg, ${colors.secondary}, ${colors.accent})` }}>
                              {clawbotThinking || clawbotMessage ? (
                                <Bot className="h-5 w-5 text-white" />
                              ) : isDagonIntervening ? (
                                <Lightbulb className="h-5 w-5 text-white" />
                              ) : progressiveHint ? (
                                <TrendingUp className="h-5 w-5 text-white" />
                              ) : (
                                <ModeIcon className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-display font-black uppercase tracking-[0.24em]" style={{ color: colors.secondary }}>
                                {clawbotThinking || clawbotMessage ? 'Dagon responde' : 'Soporte de resolución'}
                              </p>
                              <p className="mt-1 text-sm font-gameui leading-snug" style={{ color: mutedColor }}>
                                {clawbotThinking
                                  ? 'Analizando tu intento...'
                                  : clawbotMessage
                                    ? 'Respuesta de IA junto al enunciado.'
                                    : isDagonIntervening
                                      ? 'Dagon está modelando una corrección.'
                                      : progressiveHint
                                        ? `Pista progresiva nivel ${progressiveHint.level}`
                                        : 'Consulta aquí lo mínimo para avanzar sin perder el contexto.'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            {clawbotThinking ? (
                              <div className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: isLight ? 'rgba(14,116,144,0.14)' : 'rgba(34,211,238,0.16)', backgroundColor: isLight ? 'rgba(255,255,255,0.66)' : 'rgba(2,6,23,0.34)' }}>
                                {[0, 1, 2].map((i) => (
                                  <span key={i} className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                                <span className="ml-2 text-sm font-gameui" style={{ color: mutedColor }}>
                                  Dagon prepara una explicación corta.
                                </span>
                              </div>
                            ) : clawbotMessage ? (
                              <div className="max-h-[22rem] overflow-y-auto scroll-fancy rounded-2xl border p-4" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : '#0f172a', borderColor: isLight ? 'rgba(14,116,144,0.14)' : '#334155' }}>
                                <div className="text-sm font-gameui leading-relaxed">
                                  {formatAIMessage(clawbotMessage, colors)}
                                </div>
                              </div>
                            ) : isDagonIntervening ? (
                              <div className="grid gap-3">
                                <div className="rounded-2xl border p-3" style={{ borderColor: 'rgba(245,158,11,0.28)', backgroundColor: isLight ? 'rgba(255,251,235,0.72)' : 'rgba(120,53,15,0.18)' }}>
                                  <p className="text-sm font-gameui leading-relaxed" style={{ color: headingColor }}>
                                    {executionResult?.dagonMessage}
                                  </p>
                                  <p className="mt-2 text-xs font-gameui leading-relaxed" style={{ color: mutedColor }}>
                                    {executionResult?.dagonExplanation}
                                  </p>
                                </div>
                                <div className="rounded-2xl border bg-black/80 p-3 font-mono text-xs" style={{ borderColor: 'rgba(34,197,94,0.32)' }}>
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] uppercase text-green-400">Sandbox</span>
                                  </div>
                                  <pre className="max-h-28 overflow-y-auto whitespace-pre-wrap break-all text-green-300">{dagonTypingQuery}</pre>
                                </div>
                                {dagonShowPostMessage && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-2xl border p-3"
                                    style={{ borderColor: 'rgba(16,185,129,0.28)', backgroundColor: isLight ? 'rgba(236,253,245,0.78)' : 'rgba(6,78,59,0.18)' }}
                                  >
                                    <p className="text-sm font-gameui" style={{ color: headingColor }}>
                                      {executionResult?.dagonPostMessage}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditorCode(dagonOriginalQuery);
                                        setIsDagonIntervening(false);
                                        setDagonTypingQuery('');
                                        setDagonShowPostMessage(false);
                                        setExecutionResult(null);
                                      }}
                                      aria-label="Ejecutar mi consulta original"
                                      className="mt-3 inline-flex items-center rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-cyan-500"
                                    >
                                      Ejecutar mi query <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                    </button>
                                  </motion.div>
                                )}
                              </div>
                            ) : progressiveHint ? (
                              <div className="rounded-2xl border p-4" style={{ borderColor: progressiveHint.level >= 3 ? 'rgba(244,63,94,0.34)' : 'rgba(245,158,11,0.34)', backgroundColor: progressiveHint.level >= 3 ? (isLight ? 'rgba(255,241,242,0.78)' : 'rgba(127,29,29,0.16)') : (isLight ? 'rgba(255,251,235,0.78)' : 'rgba(120,53,15,0.18)') }}>
                                <h3 className="font-display text-base font-black" style={{ color: headingColor }}>
                                  {progressiveHint.title}
                                </h3>
                                <p className="mt-2 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                                  {progressiveHint.message}
                                </p>
                                {progressiveHint.action.includes('\n') ? (
                                  <pre className="mt-3 max-h-36 overflow-x-auto rounded-xl border p-3 text-xs font-mono" style={{ borderColor: isLight ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.08)', backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(2,6,23,0.62)', color: isLight ? '#92400e' : '#fde68a' }}>
                                    {progressiveHint.action}
                                  </pre>
                                ) : (
                                  <p className="mt-3 text-sm font-gameui leading-relaxed" style={{ color: headingColor }}>
                                    {progressiveHint.action}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-2xl border px-4 py-3" style={{ borderColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)', backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(2,6,23,0.22)' }}>
                                <p className="text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                                  Lee la premisa, ubica qué columna o tabla se está pidiendo y valida con calma. La ayuda aparecerá aquí cuando necesites otra pista.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="grid gap-5 lg:gap-6">
              {false && (
              <div className="space-y-4">
            {/* MASCOTA + INSTRUCCIONES */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card-apple dagon-compact-card rounded-3xl p-4 border relative overflow-hidden"
              style={{ borderColor: colors.border }}
            >
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${colors.primary}12` }} />
              <div className="relative z-10">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className={`absolute -inset-3 rounded-full blur-xl transition-colors duration-500 ${
                      mascotMood === 'nervous' ? 'bg-orange-500/20' :
                      mascotMood === 'excited' ? 'bg-emerald-500/20' :
                      mascotMood === 'sad' ? 'bg-rose-500/15' : 'bg-cyan-500/15'
                    }`} />
                    <DagonMascot size="small" mood={mascotMood} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-display font-black tracking-[0.24em] uppercase" style={{ color: colors.accent }}>
                        Guía rápida
                      </span>
                      {intentosFallidos > 0 && !executionResult?.success && (
                        <span className="text-orange-300 text-[10px] font-bold tracking-widest uppercase bg-orange-500/10 border border-orange-400/30 px-2 py-0.5 rounded-full">
                          Intento {intentosFallidos}
                        </span>
                      )}
                    </div>
                    <p className="font-display text-base font-black leading-tight" style={{ color: headingColor }}>
                      {learningFocus.concept}
                    </p>
                    <p className="mt-1 text-xs font-gameui leading-snug" style={{ color: mutedColor }}>
                      Usa esta guía solo para ubicar el siguiente paso.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  {[
                    ['1', 'Identifica', 'Qué datos pide el enunciado.'],
                    ['2', 'Construye', isDragDrop ? 'Coloca solo los bloques necesarios.' : 'Escribe la estructura principal.'],
                    ['3', 'Valida', 'Ejecuta y compara el resultado.'],
                  ].map(([step, title, detail]) => (
                    <div
                      key={step}
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border px-3 py-2.5"
                      style={{
                        borderColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)',
                        backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(2,6,23,0.24)'
                      }}
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-xl font-display text-xs font-black" style={{ color: '#fff', background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
                        {step}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-black leading-tight" style={{ color: headingColor }}>{title}</p>
                        <p className="mt-0.5 text-xs font-gameui leading-snug" style={{ color: mutedColor }}>{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                  {/* Pista inline */}
                  {exercise.hint && !clawbotMessage && (
                    <button
                      onClick={() => {
                        sounds.playMagic?.();
                        setShowHint(!showHint);
                      }}
                      aria-expanded={showHint}
                      className="mt-3 inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-display font-black transition-colors"
                      style={{
                        color: isLight ? '#b45309' : '#fcd34d',
                        borderColor: isLight ? 'rgba(245,158,11,0.22)' : 'rgba(252,211,77,0.22)',
                        backgroundColor: isLight ? 'rgba(255,251,235,0.72)' : 'rgba(120,53,15,0.18)'
                      }}
                    >
                      <Lightbulb className="w-3 h-3" />
                      {showHint ? 'Ocultar pista' : 'Ver pista'}
                    </button>
                  )}
                  <AnimatePresence>
                    {showHint && !clawbotMessage && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="mt-2 rounded-2xl border px-3 py-2 text-sm font-gameui leading-snug"
                        style={{
                          borderColor: isLight ? 'rgba(245,158,11,0.18)' : 'rgba(252,211,77,0.14)',
                          backgroundColor: isLight ? 'rgba(255,251,235,0.64)' : 'rgba(2,6,23,0.28)',
                          color: isLight ? '#92400e' : '#fde68a'
                        }}
                      >
                        {exercise.hint}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {progressiveHint && !executionResult?.success && !clawbotMessage && !clawbotThinking && (
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

              {reinforcementPlan && !executionResult?.success && !clawbotMessage && !clawbotThinking && (
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
              </div>
              )}

              <div className="grid gap-5 lg:gap-6">

            {/* ARENA DE CÓDIGO O DIAGRAMA */}
            <motion.div
              variants={motionIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.08, duration: 0.34, ease: 'easeOut' }}
              id="exercise-editor"
              className="glass-card-apple dagon-compact-card rounded-3xl border overflow-hidden relative scroll-mt-24"
              style={{ borderColor: colors.border }}
            >
              {/* Barra superior */}
              <div
                className="px-5 py-4 flex flex-col gap-4 border-b lg:flex-row lg:items-center lg:justify-between"
                style={{
                  borderColor: isLight ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.08)',
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.90), rgba(255,247,237,0.76))'
                    : 'linear-gradient(135deg, rgba(2,6,23,0.88), rgba(15,23,42,0.78))'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-2" style={{ borderColor: isLight ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.10)', backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(2,6,23,0.46)' }}>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: colors.accent }}>
                      {modeMeta.label}
                    </p>
                    <p className="mt-1 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                      {modeMeta.detail}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  {isDragDrop && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetDragDropAnswer}
                      disabled={safeDroppedWords.length === 0}
                      className="w-full sm:w-auto justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 font-display font-black disabled:opacity-45"
                      aria-label="Limpiar bloques colocados"
                    >
                      <Eraser className="w-4 h-4 mr-2" />
                      Limpiar
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      sounds.playStep();
                      handleValidate();
                    }}
                    disabled={validating || (isDragDrop && safeDroppedWords.length === 0) || (!isDragDrop && !isDiagram && !editorCode) || clawbotThinking}
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
              </div>

              {/* Contenedor Principal (Diagrama / Editor / Drag-drop) */}
              <div className="p-5 sm:p-6">
                {isDiagram ? (
                  <>
                    <div className="exercise-workbench-frame h-[420px] sm:h-[520px] xl:h-[640px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner relative bg-[#090b10]">
                      <MerDiagramBuilder
                        onChangeData={handleDiagramChange}
                      />
                    </div>
                    {isModelingLab && (
                      <DiagramSqlPreview
                        graphJson={editorCode}
                        colors={colors}
                        isLight={isLight}
                        headingColor={headingColor}
                        mutedColor={mutedColor}
                      />
                    )}
                    {rescueScaffoldPanel}
                  </>
                ) : isDragDrop ? (
                  <DragDropContext
                    onDragStart={(start) => {
                      armDragClickGuard();
                      setDragDestination(null);
                      const sourceList = start.source.droppableId === 'dropZone' ? safeDroppedWords : safeAvailableWords;
                      setDraggingWord(sourceList[start.source.index] || null);
                    }}
                    onDragUpdate={(update) => {
                      setDragDestination(update.destination || null);
                    }}
                    onDragEnd={(result) => {
                      setDraggingWord(null);
                      setDragDestination(null);
                      handleDragEnd(result);
                    }}
                  >
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(320px,0.86fr)]">
                      <motion.div
                        variants={motionIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="rounded-3xl border p-4 sm:p-5 flex flex-col"
                        style={{
                          borderColor: isLight ? 'rgba(16,185,129,0.24)' : 'rgba(16,185,129,0.18)',
                          backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(2,6,23,0.36)'
                        }}
                      >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <ListChecks className="h-4 w-4" style={{ color: colors.primary }} />
                              <p className="text-[10px] uppercase tracking-[0.28em] font-black" style={{ color: colors.primary }}>
                                Consulta en armado
                              </p>
                            </div>
                            <p className="mt-1 text-xs font-gameui leading-snug" style={{ color: mutedColor }}>
                              Arrastra para reordenar. Usa la X para quitar un bloque.
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => scrollDragRail(dropZoneScrollRef, 'start')}
                              className="rounded-xl border px-3 py-2 text-xs font-display font-black transition-colors hover:bg-white/10"
                              style={{ borderColor: `${colors.primary}24`, color: mutedColor, backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(15,23,42,0.36)' }}
                            >
                              Inicio
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollDragRail(dropZoneScrollRef, 'end')}
                              className="rounded-xl border px-3 py-2 text-xs font-display font-black transition-colors hover:bg-white/10"
                              style={{ borderColor: `${colors.primary}24`, color: headingColor, backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(15,23,42,0.36)' }}
                            >
                              Final
                            </button>
                            <div className="rounded-2xl border px-3 py-2 text-left sm:text-right" style={{ borderColor: `${colors.primary}24`, backgroundColor: isLight ? 'rgba(255,255,255,0.64)' : 'rgba(15,23,42,0.46)' }}>
                              <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: mutedColor }}>Bloques usados</p>
                              <p className="font-display text-lg font-black leading-none" style={{ color: headingColor }}>
                                {placedDragBlocks}<span className="text-xs" style={{ color: mutedColor }}>/{totalDragBlocks}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        {draggingWord && (
                          <div className="mb-3 flex items-center gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: isLight ? 'rgba(16,185,129,0.20)' : 'rgba(52,211,153,0.18)', backgroundColor: isLight ? 'rgba(236,253,245,0.74)' : 'rgba(6,78,59,0.16)' }}>
                            <GripHorizontal className="h-4 w-4" style={{ color: isLight ? '#047857' : '#86efac' }} />
                            <p className="text-xs font-gameui leading-snug" style={{ color: mutedColor }}>
                              Moviendo <span className="font-mono font-bold" style={{ color: headingColor }}>{draggingWord.word}</span> desde el banco. Al soltarlo, usa las flechas del bloque para ajustar su posición.
                            </p>
                          </div>
                        )}
                        <Droppable
                          droppableId="dropZone"
                          direction="horizontal"
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={(node) => {
                                provided.innerRef(node);
                                dropZoneScrollRef.current = node;
                              }}
                              {...provided.droppableProps}
                              className={`exercise-drop-rail min-h-[132px] sm:min-h-[142px] rounded-2xl border-2 border-dashed p-3 sm:p-4 flex flex-nowrap sm:flex-wrap content-start gap-y-3 gap-x-2 overflow-x-auto sm:overflow-visible scroll-fancy transition-all relative ${
                                snapshot.isDraggingOver ? 'border-emerald-400 animate-dnd-glow' : ''
                              }`}
                              style={{
                                borderColor: snapshot.isDraggingOver ? '#34d399' : (isLight ? 'rgba(16,185,129,0.30)' : 'rgba(148,163,184,0.22)'),
                                background: snapshot.isDraggingOver
                                  ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(34,211,238,0.12))'
                                  : (isLight ? 'rgba(255,255,255,0.64)' : 'rgba(15,23,42,0.48)')
                              }}
                            >
                              {safeDroppedWords.length === 0 && (
                                <div className="grid min-h-[120px] sm:min-h-[160px] w-full place-items-center rounded-xl border border-dashed" style={{ borderColor: isLight ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.08)', color: mutedColor }}>
                                  <div className="text-center">
                                    <Sparkles className="mx-auto mb-2 h-5 w-5" style={{ color: colors.primary }} />
                                    <p className="font-display text-sm font-black" style={{ color: headingColor }}>Coloca aquí la consulta</p>
                                    <p className="mt-1 text-xs font-gameui">Arrastra desde el banco o toca un bloque para agregarlo.</p>
                                  </div>
                                </div>
                              )}
                              {safeDroppedWords.map((w, i) => (
                                <div key={w.id} className="shrink-0">
                                  {renderDragChip(w, null, { isDragging: false }, 'placed', {
                                    insertBefore: false,
                                    insertAfter: dragDestination?.droppableId === 'dropZone' && i === safeDroppedWords.length - 1,
                                    isFirst: i === 0,
                                    isLast: i === safeDroppedWords.length - 1,
                                  })}
                                </div>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: isLight ? 'rgba(14,165,233,0.18)' : 'rgba(34,211,238,0.14)', backgroundColor: isLight ? 'rgba(240,249,255,0.72)' : 'rgba(8,47,73,0.22)' }}>
                          <div className="flex items-center gap-2">
                            <Code2 className="h-4 w-4" style={{ color: isLight ? '#0284c7' : '#67e8f9' }} />
                            <p className="text-[10px] font-black uppercase tracking-[0.26em]" style={{ color: isLight ? '#0369a1' : '#67e8f9' }}>
                              Vista previa
                            </p>
                          </div>
                          <pre className="mt-3 min-h-[3rem] max-h-[8rem] overflow-y-auto scroll-fancy whitespace-pre-wrap break-words rounded-xl border px-4 py-3 font-mono text-sm leading-relaxed" style={{ borderColor: isLight ? 'rgba(14,165,233,0.16)' : 'rgba(255,255,255,0.08)', backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(2,6,23,0.58)', color: assembledSql ? headingColor : mutedColor }}>
                            {assembledSql || '-- Tu SQL aparecerá aquí conforme coloques bloques'}
                          </pre>
                        </div>
                        {rescueScaffoldPanel}
                      </motion.div>

                      <motion.div
                        variants={motionIn}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.06, duration: 0.28, ease: 'easeOut' }}
                        className="rounded-3xl border p-4 sm:p-5 flex flex-col"
                        style={{
                          borderColor: isLight ? 'rgba(14,165,233,0.24)' : 'rgba(34,211,238,0.16)',
                          backgroundColor: isLight ? 'rgba(255,255,255,0.66)' : 'rgba(15,23,42,0.34)'
                        }}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Layers className="h-4 w-4" style={{ color: colors.secondary }} />
                              <p className="text-[10px] uppercase tracking-[0.28em] font-black" style={{ color: colors.secondary }}>
                                Banco filtrado
                              </p>
                            </div>
                            <p className="mt-1 text-xs font-gameui leading-snug" style={{ color: mutedColor }}>
                              Toca para agregar. También puedes arrastrar al área verde.
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border px-3 py-1 text-[10px] font-display font-black" style={{ borderColor: `${colors.secondary}32`, color: headingColor, backgroundColor: isLight ? 'rgba(255,255,255,0.64)' : 'rgba(2,6,23,0.42)' }}>
                              {safeAvailableWords.length} libres
                          </span>
                        </div>
                        <Droppable
                          droppableId="wordBank"
                          direction="horizontal"
                          renderClone={(provided, snapshot, rubric) => renderDragChip(safeAvailableWords[rubric.source.index], provided, snapshot, 'bank')}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={(node) => {
                                provided.innerRef(node);
                                wordBankScrollRef.current = node;
                              }}
                              {...provided.droppableProps}
                              className={`exercise-word-rail min-h-[128px] sm:min-h-[142px] rounded-2xl border-2 p-3 sm:p-4 flex flex-nowrap sm:flex-wrap content-start gap-y-3 gap-x-2 overflow-x-auto sm:overflow-visible scroll-fancy transition-all duration-300 ${
                                snapshot.isDraggingOver ? 'shadow-[inset_0_0_24px_rgba(34,211,238,0.14)]' : ''
                              }`}
                              style={{
                                borderColor: snapshot.isDraggingOver ? 'rgba(34,211,238,0.55)' : (isLight ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.08)'),
                                backgroundColor: snapshot.isDraggingOver
                                  ? (isLight ? 'rgba(236,254,255,0.78)' : 'rgba(8,47,73,0.36)')
                                  : (isLight ? 'rgba(255,255,255,0.62)' : 'rgba(2,6,23,0.38)')
                              }}
                            >
                              {safeAvailableWords.length === 0 && (
                                <div className="grid w-full min-h-[120px] place-items-center rounded-xl border border-dashed text-center" style={{ borderColor: isLight ? 'rgba(14,165,233,0.18)' : 'rgba(255,255,255,0.08)', color: mutedColor }}>
                                  <p className="font-gameui text-sm">No quedan bloques libres. Revisa la vista previa antes de ejecutar.</p>
                                </div>
                              )}
                              {safeAvailableWords.map((w, i) => (
                                <Draggable key={w.id} draggableId={w.id} index={i}>
                                  {(prov, snap) => renderDragChip(w, prov, snap, 'bank')}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </motion.div>
                    </div>
                  </DragDropContext>
                ) : (
                  <>
                    <div className="exercise-workbench-frame h-[420px] sm:h-[500px] xl:h-[640px] rounded-2xl overflow-hidden border border-white/10">
                      <Editor
                        height="100%"
                        defaultLanguage="sql"
                        theme="vs-dark"
                        value={editorCode}
                        onChange={(value) => {
                          setEditorCode(value || '');
                          const now = Date.now();
                          if (now - lastTypingSoundRef.current > 900) {
                            lastTypingSoundRef.current = now;
                            sounds.playClockTicking?.();
                          }
                        }}
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
                    {isModelingLab && (
                      <ModelingLabPanel
                        sql={editorCode}
                        onUseSql={setEditorCode}
                        colors={colors}
                        isLight={isLight}
                        headingColor={headingColor}
                        mutedColor={mutedColor}
                      />
                    )}
                    {rescueScaffoldPanel}
                  </>
                )}
              </div>
            </motion.div>

{/* RESULTADOS */}
            <AnimatePresence>
              {executionResult && (
                <motion.div
                  id="exercise-resultado"
                  ref={resultPanelRef}
                  tabIndex={-1}
                  aria-live={executionResult.success || executionResult.isWarning ? 'polite' : undefined}
                  initial={{ opacity: 0, y: 18, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.99 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                  className="glass-card-apple rounded-3xl border overflow-hidden relative scroll-mt-24 focus:outline-none"
                  style={{
                    borderColor: resultTone.border,
                    boxShadow: `0 24px 70px -42px ${resultTone.accent}55`
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${resultTone.accent}, ${colors.secondary})` }} />
                  <div
                    className="px-4 sm:px-5 py-5 flex flex-col gap-3 border-b sm:flex-row sm:items-start"
                    style={{ borderColor: resultTone.border, backgroundColor: resultTone.surface }}
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-lg" style={{ borderColor: resultTone.border, backgroundColor: isLight ? 'rgba(255,255,255,0.74)' : 'rgba(2,6,23,0.42)' }}>
                      <ResultIcon className="h-6 w-6" style={{ color: resultTone.accent }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: resultTone.accent }}>
                        {resultTone.label}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-black leading-tight" style={{ color: headingColor }}>
                        {executionResult.success || executionResult.isWarning ? 'Respuesta procesada' : 'Revisa una parte de la consulta'}
                      </h3>
                      <p className="mt-2 text-sm font-gameui leading-relaxed" style={{ color: mutedColor }}>
                        {executionResult.message}
                      </p>
                    </div>
                    {(executionResult.xp_gained || 0) > 0 && (
                      <div className="shrink-0 rounded-2xl border px-4 py-3 text-left sm:text-right" style={{ borderColor: 'rgba(250,204,21,0.34)', backgroundColor: isLight ? 'rgba(255,251,235,0.82)' : 'rgba(113,63,18,0.22)' }}>
                        <p className="text-[9px] font-black uppercase tracking-[0.24em]" style={{ color: isLight ? '#b45309' : '#fde68a' }}>Ganancia</p>
                        <p className="font-display text-2xl font-black leading-none" style={{ color: isLight ? '#a16207' : '#fef08a' }}>
                          +{executionResult.xp_gained} XP
                        </p>
                      </div>
                    )}
                  </div>

                  {learningFeedback && (
                    <div className="px-4 py-3 border-b" style={{ borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="grid gap-3 rounded-2xl border p-3 lg:grid-cols-[auto_minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center"
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
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(15,23,42,0.55)' }}>
                            {learningFeedback.tone === 'success'
                              ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                              : learningFeedback.tone === 'warning'
                                ? <Lightbulb className="w-5 h-5 text-amber-300" />
                                : <XCircle className="w-5 h-5 text-rose-400" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.24em] font-black" style={{ color: mutedColor }}>
                              Guía breve
                            </p>
                            <h3 className="mt-0.5 font-display text-sm font-black sm:text-base" style={{ color: headingColor }}>
                              {learningFeedback.title}
                            </h3>
                          </div>
                        </div>
                        <p className="rounded-xl border px-3 py-2 text-sm font-gameui leading-snug" style={{ color: mutedColor, borderColor: isLight ? 'rgba(2,6,23,0.08)' : 'rgba(255,255,255,0.08)', backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(2,6,23,0.22)' }}>
                          {learningFeedback.message}
                        </p>
                        <p className="rounded-xl border px-3 py-2 text-sm font-gameui leading-snug" style={{ color: headingColor, borderColor: isLight ? 'rgba(2,6,23,0.08)' : 'rgba(255,255,255,0.08)', backgroundColor: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(2,6,23,0.22)' }}>
                          Siguiente: {learningFeedback.next}
                        </p>
                      </div>
                    </div>
                  )}

                  {isFailureResult ? (
                    <div className="px-4 py-3">
                      <div className="flex items-start gap-3 rounded-2xl border px-3 py-2.5" style={{ borderColor: isLight ? 'rgba(14,116,144,0.14)' : 'rgba(34,211,238,0.14)', backgroundColor: isLight ? 'rgba(236,254,255,0.64)' : 'rgba(8,47,73,0.18)' }}>
                        <Bot className="mt-0.5 h-4 w-4 shrink-0" style={{ color: colors.secondary }} />
                        <p className="text-sm font-gameui leading-snug" style={{ color: mutedColor }}>
                          La explicación de Dagon, las pistas y la respuesta de IA están arriba junto a la premisa para que corrijas sin perder el contexto.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <QueryResultShowcase result={executionResult} exercise={exercise} colors={colors} />
                  )}

                  {!isFailureResult && (
                    <PerformanceAnalysisPanel
                      performance={executionResult.performance}
                      colors={colors}
                      isLight={isLight}
                      headingColor={headingColor}
                      mutedColor={mutedColor}
                    />
                  )}

                  {(executionResult.success || executionResult.isWarning || exerciseLeaderboard || exerciseLeaderboardLoading) && (
                    <ExerciseLeaderboardPanel
                      leaderboard={executionResult.exerciseLeaderboard || exerciseLeaderboard}
                      loading={exerciseLeaderboardLoading}
                      colors={colors}
                      isLight={isLight}
                      headingColor={headingColor}
                      mutedColor={mutedColor}
                    />
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
                          : <>Completar módulo <Trophy className="w-5 h-5 ml-1 inline" /></>
                        }
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
