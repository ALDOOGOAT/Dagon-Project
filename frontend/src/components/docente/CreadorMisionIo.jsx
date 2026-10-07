import { Plus, Trash2 } from 'lucide-react';

// Constructor de misiones NUMERICO para módulos de Investigación de Operaciones.
// El servidor valida y normaliza la configuración; las respuestas nunca se envían al alumno.
export const campoVacio = () => ({ clave: '', etiqueta: '', tipo: 'numero', opciones: '', respuesta: '', unidad: '' });

export const misionIoInicial = () => ({ campos: [{ ...campoVacio(), clave: 'z', etiqueta: 'Valor óptimo Z' }], abs: '0.001', rel: '0.001' });

/** Convierte el estado del formulario al JSON de configuracion_extra; lanza Error en español si falta algo. */
export function construirConfiguracionIo(mision) {
  if (!mision.campos.length) throw new Error('Agrega al menos un campo de respuesta.');
  const claves = new Set();
  const campos = [], respuestas = {};
  mision.campos.forEach((c, i) => {
    const clave = c.clave.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,29}$/.test(clave) || claves.has(clave)) throw new Error(`Campo ${i + 1}: la clave debe ser única y empezar con letra (ej. x1, z).`);
    if (!c.etiqueta.trim()) throw new Error(`Campo ${i + 1}: escribe la etiqueta que verá el alumno.`);
    if (!String(c.respuesta).trim()) throw new Error(`Campo ${i + 1}: falta la respuesta esperada.`);
    claves.add(clave);
    const campo = { clave, etiqueta: c.etiqueta.trim(), tipo: c.tipo };
    if (c.unidad.trim()) campo.unidad = c.unidad.trim();
    if (c.tipo === 'opcion') {
      campo.opciones = c.opciones.split(',').map((o) => o.trim()).filter(Boolean);
      if (campo.opciones.length < 2) throw new Error(`Campo ${i + 1}: escribe al menos dos opciones separadas por comas.`);
      if (!campo.opciones.includes(String(c.respuesta).trim())) throw new Error(`Campo ${i + 1}: la respuesta debe ser una de las opciones.`);
    }
    campos.push(campo);
    respuestas[clave] = String(c.respuesta).trim();
  });
  return JSON.stringify({ tipo_validacion: 'NUMERICO', campos, respuestas, tolerancia: { abs: Number(mision.abs), rel: Number(mision.rel) } });
}

export const CreadorMisionIo = ({ mision, onChange, estilo }) => {
  const { borderColor, headingColor, mutedColor, inputStyle } = estilo;
  const actualizar = (i, cambios) => onChange({ ...mision, campos: mision.campos.map((c, j) => (j === i ? { ...c, ...cambios } : c)) });
  const input = 'rounded-xl border bg-transparent px-3 py-2 text-sm min-h-[44px]';

  return (
    <fieldset className="grid gap-3 rounded-2xl border p-3" style={{ borderColor }}>
      <legend className="px-2 text-xs font-bold uppercase tracking-widest" style={{ color: mutedColor }}>Respuestas de la misión (IO)</legend>
      <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>
        El alumno verá un campo por fila. Las respuestas numéricas aceptan decimales o fracciones (3/4) y se comparan con la tolerancia indicada.
      </p>
      {mision.campos.map((c, i) => (
        <div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2" style={{ borderColor }}>
          <input aria-label={`Clave del campo ${i + 1}`} value={c.clave} onChange={(e) => actualizar(i, { clave: e.target.value })} placeholder="Clave (x1, z…)" className={`${input} font-mono`} style={inputStyle} />
          <input aria-label={`Etiqueta del campo ${i + 1}`} value={c.etiqueta} onChange={(e) => actualizar(i, { etiqueta: e.target.value })} placeholder="Etiqueta para el alumno" className={input} style={inputStyle} />
          <select aria-label={`Tipo del campo ${i + 1}`} value={c.tipo} onChange={(e) => actualizar(i, { tipo: e.target.value })} className={input} style={inputStyle}>
            <option value="numero">Número</option>
            <option value="opcion">Opción múltiple</option>
          </select>
          <input aria-label={`Unidad del campo ${i + 1}`} value={c.unidad} onChange={(e) => actualizar(i, { unidad: e.target.value })} placeholder="Unidad (opcional)" className={input} style={inputStyle} />
          {c.tipo === 'opcion' && (
            <input aria-label={`Opciones del campo ${i + 1}`} value={c.opciones} onChange={(e) => actualizar(i, { opciones: e.target.value })} placeholder="Opciones separadas por comas" className={`${input} sm:col-span-2`} style={inputStyle} />
          )}
          <div className="flex gap-2 sm:col-span-2">
            <input aria-label={`Respuesta del campo ${i + 1}`} value={c.respuesta} onChange={(e) => actualizar(i, { respuesta: e.target.value })} placeholder="Respuesta esperada" className={`${input} flex-1 font-mono`} style={inputStyle} />
            <button type="button" aria-label={`Quitar campo ${i + 1}`} disabled={mision.campos.length === 1} onClick={() => onChange({ ...mision, campos: mision.campos.filter((_, j) => j !== i) })} className="min-h-[44px] min-w-[44px] rounded-xl border disabled:opacity-40" style={{ borderColor, color: '#fca5a5' }}>
              <Trash2 className="mx-auto h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" disabled={mision.campos.length >= 10} onClick={() => onChange({ ...mision, campos: [...mision.campos, campoVacio()] })} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-sm font-bold disabled:opacity-40" style={{ borderColor, color: headingColor }}>
        <Plus className="h-4 w-4" /> Agregar campo
      </button>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs" style={{ color: mutedColor }}>Tolerancia absoluta
          <input inputMode="decimal" value={mision.abs} onChange={(e) => onChange({ ...mision, abs: e.target.value })} className={`${input} font-mono`} style={inputStyle} />
        </label>
        <label className="grid gap-1 text-xs" style={{ color: mutedColor }}>Tolerancia relativa
          <input inputMode="decimal" value={mision.rel} onChange={(e) => onChange({ ...mision, rel: e.target.value })} className={`${input} font-mono`} style={inputStyle} />
        </label>
      </div>
    </fieldset>
  );
};

export default CreadorMisionIo;
