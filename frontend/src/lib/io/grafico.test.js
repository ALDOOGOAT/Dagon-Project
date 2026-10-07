import { parseModeloPL } from './parser';
import { resolverGrafico } from './grafico';
test('polígono Wyndor CCW y óptimo', () => {
  const s = resolverGrafico(parseModeloPL('max z=3x+5y', ['x<=4', '2y<=12', '3x+2y<=18'])); expect(s.optimo).toEqual({ x: 2, y: 6, z: 36 });
  const area = s.region.reduce((a, p, i, ps) => a + p.x * ps[(i + 1) % ps.length].y - p.y * ps[(i + 1) % ps.length].x, 0);
  expect(area).toBeGreaterThan(0); expect(s.region).toHaveLength(5); expect(s.isoZ).toEqual({ a1: 3, a2: 5, valor: 36 });
});
test('región no acotada recortada', () => { const s = resolverGrafico(parseModeloPL('max z=x+y', ['x+y>=1'])); expect(s.estado).toBe('no_acotado'); expect(s.optimo).toBeNull(); expect(s.region.length).toBeGreaterThan(0); expect(s.region.every(p => p.x <= s.limites.xmax && p.y <= s.limites.ymax)).toBe(true); });
test('infactible', () => { const s = resolverGrafico(parseModeloPL('max z=x+y', ['x+y<=1', 'x+y>=2'])); expect(s.region).toEqual([]); expect(s.estado).toBe('infactible'); });
test('igualdad: región en forma de segmento', () => { const s = resolverGrafico(parseModeloPL('min z=x+y', ['x+y=4'])); expect(s.region.every(p => Math.abs(p.x + p.y - 4) < 1e-8)).toBe(true); expect(s.optimo.z).toBe(4); });
test('exactamente dos variables', () => expect(() => resolverGrafico(parseModeloPL('max z=x', []))).toThrow(/dos variables/));
