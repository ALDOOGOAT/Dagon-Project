import { resolverCPM, resolverPERT } from './redes';
const actividades = [
  { id: 'A', predecesoras: [], duracion: 3 }, { id: 'B', predecesoras: [], duracion: 2 }, { id: 'C', predecesoras: ['A'], duracion: 4 }, { id: 'D', predecesoras: ['A'], duracion: 2 }, { id: 'E', predecesoras: ['B', 'C'], duracion: 3 }, { id: 'F', predecesoras: ['D', 'E'], duracion: 2 }
];
test('CPM: recorrido hacia delante y hacia atrás', () => { const s = resolverCPM(actividades); expect(s.duracion).toBe(12); expect(s.rutaCritica).toEqual(['A', 'C', 'E', 'F']); expect(s.actividades.find(a => a.id === 'D').holgura).toBe(5); expect(s.actividades.find(a => a.id === 'E').ES).toBe(7); });
test('orden de entrada independiente y rutas múltiples', () => { const s = resolverCPM([{ id: 'C', predecesoras: ['A', 'B'], duracion: 1 }, { id: 'A', predecesoras: [], duracion: 2 }, { id: 'B', predecesoras: [], duracion: 2 }]); expect(s.rutasCriticas).toEqual([['A', 'C'], ['B', 'C']]); });
test('PERT y probabilidad normal', () => { const s = resolverPERT([{ id: 'A', predecesoras: [], a: 1, m: 2, b: 3 }, { id: 'B', predecesoras: ['A'], a: 2, m: 3, b: 4 }], 5); expect(s.duracion).toBe(5); expect(s.varianzaRuta).toBeCloseTo(2 / 9); expect(s.probabilidad).toBeCloseTo(0.5, 6); expect(s.actividades[0].te).toBe(2); });
test('PERT sin plazo y determinista', () => { const a = [{ id: 'A', predecesoras: [], a: 2, m: 2, b: 2 }]; expect(resolverPERT(a).probabilidad).toBeNull(); expect(resolverPERT(a, 2).probabilidad).toBe(1); expect(resolverPERT(a, 1).probabilidad).toBe(0); });
test('probabilidad una desviación sobre la media', () => expect(resolverPERT([{ id: 'A', predecesoras: [], a: 0, m: 3, b: 6 }], 4).probabilidad).toBeCloseTo(0.8413447, 6));
test.each([[{ id: 'A', predecesoras: ['B'], duracion: 1 }], [{ id: 'A', predecesoras: ['B'], duracion: 1 }, { id: 'B', predecesoras: ['A'], duracion: 1 }], [{ id: 'A', predecesoras: [], duracion: -1 }]])('red inválida', a => expect(() => resolverCPM(a)).toThrow(Error));
test('estimaciones PERT invertidas', () => expect(() => resolverPERT([{ id: 'A', predecesoras: [], a: 3, m: 2, b: 1 }])).toThrow(/a ≤ m ≤ b/));
