import { resolverModeloInterpretado as resolver, validarModeloInterpretado as validar } from './desdeEnunciado';
const modelo = (tipo, metodo, datos, variables) => ({ tipo, metodo, datos, ...(variables ? { variables } : {}) });
const pl = modelo('pl', 'simplex', { objetivo: 'max z=3mesas+5sillas', restricciones: ['mesas<=4', '2sillas<=12', '3mesas+2sillas<=18', 'mesas,sillas>=0'] }, [{ simbolo: 'mesas', nombre: 'Mesas', unidad: 'unidades' }, { simbolo: 'sillas', nombre: 'Sillas', unidad: 'unidades' }]);
test('PL preserva símbolos reales, óptimo, tableau y gráfica', () => {
  const s = resolver(pl); expect(s.resultado.z).toBe(36); expect(s.resultado.x).toEqual({ mesas: 2, sillas: 6 }); expect(s.grafico.variables).toEqual(['mesas', 'sillas']); expect(s.grafico.datos.optimo.z).toBe(36); expect(s.metricas[0].etiqueta).toContain('Mesas'); expect(s.metricas[0].unidad).toBe('unidades'); expect(s.pasos.some(p => p.tabla?.pivote)).toBe(true);
});
test.each([['infactible', ['x<=1', 'x>=2']], ['no_acotado', []]])('PL informa %s sin simular óptimo', (estado, restricciones) => { const s = resolver(modelo('pl', 'simplex', { objetivo: 'max z=x', restricciones })); expect(s.estado).toBe(estado); expect(s.resultado.z).toBeNull(); expect(s.metricas.every(m => Number.isFinite(m.valor))).toBe(true); });
test('PL de tres variables conserva resultado y explica límite gráfico', () => { const s = resolver(modelo('pl', 'simplex', { objetivo: 'max z=x+y+w', restricciones: ['x+y+w<=4'] })); expect(s.resultado.z).toBe(4); expect(s.grafico).toBeNull(); expect(s.advertencias.some(a => a.includes('dos variables'))).toBe(true); });
test.each(['vogel', 'noroeste', 'costo_minimo'])('Transporte %s incluye resultado y MODI', metodo => { const s = resolver(modelo('transporte', metodo, { costos: [[2, 1], [1, 2]], oferta: [5, 5], demanda: [5, 5] })); expect(s.resultado.optimo.costo).toBe(10); expect(s.pasos.length).toBeGreaterThan(0); });
test.each(['min', 'max'])('Asignación %s', objetivo => { const s = resolver(modelo('asignacion', 'hungaro', { matriz: [[4, 1], [2, 3]], objetivo })); expect(s.resultado.total).toBe(objetivo === 'min' ? 3 : 7); expect(s.pasos.length).toBeGreaterThan(0); });
test('CPM muestra red, holguras y duración', () => { const s = resolver(modelo('redes', 'cpm', { actividades: [{ id: 'A', predecesoras: [], duracion: 3 }, { id: 'B', predecesoras: ['A'], duracion: 4 }] })); expect(s.resultado.duracion).toBe(7); expect(s.grafico.tipo).toBe('red'); expect(s.grafico.actividades[1].ES).toBe(3); });
test('PERT calcula probabilidad y declara aproximación', () => { const s = resolver(modelo('redes', 'pert', { actividades: [{ id: 'A', predecesoras: [], a: 1, m: 2, b: 3 }], plazo: 2 })); expect(s.resultado.probabilidad).toBeCloseTo(0.5); expect(s.advertencias[0]).toContain('aproximación normal'); });
test.each([['eoq', { D: 1000, S: 10, H: 0.5 }, 'Q', 200], ['faltantes', { D: 1000, S: 10, H: 0.5, p: 2 }, 'Q', Math.sqrt(50000)], ['epq', { D: 1000, S: 10, H: 0.5, P: 2000 }, 'Q', Math.sqrt(80000)], ['descuentos', { D: 1000, S: 10, i: 0.1, tramos: [{ min: 0, precio: 10 }, { min: 500, precio: 9 }] }, 'Q', 500], ['reorden', { d: 10, L: 4, sigma: 3, z: 2 }, 'R', 52], ['periodo_fijo', { d: 10, T: 5, L: 4, sigma: 3, z: 2, inventario: 40 }, 'Q', 68]])('Inventarios %s', (metodo, datos, campo, valor) => { const s = resolver(modelo('inventarios', metodo, datos)); expect(s.resultado[campo]).toBeCloseTo(valor); expect(s.pasos.length).toBeGreaterThan(0); if (s.resultado.curva) expect(s.grafico.xKey).toBe('q'); });
test.each([['mm1', { lambda: 2, mu: 3, cs: 10, cw: 5 }, 2], ['mms', { lambda: 2, mu: 3, s: 2 }, 0.75]])('Colas %s', (metodo, datos, l) => { const s = resolver(modelo('colas', metodo, datos)); expect(s.resultado.L).toBeCloseTo(l); expect(s.grafico.datos).toHaveLength(16); if (datos.cs) expect(s.resultado.costoTotal).toBe(20); });
test('Markov conserva historial y estacionaria', () => { const s = resolver(modelo('markov', 'discreto', { P: [[0.8, 0.2], [0.3, 0.7]], inicial: [1, 0], n: 2 })); expect(s.resultado.estacionaria[0]).toBeCloseTo(0.6); expect(s.metricas[0].valor).toBeCloseTo(0.7); expect(s.grafico.datos).toHaveLength(3); });
test.each([['dorada', { f: '(x-3)^2+2', a: 0, b: 5, objetivo: 'min' }], ['newton', { f: '(x-3)^2+2', x0: 0 }]])('No lineal %s ofrece curva e iteraciones', (metodo, datos) => { const s = resolver(modelo('noLineal', metodo, datos)); expect(s.resultado.x).toBeCloseTo(3, 3); expect(s.grafico.datos).toHaveLength(100); expect(s.pasos.length).toBeGreaterThan(0); });
test('Lagrange entrega estacionario sin prometer óptimo global', () => { const s = resolver(modelo('noLineal', 'lagrange', { f: 'x*y', g: 'x+y', c: 10 })); expect(s.resultado.fxy).toBe(25); expect(s.estado).toBe('estacionario'); expect(s.resumen).toContain('estacionario'); expect(s.advertencias[0]).toContain('no certifica'); });
test('Error gráfico de dominio conserva Newton resuelto', () => { const s = resolver(modelo('noLineal', 'newton', { f: 'log(x)^2', x0: 1, a: -1, b: 2 })); expect(s.resultado.x).toBe(1); expect(s.grafico).toBeNull(); expect(s.advertencias.some(a => a.includes('dominio'))).toBe(true); });
test.each([
 modelo('pl', 'simplex', { objetivo: 'max z=x^2', restricciones: ['x<=2'] }),
 modelo('pl', 'simplex', { objetivo: 'max z=x', restricciones: [] }, [{ simbolo: 'y', nombre: 'Otro' }]),
 modelo('transporte', 'vogel', { costos: [[1, NaN]], oferta: [1], demanda: [1] }),
 modelo('transporte', 'vogel', { costos: [[1, 2], [3]], oferta: [1, 1], demanda: [1, 1] }),
 modelo('transporte', 'vogel', { costos: [[1]], oferta: [1, 1], demanda: [1] }),
 modelo('asignacion', 'hungaro', { matriz: [[Infinity]], objetivo: 'min' }),
 modelo('redes', 'cpm', { actividades: [{ id: 'A', predecesoras: ['B'], duracion: 1 }] }),
 modelo('redes', 'pert', { actividades: [{ id: 'A', predecesoras: [], a: 3, m: 2, b: 1 }] }),
 modelo('inventarios', 'epq', { D: 1000, S: 10, H: 1, P: 500 }),
 modelo('inventarios', 'eoq', { D: 1000, S: 10, H: 0 }),
 modelo('colas', 'mm1', { lambda: 3, mu: 3 }),
 modelo('colas', 'mms', { lambda: 6, mu: 3, s: 2 }),
 modelo('colas', 'mms', { lambda: 1, mu: 3, s: 1001 }),
 modelo('colas', 'mm1', { lambda: 1, mu: 3, cs: 1 }),
 modelo('markov', 'discreto', { P: [[0.2, 0.2], [0.5, 0.5]], inicial: [1, 0], n: 1 }),
 modelo('markov', 'discreto', { P: [[1]], inicial: [1], n: 501 }),
 modelo('noLineal', 'newton', { f: 'x=2', x0: 0 }),
 modelo('noLineal', 'newton', { f: 'import("x")', x0: 0 }),
 modelo('noLineal', 'newton', { f: 'x.constructor', x0: 0 }),
 modelo('noLineal', 'newton', { f: 'x^2', x0: 0, a: 2 }),
 modelo('colas', 'mm1', { lambda: '2', mu: 3 }),
 { tipo: 'constructor', metodo: 'mm1', datos: {} },
 modelo('colas', 'codigo', { lambda: 2, mu: 3 }),
 modelo('colas', 'mm1', { lambda: 2, mu: 3, ejecutar: true }),
 JSON.parse('{"tipo":"colas","metodo":"mm1","datos":{"lambda":2,"mu":3,"__proto__":{}}}'),
])('rechaza modelo inválido %#', x => expect(() => validar(x)).toThrow(Error));
test('Rechaza getters sin ejecutarlos', () => { let llamadas = 0; const d = { mu: 3 }; Object.defineProperty(d, 'lambda', { enumerable: true, get: () => { llamadas++; return 2; } }); expect(() => validar(modelo('colas', 'mm1', d))).toThrow(/ejecutables/); expect(llamadas).toBe(0); });
test('Rechaza objetos con prototipo y funciones', () => { expect(() => validar(modelo('colas', 'mm1', Object.create({ lambda: 2, mu: 3 })))).toThrow(); expect(() => validar(modelo('colas', 'mm1', { lambda: () => 2, mu: 3 }))).toThrow(); });
test('No modifica entradas y devuelve forma normalizada', () => { const anterior = JSON.stringify(pl), s = resolver(pl); expect(JSON.stringify(pl)).toBe(anterior); expect(Object.keys(s).sort()).toEqual(['advertencias', 'estado', 'grafico', 'metodo', 'metricas', 'pasos', 'resultado', 'resumen', 'tipo']); });

