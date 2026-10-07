import { resolverSimplex } from './simplex';
import { exigir, limpiar, limpiarResultado, matriz } from './util';

// Teoría de decisiones (incertidumbre y riesgo) y juegos de suma cero de dos personas.

function validarTabla({ alternativas, estados, pagos }) {
  matriz(pagos, 'La tabla de pagos');
  exigir(pagos.length <= 20 && pagos[0].length <= 20, 'La tabla admite hasta 20 alternativas y 20 estados.');
  const filas = alternativas ?? pagos.map((_, i) => `A${i + 1}`);
  const cols = estados ?? pagos[0].map((_, j) => `E${j + 1}`);
  exigir(Array.isArray(filas) && filas.length === pagos.length && filas.every((x) => typeof x === 'string' && x.length <= 60), 'Indique un nombre por alternativa.');
  exigir(Array.isArray(cols) && cols.length === pagos[0].length && cols.every((x) => typeof x === 'string' && x.length <= 60), 'Indique un nombre por estado de la naturaleza.');
  return { filas, cols };
}

const mejorIndice = (valores, max) => valores.reduce((m, v, i) => ((max ? v > valores[m] + 1e-12 : v < valores[m] - 1e-12) ? i : m), 0);

function incertidumbreInterno({ alternativas, estados, pagos, alfa = null, objetivo = 'max' }) {
  const { filas, cols } = validarTabla({ alternativas, estados, pagos });
  exigir(['max', 'min'].includes(objetivo), 'El objetivo debe ser max (ganancias) o min (costos).');
  if (alfa !== null && alfa !== undefined) exigir(typeof alfa === 'number' && alfa >= 0 && alfa <= 1, 'El coeficiente de optimismo α debe estar entre 0 y 1.');
  const max = objetivo === 'max';
  const mejorDeFila = (r) => (max ? Math.max(...r) : Math.min(...r));
  const peorDeFila = (r) => (max ? Math.min(...r) : Math.max(...r));
  const mejorCol = cols.map((_, j) => (max ? Math.max : Math.min)(...pagos.map((r) => r[j])));
  const arrepentimiento = pagos.map((r) => r.map((v, j) => Math.abs(mejorCol[j] - v)));
  const criterios = [
    { clave: 'optimista', nombre: max ? 'Optimista (maximax)' : 'Optimista (minimin)', valores: pagos.map(mejorDeFila), max },
    { clave: 'pesimista', nombre: max ? 'Pesimista de Wald (maximin)' : 'Pesimista de Wald (minimax)', valores: pagos.map(peorDeFila), max },
    { clave: 'laplace', nombre: 'Laplace (equiprobable)', valores: pagos.map((r) => r.reduce((a, v) => a + v, 0) / r.length), max },
    ...(alfa === null || alfa === undefined ? [] : [{ clave: 'hurwicz', nombre: `Hurwicz (α = ${alfa})`, valores: pagos.map((r) => alfa * mejorDeFila(r) + (1 - alfa) * peorDeFila(r)), max }]),
    { clave: 'savage', nombre: 'Savage (minimax de arrepentimiento)', valores: arrepentimiento.map((r) => Math.max(...r)), max: false },
  ].map((c) => { const i = mejorIndice(c.valores, c.max); return { ...c, valores: c.valores.map(limpiar), decision: filas[i], indice: i }; });
  return { alternativas: filas, estados: cols, criterios, arrepentimiento };
}

function riesgoInterno({ alternativas, estados, pagos, probabilidades, objetivo = 'max' }) {
  const { filas, cols } = validarTabla({ alternativas, estados, pagos });
  exigir(Array.isArray(probabilidades) && probabilidades.length === cols.length && probabilidades.every((p) => typeof p === 'number' && p >= 0 && p <= 1), 'Indique una probabilidad entre 0 y 1 por estado.');
  exigir(Math.abs(probabilidades.reduce((a, p) => a + p, 0) - 1) <= 1e-6, 'Las probabilidades deben sumar 1.');
  const max = objetivo === 'max';
  const ve = pagos.map((r) => r.reduce((a, v, j) => a + v * probabilidades[j], 0));
  const i = mejorIndice(ve, max);
  const mejorCol = cols.map((_, j) => (max ? Math.max : Math.min)(...pagos.map((r) => r[j])));
  const conInformacion = mejorCol.reduce((a, v, j) => a + v * probabilidades[j], 0);
  return {
    alternativas: filas, estados: cols,
    valoresEsperados: ve.map(limpiar), decision: filas[i], valorEsperado: limpiar(ve[i]),
    valorConInformacionPerfecta: limpiar(conInformacion), veip: limpiar(Math.abs(conInformacion - ve[i])),
  };
}

