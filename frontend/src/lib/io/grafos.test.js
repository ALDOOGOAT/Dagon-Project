import { rutaMasCorta, arbolExpansionMinima, flujoMaximo } from './grafos';
import { criteriosIncertidumbre, decisionRiesgo, juegoSumaCero } from './decisiones';

// Red de Seervada Park (Hillier-Lieberman): distancias en millas.
const seervada = [
  ['O', 'A', 2], ['O', 'B', 5], ['O', 'C', 4], ['A', 'B', 2], ['A', 'D', 7], ['B', 'C', 1],
  ['B', 'D', 4], ['B', 'E', 3], ['C', 'E', 4], ['D', 'E', 1], ['D', 'T', 5], ['E', 'T', 7],
].map(([origen, destino, valor]) => ({ origen, destino, valor }));

describe('grafos', () => {
  test('ruta más corta O→T = 13', () => {
    const r = rutaMasCorta({ aristas: seervada, origen: 'O', destino: 'T' });
    expect(r.distancia).toBe(13);
    expect(r.ruta[0]).toBe('O');
    expect(r.ruta[r.ruta.length - 1]).toBe('T');
    expect(r.aristasSolucion.reduce((a, i) => a + seervada[i].valor, 0)).toBe(13);
  });

  test('árbol de expansión mínima = 14 con 6 aristas', () => {
    const r = arbolExpansionMinima({ aristas: seervada });
    expect(r.total).toBe(14);
    expect(r.aristasSolucion).toHaveLength(6);
    expect(r.conexo).toBe(true);
  });

  test('flujo máximo dirigido = 14 y el corte mínimo tiene la misma capacidad', () => {
    const red = [
      ['O', 'A', 5], ['O', 'B', 7], ['O', 'C', 4], ['A', 'B', 1], ['A', 'D', 3], ['B', 'C', 2],
      ['B', 'D', 4], ['B', 'E', 5], ['C', 'E', 4], ['D', 'T', 9], ['E', 'D', 1], ['E', 'T', 6],
    ].map(([origen, destino, valor]) => ({ origen, destino, valor }));
    const r = flujoMaximo({ aristas: red, origen: 'O', destino: 'T' });
    expect(r.flujoMaximo).toBe(14);
    expect(r.corteMinimo.reduce((a, i) => a + red[i].valor, 0)).toBe(14);
  });

  test('sin ruta posible', () => {
    expect(() => rutaMasCorta({ aristas: [{ origen: 'A', destino: 'B', valor: 1 }, { origen: 'C', destino: 'D', valor: 1 }], origen: 'A', destino: 'D' })).toThrow(/No existe una ruta/);
  });
});

describe('teoría de decisiones', () => {
  const tabla = { alternativas: ['A1', 'A2', 'A3'], estados: ['Alta', 'Media', 'Baja'], pagos: [[50, 20, -10], [30, 25, 15], [10, 10, 10]] };

  test('criterios bajo incertidumbre', () => {
    const r = criteriosIncertidumbre({ ...tabla, alfa: 0.6 });
    const d = Object.fromEntries(r.criterios.map((c) => [c.clave, c.decision]));
    expect(d).toEqual({ optimista: 'A1', pesimista: 'A2', laplace: 'A2', hurwicz: 'A1', savage: 'A2' });
  });

  test('valor esperado y VEIP', () => {
    const r = decisionRiesgo({ ...tabla, probabilidades: [0.3, 0.5, 0.2] });
    expect(r.decision).toBe('A2');
    expect(r.valorEsperado).toBeCloseTo(24.5, 10);
    expect(r.veip).toBeCloseTo(6, 10);
  });
});

describe('juegos de suma cero', () => {
  test('punto silla', () => {
    const r = juegoSumaCero({ pagos: [[3, 2, 4], [1, 0, 2], [5, 1, 0]] });
    expect(r.puntoSilla).toBe(true);
    expect(r.valor).toBe(2);
  });

  test('estrategias mixtas 2x2: valor 0.5 y p = (0.5, 0.5)', () => {
    const r = juegoSumaCero({ pagos: [[2, -3], [-1, 4]] });
    expect(r.puntoSilla).toBe(false);
    expect(r.valor).toBeCloseTo(0.5, 8);
    expect(r.estrategiaFilas.A1).toBeCloseTo(0.5, 8);
    expect(r.estrategiaColumnas.E1).toBeCloseTo(0.7, 8);
  });
});
