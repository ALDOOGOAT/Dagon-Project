import { lazy, Suspense, useId, useState } from 'react';
const TabPL = lazy(() => import('./TabPL').then(m => ({
  default: m.TabPL
})));
const TabTransporte = lazy(() => import('./TabTransporte').then(m => ({
  default: m.TabTransporte
})));
const TabAsignacion = lazy(() => import('./TabAsignacion').then(m => ({
  default: m.TabAsignacion
})));
const TabRedes = lazy(() => import('./TabRedes').then(m => ({
  default: m.TabRedes
})));
const TabInventarios = lazy(() => import('./TabInventarios').then(m => ({
  default: m.TabInventarios
})));
const TabModelos = lazy(() => import('./TabModelos').then(m => ({
  default: m.TabModelos
})));
const TabEnunciado = lazy(() => import('./TabEnunciado').then(m => ({
  default: m.TabEnunciado
})));
const TabPlantillas = lazy(() => import('./TabPlantillas').then(m => ({
  default: m.TabPlantillas
})));
const TABS = [['enunciado', 'Desde un enunciado', TabEnunciado], ['pl', 'Programación lineal', TabPL], ['mas', 'Entera, grafos y decisiones', TabPlantillas], ['transporte', 'Transporte', TabTransporte], ['asignacion', 'Asignación', TabAsignacion], ['redes', 'CPM / PERT', TabRedes], ['inventarios', 'Inventarios', TabInventarios], ['colas', 'Colas', TabModelos], ['markov', 'Markov', TabModelos], ['noLineal', 'No lineal', TabModelos]];
export const IoCalculadora = () => {
  const [tab, setTab] = useState('enunciado');
  const id = useId();
  const moverTab = (evento, indice) => {
    const movimientos = { ArrowRight: (indice + 1) % TABS.length, ArrowLeft: (indice + TABS.length - 1) % TABS.length, Home: 0, End: TABS.length - 1 };
    if (!Object.hasOwn(movimientos, evento.key)) return;
    evento.preventDefault();
    const siguiente = movimientos[evento.key];
    setTab(TABS[siguiente][0]);
    evento.currentTarget.parentElement.querySelectorAll('[role="tab"]')[siguiente].focus();
  };
  const Componente = TABS.find(t => t[0] === tab)[2];
  return <div className="min-w-0">
  <div className="io-segmentos io-segmentos--envolver mb-5" role="tablist" aria-label="Método de Investigación de Operaciones">
    {TABS.map(([k, n], indice) => <button type="button" key={k} role="tab" id={`${id}-${k}`} aria-controls={`${id}-panel`} aria-selected={k === tab} tabIndex={k === tab ? 0 : -1} onKeyDown={e => moverTab(e, indice)} className={k === tab ? 'is-activo' : ''} onClick={() => setTab(k)}>
      {n}
    </button>)}
  </div>
  <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`}>
  <Suspense fallback={<p role="status">Cargando calculadora…</p>}>
    <Componente key={tab} tipo={tab} onManual={setTab} />
  </Suspense>
  </div>
</div>;
};
