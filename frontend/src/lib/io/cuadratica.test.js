import { parseModeloCuadratico, resolverCuadratica } from './cuadratica';
import { newtonMultivariable } from './multivariable';
import { autovaloresSimetrica, curvaNivel } from './util';

describe('programación cuadrática (KKT por conjuntos activos)', () => {
  test('Hillier-Lieberman: máx 15x1 + 30x2 + 4x1x2 - 2x1² - 4x2² con x1 + 2x2 ≤ 30 → (12, 9), Z = 270', () => {
    const m = parseModeloCuadratico('max z = 15x1 + 30x2 + 4x1*x2 - 2x1^2 - 4x2^2', ['x1 + 2x2 <= 30', 'x1, x2 >= 0']);
    const r = resolverCuadratica(m);
    expect(r.estado).toBe('optimo');
    expect(r.convexa).toBe(true);
    expect(r.x.x1).toBeCloseTo(12, 6);
    expect(r.x.x2).toBeCloseTo(9, 6);
    expect(r.z).toBeCloseTo(270, 6);
    expect(r.multiplicadores.R1).toBeGreaterThan(0);
  });

  test('proyección: mín (x-3)² + (y-2)² con x + y ≤ 4 → (2.5, 1.5)', () => {
    const r = resolverCuadratica(parseModeloCuadratico('min z = (x-3)^2 + (y-2)^2', ['x + y <= 4']));
    expect(r.x.x).toBeCloseTo(2.5, 6);
    expect(r.x.y).toBeCloseTo(1.5, 6);
    expect(r.z).toBeCloseTo(0.5, 6);
  });

  test('no convexa con región acotada: el máximo global de x² + y² está en un vértice', () => {
    const r = resolverCuadratica(parseModeloCuadratico('max z = x^2 + y^2', ['x + y <= 4']));
    expect(r.convexa).toBe(false);
    expect(r.acotada).toBe(true);
    expect(r.estado).toBe('optimo');
    expect(r.z).toBeCloseTo(16, 6);
  });

  test('igualdad y mínimo interior', () => {
    const r = resolverCuadratica(parseModeloCuadratico('min z = x^2 + 2y^2', ['x + y = 3']));
    expect(r.x.x).toBeCloseTo(2, 6);
    expect(r.x.y).toBeCloseTo(1, 6);
  });

  test('rechaza grado mayor que 2 y productos sin *', () => {
    expect(() => parseModeloCuadratico('max z = x^3', ['x <= 2'])).toThrow(/grado 2/);
    expect(() => parseModeloCuadratico('max z = x1 + x2 + x1x2', ['x1 + x2 <= 3'])).toThrow(/producto de variables/);
  });

  test('infactible', () => {
    expect(resolverCuadratica(parseModeloCuadratico('min z = x^2', ['x >= 3', 'x <= 1'])).estado).toBe('infactible');
  });
});

describe('Newton multivariable', () => {
  test('mínimo de x² + y² - 4x - 6y en (2, 3)', () => {
    const r = newtonMultivariable({ f: 'x^2 + y^2 - 4*x - 6*y', simbolos: ['x', 'y'], inicio: [0, 0] });
    expect(r.punto).toEqual({ x: 2, y: 3 });
    expect(r.tipo).toBe('minimo');
    expect(r.fx).toBeCloseTo(-13, 8);
  });

  test('punto silla de x² - y²', () => {
    expect(newtonMultivariable({ f: 'x^2 - y^2', simbolos: ['x', 'y'], inicio: [1, 1] }).tipo).toBe('silla');
  });

  test('máximo con tres variables', () => {
    const r = newtonMultivariable({ f: '-(x-1)^2 - (y+2)^2 - (z-3)^2', simbolos: ['x', 'y', 'z'], inicio: [0, 0, 0] });
    expect(r.tipo).toBe('maximo');
    expect(r.punto).toEqual({ x: 1, y: -2, z: 3 });
  });
});

describe('utilidades', () => {
  test('autovalores de una matriz simétrica', () => {
    const l = autovaloresSimetrica([[2, 1], [1, 2]]);
    expect(l[0]).toBeCloseTo(1, 10);
    expect(l[1]).toBeCloseTo(3, 10);
  });
  test('curva de nivel de un círculo', () => {
    const pts = curvaNivel((x, y) => x * x + y * y, 1, [-2, 2], [-2, 2], 40).filter((p) => p.y !== null);
    expect(pts.length).toBeGreaterThan(40);
    pts.forEach((p) => expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 1));
  });
});
