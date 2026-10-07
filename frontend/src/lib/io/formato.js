import { exigir, limpiar, numero } from './util';
export function redondear(x, d = 4) {
  numero(x, 'El valor'); exigir(Number.isInteger(d) && d >= 0 && d <= 15, 'Los decimales deben ser un entero entre 0 y 15.');
  return limpiar(Number(x.toFixed(d)));
}
export function aFraccion(x, maxDen = 1000) {
  numero(x, 'El valor'); exigir(Number.isSafeInteger(maxDen) && maxDen >= 1, 'El denominador máximo debe ser un entero positivo seguro.');
  x = limpiar(x); if (Number.isInteger(x)) return String(x);
  const signo = x < 0 ? '-' : '', valor = Math.abs(x);
  let p0 = 0, q0 = 1, p1 = 1, q1 = 0, y = valor;
  for (let k = 0; k < 100; k++) {
    const a = Math.floor(y), q2 = q0 + a * q1;
    if (q2 > maxDen) break;
    const p2 = p0 + a * p1; p0 = p1; q0 = q1; p1 = p2; q1 = q2;
    const resto = y - a; if (Math.abs(resto) < 1e-14) return q1 === 1 ? `${signo}${p1}` : `${signo}${p1}/${q1}`;
    y = 1 / resto;
  }
  const k = Math.floor((maxDen - q0) / q1), pa = p0 + k * p1, qa = q0 + k * q1;
  const [p, q] = Math.abs(p1 / q1 - valor) <= Math.abs(pa / qa - valor) ? [p1, q1] : [pa, qa];
  return p === 0 ? '0' : q === 1 ? `${signo}${p}` : `${signo}${p}/${q}`;
}
