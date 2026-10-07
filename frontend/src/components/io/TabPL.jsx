import { lazy, Suspense, useState } from 'react';
import { FlaskConical, GitBranch, Play, ListChecks, Table2, LineChart, Scale } from 'lucide-react';
import { parseModeloPL, resolverSimplex, resolverGrafico, resolverEntero, puntosEnterosFactibles, aFraccion } from '../../lib/io';
import { Boton, ErrorIO, Etiqueta, Insignia, Metricas, Panel, TablaScroll, fmt, useResolver } from './ui';
import { GraficoPL } from './GraficoPL';

const ArbolBB = lazy(() => import('./ArbolBB').then((m) => ({ default: m.ArbolBB })));

const WYNDOR = {
  objetivo: 'max z = 3x1 + 5x2',
  restricciones: 'x1 <= 4\n2x2 <= 12\n3x1 + 2x2 <= 18\nx1, x2 >= 0',
};
const ENTERO = {
  objetivo: 'max z = 5x1 + 8x2',
  restricciones: 'x1 + x2 <= 6\n5x1 + 9x2 <= 45\nx1, x2 >= 0\nx1, x2 enteras',
};
const DIETA = {
  objetivo: 'min z = 0.6x1 + 0.5x2',
  restricciones: '10x1 + 4x2 >= 20\n5x1 + 5x2 >= 20\n2x1 + 6x2 >= 12\nx1, x2 >= 0',
};

// Los números enormes de la fila Z con Gran M se muestran en notación científica.
const celda = (x, fracciones) => {
  if (x === null || x === undefined) return '—';
  if (!Number.isFinite(x)) return fmt(x);
  if (Math.abs(x) >= 1e5) return Number(x).toExponential(2);
  if (fracciones && !Number.isInteger(x)) {
    try {
      const s = aFraccion(x);
      if (typeof s === 'string') return s;
    } catch (e) { /* si no hay fracción exacta se muestra el decimal */ }
  }
  return fmt(x);
};

const TablaSimplex = ({ t, fracciones }) => {
  const { pivote, razones } = t;
  const hayRazones = Array.isArray(razones) && razones.some((r) => r !== null && r !== undefined);
  return (
    <div className="io-paso">
      <h4>{t.titulo}</h4>
      {pivote && (
        <p className="io-paso__nota">
          Entra <b>{t.entra}</b>, sale <b>{t.sale}</b>. El pivote es el elemento resaltado (fila de {t.sale}, columna de {t.entra}).
        </p>
      )}
      <TablaScroll>
        <thead>
          <tr>
            <th>Base</th>
            {t.encabezados.map((h, j) => <th key={h} className={pivote?.col === j ? 'io-col-pivote' : ''}>{h}</th>)}
            <th>Sol.</th>
            {hayRazones && <th>Razón</th>}
          </tr>
        </thead>
        <tbody>
          {t.filas.map((fila, i) => (
            <tr key={`${fila.base}-${i}`} className={pivote?.fila === i ? 'io-fila-pivote' : ''}>
              <th scope="row">{fila.base}</th>
              {fila.valores.map((v, j) => (
                <td key={j} className={pivote && pivote.fila === i && pivote.col === j ? 'io-pivote' : pivote?.col === j ? 'io-col-pivote' : ''}>
                  {celda(v, fracciones)}
                </td>
              ))}
              <td>{celda(fila.rhs, fracciones)}</td>
              {hayRazones && <td>{razones[i] === null || razones[i] === undefined ? '—' : celda(razones[i], fracciones)}</td>}
            </tr>
          ))}
          <tr className="io-fila-z">
            <th scope="row">Z</th>
            {t.filaZ.map((v, j) => <td key={j} className={pivote?.col === j ? 'io-col-pivote' : ''}>{celda(v, fracciones)}</td>)}
            <td>{celda(t.zValor, fracciones)}</td>
            {hayRazones && <td />}
          </tr>
        </tbody>
      </TablaScroll>
    </div>
  );
};

const ESTADOS = {
  optimo: ['ok', 'Solución óptima'],
  no_acotado: ['aviso', 'Objetivo no acotado'],
  infactible: ['error', 'Modelo infactible'],
};

