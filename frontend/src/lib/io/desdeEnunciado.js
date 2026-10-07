import { parseModeloPL } from './parser';
import { resolverSimplex } from './simplex';
import { resolverGrafico } from './grafico';
import { resolverTransporte } from './transporte';
import { resolverAsignacion } from './asignacion';
import { resolverCPM, resolverPERT } from './redes';
import { eoq, eoqFaltantes, epq, descuentos, puntoReorden, periodoFijo } from './inventarios';
import { mm1, mms, costoColas } from './colas';
import { pasos as pasosMarkov, estable } from './markov';
import { seccionDorada, newton, lagrange2, muestrearFuncion } from './noLineal';
import { expresion } from './formulas';
import { resolverEntero, puntosEnterosFactibles } from './enteros';
import { parseModeloCuadratico, resolverCuadratica } from './cuadratica';
import { newtonMultivariable, evaluadorDosVariables } from './multivariable';
import { rutaMasCorta, arbolExpansionMinima, flujoMaximo } from './grafos';
import { criteriosIncertidumbre, decisionRiesgo, juegoSumaCero } from './decisiones';
import { curvaNivel } from './util';

export const METODOS = {
  pl: ['simplex', 'branch_bound'],
  cuadratica: ['kkt'],
  transporte: ['vogel', 'noroeste', 'costo_minimo'],
  asignacion: ['hungaro'],
  redes: ['cpm', 'pert'],
  grafos: ['ruta_corta', 'arbol_minimo', 'flujo_maximo'],
  inventarios: ['eoq', 'faltantes', 'epq', 'descuentos', 'reorden', 'periodo_fijo'],
  colas: ['mm1', 'mms'],
  markov: ['discreto'],
  noLineal: ['dorada', 'newton', 'lagrange', 'multivariable'],
  decisiones: ['incertidumbre', 'riesgo'],
  juegos: ['suma_cero'],
};
const exigir = (ok, texto) => { if (!ok) throw new Error(texto); };
const objeto = x => x !== null && typeof x === 'object' && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype;
const numero = (x, nombre, min = -1e12) => exigir(typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 1e12 && x >= min, `${nombre} debe ser un número finito entre ${min} y 10¹².`);
const texto = (x, nombre, max = 500) => exigir(typeof x === 'string' && x.trim().length > 0 && x.length <= max, `${nombre} debe ser un texto no vacío de hasta ${max} caracteres.`);
const nombres = (lista, nombre, n, max = 60) => { exigir(Array.isArray(lista) && lista.length === n, `${nombre}: indique ${n} nombres.`); lista.forEach(x => texto(x, nombre, max)); };
// Rechaza objetos especiales, accessors, claves de prototipo y valores que no vienen de JSON.
function revisarJSON(x, profundidad = 0, cuenta = { n: 0 }) {
  exigir(profundidad <= 12 && ++cuenta.n <= 12000, 'El modelo excede el tamaño permitido.');
  if (x === null || typeof x === 'string' || typeof x === 'boolean') return;
  if (typeof x === 'number') { numero(x, 'El dato'); return; }
  exigir(Array.isArray(x) || objeto(x), 'El modelo solo admite datos JSON, sin funciones ni objetos especiales.');
  exigir(Reflect.ownKeys(x).every(k => typeof k === 'string'), 'El modelo no admite símbolos.');
  Reflect.ownKeys(x).filter(k => !(Array.isArray(x) && k === 'length')).forEach(k => {
    exigir(!['__proto__', 'prototype', 'constructor'].includes(k), 'El modelo contiene una clave no permitida.');
    const d = Object.getOwnPropertyDescriptor(x, k);
    exigir(d && !d.get && !d.set, 'El modelo no admite propiedades ejecutables.');
    revisarJSON(d.value, profundidad + 1, cuenta);
  });
}
function vector(v, nombre, max = 30, min = -1e12) {
  exigir(Array.isArray(v) && v.length > 0 && v.length <= max, `${nombre} debe contener entre 1 y ${max} valores.`);
  v.forEach(x => numero(x, nombre, min));
}
function matriz(m, nombre, max = 30, min = -1e12) {
  exigir(Array.isArray(m) && m.length > 0 && m.length <= max, `${nombre} debe tener entre 1 y ${max} filas.`);
  m.forEach(r => vector(r, nombre, max, min));
  exigir(m.every(r => r.length === m[0].length), `${nombre} debe ser rectangular.`);
}
// Los campos opcionales pueden llegar como null desde el esquema estricto del proveedor.
const presente = (d, k) => Object.hasOwn(d, k) && d[k] !== null;
function campos(d, requeridos, opcionales = []) {
  exigir(objeto(d), 'Faltan los datos del modelo.');
  requeridos.forEach(k => exigir(presente(d, k), `Falta el dato ${k}.`));
  Object.keys(d).forEach(k => exigir([...requeridos, ...opcionales].includes(k), `Dato no permitido: ${k}.`));
}
function formula(f, variables) {
  texto(f, 'La fórmula', 300);
  const n = expresion(f, variables); let cantidad = 0;
  n.traverse(node => {
    exigir(++cantidad <= 80, 'La fórmula es demasiado compleja.');
    if (node.isConstantNode && typeof node.value === 'number') numero(node.value, 'La constante de la fórmula');
  });
}
const simbolosDe = (textos) => new Set((textos.join(' ').match(/[a-zA-Z][a-zA-Z0-9_]*/g) || []).filter(x => !['max', 'min', 'z', 'enteras', 'enteros', 'entera', 'entero', 'binarias', 'binarios', 'binaria', 'binario', 'int', 'integer', 'bin', 'son'].includes(x.toLowerCase())));
function listaSimbolos(lista, nombre, permitidos) {
  exigir(Array.isArray(lista) && lista.length <= 10, `${nombre} admite hasta 10 variables.`);
  lista.forEach(s => exigir(typeof s === 'string' && permitidos.includes(s), `${nombre}: ${s} no aparece en las fórmulas.`));
}
function tablaDecision(d, filas = 'alternativas', cols = 'estados') {
  matriz(d.pagos, 'La tabla de pagos', 20);
  if (presente(d, filas)) nombres(d[filas], 'Los nombres de fila', d.pagos.length);
  if (presente(d, cols)) nombres(d[cols], 'Los nombres de columna', d.pagos[0].length);
}

