import { limpiarResultado } from './util';
import { EPS, copia, exigir, limpiar, matriz, numero } from './util';
function resolverTransporteInterno(datos) {
  exigir(datos && typeof datos === 'object', 'Indique costos, oferta, demanda y método.');
  const { costos, oferta, demanda, metodo } = datos;
  matriz(costos, 'Los costos');
  exigir(Array.isArray(oferta) && Array.isArray(demanda) && oferta.length === costos.length && demanda.length === costos[0].length, 'La oferta y la demanda no coinciden con la matriz de costos.');
  oferta.forEach(x => numero(x, 'La oferta', 0)); demanda.forEach(x => numero(x, 'La demanda', 0));
  exigir(['noroeste', 'costo_minimo', 'vogel'].includes(metodo), 'Método inicial desconocido.');
  const C = copia(costos), O = [...oferta], D = [...demanda];
  const diferencia = O.reduce((a, x) => a + x, 0) - D.reduce((a, x) => a + x, 0);
  let ficticio = null;
  if (diferencia > EPS) { ficticio = 'columna'; D.push(diferencia); C.forEach(r => r.push(0)); }
  else if (diferencia < -EPS) { ficticio = 'fila'; O.push(-diferencia); C.push(D.map(() => 0)); }
  const m = O.length, n = D.length, X = C.map(r => r.map(() => 0)), o = [...O], d = [...D], pasos = [];
  if (ficticio) pasos.push({ texto: `Se agregó una ${ficticio} ficticia de costo cero para balancear el problema.` });
  function elegir() {
    const is = o.map((x, i) => i).filter(i => o[i] > EPS), js = d.map((x, j) => j).filter(j => d[j] > EPS);
    if (!is.length || !js.length) return null;
    if (metodo === 'noroeste') return { i: is[0], j: js[0] };
    let candidatas = is.flatMap(i => js.map(j => ({ i, j })));
    if (metodo === 'vogel') {
      const lineas = [
        ...is.map(i => { const cc = js.map(j => C[i][j]).sort((a, b) => a - b); return { penalizacion: cc.length > 1 ? cc[1] - cc[0] : Infinity, celdas: js.map(j => ({ i, j })) }; }),
        ...js.map(j => { const cc = is.map(i => C[i][j]).sort((a, b) => a - b); return { penalizacion: cc.length > 1 ? cc[1] - cc[0] : Infinity, celdas: is.map(i => ({ i, j })) }; })
      ];
      lineas.sort((a, b) => b.penalizacion - a.penalizacion || Math.min(...a.celdas.map(v => C[v.i][v.j])) - Math.min(...b.celdas.map(v => C[v.i][v.j])));
      candidatas = lineas[0].celdas;
      pasos.push({ texto: `Vogel: la mayor penalización es ${Number.isFinite(lineas[0].penalizacion) ? limpiar(lineas[0].penalizacion) : 'prioritaria (una sola celda disponible)'}.` });
    }
    candidatas.sort((a, b) => C[a.i][a.j] - C[b.i][b.j] || a.i - b.i || a.j - b.j);
    return candidatas[0];
  }
  let celda;
  while ((celda = elegir())) {
    const { i, j } = celda, q = Math.min(o[i], d[j]); X[i][j] += q; o[i] = limpiar(o[i] - q); d[j] = limpiar(d[j] - q);
    pasos.push({ texto: `Asignar ${q} unidades a la celda (${i + 1}, ${j + 1}), con costo unitario ${C[i][j]}.` });
  }
  const costo = () => limpiar(X.reduce((s, r, i) => s + r.reduce((t, x, j) => t + x * C[i][j], 0), 0));
  const inicial = { asignacion: copia(X), costo: costo(), pasos };
  // Las básicas de valor cero representan epsilon simbólico: no agregan mercancía real.
  const basicas = new Set(), parent = Array.from({ length: m + n }, (_, i) => i);
  const raiz = i => parent[i] === i ? i : (parent[i] = raiz(parent[i]));
  function unir(i, j) { const a = raiz(i), b = raiz(m + j); if (a === b) return false; parent[a] = b; basicas.add(i * n + j); return true; }
  X.forEach((r, i) => r.forEach((x, j) => { if (x > EPS) exigir(unir(i, j), 'La solución inicial contiene un ciclo básico inválido.'); }));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (basicas.size < m + n - 1 && unir(i, j)) pasos.push({ texto: `Degeneración: la celda (${i + 1}, ${j + 1}) es básica con epsilon simbólico (valor mostrado 0).` });
  const iteraciones = [];
  for (let iter = 0; ; iter++) {
    exigir(iter < 10000, 'MODI excedió el límite de iteraciones.');
    const u = Array(m).fill(null), v = Array(n).fill(null); u[0] = 0;
    for (let k = 0; k < m + n; k++) basicas.forEach(id => { const i = Math.floor(id / n), j = id % n; if (u[i] !== null && v[j] === null) v[j] = C[i][j] - u[i]; if (v[j] !== null && u[i] === null) u[i] = C[i][j] - v[j]; });
    exigir(u.every(x => x !== null) && v.every(x => x !== null), 'No se pudieron calcular los potenciales MODI.');
    const costosReducidos = C.map((r, i) => r.map((x, j) => basicas.has(i * n + j) ? null : limpiar(x - u[i] - v[j])));
    let entra = null;
    for (let i = 0; i < m && !entra; i++) for (let j = 0; j < n && !entra; j++) if (costosReducidos[i][j] !== null && costosReducidos[i][j] < -EPS) entra = { i, j };
    let ciclo = [];
    if (entra) {
      const adj = Array.from({ length: m + n }, () => []);
      basicas.forEach(id => { const i = Math.floor(id / n), j = id % n; adj[i].push({ nodo: m + j, i, j }); adj[m + j].push({ nodo: i, i, j }); });
      const buscar = (actual, destino, anterior, camino) => { if (actual === destino) return camino; for (const e of adj[actual]) if (e.nodo !== anterior) { const r = buscar(e.nodo, destino, actual, [...camino, { i: e.i, j: e.j }]); if (r) return r; } return null; };
      const camino = buscar(m + entra.j, entra.i, -1, []);
      exigir(camino, 'No se pudo construir el ciclo de transporte.'); ciclo = [entra, ...camino];
    }
    iteraciones.push({ asignacion: copia(X), u: u.map(limpiar), v: v.map(limpiar), costosReducidos, entra, ciclo, costo: costo() });
    if (!entra) break;
    const negativas = ciclo.filter((_, k) => k % 2 === 1);
    const theta = Math.min(...negativas.map(e => X[e.i][e.j]));
    const sale = negativas.filter(e => Math.abs(X[e.i][e.j] - theta) < EPS).sort((a, b) => a.i - b.i || a.j - b.j)[0];
    ciclo.forEach((e, k) => { X[e.i][e.j] = limpiar(X[e.i][e.j] + (k % 2 ? -theta : theta)); });
    basicas.add(entra.i * n + entra.j); basicas.delete(sale.i * n + sale.j);
  }
  return { balanceado: { costos: C, oferta: O, demanda: D, ficticio }, inicial, iteraciones, optimo: { asignacion: copia(X), costo: costo() } };
}

export function resolverTransporte(datos) { return limpiarResultado(resolverTransporteInterno(datos)); }
