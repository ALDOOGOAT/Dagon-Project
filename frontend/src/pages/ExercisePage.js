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
import { sounds } from '../lib/SoundEngine';
import {
  ArrowLeft, CheckCircle, XCircle, Database,
  Play, Loader, GripHorizontal, Bot, Zap, Flame, Lightbulb, ChevronRight, ChevronDown, ChevronUp, RotateCcw, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';
import { apiUrl } from '../config/api';

const formatAIMessage = (text, theme = {}) => {
  if (!text) return null;
  const isLight = theme.mode === 'light';
  
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
      return <h4 key={i} className="mt-4 mb-2 text-lg font-bold" style={{ color: theme.primary || '#10b981' }}>{part.text}</h4>;
    }
    if (part.type === 'error') {
      return <div key={i} className="mt-3 mb-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderLeft: '4px solid #f87171', color: isLight ? '#b91c1c' : '#fca5a5' }}>
        <span className="text-xs uppercase tracking-wider opacity-70">❌ Error</span>
        <p className="mt-1 font-semibold">{part.text}</p>
      </div>;
    }
    if (part.type === 'concepto') {
      return <div key={i} className="mt-2 mb-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))', borderLeft: '4px solid #22c55e', color: isLight ? '#166534' : '#86efac' }}>
        <span className="text-xs uppercase tracking-wider opacity-70">💡 Concepto</span>
        <p className="mt-1 font-semibold">{part.text}</p>
      </div>;
    }
    if (part.type === 'ayuda') {
      return <div key={i} className="mt-2 mb-3 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(251,191,36,0.15)', borderLeft: '3px solid #fbbf24', color: isLight ? '#92400e' : '#fcd34d' }}>
        <span className="text-xs uppercase tracking-wider opacity-70">🔧 Ayuda</span>
        <p className="mt-1">{part.text}</p>
      </div>;
    }
    if (part.type === 'pista') {
      return <div key={i} className="mt-2 mb-2 px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(34,211,238,0.1)', borderLeft: '3px solid #22d3ee', color: isLight ? '#155e75' : '#67e8f9' }}>
        <span className="text-xs uppercase tracking-wider opacity-70">💡 Pista</span>
        <p className="mt-1">{part.text}</p>
      </div>;
    }
    if (part.type === 'porque') {
      return <div key={i} className="mt-2 mb-3 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'rgba(251,191,36,0.1)', borderLeft: '3px solid #fbbf24', color: isLight ? '#92400e' : '#fcd34d' }}>{part.text}</div>;
    }
    if (part.type === 'code') {
      return <code key={i} className="block my-2 px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : '#0f172a', color: isLight ? '#b45309' : '#6ee7b7', border: `1px solid ${isLight ? 'rgba(245,158,11,0.14)' : '#1e293b'}` }}>{part.text}</code>;
    }
    if (part.type === 'table') {
      return <div key={i} className="my-3 p-3 rounded-lg overflow-x-auto text-xs font-mono" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : '#1e293b', color: isLight ? '#6b7280' : '#94a3b8' }}>{part.text}</div>;
    }
    return <p key={i} className="mt-2 mb-1 text-sm" style={{ color: isLight ? '#374151' : '#e2e8f0' }}>{part.text}</p>;
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

const buildRowSignature = (row = {}) => {
  const normalized = Object.keys(row)
    .sort()
    .reduce((acc, key) => {
      if (!String(key).toLowerCase().startsWith('id')) {
        acc[key] = row[key];
      }
      return acc;
    }, {});

  const effective = Object.keys(normalized).length > 0 ? normalized : row;
  return JSON.stringify(effective);
};