test('Getter no enumerable también se rechaza sin ejecutarlo', () => { let llamadas=0; const datos={mu:3}; Object.defineProperty(datos,'lambda',{get:()=>{llamadas++;return 2;}}); expect(()=>validar(modelo('colas','mm1',datos))).toThrow(/ejecutables/); expect(llamadas).toBe(0); });

test.each([
 modelo('transporte','vogel',{costos:Array.from({length:13},()=>[1]),oferta:Array(13).fill(1),demanda:[13]}),
 modelo('asignacion','hungaro',{matriz:[Array(21).fill(1)],objetivo:'min'}),
 modelo('markov','discreto',{P:Array.from({length:13},(_,i)=>Array.from({length:13},(_,j)=>Number(i===j))),inicial:[1,...Array(12).fill(0)],n:1}),
 modelo('pl','simplex',{objetivo:'max z='+Array.from({length:11},(_,i)=>'x'+i).join('+'),restricciones:[]}),
 modelo('redes','cpm',{actividades:[{id:'A',predecesoras:['B'],duracion:1},{id:'B',predecesoras:['A'],duracion:1}]}),
 modelo('pl','simplex',{objetivo:'max z=constructor',restricciones:[]}),
])('límites de complejidad y ciclos %#',m=>expect(()=>validar(m)).toThrow(Error));

