import { parseModeloPL } from './parser';
import { resolverSimplex } from './simplex';
import { expresion, evaluar, math } from './formulas';
import { autovaloresSimetrica, exigir, limpiar, limpiarResultado, producto, resolverSistema } from './util';

// Programación cuadrática: objetivo de grado ≤ 2 con restricciones lineales.
// Se enumeran los conjuntos activos y se resuelven las condiciones KKT de cada uno. Con la región
// acotada, el óptimo global es uno de esos puntos KKT; si el problema es convexo, cualquiera lo es.
const preparar = (t) => t.replace(/\b0(?=x(?:\d*\b))/g, '0*');
export const MAX_VARIABLES_QP = 6;
const MAX_DESIGUALDADES_QP = 16;

export function parseModeloCuadratico(objetivo, restricciones) {
  exigir(typeof objetivo === 'string', 'El objetivo debe ser un texto.');
  const cabecera = objetivo.trim().match(/^(max|min)\s+(?:z\s*=\s*)?(.+)$/i);
  exigir(cabecera, 'El objetivo debe comenzar con max o min, por ejemplo max z = 10x1 - x1^2.');
  let arbol;
  try { arbol = math.parse(preparar(cabecera[2])); } catch (_) { throw new Error(`Expresión inválida: ${cabecera[2]}.`); }
  const propios = new Set();
  arbol.traverse((n) => { if (n.isSymbolNode && !['pi', 'e'].includes(n.name)) propios.add(n.name); });
  exigir(propios.size > 0, 'El objetivo debe contener variables.');
  // Las restricciones son lineales: se reutiliza el parser de PL con un objetivo nulo.
  const lineal = parseModeloPL(`max z = ${[...propios].map((v) => `0*${v}`).join(' + ')}`, restricciones);
  const { variables } = lineal;
  exigir(variables.length <= MAX_VARIABLES_QP, `La programación cuadrática admite hasta ${MAX_VARIABLES_QP} variables.`);
  variables.forEach((v) => exigir(!variables.some((a) => a !== v && v.startsWith(a) && variables.includes(v.slice(a.length))),
    `"${v}" parece un producto de variables: escríbalo con * (por ejemplo x1*x2).`));
  const nodo = expresion(preparar(cabecera[2]), variables);
  const cero = Object.fromEntries(variables.map((v) => [v, 0]));
  let gradiente, Q;
  try {
    gradiente = variables.map((v) => math.derivative(nodo, v));
    Q = gradiente.map((g) => variables.map((w) => evaluar(math.derivative(g, w), cero)));
  } catch (_) { throw new Error('El objetivo debe ser un polinomio de grado 2 como máximo.'); }
  const k = evaluar(nodo, cero);
  const c = gradiente.map((g) => evaluar(g, cero));
  const cuadratica = (s) => k + producto(c, s) + 0.5 * s.reduce((a, si, i) => a + si * producto(Q[i], s), 0);
  for (let p = 1; p <= 4; p++) {
    const s = variables.map((_, i) => Math.sin((i + 2) * (p + 1)) * 4);
    const real = evaluar(nodo, Object.fromEntries(variables.map((v, i) => [v, s[i]])));
    exigir(Math.abs(real - cuadratica(s)) <= 1e-7 * Math.max(1, Math.abs(real)), 'El objetivo debe ser un polinomio de grado 2 como máximo.');
  }
  return { ...lineal, sentido: cabecera[1].toLowerCase(), objetivoTexto: cabecera[2], k, c, Q };
}

const lp = (m, sentido, c) => resolverSimplex({ sentido, variables: m.variables, c, A: m.A, b: m.b, ops: m.ops, noNegativas: m.noNegativas });
const factibleLP = (m) => lp(m, 'max', m.variables.map(() => 0)).estado !== 'infactible';
const regionAcotada = (m) => m.variables.every((_, j) => ['max', 'min'].every((s) => lp(m, s, m.variables.map((__, t) => (t === j ? 1 : 0))).estado !== 'no_acotado'));

