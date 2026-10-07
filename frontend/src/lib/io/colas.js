import { limpiarResultado } from './util';
import { exigir, limpiar, numero } from './util';
function validar(datos, multiple = false) {
  exigir(datos && typeof datos === 'object', 'Indique los parámetros de la cola.');
  numero(datos.lambda, 'La tasa de llegadas', 0); numero(datos.mu, 'La tasa de servicio', 0, true);
  if (multiple) exigir(Number.isInteger(datos.s) && datos.s >= 1 && datos.s <= 10000, 'El número de servidores debe ser un entero entre 1 y 10000.');
  exigir(datos.lambda < datos.mu * (multiple ? datos.s : 1), 'La cola es inestable: la utilización rho debe ser menor que 1.');
}
function mm1Interno(datos) {
  validar(datos); const { lambda, mu } = datos, rho = lambda / mu, P0 = 1 - rho, L = rho / (1 - rho), Lq = rho ** 2 / (1 - rho), W = 1 / (mu - lambda), Wq = rho / (mu - lambda);
  return { rho: limpiar(rho), P0, L: limpiar(L), Lq: limpiar(Lq), W, Wq: limpiar(Wq), Pn: Array.from({ length: 16 }, (_, n) => ({ n, p: limpiar(P0 * rho ** n) })), estable: true, pasos: [{ texto: 'Comprobar que la utilización sea menor que uno.', formula: '\\rho=\\lambda/\\mu<1' }, { texto: 'Calcular las longitudes medias de la cola y del sistema.', formula: 'L=\\rho/(1-\\rho),\\quad L_q=\\rho^2/(1-\\rho)' }, { texto: 'Aplicar la ley de Little y el tiempo medio de servicio.', formula: 'W=1/(\\mu-\\lambda),\\quad W_q=W-1/\\mu' }] };
}
function mmsInterno(datos) {
  validar(datos, true); const { lambda, mu, s } = datos, a = lambda / mu, rho = a / s;
  // Recurrencia de Erlang B: evita factoriales y desbordamientos para muchos servidores.
  let B = 1; for (let k = 1; k <= s; k++) B = a * B / (k + a * B);
  const Pw = a === 0 ? 0 : B / (1 - rho + rho * B), Lq = Pw * rho / (1 - rho), Wq = lambda === 0 ? 0 : Lq / lambda, W = Wq + 1 / mu, L = Lq + a;
  let logTerm = 0, logSuma = 0;
  const sumarLog = (x, y) => { const m = Math.max(x, y); return m + Math.log(Math.exp(x - m) + Math.exp(y - m)); };
  for (let k = 1; k <= s; k++) { logTerm += a === 0 ? -Infinity : Math.log(a) - Math.log(k); logSuma = sumarLog(logSuma, logTerm - (k === s ? Math.log1p(-rho) : 0)); }
  const P0 = Math.exp(-logSuma);
  let logP = -logSuma;
  const Pn = Array.from({ length: 16 }, (_, n) => { if (n) logP += a === 0 ? -Infinity : n <= s ? Math.log(a) - Math.log(n) : Math.log(rho); return { n, p: limpiar(Math.exp(logP)) }; });
  return { rho: limpiar(rho), P0: limpiar(P0), L: limpiar(L), Lq: limpiar(Lq), W, Wq: limpiar(Wq), Pw: limpiar(Pw), Pn, estable: true, pasos: [{ texto: 'Verificar la capacidad conjunta de los servidores.', formula: '\\rho=\\lambda/(s\\mu)<1' }, { texto: 'Calcular la probabilidad de esperar mediante Erlang C.', formula: 'P_w=\\frac{B_s}{1-\\rho+\\rho B_s},\\quad B_k=\\frac{aB_{k-1}}{k+aB_{k-1}}' }, { texto: 'Aplicar la ley de Little.', formula: 'L_q=P_w\\rho/(1-\\rho),\\quad W_q=L_q/\\lambda,\\quad W=W_q+1/\\mu' }] };
}
export function costoColas(datos) {
  exigir(datos && typeof datos === 'object', 'Indique los parámetros del costo de colas.'); const { L, cs, cw, s } = datos;
  numero(L, 'El número medio en el sistema', 0); numero(cs, 'El costo por servidor', 0); numero(cw, 'El costo por cliente en el sistema', 0); exigir(Number.isInteger(s) && s > 0, 'El número de servidores debe ser un entero positivo.');
  return limpiar(cs * s + cw * L);
}

export function mm1(datos) { return limpiarResultado(mm1Interno(datos)); }

export function mms(datos) { return limpiarResultado(mmsInterno(datos)); }
