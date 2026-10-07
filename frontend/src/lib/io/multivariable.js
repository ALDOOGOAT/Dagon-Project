import { expresion, evaluar, math } from './formulas';
import { autovaloresSimetrica, exigir, limpiar, limpiarResultado, numero, resolverSistema } from './util';

// Optimización no restringida de varias variables: Newton con Hessiano simbólico (mathjs)
// y paso amortiguado. Clasifica el punto estacionario con los autovalores del Hessiano.
export const MAX_VARIABLES_MULTI = 4;

function newtonMultivariableInterno({ f, simbolos, inicio, tol = 1e-8, maxIter = 100 }) {
  exigir(Array.isArray(simbolos) && simbolos.length >= 1 && simbolos.length <= MAX_VARIABLES_MULTI, `Indique entre 1 y ${MAX_VARIABLES_MULTI} variables.`);
  simbolos.forEach((s) => exigir(typeof s === 'string' && /^[a-zA-Z][a-zA-Z0-9_]{0,9}$/.test(s), 'Símbolo de variable no permitido.'));
  exigir(new Set(simbolos).size === simbolos.length, 'Las variables no deben repetirse.');
  exigir(Array.isArray(inicio) && inicio.length === simbolos.length, 'El punto inicial debe tener un valor por variable.');
  inicio.forEach((x) => numero(x, 'El punto inicial'));
  const nodo = expresion(f, simbolos);
  let grad, hess;
  try {
    grad = simbolos.map((v) => math.derivative(nodo, v));
    hess = grad.map((g) => simbolos.map((w) => math.derivative(g, w)));
  } catch (_) { throw new Error('No se pudo derivar la función.'); }
  const scope = (x) => Object.fromEntries(simbolos.map((v, i) => [v, x[i]]));
  const G = (x) => grad.map((g) => evaluar(g, scope(x)));
  const H = (x) => hess.map((fila) => fila.map((h) => evaluar(h, scope(x))));
  const norma = (v) => Math.sqrt(v.reduce((a, x) => a + x * x, 0));
  const iteraciones = [];
  let x = [...inicio], convergio = false;
  for (let k = 0; k < maxIter; k++) {
    const g = G(x), fx = evaluar(nodo, scope(x));
    iteraciones.push({ k, ...Object.fromEntries(simbolos.map((v, i) => [v, limpiar(x[i])])), f: limpiar(fx), normaGradiente: limpiar(norma(g)) });
    if (norma(g) <= tol) { convergio = true; break; }
    let d;
    try { d = resolverSistema(H(x), g.map((v) => -v)); } catch (_) { throw new Error('El Hessiano es singular en una iteración; pruebe otro punto inicial.'); }
    // Amortiguar si el paso no reduce la norma del gradiente.
    let paso = 1, siguiente = x.map((xi, i) => xi + d[i]);
    for (let t = 0; t < 30; t++) {
      try { if (norma(G(siguiente)) < norma(g)) break; } catch (_) { /* fuera del dominio: reducir */ }
      paso /= 2; siguiente = x.map((xi, i) => xi + paso * d[i]);
    }
    x = siguiente;
  }
  exigir(convergio, 'Newton no convergió; pruebe otro punto inicial.');
  const hessiano = H(x).map((r) => r.map(limpiar));
  const autovalores = autovaloresSimetrica(hessiano).map(limpiar);
  const tipo = autovalores.every((l) => l > 1e-9) ? 'minimo'
    : autovalores.every((l) => l < -1e-9) ? 'maximo'
      : autovalores.some((l) => l > 1e-9) && autovalores.some((l) => l < -1e-9) ? 'silla' : 'no_concluyente';
  return { punto: Object.fromEntries(simbolos.map((v, i) => [v, limpiar(x[i])])), fx: limpiar(evaluar(nodo, scope(x))), iteraciones, hessiano, autovalores, tipo };
}

export function newtonMultivariable(datos) { return limpiarResultado(newtonMultivariableInterno(datos)); }

export function evaluadorDosVariables(f, simbolos) {
  const nodo = expresion(f, simbolos);
  return (x, y) => evaluar(nodo, { [simbolos[0]]: x, [simbolos[1]]: y });
}
