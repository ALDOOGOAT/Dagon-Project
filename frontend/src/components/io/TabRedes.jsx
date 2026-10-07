import { useState } from 'react';
import { FlaskConical, Play, Network, Plus, Trash2, GanttChartSquare } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { resolverCPM, resolverPERT } from '../../lib/io';
import {
  Boton, CeldaInput, ErrorIO, Etiqueta, Insignia, Metricas, Panel, TablaScroll, fmt, numeroDe, useChartTheme, useResolver,
} from './ui';
import { RedProyecto } from './RedProyecto';

const EJ_CPM = [
  { id: 'A', pred: '', d: '3', a: '', m: '', b: '' },
  { id: 'B', pred: 'A', d: '2', a: '', m: '', b: '' },
  { id: 'C', pred: 'A', d: '4', a: '', m: '', b: '' },
  { id: 'D', pred: 'B', d: '5', a: '', m: '', b: '' },
  { id: 'E', pred: 'C', d: '2', a: '', m: '', b: '' },
  { id: 'F', pred: 'D, E', d: '3', a: '', m: '', b: '' },
];
const EJ_PERT = [
  { id: 'A', pred: '', d: '', a: '2', m: '4', b: '6' },
  { id: 'B', pred: 'A', d: '', a: '3', m: '5', b: '7' },
  { id: 'C', pred: 'A', d: '', a: '2', m: '3', b: '10' },
  { id: 'D', pred: 'B, C', d: '', a: '4', m: '6', b: '8' },
  { id: 'E', pred: 'D', d: '', a: '1', m: '2', b: '3' },
];

const predecesoras = (txt) => txt.split(/[,\s;]+/).map((s) => s.trim()).filter((s) => s && s !== '-');

