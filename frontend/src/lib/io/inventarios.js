import { limpiarResultado } from './util';
import { exigir, limpiar, numero } from './util';
const positivo = (x, nombre) => numero(x, nombre, 0, true);
function datosEOQ(datos) { exigir(datos && typeof datos === 'object', 'Indique los parámetros del inventario.'); ['D', 'S', 'H'].forEach(k => positivo(datos[k], k)); }
function curva(Q, ordenar, mantener, compra = 0) {
  return Array.from({ length: 41 }, (_, j) => { const q = Q * (0.25 + j * 1.75 / 40), o = ordenar(q), h = mantener(q); return { q: limpiar(q), ordenar: limpiar(o), mantener: limpiar(h), total: limpiar(o + h + compra) }; });
}
function eoqInterno(datos) {
  datosEOQ(datos); const { D, S, H } = datos, Q = Math.sqrt(2 * D * S / H), ordenar = q => D * S / q, mantener = q => H * q / 2;
  return { Q, N: D / Q, T: Q / D, costoTotal: ordenar(Q) + mantener(Q), curva: curva(Q, ordenar, mantener), pasos: [{ texto: 'Calcular el lote económico.', formula: 'Q^*=\\sqrt{\\frac{2DS}{H}}' }, { texto: 'Sumar los costos anuales de ordenar y mantener.', formula: 'CT=\\frac{DS}{Q}+\\frac{HQ}{2}' }] };
}
function eoqFaltantesInterno(datos) {
  datosEOQ(datos); const { D, S, H, p } = datos; positivo(p, 'El costo por faltante');
  const Q = Math.sqrt(2 * D * S * (H + p) / (H * p)), inventarioMaximo = Q * p / (H + p), faltanteMaximo = Q * H / (H + p), costoMantener = H * inventarioMaximo ** 2 / (2 * Q), costoFaltantes = p * faltanteMaximo ** 2 / (2 * Q);
  const ordenar = q => D * S / q, mantener = q => H * p * q / (2 * (H + p));
  return { Q, N: D / Q, T: Q / D, inventarioMaximo, faltanteMaximo, costoMantener, costoFaltantes, costoTotal: ordenar(Q) + costoMantener + costoFaltantes, curva: curva(Q, ordenar, mantener), pasos: [{ texto: 'Calcular el lote con faltantes planeados; p es el costo anual por unidad faltante.', formula: 'Q^*=\\sqrt{\\frac{2DS(H+p)}{Hp}}' }, { texto: 'Distribuir el lote entre inventario y faltantes.', formula: 'I_{max}=\\frac{pQ}{H+p},\\quad B_{max}=\\frac{HQ}{H+p}' }, { texto: 'Sumar ordenar, mantener y faltantes; la curva agrupa los dos últimos costos.', formula: 'CT=\\frac{DS}{Q}+\\frac{HI_{max}^2+pB_{max}^2}{2Q}' }] };
}
function epqInterno(datos) {
  datosEOQ(datos); const { D, S, H, P } = datos; positivo(P, 'La producción anual'); exigir(P > D, 'La producción anual P debe ser mayor que la demanda D.');
  const factor = 1 - D / P, Q = Math.sqrt(2 * D * S / (H * factor)), ordenar = q => D * S / q, mantener = q => H * q * factor / 2;
  return { Q, N: D / Q, T: Q / D, inventarioMaximo: Q * factor, tiempoProduccion: Q / P, costoTotal: ordenar(Q) + mantener(Q), curva: curva(Q, ordenar, mantener), pasos: [{ texto: 'Calcular el lote de producción económica.', formula: 'Q^*=\\sqrt{\\frac{2DS}{H(1-D/P)}}' }, { texto: 'Calcular el inventario máximo y el costo anual.', formula: 'I_{max}=Q(1-D/P),\\quad CT=DS/Q+HI_{max}/2' }] };
}
function descuentosInterno(datos) {
  exigir(datos && typeof datos === 'object', 'Indique los parámetros de descuentos.'); const { D, S, i, tramos } = datos;
  positivo(D, 'D'); positivo(S, 'S'); positivo(i, 'La tasa de mantenimiento');
  exigir(Array.isArray(tramos) && tramos.length > 0, 'Indique al menos un tramo de precio.');
  tramos.forEach((t, j) => { exigir(t && typeof t === 'object', 'Tramo inválido.'); numero(t.min, 'La cantidad mínima', 0); positivo(t.precio, 'El precio'); if (j) { exigir(t.min > tramos[j - 1].min, 'Los mínimos de los tramos deben ser estrictamente crecientes.'); exigir(t.precio <= tramos[j - 1].precio, 'Los precios de descuento deben ser no crecientes.'); } });
  const candidatos = [], pasos = [];
  tramos.forEach((t, j) => {
    const H = i * t.precio, ideal = Math.sqrt(2 * D * S / H), Q = Math.max(ideal, t.min), superior = j + 1 < tramos.length ? tramos[j + 1].min : Infinity;
    if (Q < superior) candidatos.push({ Q, precio: t.precio, H, costoTotal: D * t.precio + D * S / Q + H * Q / 2 });
    pasos.push({ texto: `Tramo ${j + 1}: precio ${t.precio}, lote ideal ${ideal}; ${Q < superior ? `candidato factible ${Q}` : 'el lote ideal excede el tramo'}.`, formula: 'CT(Q)=Dp+DS/Q+ipQ/2' });
  });
  exigir(candidatos.length, 'No existe un lote factible para los tramos indicados.'); candidatos.sort((a, b) => a.costoTotal - b.costoTotal);
  const mejor = candidatos[0];
  // Curva de costos por precio efectivo, no una prolongación inválida del tramo ganador.
  const curvaCostos = Array.from({ length: 41 }, (_, j) => {
    const q = Math.max(tramos[0].min, mejor.Q * (0.25 + j * 1.75 / 40)), t = [...tramos].reverse().find(t => q >= t.min), ordenar = D * S / q, mantener = i * t.precio * q / 2;
    return { q, ordenar, mantener, total: D * t.precio + ordenar + mantener };
  });
  return { ...mejor, N: D / mejor.Q, T: mejor.Q / D, candidatos, curva: curvaCostos, pasos };
}
function puntoReordenInterno(datos) {
  exigir(datos && typeof datos === 'object', 'Indique los parámetros de reorden.'); const { d, L, sigma = 0, z = 0 } = datos;
  numero(d, 'La demanda por unidad de tiempo', 0); numero(L, 'El tiempo de entrega', 0); numero(sigma, 'La desviación de la demanda', 0); numero(z, 'El factor de servicio', 0);
  const stockSeguridad = limpiar(z * sigma * Math.sqrt(L)), R = limpiar(d * L + stockSeguridad);
  return { R, puntoReorden: R, stockSeguridad, demandaDuranteEntrega: limpiar(d * L), pasos: [{ texto: 'Cubrir la demanda durante la entrega y agregar seguridad (sigma por unidad de tiempo).', formula: 'R=dL+z\\sigma\\sqrt{L}' }] };
}
function periodoFijoInterno(datos) {
  exigir(datos && typeof datos === 'object', 'Indique los parámetros del período fijo.'); const { d, T, L, sigma, z, inventario } = datos;
  numero(d, 'La demanda', 0); positivo(T, 'El período de revisión'); numero(L, 'El tiempo de entrega', 0); numero(sigma, 'La desviación', 0); numero(z, 'El factor de servicio', 0); numero(inventario, 'La posición de inventario');
  const stockSeguridad = limpiar(z * sigma * Math.sqrt(T + L)), nivelObjetivo = limpiar(d * (T + L) + stockSeguridad), Q = limpiar(Math.max(0, nivelObjetivo - inventario));
  return { Q, T, stockSeguridad, nivelObjetivo, pasos: [{ texto: 'Cubrir la demanda hasta la siguiente revisión y entrega.', formula: 'M=d(T+L)+z\\sigma\\sqrt{T+L}' }, { texto: 'Restar la posición de inventario (existencias más pedidos menos faltantes).', formula: 'Q=\\max(0,M-I)' }] };
}

export function eoq(datos) { return limpiarResultado(eoqInterno(datos)); }

export function eoqFaltantes(datos) { return limpiarResultado(eoqFaltantesInterno(datos)); }

export function epq(datos) { return limpiarResultado(epqInterno(datos)); }

export function descuentos(datos) { return limpiarResultado(descuentosInterno(datos)); }

export function puntoReorden(datos) { return limpiarResultado(puntoReordenInterno(datos)); }

export function periodoFijo(datos) { return limpiarResultado(periodoFijoInterno(datos)); }
