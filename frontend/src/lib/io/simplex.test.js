import { parseModeloPL } from './parser';
import { resolverSimplex } from './simplex';
const solve = (o, r) => resolverSimplex(parseModeloPL(o, r));
test('Wyndor: primal, dual, tablas y sensibilidad', () => {
  const s = solve('max z=3x1+5x2', ['x1<=4', '2x2<=12', '3x1+2x2<=18']);
  expect(s.estado).toBe('optimo'); expect(s.z).toBeCloseTo(36); expect(s.x).toEqual({ x1: 2, x2: 6 });
  expect(s.duales).toEqual([0, 1.5, 1]); expect(s.holguras.s_1).toBeCloseTo(2); expect(s.multiple).toBe(false);
  expect(s.tablas.length).toBeGreaterThan(1); expect(s.tablas[0].pivote).toEqual({ fila: 0, col: 0 }); expect(s.tablas.at(-1).pivote).toBeNull();
  expect(s.sensibilidad.b[1]).toEqual({ actual: 12, min: 6, max: 18 }); expect(s.sensibilidad.c[0].min).toBeCloseTo(0); expect(s.sensibilidad.c[0].max).toBeCloseTo(7.5);
});
test('minimización con excedentes y artificiales', () => {
  const s = solve('min z=2x+3y', ['x+y>=4', 'x+3y>=6']);
  expect(s.estado).toBe('optimo'); expect(s.z).toBeCloseTo(9); expect(s.x).toEqual({ x: 3, y: 1 }); expect(s.duales[0]).toBeCloseTo(1.5); expect(s.duales[1]).toBeCloseTo(0.5);
  expect(s.tablas[0].encabezados).toContain('a_1');
});
test('Big-M simbólico admite objetivos mayores que una M fija', () => expect(solve('min z=1000000000000x', ['x>=1']).z).toBe(1e12));
test('igualdad redundante y término independiente negativo', () => {
  const s = solve('min z=x+y', ['x+y=3', '2x+2y=6', '-x<=-1']); expect(s.estado).toBe('optimo'); expect(s.z).toBeCloseTo(3); expect(s.multiple).toBe(true);
});
test('infactible', () => { const s = solve('max z=x', ['x<=1', 'x>=2']); expect(s.estado).toBe('infactible'); expect(s.z).toBeNull(); });
test('igualdad infactible', () => expect(solve('max z=x', ['0x=1']).estado).toBe('infactible'));
test('no acotado', () => { const s = solve('max z=x+y', ['x-y>=1']); expect(s.estado).toBe('no_acotado'); expect(s.z).toBeNull(); });
test('sin restricciones', () => { expect(solve('max z=x', []).estado).toBe('no_acotado'); expect(solve('min z=x', []).z).toBe(0); });
test('soluciones múltiples', () => expect(solve('max z=x+y', ['x+y<=4']).multiple).toBe(true));
test('Bland evita el ciclo clásico de Beale', () => {
  const s = solve('max z=10x1-57x2-9x3-24x4', ['0.5x1-5.5x2-2.5x3+9x4<=0', '0.5x1-1.5x2-0.5x3+x4<=0', 'x1<=1']);
  expect(s.z).toBeCloseTo(1); expect(s.tablas.length).toBeLessThan(30);
});
test('variable libre declarada en el modelo', () => { const m = parseModeloPL('min z=x', ['x>=-3']); m.noNegativas = []; expect(resolverSimplex(m).x.x).toBeCloseTo(-3); });
test('no modifica el modelo', () => { const m = parseModeloPL('max z=x', ['x<=2']), previo = JSON.stringify(m); resolverSimplex(m); expect(JSON.stringify(m)).toBe(previo); });
test('dimensiones inválidas', () => expect(() => resolverSimplex({ sentido: 'max', variables: ['x'], c: [1], A: [[1, 2]], b: [1], ops: ['<='], noNegativas: ['x'] })).toThrow(/coeficiente/));
