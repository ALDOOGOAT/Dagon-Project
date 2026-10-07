import { limpiarResultado, limpiar, resolverSistema, validarModelo, matriz } from './util';
test('limpia epsilon y -0', () => { expect(limpiar(1e-10)).toBe(0); expect(Object.is(limpiar(-0), -0)).toBe(false); });
test('eliminación gaussiana con intercambio', () => expect(resolverSistema([[0, 2], [1, 1]], [4, 3])).toEqual([1, 2]));
test('singularidad y validación', () => { expect(() => resolverSistema([[1, 1], [2, 2]], [1, 2])).toThrow(/singular/); expect(() => validarModelo(null)).toThrow(/sentido/); expect(() => matriz([[NaN]])).toThrow(/finito/); });

test('limpieza de resultados anidados', () => expect(limpiarResultado({ x: -0, pasos: [{ y: -1e-10 }], min: -Infinity })).toEqual({ x: 0, pasos: [{ y: 0 }], min: -Infinity }));