export function validarModeloInterpretado(modelo) {
  revisarJSON(modelo);
  exigir(objeto(modelo), 'Indique un modelo válido.');
  Object.keys(modelo).forEach(k => exigir(['tipo', 'metodo', 'variables', 'datos', 'evidencias'].includes(k), `Campo de modelo no permitido: ${k}.`));
  exigir(Object.hasOwn(METODOS, modelo.tipo), 'Tipo de modelo no soportado.');
  exigir(METODOS[modelo.tipo].includes(modelo.metodo), 'Método no soportado para este tipo de modelo.');
  if (modelo.variables !== undefined) {
    exigir(Array.isArray(modelo.variables) && modelo.variables.length <= 30, 'Indique hasta 30 variables.');
    const simbolos = new Set();
    modelo.variables.forEach(v => {
      campos(v, ['simbolo', 'nombre'], ['unidad']);
      exigir(/^[a-zA-Z][a-zA-Z0-9_]{0,29}$/.test(v.simbolo) && !['constructor', 'prototype', '__proto__'].includes(v.simbolo), 'Símbolo de variable no permitido.');
      texto(v.nombre, 'El nombre', 150); if (presente(v, 'unidad')) texto(v.unidad, 'La unidad', 80);
      exigir(!simbolos.has(v.simbolo), 'Los símbolos de variables no deben repetirse.'); simbolos.add(v.simbolo);
    });
  }
  const d = modelo.datos, metodo = modelo.metodo;
  switch (modelo.tipo) {
    case 'pl':
    case 'cuadratica': {
      campos(d, ['objetivo', 'restricciones'], modelo.tipo === 'pl' ? ['enteras', 'binarias'] : []); texto(d.objetivo, 'El objetivo', 500);
      exigir(Array.isArray(d.restricciones) && d.restricciones.length <= 30, 'Indique hasta 30 restricciones.');
      d.restricciones.forEach(r => texto(r, 'La restricción', 500));
      // Limita símbolos antes del parser, que deriva pares de variables.
      exigir(simbolosDe([d.objetivo, ...d.restricciones]).size <= 10, 'El modelo admite hasta 10 variables.');
      const parsed = modelo.tipo === 'pl' ? parseModeloPL(d.objetivo, d.restricciones) : parseModeloCuadratico(d.objetivo, d.restricciones);
      exigir(parsed.variables.length <= 10, 'El modelo admite hasta 10 variables.');
      exigir(parsed.variables.every(s => !['constructor', 'prototype', '__proto__'].includes(s)), 'Símbolo de variable no permitido.');
      if (presente(d, 'enteras')) listaSimbolos(d.enteras, 'Las variables enteras', parsed.variables);
      if (presente(d, 'binarias')) listaSimbolos(d.binarias, 'Las variables binarias', parsed.variables);
      if (metodo === 'branch_bound') exigir(parsed.enteras.length + parsed.binarias.length + (d.enteras?.length || 0) + (d.binarias?.length || 0) > 0, 'Branch & bound requiere declarar variables enteras o binarias.');
      if (modelo.variables?.length) exigir(parsed.variables.every(s => modelo.variables.some(v => v.simbolo === s)) && modelo.variables.every(v => parsed.variables.includes(v.simbolo)), 'Las variables declaradas deben coincidir con las fórmulas.');
      break;
    }
    case 'transporte':
      campos(d, ['costos', 'oferta', 'demanda']); matriz(d.costos, 'Los costos', 12); vector(d.oferta, 'La oferta', 12, 0); vector(d.demanda, 'La demanda', 12, 0);
      exigir(d.costos.length === d.oferta.length && d.costos[0].length === d.demanda.length, 'Los costos deben coincidir con oferta y demanda.'); break;
    case 'asignacion':
      campos(d, ['matriz', 'objetivo']); matriz(d.matriz, 'La matriz', 20); exigir(['min', 'max'].includes(d.objetivo), 'El objetivo debe ser min o max.'); break;
    case 'redes': {
      campos(d, ['actividades'], metodo === 'pert' ? ['plazo'] : []);
      exigir(Array.isArray(d.actividades) && d.actividades.length > 0 && d.actividades.length <= 80, 'La red admite entre 1 y 80 actividades.');
      const ids = new Set();
      d.actividades.forEach(a => {
        campos(a, metodo === 'cpm' ? ['id', 'predecesoras', 'duracion'] : ['id', 'predecesoras', 'a', 'm', 'b']);
        texto(a.id, 'El identificador', 40); exigir(!ids.has(a.id), 'Los identificadores de actividades deben ser únicos.'); ids.add(a.id);
        exigir(Array.isArray(a.predecesoras) && a.predecesoras.length <= 80, 'Las predecesoras deben ser una lista.');
        a.predecesoras.forEach(p => texto(p, 'La predecesora', 40));
        (metodo === 'cpm' ? ['duracion'] : ['a', 'm', 'b']).forEach(k => numero(a[k], k, 0));
        if (metodo === 'pert') exigir(a.a <= a.m && a.m <= a.b, 'PERT exige a ≤ m ≤ b.');
      });
      d.actividades.forEach(a => exigir(a.predecesoras.every(p => ids.has(p) && p !== a.id) && new Set(a.predecesoras).size === a.predecesoras.length, 'Revise las predecesoras: deben existir y no repetirse.'));
      const visitadas = new Set(), enRuta = new Set(), porId = new Map(d.actividades.map(a => [a.id, a]));
      function visitar(id) {
        exigir(!enRuta.has(id), 'La red contiene un ciclo de precedencias.');
        if (visitadas.has(id)) return;
        enRuta.add(id); porId.get(id).predecesoras.forEach(visitar); enRuta.delete(id); visitadas.add(id);
      }
      d.actividades.forEach(a => visitar(a.id));
      if (presente(d, 'plazo')) numero(d.plazo, 'El plazo', 0); break;
    }
    case 'grafos': {
      campos(d, ['aristas'], ['origen', 'destino', 'dirigido']);
      exigir(Array.isArray(d.aristas) && d.aristas.length > 0 && d.aristas.length <= 80, 'La red admite entre 1 y 80 aristas.');
      d.aristas.forEach(a => { campos(a, ['origen', 'destino', 'valor']); texto(a.origen, 'El nodo', 30); texto(a.destino, 'El nodo', 30); numero(a.valor, 'El valor de la arista', metodo === 'arbol_minimo' ? -1e12 : 0); });
      if (metodo !== 'arbol_minimo') { texto(d.origen, 'El nodo origen', 30); texto(d.destino, 'El nodo destino', 30); }
      if (presente(d, 'dirigido')) exigir(typeof d.dirigido === 'boolean', 'Indique si la red es dirigida.'); break;
    }
    case 'inventarios': {
      const defs = { eoq: ['D', 'S', 'H'], faltantes: ['D', 'S', 'H', 'p'], epq: ['D', 'S', 'H', 'P'], descuentos: ['D', 'S', 'i', 'tramos'], reorden: ['d', 'L'], periodo_fijo: ['d', 'T', 'L', 'sigma', 'z', 'inventario'] };
      campos(d, defs[metodo], metodo === 'reorden' ? ['sigma', 'z'] : []);
      Object.keys(d).filter(k => k !== 'tramos').forEach(k => numero(d[k], k, k === 'inventario' ? -1e12 : 0));
      ['D', 'S', 'H', 'p', 'P', 'i', 'T'].filter(k => Object.hasOwn(d, k)).forEach(k => exigir(d[k] > 0, `${k} debe ser mayor que cero.`));
      if (metodo === 'epq') exigir(d.P > d.D, 'La producción P debe superar la demanda D.');
      if (metodo === 'descuentos') {
        exigir(Array.isArray(d.tramos) && d.tramos.length > 0 && d.tramos.length <= 30, 'Indique de 1 a 30 tramos.');
        d.tramos.forEach((t, j) => { campos(t, ['min', 'precio']); numero(t.min, 'El mínimo', 0); numero(t.precio, 'El precio', 0); exigir(t.precio > 0 && (!j || t.min > d.tramos[j - 1].min && t.precio <= d.tramos[j - 1].precio), 'Los tramos requieren mínimos crecientes y precios positivos no crecientes.'); });
      }
      break;
    }
    case 'colas':
      campos(d, metodo === 'mms' ? ['lambda', 'mu', 's'] : ['lambda', 'mu'], ['cs', 'cw']);
      Object.keys(d).forEach(k => numero(d[k], k, 0)); exigir(d.mu > 0, 'La tasa de servicio debe ser positiva.');
      if (metodo === 'mms') exigir(Number.isInteger(d.s) && d.s >= 1 && d.s <= 1000, 'Use entre 1 y 1000 servidores enteros.');
      exigir(d.lambda < d.mu * (metodo === 'mms' ? d.s : 1), 'La cola es inestable: las llegadas deben ser menores que la capacidad.');
      exigir((d.cs === undefined) === (d.cw === undefined), 'Para costo total indique ambos costos cs y cw.'); break;
    case 'markov':
      campos(d, ['P', 'inicial', 'n']); matriz(d.P, 'La transición', 12, 0); vector(d.inicial, 'La distribución inicial', 12, 0);
      exigir(d.P.every(r => r.length === d.P.length && r.every(x => x <= 1) && Math.abs(r.reduce((a, x) => a + x, 0) - 1) <= 1e-6), 'La transición debe ser cuadrada y cada fila sumar uno.');
      exigir(d.inicial.length === d.P.length && Math.abs(d.inicial.reduce((a, x) => a + x, 0) - 1) <= 1e-6, 'La distribución inicial debe coincidir con los estados y sumar uno.');
      exigir(Number.isInteger(d.n) && d.n >= 0 && d.n <= 500, 'Use entre 0 y 500 pasos enteros.'); break;
    case 'noLineal':
      if (metodo === 'multivariable') {
        campos(d, ['f', 'simbolos', 'inicio'], ['objetivo']);
        exigir(Array.isArray(d.simbolos) && d.simbolos.length >= 1 && d.simbolos.length <= 4, 'Indique entre 1 y 4 variables.');
        d.simbolos.forEach(s => exigir(typeof s === 'string' && /^[a-zA-Z][a-zA-Z0-9_]{0,9}$/.test(s), 'Símbolo de variable no permitido.'));
        formula(d.f, d.simbolos); vector(d.inicio, 'El punto inicial', 4);
        exigir(d.inicio.length === d.simbolos.length, 'El punto inicial debe tener un valor por variable.');
        if (presente(d, 'objetivo')) exigir(['min', 'max'].includes(d.objetivo), 'El objetivo debe ser min o max.');
        break;
      }
      campos(d, metodo === 'dorada' ? ['f', 'a', 'b', 'objetivo'] : metodo === 'newton' ? ['f', 'x0'] : ['f', 'g', 'c'], metodo === 'newton' ? ['a', 'b'] : []);
      formula(d.f, metodo === 'lagrange' ? ['x', 'y'] : ['x']);
      Object.keys(d).filter(k => !['f', 'g', 'objetivo'].includes(k)).forEach(k => numero(d[k], k));
      if (metodo === 'lagrange') formula(d.g, ['x', 'y']);
      if (metodo === 'dorada') exigir(['min', 'max'].includes(d.objetivo), 'El objetivo debe ser min o max.');
      if (metodo === 'dorada' || d.a !== undefined || d.b !== undefined) exigir(d.a !== undefined && d.b !== undefined && d.a < d.b, 'Indique un intervalo completo con a < b.'); break;
    case 'decisiones':
      campos(d, ['pagos', 'objetivo'], ['alternativas', 'estados', 'probabilidades', 'alfa']);
      tablaDecision(d); exigir(['min', 'max'].includes(d.objetivo), 'Indique si los pagos son ganancias (max) o costos (min).');
      if (metodo === 'riesgo') { exigir(presente(d, 'probabilidades'), 'El criterio de riesgo requiere probabilidades.'); vector(d.probabilidades, 'Las probabilidades', 20, 0); }
      if (presente(d, 'alfa')) exigir(d.alfa >= 0 && d.alfa <= 1, 'α debe estar entre 0 y 1.'); break;
    case 'juegos':
      campos(d, ['pagos'], ['filas', 'columnas']); tablaDecision(d, 'filas', 'columnas'); break;
    default: break;
  }
  return true;
}

