// Resumen didáctico local. La XP y los desbloqueos siguen viniendo del servidor.
const clave = (usuario, modulo) => `dagon_io_progress:${usuario}:${modulo}`;
export const leerResumenIo = (usuario, modulo) => {
  try {
    return JSON.parse(localStorage.getItem(clave(usuario, modulo))) || { attempts: 0, successes: 0, failures: 0, concepts: [], recommendations: [] };
  } catch {
    return { attempts: 0, successes: 0, failures: 0, concepts: [], recommendations: [] };
  }
};
export const registrarIntentoIo = (usuario, modulo, ejercicio, resultado) => {
  const resumen = leerResumenIo(usuario, modulo);
  resumen.attempts += 1;
  if (resultado.success) resumen.successes += 1;
  else {
    resumen.failures += 1;
    resumen.recommendations = [`Repasa ${ejercicio.concept || ejercicio.title}: verifica las unidades y los pasos intermedios.`];
  }
  const etiqueta = ejercicio.concept || ejercicio.title;
  const concepto = resumen.concepts.find(c => c.label === etiqueta) || { key: etiqueta, label: etiqueta, attempts: 0, successes: 0, mastery: 0 };
  concepto.attempts += 1;
  if (resultado.success) concepto.successes += 1;
  concepto.mastery = Math.round(100 * concepto.successes / concepto.attempts);
  resumen.concepts = [...resumen.concepts.filter(c => c.label !== etiqueta), concepto];
  try { localStorage.setItem(clave(usuario, modulo), JSON.stringify(resumen)); } catch { /* El alumno puede seguir sin almacenamiento local. */ }
};
