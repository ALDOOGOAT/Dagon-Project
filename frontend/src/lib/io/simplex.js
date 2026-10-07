import { limpiarResultado } from './util';
import { EPS, exigir, limpiar, producto, resolverSistema, validarModelo } from './util';

// Big-M simbólico: se compara primero el coeficiente de M y después el real.
function resolverSimplexInterno(modelo) {
  validarModelo(modelo);
  const { variables, c, A, b, ops } = modelo, n = variables.length, m = b.length;
  const signo = modelo.sentido === 'max' ? 1 : -1;
  const nombres = [], mapa = [], reales = [], grandes = [];
  variables.forEach((v, j) => {
    nombres.push(v); mapa.push({ j, factor: 1 }); reales.push(signo * c[j]); grandes.push(0);
    if (!modelo.noNegativas.includes(v)) { nombres.push(`${v}_neg`); mapa.push({ j, factor: -1 }); reales.push(-signo * c[j]); grandes.push(0); }
  });
  const nDec = nombres.length;
  const signos = b.map(x => x < 0 ? -1 : 1);
  let filas = A.map((r, i) => mapa.map(v => signos[i] * r[v.j] * v.factor));
  let rhs = b.map(Math.abs), base = [], originales = Array.from({ length: m }, (_, i) => i);
  const artificiales = new Set();
  function columna(nombre, fila, valor, art = false) {
    const j = nombres.length; nombres.push(nombre); reales.push(0); grandes.push(art ? -1 : 0);
    filas.forEach((r, i) => r.push(i === fila ? valor : 0));
    if (art) artificiales.add(j);
    return j;
  }
  ops.forEach((op, i) => {
    const o = signos[i] === 1 ? op : op === '<=' ? '>=' : op === '>=' ? '<=' : '=';
    if (o === '<=') base[i] = columna(`s_${i + 1}`, i, 1);
    else { if (o === '>=') columna(`e_${i + 1}`, i, -1); base[i] = columna(`a_${i + 1}`, i, 1, true); }
  });
  let originalA = filas.map(r => [...r]);
  const tablas = [], Mvisible = 1e6 * Math.max(1, ...c.map(Math.abs));
  function objetivo(costos) {
    return { fila: nombres.map((_, j) => limpiar(base.reduce((s, bj, i) => s + costos[bj] * filas[i][j], 0) - costos[j])), valor: limpiar(base.reduce((s, bj, i) => s + costos[bj] * rhs[i], 0)) };
  }
  function instantanea(titulo, entra = null, sale = null, razones = []) {
    const z = objetivo(reales), zm = objetivo(grandes);
    tablas.push({ titulo, encabezados: [...nombres], filas: filas.map((r, i) => ({ base: nombres[base[i]], valores: r.map(limpiar), rhs: limpiar(rhs[i]) })), filaZ: z.fila.map((x, j) => limpiar(x + Mvisible * zm.fila[j])), zValor: limpiar(signo * (z.valor + Mvisible * zm.valor)), pivote: entra === null ? null : { fila: sale, col: entra }, entra: entra === null ? null : nombres[entra], sale: sale === null ? null : nombres[base[sale]], razones });
  }
  function pivotar(i, j) {
    const p = filas[i][j]; filas[i] = filas[i].map(x => x / p); rhs[i] /= p;
    filas.forEach((r, k) => { if (k !== i) { const f = r[j]; filas[k] = r.map((x, l) => limpiar(x - f * filas[i][l])); rhs[k] = limpiar(rhs[k] - f * rhs[i]); } });
    base[i] = j;
  }
  let estado = 'optimo', contador = 0;
  while (true) {
    exigir(contador++ < 10000, 'El simplex excedió el límite de iteraciones. Revise la escala del modelo.');
    const zr = objetivo(reales).fila, zm = objetivo(grandes).fila;
    // Bland: primer índice elegible; en empate sale la variable básica de menor índice.
    const j = nombres.findIndex((_, k) => !base.includes(k) && (zm[k] < -EPS || (Math.abs(zm[k]) <= EPS && zr[k] < -EPS)));
    if (j < 0) break;
    const razones = filas.map((r, i) => r[j] > EPS ? limpiar(rhs[i] / r[j]) : null);
    let i = -1;
    razones.forEach((v, k) => { if (v !== null && (i < 0 || v < razones[i] - EPS || (Math.abs(v - razones[i]) <= EPS && base[k] < base[i]))) i = k; });
    if (i < 0) { estado = 'no_acotado'; break; }
    instantanea(`Iteración ${tablas.length + 1}: pivote de Big-M`, j, i, razones);
    pivotar(i, j);
  }
  if (base.some((j, i) => artificiales.has(j) && rhs[i] > EPS)) estado = 'infactible';
  if (estado === 'optimo') {
    for (let i = base.length - 1; i >= 0; i--) if (artificiales.has(base[i])) {
      const j = filas[i].findIndex((x, k) => !artificiales.has(k) && !base.includes(k) && Math.abs(x) > EPS);
      if (j >= 0) { instantanea('Retirar una artificial de valor cero', j, i, []); pivotar(i, j); }
      else { filas.splice(i, 1); rhs.splice(i, 1); base.splice(i, 1); originales.splice(i, 1); }
    }
    const mantener = nombres.map((_, j) => j).filter(j => !artificiales.has(j));
    filas = filas.map(r => mantener.map(j => r[j])); originalA = originalA.map(r => mantener.map(j => r[j]));
    base = base.map(j => mantener.indexOf(j));
    const ns = mantener.map(j => nombres[j]), cs = mantener.map(j => reales[j]);
    nombres.splice(0, nombres.length, ...ns); reales.splice(0, reales.length, ...cs); grandes.splice(0, grandes.length, ...ns.map(() => 0));
  }
  instantanea(estado === 'optimo' ? 'Tabla óptima' : estado === 'infactible' ? 'Modelo infactible' : 'Objetivo no acotado');
  const xv = Array(n).fill(0);
  if (estado !== 'infactible') base.forEach((j, i) => { if (j < nDec) xv[mapa[j].j] += mapa[j].factor * rhs[i]; });
  const x = Object.fromEntries(variables.map((v, j) => [v, limpiar(xv[j])]));
  const holguras = Object.fromEntries(A.map((r, i) => [`${ops[i] === '>=' ? 'e' : 's'}_${i + 1}`, limpiar(ops[i] === '>=' ? producto(r, xv) - b[i] : b[i] - producto(r, xv))]));
  const sensibilidad = { b: b.map(actual => ({ actual, min: null, max: null })), c: c.map(actual => ({ actual, min: null, max: null })) };
  let duales = [], multiple = false;
  if (estado === 'optimo') {
    const k = base.length, B = originales.map(i => base.map(j => originalA[i][j]));
    const bt = base.map((_, j) => B.map(r => r[j]));
    const y = resolverSistema(bt, base.map(j => reales[j]));
    duales = b.map(() => 0); originales.forEach((i, r) => { duales[i] = limpiar(signo * signos[i] * y[r]); });
    b.forEach((actual, i) => {
      const r = originales.indexOf(i);
      if (r < 0) { sensibilidad.b[i] = { actual, min: actual, max: actual }; return; }
      const d = resolverSistema(B, originales.map((_, t) => t === r ? signos[i] : 0));
      let lo = -Infinity, hi = Infinity;
      d.forEach((v, t) => { if (v > EPS) lo = Math.max(lo, -rhs[t] / v); if (v < -EPS) hi = Math.min(hi, -rhs[t] / v); });
      sensibilidad.b[i] = { actual, min: limpiar(actual + lo), max: limpiar(actual + hi) };
    });
    const zfila = objetivo(reales).fila;
    c.forEach((actual, j) => {
      const dc = nombres.map((_, t) => t < nDec && mapa[t].j === j ? signo * mapa[t].factor : 0);
      let lo = -Infinity, hi = Infinity;
      nombres.forEach((_, t) => { if (!base.includes(t)) {
        const d = base.reduce((s, bj, r) => s + dc[bj] * filas[r][t], 0) - dc[t];
        if (d > EPS) lo = Math.max(lo, -zfila[t] / d);
        if (d < -EPS) hi = Math.min(hi, -zfila[t] / d);
      } });
      sensibilidad.c[j] = { actual, min: limpiar(actual + lo), max: limpiar(actual + hi) };
    });
    // Recorrer pivotes degenerados de coste cero para distinguir bases de soluciones múltiples.
    const pendientes = [{ F: filas, R: rhs, B: base }], vistas = new Set();
    for (let t = 0; t < pendientes.length && t < 1000 && !multiple; t++) {
      const { F, R, B: bb } = pendientes[t], clave = [...bb].sort((a, b) => a - b).join(',');
      if (vistas.has(clave)) continue; vistas.add(clave);
      for (let j = 0; j < nombres.length && !multiple; j++) if (!bb.includes(j) && Math.abs(zfila[j]) <= EPS) {
        let paso = Infinity;
        F.forEach((r, i) => { if (r[j] > EPS) paso = Math.min(paso, R[i] / r[j]); });
        const dir = Array(n).fill(0);
        if (j < nDec) dir[mapa[j].j] += mapa[j].factor;
        bb.forEach((bj, i) => { if (bj < nDec) dir[mapa[bj].j] -= mapa[bj].factor * F[i][j]; });
        if (paso > EPS && dir.some(v => Math.abs(v) > EPS)) { multiple = true; break; }
        if (paso <= EPS) F.forEach((r, i) => { if (r[j] > EPS && Math.abs(R[i] / r[j] - paso) <= EPS) {
          const FF = F.map(row => [...row]), RR = [...R], BB = [...bb], p = FF[i][j];
          FF[i] = FF[i].map(v => v / p); RR[i] /= p;
          FF.forEach((row, l) => { if (l !== i) { const f = row[j]; FF[l] = row.map((v, h) => limpiar(v - f * FF[i][h])); RR[l] = limpiar(RR[l] - f * RR[i]); } });
          BB[i] = j; pendientes.push({ F: FF, R: RR, B: BB });
        } });
      }
    }
    exigir(k === originales.length, 'No se pudo reconstruir la base óptima.');
  }
  return { estado, z: estado === 'optimo' ? limpiar(producto(c, xv)) : null, x, holguras, tablas, duales, sensibilidad, multiple };
}

export function resolverSimplex(modelo) { return limpiarResultado(resolverSimplexInterno(modelo)); }