const metrica = (etiqueta, valor, unidad) => ({ etiqueta, valor, ...(unidad ? { unidad } : {}) });
const series = (datos, xKey, claves, xLabel, extra = {}) => ({ tipo: 'series', datos, xKey, series: claves.map(([key, nombre]) => ({ key, nombre })), ...(xLabel ? { xLabel } : {}), ...extra });
const barras = (datos, xKey, claves, extra = {}) => ({ tipo: 'barras', datos, xKey, series: claves.map(([key, nombre]) => ({ key, nombre })), ...extra });
const sinNulos = (d) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== null));
const nombreVar = (modelo, s) => { const v = modelo.variables?.find(x => x.simbolo === s); return v ? `${v.nombre} (${s})` : s; };
const unidadVar = (modelo, s) => modelo.variables?.find(x => x.simbolo === s)?.unidad;
const conCotasBinarias = (m, binarias) => ({ ...m, A: [...m.A, ...binarias.map(v => m.variables.map(w => (w === v ? 1 : 0)))], b: [...m.b, ...binarias.map(() => 1)], ops: [...m.ops, ...binarias.map(() => '<=')] });
// Tres curvas de nivel alrededor del valor óptimo, sobre la caja del gráfico.
function curvasAlrededor(f, centro, limites, xmin = 0, ymin = 0) {
  const paso = Math.max(Math.abs(centro) * 0.2, 1);
  return [centro - paso, centro, centro + paso].map(nivel => ({ nivel, puntos: curvaNivel(f, nivel, [xmin, limites.xmax], [ymin, limites.ymax], 70) })).filter(c => c.puntos.length);
}

