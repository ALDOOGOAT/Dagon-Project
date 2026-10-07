import { useState } from 'react';
import { FlaskConical, Play, Truck, Route } from 'lucide-react';
import { resolverTransporte } from '../../lib/io';
import {
  Boton, CeldaInput, ErrorIO, Etiqueta, Insignia, Metricas, Panel, PasosLista, TablaScroll, fmt,
  numeroDe, redimensionar, useResolver,
} from './ui';

const EJEMPLO = {
  costos: [['10', '2', '20', '11'], ['12', '7', '9', '20'], ['4', '14', '16', '18']],
  oferta: ['15', '25', '10'],
  demanda: ['5', '15', '15', '15'],
};

const METODOS = [
  ['noroeste', 'Esquina noroeste'],
  ['costo_minimo', 'Costo mínimo'],
  ['vogel', 'Aproximación de Vogel'],
];

// Rejilla de transporte: costo (esquina), asignación (grande) y, si se dan, costo reducido y potenciales u-v.
const Rejilla = ({ costos, X, oferta, demanda, u, v, reducidos, entra, ciclo }) => {
  const enCiclo = (i, j) => Array.isArray(ciclo) && ciclo.some((c) => c.i === i && c.j === j);
  return (
    <TablaScroll className="io-transporte">
      <thead>
        <tr>
          <th />
          {demanda.map((_, j) => <th key={j}>D{j + 1}{v ? <small> v={fmt(v[j])}</small> : null}</th>)}
          <th>Oferta</th>
        </tr>
      </thead>
      <tbody>
        {costos.map((fila, i) => (
          <tr key={i}>
            <th scope="row">O{i + 1}{u ? <small> u={fmt(u[i])}</small> : null}</th>
            {fila.map((c, j) => {
              const esEntra = entra && entra.i === i && entra.j === j;
              const x = X[i][j];
              const basica = reducidos ? reducidos[i][j] === null : x > 0;
              return (
                <td key={j} className={esEntra ? 'io-pivote' : enCiclo(i, j) ? 'io-col-pivote' : basica ? 'io-basica' : ''}>
                  <span className="io-costo">{fmt(c)}</span>
                  <b>{basica ? fmt(x) : ''}</b>
                  {reducidos && reducidos[i][j] !== null && <small className="io-delta">Δ {fmt(reducidos[i][j])}</small>}
                </td>
              );
            })}
            <td>{fmt(oferta[i])}</td>
          </tr>
        ))}
        <tr>
          <th scope="row">Demanda</th>
          {demanda.map((d, j) => <td key={j}>{fmt(d)}</td>)}
          <td />
        </tr>
      </tbody>
    </TablaScroll>
  );
};

const texto = (ciclo) => ciclo.map((c, k) => `(${c.i + 1},${c.j + 1}) ${k % 2 === 0 ? '+' : '−'}`).join(' → ');

