import { lazy, Suspense } from 'react';
import { AlertTriangle, CheckCircle2, GitBranch, LineChart as ChartIcon, ListOrdered } from 'lucide-react';
import { Formula } from './Formula';
import { Panel, Metricas, TablaScroll, fmt } from './ui';
const GraficoPL = lazy(() => import('./GraficoPL').then(m => ({
  default: m.GraficoPL
})));
const RedProyecto = lazy(() => import('./RedProyecto').then(m => ({
  default: m.RedProyecto
})));
const GrafoRed = lazy(() => import('./GrafoRed').then(m => ({ default: m.GrafoRed })));
const ArbolBB = lazy(() => import('./ArbolBB').then(m => ({ default: m.ArbolBB })));
const GraficoSeries = lazy(() => import('./Graficos').then(m => ({ default: m.GraficoSeries })));
const GraficoBarras = lazy(() => import('./Graficos').then(m => ({ default: m.GraficoBarras })));
const GraficoContorno = lazy(() => import('./Graficos').then(m => ({ default: m.GraficoContorno })));
const TITULOS_GRAFICO = { red: 'Red y ruta crítica', grafo: 'Red y solución', contorno: 'Curvas de nivel', barras: 'Comparación', pl: 'Región factible', series: 'Visualización del modelo' };
// Cada tipo de gráfico del contrato tiene su componente; ninguno se carga hasta que hace falta.
const Visualizacion = ({ grafico }) => {
  switch (grafico.tipo) {
    case 'pl': return <GraficoPL grafico={grafico.datos} variables={grafico.variables} enteros={grafico.enteros || null} curvas={grafico.curvas || []} />;
    case 'red': return <RedProyecto actividades={grafico.actividades} />;
    case 'grafo': return <GrafoRed grafico={grafico} />;
    case 'contorno': return <GraficoContorno grafico={grafico} />;
    case 'barras': return <GraficoBarras grafico={grafico} />;
    default: return <GraficoSeries grafico={grafico} />;
  }
};
const ETIQUETAS_DATOS = {
  tabla: 'Tabla del procedimiento',
  tablas: 'Tablas simplex',
  resultado: 'Resultado',
  estado: 'Estado',
  x: 'Variables de decisión',
  z: 'Valor objetivo',
  holguras: 'Holguras',
  duales: 'Precios sombra',
  sensibilidad: 'Sensibilidad',
  multiple: 'Óptimos múltiples',
  actual: 'Valor actual',
  min: 'Mínimo',
  max: 'Máximo',
  iteraciones: 'Iteraciones',
  costo: 'Costo',
  asignacion: 'Asignación',
  costosReducidos: 'Costos reducidos',
  entra: 'Variable que entra',
  sale: 'Variable que sale',
  filas: 'Filas',
  columnas: 'Columnas',
  matriz: 'Matriz',
  historial: 'Evolución',
  pi: 'Distribución estacionaria',
  titulo: 'Título'
};
const etiquetaDato = clave => ETIQUETAS_DATOS[clave] || clave;
const esTableau = dato => dato && !Array.isArray(dato) && Array.isArray(dato.encabezados || dato.variables) && Array.isArray(dato.filas) && dato.filas.every(f => Array.isArray(f.valores));
const TableauSimplex = ({
  tabla
}) => {
  const encabezados = tabla.encabezados || tabla.variables;
  const pivote = tabla.pivote;
  const razones = tabla.razones || [];
  const tieneRazones = razones.some(r => r !== null && r !== undefined);
  return <div className="io-paso">
  {tabla.titulo && <h4 className="io-subtitulo">
    {tabla.titulo}
  </h4>}
  {pivote && <p className="my-2 text-sm">Entra <strong>
      {tabla.entra || encabezados[pivote.col]}
    </strong>, sale <strong>
      {tabla.sale || tabla.filas[pivote.fila]?.base}
    </strong>. El pivote resaltado vale <strong>
      {fmt(tabla.filas[pivote.fila]?.valores[pivote.col])}
    </strong>.</p>}
  <TablaScroll>
    <thead>
      <tr>
        <th scope="col">Base</th>
        {encabezados.map((variable, j) => <th scope="col" key={variable} className={pivote?.col === j ? 'io-col-pivote io-celda-pivote' : ''}>
          {variable}
        </th>)}
        <th scope="col">Solución</th>
        {tieneRazones && <th scope="col">Razón</th>}
      </tr>
    </thead>
    <tbody>
      {tabla.filas.map((fila, i) => <tr key={i} className={pivote?.fila === i ? 'io-fila-pivote' : ''}>
        <th scope="row">
          {fila.base}
        </th>
        {fila.valores.map((v, j) => <td key={j} className={pivote?.fila === i && pivote?.col === j ? 'io-pivote io-celda-pivote font-black text-amber-300 ring-1 ring-inset ring-amber-400' : pivote?.col === j ? 'io-col-pivote io-celda-pivote' : ''}>
          {fmt(v)}
        </td>)}
        <td>
          {fmt(fila.rhs)}
        </td>
        {tieneRazones && <td>
          {fmt(razones[i])}
        </td>}
      </tr>)}
      {Array.isArray(tabla.filaZ) && <tr className="io-fila-z">
        <th scope="row">Z</th>
        {tabla.filaZ.map((v, j) => <td key={j} className={pivote?.col === j ? 'io-col-pivote io-celda-pivote' : ''}>
          {fmt(v)}
        </td>)}
        <td>
          {fmt(tabla.zValor)}
        </td>
        {tieneRazones && <td>—</td>}
      </tr>}
    </tbody>
  </TablaScroll>
</div>;
};

