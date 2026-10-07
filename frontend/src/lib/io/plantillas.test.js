import { PLANTILLAS } from '../../components/io/TabPlantillas';
import { resolverModeloInterpretado } from './desdeEnunciado';

// Cada plantilla de la pestaña "Entera, grafos y decisiones" debe resolverse tal cual se ofrece.
test.each(PLANTILLAS.map((p) => [p.titulo, p]))('plantilla %s se resuelve', (_, p) => {
  const s = resolverModeloInterpretado(p.modelo);
  expect(['optimo', 'resuelto', 'estacionario']).toContain(s.estado);
  expect(s.metricas.length).toBeGreaterThan(0);
  expect(s.grafico || s.arbol).toBeTruthy();
});

test('valores de referencia de las plantillas', () => {
  const r = Object.fromEntries(PLANTILLAS.map((p) => [p.clave, resolverModeloInterpretado(p.modelo).resultado]));
  expect(r.entera.z).toBe(40);
  expect(r.binaria.z).toBe(21);
  expect(r.cuadratica.z).toBeCloseTo(270, 6);
  expect(r.multivariable.punto).toEqual({ x: 1, y: 4 });
  expect(r.ruta.distancia).toBe(13);
  expect(r.arbol.total).toBe(14);
  expect(r.flujo.flujoMaximo).toBe(14);
  expect(r.riesgo.decision).toBe('Mantener');
  expect(r.juegos.valor).toBeCloseTo(0.5, 8);
});
