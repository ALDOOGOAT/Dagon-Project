import { parseModeloPL } from './parser';
import { resolverEntero, puntosEnterosFactibles } from './enteros';

describe('programación entera por branch & bound', () => {
  test('entera pura: la relajación (2.25, 3.75) no se redondea; el óptimo entero es (0, 5) con Z = 40', () => {
    const m = parseModeloPL('max z = 5x1 + 8x2', ['x1 + x2 <= 6', '5x1 + 9x2 <= 45', 'x1, x2 >= 0', 'x1, x2 enteras']);
    expect(m.enteras).toEqual(['x1', 'x2']);
    const r = resolverEntero(m);
    expect(r.estado).toBe('optimo');
    expect(r.relajacion.z).toBeCloseTo(41.25, 6);
    expect(r.x).toEqual({ x1: 0, x2: 5 });
    expect(r.z).toBe(40);
    expect(r.nodos[0].rama).toMatch(/Relajación/);
    expect(r.nodos.filter((n) => n.optimo)).toHaveLength(1);
  });

  test('binaria (mochila): elige y2, y3, y4 con Z = 21', () => {
    const m = parseModeloPL('max z = 8y1 + 11y2 + 6y3 + 4y4', ['5y1 + 7y2 + 4y3 + 3y4 <= 14', 'y1, y2, y3, y4 binarias']);
    const r = resolverEntero(m);
    expect(r.x).toEqual({ y1: 0, y2: 1, y3: 1, y4: 1 });
    expect(r.z).toBe(21);
  });

  test('mixta: solo x1 entera, x2 continua', () => {
    const m = parseModeloPL('max z = x1 + x2', ['2x1 + 2x2 <= 5', 'x1 - x2 <= 0.5', 'x1, x2 >= 0']);
    const r = resolverEntero(m, { enteras: ['x1'] });
    expect(Number.isInteger(r.x.x1)).toBe(true);
    expect(r.z).toBeCloseTo(2.5, 6);
  });

  test('sin punto entero factible: infactible', () => {
    const m = parseModeloPL('max z = x1', ['x1 >= 0.2', 'x1 <= 0.8', 'x1 entera']);
    expect(resolverEntero(m).estado).toBe('infactible');
  });

  test('minimización entera', () => {
    const m = parseModeloPL('min z = 3x1 + 2x2', ['x1 + x2 >= 3.5', 'x1 + 3x2 >= 4.2', 'x1, x2 enteros']);
    const r = resolverEntero(m);
    expect(r.estado).toBe('optimo');
    expect(r.z).toBe(8);
  });

  test('coincide con fuerza bruta en modelos aleatorios de dos variables', () => {
    let semilla = 7;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    for (let caso = 0; caso < 40; caso++) {
      const c = [1 + Math.floor(azar() * 9), 1 + Math.floor(azar() * 9)];
      const filas = Array.from({ length: 3 }, () => [1 + Math.floor(azar() * 8), 1 + Math.floor(azar() * 8), 10 + Math.floor(azar() * 40)]);
      const m = parseModeloPL(`max z = ${c[0]}x1 + ${c[1]}x2`, [...filas.map(([a, b, d]) => `${a}x1 + ${b}x2 <= ${d + 0.5}`), 'x1, x2 enteras']);
      const r = resolverEntero(m);
      const puntos = puntosEnterosFactibles(m, { xmax: 60, ymax: 60 }, 5000);
      const mejor = Math.max(...puntos.map((p) => p.z));
      expect(r.z).toBeCloseTo(mejor, 6);
    }
  });
});
