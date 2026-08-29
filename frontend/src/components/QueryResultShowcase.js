import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Database,
  FileText,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  XCircle,
} from 'lucide-react';
import { buildRowSignature, buildTransactionDiff } from '../lib/exerciseHelpers';
import {
  CompactSection,
  DataComparisonTable,
  TransactionOutcomePanel,
  TransactionSimulationPanel,
} from './TransactionPanels';

const asRows = (value) => (Array.isArray(value) ? value.filter((row) => row && typeof row === 'object') : []);

const plural = (count, singular, pluralLabel) => `${count} ${count === 1 ? singular : pluralLabel}`;

const truncateText = (value, max = 1200) => {
  if (!value) return '';
  const text = String(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const getColumnCount = (rows) => (rows.length > 0 ? Object.keys(rows[0]).length : 0);

const countBySignature = (rows) => {
  const counts = new Map();
  rows.forEach((row) => {
    const signature = buildRowSignature(row);
    counts.set(signature, (counts.get(signature) || 0) + 1);
  });
  return counts;
};

const getChangedCount = (fromCounts, toCounts) => {
  let total = 0;
  fromCounts.forEach((count, signature) => {
    const other = toCounts.get(signature) || 0;
    if (count > other) total += count - other;
  });
  return total;
};

const buildChangeSummary = (beforeRows, afterRows) => {
  const beforeCounts = countBySignature(beforeRows);
  const afterCounts = countBySignature(afterRows);
  const removed = getChangedCount(beforeCounts, afterCounts);
  const added = getChangedCount(afterCounts, beforeCounts);
  const transformed = Math.min(removed, added);

  return {
    added,
    removed,
    transformed,
    netAdded: Math.max(0, afterRows.length - beforeRows.length),
    netRemoved: Math.max(0, beforeRows.length - afterRows.length),
    beforeCount: beforeRows.length,
    afterCount: afterRows.length,
  };
};

const inferCommand = (result, diff) => {
  const sql = String(result?.queryAlumno || result?.query || result?.studentQuery || '').trim().toUpperCase();

  if (/\bROLLBACK\b|\bCOMMIT\b|\bSAVEPOINT\b|\bBEGIN\b/.test(sql) || result?.isTransactionVisual || result?.transactionOutcome) {
    return 'TRANSACCION';
  }
  if (/\bINSERT\b/.test(sql)) return 'INSERT';
  if (/\bUPDATE\b/.test(sql)) return 'UPDATE';
  if (/\bDELETE\b/.test(sql)) return 'DELETE';
  if (/\bCREATE\b|\bALTER\b|\bDROP\b/.test(sql) || result?.isStructure) return 'DDL';
  if (result?.isDML) {
    if (diff.netAdded > 0) return 'INSERT';
    if (diff.netRemoved > 0) return 'DELETE';
    if (diff.added > 0 || diff.removed > 0) return 'UPDATE';
    return 'DML';
  }
  if (result?.diagramSummary) return 'DIAGRAMA';
  if (result?.constraintsData?.length > 0) return 'DDL';
  if (result?.mockData?.length > 0) return 'SELECT';
  return result?.success === false ? 'ERROR' : 'RESULTADO';
};

const getCommandVisual = (command, result, diff, resultRows, constraintRows) => {
  const common = {
    eyebrow: 'Lectura pedagogica',
    icon: Database,
    accent: '#22d3ee',
    headline: 'Resultado de ejecucion',
    summary: 'Observa la evidencia que genero tu consulta y conectala con la meta del ejercicio.',
  };

  if (result?.success === false) {
    return {
      ...common,
      eyebrow: 'Diagnostico de ejecucion',
      icon: XCircle,
      accent: '#fb7185',
      headline: 'La consulta todavia no cumple el objetivo',
      summary: 'Usa el mensaje de error como pista: ubica si fallo la tabla, una columna, la condicion o la forma del comando.',
    };
  }

  if (command === 'DIAGRAMA') {
    return {
      ...common,
      eyebrow: 'Lectura del modelo',
      icon: Database,
      accent: '#a78bfa',
      headline: 'Dagon leyo tu diagrama entidad-relacion',
      summary: 'Cada entidad, su clave primaria y sus relaciones se comparan con lo que pide el enunciado.',
    };
  }

  if (result?.isWarning) {
    return {
      ...common,
      eyebrow: 'Ejecucion con advertencia',
      icon: AlertTriangle,
      accent: '#f59e0b',
      headline: 'La consulta produjo evidencia, pero hay un riesgo que revisar',
      summary: 'Antes de avanzar, compara el resultado con el enunciado y confirma que no hayas afectado filas extra.',
    };
  }

  switch (command) {
    case 'INSERT':
      return {
        ...common,
        icon: Plus,
        accent: '#10b981',
        headline: diff.netAdded > 0 ? `Insertaste ${plural(diff.netAdded, 'fila', 'filas')}` : 'INSERT ejecutado',
        summary: 'La vista compara el estado previo contra el estado final para que distingas que registro nacio con tu consulta.',
      };
    case 'UPDATE':
      return {
        ...common,
        icon: Pencil,
        accent: '#38bdf8',
        headline: diff.transformed > 0 ? `Transformaste ${plural(diff.transformed, 'fila', 'filas')}` : 'UPDATE ejecutado',
        summary: 'El cambio se entiende mejor comparando los valores anteriores contra los valores que quedaron persistidos.',
      };
    case 'DELETE':
      return {
        ...common,
        icon: Trash2,
        accent: '#fb7185',
        headline: diff.netRemoved > 0 ? `Eliminaste ${plural(diff.netRemoved, 'fila', 'filas')}` : 'DELETE ejecutado',
        summary: 'El estado anterior muestra que existia; el estado final confirma que ya no forma parte de la tabla.',
      };
    case 'DDL':
      return {
        ...common,
        icon: Shield,
        accent: '#a78bfa',
        headline: constraintRows.length > 0 ? `La estructura quedo protegida por ${plural(constraintRows.length, 'regla', 'reglas')}` : 'Estructura de tabla validada',
        summary: 'Aqui se ven columnas, tipos y restricciones: son las reglas que la base de datos usara para cuidar los datos.',
      };
    case 'TRANSACCION':
      return {
        ...common,
        icon: ListChecks,
        accent: result?.transactionOutcome?.type === 'rollback' ? '#fb7185' : '#10b981',
        headline: result?.transactionOutcome?.headline || 'Transaccion interpretada paso a paso',
        summary: result?.transactionOutcome?.explanation || 'La ejecucion se lee como una historia: cambios pendientes, confirmacion, rollback o savepoint.',
      };
    case 'SELECT':
      return {
        ...common,
        icon: Search,
        accent: '#22d3ee',
        headline: resultRows.length > 0 ? `Tu consulta devolvio ${plural(resultRows.length, 'fila', 'filas')}` : 'Consulta ejecutada sin filas visibles',
        summary: resultRows.length > 0
          ? 'Cada fila representa un dato que cumplio la condicion de tu SELECT. Revisa columnas y valores para confirmar el razonamiento.'
          : 'Que no haya filas tambien es informacion: significa que ninguna fila cumplio la condicion pedida.',
      };
    default:
      return common;
  }
};

const getMarkerLabels = (command) => {
  if (command === 'DELETE') return { removed: 'Eliminado', added: 'Nuevo' };
  if (command === 'UPDATE') return { removed: 'Antes', added: 'Despues' };
  if (command === 'INSERT') return { removed: 'Antes', added: 'Nuevo' };
  return { removed: 'Cambio', added: 'Nuevo' };
};

const MetricCard = ({ label, value, hint, colors, accent }) => {
  const isLight = colors.mode === 'light';
  return (
    <div
      className="rounded-2xl border px-4 py-3 min-w-0"
      style={{
        borderColor: `${accent}26`,
        backgroundColor: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.68)',
      }}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] font-black" style={{ color: colors.textMuted }}>
        {label}
      </p>
      <p className="mt-2 font-display text-lg font-black truncate" style={{ color: colors.text }}>
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] font-gameui leading-relaxed" style={{ color: colors.textMuted }}>
          {hint}
        </p>
      )}
    </div>
  );
};

