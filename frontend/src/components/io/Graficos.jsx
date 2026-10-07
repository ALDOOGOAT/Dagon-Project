import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ReferenceDot, ReferenceLine,
  ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis,
} from 'recharts';
import { fmt, useChartTheme } from './ui';

// Gráficas genéricas de la calculadora IO: series (curvas de costo, Markov, f(x)), barras
// (distribuciones discretas, criterios de decisión, estrategias) y contorno (funciones de dos variables).

const usePaleta = () => {
  const tema = useChartTheme();
  return { ...tema, paleta: [tema.colors.primary, tema.colors.accent, tema.colors.secondary, '#34d399', '#f472b6', '#fb923c'] };
};
const etiquetaEje = (valor, colors, posicion) => (valor ? { value: valor, position: posicion, fill: colors.textMuted, fontSize: 12 } : undefined);
const formatoTooltip = (v) => (typeof v === 'number' ? fmt(v) : v);

export const GraficoSeries = ({ grafico }) => {
  const { colors, tick, grid, tooltip, paleta } = usePaleta();
  return (
    <div className="h-80 min-w-0 sm:h-96" role="img" aria-label={`Gráfica de ${grafico.series.map((s) => s.nombre).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={grafico.datos} margin={{ top: 12, right: 18, bottom: 22, left: 6 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" />
          <XAxis dataKey={grafico.xKey} type="number" domain={['dataMin', 'dataMax']} tick={tick} tickFormatter={(v) => fmt(v, 2)} label={etiquetaEje(grafico.xLabel, colors, 'insideBottom')} />
          <YAxis tick={tick} width={56} tickFormatter={(v) => fmt(v, 2)} label={etiquetaEje(grafico.yLabel, colors, 'insideLeft')} />
          <Tooltip {...tooltip} formatter={formatoTooltip} labelFormatter={(v) => `${grafico.xLabel || grafico.xKey} = ${fmt(v)}`} />
          <Legend verticalAlign="top" height={28} />
          {grafico.series.map((s, i) => (
            <Line key={s.key} name={s.nombre} dataKey={s.key} stroke={paleta[i % paleta.length]} strokeWidth={i === grafico.series.length - 1 ? 2.5 : 1.8} dot={false} isAnimationActive={false} />
          ))}
          {(grafico.marcas || []).map((m) => (
            <ReferenceLine key={m.etiqueta} x={m.x} stroke={colors.primary} strokeDasharray="5 4" label={{ value: m.etiqueta, position: 'top', fill: colors.primary, fontSize: 12 }} />
          ))}
          {(grafico.puntos || []).map((p) => (
            <ReferenceDot key={p.etiqueta} x={p.x} y={p.y} r={6} fill={colors.primary} stroke={colors.surface} label={{ value: p.etiqueta, position: 'top', fill: colors.primary, fontSize: 12 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const GraficoBarras = ({ grafico }) => {
  const { colors, tick, grid, tooltip, paleta } = usePaleta();
  const una = grafico.series.length === 1;
  return (
    <div className="h-80 min-w-0 sm:h-96" role="img" aria-label={`Gráfica de barras: ${grafico.series.map((s) => s.nombre).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={grafico.datos} margin={{ top: 12, right: 18, bottom: 22, left: 6 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={grafico.xKey} tick={tick} interval={0} label={etiquetaEje(grafico.xLabel, colors, 'insideBottom')} />
          <YAxis tick={tick} width={56} tickFormatter={(v) => fmt(v, 2)} label={etiquetaEje(grafico.yLabel, colors, 'insideLeft')} />
          <Tooltip {...tooltip} formatter={formatoTooltip} cursor={{ fill: colors.border, fillOpacity: 0.25 }} />
          {!una && <Legend verticalAlign="top" height={28} />}
          {grafico.series.map((s, i) => (
            <Bar key={s.key} name={s.nombre} dataKey={s.key} fill={paleta[i % paleta.length]} radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {una && grafico.datos.map((d) => (
                <Cell key={String(d[grafico.xKey])} fill={grafico.destacar && d[grafico.xKey] === grafico.destacar ? colors.primary : colors.accent} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const GraficoContorno = ({ grafico }) => {
  const { colors, tick, grid, paleta } = usePaleta();
  const [vx, vy] = grafico.variables;
  return (
    <div>
      <div className="h-80 min-w-0 sm:h-96" role="img" aria-label={`Curvas de nivel de f(${vx}, ${vy}) y trayectoria del método`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 12, right: 18, bottom: 22, left: 6 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" domain={grafico.dominio.x} allowDataOverflow tick={tick} tickFormatter={(v) => fmt(v, 2)} label={etiquetaEje(vx, colors, 'insideBottomRight')} />
            <YAxis type="number" dataKey="y" domain={grafico.dominio.y} allowDataOverflow tick={tick} width={48} tickFormatter={(v) => fmt(v, 2)} label={etiquetaEje(vy, colors, 'insideTopLeft')} />
            {grafico.curvas.map((c, i) => (
              <Line key={c.nivel} data={c.puntos} dataKey="y" type="linear" dot={false} activeDot={false} connectNulls={false} stroke={paleta[(i + 1) % paleta.length]} strokeOpacity={0.85} strokeWidth={1.6} isAnimationActive={false} />
            ))}
            <Line data={grafico.trayectoria} dataKey="y" type="linear" stroke={colors.text} strokeDasharray="4 3" dot={{ r: 3, fill: colors.text }} isAnimationActive={false} />
            <Scatter data={[grafico.punto]} dataKey="y" fill={colors.primary} shape="star" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="io-leyenda">
        {grafico.curvas.map((c, i) => <li key={c.nivel}><i style={{ backgroundColor: paleta[(i + 1) % paleta.length] }} />f = {fmt(c.nivel, 3)}</li>)}
        <li><i className="io-leyenda__raya" style={{ borderColor: colors.text }} />Iteraciones desde el punto inicial</li>
        <li><i style={{ backgroundColor: colors.primary, borderRadius: 999 }} />Punto estacionario ({fmt(grafico.punto.x)}, {fmt(grafico.punto.y)}), f = {fmt(grafico.punto.f)}</li>
      </ul>
    </div>
  );
};
