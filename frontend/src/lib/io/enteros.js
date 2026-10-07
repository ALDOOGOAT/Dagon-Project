import { resolverSimplex } from './simplex';
import { exigir, limpiar, limpiarResultado, producto, validarModelo } from './util';

// Programación entera, binaria y mixta por ramificación y acotamiento (branch & bound).
// Cada nodo resuelve la relajación lineal con el simplex existente más las cotas de su rama.
const TOL = 1e-6;
export const MAX_NODOS_BB = 3000;

const conCotas = (modelo, cotas) => ({
  ...modelo,
  A: [...modelo.A, ...cotas.map(({ j }) => modelo.variables.map((_, k) => (k === j ? 1 : 0)))],
  b: [...modelo.b, ...cotas.map((c) => c.valor)],
  ops: [...modelo.ops, ...cotas.map((c) => c.op)],
});

const redondearEnteras = (x, enteras) => Object.fromEntries(
  Object.entries(x).map(([v, valor]) => [v, enteras.includes(v) ? Math.round(valor) : limpiar(valor)]),
);

function resolverEnteroInterno(modelo, opciones) {
  validarModelo(modelo);
  const binarias = [...new Set(opciones.binarias ?? modelo.binarias ?? [])];
  const enteras = [...new Set([...(opciones.enteras ?? modelo.enteras ?? []), ...binarias])];
  exigir(enteras.length > 0, 'Indique al menos una variable entera o binaria.');
  exigir(enteras.every((v) => modelo.variables.includes(v)), 'Las variables enteras o binarias deben aparecer en el modelo.');
  const indices = enteras.map((v) => modelo.variables.indexOf(v));
  // Una binaria es una entera acotada 0 ≤ y ≤ 1.
  const base = conCotas(
    { ...modelo, noNegativas: [...new Set([...modelo.noNegativas, ...binarias])] },
    binarias.map((v) => ({ j: modelo.variables.indexOf(v), op: '<=', valor: 1 })),
  );
  const signo = modelo.sentido === 'max' ? 1 : -1;
  const nodos = [];
  const pila = [{ padre: null, cotas: [], rama: 'Relajación lineal (P0)', profundidad: 0 }];
  let mejor = null, relajacion = null, noAcotado = false, limite = false;

  while (pila.length) {
    if (nodos.length >= MAX_NODOS_BB) { limite = true; break; }
    const { padre, cotas, rama, profundidad } = pila.pop();
    const id = nodos.length;
    const r = resolverSimplex(conCotas(base, cotas));
    const nodo = { id, padre, rama, profundidad, estado: r.estado, z: r.z, x: r.x, decision: '' };
    nodos.push(nodo);
    if (id === 0) relajacion = { estado: r.estado, z: r.z, x: r.x, tablas: r.tablas };
    if (r.estado === 'infactible') { nodo.decision = 'Podado: subproblema infactible'; continue; }
    if (r.estado === 'no_acotado') { nodo.decision = 'Relajación no acotada'; noAcotado = true; break; }
    if (mejor && signo * r.z <= signo * mejor.z + TOL) {
      nodo.decision = `Podado por cota: Z = ${limpiar(r.z)} no mejora la incumbente ${mejor.z}`;
      continue;
    }
    // Se ramifica en la variable más fraccionaria (la más cercana a .5).
    let j = -1, distancia = 0;
    indices.forEach((k) => {
      const valor = r.x[modelo.variables[k]];
      const d = Math.min(valor - Math.floor(valor), Math.ceil(valor) - valor);
      if (d > TOL && d > distancia) { distancia = d; j = k; }
    });
    if (j < 0) {
      nodo.decision = 'Solución entera factible: nueva incumbente';
      nodo.incumbente = true;
      mejor = { z: limpiar(r.z), x: redondearEnteras(r.x, enteras), nodo: id };
      continue;
    }
    const v = modelo.variables[j], valor = r.x[v], piso = Math.floor(valor + TOL), techo = Math.ceil(valor - TOL);
    nodo.decision = `Ramificar en ${v} = ${limpiar(Number(valor.toFixed(6)))}`;
    nodo.ramificaEn = v;
    // Se explora primero la rama ≤ (último en entrar a la pila).
    pila.push({ padre: id, cotas: [...cotas, { j, op: '>=', valor: techo }], rama: `${v} ≥ ${techo}`, profundidad: profundidad + 1 });
    pila.push({ padre: id, cotas: [...cotas, { j, op: '<=', valor: piso }], rama: `${v} ≤ ${piso}`, profundidad: profundidad + 1 });
  }
  if (mejor) nodos[mejor.nodo].optimo = true;

  const estado = noAcotado ? 'no_acotado' : mejor ? (limite ? 'limite' : 'optimo') : (limite ? 'limite' : 'infactible');
  const x = mejor ? mejor.x : Object.fromEntries(modelo.variables.map((v) => [v, 0]));
  const xv = modelo.variables.map((v) => x[v]);
  const holguras = mejor
    ? Object.fromEntries(modelo.A.map((r, i) => [`${modelo.ops[i] === '>=' ? 'e' : 's'}_${i + 1}`, limpiar(modelo.ops[i] === '>=' ? producto(r, xv) - modelo.b[i] : modelo.b[i] - producto(r, xv))]))
    : {};
  return {
    estado,
    z: mejor ? mejor.z : null,
    x,
    holguras,
    enteras,
    binarias,
    relajacion,
    brecha: mejor && relajacion?.z !== null && relajacion?.z !== undefined ? limpiar(Math.abs(relajacion.z - mejor.z)) : null,
    nodos,
    explorados: nodos.length,
  };
}

export function resolverEntero(modelo, opciones = {}) {
  return limpiarResultado(resolverEnteroInterno(modelo, opciones));
}

// Puntos enteros factibles dentro de la caja del gráfico (solo modelos de dos variables enteras).
export function puntosEnterosFactibles(modelo, limites, maximo = 900) {
  const [xmax, ymax] = [Math.floor(limites.xmax), Math.floor(limites.ymax)];
  if ((xmax + 1) * (ymax + 1) > maximo) return null;
  const factible = (x, y) => modelo.A.every((r, i) => {
    const d = r[0] * x + r[1] * y - modelo.b[i];
    return modelo.ops[i] === '<=' ? d <= 1e-7 : modelo.ops[i] === '>=' ? d >= -1e-7 : Math.abs(d) <= 1e-7;
  });
  const puntos = [];
  for (let x = 0; x <= xmax; x++) for (let y = 0; y <= ymax; y++) if (factible(x, y)) puntos.push({ x, y, z: limpiar(modelo.c[0] * x + modelo.c[1] * y), factible: true });
  return puntos;
}