const buildTransactionDiff = (beforeData = [], afterData = []) => {
  const beforeCounts = new Map();
  const afterCounts = new Map();

  beforeData.forEach((row) => {
    const sig = buildRowSignature(row);
    beforeCounts.set(sig, (beforeCounts.get(sig) || 0) + 1);
  });

  afterData.forEach((row) => {
    const sig = buildRowSignature(row);
    afterCounts.set(sig, (afterCounts.get(sig) || 0) + 1);
  });

  const beforeMarkers = beforeData.map((row) => {
    const sig = buildRowSignature(row);
    const inAfter = afterCounts.get(sig) || 0;
    return inAfter > 0 ? 'stable' : 'removed';
  });

  const tempBeforeCounts = new Map();
  const afterMarkers = afterData.map((row) => {
    const sig = buildRowSignature(row);
    const seen = tempBeforeCounts.get(sig) || 0;
    tempBeforeCounts.set(sig, seen + 1);
    const inBefore = beforeCounts.get(sig) || 0;
    return seen < inBefore ? 'stable' : 'added';
  });

  return { beforeMarkers, afterMarkers };
};

const isTransactionExercise = (exercise, levelId) => {
  if (String(levelId) === '15') return true;
  if (exercise?.pedagogia?.modo === 'terminal_transaccional') return true;

  const combined = [
    exercise?.title,
    exercise?.description,
    exercise?.starterCode
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  return /(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|TRANSAC)/.test(combined);
};

const DataComparisonTable = ({ data, colors, highlight = false, rowMarkers = [], animateRows = false }) => {
  if (!data || data.length === 0) {
    return <div className="p-4 text-xs italic" style={{ color: colors.textMuted }}>Tabla vacía</div>;
  }
  const isLight = colors.mode === 'light';
  const columns = Object.keys(data[0]);
  const getRowStyle = (marker) => {
    if (marker === 'added') {
      return {
        backgroundColor: isLight ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.10)',
        boxShadow: 'inset 3px 0 0 rgba(16,185,129,0.95)'
      };
    }
    if (marker === 'removed') {
      return {
        backgroundColor: isLight ? 'rgba(244,63,94,0.10)' : 'rgba(244,63,94,0.08)',
        boxShadow: 'inset 3px 0 0 rgba(244,63,94,0.90)'
      };
    }
    return {};
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] text-left border-collapse">
        <thead>
          <tr style={{ backgroundColor: isLight ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.05)' }}>
            {columns.map(col => (
              <th key={col} className="px-3 py-2 font-bold uppercase tracking-tighter border-b" style={{ color: colors.textMuted, borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.05)' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <motion.tr
              key={`${i}-${buildRowSignature(row)}`}
              initial={animateRows ? { opacity: 0, y: 10, scale: 0.985 } : false}
              animate={animateRows ? { opacity: 1, y: 0, scale: 1 } : false}
              transition={animateRows ? { duration: 0.28, delay: i * 0.05 } : undefined}
              className={`${highlight ? 'hover:bg-emerald-500/10' : ''}`}
              style={{
                borderBottom: `1px solid ${isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.05)'}`,
                ...getRowStyle(rowMarkers[i])
              }}
            >
              {Object.values(row).map((val, j) => (
                <td key={j} className="px-3 py-1.5 font-mono" style={{ color: isLight ? '#374151' : '#cbd5e1' }}>
                  <div className="flex items-center gap-2">
                    {j === 0 && rowMarkers[i] === 'added' && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500">Nuevo</span>
                    )}
                    {j === 0 && rowMarkers[i] === 'removed' && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-500">Revertido</span>
                    )}
                    <span>{String(val)}</span>
                  </div>
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CompactSection = ({ title, subtitle, defaultOpen = true, colors, accentColor, children, countLabel = null }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isLight = colors.mode === 'light';

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.06)',
        backgroundColor: isLight ? 'rgba(255,255,255,0.80)' : 'rgba(15,23,42,0.62)'
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] font-black" style={{ color: accentColor || colors.textMuted }}>
            {title}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs font-gameui" style={{ color: colors.textMuted }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {countLabel && (
            <span
              className="px-2 py-1 rounded-full text-[10px] font-mono"
              style={{
                color: colors.text,
                backgroundColor: isLight ? 'rgba(255,248,235,0.94)' : 'rgba(2,6,23,0.82)'
              }}
            >
              {countLabel}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" style={{ color: colors.textMuted }} /> : <ChevronDown className="w-4 h-4" style={{ color: colors.textMuted }} />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TransactionPedagogyCard = ({ pedagogia, colors }) => {
  if (!pedagogia || pedagogia.modo !== 'terminal_transaccional') return null;

  const isLight = colors.mode === 'light';
  const focusItems = Array.isArray(pedagogia.foco) ? pedagogia.foco : [];
  const panels = Array.isArray(pedagogia.paneles) ? pedagogia.paneles : [];

  return (
    <div
      className="mt-5 rounded-3xl border p-5 overflow-hidden relative"
      style={{
        borderColor: isLight ? 'rgba(245,158,11,0.18)' : 'rgba(34,211,238,0.18)',
        background: isLight
          ? 'linear-gradient(135deg, rgba(255,251,235,0.92), rgba(255,255,255,0.84))'
          : 'linear-gradient(135deg, rgba(8,15,32,0.92), rgba(15,23,42,0.84))'
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${colors.primary}, ${colors.secondary}, transparent)` }}
      />
      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.28em]"
            style={{
              borderColor: isLight ? 'rgba(245,158,11,0.18)' : 'rgba(34,211,238,0.16)',
              color: colors.accent,
              backgroundColor: isLight ? 'rgba(255,255,255,0.76)' : 'rgba(15,23,42,0.56)'
            }}
          >
            <Database className="w-3 h-3" />
            Laboratorio PostgreSQL
          </div>
          <p className="text-sm font-gameui leading-relaxed max-w-2xl" style={{ color: colors.text }}>
            {pedagogia.mensaje_terminal || 'Esta misión se resuelve como si trabajaras en una terminal real, con transacciones visibles y dos sesiones observando el mismo problema.'}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {focusItems.map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full text-[11px] font-mono border"
                style={{
                  color: colors.text,
                  borderColor: isLight ? 'rgba(217,119,6,0.16)' : 'rgba(34,211,238,0.16)',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.72)'
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div
          className="min-w-[250px] rounded-2xl border overflow-hidden"
          style={{
            borderColor: isLight ? 'rgba(245,158,11,0.14)' : 'rgba(51,65,85,0.9)',
            backgroundColor: isLight ? 'rgba(255,255,255,0.86)' : 'rgba(2,6,23,0.92)'
          }}
        >
          <div
            className="px-4 py-2 border-b flex items-center gap-2"
            style={{
              borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
              backgroundColor: isLight ? 'rgba(255,248,235,0.94)' : 'rgba(15,23,42,0.96)'
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-[10px] tracking-[0.25em] uppercase font-mono" style={{ color: colors.textMuted }}>
              prompts activos
            </span>
          </div>
          <div className="p-4 space-y-3 font-mono text-sm">
            <div style={{ color: colors.text }}>
              <span style={{ color: colors.primary }}>{pedagogia.terminal_prompt_base || 'dagon=#'}</span> BEGIN;
            </div>
            <div style={{ color: colors.text }}>
              <span style={{ color: colors.secondary }}>{pedagogia.terminal_prompt_tx || 'dagon=*#'}</span> UPDATE cuentas SET saldo = saldo - 100;
            </div>
            <div style={{ color: colors.text }}>
              <span style={{ color: colors.secondary }}>{pedagogia.terminal_prompt_tx || 'dagon=*#'}</span> SAVEPOINT mitad;
            </div>
            <div style={{ color: colors.text }}>
              <span style={{ color: colors.primary }}>{pedagogia.terminal_prompt_base || 'dagon=#'}</span> COMMIT;
            </div>
          </div>
        </div>
      </div>
      {panels.length > 0 && (
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {panels.map((panel) => (
            <div
              key={panel}
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: isLight ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.06)',
                backgroundColor: isLight ? 'rgba(255,255,255,0.76)' : 'rgba(15,23,42,0.56)'
              }}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] font-bold" style={{ color: colors.textMuted }}>
                {panel.replaceAll('_', ' ')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TransactionSimulationPanel = ({ simulation, colors }) => {
  if (!simulation) return null;

  const isLight = colors.mode === 'light';
  const timeline = Array.isArray(simulation.timeline) ? simulation.timeline : [];
  const focus = Array.isArray(simulation.focus) ? simulation.focus : [];

  return (
    <div
      className="p-4 md:p-5 space-y-4 border-b"
      style={{
        borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
        background: isLight
          ? 'linear-gradient(180deg, rgba(255,251,235,0.84), rgba(255,255,255,0.84))'
          : 'linear-gradient(180deg, rgba(8,15,32,0.90), rgba(15,23,42,0.78))'
      }}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] font-black mb-2" style={{ color: colors.accent }}>
            Simulación transaccional
          </p>
          <h3 className="font-display text-xl font-black" style={{ color: colors.text }}>
            {simulation.headline || 'Dos sesiones en paralelo'}
          </h3>
          <p className="mt-2 text-sm font-gameui max-w-2xl" style={{ color: colors.textMuted }}>
            {simulation.summary || simulation.message || 'La traza compara lo que ve la Sesión A con lo que todavía puede leer la Sesión B.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
          <div
            className="rounded-2xl border px-4 py-3"
            style={{
              borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
              backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.68)'
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] font-bold" style={{ color: colors.textMuted }}>Sesión A</p>
                <p className="mt-2 font-mono text-sm" style={{ color: colors.primary }}>{simulation.basePrompt || 'dagon=#'}</p>
                <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>Cliente que ejecuta la transacción.</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.26em] font-bold" style={{ color: colors.textMuted }}>Sesión B</p>
                <p className="mt-2 font-mono text-sm" style={{ color: colors.secondary }}>{simulation.basePrompt || 'dagon=#'}</p>
                <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>Cliente paralelo que intenta leer.</p>
              </div>
            </div>
          </div>
          {focus.length > 0 && (
            <CompactSection
              title="Focos pedagógicos"
              subtitle="Ideas clave de esta ejecución"
              colors={colors}
              accentColor={colors.accent}
              defaultOpen={false}
              countLabel={`${focus.length} ideas`}
            >
              <div className="grid grid-cols-1 gap-2">
                {focus.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border px-3 py-2"
                    style={{
                      borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.05)',
                      backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(8,15,32,0.54)'
                    }}
                  >
                    <p className="text-sm font-gameui" style={{ color: colors.text }}>{item}</p>
                  </div>
                ))}
              </div>
            </CompactSection>
          )}
        </div>
      </div>

      {timeline.length > 0 && (
        <CompactSection
          title="Línea de tiempo"
          subtitle="Pasos de la ejecución en dos sesiones"
          colors={colors}
          accentColor={colors.accent}
          defaultOpen={true}
          countLabel={`${timeline.length} pasos`}
        >
          <div className="max-h-[26rem] overflow-y-auto pr-1 space-y-3 scroll-fancy">
            {timeline.map((event) => (
              <motion.div
                key={`${event.step}-${event.statement}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: event.step * 0.03 }}
                className="rounded-2xl border p-3 md:p-4"
                style={{
                  borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.84)' : 'rgba(15,23,42,0.74)'
                }}
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black"
                    style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                  >
                    {event.step}
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.22em] font-bold"
                    style={{ backgroundColor: `${colors.secondary}18`, color: colors.secondary }}
                  >
                    {event.concept}
                  </span>
                </div>
                <div
                  className="rounded-2xl border px-3 py-3 font-mono text-xs md:text-sm overflow-x-auto"
                  style={{
                    borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.06)',
                    backgroundColor: isLight ? 'rgba(255,250,240,0.92)' : 'rgba(2,6,23,0.92)',
                    color: colors.text
                  }}
                >
                  <span style={{ color: event.prompt === simulation.txPrompt ? colors.secondary : colors.primary }}>
                    {event.prompt || simulation.basePrompt || 'dagon=#'}
                  </span>{' '}
                  {event.statement}
                </div>
                <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3">
                  <div>
                    <p className="text-sm font-gameui" style={{ color: colors.text }}>
                      {event.effect}
                    </p>
                    <div
                      className="mt-3 rounded-2xl border px-3 py-2"
                      style={{
                        borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.05)',
                        backgroundColor: isLight ? 'rgba(254,243,199,0.42)' : 'rgba(34,211,238,0.08)'
                      }}
                    >
                      <p className="text-xs font-gameui" style={{ color: colors.textMuted }}>
                        {event.visibilityHint}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    <div
                      className="rounded-2xl border px-3 py-2"
                      style={{
                        borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.05)',
                        backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(8,15,32,0.58)'
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.24em] font-bold mb-1" style={{ color: colors.textMuted }}>A ve</p>
                      <p className="font-mono text-sm" style={{ color: colors.text }}>{event.sessionAVisibleRows}</p>
                    </div>
                    <div
                      className="rounded-2xl border px-3 py-2"
                      style={{
                        borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.05)',
                        backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(8,15,32,0.58)'
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.24em] font-bold mb-1" style={{ color: colors.textMuted }}>B ve</p>
                      <p className="font-mono text-sm" style={{ color: colors.text }}>{event.sessionBVisibleRows}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CompactSection>
      )}
    </div>
  );
};