export const TabRedes = () => {
  const [modo, setModo] = useState('cpm');
  const [filas, setFilas] = useState(EJ_CPM);
  const [plazo, setPlazo] = useState('20');
  const { resultado, error, correr } = useResolver();
  const { colors, tick, grid, tooltip } = useChartTheme();

  const cambiarModo = (m) => {
    setModo(m);
    setFilas(m === 'pert' ? EJ_PERT : EJ_CPM);
  };
  const set = (i, campo, val) => setFilas((fs) => fs.map((f, a) => (a === i ? { ...f, [campo]: val } : f)));
  const agregar = () => setFilas((fs) => [...fs, { id: String.fromCharCode(65 + (fs.length % 26)), pred: '', d: '', a: '', m: '', b: '' }]);
  const quitar = (i) => setFilas((fs) => fs.filter((_, a) => a !== i));

  const resolver = () => correr(() => {
    const ids = filas.map((f) => f.id.trim());
    if (ids.some((id) => !id)) throw new Error('Cada actividad necesita un identificador.');
    if (new Set(ids).size !== ids.length) throw new Error('Hay identificadores de actividad repetidos.');
    if (modo === 'pert') {
      const acts = filas.map((f, i) => ({
        id: ids[i], predecesoras: predecesoras(f.pred),
        a: numeroDe(f.a, `Actividad ${ids[i]}: a`), m: numeroDe(f.m, `Actividad ${ids[i]}: m`), b: numeroDe(f.b, `Actividad ${ids[i]}: b`),
      }));
      const p = plazo.trim() === '' ? undefined : numeroDe(plazo, 'Plazo');
      return { modo, res: resolverPERT(acts, p) };
    }
    const acts = filas.map((f, i) => ({ id: ids[i], predecesoras: predecesoras(f.pred), duracion: numeroDe(f.d, `Actividad ${ids[i]}: duración`) }));
    return { modo, res: resolverCPM(acts) };
  });

  const res = resultado?.res;
  const esPert = resultado?.modo === 'pert';
  const pert = res && (res.probabilidad !== undefined || res.varianzaRuta !== undefined ? res : res.pert || res.proyecto || {});

  const gantt = res?.actividades
    .map((a) => ({ id: a.id, inicio: a.ES, dur: a.EF - a.ES, holgura: a.holgura, critica: a.critica }))
    .sort((x, y) => x.inicio - y.inicio);

  return (
    <div className="space-y-4">
      <Panel
        titulo="Redes de proyecto" icono={Network}
        accion={<Boton variante="suave" icono={FlaskConical} onClick={() => cambiarModo(modo)}>Ejemplo</Boton>}
      >
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="io-segmentos" role="tablist" aria-label="Método">
            {[['cpm', 'CPM'], ['pert', 'PERT']].map(([k, t]) => (
              <button key={k} type="button" role="tab" aria-selected={modo === k} className={modo === k ? 'is-activo' : ''} onClick={() => cambiarModo(k)}>{t}</button>
            ))}
          </div>
          {modo === 'pert' && (
            <div>
              <Etiqueta htmlFor="rd-plazo">Plazo objetivo (opcional)</Etiqueta>
              <input id="rd-plazo" className="io-input w-32" value={plazo} onChange={(e) => setPlazo(e.target.value)} inputMode="decimal" />
            </div>
          )}
        </div>

        <TablaScroll>
          <thead>
            <tr>
              <th>Actividad</th><th>Predecesoras</th>
              {modo === 'cpm' ? <th>Duración</th> : <><th>a (optimista)</th><th>m (probable)</th><th>b (pesimista)</th></>}
              <th />
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={i}>
                <td><CeldaInput valor={f.id} onChange={(v) => set(i, 'id', v)} etiqueta={`Identificador de la actividad ${i + 1}`} className="io-celda--texto" /></td>
                <td><CeldaInput valor={f.pred} onChange={(v) => set(i, 'pred', v)} etiqueta={`Predecesoras de la actividad ${f.id}`} className="io-celda--texto" /></td>
                {modo === 'cpm'
                  ? <td><CeldaInput valor={f.d} onChange={(v) => set(i, 'd', v)} etiqueta={`Duración de ${f.id}`} /></td>
                  : ['a', 'm', 'b'].map((k) => <td key={k}><CeldaInput valor={f[k]} onChange={(v) => set(i, k, v)} etiqueta={`Tiempo ${k} de ${f.id}`} /></td>)}
                <td>
                  <button type="button" className="io-icono-btn" onClick={() => quitar(i)} aria-label={`Quitar la actividad ${f.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TablaScroll>
        <p className="io-ayuda">Predecesoras separadas por coma (por ejemplo B, C). Déjalo vacío si la actividad no tiene predecesoras.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Boton variante="suave" icono={Plus} onClick={agregar}>Agregar actividad</Boton>
          <Boton icono={Play} onClick={resolver}>Resolver</Boton>
        </div>
      </Panel>

      <ErrorIO mensaje={error} />

      {res && (
        <>
          <Panel titulo="Resultados" icono={Network} accion={<Insignia tono="aviso">Ruta crítica: {res.rutaCritica.join(' → ')}</Insignia>}>
            <Metricas
              items={[
                { etiqueta: 'Duración del proyecto', valor: fmt(res.duracion) },
                ...(esPert && pert ? [
                  { etiqueta: 'Varianza de la ruta', valor: fmt(pert.varianzaRuta) },
                  { etiqueta: 'Desviación estándar', valor: fmt(pert.desviacion) },
                  ...(pert.z !== undefined && pert.z !== null ? [{ etiqueta: 'Z', valor: fmt(pert.z) }] : []),
                  ...(pert.probabilidad !== undefined && pert.probabilidad !== null
                    ? [{ etiqueta: `P(T ≤ ${plazo})`, valor: `${fmt(pert.probabilidad * 100, 2)} %` }] : []),
                ] : []),
              ]}
            />
            <TablaScroll>
              <thead>
                <tr>
                  <th>Act.</th><th>Pred.</th><th>{esPert ? 'tₑ' : 'Dur.'}</th>{esPert && <th>σ²</th>}
                  <th>ES</th><th>EF</th><th>LS</th><th>LF</th><th>Holgura</th><th>Crítica</th>
                </tr>
              </thead>
              <tbody>
                {res.actividades.map((a) => (
                  <tr key={a.id} className={a.critica ? 'io-fila-pivote' : ''}>
                    <th scope="row">{a.id}</th>
                    <td>{a.predecesoras.length ? a.predecesoras.join(', ') : '—'}</td>
                    <td>{fmt(esPert ? a.te : a.duracion)}</td>
                    {esPert && <td>{fmt(a.varianza)}</td>}
                    <td>{fmt(a.ES)}</td><td>{fmt(a.EF)}</td><td>{fmt(a.LS)}</td><td>{fmt(a.LF)}</td>
                    <td>{fmt(a.holgura)}</td><td>{a.critica ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </TablaScroll>
          </Panel>

          <Panel titulo="Red de actividades" icono={Network}>
            <RedProyecto actividades={res.actividades} />
            <p className="io-ayuda">Cada nodo muestra ES y EF arriba, y LS y LF abajo. La ruta crítica va en ámbar.</p>
          </Panel>

          <Panel titulo="Diagrama de Gantt" icono={GanttChartSquare}>
            <div className="h-72 sm:h-80" role="img" aria-label="Diagrama de Gantt de las actividades">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gantt} layout="vertical" margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
                  <CartesianGrid stroke={grid} strokeDasharray="3 3" />
                  <XAxis type="number" tick={tick} domain={[0, 'dataMax']} />
                  <YAxis type="category" dataKey="id" tick={tick} width={34} />
                  <Tooltip {...tooltip} formatter={(v, n) => [fmt(v), n]} />
                  <Legend wrapperStyle={{ color: colors.textMuted, fontSize: 12 }} />
                  <Bar dataKey="inicio" stackId="g" fill="transparent" legendType="none" isAnimationActive={false} name="Inicio" />
                  <Bar dataKey="dur" stackId="g" name="Duración" isAnimationActive={false}>
                    {gantt.map((g) => <Cell key={g.id} fill={g.critica ? colors.primary : colors.accent} />)}
                  </Bar>
                  <Bar dataKey="holgura" stackId="g" name="Holgura" fill={colors.textMuted} fillOpacity={0.35} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
};

export default TabRedes;
