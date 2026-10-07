import { useMemo } from 'react';
import {
  ComposedChart, Area, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { fmt, useChartTheme } from './ui';

const EPS = 1e-9;

// Para cada x de la lista, el tramo [lo, hi] que ocupa el polígono convexo en esa vertical.
const cortesVerticales = (poly, xs) => xs.map((x) => {
  const ys = [];
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % poly.length];
    if (Math.abs(p.x - q.x) < EPS) {
      if (Math.abs(p.x - x) < EPS) ys.push(p.y, q.y);
    } else if (x >= Math.min(p.x, q.x) - EPS && x <= Math.max(p.x, q.x) + EPS) {
      ys.push(p.y + ((q.y - p.y) * (x - p.x)) / (q.x - p.x));
    }
  });
  return ys.length ? { x, rango: [Math.min(...ys), Math.max(...ys)] } : null;
}).filter(Boolean);

// Extremos de la recta a1*x + a2*y = b dentro de la caja del gráfico.
const segmentoEnCaja = (a1, a2, b, [x0, x1], [y0, y1]) => {
  const pts = [];
  const dentro = (v, lo, hi) => v >= lo - 1e-7 && v <= hi + 1e-7;
  if (Math.abs(a2) > EPS) [x0, x1].forEach((x) => { const y = (b - a1 * x) / a2; if (dentro(y, y0, y1)) pts.push({ x, y }); });
  if (Math.abs(a1) > EPS) [y0, y1].forEach((y) => { const x = (b - a2 * y) / a1; if (dentro(x, x0, x1)) pts.push({ x, y }); });
  const unicos = pts.filter((p, i) => !pts.slice(0, i).some((q) => Math.abs(p.x - q.x) < 1e-7 && Math.abs(p.y - q.y) < 1e-7));
  return unicos.length >= 2 ? [unicos[0], unicos[unicos.length - 1]] : null;
};

const texto = (r, vars) => {
  const partes = [[r.a1, vars[0]], [r.a2, vars[1]]]
    .filter(([c]) => c !== 0)
    .map(([c, v], i) => `${c < 0 ? (i ? ' - ' : '-') : (i ? ' + ' : '')}${Math.abs(c) === 1 ? '' : fmt(Math.abs(c))}${v}`);
  return `${partes.join('') || '0'} ${r.op} ${fmt(r.b)}`;
};

// Retícula entera: puntos pequeños para no tapar la región factible.
const PuntoEntero = ({ cx, cy, fill, fillOpacity }) => <circle cx={cx} cy={cy} r={2.6} fill={fill} fillOpacity={fillOpacity} />;

const Vertice = ({ active, payload, vars }) => {
  const p = active && payload?.map((i) => i.payload).find((d) => d && d.z !== undefined);
  if (!p) return null;
  return (
    <div className="io-tip">
      <strong>({fmt(p.x)}, {fmt(p.y)})</strong>
      <div>{vars[0]} = {fmt(p.x)}, {vars[1]} = {fmt(p.y)}</div>
      <div>Z = {fmt(p.z)}</div>
      <div>{p.factible ? 'Vértice factible' : 'Intersección no factible'}</div>
    </div>
  );
};

