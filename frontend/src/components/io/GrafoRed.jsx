import { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '../../contexts/ThemeContext';
import { fmt } from './ui';

const NodoGrafo = ({ data }) => (
  <div className={`io-nodo-grafo ${data.extremo ? 'io-nodo-grafo--extremo' : ''} ${data.fuente ? 'io-nodo-grafo--fuente' : ''}`}>
    <Handle type="target" position={Position.Left} isConnectable={false} />
    {data.id}
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </div>
);
const nodeTypes = { grafo: NodoGrafo };

// Capas por distancia en aristas (BFS) desde el origen: la red se lee de izquierda a derecha.
function capas(nodos, aristas, inicio) {
  const vecinos = new Map(nodos.map((n) => [n, []]));
  aristas.forEach((a) => { vecinos.get(a.origen).push(a.destino); vecinos.get(a.destino).push(a.origen); });
  const nivel = {};
  [inicio, ...nodos].forEach((raiz) => {
    if (nivel[raiz] !== undefined) return;
    const base = Math.max(-1, ...Object.values(nivel)) + 1;
    nivel[raiz] = base;
    const cola = [raiz];
    while (cola.length) {
      const u = cola.shift();
      vecinos.get(u).forEach((v) => { if (nivel[v] === undefined) { nivel[v] = nivel[u] + 1; cola.push(v); } });
    }
  });
  return nivel;
}

/** Grafo con la solución resaltada: ruta, árbol o aristas con flujo; el corte mínimo va punteado. */
export const GrafoRed = ({ grafico }) => {
  const { colors } = useTheme();
  const { nodos, aristas, resaltadas = [], dirigido, origen, destino, flujos, corte = [] } = grafico;

  const { nodes, edges } = useMemo(() => {
    const nivel = capas(nodos, aristas, origen && nodos.includes(origen) ? origen : nodos[0]);
    const filas = {};
    const nodes = nodos.map((id) => {
      const k = nivel[id];
      const fila = filas[k] || 0;
      filas[k] = fila + 1;
      return { id, type: 'grafo', position: { x: k * 170, y: fila * 110 + (k % 2) * 30 }, data: { id, extremo: id === destino, fuente: id === origen }, draggable: false };
    });
    const marcadas = new Set(resaltadas), cortadas = new Set(corte);
    const edges = aristas.map((a, i) => {
      const activa = marcadas.has(i);
      const color = activa ? colors.primary : colors.textMuted;
      const etiqueta = flujos ? `${fmt(flujos[i])} / ${fmt(a.valor)}` : fmt(a.valor);
      return {
        id: `e${i}`, source: a.origen, target: a.destino, type: 'straight', label: etiqueta,
        labelStyle: { fill: activa ? colors.primary : colors.text, fontWeight: activa ? 800 : 500, fontSize: 12 },
        labelBgStyle: { fill: colors.surface, fillOpacity: 0.9 },
        labelBgPadding: [4, 2], labelBgBorderRadius: 4,
        markerEnd: dirigido ? { type: MarkerType.ArrowClosed, color } : undefined,
        style: { stroke: cortadas.has(i) ? '#f87171' : color, strokeWidth: activa ? 3.5 : 1.5, strokeDasharray: cortadas.has(i) ? '6 4' : undefined },
        animated: activa && Boolean(flujos),
      };
    });
    return { nodes, edges };
  }, [nodos, aristas, resaltadas, dirigido, origen, destino, flujos, corte, colors]);

  return (
    <div>
      <div className="io-red" role="img" aria-label="Red de nodos y aristas con la solución resaltada">
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
          zoomOnScroll={false} preventScrolling={false} proOptions={{ hideAttribution: true }} minZoom={0.3}
        >
          <Background color={colors.border} gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <ul className="io-leyenda">
        <li><i style={{ backgroundColor: colors.primary }} />{flujos ? 'Aristas con flujo (flujo / capacidad)' : 'Aristas de la solución'}</li>
        <li><i style={{ backgroundColor: colors.textMuted }} />Otras aristas</li>
        {corte.length > 0 && <li><i className="io-leyenda__raya" style={{ borderColor: '#f87171' }} />Corte mínimo</li>}
        {origen && <li><i style={{ backgroundColor: colors.accent, borderRadius: 999 }} />Origen {origen}{destino ? ` · destino ${destino}` : ''}</li>}
      </ul>
    </div>
  );
};

export default GrafoRed;
