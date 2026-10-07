import { useState } from 'react';
import { FlaskConical, Play, Boxes, LineChart as IconoCurva } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { eoq, eoqFaltantes, epq, descuentos, puntoReorden, periodoFijo } from '../../lib/io';
import {
  Boton, ErrorIO, Etiqueta, Metricas, Panel, PasosLista, TablaScroll, fmt, numeroDe, parseNumero, useChartTheme, useResolver,
} from './ui';

const C = {
  D: ['D', 'Demanda anual D'],
  S: ['S', 'Costo por pedido S'],
  H: ['H', 'Costo de mantener H (por unidad y año)'],
  p: ['p', 'Costo por faltante p (por unidad y año)'],
  P: ['P', 'Producción anual P'],
  i: ['i', 'Tasa de mantenimiento i (fracción del precio)'],
  d: ['d', 'Demanda por periodo d'],
  L: ['L', 'Tiempo de entrega L'],
  sigma: ['sigma', 'Desviación σ de la demanda por periodo'],
  z: ['z', 'Factor de servicio z'],
  T: ['T', 'Periodo de revisión T'],
  inventario: ['inventario', 'Posición de inventario actual'],
};

const MODELOS = {
  eoq: {
    nombre: 'EOQ clásico',
    campos: ['D', 'S', 'H'],
    ejemplo: { D: '8000', S: '100', H: '2' },
    resolver: (v) => eoq({ D: v.D, S: v.S, H: v.H }),
  },
  faltantes: {
    nombre: 'EOQ con faltantes',
    campos: ['D', 'S', 'H', 'p'],
    ejemplo: { D: '8000', S: '100', H: '2', p: '6' },
    resolver: (v) => eoqFaltantes({ D: v.D, S: v.S, H: v.H, p: v.p }),
  },
  epq: {
    nombre: 'Lote de producción (EPQ)',
    campos: ['D', 'S', 'H', 'P'],
    ejemplo: { D: '8000', S: '100', H: '2', P: '20000' },
    resolver: (v) => epq({ D: v.D, S: v.S, H: v.H, P: v.P }),
  },
  descuentos: {
    nombre: 'Descuentos por cantidad',
    campos: ['D', 'S', 'i'],
    tramos: true,
    ejemplo: { D: '10000', S: '50', i: '0.2', tramos: '0, 5\n500, 4.8\n1000, 4.5' },
    resolver: (v, tramos) => descuentos({ D: v.D, S: v.S, i: v.i, tramos }),
  },
  reorden: {
    nombre: 'Punto de reorden',
    campos: ['d', 'L', 'sigma', 'z'],
    ejemplo: { d: '20', L: '5', sigma: '4', z: '1.645' },
    resolver: (v) => puntoReorden({ d: v.d, L: v.L, sigma: v.sigma, z: v.z }),
  },
  periodo: {
    nombre: 'Revisión periódica',
    campos: ['d', 'T', 'L', 'sigma', 'z', 'inventario'],
    ejemplo: { d: '20', T: '7', L: '2', sigma: '4', z: '1.645', inventario: '60' },
    resolver: (v) => periodoFijo({ d: v.d, T: v.T, L: v.L, sigma: v.sigma, z: v.z, inventario: v.inventario }),
  },
};

const ETIQ = {
  Q: 'Q* (cantidad a pedir)', N: 'Pedidos por año', T: 'Tiempo entre pedidos', costoTotal: 'Costo total anual',
  inventarioMaximo: 'Inventario máximo', faltanteMaximo: 'Faltante máximo', costoMantener: 'Costo de mantener',
  costoFaltantes: 'Costo de faltantes', tiempoProduccion: 'Tiempo de producción', precio: 'Precio del tramo ganador',
  H: 'H efectivo', R: 'Punto de reorden R', stockSeguridad: 'Stock de seguridad', demandaDuranteEntrega: 'Demanda en la entrega',
  nivelObjetivo: 'Nivel objetivo M',
};

