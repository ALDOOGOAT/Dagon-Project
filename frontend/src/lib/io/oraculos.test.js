import { resolverSimplex } from './simplex';
import { resolverAsignacion } from './asignacion';
import { resolverTransporte } from './transporte';

// Oráculos independientes: enumeración de vértices y soluciones enteras pequeñas.
// No reutilizan pivotes, potenciales MODI ni reducciones del método húngaro.
let semilla = 20261005;
const entero = (max) => {
  semilla = (Math.imul(1664525, semilla) + 1013904223) >>> 0;
  return semilla % max;
};

function vertices(modelo) {
  const rectas = modelo.A.map((a, i) => [...a, modelo.b[i]]);
  rectas.push([1, 0, 0], [0, 1, 0]);
  const candidatos = [];
  rectas.forEach(([a, b, c], i) => rectas.slice(i + 1).forEach(([d, e, f]) => {
    const det = a * e - b * d;
    if (Math.abs(det) < 1e-10) return;
    const x = (c * e - b * f) / det, y = (a * f - c * d) / det;
    if (x < -1e-8 || y < -1e-8) return;
    if (modelo.A.every((r, j) => modelo.ops[j] === '<='
      ? r[0] * x + r[1] * y <= modelo.b[j] + 1e-8
      : r[0] * x + r[1] * y >= modelo.b[j] - 1e-8)) {
      candidatos.push(modelo.c[0] * x + modelo.c[1] * y);
    }
  }));
  return candidatos;
}

test('Simplex coincide con vértices independientes en 160 modelos acotados', () => {
  for (let k = 0; k < 160; k++) {
    const modelo = {
      sentido: k % 2 ? 'min' : 'max', variables: ['x', 'y'], noNegativas: ['x', 'y'],
      c: [entero(19) - 9, entero(19) - 9],
      A: [[1, 0], [0, 1], [1 + entero(5), 1 + entero(5)], [1 + entero(4), 1 + entero(4)]],
      b: [4 + entero(6), 4 + entero(6), 2 + entero(20), 1 + entero(8)],
      ops: ['<=', '<=', '<=', k % 3 ? '<=' : '>='],
    };
    const valores = vertices(modelo), resultado = resolverSimplex(modelo);
    if (!valores.length) expect(resultado.estado).toBe('infactible');
    else {
      expect(resultado.estado).toBe('optimo');
      const esperado = modelo.sentido === 'max' ? Math.max(...valores) : Math.min(...valores);
      expect(resultado.z).toBeCloseTo(esperado, 7);
    }
  }
});

function permutaciones(xs) {
  if (!xs.length) return [[]];
  return xs.flatMap((x, i) => permutaciones(xs.filter((_, j) => j !== i)).map(p => [x, ...p]));
}

test('Húngaro coincide con todas las permutaciones de 40 matrices', () => {
  for (let k = 0; k < 40; k++) {
    const matriz = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => entero(30) - 10));
    const costos = permutaciones([0, 1, 2, 3]).map(p => p.reduce((s, j, i) => s + matriz[i][j], 0));
    expect(resolverAsignacion({ matriz, objetivo: 'min' }).total).toBe(Math.min(...costos));
    expect(resolverAsignacion({ matriz, objetivo: 'max' }).total).toBe(Math.max(...costos));
  }
});

test('MODI coincide con enumeración exhaustiva de 60 transportes 2 por 3', () => {
  for (let k = 0; k < 60; k++) {
    const demanda = [1 + entero(4), 1 + entero(4), 1 + entero(4)];
    const total = demanda.reduce((s, x) => s + x, 0), oferta = [entero(total + 1)];
    oferta.push(total - oferta[0]);
    const costos = Array.from({ length: 2 }, () => Array.from({ length: 3 }, () => entero(16) - 3));
    let esperado = Infinity;
    for (let a = 0; a <= demanda[0]; a++) for (let b = 0; b <= demanda[1]; b++) {
      const c = oferta[0] - a - b;
      if (c < 0 || c > demanda[2]) continue;
      const primera = [a, b, c];
      const costo = primera.reduce((s, x, j) => s + x * costos[0][j] + (demanda[j] - x) * costos[1][j], 0);
      esperado = Math.min(esperado, costo);
    }
    for (const metodo of ['vogel', 'noroeste', 'costo_minimo']) {
      expect(resolverTransporte({ costos, oferta, demanda, metodo }).optimo.costo).toBeCloseTo(esperado, 8);
    }
  }
});
