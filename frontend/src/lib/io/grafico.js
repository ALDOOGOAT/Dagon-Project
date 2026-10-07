import { limpiarResultado } from './util';
import { resolverSimplex } from './simplex';
import { EPS, exigir, limpiar, validarModelo } from './util';
function resolverGraficoInterno(modelo) {
  validarModelo(modelo); exigir(modelo.variables.length === 2, 'El método gráfico requiere exactamente dos variables.');
  const sol = resolverSimplex(modelo);
  const rectas = modelo.A.map((r, i) => ({ etiqueta: `R${i + 1}`, a1: r[0], a2: r[1], b: modelo.b[i], op: modelo.ops[i] }));
  const fronteras = [...rectas];
  modelo.variables.forEach((v, i) => { if (modelo.noNegativas.includes(v)) fronteras.push({ etiqueta: `${v} ≥ 0`, a1: i === 0 ? 1 : 0, a2: i === 1 ? 1 : 0, b: 0, op: '>=' }); });
  const factible = (x, y) => fronteras.every(r => {
    const d = r.a1 * x + r.a2 * y - r.b;
    return r.op === '<=' ? d <= 1e-7 : r.op === '>=' ? d >= -1e-7 : Math.abs(d) <= 1e-7;
  });
  const vertices = [];
  for (let i = 0; i < fronteras.length; i++) for (let j = i + 1; j < fronteras.length; j++) {
    const r = fronteras[i], s = fronteras[j], det = r.a1 * s.a2 - s.a1 * r.a2;
    if (Math.abs(det) <= EPS) continue;
    const x = limpiar((r.b * s.a2 - s.b * r.a2) / det), y = limpiar((r.a1 * s.b - s.a1 * r.b) / det);
    if (!vertices.some(v => Math.abs(v.x - x) < EPS && Math.abs(v.y - y) < EPS)) vertices.push({ x, y, z: limpiar(modelo.c[0] * x + modelo.c[1] * y), factible: factible(x, y) });
  }
  const coords = vertices.flatMap(v => [Math.abs(v.x), Math.abs(v.y)]);
  const escala = Math.max(10, ...coords, ...Object.values(sol.x).map(Math.abs)) * 1.25;
  const limites = { xmax: escala, ymax: escala };
  const xmin = modelo.noNegativas.includes(modelo.variables[0]) ? 0 : -escala;
  const ymin = modelo.noNegativas.includes(modelo.variables[1]) ? 0 : -escala;
  let region = sol.estado === 'infactible' ? [] : [{ x: xmin, y: ymin }, { x: escala, y: ymin }, { x: escala, y: escala }, { x: xmin, y: escala }];
  function recortar(r, sentido) {
    const nueva = [], dist = p => sentido * (r.a1 * p.x + r.a2 * p.y - r.b);
    for (let i = 0; i < region.length; i++) {
      const p = region[i], q = region[(i + 1) % region.length], dp = dist(p), dq = dist(q);
      if (dp <= EPS) nueva.push(p);
      if ((dp <= EPS) !== (dq <= EPS)) { const t = dp / (dp - dq); nueva.push({ x: limpiar(p.x + t * (q.x - p.x)), y: limpiar(p.y + t * (q.y - p.y)) }); }
    }
    region = nueva.filter((p, i, a) => !a.slice(0, i).some(q => Math.abs(p.x - q.x) < EPS && Math.abs(p.y - q.y) < EPS));
  }
  fronteras.forEach(r => { recortar(r, r.op === '>=' ? -1 : 1); if (r.op === '=') recortar(r, -1); });
  const optimo = sol.estado === 'optimo' ? { x: sol.x[modelo.variables[0]], y: sol.x[modelo.variables[1]], z: sol.z } : null;
  return { estado: sol.estado, vertices, region, optimo, rectas, limites, isoZ: optimo ? { a1: modelo.c[0], a2: modelo.c[1], valor: optimo.z } : null };
}

export function resolverGrafico(modelo) { return limpiarResultado(resolverGraficoInterno(modelo)); }