function sumaCeroInterno({ pagos, filas: nf, columnas: nc }) {
  const { filas, cols } = validarTabla({ alternativas: nf, estados: nc, pagos });
  const minFila = pagos.map((r) => Math.min(...r));
  const maxCol = cols.map((_, j) => Math.max(...pagos.map((r) => r[j])));
  const maximin = Math.max(...minFila), minimax = Math.min(...maxCol);
  const pasos = [{ texto: 'Mínimo de cada fila (jugador A) y máximo de cada columna (jugador B).', tabla: pagos.map((r, i) => ({ estrategia: filas[i], ...Object.fromEntries(cols.map((c, j) => [c, r[j]])), minimoFila: minFila[i] })).concat([{ estrategia: 'Máximo de columna', ...Object.fromEntries(cols.map((c, j) => [c, maxCol[j]])) }]) }];
  if (Math.abs(maximin - minimax) <= 1e-12) {
    const i = minFila.indexOf(maximin), j = maxCol.indexOf(minimax);
    return {
      puntoSilla: true, valor: limpiar(maximin), maximin, minimax,
      estrategiaFilas: Object.fromEntries(filas.map((f, k) => [f, k === i ? 1 : 0])),
      estrategiaColumnas: Object.fromEntries(cols.map((c, k) => [c, k === j ? 1 : 0])),
      pasos: [...pasos, { texto: `maximin = minimax = ${limpiar(maximin)}: hay punto silla en (${filas[i]}, ${cols[j]}); estrategias puras.` }],
    };
  }
  // Estrategias mixtas por PL: se desplaza la matriz para que el valor del juego sea positivo.
  const k = Math.max(0, 1 - Math.min(...pagos.flat()));
  const B = pagos.map((r) => r.map((v) => v + k));
  const p = filas.map((_, i) => `p${i + 1}`), q = cols.map((_, j) => `q${j + 1}`);
  const A = resolverSimplex({ sentido: 'min', variables: p, c: p.map(() => 1), A: cols.map((_, j) => B.map((r) => r[j])), b: cols.map(() => 1), ops: cols.map(() => '>='), noNegativas: p });
  const Bq = resolverSimplex({ sentido: 'max', variables: q, c: q.map(() => 1), A: B, b: filas.map(() => 1), ops: filas.map(() => '<='), noNegativas: q });
  exigir(A.estado === 'optimo' && Bq.estado === 'optimo', 'No se pudo resolver el juego por programación lineal.');
  const v = 1 / A.z;
  return {
    puntoSilla: false, valor: limpiar(v - k), maximin, minimax,
    estrategiaFilas: Object.fromEntries(filas.map((f, i) => [f, limpiar(A.x[p[i]] * v)])),
    estrategiaColumnas: Object.fromEntries(cols.map((c, j) => [c, limpiar(Bq.x[q[j]] * v)])),
    pasos: [...pasos,
      { texto: `maximin = ${limpiar(maximin)} < minimax = ${limpiar(minimax)}: no hay punto silla; se buscan estrategias mixtas.` },
      { texto: `Se suma k = ${limpiar(k)} a todos los pagos y se resuelve: min Σpᵢ' s.a. Σᵢ aᵢⱼ pᵢ' ≥ 1. El valor es 1/Σpᵢ' − k.`, tabla: A.tablas[A.tablas.length - 1] },
    ],
  };
}

export const criteriosIncertidumbre = (d) => limpiarResultado(incertidumbreInterno(d));
export const decisionRiesgo = (d) => limpiarResultado(riesgoInterno(d));
export const juegoSumaCero = (d) => limpiarResultado(sumaCeroInterno(d));