const EvidenceStep = ({ index, title, detail, colors, accent }) => {
  const isLight = colors.mode === 'light';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.05 }}
      className="rounded-2xl border px-4 py-3"
      style={{
        borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
        backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(8,15,32,0.58)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black"
          style={{ color: accent, backgroundColor: `${accent}18` }}
        >
          {index + 1}
        </span>
        <p className="text-[10px] uppercase tracking-[0.22em] font-black" style={{ color: accent }}>
          {title}
        </p>
      </div>
      <p className="text-sm font-gameui leading-relaxed" style={{ color: colors.textMuted }}>
        {detail}
      </p>
    </motion.div>
  );
};

const ResultRowsPanel = ({ rows, result, colors, visual }) => {
  if (!rows.length) return null;

  return (
    <div className="p-5 space-y-3 border-t" style={{ borderColor: colors.mode === 'light' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)' }}>
      <CompactSection
        title={result?.isStructure ? 'Estructura encontrada' : 'Tabla de resultados'}
        subtitle={result?.isStructure ? 'Columnas y metadatos que devolvio PostgreSQL' : 'Filas que produjo tu consulta'}
        colors={colors}
        accentColor={visual.accent}
        countLabel={`${rows.length} filas`}
      >
        <div className="max-h-[24rem] overflow-auto scroll-fancy rounded-xl" style={{ boxShadow: `0 0 24px ${visual.accent}14` }}>
          <DataComparisonTable data={rows} colors={colors} highlight animateRows />
        </div>
      </CompactSection>
    </div>
  );
};

const DataChangePanel = ({ result, beforeRows, afterRows, command, colors, visual }) => {
  if (!result?.isDML || (!beforeRows.length && !afterRows.length)) return null;
  if (result?.isTransactionVisual || result?.transactionOutcome) return null;

  const { beforeMarkers, afterMarkers } = buildTransactionDiff(beforeRows, afterRows);
  const markerLabels = getMarkerLabels(command);

  return (
    <div className="p-5 space-y-5 border-t" style={{ borderColor: colors.mode === 'light' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)' }}>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}>
          <CompactSection
            title={`Estado anterior${result.targetTable ? ` de ${result.targetTable}` : ''}`}
            subtitle="Foto de la tabla antes de ejecutar tu SQL"
            defaultOpen={true}
            colors={colors}
            countLabel={`${beforeRows.length} filas`}
          >
            <div className="max-h-[23rem] overflow-auto scroll-fancy rounded-xl">
              <DataComparisonTable
                data={beforeRows}
                colors={colors}
                rowMarkers={beforeMarkers}
                markerLabels={markerLabels}
                animateRows
              />
            </div>
          </CompactSection>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
          <CompactSection
            title="Estado final"
            subtitle="Lo que quedo despues de la ejecucion"
            defaultOpen={true}
            colors={colors}
            accentColor={visual.accent}
            countLabel={`${afterRows.length} filas`}
          >
            <div className="max-h-[23rem] overflow-auto scroll-fancy rounded-xl" style={{ boxShadow: `0 0 24px ${visual.accent}18` }}>
              <DataComparisonTable
                data={afterRows}
                colors={colors}
                highlight
                rowMarkers={afterMarkers}
                markerLabels={markerLabels}
                animateRows
              />
            </div>
          </CompactSection>
        </motion.div>
      </div>
      <p className="text-center text-[11px] font-gameui" style={{ color: colors.textMuted }}>
        Las etiquetas resaltan filas nuevas, eliminadas o transformadas para que puedas explicar el efecto real de tu consulta.
      </p>
    </div>
  );
};

const DiagramPanel = ({ summary, issues, colors, visual }) => {
  if (!summary) return null;
  const isLight = colors.mode === 'light';
  const nombres = Array.isArray(summary.nombres) ? summary.nombres.filter(Boolean) : [];
  const pendientes = Array.isArray(issues) ? issues : [];

  return (
    <div className="p-5 pt-0">
      <CompactSection
        title={pendientes.length > 0 ? 'Lo que le falta a tu modelo' : 'Tu modelo entidad-relacion'}
        subtitle={pendientes.length > 0
          ? 'Corrigelos todos y vuelve a ejecutar: estan ordenados de lo estructural a lo concreto'
          : 'Entidades, relaciones y claves que Dagon leyo del lienzo'}
        colors={colors}
        accentColor={visual.accent}
        countLabel={pendientes.length > 0 ? plural(pendientes.length, 'ajuste', 'ajustes') : 'modelo valido'}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Entidades', value: summary.entidades ?? 0 },
            { label: 'Relaciones', value: summary.relaciones ?? 0 },
            { label: 'Atributos', value: summary.atributos ?? 0 },
            { label: 'Claves primarias', value: summary.clavesPrimarias ?? 0 },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border px-3 py-2"
              style={{
                borderColor: `${visual.accent}24`,
                backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.62)',
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: colors.textMuted }}>
                {metric.label}
              </p>
              <p className="text-xl font-display font-black" style={{ color: colors.text }}>{metric.value}</p>
            </div>
          ))}
        </div>

        {nombres.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {nombres.map((nombre, index) => (
              <span
                key={`${nombre}-${index}`}
                className="px-2.5 py-1 rounded-lg border text-[11px] font-mono"
                style={{
                  borderColor: nombre ? `${visual.accent}30` : 'rgba(244,63,94,0.4)',
                  color: nombre ? colors.text : '#fb7185',
                  backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(2,6,23,0.5)',
                }}
              >
                {nombre || 'sin nombre'}
              </span>
            ))}
          </div>
        )}

        {pendientes.length > 0 ? (
          <ul className="space-y-2">
            {pendientes.map((issue, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-2 rounded-xl border px-3 py-2"
                style={{
                  borderColor: 'rgba(244,63,94,0.24)',
                  backgroundColor: isLight ? 'rgba(255,241,242,0.7)' : 'rgba(76,5,25,0.28)',
                }}
              >
                <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="text-sm font-gameui leading-relaxed" style={{ color: colors.text }}>
                  {issue}
                </span>
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border px-3 py-2"
            style={{ borderColor: `${visual.accent}30`, backgroundColor: isLight ? 'rgba(236,253,245,0.7)' : 'rgba(6,78,59,0.22)' }}>
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: visual.accent }} />
            <span className="text-sm font-gameui leading-relaxed" style={{ color: colors.text }}>
              El modelo cumple todas las reglas del ejercicio.
            </span>
          </div>
        )}
      </CompactSection>
    </div>
  );
};

