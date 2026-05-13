import React from 'react';

export const SQL_LEARNING_PATTERNS = [
  {
    pattern: /(JOIN|FOREIGN KEY|CLAVE FORANEA|RELACION)/,
    concept: 'Relaciones entre tablas',
    objective: 'Identifica que tabla aporta cada dato y conecta las filas con una condicion ON.',
    correction: 'Revisa primero FROM, luego JOIN y al final la condicion que une las claves.'
  },
  {
    pattern: /(WHERE|FILT|CONDICI|LIKE|BETWEEN| IN | IS NULL)/,
    concept: 'Filtros',
    objective: 'Reduce la tabla a las filas que cumplen una condicion concreta.',
    correction: 'Asegura que el campo filtrado exista y que el operador exprese exactamente la condicion.'
  },
  {
    pattern: /(GROUP BY|COUNT|SUM|AVG|MAX|MIN|HAVING|AGRUP)/,
    concept: 'Agrupaciones',
    objective: 'Convierte muchas filas en una respuesta resumida usando grupos y funciones.',
    correction: 'Comprueba que toda columna no agregada aparezca en GROUP BY.'
  },
  {
    pattern: /(INSERT|UPDATE|DELETE|RETURNING|DML|MODIFIC)/,
    concept: 'Cambios de datos',
    objective: 'Modifica informacion con una condicion segura y valida el resultado.',
    correction: 'Antes de cambiar datos, piensa que filas se verian afectadas y usa WHERE cuando aplique.'
  },
  {
    pattern: /(CREATE TABLE|ALTER TABLE|PRIMARY KEY|UNIQUE|CHECK|CONSTRAINT|DDL|MODELO)/,
    concept: 'Modelado de datos',
    objective: 'Define reglas para que la base de datos proteja la informacion.',
    correction: 'Revisa nombres, tipos de dato y restricciones antes de ejecutar.'
  },
  {
    pattern: /(SELECT|FROM|COLUMNA|CONSULTA)/,
    concept: 'Consulta basica',
    objective: 'Pide columnas especificas desde una tabla y observa el resultado.',
    correction: 'Empieza por SELECT, confirma la tabla en FROM y despues agrega detalle.'
  }
];

export const formatAIMessage = (text, theme = {}) => {
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

export const buildRowSignature = (row = {}) => {
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

export const buildTransactionDiff = (beforeData = [], afterData = []) => {
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

export const isTransactionExercise = (exercise, levelId) => {
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

export const inferLearningFocus = (exercise = {}, levelId = '') => {
  const combined = [
    exercise.title,
    exercise.description,
    exercise.hint,
    exercise.starterCode,
    levelId
  ].filter(Boolean).join(' ').toUpperCase();

  return SQL_LEARNING_PATTERNS.find((item) => item.pattern.test(combined)) || SQL_LEARNING_PATTERNS[SQL_LEARNING_PATTERNS.length - 1];
};

export const buildLocalClawbotFallback = (errorData = {}, exercise = {}) => {
  const focus = inferLearningFocus(exercise, errorData.nivelId);
  const attempt = Number(errorData.intentos || 1);
  const hint = exercise.hint || errorData.errorDb || 'Lee el enunciado y separa el problema en SELECT, FROM y condicion.';
  const scaffold = attempt >= 2
    ? 'AYUDA: Escribe primero la estructura minima y deja espacios mentales: SELECT columnas FROM tabla WHERE condicion.'
    : 'AYUDA: No busques memorizar la respuesta; identifica que parte del enunciado corresponde a cada palabra SQL.';

  return [
    `CONCEPTO: ${focus.concept}. ${focus.objective}`,
    `PISTA: ${hint}`,
    scaffold,
    `AYUDA: ${focus.correction}`
  ].join('\n');
};

export const buildLearningFeedback = (result, focus, attempts) => {
  if (!result) return null;
  if (result.isWarning) {
    return {
      tone: 'warning',
      title: 'Funcionó, pero conviene revisar el riesgo',
      message: 'La consulta produjo una respuesta aceptable, aunque hay una advertencia que debes entender antes de avanzar.',
      next: focus.correction
    };
  }
  if (result.success) {
    return {
      tone: 'success',
      title: `Concepto reforzado: ${focus.concept}`,
      message: result.xp_gained > 0
        ? `Ganaste ${result.xp_gained} XP porque tu consulta resolvio el objetivo esperado.`
        : 'La consulta cumple el objetivo; observa el resultado para entender por que funciona.',
      next: 'Avanza solo cuando puedas explicar con tus palabras que hizo cada parte de la consulta.'
    };
  }
  return {
    tone: 'error',
    title: `Ajusta el concepto: ${focus.concept}`,
    message: attempts >= 2
      ? 'Ya hay patron de error. Usa la pista, corrige una parte a la vez y vuelve a ejecutar.'
      : 'El fallo es parte del entrenamiento. Primero ubica si el problema esta en columnas, tabla, filtro o relacion.',
    next: focus.correction
  };
};

