const STORAGE_PREFIX = 'dagon_learning_progress_v1';

export const LEARNING_CONCEPTS = {
  select: {
    label: 'SELECT',
    badge: 'Cartografo del SELECT',
    description: 'Lee columnas y tablas con claridad.',
    scaffold: 'SELECT columnas\nFROM tabla;',
  },
  filtros: {
    label: 'Filtros',
    badge: 'Rastreador de Filtros',
    description: 'Usa WHERE, LIKE, BETWEEN, IN e IS NULL para reducir resultados.',
    scaffold: 'SELECT columnas\nFROM tabla\nWHERE condicion;',
  },
  agregaciones: {
    label: 'Agregaciones',
    badge: 'Alquimista de Resumenes',
    description: 'Resume filas con COUNT, SUM, AVG, GROUP BY y HAVING.',
    scaffold: 'SELECT grupo, COUNT(*)\nFROM tabla\nGROUP BY grupo;',
  },
  join: {
    label: 'JOIN',
    badge: 'Vinculador de Tablas',
    description: 'Conecta tablas con claves y condiciones ON.',
    scaffold: 'SELECT a.columna, b.columna\nFROM tabla_a a\nJOIN tabla_b b ON a.id = b.id_a;',
  },
  dml: {
    label: 'DML',
    badge: 'Custodio de Cambios',
    description: 'Modifica datos con INSERT, UPDATE, DELETE y verificacion.',
    scaffold: 'UPDATE tabla\nSET columna = valor\nWHERE condicion\nRETURNING *;',
  },
  ddl: {
    label: 'DDL',
    badge: 'Arquitecto de Esquemas',
    description: 'Crea estructuras y reglas con CREATE, ALTER y constraints.',
    scaffold: 'CREATE TABLE nombre (\n  id SERIAL PRIMARY KEY,\n  campo TEXT NOT NULL\n);',
  },
  transacciones: {
    label: 'Transacciones',
    badge: 'Guardian del COMMIT',
    description: 'Controla cambios con BEGIN, COMMIT, ROLLBACK, SAVEPOINT y bloqueos.',
    scaffold: 'BEGIN;\n-- cambio controlado\nCOMMIT;',
  },
};

const MODULE_CONCEPTS = {
  1: 'select',
  2: 'dml',
  3: 'join',
  4: 'join',
  5: 'ddl',
  6: 'ddl',
  7: 'ddl',
  8: 'filtros',
  9: 'ddl',
  10: 'ddl',
  11: 'filtros',
  12: 'ddl',
  13: 'ddl',
  14: 'ddl',
  15: 'transacciones',
  16: 'transacciones',
  17: 'select',
  18: 'ddl',
  19: 'ddl',
  20: 'agregaciones',
};

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const storageKey = (userId = 'local') => `${STORAGE_PREFIX}_${userId}`;

export const inferConceptKey = (exercise = {}, levelId = '') => {
  const combined = [
    exercise.title,
    exercise.description,
    exercise.hint,
    exercise.starterCode,
    exercise.query,
  ].filter(Boolean).join(' ').toUpperCase();

  if (/(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|FOR UPDATE|NOWAIT|TRANSAC)/.test(combined) || MODULE_CONCEPTS[Number(levelId)] === 'transacciones') return 'transacciones';
  if (/(CREATE|ALTER|DROP|PRIMARY KEY|UNIQUE|CHECK|CONSTRAINT|SERIAL|VIEW|TRIGGER|FUNCTION|GRANT|REVOKE)/.test(combined) || MODULE_CONCEPTS[Number(levelId)] === 'ddl') return 'ddl';
  if (/(INSERT|UPDATE|DELETE|RETURNING)/.test(combined) || MODULE_CONCEPTS[Number(levelId)] === 'dml') return 'dml';
  if (/(JOIN|FOREIGN KEY|CLAVE|RELACION|ON )/.test(combined) || MODULE_CONCEPTS[Number(levelId)] === 'join') return 'join';
  if (/(GROUP BY|COUNT|SUM|AVG|MAX|MIN|HAVING|AGREG)/.test(combined) || MODULE_CONCEPTS[Number(levelId)] === 'agregaciones') return 'agregaciones';
  if (/(WHERE|LIKE|BETWEEN| IN |IS NULL|ORDER BY|DISTINCT|FILTRO)/.test(combined) || MODULE_CONCEPTS[Number(levelId)] === 'filtros') return 'filtros';
  return MODULE_CONCEPTS[Number(levelId)] || 'select';
};

export const getLearningProgress = (userId = 'local') => {
  const base = {
    concepts: {},
    modules: {},
    badges: {},
    daily: {},
    reinforcementQueue: [],
  };

  return {
    ...base,
    ...safeParse(localStorage.getItem(storageKey(userId)), base),
  };
};

export const saveLearningProgress = (userId = 'local', progress) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(progress));
  return progress;
};

export const conceptMastery = (concept = {}) => {
  const attempts = concept.attempts || 0;
  if (attempts === 0) return 0;
  const accuracy = (concept.successes || 0) / attempts;
  const persistence = Math.min(1, (concept.successes || 0) / 3);
  return Math.round(((accuracy * 0.7) + (persistence * 0.3)) * 100);
};

