import { limpiarResultado } from './util';
import { EPS, exigir, limpiar, numero } from './util';
function resolverCPMInterno(entrada) {
  exigir(Array.isArray(entrada) && entrada.length > 0, 'Debe indicar al menos una actividad.');
  const ids = new Set();
  entrada.forEach(a => { exigir(a && typeof a.id === 'string' && a.id.trim() && !ids.has(a.id), 'Cada actividad debe tener un identificador único y no vacío.'); ids.add(a.id); numero(a.duracion, 'La duración', 0); exigir(Array.isArray(a.predecesoras) && a.predecesoras.every(p => typeof p === 'string') && new Set(a.predecesoras).size === a.predecesoras.length, `Las predecesoras de ${a.id} son inválidas.`); });
  const mapa = new Map(entrada.map(a => [a.id, { id: a.id, duracion: a.duracion, predecesoras: [...a.predecesoras] }]));
  mapa.forEach(a => a.predecesoras.forEach(p => exigir(mapa.has(p), `Predecesora desconocida: ${p}.`)));
  const sucesoras = new Map(entrada.map(a => [a.id, []]));
  mapa.forEach(a => a.predecesoras.forEach(p => sucesoras.get(p).push(a.id)));
  const orden = [], visitadas = new Set(), enCurso = new Set();
  function visitar(id) { exigir(!enCurso.has(id), `La red contiene un ciclo en ${id}.`); if (visitadas.has(id)) return; enCurso.add(id); mapa.get(id).predecesoras.forEach(visitar); enCurso.delete(id); visitadas.add(id); orden.push(id); }
  entrada.forEach(a => visitar(a.id));
  orden.forEach(id => { const a = mapa.get(id); a.ES = Math.max(0, ...a.predecesoras.map(p => mapa.get(p).EF)); a.EF = limpiar(a.ES + a.duracion); });
  const duracion = Math.max(...[...mapa.values()].map(a => a.EF));
  [...orden].reverse().forEach(id => { const a = mapa.get(id), ss = sucesoras.get(id); a.LF = ss.length ? Math.min(...ss.map(s => mapa.get(s).LS)) : duracion; a.LS = limpiar(a.LF - a.duracion); a.holgura = limpiar(a.LS - a.ES); a.critica = Math.abs(a.holgura) < EPS; });
  const rutasCriticas = [];
  function recorrer(id, ruta) {
    const a = mapa.get(id), ss = sucesoras.get(id).filter(s => mapa.get(s).critica && Math.abs(a.EF - mapa.get(s).ES) < EPS);
    const nueva = [...ruta, id];
    if (!ss.length && Math.abs(a.EF - duracion) < EPS) rutasCriticas.push(nueva);
    ss.forEach(s => recorrer(s, nueva));
  }
  orden.filter(id => { const a = mapa.get(id); return a.critica && a.ES === 0 && !a.predecesoras.some(p => mapa.get(p).critica && Math.abs(mapa.get(p).EF - a.ES) < EPS); }).forEach(id => recorrer(id, []));
  return { actividades: entrada.map(a => mapa.get(a.id)), duracion, rutaCritica: rutasCriticas[0] || [], rutasCriticas };
}
function normalCDF(z) {
  if (z === Infinity) return 1; if (z === -Infinity) return 0;
  const x = Math.abs(z) / Math.sqrt(2), t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return Math.max(0, Math.min(1, (1 + (z < 0 ? -erf : erf)) / 2));
}
function resolverPERTInterno(entrada, plazo) {
  exigir(Array.isArray(entrada) && entrada.length > 0, 'Debe indicar al menos una actividad PERT.');
  const estimaciones = entrada.map(a => { exigir(a && typeof a === 'object', 'Actividad PERT inválida.'); numero(a.a, 'El tiempo optimista', 0); numero(a.m, 'El tiempo probable', 0); numero(a.b, 'El tiempo pesimista', 0); exigir(a.a <= a.m && a.m <= a.b, `En ${a.id} debe cumplirse a ≤ m ≤ b.`); return { te: limpiar((a.a + 4 * a.m + a.b) / 6), varianza: limpiar(((a.b - a.a) / 6) ** 2) }; });
  if (plazo !== undefined && plazo !== null) numero(plazo, 'El plazo', 0);
  const cpm = resolverCPM(entrada.map((a, i) => ({ id: a.id, predecesoras: a.predecesoras, duracion: estimaciones[i].te })));
  const actividades = cpm.actividades.map((a, i) => ({ ...a, ...estimaciones[i] })), porId = new Map(actividades.map(a => [a.id, a]));
  // Si hay rutas igualmente largas, se utiliza la de mayor varianza.
  const rutaCritica = [...cpm.rutasCriticas].sort((a, b) => b.reduce((s, id) => s + porId.get(id).varianza, 0) - a.reduce((s, id) => s + porId.get(id).varianza, 0))[0];
  const varianzaRuta = limpiar(rutaCritica.reduce((s, id) => s + porId.get(id).varianza, 0)), desviacion = Math.sqrt(varianzaRuta), tienePlazo = plazo !== undefined && plazo !== null;
  const z = tienePlazo ? (desviacion > 0 ? (plazo - cpm.duracion) / desviacion : plazo >= cpm.duracion ? Infinity : -Infinity) : null;
  return { ...cpm, actividades, rutaCritica, varianzaRuta, desviacion, plazo: tienePlazo ? plazo : null, z: z === null ? null : limpiar(z), probabilidad: tienePlazo ? normalCDF(z) : null };
}

export function resolverCPM(entrada) { return limpiarResultado(resolverCPMInterno(entrada)); }

export function resolverPERT(entrada, plazo) { return limpiarResultado(resolverPERTInterno(entrada, plazo)); }
