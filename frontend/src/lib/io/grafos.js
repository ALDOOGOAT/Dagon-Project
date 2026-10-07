import { exigir, limpiar, limpiarResultado, numero } from './util';

// Problemas de redes sobre grafos: ruta más corta (Dijkstra), árbol de expansión mínima
// (Kruskal) y flujo máximo (Ford-Fulkerson con BFS, Edmonds-Karp).
export const MAX_ARISTAS = 80;

function validarGrafo({ aristas }, { noNegativo = true } = {}) {
  exigir(Array.isArray(aristas) && aristas.length > 0 && aristas.length <= MAX_ARISTAS, `Indique entre 1 y ${MAX_ARISTAS} aristas.`);
  const nodos = new Set();
  aristas.forEach((a) => {
    exigir(a && typeof a.origen === 'string' && typeof a.destino === 'string' && a.origen.trim() && a.destino.trim(), 'Cada arista requiere origen y destino.');
    exigir(a.origen.length <= 30 && a.destino.length <= 30, 'Los nombres de nodo admiten hasta 30 caracteres.');
    exigir(a.origen !== a.destino, `La arista ${a.origen}→${a.destino} no puede unir un nodo consigo mismo.`);
    numero(a.valor, `El valor de ${a.origen}→${a.destino}`, noNegativo ? 0 : -Infinity);
    nodos.add(a.origen); nodos.add(a.destino);
  });
  return [...nodos].sort((x, y) => x.localeCompare(y, 'es', { numeric: true }));
}

const vecinos = (aristas, dirigido) => {
  const mapa = new Map();
  const agregar = (u, v, w, i) => { if (!mapa.has(u)) mapa.set(u, []); mapa.get(u).push({ v, w, i }); };
  aristas.forEach((a, i) => { agregar(a.origen, a.destino, a.valor, i); if (!dirigido) agregar(a.destino, a.origen, a.valor, i); });
  return mapa;
};

function rutaMasCortaInterno({ aristas, origen, destino, dirigido = false }) {
  const nodos = validarGrafo({ aristas });
  exigir(nodos.includes(origen), 'El nodo origen no aparece en la red.');
  exigir(nodos.includes(destino), 'El nodo destino no aparece en la red.');
  const ady = vecinos(aristas, dirigido);
  const dist = Object.fromEntries(nodos.map((n) => [n, Infinity])), previo = {}, viaArista = {}, fijados = new Set(), pasos = [];
  dist[origen] = 0;
  while (fijados.size < nodos.length) {
    const u = nodos.filter((n) => !fijados.has(n)).reduce((a, b) => (dist[b] < dist[a] ? b : a));
    if (dist[u] === Infinity) break;
    fijados.add(u);
    (ady.get(u) || []).forEach(({ v, w, i }) => {
      if (!fijados.has(v) && dist[u] + w < dist[v] - 1e-12) { dist[v] = dist[u] + w; previo[v] = u; viaArista[v] = i; }
    });
    pasos.push({ iteracion: pasos.length + 1, nodoFijado: u, ...Object.fromEntries(nodos.map((n) => [n, dist[n] === Infinity ? '∞' : `${limpiar(dist[n])}${previo[n] ? ` (${previo[n]})` : ''}${fijados.has(n) ? ' ✓' : ''}`])) });
    if (u === destino) break;
  }
  exigir(dist[destino] !== Infinity, `No existe una ruta de ${origen} a ${destino}.`);
  const ruta = [destino], aristasSolucion = [];
  while (ruta[0] !== origen) { aristasSolucion.unshift(viaArista[ruta[0]]); ruta.unshift(previo[ruta[0]]); }
  return { distancia: limpiar(dist[destino]), ruta, aristasSolucion, nodos, pasos };
}

