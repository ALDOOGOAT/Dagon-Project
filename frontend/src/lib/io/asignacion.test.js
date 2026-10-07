import { resolverAsignacion } from './asignacion';
const M = [[82, 83, 69, 92], [77, 37, 49, 92], [11, 69, 5, 86], [8, 9, 98, 23]];
test('húngaro 4x4: costo 140', () => { const s = resolverAsignacion({ matriz: M, objetivo: 'min' }); expect(s.total).toBe(140); expect(s.asignacion).toHaveLength(4); expect(new Set(s.asignacion.map(a => a.columna)).size).toBe(4); expect(s.pasos.some(p => p.cubiertas !== null)).toBe(true); });
test('maximización', () => { const s = resolverAsignacion({ matriz: [[4, 1], [2, 3]], objetivo: 'max' }); expect(s.total).toBe(7); });
test.each([{ matriz: [[1, 10, 20], [10, 2, 30]] }, { matriz: [[1, 10], [10, 2], [20, 30]] }])('relleno rectangular cero', ({ matriz }) => { const s = resolverAsignacion({ matriz, objetivo: 'min' }); expect(s.total).toBe(3); expect(s.asignacion).toHaveLength(2); expect(s.pasos[0].matriz).toHaveLength(3); });
test('costos negativos y ceros empatados', () => { expect(resolverAsignacion({ matriz: [[-5, 0], [0, -3]], objetivo: 'min' }).total).toBe(-8); expect(resolverAsignacion({ matriz: [[0, 0], [0, 0]], objetivo: 'max' }).total).toBe(0); });
test.each([{ matriz: [], objetivo: 'min' }, { matriz: [[1], [2, 3]], objetivo: 'min' }, { matriz: [[1]], objetivo: 'otro' }])('valida datos', datos => expect(() => resolverAsignacion(datos)).toThrow(Error));
