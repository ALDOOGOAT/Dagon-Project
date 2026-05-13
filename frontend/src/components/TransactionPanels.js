import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Database } from 'lucide-react';
import { buildRowSignature, buildTransactionDiff } from '../lib/exerciseHelpers';

export const DataComparisonTable = ({ data, colors, highlight = false, rowMarkers = [], animateRows = false }) => {
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

export const CompactSection = ({ title, subtitle, defaultOpen = true, colors, accentColor, children, countLabel = null }) => {
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

export const TransactionPedagogyCard = ({ pedagogia, colors }) => {
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

export const TransactionSimulationPanel = ({ simulation, colors }) => {
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

export const TransactionOutcomePanel = ({ result, colors }) => {
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