export const TabInventarios = () => {
  const [clave, setClave] = useState('eoq');
  const [valores, setValores] = useState(MODELOS.eoq.ejemplo);
  const { resultado, error, correr, limpiar } = useResolver();
  const { colors, tick, grid, tooltip } = useChartTheme();
  const modelo = MODELOS[clave];

  const elegir = (k) => {
    setClave(k);
    setValores(MODELOS[k].ejemplo);
    limpiar();
  };

  const resolver = () => correr(() => {
    const num = {};
    modelo.campos.forEach((k) => { num[k] = numeroDe(valores[k], C[k][1]); });
    let tramos;
    if (modelo.tramos) {
      tramos = (valores.tramos || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l, j) => {
        const [min, precio] = l.split(/[;\s]+|,/).filter(Boolean).map(parseNumero);
        if (!Number.isFinite(min) || !Number.isFinite(precio)) throw new Error(`Tramo ${j + 1}: usa el formato "cantidad mínima, precio".`);
        return { min, precio };
      });
    }
    return { clave, res: modelo.resolver(num, tramos) };
  });

  const res = resultado?.res;
  const escalares = res
    ? Object.entries(res).filter(([k, v]) => typeof v === 'number' && Number.isFinite(v) && k !== 'puntoReorden' && !(k === 'T' && clave === 'periodo'))
    : [];

  return (
    <div className="space-y-4">
      <Panel
        titulo="Modelos de inventario" icono={Boxes}
        accion={<Boton variante="suave" icono={FlaskConical} onClick={() => elegir(clave)}>Ejemplo</Boton>}
      >
        <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Modelo de inventario">
          <div className="io-segmentos io-segmentos--envolver">
            {Object.entries(MODELOS).map(([k, m]) => (
              <button key={k} type="button" role="tab" aria-selected={clave === k} className={clave === k ? 'is-activo' : ''} onClick={() => elegir(k)}>{m.nombre}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modelo.campos.map((k) => (
            <div key={k}>
              <Etiqueta htmlFor={`inv-${k}`}>{C[k][1]}</Etiqueta>
              <input
                id={`inv-${k}`} className="io-input" inputMode="decimal" value={valores[k] ?? ''}
                onChange={(e) => setValores((v) => ({ ...v, [k]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {modelo.tramos && (
          <div className="mt-3">
            <Etiqueta htmlFor="inv-tramos">Tramos de precio (cantidad mínima, precio unitario)</Etiqueta>
            <textarea id="inv-tramos" className="io-input io-mono io-area" rows={4} value={valores.tramos ?? ''} onChange={(e) => setValores((v) => ({ ...v, tramos: e.target.value }))} />
          </div>
        )}
        <div className="mt-3"><Boton icono={Play} onClick={resolver}>Calcular</Boton></div>
      </Panel>

      <ErrorIO mensaje={error} />

      {res && (
        <>
          <Panel titulo="Resultados" icono={Boxes}>
            <Metricas items={escalares.map(([k, v]) => ({ etiqueta: ETIQ[k] || k, valor: fmt(v, 3) }))} />
            {Array.isArray(res.candidatos) && (
              <>
                <h4 className="io-subtitulo">Candidatos por tramo</h4>
                <TablaScroll>
                  <thead><tr><th>Precio</th><th>H = i·p</th><th>Q</th><th>Costo total</th></tr></thead>
                  <tbody>
                    {res.candidatos.map((c, i) => (
                      <tr key={i} className={Math.abs(c.costoTotal - res.costoTotal) < 1e-7 ? 'io-fila-pivote' : ''}>
                        <td>{fmt(c.precio)}</td><td>{fmt(c.H)}</td><td>{fmt(c.Q, 2)}</td><td>{fmt(c.costoTotal, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </TablaScroll>
              </>
            )}
            <PasosLista pasos={res.pasos} />
          </Panel>

          {Array.isArray(res.curva) && (
            <Panel titulo="Costo total frente a Q" icono={IconoCurva}>
              <div className="h-72 sm:h-80" role="img" aria-label="Curva de costo total, costo de ordenar y costo de mantener frente a la cantidad pedida">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={res.curva} margin={{ top: 10, right: 16, bottom: 18, left: 0 }}>
                    <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="q" type="number" domain={['dataMin', 'dataMax']} tick={tick} tickFormatter={(v) => fmt(v, 0)}
                      label={{ value: 'Q', position: 'insideBottomRight', offset: -4, fill: colors.textMuted }}
                    />
                    <YAxis tick={tick} width={56} tickFormatter={(v) => fmt(v, 0)} />
                    <Tooltip {...tooltip} formatter={(v, n) => [fmt(v, 2), n]} labelFormatter={(q) => `Q = ${fmt(q, 1)}`} />
                    <Legend wrapperStyle={{ color: colors.textMuted, fontSize: 12 }} />
                    <Line dataKey="ordenar" name={clave === 'faltantes' ? 'Ordenar' : 'Ordenar'} stroke={colors.accent} dot={false} strokeWidth={2} isAnimationActive={false} />
                    <Line dataKey="mantener" name="Mantener" stroke={colors.secondary} dot={false} strokeWidth={2} isAnimationActive={false} />
                    <Line dataKey="total" name="Total" stroke={colors.primary} dot={false} strokeWidth={3} isAnimationActive={false} />
                    <ReferenceLine x={res.Q} stroke={colors.primary} strokeDasharray="5 4" label={{ value: `Q*=${fmt(res.Q, 1)}`, fill: colors.primary, fontSize: 11, position: 'top' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
};

export default TabInventarios;
