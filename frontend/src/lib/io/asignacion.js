import { limpiarResultado } from './util';
import { EPS, copia, exigir, limpiar, matriz } from './util';
function resolverAsignacionInterno(datos) {
  exigir(datos && typeof datos === 'object', 'Indique una matriz y el objetivo.');
  const { matriz: entrada, objetivo } = datos;
  matriz(entrada); exigir(['min', 'max'].includes(objetivo), 'El objetivo debe ser min o max.');
  const f = entrada.length, c = entrada[0].length, n = Math.max(f, c);
  const original = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i < f && j < c ? entrada[i][j] : 0));
  const mayor = Math.max(...original.flat()), M = original.map(r => r.map(x => objetivo === 'max' ? mayor - x : x));
  const pasos = [], guardar = (titulo, filas = null, columnas = null) => pasos.push({ titulo, matriz: copia(M), cubiertas: filas === null ? null : { filas: [...filas], columnas: [...columnas] } });
  guardar(n !== f || n !== c ? 'Matriz cuadrada con tareas ficticias de costo cero' : 'Matriz inicial');
  if (objetivo === 'max') guardar('Conversión de maximización a minimización');
  M.forEach(r => { const minimo = Math.min(...r); r.forEach((x, j) => { r[j] = limpiar(x - minimo); }); }); guardar('Restar el mínimo de cada fila');
  for (let j = 0; j < n; j++) { const minimo = Math.min(...M.map(r => r[j])); M.forEach(r => { r[j] = limpiar(r[j] - minimo); }); } guardar('Restar el mínimo de cada columna');
  const estrellas = Array(n).fill(-1), primas = Array(n).fill(-1), usadas = new Set();
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (Math.abs(M[i][j]) < EPS && estrellas[i] < 0 && !usadas.has(j)) { estrellas[i] = j; usadas.add(j); }
  let filas = new Set(), columnas = new Set(estrellas.filter(j => j >= 0));
  for (let iter = 0; columnas.size < n; iter++) {
    exigir(iter < 10000, 'El método húngaro excedió el límite de iteraciones.');
    guardar('Cubrir las columnas con ceros asignados', [...filas], [...columnas]);
    let cero = null;
    for (let i = 0; i < n && !cero; i++) for (let j = 0; j < n && !cero; j++) if (!filas.has(i) && !columnas.has(j) && Math.abs(M[i][j]) < EPS) cero = { i, j };
    if (!cero) {
      let minimo = Infinity;
      M.forEach((r, i) => r.forEach((x, j) => { if (!filas.has(i) && !columnas.has(j)) minimo = Math.min(minimo, x); }));
      exigir(Number.isFinite(minimo) && minimo > 0, 'No se encontró un ajuste válido de la matriz húngara.');
      M.forEach((r, i) => r.forEach((x, j) => { r[j] = limpiar(x + (filas.has(i) ? minimo : 0) - (!columnas.has(j) ? minimo : 0)); }));
      guardar(`Restar ${minimo} de las celdas no cubiertas y sumar en las intersecciones`, [...filas], [...columnas]); continue;
    }
    primas[cero.i] = cero.j;
    if (estrellas[cero.i] >= 0) { filas.add(cero.i); columnas.delete(estrellas[cero.i]); continue; }
    const camino = [cero];
    while (true) {
      const j = camino[camino.length - 1].j, i = estrellas.indexOf(j);
      if (i < 0) break;
      camino.push({ i, j }); camino.push({ i, j: primas[i] });
    }
    camino.forEach((e, k) => { if (k % 2 === 1) estrellas[e.i] = -1; });
    camino.forEach((e, k) => { if (k % 2 === 0) estrellas[e.i] = e.j; });
    primas.fill(-1); filas = new Set(); columnas = new Set(estrellas.filter(j => j >= 0));
    guardar('Alternar asignaciones en el camino de ceros', [], [...columnas]);
  }
  guardar('Asignación óptima', [], [...columnas]);
  const asignacion = estrellas.map((columna, fila) => ({ fila, columna, costo: original[fila][columna] })).filter(e => e.fila < f && e.columna < c);
  return { asignacion, total: limpiar(asignacion.reduce((s, e) => s + e.costo, 0)), pasos };
}

export function resolverAsignacion(datos) { return limpiarResultado(resolverAsignacionInterno(datos)); }