function resolverCuadraticaInterno(m) {
  const n = m.variables.length, signo = m.sentido === 'max' ? -1 : 1;
  // Se minimiza F = signo·f con restricciones a·x ≤ b (las ≥ se invierten) y a·x = b.
  const QF = m.Q.map((r) => r.map((x) => signo * x)), cF = m.c.map((x) => signo * x);
  const valor = (x) => m.k + producto(m.c, x) + 0.5 * x.reduce((a, xi, i) => a + xi * producto(m.Q[i], x), 0);
  const igualdades = [], desigualdades = [];
  m.A.forEach((a, i) => {
    const etiqueta = `R${i + 1}`;
    if (m.ops[i] === '=') igualdades.push({ a, b: m.b[i], etiqueta });
    else desigualdades.push(m.ops[i] === '<=' ? { a, b: m.b[i], etiqueta } : { a: a.map((x) => -x), b: -m.b[i], etiqueta });
  });
  m.variables.forEach((v, j) => { if (m.noNegativas.includes(v)) desigualdades.push({ a: m.variables.map((_, t) => (t === j ? -1 : 0)), b: 0, etiqueta: `${v} ≥ 0` }); });
  exigir(desigualdades.length <= MAX_DESIGUALDADES_QP, `Se admiten hasta ${MAX_DESIGUALDADES_QP} desigualdades contando la no negatividad.`);
  const maxActivas = n - igualdades.length;
  exigir(maxActivas >= 0, 'Hay más igualdades que variables.');

  const candidatos = [];
  // KKT del conjunto activo S: QF·x + Σ μ·a = -cF, a·x = b en S; se acepta si μ ≥ 0 y x es factible.
  const probar = (activas) => {
    const filas = [...igualdades, ...activas.map((i) => desigualdades[i])];
    const N = n + filas.length;
    const M = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (__, j) => {
      if (i < n && j < n) return QF[i][j];
      if (i < n) return filas[j - n].a[i];
      if (j < n) return filas[i - n].a[j];
      return 0;
    }));
    let sol;
    try { sol = resolverSistema(M, [...cF.map((x) => -x), ...filas.map((f) => f.b)]); } catch (_) { return; }
    const x = sol.slice(0, n), mu = sol.slice(n);
    const factible = desigualdades.every((d) => producto(d.a, x) <= d.b + 1e-7) && igualdades.every((d) => Math.abs(producto(d.a, x) - d.b) <= 1e-7);
    if (!factible || !mu.slice(igualdades.length).every((u) => u >= -1e-9)) return;
    if (candidatos.some((c) => c.x.every((xi, i) => Math.abs(xi - x[i]) <= 1e-7))) return;
    candidatos.push({
      activas: activas.map((i) => desigualdades[i].etiqueta),
      x: x.map(limpiar),
      multiplicadores: Object.fromEntries(filas.map((f, i) => [f.etiqueta, limpiar(mu[i])])),
      z: limpiar(valor(x)),
    });
  };
  const elegir = (inicio, actual) => {
    probar(actual);
    if (actual.length === maxActivas) return;
    for (let i = inicio; i < desigualdades.length; i++) elegir(i + 1, [...actual, i]);
  };
  elegir(0, []);

  const autovalores = autovaloresSimetrica(QF).map(limpiar);
  const convexa = autovalores.every((l) => l >= -1e-9);
  const acotada = regionAcotada(m);
  const base = { variables: m.variables, convexa, acotada, autovalores, hessiano: m.Q, candidatos };
  if (!candidatos.length) {
    return { ...base, estado: factibleLP(m) ? 'no_acotado' : 'infactible', z: null, x: Object.fromEntries(m.variables.map((v) => [v, 0])) };
  }
  const mejor = candidatos.reduce((a, b) => (signo * b.z < signo * a.z - 1e-9 ? b : a));
  mejor.optimo = true;
  // Global garantizado si es convexo (KKT suficiente) o si la región está acotada (se enumeran todos los KKT).
  return {
    ...base,
    estado: convexa || acotada ? 'optimo' : 'kkt',
    z: mejor.z,
    x: Object.fromEntries(m.variables.map((v, i) => [v, mejor.x[i]])),
    multiplicadores: mejor.multiplicadores,
    activas: mejor.activas,
  };
}

export function resolverCuadratica(modelo) { return limpiarResultado(resolverCuadraticaInterno(modelo)); }
