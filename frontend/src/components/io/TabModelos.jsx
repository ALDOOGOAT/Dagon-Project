import { useState } from 'react';
import { Play, FlaskConical } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { mm1, mms, costoColas, pasos, estable, seccionDorada, newton, lagrange2, muestrearFuncion } from '../../lib/io';
import { Boton, Panel, Etiqueta, ErrorIO, Metricas, PasosLista, TablaScroll, numeroDe, fmt, useResolver, useChartTheme } from './ui';
const EJEMPLOS = {
  colas: {
    lambda: '4',
    mu: '6',
    s: '1',
    cs: '10',
    cw: '5'
  },
  markov: {
    P: '0.8, 0.2\n0.3, 0.7',
    inicial: '1, 0',
    n: '10'
  },
  noLineal: {
    f: '(x-2)^2+1',
    a: '-2',
    b: '6',
    x0: '0',
    g: 'x+y',
    c: '4'
  }
};
const ETIQUETAS = {
  lambda: 'Llegadas λ por unidad de tiempo',
  mu: 'Servicio μ por servidor y unidad de tiempo',
  s: 'Servidores s',
  cs: 'Costo por servidor / tiempo',
  cw: 'Costo por cliente / tiempo',
  P: 'Matriz P: una fila por línea, números separados por comas',
  inicial: 'Distribución inicial: probabilidades separadas por comas',
  n: 'Número de pasos (máximo 500)',
  f: 'Función objetivo f (x, o x e y en Lagrange)',
  a: 'Límite inferior a',
  b: 'Límite superior b',
  x0: 'Punto inicial x₀',
  g: 'Restricción g(x,y)',
  c: 'Valor c en g(x,y) = c'
};
const NUMEROS = {
  rho: 'Utilización ρ',
  P0: 'Probabilidad de sistema vacío',
  L: 'Clientes en sistema L',
  Lq: 'Clientes en cola Lq',
  W: 'Tiempo en sistema W',
  Wq: 'Tiempo en cola Wq',
  Pw: 'Probabilidad de esperar',
  costo: 'Costo total por tiempo',
  x: 'x',
  y: 'y',
  fx: 'f(x)',
  fxy: 'f(x,y)',
  lambda: 'Multiplicador λ'
};
export const TabModelos = ({
  tipo
}) => {
  const [valores, setValores] = useState(EJEMPLOS[tipo]);
  const [metodo, setMetodo] = useState('dorada');
  const [objetivo, setObjetivo] = useState('min');
  const {
    resultado,
    error,
    correr,
    limpiar
  } = useResolver();
  const {
    colors,
    tick,
    grid,
    tooltip
  } = useChartTheme();
  const campos = tipo === 'colas' ? ['lambda', 'mu', 's', 'cs', 'cw'] : tipo === 'markov' ? ['P', 'inicial', 'n'] : metodo === 'lagrange' ? ['f', 'g', 'c'] : metodo === 'newton' ? ['f', 'x0', 'a', 'b'] : ['f', 'a', 'b'];
  const resolver = () => correr(() => {
    const num = k => numeroDe(valores[k], ETIQUETAS[k]);
    if (tipo === 'colas') {
      const s = num('s');
      const res = s === 1 ? mm1({
        lambda: num('lambda'),
        mu: num('mu')
      }) : mms({
        lambda: num('lambda'),
        mu: num('mu'),
        s
      });
      return {
        ...res,
        costo: costoColas({
          L: res.L,
          s,
          cs: num('cs'),
          cw: num('cw')
        }),
        serie: res.Pn.map(p => ({
          x: p.n,
          y: p.p
        }))
      };
    }
    if (tipo === 'markov') {
      const P = valores.P.trim().split(/\n+/).map(f => f.split(/[;,\s]+/).filter(Boolean).map(t => numeroDe(t, 'Probabilidad')));
      if (P.length > 12) throw new Error('Usa hasta 12 estados.');
      const n = num('n');
      if (n > 500) throw new Error('Usa hasta 500 pasos para la gráfica.');
      const inicial = valores.inicial.split(/[;,\s]+/).filter(Boolean).map(t => numeroDe(t, 'Probabilidad inicial'));
      const res = pasos({
        P,
        inicial,
        n
      });
      return {
        ...estable(P),
        historial: res.historial,
        serie: res.historial.map((f, x) => ({
          x,
          ...Object.fromEntries(f.map((y, i) => ['e' + i, y]))
        }))
      };
    }
    if (metodo === 'lagrange') return {
      ...lagrange2({
        f: valores.f,
        g: valores.g,
        c: num('c')
      }),
      aviso: 'Punto estacionario bajo la restricción; verifica si es mínimo, máximo o silla. No garantiza óptimo global.'
    };
    const res = metodo === 'newton' ? newton({
      f: valores.f,
      x0: num('x0')
    }) : seccionDorada({
      f: valores.f,
      a: num('a'),
      b: num('b'),
      objetivo
    });
    return {
      ...res,
      serie: muestrearFuncion({
        f: valores.f,
        a: num('a'),
        b: num('b'),
        n: 120
      }),
      aviso: metodo === 'newton' ? 'Newton encuentra un punto estacionario local.' : 'Sección dorada requiere una función unimodal en el intervalo.'
    };
  });
  return <div className="space-y-4">
  <Panel titulo={tipo === 'colas' ? 'Líneas de espera M/M/1 y M/M/s' : tipo === 'markov' ? 'Cadenas de Markov' : 'Programación no lineal'} accion={<Boton variante="suave" icono={FlaskConical} onClick={() => {
      setValores(EJEMPLOS[tipo]);
      limpiar();
    }}>Ejemplo</Boton>}>
    {tipo === 'noLineal' && <div className="mb-4 flex flex-wrap gap-3">
      <select aria-label="Método" className="io-input" value={metodo} onChange={e => {
          setMetodo(e.target.value);
          limpiar();
          setValores(v => ({
            ...v,
            f: e.target.value === 'lagrange' ? 'x^2+y^2' : EJEMPLOS.noLineal.f
          }));
        }}>
        <option value="dorada">Sección dorada</option>
        <option value="newton">Newton</option>
        <option value="lagrange">Lagrange (2 variables)</option>
      </select>
      {metodo === 'dorada' && <select aria-label="Objetivo" className="io-input" value={objetivo} onChange={e => setObjetivo(e.target.value)}>
        <option value="min">Minimizar</option>
        <option value="max">Maximizar</option>
      </select>}
    </div>}
    <div className="grid gap-3 sm:grid-cols-2">
      {campos.map(k => <div key={k}>
        <Etiqueta htmlFor={'modelo-' + k}>
          {ETIQUETAS[k]}
        </Etiqueta>
        {k === 'P' ? <textarea id={'modelo-' + k} rows={4} className="io-input io-mono" value={valores[k]} onChange={e => setValores(v => ({
            ...v,
            [k]: e.target.value
          }))} /> : <input id={'modelo-' + k} className="io-input" value={valores[k]} onChange={e => setValores(v => ({
            ...v,
            [k]: e.target.value
          }))} />}
      </div>)}
    </div>
    <p className="my-3 text-sm opacity-75">
      {tipo === 'colas' ? 'Usa la misma unidad de tiempo para ambas tasas y costos; se requiere λ < sμ.' : tipo === 'markov' ? 'Cada fila y la distribución inicial deben sumar 1.' : 'Usa ^ para potencias, sin asignaciones ni código.'}
    </p>
    <Boton icono={Play} onClick={resolver}>Resolver</Boton>
  </Panel>
  <ErrorIO mensaje={error} />
  {resultado && <Panel titulo="Solución y procedimiento">
    <Metricas items={Object.entries(resultado).filter(([k, v]) => typeof v === 'number').map(([k, v]) => ({
        etiqueta: NUMEROS[k] || k,
        valor: fmt(v)
      }))} />
    {resultado.pi && <Metricas items={resultado.pi.map((v, i) => ({
        etiqueta: 'Estado estable ' + (i + 1),
        valor: fmt(v)
      }))} />}
    {resultado.aviso && <p className="my-3 text-sm">
      {resultado.aviso}
    </p>}
    <PasosLista pasos={resultado.pasos} />
    {resultado.iteraciones && <TablaScroll>
      <thead>
        <tr>
          {Object.keys(resultado.iteraciones[0] || {}).map(k => <th key={k}>
            {k}
          </th>)}
        </tr>
      </thead>
      <tbody>
        {resultado.iteraciones.map((f, i) => <tr key={i}>
          {Object.entries(f).map(([k, v]) => <td key={k}>
            {fmt(v)}
          </td>)}
        </tr>)}
      </tbody>
    </TablaScroll>}
    {resultado.serie && <div className="mt-4 h-72" role="img" aria-label={tipo === 'markov' ? 'Evolución de probabilidades por estado' : tipo === 'colas' ? 'Probabilidad de clientes en el sistema' : 'Función objetivo frente a x'}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={resultado.serie}>
          <CartesianGrid stroke={grid} />
          <XAxis dataKey="x" tick={tick} />
          <YAxis tick={tick} />
          <Tooltip {...tooltip} />
          {tipo === 'markov' ? resultado.pi.map((_, i) => <Line key={i} name={'Estado ' + (i + 1)} dataKey={'e' + i} stroke={[colors.primary, colors.secondary, colors.accent, '#10b981'][i % 4]} dot={false} />) : <Line dataKey="y" stroke={colors.primary} dot={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>}
  </Panel>}
</div>;
};