export const TabPL = ({ inicial }) => {
  const [objetivo, setObjetivo] = useState(inicial?.objetivo ?? WYNDOR.objetivo);
  const [restricciones, setRestricciones] = useState(inicial?.restricciones ?? WYNDOR.restricciones);
  const [fracciones, setFracciones] = useState(false);
  const { resultado, error, correr } = useResolver();

  const resolver = () => correr(() => {
    const lineas = restricciones.split('\n').map((l) => l.trim()).filter(Boolean);
    const modelo = parseModeloPL(objetivo, lineas);
    const simplex = resolverSimplex(modelo);
    let grafico = null;
    if (modelo.variables.length === 2) {
      try { grafico = resolverGrafico(modelo); } catch (e) { grafico = null; }
    }
    // Con variables enteras o binarias declaradas también se resuelve por branch & bound.
    let entero = null, enteros = null;
    if (modelo.enteras.length || modelo.binarias.length) {
      entero = resolverEntero(modelo);
      if (grafico && modelo.variables.every((v) => modelo.enteras.includes(v) || modelo.binarias.includes(v))) {
        enteros = { puntos: puntosEnterosFactibles(modelo, grafico.limites), optimo: entero.z === null ? null : { x: entero.x[modelo.variables[0]], y: entero.x[modelo.variables[1]], z: entero.z } };
      }
    }
    return { modelo, simplex, grafico, entero, enteros };
  });

  const cargar = (ej) => {
    setObjetivo(ej.objetivo);
    setRestricciones(ej.restricciones);
  };

  const { modelo, simplex, grafico, entero, enteros } = resultado || {};
  const [tonoEstado, textoEstado] = simplex ? (ESTADOS[simplex.estado] || ['info', simplex.estado]) : [];

  return (
    <div className="space-y-4">
      <Panel
        titulo="Modelo de programación lineal"
        icono={Scale}
        accion={(
          <div className="flex flex-wrap gap-2">
            <Boton variante="suave" icono={FlaskConical} onClick={() => cargar(WYNDOR)}>Ejemplo Wyndor</Boton>
            <Boton variante="suave" icono={FlaskConical} onClick={() => cargar(DIETA)}>Ejemplo min (Gran M)</Boton>
            <Boton variante="suave" icono={FlaskConical} onClick={() => cargar(ENTERO)}>Ejemplo entero</Boton>
          </div>
        )}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <Etiqueta htmlFor="pl-objetivo">Función objetivo</Etiqueta>
            <input
              id="pl-objetivo" className="io-input io-mono" value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)} placeholder="max z = 3x1 + 5x2" spellCheck={false}
            />
            <p className="io-ayuda">Empieza con max o min. Variables: x1, x2, ...</p>
          </div>
          <div>
            <Etiqueta htmlFor="pl-restricciones">Restricciones (una por línea)</Etiqueta>
            <textarea
              id="pl-restricciones" className="io-input io-mono io-area" rows={5} value={restricciones}
              onChange={(e) => setRestricciones(e.target.value)} spellCheck={false}
              placeholder={'x1 <= 4\n3x1 + 2x2 <= 18\nx1, x2 >= 0'}
            />
            <p className="io-ayuda">Acepta {'<='}, {'>='} y =. &quot;x1, x2 &gt;= 0&quot; declara no negatividad; &quot;x1, x2 enteras&quot; o &quot;y1 binaria&quot; activan branch &amp; bound.</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Boton icono={Play} onClick={resolver}>Resolver</Boton>
          <label className="io-check">
            <input type="checkbox" checked={fracciones} onChange={(e) => setFracciones(e.target.checked)} />
            Mostrar fracciones
          </label>
        </div>
      </Panel>

      <ErrorIO mensaje={error} />

      {simplex && (
        <>
          <Panel titulo="Solución" icono={ListChecks} accion={<Insignia tono={tonoEstado}>{textoEstado}</Insignia>}>
            {simplex.estado === 'optimo' ? (
              <>
                <Metricas
                  items={[
                    { etiqueta: modelo.sentido === 'max' ? 'Z máxima' : 'Z mínima', valor: celda(simplex.z, fracciones) },
                    ...modelo.variables.map((v) => ({ etiqueta: v, valor: celda(simplex.x[v], fracciones) })),
                    ...Object.entries(simplex.holguras).map(([k, v]) => ({ etiqueta: k, valor: celda(v, fracciones) })),
                  ]}
                />
                {simplex.multiple && (
                  <p className="io-nota">Hay soluciones óptimas múltiples: otra solución básica alcanza el mismo valor de Z.</p>
                )}
              </>
            ) : (
              <p className="font-gameui text-sm">
                {simplex.estado === 'no_acotado'
                  ? 'La función objetivo puede mejorar sin límite: revisa si falta alguna restricción.'
                  : 'No existe ningún punto que cumpla todas las restricciones a la vez: revisa los signos y los lados derechos.'}
              </p>
            )}
          </Panel>

          {entero && (
            <Panel titulo="Solución entera (ramificación y acotamiento)" icono={GitBranch} accion={<Insignia tono={entero.estado === 'optimo' ? 'ok' : 'aviso'}>{entero.estado === 'optimo' ? 'Óptimo entero' : entero.estado === 'infactible' ? 'Sin solución entera' : entero.estado === 'limite' ? 'Límite de nodos' : 'Relajación no acotada'}</Insignia>}>
              {entero.z !== null && (
                <Metricas
                  items={[
                    { etiqueta: modelo.sentido === 'max' ? 'Z entera máxima' : 'Z entera mínima', valor: celda(entero.z, fracciones) },
                    ...modelo.variables.map((v) => ({ etiqueta: v, valor: celda(entero.x[v], fracciones) })),
                    { etiqueta: 'Cota de la relajación', valor: celda(entero.relajacion?.z, fracciones) },
                    { etiqueta: 'Subproblemas', valor: String(entero.explorados) },
                  ]}
                />
              )}
              <p className="io-nota">El simplex de abajo resuelve la relajación continua (P0). El óptimo entero no se obtiene redondeándola: cada rama agrega una cota y se poda cuando no puede mejorar la mejor solución entera.</p>
              <Suspense fallback={<p role="status">Cargando árbol…</p>}>
                <ArbolBB arbol={{ nodos: entero.nodos }} />
              </Suspense>
            </Panel>
          )}

          {grafico && (
            <Panel titulo="Método gráfico" icono={LineChart}>
              <GraficoPL grafico={grafico} variables={modelo.variables} enteros={enteros} />
              <h4 className="io-subtitulo">Vértices y valor de Z</h4>
              <TablaScroll>
                <thead>
                  <tr><th>Vértice</th><th>{modelo.variables[0]}</th><th>{modelo.variables[1]}</th><th>Z</th><th>Factible</th></tr>
                </thead>
                <tbody>
                  {grafico.vertices.map((v, i) => (
                    <tr key={i} className={grafico.optimo && v.factible && Math.abs(v.z - grafico.optimo.z) < 1e-7 ? 'io-fila-pivote' : ''}>
                      <th scope="row">{i + 1}</th><td>{celda(v.x, fracciones)}</td><td>{celda(v.y, fracciones)}</td>
                      <td>{celda(v.z, fracciones)}</td><td>{v.factible ? 'Sí' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </TablaScroll>
            </Panel>
          )}

          <Panel titulo="Tablas del simplex, paso a paso" icono={Table2}>
            <div className="space-y-4">
              {simplex.tablas.map((t, i) => <TablaSimplex key={i} t={t} fracciones={fracciones} />)}
            </div>
          </Panel>

          {simplex.estado === 'optimo' && (
            <Panel titulo="Dualidad y sensibilidad" icono={Scale}>
              <h4 className="io-subtitulo">Lado derecho (b) y precios sombra</h4>
              <TablaScroll>
                <thead>
                  <tr><th>Restricción</th><th>Precio sombra</th><th>b actual</th><th>b mínimo</th><th>b máximo</th></tr>
                </thead>
                <tbody>
                  {simplex.sensibilidad.b.map((r, i) => (
                    <tr key={i}>
                      <th scope="row">R{i + 1}</th><td>{celda(simplex.duales[i], fracciones)}</td>
                      <td>{celda(r.actual, fracciones)}</td><td>{celda(r.min, fracciones)}</td><td>{celda(r.max, fracciones)}</td>
                    </tr>
                  ))}
                </tbody>
              </TablaScroll>
              <h4 className="io-subtitulo">Coeficientes de la función objetivo (c)</h4>
              <TablaScroll>
                <thead>
                  <tr><th>Variable</th><th>c actual</th><th>c mínimo</th><th>c máximo</th></tr>
                </thead>
                <tbody>
                  {simplex.sensibilidad.c.map((r, i) => (
                    <tr key={i}>
                      <th scope="row">{modelo.variables[i]}</th>
                      <td>{celda(r.actual, fracciones)}</td><td>{celda(r.min, fracciones)}</td><td>{celda(r.max, fracciones)}</td>
                    </tr>
                  ))}
                </tbody>
              </TablaScroll>
              <p className="io-ayuda">
                El precio sombra indica cuánto cambia Z por cada unidad extra de recurso, mientras b se mantenga dentro de su rango.
              </p>
            </Panel>
          )}
        </>
      )}
    </div>
  );
};

export default TabPL;