const TransactionOutcomePanel = ({ result, colors }) => {
  if (!result?.isTransactionVisual && !result?.transactionOutcome) return null;

  const isLight = colors.mode === 'light';
  const outcome = result.transactionOutcome || {};
  const type = outcome.type || 'commit';
  const accent = type === 'rollback' ? '#fb7185' : type === 'savepoint' ? '#f59e0b' : colors.primary;
  const beforeData = Array.isArray(result.beforeData) ? result.beforeData : [];
  const afterData = Array.isArray(result.afterData) ? result.afterData : [];
  const { beforeMarkers, afterMarkers } = buildTransactionDiff(beforeData, afterData);
  const flowLabel = type === 'rollback'
    ? 'ROLLBACK aplicado'
    : type === 'savepoint'
      ? 'SAVEPOINT conservado'
      : 'COMMIT publicado';
  const flowDescription = type === 'rollback'
    ? 'El cambio pendiente se descartó y el estado confirmado se mantuvo.'
    : type === 'savepoint'
      ? 'Solo sobrevivió la parte anterior al savepoint; lo demás volvió atrás.'
      : 'La transacción hizo visibles sus cambios para el resto de sesiones.';

  return (
    <div
      className="p-5 space-y-5 border-b"
      style={{
        borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
        background: isLight
          ? 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,250,240,0.88))'
          : 'linear-gradient(180deg, rgba(15,23,42,0.82), rgba(8,15,32,0.82))'
      }}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] font-black mb-2" style={{ color: accent }}>
            Estado confirmado en la BD
          </p>
          <h3 className="font-display text-xl font-black" style={{ color: colors.text }}>
            {outcome.headline || 'Resultado transaccional'}
          </h3>
          <p className="mt-2 text-sm font-gameui max-w-2xl" style={{ color: colors.textMuted }}>
            {outcome.explanation || 'Así quedó la tabla afectada después del desenlace de la transacción.'}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            className="rounded-2xl border px-4 py-3 min-w-[130px]"
            style={{
              borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.06)',
              backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.68)'
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.24em] font-bold" style={{ color: colors.textMuted }}>Antes</p>
            <p className="mt-2 font-mono text-lg" style={{ color: colors.text }}>{outcome.beforeCount ?? beforeData.length}</p>
          </div>
          <div
            className="rounded-2xl border px-4 py-3 min-w-[130px]"
            style={{
              borderColor: isLight ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.06)',
              backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.68)'
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.24em] font-bold" style={{ color: colors.textMuted }}>Después</p>
            <p className="mt-2 font-mono text-lg" style={{ color: colors.text }}>{outcome.afterCount ?? afterData.length}</p>
          </div>
          <div
            className="rounded-2xl border px-4 py-3 min-w-[160px]"
            style={{
              borderColor: `${accent}33`,
              backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.68)'
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.24em] font-bold" style={{ color: colors.textMuted }}>Plantilla mental</p>
            <p className="mt-2 font-mono text-xs leading-relaxed" style={{ color: accent }}>{outcome.queryPattern}</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scaleX: 0.96 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.3, delay: 0.08 }}
        className="rounded-3xl border px-5 py-4 overflow-hidden relative"
        style={{
          borderColor: `${accent}33`,
          background: isLight
            ? `linear-gradient(90deg, ${accent}10, rgba(255,255,255,0.9), ${accent}14)`
            : `linear-gradient(90deg, rgba(15,23,42,0.92), ${accent}12, rgba(15,23,42,0.92))`
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black mb-1" style={{ color: accent }}>
              Flujo transaccional
            </p>
            <p className="font-display text-lg font-black" style={{ color: colors.text }}>
              {flowLabel}
            </p>
            <p className="mt-1 text-sm font-gameui" style={{ color: colors.textMuted }}>
              {flowDescription}
            </p>
          </div>
          <div className="flex items-center gap-3 min-w-[280px]">
            <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: isLight ? 'rgba(216,180,120,0.18)' : 'rgba(51,65,85,0.85)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${colors.primary}, ${accent}, ${colors.secondary})` }}
              />
            </div>
            <motion.div
              initial={{ x: -18, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.18em]"
              style={{ backgroundColor: `${accent}22`, color: accent }}
            >
              {type}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {result.targetTable && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <CompactSection
            title={`Estado previo de ${result.targetTable}`}
            subtitle="Así estaba la tabla antes de ejecutar"
            defaultOpen={false}
            colors={colors}
            countLabel={`${beforeData.length} filas`}
          >
            <div className="max-h-[20rem] overflow-auto scroll-fancy">
              <DataComparisonTable data={beforeData} colors={colors} rowMarkers={beforeMarkers} animateRows />
            </div>
          </CompactSection>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-2"
        >
          <CompactSection
            title="Estado final confirmado"
            subtitle="Lo que quedó persistido tras el desenlace"
            defaultOpen={true}
            colors={colors}
            accentColor={accent}
            countLabel={`${afterData.length} filas`}
          >
            <div
              className="max-h-[20rem] overflow-auto scroll-fancy rounded-xl"
              style={{ boxShadow: `0 0 24px ${accent}1a` }}
            >
              <DataComparisonTable data={afterData} colors={colors} highlight rowMarkers={afterMarkers} animateRows />
            </div>
          </CompactSection>
        </motion.div>
        </div>
      )}
    </div>
  );
};