// Tabla para matrices, filas de iteración y objetos del procedimiento.
const DatosPaso = ({
  dato,
  nivel = 0
}) => {
  if (dato == null) return null;
  if (typeof dato !== 'object') return <span className="io-mono">
  {typeof dato === 'number' ? fmt(dato) : String(dato)}
</span>;
  if (esTableau(dato)) return <TableauSimplex tabla={dato} />;
  if (!Array.isArray(dato) && Object.keys(dato).length === 1 && dato.tabla !== undefined) return <DatosPaso dato={dato.tabla} nivel={nivel} />;
  if (Array.isArray(dato) && dato.length && dato.every(esTableau)) return <div className="space-y-4">
  {dato.map((tabla, i) => <TableauSimplex key={i} tabla={tabla} />)}
</div>;
  if (nivel > 5) return <span>Detalle anidado</span>;
  if (Array.isArray(dato)) {
    if (!dato.length) return null;
    if (dato.every(f => Array.isArray(f))) return <TablaScroll>
  <tbody>
    {dato.map((f, i) => <tr key={i}>
      {f.map((v, j) => <td key={j}>
        <DatosPaso dato={v} nivel={nivel + 1} />
      </td>)}
    </tr>)}
  </tbody>
</TablaScroll>;
    if (dato.every(f => f && typeof f === 'object')) {
      const cols = [...new Set(dato.flatMap(f => Object.keys(f)))];
      return <TablaScroll>
  <thead>
    <tr>
      {cols.map(k => <th key={k}>
        {etiquetaDato(k)}
      </th>)}
    </tr>
  </thead>
  <tbody>
    {dato.map((f, i) => <tr key={i}>
      {cols.map(k => <td key={k}>
        <DatosPaso dato={f[k]} nivel={nivel + 1} />
      </td>)}
    </tr>)}
  </tbody>
</TablaScroll>;
    }
    return <span className="io-mono">
  {dato.map(v => fmt(v)).join(', ')}
</span>;
  }
  return <dl className="io-paso-datos">
  {Object.entries(dato).map(([k, v]) => <div key={k}>
    <dt>
      {etiquetaDato(k)}
    </dt>
    <dd>
      <DatosPaso dato={v} nivel={nivel + 1} />
    </dd>
  </div>)}
</dl>;
};
export const ResultadoModelo = ({
  solucion
}) => {
  const grafico = solucion.grafico;
  const estados = {
    optimo: 'Solución óptima',
    resuelto: 'Modelo calculado',
    aproximado: 'Aproximación numérica',
    estacionario: 'Punto estacionario',
    infactible: 'Sin solución factible',
    no_acotado: 'Objetivo sin límite',
    limite: 'Mejor solución encontrada'
  };
  const necesitaRevision = ['infactible', 'no_acotado'].includes(solucion.estado);
  return <div className="space-y-4" aria-live="polite" data-testid="solucion-enunciado">
  <Panel titulo={estados[solucion.estado] || 'Solución del modelo'} icono={necesitaRevision ? AlertTriangle : CheckCircle2}>
    <p className="mb-3 leading-relaxed">
      {solucion.resumen}
    </p>
    <Metricas items={solucion.metricas.map(m => ({
        etiqueta: m.etiqueta,
        valor: fmt(m.valor) + (m.unidad ? ' ' + m.unidad : '')
      }))} />
    {solucion.advertencias?.length > 0 && <ul className="io-revision-lista">
      {solucion.advertencias.map((a, i) => <li key={i}>
        {a}
      </li>)}
    </ul>}
  </Panel>
  {grafico && <Panel titulo={TITULOS_GRAFICO[grafico.tipo] || 'Visualización del modelo'} icono={ChartIcon}>
    <Suspense fallback={<p role="status">Cargando visualización…</p>}>
      <Visualizacion grafico={grafico} />
    </Suspense>
  </Panel>}
  {solucion.arbol && <Panel titulo="Árbol de ramificación y acotamiento" icono={GitBranch}>
    <Suspense fallback={<p role="status">Cargando árbol…</p>}>
      <ArbolBB arbol={solucion.arbol} />
    </Suspense>
  </Panel>}
  <Panel titulo="Procedimiento paso a paso" icono={ListOrdered}>
    <ol className="io-pasos">
      {solucion.pasos.map((paso, i) => <li key={i}>
        <details open={i === 0} className="io-detalle">
          <summary>
            {typeof paso === 'string' ? paso : paso.texto || paso.titulo || 'Paso ' + (i + 1)}
          </summary>
          {paso.formula && <Formula latex={paso.formula} bloque />}
          {typeof paso === 'object' && <DatosPaso dato={Object.fromEntries(Object.entries(paso).filter(([k]) => !['texto', 'titulo', 'formula'].includes(k)))} />}
        </details>
      </li>)}
    </ol>
    {!solucion.pasos.length && <p>Comprueba los datos y las métricas del modelo.</p>}
    <details className="io-detalle">
      <summary>Tablas y detalles de la solución</summary>
      <DatosPaso dato={solucion.resultado} />
    </details>
  </Panel>
</div>;
};