const ConstraintsPanel = ({ constraints, colors, visual }) => {
  if (!constraints.length) return null;
  const isLight = colors.mode === 'light';

  return (
    <div className="p-5 pt-0">
      <CompactSection
        title="Reglas activas"
        subtitle="Constraints que PostgreSQL aplica sobre la estructura"
        colors={colors}
        accentColor={visual.accent}
        countLabel={`${constraints.length} reglas`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {constraints.map((rule, index) => {
            const type = rule.tipo || rule.constraint_type || rule.tipo_regla || 'CONSTRAINT';
            const name = rule.nombre_regla || rule.constraint_name || rule.nombre || `regla_${index + 1}`;
            const definition = rule.definicion || rule.definition || rule.check_clause || rule.columnas || '';

            return (
              <motion.div
                key={`${name}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: `${visual.accent}26`,
                  backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(8,15,32,0.58)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ color: visual.accent, backgroundColor: `${visual.accent}18` }}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] font-black" style={{ color: visual.accent }}>
                      {type}
                    </p>
                    <p className="mt-1 font-mono text-sm break-words" style={{ color: colors.text }}>
                      {name}
                    </p>
                    {definition && (
                      <p className="mt-2 text-xs font-mono leading-relaxed break-words" style={{ color: colors.textMuted }}>
                        {String(definition)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CompactSection>
    </div>
  );
};

const ErrorEvidencePanel = ({ result, colors }) => {
  const message = truncateText(result?.errorDb || result?.error || '');
  if (!message) return null;

  return (
    <div className="p-5 border-t" style={{ borderColor: colors.mode === 'light' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)' }}>
      <CompactSection
        title="Respuesta tecnica"
        subtitle="Mensaje que ayuda a ubicar el punto exacto del fallo"
        colors={colors}
        accentColor="#fb7185"
      >
        <pre
          className="overflow-x-auto whitespace-pre-wrap rounded-xl border p-4 text-xs font-mono leading-relaxed"
          style={{
            borderColor: 'rgba(251,113,133,0.24)',
            backgroundColor: colors.mode === 'light' ? 'rgba(255,241,242,0.72)' : 'rgba(127,29,29,0.18)',
            color: colors.mode === 'light' ? '#9f1239' : '#fecdd3',
          }}
        >
          {message}
        </pre>
      </CompactSection>
    </div>
  );
};

export const QueryResultShowcase = ({ result, exercise, colors }) => {
  const beforeRows = useMemo(() => asRows(result?.beforeData), [result?.beforeData]);
  const afterRows = useMemo(() => asRows(result?.afterData), [result?.afterData]);
  const resultRows = useMemo(() => asRows(result?.mockData), [result?.mockData]);
  const constraintRows = useMemo(() => asRows(result?.constraintsData), [result?.constraintsData]);
  const diff = useMemo(() => buildChangeSummary(beforeRows, afterRows), [beforeRows, afterRows]);
  const command = useMemo(() => inferCommand(result, diff), [result, diff]);
  const visual = useMemo(() => getCommandVisual(command, result, diff, resultRows, constraintRows), [command, result, diff, resultRows, constraintRows]);
  const hasChangePanel = result?.isDML && !result?.transactionOutcome && !result?.isTransactionVisual && (beforeRows.length > 0 || afterRows.length > 0);
  const hasResultRows = resultRows.length > 0 && !hasChangePanel;
  const Icon = visual.icon || Database;
  const isLight = colors.mode === 'light';
  const tableName = result?.targetTable || exercise?.tablaObjetivo || exercise?.targetTable || 'No indicada';
  const metricRows = hasChangePanel ? afterRows : resultRows;

  const diagramSummary = result?.diagramSummary;

  const metrics = diagramSummary
    ? [
        { label: 'Entidades', value: diagramSummary.entidades ?? 0, hint: 'Tablas del modelo' },
        { label: 'Relaciones', value: diagramSummary.relaciones ?? 0, hint: 'Conexiones dibujadas' },
        { label: 'Atributos', value: diagramSummary.atributos ?? 0, hint: 'Columnas con nombre' },
        { label: 'Claves', value: diagramSummary.clavesPrimarias ?? 0, hint: 'Entidades con PK' },
      ]
    : hasChangePanel
    ? [
        { label: 'Operacion', value: command, hint: 'Comando detectado' },
        { label: 'Tabla', value: tableName, hint: 'Objeto afectado' },
        { label: 'Antes', value: diff.beforeCount, hint: 'Filas observadas' },
        { label: 'Despues', value: diff.afterCount, hint: 'Estado final' },
      ]
    : [
        { label: 'Operacion', value: command, hint: result?.isStructure ? 'Estructura' : 'Consulta' },
        { label: 'Filas', value: metricRows.length, hint: 'Evidencia visible' },
        { label: 'Columnas', value: getColumnCount(metricRows), hint: 'Campos devueltos' },
        { label: 'Reglas', value: constraintRows.length, hint: 'Constraints' },
      ];

  const evidenceSteps = diagramSummary
    ? [
        { title: 'Modelo', detail: `Dibujaste ${plural(diagramSummary.entidades ?? 0, 'entidad', 'entidades')} y ${plural(diagramSummary.relaciones ?? 0, 'relacion', 'relaciones')}.` },
        { title: 'Identidad', detail: `${diagramSummary.clavesPrimarias ?? 0} de ${diagramSummary.entidades ?? 0} entidades declaran clave primaria.` },
        { title: 'Detalle', detail: `El modelo tiene ${plural(diagramSummary.atributos ?? 0, 'atributo con nombre', 'atributos con nombre')}.` },
      ]
    : hasChangePanel
    ? [
        { title: 'Intencion', detail: `${command} apunta a ${tableName}.` },
        { title: 'Comparacion', detail: `La tabla paso de ${diff.beforeCount} a ${diff.afterCount} filas visibles.` },
        { title: 'Impacto', detail: diff.added || diff.removed ? `${diff.added} apariciones nuevas y ${diff.removed} apariciones que ya no coinciden.` : 'No se detectaron diferencias visibles en la muestra.' },
      ]
    : [
        { title: 'Intencion', detail: `${command} responde al objetivo de esta mision.` },
        { title: 'Evidencia', detail: resultRows.length > 0 ? `Se muestran ${resultRows.length} filas para revisar valores reales.` : 'No hay filas visibles en esta respuesta.' },
        { title: 'Reglas', detail: constraintRows.length > 0 ? `Hay ${constraintRows.length} constraints activas en la estructura.` : 'No se recibieron constraints adicionales para este resultado.' },
      ];

  return (
    <div>
      <div
        className="p-5 md:p-6 border-b overflow-hidden relative"
        style={{
          borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
          background: isLight
            ? `linear-gradient(135deg, rgba(255,255,255,0.92), ${visual.accent}12)`
            : `linear-gradient(135deg, rgba(8,15,32,0.92), ${visual.accent}10)`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${visual.accent}, transparent)` }}
        />
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] gap-5">
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.26em]"
              style={{
                color: visual.accent,
                borderColor: `${visual.accent}30`,
                backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.64)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {visual.eyebrow}
            </div>
            <h3 className="mt-4 font-display text-2xl md:text-3xl font-black leading-tight" style={{ color: colors.text }}>
              {visual.headline}
            </h3>
            <p className="mt-3 text-sm md:text-base font-gameui leading-relaxed max-w-3xl" style={{ color: colors.textMuted }}>
              {visual.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                hint={metric.hint}
                colors={colors}
                accent={visual.accent}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-3">
          {evidenceSteps.map((step, index) => (
            <EvidenceStep
              key={step.title}
              index={index}
              title={step.title}
              detail={step.detail}
              colors={colors}
              accent={visual.accent}
            />
          ))}
        </div>
      </div>

      {result?.transactionSimulation && (
        <TransactionSimulationPanel simulation={result.transactionSimulation} colors={colors} />
      )}

      {(result?.isTransactionVisual || result?.transactionOutcome) && (
        <TransactionOutcomePanel result={result} colors={colors} />
      )}

      <DataChangePanel
        result={result}
        beforeRows={beforeRows}
        afterRows={afterRows}
        command={command}
        colors={colors}
        visual={visual}
      />

      <ResultRowsPanel rows={resultRows} result={result} colors={colors} visual={visual} />

      {!hasChangePanel && !hasResultRows && !result?.diagramSummary && result?.success !== false && (
        <div className="p-5 border-t" style={{ borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)' }}>
          <div
            className="rounded-2xl border px-4 py-5 flex items-start gap-3"
            style={{
              borderColor: `${visual.accent}24`,
              backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : 'rgba(15,23,42,0.62)',
            }}
          >
            <FileText className="w-5 h-5 shrink-0 mt-0.5" style={{ color: visual.accent }} />
            <div>
              <p className="font-display font-black" style={{ color: colors.text }}>
                Ejecucion sin tabla visible
              </p>
              <p className="mt-1 text-sm font-gameui leading-relaxed" style={{ color: colors.textMuted }}>
                El comando fue procesado, pero esta respuesta no trajo filas para representar. Revisa el mensaje principal y la meta del ejercicio.
              </p>
            </div>
          </div>
        </div>
      )}

      <DiagramPanel
        summary={result?.diagramSummary}
        issues={result?.diagramIssues}
        colors={colors}
        visual={visual}
      />

      <ConstraintsPanel constraints={constraintRows} colors={colors} visual={visual} />

      <ErrorEvidencePanel result={result} colors={colors} />

      {(hasChangePanel || hasResultRows || constraintRows.length > 0) && (
        <div
          className="px-5 py-4 border-t flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
          style={{
            borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
            backgroundColor: isLight ? 'rgba(255,255,255,0.64)' : 'rgba(2,6,23,0.34)',
          }}
        >
          <div className="flex items-center gap-2">
            {result?.success === false ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle className="w-4 h-4" style={{ color: visual.accent }} />
            )}
            <p className="text-xs font-gameui" style={{ color: colors.textMuted }}>
              Lee el resultado como evidencia: comando, objeto afectado, estado previo y estado final.
            </p>
          </div>
          <ArrowRight className="hidden sm:block w-4 h-4" style={{ color: colors.textMuted }} />
        </div>
      )}
    </div>
  );
};
