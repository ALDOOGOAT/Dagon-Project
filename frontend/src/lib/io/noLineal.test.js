import { seccionDorada, newton, lagrange2, muestrearFuncion } from './noLineal';
test('sección dorada: parábola mínima', () => { const s = seccionDorada({ f: '(x-3)^2+2', a: -5, b: 10, objetivo: 'min' }); expect(s.x).toBeCloseTo(3, 3); expect(s.fx).toBeCloseTo(2); expect(s.iteraciones.length).toBeGreaterThan(1); });
test('sección dorada: máximo', () => { const s = seccionDorada({ f: '-(x-2)^2+5', a: 0, b: 5, objetivo: 'max' }); expect(s.x).toBeCloseTo(2, 3); expect(s.fx).toBeCloseTo(5); });
test('Newton y derivadas simbólicas', () => { const s = newton({ f: '(x-3)^2+2', x0: 0 }); expect(s.x).toBeCloseTo(3); expect(s.fx).toBeCloseTo(2); expect(s.tipo).toBe('minimo'); expect(s.iteraciones[0]).toEqual({ x: 0, fx: 11, d1: -6, d2: 2 }); });
test('Newton: máximo e inflexión estacionaria', () => { expect(newton({ f: '-x^2', x0: 2 }).tipo).toBe('maximo'); expect(newton({ f: 'x^3', x0: 0 }).tipo).toBe('inflexion'); });
test('Lagrange: xy, x+y=10', () => { const s = lagrange2({ f: 'x*y', g: 'x+y', c: 10 }); expect(s.x).toBeCloseTo(5); expect(s.y).toBeCloseTo(5); expect(s.lambda).toBeCloseTo(5); expect(s.fxy).toBeCloseTo(25); });
test('Lagrange con restricción no lineal', () => { const s = lagrange2({ f: 'x+y', g: 'x^2+y^2', c: 2 }); expect(s.x ** 2 + s.y ** 2).toBeCloseTo(2); expect(Math.abs(s.fxy)).toBeCloseTo(2); });
test('muestreo incluye ambos extremos', () => expect(muestrearFuncion({ f: 'x^2', a: 0, b: 2, n: 3 })).toEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 }]));
test.each([() => seccionDorada({ f: 'x', a: 2, b: 1, objetivo: 'min' }), () => seccionDorada({ f: 'sqrt(x)', a: -2, b: -1, objetivo: 'min' }), () => newton({ f: 'x', x0: 0 }), () => newton({ f: 'exp(x)', x0: 0, maxIter: 1 }), () => lagrange2({ f: 'x*y', g: '0', c: 10 }), () => muestrearFuncion({ f: 'x', a: 0, b: 1, n: 1 })])('error claro en entrada o método no convergente', f => expect(f).toThrow(Error));

test('punto plano: derivadas superiores distinguen extremos de inflexión', () => { expect(newton({ f: 'x^4', x0: 0 }).tipo).toBe('minimo'); expect(newton({ f: '-x^4', x0: 0 }).tipo).toBe('maximo'); });
