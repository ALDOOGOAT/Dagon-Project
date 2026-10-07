import { limpiarResultado } from './util';
import { exigir, limpiar, matriz, numero } from './util';
function validar(P) {
  matriz(P, 'La matriz de transición'); exigir(P.every(r => r.length === P.length), 'La matriz de transición debe ser cuadrada.');
  P.forEach(r => { r.forEach(x => exigir(x >= 0 && x <= 1, 'Las probabilidades deben estar entre 0 y 1.')); exigir(Math.abs(r.reduce((s, x) => s + x, 0) - 1) <= 1e-6, 'Cada fila de la matriz debe sumar 1 (tolerancia 0.000001).'); });
  return P.map(r => { const s = r.reduce((a, x) => a + x, 0); return r.map(x => x / s); });
}
function pasosInterno(datos) {
  exigir(datos && typeof datos === 'object', 'Indique P, inicial y n.'); const { P, inicial, n } = datos, T = validar(P);
  exigir(Array.isArray(inicial) && inicial.length === P.length, 'La distribución inicial tiene una dimensión incorrecta.');
  inicial.forEach(x => { numero(x, 'La probabilidad inicial', 0); exigir(x <= 1, 'Las probabilidades iniciales no pueden exceder 1.'); });
  const total = inicial.reduce((s, x) => s + x, 0); exigir(Math.abs(total - 1) <= 1e-6, 'La distribución inicial debe sumar 1.');
  exigir(Number.isInteger(n) && n >= 0 && n <= 100000, 'El número de pasos debe ser un entero entre 0 y 100000.');
  const historial = [inicial.map(x => limpiar(x / total))];
  for (let k = 0; k < n; k++) historial.push(T.map((_, j) => limpiar(T.reduce((s, r, i) => s + historial[k][i] * r[j], 0))));
  return { historial };
}
function estableInterno(P) {
  const T = validar(P), n = T.length;
  const A = T.map((_, j) => [...T.map((r, i) => r[j] - (i === j ? 1 : 0)), 0]); A.push([...Array(n).fill(1), 1]);
  const pasos = [{ texto: 'Formar las ecuaciones πP = π y agregar la normalización Σπᵢ = 1.' }];
  let fila = 0; const pivotes = [];
  for (let j = 0; j < n; j++) {
    let p = fila; for (let i = fila; i < A.length; i++) if (Math.abs(A[i][j]) > Math.abs(A[p][j])) p = i;
    if (Math.abs(A[p][j]) < 1e-12) continue;
    [A[fila], A[p]] = [A[p], A[fila]]; const d = A[fila][j]; A[fila] = A[fila].map(x => x / d);
    for (let i = 0; i < A.length; i++) if (i !== fila) { const f = A[i][j]; A[i] = A[i].map((x, k) => x - f * A[fila][k]); }
    pivotes.push(j); pasos.push({ texto: `Eliminar la columna ${j + 1} usando la fila ${fila + 1}.` }); fila++;
  }
  const pi = Array(n).fill(0); pivotes.forEach((j, i) => { pi[j] = limpiar(A[i][n]); });
  exigir(pi.every(x => x >= -1e-8) && Math.abs(pi.reduce((s, x) => s + x, 0) - 1) < 1e-6, 'No se pudo calcular una distribución estacionaria válida.');
  if (pivotes.length < n) pasos.push({ texto: 'Existen varias distribuciones estacionarias; se fijaron las variables libres en cero para obtener una de ellas.' });
  const total = pi.reduce((s, x) => s + x, 0);
  return { pi: pi.map(x => limpiar(Math.max(0, x) / total)), pasos };
}

export function pasos(datos) { return limpiarResultado(pasosInterno(datos)); }

export function estable(P) { return limpiarResultado(estableInterno(P)); }