function arbolMinimoInterno({ aristas }) {
  const nodos = validarGrafo({ aristas }, { noNegativo: false });
  const padre = Object.fromEntries(nodos.map((n) => [n, n]));
  const raiz = (n) => (padre[n] === n ? n : (padre[n] = raiz(padre[n])));
  const orden = aristas.map((a, i) => ({ ...a, i })).sort((a, b) => a.valor - b.valor || a.i - b.i);
  const aristasSolucion = [], pasos = [];
  let total = 0;
  orden.forEach((a) => {
    const ra = raiz(a.origen), rb = raiz(a.destino);
    const acepta = ra !== rb;
    if (acepta) { padre[ra] = rb; aristasSolucion.push(a.i); total += a.valor; }
    pasos.push({ arista: `${a.origen}–${a.destino}`, valor: a.valor, decision: acepta ? 'Se agrega' : 'Se descarta: formaría un ciclo' });
  });
  const componentes = new Set(nodos.map(raiz)).size;
  return { total: limpiar(total), aristasSolucion, nodos, pasos, conexo: componentes === 1, componentes };
}

function flujoMaximoInterno({ aristas, origen, destino, dirigido = true }) {
  const nodos = validarGrafo({ aristas });
  exigir(nodos.includes(origen) && nodos.includes(destino), 'La fuente y el sumidero deben aparecer en la red.');
  exigir(origen !== destino, 'La fuente y el sumidero deben ser distintos.');
  const idx = Object.fromEntries(nodos.map((n, i) => [n, i])), N = nodos.length;
  const cap = Array.from({ length: N }, () => Array(N).fill(0));
  aristas.forEach((a) => { cap[idx[a.origen]][idx[a.destino]] += a.valor; if (!dirigido) cap[idx[a.destino]][idx[a.origen]] += a.valor; });
  const flujo = Array.from({ length: N }, () => Array(N).fill(0));
  const s = idx[origen], t = idx[destino], pasos = [];
  let total = 0;
  for (let iter = 0; iter < 10000; iter++) {
    const previo = Array(N).fill(-1); previo[s] = s;
    const cola = [s];
    while (cola.length && previo[t] < 0) {
      const u = cola.shift();
      for (let v = 0; v < N; v++) if (previo[v] < 0 && cap[u][v] - flujo[u][v] > 1e-12) { previo[v] = u; cola.push(v); }
    }
    if (previo[t] < 0) break;
    let cuello = Infinity;
    for (let v = t; v !== s; v = previo[v]) cuello = Math.min(cuello, cap[previo[v]][v] - flujo[previo[v]][v]);
    const camino = [];
    for (let v = t; v !== s; v = previo[v]) { flujo[previo[v]][v] += cuello; flujo[v][previo[v]] -= cuello; camino.unshift(nodos[v]); }
    camino.unshift(origen);
    total += cuello;
    pasos.push({ iteracion: pasos.length + 1, caminoAumentante: camino.join(' → '), capacidadResidual: limpiar(cuello), flujoAcumulado: limpiar(total) });
  }
  // Corte mínimo: nodos alcanzables desde la fuente en la red residual.
  const alcanzables = new Set([s]), pila = [s];
  while (pila.length) { const u = pila.pop(); for (let v = 0; v < N; v++) if (!alcanzables.has(v) && cap[u][v] - flujo[u][v] > 1e-12) { alcanzables.add(v); pila.push(v); } }
  const flujos = aristas.map((a) => {
    const f = Math.max(0, Math.min(a.valor, flujo[idx[a.origen]][idx[a.destino]]));
    return { arista: `${a.origen}→${a.destino}`, capacidad: a.valor, flujo: limpiar(f) };
  });
  const corte = aristas.map((a, i) => ({ a, i })).filter(({ a }) => alcanzables.has(idx[a.origen]) && !alcanzables.has(idx[a.destino])).map(({ i }) => i);
  return { flujoMaximo: limpiar(total), flujos, corteMinimo: corte, ladoFuente: [...alcanzables].map((i) => nodos[i]), nodos, pasos, aristasSolucion: aristas.map((_, i) => i).filter((i) => flujos[i].flujo > 1e-12) };
}

export const rutaMasCorta = (d) => limpiarResultado(rutaMasCortaInterno(d));
export const arbolExpansionMinima = (d) => limpiarResultado(arbolMinimoInterno(d));
export const flujoMaximo = (d) => limpiarResultado(flujoMaximoInterno(d));