function resolverPL(modelo, d, metodo) {
  const parsed = parseModeloPL(d.objetivo, d.restricciones);
  const binarias = [...new Set([...parsed.binarias, ...(d.binarias || [])])];
  const enteras = [...new Set([...parsed.enteras, ...(d.enteras || [])])];
  const metricasX = (x) => Object.entries(x).map(([s, valor]) => metrica(nombreVar(modelo, s), valor, unidadVar(modelo, s)));
  if (metodo === 'branch_bound' || enteras.length || binarias.length) {
    const resultado = resolverEntero(parsed, { enteras, binarias });
    const metricas = resultado.estado === 'optimo' || resultado.estado === 'limite' ? [...metricasX(resultado.x), metrica('Valor objetivo Z (entero)', resultado.z)] : [];
    if (resultado.relajacion?.z !== null && resultado.relajacion?.z !== undefined) metricas.push(metrica('Cota de la relajación lineal', resultado.relajacion.z));
    metricas.push(metrica('Subproblemas explorados', resultado.explorados));
    const pasos = [
      { texto: 'Relajación lineal P0: se resuelve el modelo sin exigir enteros; su Z es la cota inicial.', tabla: resultado.relajacion?.tablas?.[resultado.relajacion.tablas.length - 1] },
      { texto: 'Árbol de ramificación y acotamiento (cada nodo agrega una cota a su padre).', tabla: resultado.nodos.map(n => ({ nodo: `P${n.id}`, padre: n.padre === null ? '—' : `P${n.padre}`, rama: n.rama, Z: n.z ?? '—', solucion: n.estado === 'infactible' ? 'infactible' : Object.entries(n.x).map(([k, v]) => `${k}=${Number(v.toFixed(4))}`).join(', '), decision: n.decision })) },
    ];
    let grafico = null;
    if (parsed.variables.length === 2) {
      const base = conCotasBinarias(parsed, binarias);
      const datos = resolverGrafico(base);
      const ambasEnteras = parsed.variables.every(v => enteras.includes(v) || binarias.includes(v));
      const puntos = ambasEnteras ? puntosEnterosFactibles(base, datos.limites) : null;
      grafico = { tipo: 'pl', datos, variables: parsed.variables, enteros: { puntos, optimo: resultado.z === null ? null : { x: resultado.x[parsed.variables[0]], y: resultado.x[parsed.variables[1]], z: resultado.z } } };
    }
    const advertencias = ['El óptimo entero se obtuvo por branch & bound: no se redondeó la relajación.'];
    if (resultado.estado === 'limite') advertencias.push(`Se alcanzó el límite de ${resultado.explorados} subproblemas: la solución mostrada es la mejor encontrada, sin garantía de óptimo.`);
    if (resultado.estado === 'no_acotado') advertencias.push('La relajación lineal no está acotada; revise si falta una restricción.');
    return { resultado, metricas, pasos, grafico, estado: resultado.estado === 'limite' ? 'aproximado' : resultado.estado, advertencias, arbol: { nodos: resultado.nodos, sentido: parsed.sentido } };
  }
  const resultado = resolverSimplex(parsed);
  const metricas = metricasX(resultado.x);
  if (resultado.z !== null) metricas.push(metrica('Valor objetivo Z', resultado.z));
  const pasos = [...(resultado.pasos || []), ...resultado.tablas.map((tabla, i) => ({ texto: `Tabla simplex ${i + 1}`, tabla }))];
  const advertencias = ['Variables continuas y no negativas. Si deben ser enteras, decláralas (por ejemplo "x1, x2 enteras") y se resolverá por branch & bound.'];
  let grafico = null;
  if (parsed.variables.length === 2) grafico = { tipo: 'pl', datos: resolverGrafico(parsed), variables: parsed.variables };
  else advertencias.push('La región factible se grafica únicamente con dos variables.');
  if (resultado.multiple) advertencias.push('Existen soluciones óptimas múltiples.');
  return { resultado, metricas, pasos, grafico, estado: resultado.estado, advertencias };
}

