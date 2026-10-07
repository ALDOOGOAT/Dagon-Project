import { useCallback, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../contexts/ThemeContext';
import { Formula } from './Formula';

// Acepta "3/4", "1,5" y "-2.25". Devuelve NaN si el texto no es un número.
export const parseNumero = (txt) => {
  if (typeof txt === 'number') return txt;
  const t = String(txt ?? '').trim().replace(/,/g, '.');
  if (t === '') return NaN;
  const frac = t.match(/^([-+]?\d+(?:\.\d+)?)\s*\/\s*([-+]?\d+(?:\.\d+)?)$/);
  if (frac) {
    const den = Number(frac[2]);
    return den === 0 ? NaN : Number(frac[1]) / den;
  }
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? Number(t) : NaN;
};

// Igual que parseNumero pero lanza un Error en español para mostrarlo al usuario.
export const numeroDe = (txt, nombre) => {
  const n = parseNumero(txt);
  if (!Number.isFinite(n)) throw new Error(`${nombre}: "${String(txt).trim() || 'vacío'}" no es un número válido.`);
  return n;
};

export const fmt = (x, d = 4) => {
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  if (x === Infinity) return '∞';
  if (x === -Infinity) return '-∞';
  if (typeof x !== 'number') return String(x);
  return Number.isInteger(x) ? String(x) : String(parseFloat(x.toFixed(d)));
};

// Estado + error de un solver: ejecuta fn, guarda el resultado o muestra el mensaje del Error.
export const useResolver = () => {
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const correr = useCallback((fn) => {
    try {
      setError(null);
      setResultado(fn());
    } catch (e) {
      setResultado(null);
      const mensaje = e?.message || 'No se pudo resolver el problema.';
      setError(mensaje);
      toast.error(mensaje);
    }
  }, []);
  return { resultado, error, correr, limpiar: () => { setResultado(null); setError(null); } };
};

export const useChartTheme = () => {
  const { colors } = useTheme();
  return {
    colors,
    tick: { fill: colors.textMuted, fontSize: 11 },
    grid: colors.border,
    tooltip: {
      contentStyle: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        color: colors.text,
        fontSize: 12,
      },
      labelStyle: { color: colors.textMuted },
    },
  };
};

export const Panel = ({ titulo, icono: Icono, accion, children, className = '' }) => {
  const { colors } = useTheme();
  return (
    <section className={`io-panel glass-card-apple rounded-2xl border p-4 sm:p-5 ${className}`} style={{ borderColor: colors.border }}>
      {(titulo || accion) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {titulo && (
            <h3 className="flex items-center gap-2 font-display text-base font-black sm:text-lg" style={{ color: colors.text }}>
              {Icono && <Icono className="h-4 w-4" style={{ color: colors.primary }} />}
              {titulo}
            </h3>
          )}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
};

export const ErrorIO = ({ mensaje }) => {
  if (!mensaje) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border px-3 py-2.5 font-gameui text-sm"
      style={{ borderColor: 'rgba(239,68,68,0.55)', backgroundColor: 'rgba(239,68,68,0.10)', color: '#fca5a5' }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{mensaje}</span>
    </div>
  );
};

export const Boton = ({ children, icono: Icono, variante = 'primario', className = '', ...rest }) => (
  <button type="button" className={`io-btn io-btn--${variante} ${className}`} {...rest}>
    {Icono && <Icono className="h-4 w-4" />}
    {children}
  </button>
);

export const Etiqueta = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="mb-1 block font-gameui text-xs font-bold uppercase tracking-wider opacity-80">
    {children}
  </label>
);

export const CeldaInput = ({ valor, onChange, etiqueta, className = '' }) => (
  <input
    value={valor}
    onChange={(e) => onChange(e.target.value)}
    inputMode="decimal"
    aria-label={etiqueta}
    className={`io-input io-celda ${className}`}
    autoComplete="off"
  />
);

export const TablaScroll = ({ children, className = '' }) => (
  <div className={`io-scroll ${className}`} tabIndex={0} role="region" aria-label="Tabla de datos desplazable">
    <table className="io-tabla">{children}</table>
  </div>
);

export const Metricas = ({ items }) => (
  <dl className="io-metricas">
    {items.map((m) => (
      <div key={m.etiqueta} className="io-metrica">
        <dt>{m.etiqueta}</dt>
        <dd>{m.valor}</dd>
      </div>
    ))}
  </dl>
);

// Lista de pasos {texto, formula?}: la fórmula se pinta con KaTeX debajo del texto.
export const PasosLista = ({ pasos, titulo = 'Procedimiento' }) => {
  if (!Array.isArray(pasos) || pasos.length === 0) return null;
  return (
    <details className="io-detalle" open>
      <summary>{titulo}</summary>
      <ol className="io-pasos">
        {pasos.map((p, i) => (
          <li key={i}>
            <span>{typeof p === 'string' ? p : p.texto}</span>
            {p?.formula && <Formula latex={p.formula} bloque />}
          </li>
        ))}
      </ol>
    </details>
  );
};

export const Insignia = ({ children, tono = 'ok' }) => {
  const mapa = {
    ok: ['rgba(16,185,129,0.15)', '#6ee7b7'],
    aviso: ['rgba(245,158,11,0.16)', '#fcd34d'],
    error: ['rgba(239,68,68,0.15)', '#fca5a5'],
    info: ['rgba(56,189,248,0.15)', '#7dd3fc'],
  };
  const [bg, fg] = mapa[tono] || mapa.ok;
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1 font-gameui text-xs font-black" style={{ backgroundColor: bg, color: fg }}>
      {children}
    </span>
  );
};

// Matriz editable de strings. `onCambio(i, j, valor)`.
export const MatrizEditable = ({ datos, onCambio, etiquetaFila, etiquetaCol, nombre }) => (
  <TablaScroll>
    <tbody>
      {datos.map((fila, i) => (
        <tr key={i}>
          {etiquetaFila && <th scope="row">{etiquetaFila(i)}</th>}
          {fila.map((v, j) => (
            <td key={j}>
              <CeldaInput
                valor={v}
                onChange={(val) => onCambio(i, j, val)}
                etiqueta={`${nombre || 'Celda'} fila ${i + 1} columna ${j + 1}${etiquetaCol ? ` (${etiquetaCol(j)})` : ''}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </TablaScroll>
);

// Redimensiona una matriz de strings conservando lo ya escrito.
export const redimensionar = (m, filas, cols, relleno = '0') =>
  Array.from({ length: filas }, (_, i) => Array.from({ length: cols }, (_, j) => (m[i] && m[i][j] !== undefined ? m[i][j] : relleno)));