export const ExercisePage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { user, token, updateUserXP } = useAuth();
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;

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
        const response = await fetch(apiUrl(`/api/exercises/${levelId}`), {
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
    console.log("Invocando Clawbot analyze con:", errorData);
    setClawbotThinking(true);
    try {
      const response = await fetch(apiUrl('/api/clawbot/analyze'), {
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

      const response = await fetch(apiUrl(`/api/exercises/${exercise.id}/validate`), {
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
          ...result,
          success: true,
          isWarning: true 
        });
        sounds.playMagic();
      } else {
        toast.error(result.message);
        // Limpiar intervención pedagógica si existe
        setIsDagonIntervening(false);
        setExecutionResult({ ...result, success: false, message: result.message });
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
            nivelId: parseInt(levelId),
            tituloEjercicio: exercise.title,
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
      const response = await fetch(apiUrl('/api/modulos/reset-sandbox'), {
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
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="px-2 sm:px-3 shrink-0" style={{ color: mutedColor }}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            <div className="hidden sm:block h-6 w-px" style={{ backgroundColor: isLight ? 'rgba(217,119,6,0.18)' : 'rgba(255,255,255,0.10)' }} />
            <Button 
              variant="ghost" 
              onClick={handleResetSandbox} 
              className="px-2 sm:px-3 shrink-0"
              title="🔄 Restablecer tabla: Borra todos tus cambios y vuelve a los datos originales del ejercicio. Útil si cometiste muchos errores o quieres empezar de nuevo."
              style={{ color: mutedColor }}
            >
              <RotateCcw className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Restablecer</span>
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
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border overflow-x-auto scrollbar-none bg-slate-900 border-slate-700 w-full lg:w-auto lg:max-w-[40%]">
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
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : '#0f172a', borderColor: isLight ? 'rgba(245,158,11,0.18)' : '#334155' }}>
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
          <div className={`max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-5 sm:space-y-6 ${shake ? 'animate-shake-x' : ''}`}>

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