function resolverCuadraticaModelo(modelo, d) {
  const m = parseModeloCuadratico(d.objetivo, d.restricciones);
  const resultado = resolverCuadratica(m);
  const metricas = resultado.z === null ? [] : [...Object.entries(resultado.x).map(([s, v]) => metrica(nombreVar(modelo, s), v, unidadVar(modelo, s))), metrica('Valor objetivo Z', resultado.z)];
  const pasos = [
    { texto: 'Hessiano del objetivo (matriz de segundas derivadas, constante en una cuadrática).', tabla: m.Q },
    { texto: resultado.convexa ? `Autovalores ${resultado.autovalores.join(', ')}: el problema es convexo para ${m.sentido === 'max' ? 'maximizar (cóncavo)' : 'minimizar'}; un punto KKT es óptimo global.` : `Autovalores ${resultado.autovalores.join(', ')}: el problema no es convexo; se comparan todos los puntos KKT.` },
    { texto: 'Condiciones KKT por conjunto activo: ∇f = Σ μᵢ ∇gᵢ con μᵢ ≥ 0 en las desigualdades activas.', tabla: resultado.candidatos.map((c, i) => ({ candidato: i + 1, activas: c.activas.join(', ') || 'ninguna (interior)', punto: c.x.join(', '), Z: c.z, multiplicadores: Object.entries(c.multiplicadores).map(([k, v]) => `${k}: ${v}`).join('; ') || '—', optimo: c.optimo ? 'Sí' : '' })) },
  ];
  let grafico = null;
  if (m.variables.length === 2) {
    const datos = resolverGrafico({ ...m, c: [0, 0] });
    const f = evaluadorDosVariables(m.objetivoTexto.replace(/\b0(?=x(?:\d*\b))/g, '0*'), m.variables);
    datos.optimo = resultado.z === null ? null : { x: resultado.x[m.variables[0]], y: resultado.x[m.variables[1]], z: resultado.z };
    datos.isoZ = null;
    datos.vertices = datos.vertices.map(v => ({ ...v, z: f(v.x, v.y) }));
    grafico = { tipo: 'pl', datos, variables: m.variables, curvas: resultado.z === null ? [] : curvasAlrededor(f, resultado.z, datos.limites) };
  }
  const advertencias = [];
  if (resultado.estado === 'kkt') advertencias.push('La región no está acotada y el objetivo no es convexo: se muestra el mejor punto KKT, que puede no ser el óptimo global.');
  if (resultado.estado === 'no_acotado') advertencias.push('No hay punto KKT: el objetivo mejora sin límite dentro de la región factible.');
  return { resultado, metricas, pasos, grafico, estado: resultado.estado === 'kkt' ? 'estacionario' : resultado.estado, advertencias };
}