export const TabTransporte = () => {
  const [m, setM] = useState(3);
  const [n, setN] = useState(4);
  const [costos, setCostos] = useState(EJEMPLO.costos);
  const [oferta, setOferta] = useState(EJEMPLO.oferta);
  const [demanda, setDemanda] = useState(EJEMPLO.demanda);
  const [metodo, setMetodo] = useState('vogel');
  const { resultado, error, correr } = useResolver();

  const cambiarTam = (nm, nn) => {
    const fm = Math.min(8, Math.max(1, nm || 1));
    const fn = Math.min(8, Math.max(1, nn || 1));
    setM(fm); setN(fn);
    setCostos((c) => redimensionar(c, fm, fn));
    setOferta((o) => redimensionar([o], 1, fm)[0]);
    setDemanda((d) => redimensionar([d], 1, fn)[0]);
  };

  const cargarEjemplo = () => {
    setM(3); setN(4);
    setCostos(EJEMPLO.costos); setOferta(EJEMPLO.oferta); setDemanda(EJEMPLO.demanda);
  };

  const resolver = () => correr(() => resolverTransporte({
    costos: costos.map((f, i) => f.map((v, j) => numeroDe(v, `Costo (${i + 1},${j + 1})`))),
    oferta: oferta.map((v, i) => numeroDe(v, `Oferta ${i + 1}`)),
    demanda: demanda.map((v, j) => numeroDe(v, `Demanda ${j + 1}`)),
    metodo,
  }));

  const setCelda = (i, j, val) => setCostos((c) => c.map((f, a) => (a === i ? f.map((x, b) => (b === j ? val : x)) : f)));
  const setOf = (i, val) => setOferta((o) => o.map((x, a) => (a === i ? val : x)));
  const setDe = (j, val) => setDemanda((d) => d.map((x, a) => (a === j ? val : x)));

  const bal = resultado?.balanceado;
  const C = bal?.costos || [];
  const O = bal?.oferta || [];
  const D = bal?.demanda || [];

  return (
    <div className="space-y-4">
      <Panel
        titulo="Modelo de transporte" icono={Truck}
        accion={<Boton variante="suave" icono={FlaskConical} onClick={cargarEjemplo}>Ejemplo</Boton>}
      >
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <Etiqueta htmlFor="tr-m">Orígenes</Etiqueta>
            <input id="tr-m" type="number" min={1} max={8} className="io-input w-24" value={m} onChange={(e) => cambiarTam(parseInt(e.target.value, 10), n)} />
          </div>
          <div>
            <Etiqueta htmlFor="tr-n">Destinos</Etiqueta>
            <input id="tr-n" type="number" min={1} max={8} className="io-input w-24" value={n} onChange={(e) => cambiarTam(m, parseInt(e.target.value, 10))} />
          </div>
          <div>
            <Etiqueta htmlFor="tr-metodo">Solución inicial</Etiqueta>
            <select id="tr-metodo" className="io-input" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </div>
        </div>

        <TablaScroll>
          <thead>
            <tr><th />{demanda.map((_, j) => <th key={j}>D{j + 1}</th>)}<th>Oferta</th></tr>
          </thead>
          <tbody>
            {costos.map((fila, i) => (
              <tr key={i}>
                <th scope="row">O{i + 1}</th>
                {fila.map((v, j) => (
                  <td key={j}><CeldaInput valor={v} onChange={(val) => setCelda(i, j, val)} etiqueta={`Costo del origen ${i + 1} al destino ${j + 1}`} /></td>
                ))}
                <td><CeldaInput valor={oferta[i]} onChange={(val) => setOf(i, val)} etiqueta={`Oferta del origen ${i + 1}`} className="io-celda--eje" /></td>
              </tr>
            ))}
            <tr>
              <th scope="row">Demanda</th>
              {demanda.map((v, j) => (
                <td key={j}><CeldaInput valor={v} onChange={(val) => setDe(j, val)} etiqueta={`Demanda del destino ${j + 1}`} className="io-celda--eje" /></td>
              ))}
              <td />
            </tr>
          </tbody>
        </TablaScroll>
        <div className="mt-3"><Boton icono={Play} onClick={resolver}>Resolver</Boton></div>
      </Panel>

      <ErrorIO mensaje={error} />

      {resultado && (
        <>
          <Panel titulo="Solución inicial" icono={Route} accion={<Insignia tono="info">{METODOS.find(([k]) => k === metodo)?.[1]}</Insignia>}>
            {bal?.ficticio && <p className="io-nota">Oferta y demanda no coinciden: se agregó un {bal.ficticio} ficticio de costo cero.</p>}
            <Rejilla costos={C} X={resultado.inicial.asignacion} oferta={O} demanda={D} />
            <Metricas items={[{ etiqueta: 'Costo inicial', valor: fmt(resultado.inicial.costo) }]} />
            <PasosLista pasos={resultado.inicial.pasos} titulo="Pasos del método" />
          </Panel>

          <Panel titulo="Optimización MODI (u-v)" icono={Route}>
            <div className="space-y-4">
              {resultado.iteraciones.map((it, k) => (
                <div key={k} className="io-paso">
                  <h4>Iteración {k + 1}</h4>
                  <Rejilla
                    costos={C} X={it.asignacion} oferta={O} demanda={D}
                    u={it.u} v={it.v} reducidos={it.costosReducidos} entra={it.entra} ciclo={it.ciclo}
                  />
                  <p className="io-paso__nota">
                    Costo actual: <b>{fmt(it.costo)}</b>.{' '}
                    {it.entra
                      ? <>Entra la celda ({it.entra.i + 1},{it.entra.j + 1}) por tener el costo reducido más negativo disponible. Ciclo: {texto(it.ciclo)}.</>
                      : 'Todos los costos reducidos son no negativos: la solución es óptima.'}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel titulo="Solución óptima" icono={Truck}>
            <Rejilla costos={C} X={resultado.optimo.asignacion} oferta={O} demanda={D} />
            <Metricas items={[{ etiqueta: 'Costo óptimo', valor: fmt(resultado.optimo.costo) }]} />
          </Panel>
        </>
      )}
    </div>
  );
};

export default TabTransporte;
