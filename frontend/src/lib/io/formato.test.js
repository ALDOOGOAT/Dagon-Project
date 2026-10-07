import { aFraccion, redondear } from './formato';
test.each([[0.75, '3/4'], [2, '2'], [-0.75, '-3/4'], [1 / 3, '1/3'], [0, '0'], [-1e-12, '0']])('fracción de %s', (x, s) => expect(aFraccion(x)).toBe(s));
test('fracción continua con denominador limitado', () => { expect(aFraccion(Math.PI, 1000)).toBe('355/113'); expect(aFraccion(Math.PI, 10)).toBe('22/7'); expect(aFraccion(0.4, 1)).toBe('0'); });
test('redondeo y limpieza numérica', () => { expect(redondear(1.234567)).toBe(1.2346); expect(redondear(-1e-12)).toBe(0); expect(Object.is(redondear(-0), -0)).toBe(false); });
test.each([() => aFraccion(Infinity), () => aFraccion(1, 0), () => redondear(NaN), () => redondear(1, -1)])('validación', f => expect(f).toThrow(Error));