function resolverGrafos(d, metodo) {
  const datos = sinNulos(d);
  const resultado = metodo === 'ruta_corta' ? rutaMasCorta(datos) : metodo === 'arbol_minimo' ? arbolExpansionMinima(datos) : flujoMaximo(datos);
  const dirigido = metodo === 'flujo_maximo' ? d.dirigido !== false : d.dirigido === true;
  const grafico = { tipo: 'grafo', nodos: resultado.nodos, aristas: d.aristas, resaltadas: resultado.aristasSolucion, dirigido, origen: d.origen ?? null, destino: d.destino ?? null, ...(metodo === 'flujo_maximo' ? { flujos: resultado.flujos.map(f => f.flujo), corte: resultado.corteMinimo } : {}) };
  if (metodo === 'ruta_corta') return { resultado, grafico, metricas: [metrica('Distancia mínima', resultado.distancia)], pasos: [{ texto: `Ruta: ${resultado.ruta.join(' → ')}` }, { texto: 'Etiquetas de Dijkstra por iteración (distancia y predecesor; ✓ = permanente).', tabla: resultado.pasos }], advertencias: ['Dijkstra requiere distancias no negativas.'] };
  if (metodo === 'arbol_minimo') return { resultado, grafico, metricas: [metrica('Longitud total del árbol', resultado.total)], pasos: [{ texto: 'Kruskal: aristas en orden creciente; se descarta la que forma ciclo.', tabla: resultado.pasos }], advertencias: resultado.conexo ? [] : [`La red no es conexa: se obtuvo un bosque de ${resultado.componentes} componentes.`] };
  return { resultado, grafico, metricas: [metrica('Flujo máximo', resultado.flujoMaximo)], pasos: [{ texto: 'Caminos aumentantes (Edmonds-Karp).', tabla: resultado.pasos }, { texto: 'Flujo final por arista.', tabla: resultado.flujos }, { texto: `Corte mínimo: lado de la fuente {${resultado.ladoFuente.join(', ')}}. Su capacidad iguala al flujo máximo.` }], advertencias: [] };
}