export const buildProgressiveHint = ({ exercise = {}, focus = {}, attempts = 1, conceptKey = 'select', repeatedErrors = 0 }) => {
  const concept = LEARNING_CONCEPTS[conceptKey] || LEARNING_CONCEPTS.select;
  const baseHint = exercise.hint || focus.correction || 'Separa el problema en partes antes de ejecutar.';

  if (attempts <= 1) {
    return {
      level: 1,
      title: 'Pista de orientación',
      message: baseHint,
      action: `Primero identifica que parte pertenece a ${concept.label}.`,
    };
  }

  if (attempts === 2) {
    return {
      level: 2,
      title: 'Pista de estructura',
      message: `Usa esta forma mental para ${concept.label}:`,
      action: concept.scaffold,
    };
  }

  return {
    level: 3,
    title: repeatedErrors >= 2 ? 'Refuerzo recomendado' : 'Pista de rescate',
    message: `El error ya se repitio. No sigas probando al azar: reduce el problema a una consulta minima y vuelve a crecerla.`,
    action: concept.scaffold,
  };
};

export const recordLearningAttempt = ({ userId = 'local', moduleId, exercise = {}, success, attempts = 1, focus = {} }) => {
  const progress = getLearningProgress(userId);
  const today = new Date().toISOString().slice(0, 10);
  const conceptKey = inferConceptKey(exercise, moduleId);
  const concept = progress.concepts[conceptKey] || {
    attempts: 0,
    successes: 0,
    failures: 0,
    repeatedErrors: 0,
    masteredExercises: {},
  };
  const moduleKey = String(moduleId);
  const module = progress.modules[moduleKey] || {
    attempts: 0,
    successes: 0,
    failures: 0,
    concepts: {},
    recommendations: [],
  };

  concept.attempts += 1;
  module.attempts += 1;
  module.concepts[conceptKey] = true;
  concept.lastPracticedAt = today;
  module.lastPracticedAt = today;

  if (success) {
    concept.successes += 1;
    concept.repeatedErrors = 0;
    module.successes += 1;
    if (exercise.id != null) concept.masteredExercises[String(exercise.id)] = true;
  } else {
    concept.failures += 1;
    concept.repeatedErrors += 1;
    module.failures += 1;
    const conceptLabel = LEARNING_CONCEPTS[conceptKey]?.label || focus.concept || 'SQL';
    module.recommendations = [
      `Refuerza ${conceptLabel}: ${focus.correction || LEARNING_CONCEPTS[conceptKey]?.description || 'revisa la estructura antes de ejecutar.'}`,
      ...module.recommendations.filter((item) => !item.includes(conceptLabel)),
    ].slice(0, 4);
  }

  progress.concepts[conceptKey] = concept;
  progress.modules[moduleKey] = module;
  progress.daily[today] = {
    attempts: (progress.daily[today]?.attempts || 0) + 1,
    successes: (progress.daily[today]?.successes || 0) + (success ? 1 : 0),
  };

  const unlockedBadges = [];
  Object.entries(LEARNING_CONCEPTS).forEach(([key, definition]) => {
    const item = progress.concepts[key];
    if (!item) return;
    const unlocked = conceptMastery(item) >= 70 && Object.keys(item.masteredExercises || {}).length >= 2;
    if (unlocked && !progress.badges[key]) {
      progress.badges[key] = { title: definition.badge, unlockedAt: today };
      unlockedBadges.push({ key, ...definition });
    }
  });

  if (!success && concept.repeatedErrors >= 2) {
    progress.reinforcementQueue = [
      {
        conceptKey,
        title: `Refuerzo de ${LEARNING_CONCEPTS[conceptKey]?.label || 'SQL'}`,
        scaffold: LEARNING_CONCEPTS[conceptKey]?.scaffold || LEARNING_CONCEPTS.select.scaffold,
        reason: 'Este error se repitio. La practica guiada te ayuda a recuperar control.',
        createdAt: today,
      },
      ...progress.reinforcementQueue.filter((item) => item.conceptKey !== conceptKey),
    ].slice(0, 5);
  }

  saveLearningProgress(userId, progress);

  return {
    progress,
    conceptKey,
    concept,
    mastery: conceptMastery(concept),
    unlockedBadges,
    progressiveHint: buildProgressiveHint({ exercise, focus, attempts, conceptKey, repeatedErrors: concept.repeatedErrors }),
    reinforcement: progress.reinforcementQueue[0] || null,
    constancy: progress.daily[today],
  };
};

export const getModuleLearningSummary = (userId = 'local', moduleId) => {
  const progress = getLearningProgress(userId);
  const module = progress.modules[String(moduleId)] || { attempts: 0, successes: 0, failures: 0, concepts: {}, recommendations: [] };
  const concepts = Object.keys(module.concepts || {}).map((key) => {
    const data = progress.concepts[key] || {};
    return {
      key,
      label: LEARNING_CONCEPTS[key]?.label || key,
      badge: LEARNING_CONCEPTS[key]?.badge || key,
      mastery: conceptMastery(data),
      attempts: data.attempts || 0,
      successes: data.successes || 0,
    };
  });

  return {
    ...module,
    concepts,
    badges: Object.entries(progress.badges || {}).map(([key, badge]) => ({ key, ...badge, label: LEARNING_CONCEPTS[key]?.label || key })),
    reinforcementQueue: progress.reinforcementQueue || [],
  };
};
