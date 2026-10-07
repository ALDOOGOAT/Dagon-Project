import { parseModeloPL } from './parser';
test('Wyndor: multiplicación implícita y no negatividad', () => {
  expect(parseModeloPL('max z = 3x1 + 5x2', ['x1 <= 4', '2x2 ≤ 12', '3x1 + 2x2 <= 18', 'x1, x2 >= 0'])).toEqual({ sentido: 'max', variables: ['x1', 'x2'], c: [3, 5], A: [[1, 0], [0, 2], [3, 2]], ops: ['<=', '<=', '<='], b: [4, 12, 18], noNegativas: ['x1', 'x2'], enteras: [], binarias: [] });
});
test('min, paréntesis, constantes y ambos lados', () => {
  const m = parseModeloPL('min Z=2(x+y)+y', ['x+2 ≥ y+6', 'x+y=10']);
  expect(m.c).toEqual([2, 3]); expect(m.A).toEqual([[1, -1], [1, 1]]); expect(m.b).toEqual([4, 10]);
});
test('orden natural', () => expect(parseModeloPL('max z=x10+x2+x1', []).variables).toEqual(['x1', 'x2', 'x10']));
test.each(['x^2', 'x*y', 'x^3-3x^2+2x', 'sin(x)', 'x/(1+x)'])('rechaza no lineal %s', f => expect(() => parseModeloPL(`max z=${f}`, ['x+y<=5'])).toThrow(/lineal|Fórmula|evaluar/));
test.each([['z=3x', []], ['max z=x', ['x < 2']], ['max z=x+1', []], ['max z=x', null], ['max z=x[1]', []]])('rechaza entrada inválida', (f, r) => expect(() => parseModeloPL(f, r)).toThrow(Error));