export function resolverModeloInterpretado(modelo) {
  validarModeloInterpretado(modelo);
  const { tipo, metodo, datos: d } = modelo;
  let resultado, grafico = null, metricas = [], pasos = [], estado = 'resuelto', advertencias = [], arbol = null;
  switch (tipo) {
    case 'pl': ({ resultado, metricas, pasos, grafico, estado, advertencias, arbol = null } = resolverPL(modelo, d, metodo)); break;
    case 'cuadratica': ({ resultado, metricas, pasos, grafico, estado, advertencias } = resolverCuadraticaModelo(modelo, d)); break;
    case 'grafos': ({ resultado, metricas, pasos, grafico, advertencias } = resolverGrafos(d, metodo)); break;
    case 'transporte':
      resultado = resolverTransporte({ ...d, metodo }); metricas = [metrica('Costo inicial', resultado.inicial.costo), metrica('Costo óptimo', resultado.optimo.costo)];
      pasos = [...resultado.inicial.pasos, ...resultado.iteraciones.map((iteracion, i) => ({ texto: `MODI: iteración ${i + 1}`, tabla: iteracion }))];
      if (resultado.balanceado.ficticio) advertencias.push('Se balanceó con un origen o destino ficticio de costo cero.'); break;
    case 'asignacion': resultado = resolverAsignacion(d); metricas = [metrica(d.objetivo === 'max' ? 'Ganancia total' : 'Costo total', resultado.total)]; pasos = resultado.pasos; break;
    case 'redes':
      resultado = metodo === 'cpm' ? resolverCPM(d.actividades) : resolverPERT(d.actividades, d.plazo ?? undefined);
      metricas = [metrica('Duración del proyecto', resultado.duracion)]; grafico = { tipo: 'red', actividades: resultado.actividades }; pasos = resultado.pasos || [];
      if (metodo === 'pert') { metricas.push(metrica('Varianza de ruta crítica', resultado.varianzaRuta)); if (resultado.probabilidad !== null) metricas.push(metrica('Probabilidad de cumplimiento', resultado.probabilidad)); advertencias.push('PERT usa una aproximación normal de la ruta crítica con tiempos independientes; no garantiza la fecha.'); } break;
    case 'inventarios': {
      const solvers = { eoq, faltantes: eoqFaltantes, epq, descuentos, reorden: puntoReorden, periodo_fijo: periodoFijo }; resultado = solvers[metodo](sinNulos(d)); pasos = resultado.pasos;
      const etiquetas = { Q: 'Cantidad de pedido', N: 'Pedidos por año', T: 'Período', costoTotal: 'Costo total', R: 'Punto de reorden', stockSeguridad: 'Stock de seguridad', nivelObjetivo: 'Nivel objetivo', inventarioMaximo: 'Inventario máximo', faltanteMaximo: 'Faltante máximo' };
      metricas = Object.entries(etiquetas).filter(([k]) => resultado[k] !== undefined).map(([k, nombre]) => metrica(nombre, resultado[k]));
      if (resultado.curva) grafico = series(resultado.curva, 'q', [['ordenar', 'Ordenar'], ['mantener', 'Mantener / faltantes'], ['total', 'Costo total']], 'Cantidad Q', { yLabel: 'Costo anual', marcas: resultado.Q !== undefined ? [{ x: resultado.Q, etiqueta: `Q* = ${Number(resultado.Q.toFixed(2))}` }] : [] });
      advertencias.push(['reorden', 'periodo_fijo'].includes(metodo) ? 'Demanda por período y tiempos deben usar la misma unidad; sigma supone demandas independientes.' : 'D y P usan un año; S es costo por pedido y H costo por unidad al año.'); break;
    }
    case 'colas': {
      const dc = sinNulos(d);
      resultado = metodo === 'mm1' ? mm1(dc) : mms(dc); pasos = resultado.pasos;
      metricas = ['rho', 'P0', 'L', 'Lq', 'W', 'Wq'].map(k => metrica(k, resultado[k]));
      if (dc.cs !== undefined) { resultado.costoTotal = costoColas({ ...resultado, cs: dc.cs, cw: dc.cw, s: metodo === 'mms' ? dc.s : 1 }); metricas.push(metrica('Costo total por unidad de tiempo', resultado.costoTotal)); }
      grafico = barras(resultado.Pn, 'n', [['p', 'P(n clientes)']], { xLabel: 'Clientes en el sistema (n)', yLabel: 'Probabilidad' });
      advertencias.push('Se supone Poisson/exponencial y régimen estacionario. Mu es tasa por servidor; W usa la unidad temporal de las tasas.', 'La gráfica muestra n=0..15; no representa toda la distribución.'); break;
    }
    case 'markov': {
      resultado = pasosMarkov(d); const estacionaria = estable(d.P); resultado.estacionaria = estacionaria.pi;
      pasos = [{ texto: `Multiplicar la distribución inicial por P durante ${d.n} pasos.`, tabla: resultado.historial }, ...estacionaria.pasos];
      metricas = resultado.historial[resultado.historial.length - 1].map((p, i) => metrica(`Estado ${i + 1} después de ${d.n} pasos`, p));
      grafico = series(resultado.historial.map((fila, n) => Object.fromEntries([['n', n], ...fila.map((p, i) => [`estado${i + 1}`, p])])), 'n', d.P.map((_, i) => [`estado${i + 1}`, `Estado ${i + 1}`]), 'Paso', { yLabel: 'Probabilidad' });
      advertencias.push('Una distribución estacionaria no garantiza convergencia ni unicidad; revisa periodicidad y clases cerradas.'); break;
    }
    case 'noLineal': {
      if (metodo === 'multivariable') {
        resultado = newtonMultivariable(d); estado = 'estacionario';
        const tipos = { minimo: 'mínimo local', maximo: 'máximo local', silla: 'punto silla', no_concluyente: 'no concluyente (Hessiano singular)' };
        metricas = [...Object.entries(resultado.punto).map(([s, v]) => metrica(s, v)), metrica('f en el punto', resultado.fx)];
        pasos = [{ texto: 'Iteraciones de Newton: x ← x − H⁻¹∇f (con paso amortiguado).', tabla: resultado.iteraciones }, { texto: `Hessiano en el punto; autovalores ${resultado.autovalores.join(', ')} → ${tipos[resultado.tipo]}.`, tabla: resultado.hessiano }];
        if (d.simbolos.length === 2) {
          const [sx, sy] = d.simbolos, px = resultado.punto[sx], py = resultado.punto[sy];
          const xs = [...resultado.iteraciones.map(i => i[sx]), px], ys = [...resultado.iteraciones.map(i => i[sy]), py];
          const margen = Math.max(2, (Math.max(...xs) - Math.min(...xs)) * 0.3, (Math.max(...ys) - Math.min(...ys)) * 0.3);
          const dominio = { x: [Math.min(...xs) - margen, Math.max(...xs) + margen], y: [Math.min(...ys) - margen, Math.max(...ys) + margen] };
          const f = evaluadorDosVariables(d.f, d.simbolos), paso = Math.max(Math.abs(resultado.fx) * 0.25, 1);
          grafico = { tipo: 'contorno', variables: d.simbolos, dominio, punto: { x: px, y: py, f: resultado.fx }, trayectoria: resultado.iteraciones.map(i => ({ x: i[sx], y: i[sy] })), curvas: [1, 2, 3, 4].map(k => resultado.fx + (resultado.tipo === 'maximo' ? -1 : 1) * k * paso).map(nivel => ({ nivel, puntos: curvaNivel(f, nivel, dominio.x, dominio.y, 70) })).filter(c => c.puntos.length) };
        }
        if (d.objetivo === 'max' && resultado.tipo !== 'maximo') advertencias.push('Se pidió un máximo, pero el punto estacionario encontrado no es un máximo local.');
        if (d.objetivo === 'min' && resultado.tipo !== 'minimo') advertencias.push('Se pidió un mínimo, pero el punto estacionario encontrado no es un mínimo local.');
        advertencias.push('Newton encuentra un punto estacionario cercano al inicio; la clasificación es local, no certifica el óptimo global.'); break;
      }
      const dn = sinNulos(d);
      resultado = metodo === 'dorada' ? seccionDorada(dn) : metodo === 'newton' ? newton(dn) : lagrange2(dn);
      estado = metodo === 'dorada' ? 'aproximado' : 'estacionario';
      metricas = [metrica('x', resultado.x), metrica('f', metodo === 'lagrange' ? resultado.fxy : resultado.fx)];
      if (metodo === 'lagrange') { metricas.push(metrica('y', resultado.y), metrica('Multiplicador lambda', resultado.lambda)); pasos = [{ texto: 'Resolver ∇f = λ∇g y g(x,y)=c; el punto encontrado es estacionario regular.' }]; }
      else {
        pasos = resultado.iteraciones.map((iteracion, i) => ({ texto: `Iteración ${i + 1}`, tabla: iteracion }));
        const a = dn.a ?? Math.min(dn.x0, resultado.x) - 2, b = dn.b ?? Math.max(dn.x0, resultado.x) + 2;
        try { grafico = series(muestrearFuncion({ f: dn.f, a, b, n: 100 }), 'x', [['y', 'f(x)']], 'x', { yLabel: 'f(x)', puntos: [{ x: resultado.x, y: resultado.fx, etiqueta: `x* = ${Number(resultado.x.toFixed(4))}` }] }); } catch (_) { advertencias.push('La solución se obtuvo, pero el intervalo de gráfica incluye puntos fuera del dominio de f.'); }
      }
      advertencias.push(metodo === 'dorada' ? 'Se requiere unimodalidad en el intervalo; revisa los extremos.' : 'El punto es estacionario; no certifica óptimo global. Revisa dominio, fronteras y curvatura.'); break;
    }
    case 'decisiones': {
      const dd = sinNulos(d);
      if (metodo === 'riesgo') {
        resultado = decisionRiesgo(dd);
        metricas = [metrica('Mejor alternativa (valor esperado)', resultado.valorEsperado), metrica('Valor esperado con información perfecta', resultado.valorConInformacionPerfecta), metrica('VEIP', resultado.veip)];
        pasos = [{ texto: `Valor esperado de cada alternativa: Σ pago × probabilidad. Se elige ${resultado.decision}.`, tabla: resultado.alternativas.map((a, i) => ({ alternativa: a, valorEsperado: resultado.valoresEsperados[i] })) }, { texto: 'VEIP = |VE con información perfecta − mejor VE|: lo máximo que convendría pagar por saber el estado.' }];
        grafico = barras(resultado.alternativas.map((a, i) => ({ alternativa: a, ve: resultado.valoresEsperados[i] })), 'alternativa', [['ve', 'Valor esperado']], { yLabel: d.objetivo === 'min' ? 'Costo esperado' : 'Ganancia esperada', destacar: resultado.decision });
      } else {
        resultado = criteriosIncertidumbre(dd);
        metricas = resultado.criterios.map(c => ({ etiqueta: c.nombre, valor: c.valores[c.indice], unidad: `→ ${c.decision}` }));
        pasos = [...resultado.criterios.map(c => ({ texto: `${c.nombre}: se elige ${c.decision}.`, tabla: resultado.alternativas.map((a, i) => ({ alternativa: a, valor: c.valores[i] })) })), { texto: 'Matriz de arrepentimiento (Savage).', tabla: resultado.arrepentimiento }];
        grafico = barras(resultado.alternativas.map((a, i) => Object.fromEntries([['alternativa', a], ...resultado.criterios.map(c => [c.clave, c.valores[i]])])), 'alternativa', resultado.criterios.map(c => [c.clave, c.nombre]), { yLabel: 'Valor del criterio' });
      }
      break;
    }
    case 'juegos': {
      resultado = juegoSumaCero(sinNulos(d)); pasos = resultado.pasos;
      metricas = [metrica('Valor del juego', resultado.valor), ...Object.entries(resultado.estrategiaFilas).map(([k, v]) => metrica(`Jugador A: ${k}`, v)), ...Object.entries(resultado.estrategiaColumnas).map(([k, v]) => metrica(`Jugador B: ${k}`, v))];
      grafico = barras([...Object.entries(resultado.estrategiaFilas).map(([k, v]) => ({ estrategia: `A·${k}`, probabilidad: v })), ...Object.entries(resultado.estrategiaColumnas).map(([k, v]) => ({ estrategia: `B·${k}`, probabilidad: v }))], 'estrategia', [['probabilidad', 'Probabilidad de jugarla']], { yLabel: 'Probabilidad' });
      advertencias.push('Pagos desde el punto de vista del jugador A (filas); lo que gana A lo pierde B.'); break;
    }
    default: break;
  }
  // Evita que desbordamientos numéricos se presenten como soluciones válidas.
  metricas.forEach(m => exigir(typeof m.valor === 'number' && Number.isFinite(m.valor), 'El resultado excede la precisión numérica disponible. Reduce la escala de los datos.'));
  const resumen = estado === 'infactible' ? 'Las restricciones no admiten una solución factible.'
    : estado === 'no_acotado' ? 'El objetivo no está acotado con estas restricciones.'
      : estado === 'estacionario' ? 'Se encontró un punto estacionario; revisa su clasificación y alcance.'
        : tipo === 'pl' && arbol ? 'Óptimo entero obtenido por ramificación y acotamiento.'
          : 'Modelo resuelto de forma determinista.';
  return { tipo, metodo, estado, resumen, metricas, pasos, grafico, resultado, advertencias, ...(arbol ? { arbol } : {}) };
}
