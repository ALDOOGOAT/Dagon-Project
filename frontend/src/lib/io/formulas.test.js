import { expresion, evaluar } from './formulas';
test('funciones permitidas y multiplicación implícita', () => expect(evaluar(expresion('2x+sin(pi/2)', ['x']), { x: 3 })).toBeCloseTo(7));
test.each(['x=2', 'import("x")', '[1,2]', 'x.constructor', 'random()', 'foo+x'])('rechaza operaciones ajenas a una fórmula: %s', f => expect(() => expresion(f, ['x'])).toThrow(Error));
test('resultado real y finito', () => expect(() => evaluar(expresion('sqrt(x)', ['x']), { x: -1 })).toThrow(/real finito/));
