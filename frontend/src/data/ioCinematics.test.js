import { IO_CINEMATICS, getIoCinematica } from './ioCinematics';
import { ioTheory } from './ioTheory';

test('hay una cinemática por cada módulo de teoría IO, con escenas y una sola respuesta correcta', () => {
  ['io-i', 'io-ii'].forEach((curso) => {
    expect(Object.keys(IO_CINEMATICS[curso]).sort()).toEqual(Object.keys(ioTheory[curso]).sort());
    Object.values(IO_CINEMATICS[curso]).forEach((c) => {
      expect(c.scenes.length).toBeGreaterThanOrEqual(3);
      c.scenes.forEach((e) => { expect(e.title).toBeTruthy(); expect(e.body).toBeTruthy(); expect(e.body).not.toMatch(/\bSQL\b/); });
      expect(c.checkpoint.options.filter((o) => o.correct)).toHaveLength(1);
    });
  });
});

test('getIoCinematica resuelve el curso por nombre o clave', () => {
  expect(getIoCinematica('Investigación de Operaciones II', 1).title).toMatch(/CPM/);
  expect(getIoCinematica('io-i', 3).title).toMatch(/gráfico/);
  expect(getIoCinematica('io-i', 99)).toBeNull();
});
