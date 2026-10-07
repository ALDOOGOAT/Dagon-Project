import { useState } from 'react';
import { FlaskConical, Play, Users, ListOrdered } from 'lucide-react';
import { resolverAsignacion } from '../../lib/io';
import {
  Boton, ErrorIO, Etiqueta, MatrizEditable, Metricas, Panel, TablaScroll, fmt, numeroDe, redimensionar, useResolver,
} from './ui';

const EJEMPLO = [['9', '2', '7', '8'], ['6', '4', '3', '7'], ['5', '8', '1', '8'], ['7', '6', '9', '4']];

const PasoMatriz = ({ paso, asignacion }) => {
  const filas = paso.cubiertas?.filas || [];
  const cols = paso.cubiertas?.columnas || [];
  return (
    <div className="io-paso">
      <h4>{paso.titulo}</h4>
      <TablaScroll>
        <thead>
          <tr><th />{paso.matriz[0].map((_, j) => <th key={j} className={cols.includes(j) ? 'io-col-pivote' : ''}>T{j + 1}</th>)}</tr>
        </thead>
        <tbody>
          {paso.matriz.map((fila, i) => (
            <tr key={i} className={filas.includes(i) ? 'io-fila-pivote' : ''}>
              <th scope="row">A{i + 1}</th>
              {fila.map((v, j) => (
                <td
                  key={j}
                  className={asignacion?.some((a) => a.fila === i && a.columna === j) ? 'io-pivote' : v === 0 ? 'io-basica' : ''}
                >
                  {fmt(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </TablaScroll>
      {(filas.length > 0 || cols.length > 0) && (
        <p className="io-paso__nota">
          Líneas de cobertura: {filas.length ? `filas ${filas.map((i) => i + 1).join(', ')}` : 'ninguna fila'};{' '}
          {cols.length ? `columnas ${cols.map((j) => j + 1).join(', ')}` : 'ninguna columna'}.
        </p>
      )}
    </div>
  );
};

export const TabAsignacion = () => {
  const [f, setF] = useState(4);
  const [c, setC] = useState(4);
  const [matriz, setMatriz] = useState(EJEMPLO);
  const [objetivo, setObjetivo] = useState('min');
  const { resultado, error, correr } = useResolver();

  const cambiarTam = (nf, nc) => {
    const ff = Math.min(8, Math.max(1, nf || 1));
    const cc = Math.min(8, Math.max(1, nc || 1));
    setF(ff); setC(cc);
    setMatriz((m) => redimensionar(m, ff, cc));
  };

  const resolver = () => correr(() => resolverAsignacion({
    matriz: matriz.map((fila, i) => fila.map((v, j) => numeroDe(v, `Costo (${i + 1},${j + 1})`))),
    objetivo,
  }));

  return (
    <div className="space-y-4">
      <Panel
        titulo="Problema de asignación" icono={Users}
        accion={<Boton variante="suave" icono={FlaskConical} onClick={() => { setF(4); setC(4); setMatriz(EJEMPLO); setObjetivo('min'); }}>Ejemplo</Boton>}
      >
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <Etiqueta htmlFor="as-f">Agentes (filas)</Etiqueta>
            <input id="as-f" type="number" min={1} max={8} className="io-input w-24" value={f} onChange={(e) => cambiarTam(parseInt(e.target.value, 10), c)} />
          </div>
          <div>
            <Etiqueta htmlFor="as-c">Tareas (columnas)</Etiqueta>
            <input id="as-c" type="number" min={1} max={8} className="io-input w-24" value={c} onChange={(e) => cambiarTam(f, parseInt(e.target.value, 10))} />
          </div>
          <div>
            <Etiqueta htmlFor="as-obj">Objetivo</Etiqueta>
            <select id="as-obj" className="io-input" value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
              <option value="min">Minimizar costo</option>
              <option value="max">Maximizar beneficio</option>
            </select>
          </div>
        </div>
        <MatrizEditable
          datos={matriz} nombre="Costo"
          onCambio={(i, j, v) => setMatriz((m) => m.map((fila, a) => (a === i ? fila.map((x, b) => (b === j ? v : x)) : fila)))}
          etiquetaFila={(i) => `A${i + 1}`} etiquetaCol={(j) => `Tarea ${j + 1}`}
        />
        <p className="io-ayuda">Si las filas y las columnas no coinciden, se completa con tareas o agentes ficticios de costo cero.</p>
        <div className="mt-3"><Boton icono={Play} onClick={resolver}>Resolver</Boton></div>
      </Panel>

      <ErrorIO mensaje={error} />

      {resultado && (
        <>
          <Panel titulo="Asignación óptima" icono={ListOrdered}>
            <Metricas
              items={[
                { etiqueta: objetivo === 'max' ? 'Beneficio total' : 'Costo total', valor: fmt(resultado.total) },
                ...resultado.asignacion.map((a) => ({ etiqueta: `A${a.fila + 1} → T${a.columna + 1}`, valor: fmt(a.costo) })),
              ]}
            />
          </Panel>
          <Panel titulo="Método húngaro, paso a paso" icono={ListOrdered}>
            <div className="space-y-4">
              {resultado.pasos.map((p, i) => (
                <PasoMatriz key={i} paso={p} asignacion={i === resultado.pasos.length - 1 ? resultado.asignacion : null} />
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
};

export default TabAsignacion;
