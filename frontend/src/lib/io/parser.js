import { limpiarResultado } from './util';
import { expresion, evaluar, math } from './formulas';
import { exigir, limpiar } from './util';
// mathjs reserva 0x para hexadecimales; en PL significa cero por x.
const preparar = t => t.replace(/\b0(?=x(?:\d*\b))/g, '0*');
function parseModeloPLInterno(objetivo, restricciones) {
  exigir(typeof objetivo === 'string', 'El objetivo debe ser un texto.');
  const cabecera = objetivo.trim().match(/^(max|min)\s+(?:z\s*=\s*)?(.+)$/i);
  exigir(cabecera, 'El objetivo debe comenzar con max o min, por ejemplo max z = 3x1 + 5x2.');
  exigir(Array.isArray(restricciones) && restricciones.every(r => typeof r === 'string'), 'Las restricciones deben ser una lista de textos.');
  const expresiones = [cabecera[2]], rs = [], declaradas = [], enteras = [], binarias = [];
  restricciones.forEach(texto => {
    const t = texto.replace(/≤/g, '<=').replace(/≥/g, '>=').trim();
    const nn = t.match(/^([a-zA-Z]\w*(?:\s*,\s*[a-zA-Z]\w*)*)\s*>=\s*0$/);
    if (nn) { declaradas.push(...nn[1].split(',').map(v => v.trim())); return; }
    // "x1, x2 enteras" / "y1 binaria" / "y1,y2 ∈ {0,1}" declaran integralidad.
    const tipo = t.match(/^([a-zA-Z]\w*(?:\s*,\s*[a-zA-Z]\w*)*)\s+(?:son\s+)?(enter[oa]s?|int|integer|binari[oa]s?|bin|∈\s*\{\s*0\s*,\s*1\s*\})$/i);
    if (tipo) {
      const lista = tipo[1].split(',').map(v => v.trim());
      (/^(binari|bin|∈)/i.test(tipo[2]) ? binarias : enteras).push(...lista);
      declaradas.push(...lista); return;
    }
    const r = t.match(/^(.+?)\s*(<=|>=|=)\s*(.+)$/);
    exigir(r, `Restricción inválida: ${texto}.`);
    rs.push(r); expresiones.push(r[1], r[3]);
  });
  const nombres = new Set(declaradas);
  expresiones.forEach(t => {
    try { math.parse(preparar(t)).traverse(n => { if (n.isSymbolNode && !['pi', 'e'].includes(n.name)) nombres.add(n.name); }); }
    catch (_) { throw new Error(`Expresión inválida: ${t}.`); }
  });
  const variables = [...nombres].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  exigir(variables.length > 0, 'El modelo debe contener al menos una variable.');
  const cero = Object.fromEntries(variables.map(v => [v, 0]));
  function lineal(t) {
    const node = expresion(preparar(t), variables), k = evaluar(node, cero);
    const c = variables.map(v => evaluar(node, { ...cero, [v]: 1 }) - k);
    const igual = (x, y) => Math.abs(x - y) <= 1e-8 * Math.max(1, Math.abs(x), Math.abs(y));
    variables.forEach((v, i) => exigir(igual(evaluar(node, { ...cero, [v]: 2 }), 2 * c[i] + k), `La expresión ${t} no es lineal.`));
    // Puntos pseudoaleatorios reproducibles y curvatura simbólica evitan falsos positivos.
    for (let p = 1; p <= 3; p++) {
      const s = Object.fromEntries(variables.map((v, i) => [v, Math.sin((i + 1) * (p + 2)) * 3]));
      exigir(igual(evaluar(node, s), k + variables.reduce((sum, v, i) => sum + c[i] * s[v], 0)), `La expresión ${t} no es lineal.`);
    }
    try { variables.forEach(v => { const d = math.derivative(node, v); variables.forEach(w => exigir(math.derivative(d, w).toString() === '0', `La expresión ${t} no es lineal.`)); }); }
    catch (_) { throw new Error(`La expresión ${t} no es lineal.`); }
    return { c: c.map(limpiar), k };
  }
  const obj = lineal(cabecera[2]);
  exigir(Math.abs(obj.k) < 1e-9, 'El objetivo debe expresarse sin término constante.');
  const A = [], ops = [], b = [];
  rs.forEach(r => { const l = lineal(r[1]), d = lineal(r[3]); A.push(l.c.map((x, i) => limpiar(x - d.c[i]))); ops.push(r[2]); b.push(limpiar(d.k - l.k)); });
  return { sentido: cabecera[1].toLowerCase(), variables, c: obj.c, A, ops, b, noNegativas: [...variables], enteras: [...new Set(enteras)], binarias: [...new Set(binarias)] };
}

export function parseModeloPL(objetivo, restricciones) { return limpiarResultado(parseModeloPLInterno(objetivo, restricciones)); }
