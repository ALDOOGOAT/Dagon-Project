import { resolverTransporte } from './transporte';
const datos = { costos: [[10, 2, 20, 11], [12, 7, 9, 20], [4, 14, 16, 18]], oferta: [15, 25, 10], demanda: [5, 15, 15, 15] };
function verificar(s) {
  const { oferta, demanda } = s.balanceado, X = s.optimo.asignacion;
  X.forEach((r, i) => expect(r.reduce((a, x) => a + x, 0)).toBeCloseTo(oferta[i])); demanda.forEach((d, j) => expect(X.reduce((a, r) => a + r[j], 0)).toBeCloseTo(d));
  expect(X.flat().every(x => x >= 0)).toBe(true); expect(s.iteraciones.at(-1).entra).toBeNull(); expect(s.iteraciones.at(-1).costosReducidos.flat().every(x => x === null || x >= -1e-8)).toBe(true);
}
test.each(['vogel', 'noroeste', 'costo_minimo'])('ejemplo de Taha, %s + MODI: 435', metodo => { const s = resolverTransporte({ ...datos, metodo }); expect(s.optimo.costo).toBeCloseTo(435); verificar(s); expect(s.inicial.pasos.length).toBeGreaterThan(0); });
test('fila ficticia', () => { const s = resolverTransporte({ costos: [[1, 5]], oferta: [3], demanda: [2, 3], metodo: 'vogel' }); expect(s.balanceado.ficticio).toBe('fila'); expect(s.optimo.costo).toBe(7); verificar(s); });
test('columna ficticia y degeneración', () => { const s = resolverTransporte({ costos: [[1, 8], [8, 1]], oferta: [4, 4], demanda: [2, 2], metodo: 'noroeste' }); expect(s.balanceado.ficticio).toBe('columna'); expect(s.optimo.costo).toBe(4); verificar(s); });
test('degeneración sin alterar cantidades', () => { const s = resolverTransporte({ costos: [[2, 1], [1, 2]], oferta: [5, 5], demanda: [5, 5], metodo: 'noroeste' }); expect(s.optimo.costo).toBe(10); expect(s.inicial.pasos.some(p => p.texto.includes('epsilon'))).toBe(true); verificar(s); });
test('oferta y demanda cero', () => { const s = resolverTransporte({ costos: [[1, 2], [3, 4]], oferta: [0, 0], demanda: [0, 0], metodo: 'vogel' }); expect(s.optimo.costo).toBe(0); verificar(s); });
test('no muta entradas', () => { const prev = JSON.stringify(datos); resolverTransporte({ ...datos, metodo: 'vogel' }); expect(JSON.stringify(datos)).toBe(prev); });
test.each([{ ...datos, metodo: 'otro' }, { ...datos, oferta: [-1, 2, 3], metodo: 'vogel' }, { ...datos, demanda: [1], metodo: 'vogel' }])('entrada inválida', d => expect(() => resolverTransporte(d)).toThrow(Error));