export const GraficoPL = ({ grafico, variables, enteros = null, curvas = [] }) => {
  const { colors, tick, grid } = useChartTheme();
  const paleta = [colors.accent, colors.secondary, '#f472b6', '#34d399', '#fb923c', '#a3e635'];

  const datos = useMemo(() => {
    const { region, limites, rectas, vertices, optimo, isoZ } = grafico;
    const xs = [...new Set(region.map((p) => p.x))].sort((a, b) => a - b);
    const area = region.length >= 3 ? cortesVerticales(region, xs) : [];
    const xmin = Math.min(0, ...region.map((p) => p.x));
    const ymin = Math.min(0, ...region.map((p) => p.y));
    const dx = [xmin, limites.xmax];
    const dy = [ymin, limites.ymax];
    const segmentos = rectas.map((r) => segmentoEnCaja(r.a1, r.a2, r.b, dx, dy));
    const iso = isoZ ? segmentoEnCaja(isoZ.a1, isoZ.a2, isoZ.valor, dx, dy) : null;
    return {
      area,
      dx,
      dy,
      segmentos,
      iso,
      factibles: vertices.filter((v) => v.factible),
      noFactibles: vertices.filter((v) => !v.factible),
      optimo: optimo ? [{ ...optimo, factible: true }] : [],
    };
  }, [grafico]);

  const { rectas, optimo, isoZ } = grafico;

  return (
    <div>
      <div className="h-72 sm:h-96" role="img" aria-label="Gráfica del método gráfico: rectas de restricción, región factible y punto óptimo">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={datos.area} margin={{ top: 10, right: 18, bottom: 18, left: 0 }}>
            <CartesianGrid stroke={grid} strokeDasharray="3 3" />
            <XAxis
              type="number" dataKey="x" domain={datos.dx} allowDataOverflow tick={tick}
              label={{ value: variables[0], position: 'insideBottomRight', offset: -4, fill: colors.textMuted }}
            />
            <YAxis
              type="number" dataKey="y" domain={datos.dy} allowDataOverflow tick={tick} width={42}
              label={{ value: variables[1], position: 'insideTopLeft', offset: 8, fill: colors.textMuted }}
            />
            <Tooltip content={<Vertice vars={variables} />} cursor={false} />
            <Area
              type="linear" dataKey="rango" stroke="none" fill={colors.primary} fillOpacity={0.22}
              isAnimationActive={false} activeDot={false} legendType="none" tooltipType="none"
            />
            {datos.segmentos.map((s, i) => s && (
              <Line
                key={rectas[i].etiqueta} data={s} dataKey="y" type="linear" dot={false} activeDot={false}
                stroke={paleta[i % paleta.length]} strokeWidth={2} isAnimationActive={false} tooltipType="none"
              />
            ))}
            {datos.iso && (
              <Line
                data={datos.iso} dataKey="y" type="linear" dot={false} activeDot={false}
                stroke={colors.primary} strokeWidth={2} strokeDasharray="6 4" isAnimationActive={false} tooltipType="none"
              />
            )}
            {curvas.map((c, i) => (
              <Line
                key={`nivel-${c.nivel}`} data={c.puntos} dataKey="y" type="linear" dot={false} activeDot={false} connectNulls={false}
                stroke={colors.secondary} strokeOpacity={i === 1 ? 1 : 0.55} strokeWidth={i === 1 ? 2.2 : 1.4} strokeDasharray={i === 1 ? undefined : '4 3'}
                isAnimationActive={false} tooltipType="none"
              />
            ))}
            {enteros?.puntos && <Scatter data={enteros.puntos} dataKey="y" fill={colors.text} fillOpacity={0.45} shape={PuntoEntero} isAnimationActive={false} />}
            <Scatter data={datos.noFactibles} dataKey="y" fill={colors.textMuted} fillOpacity={0.55} isAnimationActive={false} />
            <Scatter data={datos.factibles} dataKey="y" fill={colors.accent} isAnimationActive={false} />
            <Scatter data={datos.optimo} dataKey="y" fill={colors.primary} shape="star" isAnimationActive={false} />
            {enteros?.optimo && <Scatter data={[{ ...enteros.optimo, factible: true }]} dataKey="y" fill="#34d399" shape="diamond" isAnimationActive={false} />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="io-leyenda">
        {rectas.map((r, i) => (
          <li key={r.etiqueta}>
            <i style={{ backgroundColor: paleta[i % paleta.length] }} />
            {r.etiqueta}: {texto(r, variables)}
          </li>
        ))}
        <li><i style={{ backgroundColor: colors.primary, opacity: 0.4 }} />Región factible</li>
        {isoZ && optimo && <li><i className="io-leyenda__raya" style={{ borderColor: colors.primary }} />Recta Z = {fmt(isoZ.valor)}</li>}
        {optimo && <li><i style={{ backgroundColor: colors.primary, borderRadius: 999 }} />{enteros ? 'Óptimo de la relajación lineal' : 'Óptimo'} ({fmt(optimo.x)}, {fmt(optimo.y)}) con Z = {fmt(optimo.z)}</li>}
        {curvas.length > 0 && <li><i className="io-leyenda__raya" style={{ borderColor: colors.secondary }} />Curvas de nivel Z = {curvas.map((c) => fmt(c.nivel, 3)).join(' · ')}</li>}
        {enteros?.puntos && <li><i style={{ backgroundColor: colors.text, opacity: 0.45, borderRadius: 999 }} />Puntos enteros factibles</li>}
        {enteros?.optimo && <li><i style={{ backgroundColor: '#34d399', transform: 'rotate(45deg)' }} />Óptimo entero ({fmt(enteros.optimo.x)}, {fmt(enteros.optimo.y)}) con Z = {fmt(enteros.optimo.z)}</li>}
      </ul>
    </div>
  );
};

export default GraficoPL;
