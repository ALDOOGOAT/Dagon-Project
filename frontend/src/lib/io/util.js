// Utilidades numéricas compartidas; no dependen de React ni de mathjs.
export const EPS = 1e-9;
export const limpiar = x => Math.abs(x) < EPS || Object.is(x, -0) ? 0 : x;
export function exigir(ok, mensaje) { if (!ok) throw new Error(mensaje); }
export function numero(x, nombre, minimo = -Infinity, estricto = false) {
  exigir(typeof x === 'number' && Number.isFinite(x) && (estricto ? x > minimo : x >= minimo), `${nombre} debe ser un número finito ${estricto ? 'mayor que' : 'mayor o igual que'} ${minimo}.`);
  return x;
}
export function matriz(M, nombre = 'La matriz') {
  exigir(Array.isArray(M) && M.length > 0 && Array.isArray(M[0]) && M[0].length > 0, `${nombre} debe tener filas y columnas.`);
  M.forEach(r => { exigir(Array.isArray(r) && r.length === M[0].length, `${nombre} debe ser rectangular.`); r.forEach(x => numero(x, nombre)); });
  return M;
}
export const copia = M => M.map(r => [...r]);
export const producto = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export function resolverSistema(A, b) {
  const n = b.length;
  exigir(A.length === n && A.every(r => r.length === n), 'El sistema debe ser cuadrado.');
  const T = A.map((r, i) => [...r, b[i]]);
  for (let j = 0; j < n; j++) {
    let p = j;
    for (let i = j + 1; i < n; i++) if (Math.abs(T[i][j]) > Math.abs(T[p][j])) p = i;
    exigir(Math.abs(T[p][j]) > 1e-12, 'El sistema es singular; no existe una solución única.');
    [T[p], T[j]] = [T[j], T[p]];
    const d = T[j][j]; T[j] = T[j].map(x => x / d);
    for (let i = 0; i < n; i++) if (i !== j) { const f = T[i][j]; T[i] = T[i].map((x, k) => x - f * T[j][k]); }
  }
  return T.map(r => limpiar(r[n]));
}
export function validarModelo(m) {
  exigir(m && ['max', 'min'].includes(m.sentido), 'El sentido debe ser max o min.');
  exigir(Array.isArray(m.variables) && m.variables.length > 0 && new Set(m.variables).size === m.variables.length && m.variables.every(v => typeof v === 'string' && v.length), 'Las variables deben ser nombres únicos.');
  exigir(Array.isArray(m.c) && m.c.length === m.variables.length, 'El objetivo debe tener un coeficiente por variable.');
  m.c.forEach(x => numero(x, 'El coeficiente'));
  exigir(Array.isArray(m.A) && Array.isArray(m.b) && Array.isArray(m.ops) && m.A.length === m.b.length && m.b.length === m.ops.length, 'Las restricciones tienen dimensiones incompatibles.');
  m.A.forEach(r => { exigir(Array.isArray(r) && r.length === m.c.length, 'Cada restricción debe tener un coeficiente por variable.'); r.forEach(x => numero(x, 'El coeficiente')); });
  m.b.forEach(x => numero(x, 'El término independiente'));
  exigir(m.ops.every(x => ['<=', '>=', '='].includes(x)), 'Operador de restricción inválido.');
  exigir(Array.isArray(m.noNegativas) && m.noNegativas.every(v => m.variables.includes(v)), 'La lista de variables no negativas es inválida.');
}

// Autovalores de una matriz simétrica pequeña (Jacobi cíclico). Clasifica Hessianos.
export function autovaloresSimetrica(M) {
  const n = M.length, A = copia(M);
  for (let barrido = 0; barrido < 100; barrido++) {
    let fuera = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) fuera += A[p][q] ** 2;
    if (fuera < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = A[k][p], akq = A[k][q];
        A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p][k], aqk = A[q][k];
        A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk;
      }
    }
  }
  return A.map((r, i) => r[i]).sort((a, b) => a - b);
}

// Curva de nivel f(x,y)=nivel por marching squares. Devuelve puntos con cortes {y:null}
// entre segmentos, listos para una <Line> de Recharts sin connectNulls.
export function curvaNivel(f, nivel, [x0, x1], [y0, y1], n = 60) {
  const hx = (x1 - x0) / n, hy = (y1 - y0) / n, puntos = [];
  const valor = (i, j) => { try { const v = f(x0 + i * hx, y0 + j * hy); return Number.isFinite(v) ? v - nivel : NaN; } catch (_) { return NaN; } };
  const V = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (__, j) => valor(i, j)));
  const cruce = (xa, ya, va, xb, yb, vb) => { const t = va / (va - vb); return { x: xa + t * (xb - xa), y: ya + t * (yb - ya) }; };
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const esquinas = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => ({ x: x0 + a * hx, y: y0 + b * hy, v: V[a][b] }));
    if (esquinas.some((e) => Number.isNaN(e.v))) continue;
    const cortes = [];
    for (let k = 0; k < 4; k++) {
      const a = esquinas[k], b = esquinas[(k + 1) % 4];
      if ((a.v < 0) !== (b.v < 0)) cortes.push(cruce(a.x, a.y, a.v, b.x, b.y, b.v));
    }
    for (let k = 0; k + 1 < cortes.length; k += 2) puntos.push(cortes[k], cortes[k + 1], { x: cortes[k + 1].x, y: null });
  }
  return puntos;
}

// Limpiar únicamente al devolver resultados; los cálculos conservan toda su precisión.
export function limpiarResultado(valor) {
  if (typeof valor === 'number') return limpiar(valor);
  if (Array.isArray(valor)) return valor.map(limpiarResultado);
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, limpiarResultado(v)]));
  return valor;
}