describe('contrato ampliado: entera, cuadrática, grafos, decisiones, juegos y multivariable', () => {
  test('PL entera con campo enteras: branch & bound, árbol y puntos enteros en la gráfica', () => {
    const s = resolver(modelo('pl', 'branch_bound', { objetivo: 'max z=5x1+8x2', restricciones: ['x1+x2<=6', '5x1+9x2<=45', 'x1,x2>=0'], enteras: ['x1', 'x2'], binarias: null }));
    expect(s.resultado.z).toBe(40); expect(s.arbol.nodos.length).toBeGreaterThan(1);
    expect(s.grafico.enteros.puntos.length).toBeGreaterThan(10); expect(s.grafico.enteros.optimo).toEqual({ x: 0, y: 5, z: 40 });
    expect(s.metricas.some(m => m.etiqueta.includes('relajación'))).toBe(true);
  });
  test('PL binaria declarada en las restricciones', () => {
    const s = resolver(modelo('pl', 'simplex', { objetivo: 'max z=8y1+11y2+6y3+4y4', restricciones: ['5y1+7y2+4y3+3y4<=14', 'y1,y2,y3,y4 binarias'] }));
    expect(s.resultado.z).toBe(21); expect(s.arbol).toBeDefined();
  });
  test('branch_bound sin variables enteras se rechaza', () => {
    expect(() => validar(modelo('pl', 'branch_bound', { objetivo: 'max z=x', restricciones: ['x<=3'] }))).toThrow(/enteras o binarias/);
  });
  test('cuadrática con curvas de nivel', () => {
    const s = resolver(modelo('cuadratica', 'kkt', { objetivo: 'max z=15x1+30x2+4x1*x2-2x1^2-4x2^2', restricciones: ['x1+2x2<=30', 'x1,x2>=0'] }));
    expect(s.resultado.z).toBeCloseTo(270, 6); expect(s.grafico.curvas.length).toBeGreaterThan(0); expect(s.grafico.datos.optimo.x).toBeCloseTo(12, 6);
  });
  test.each([['ruta_corta', 'Distancia mínima', 3], ['arbol_minimo', 'Longitud total del árbol', 3], ['flujo_maximo', 'Flujo máximo', 5]])('grafos %s', (metodo, etiqueta, valor) => {
    const s = resolver(modelo('grafos', metodo, { aristas: [{ origen: 'A', destino: 'B', valor: 1 }, { origen: 'B', destino: 'C', valor: 2 }, { origen: 'A', destino: 'C', valor: 4 }], origen: 'A', destino: 'C', dirigido: null }));
    expect(s.metricas[0]).toEqual({ etiqueta, valor }); expect(s.grafico.tipo).toBe('grafo');
  });
  test('decisiones bajo riesgo y bajo incertidumbre', () => {
    const datos = { pagos: [[50, 20, -10], [30, 25, 15]], objetivo: 'max', alternativas: null, estados: null, probabilidades: [0.3, 0.5, 0.2], alfa: null };
    expect(resolver(modelo('decisiones', 'riesgo', datos)).resultado.decision).toBe('A2');
    expect(resolver(modelo('decisiones', 'incertidumbre', datos)).grafico.tipo).toBe('barras');
  });
  test('juego de suma cero mixto', () => {
    const s = resolver(modelo('juegos', 'suma_cero', { pagos: [[2, -3], [-1, 4]], filas: null, columnas: null }));
    expect(s.resultado.valor).toBeCloseTo(0.5, 8);
  });
  test('Newton multivariable con contorno y trayectoria', () => {
    const s = resolver(modelo('noLineal', 'multivariable', { f: 'x^2 + y^2 - 4*x - 6*y', simbolos: ['x', 'y'], inicio: [0, 0], objetivo: 'min' }));
    expect(s.resultado.punto).toEqual({ x: 2, y: 3 }); expect(s.grafico.tipo).toBe('contorno'); expect(s.grafico.trayectoria.length).toBeGreaterThan(0);
  });
  test('colas se grafican como barras y EOQ marca Q*', () => {
    expect(resolver(modelo('colas', 'mm1', { lambda: 4, mu: 6 })).grafico.tipo).toBe('barras');
    expect(resolver(modelo('inventarios', 'eoq', { D: 10000, S: 50, H: 25 })).grafico.marcas[0].x).toBe(200);
  });
});
