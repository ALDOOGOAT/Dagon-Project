import { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '../../contexts/ThemeContext';
import { fmt } from './ui';

const MAX_VISIBLES = 80;

const tipoNodo = (n) => (n.optimo ? 'optimo' : n.incumbente ? 'incumbente' : n.estado === 'infactible' ? 'infactible' : n.ramificaEn ? 'rama' : 'podado');

const NodoBB = ({ data }) => (
  <div className={`io-nodo-bb io-nodo-bb--${data.tipo}`}>
    <Handle type="target" position={Position.Top} isConnectable={false} />
    <strong>P{data.id}</strong>
    <span>{data.estado === 'infactible' ? 'Infactible' : `Z = ${fmt(data.z, 3)}`}</span>
    {data.x && data.estado !== 'infactible' && <small>{Object.entries(data.x).map(([k, v]) => `${k}=${fmt(v, 2)}`).join(' ')}</small>}
    <Handle type="source" position={Position.Bottom} isConnectable={false} />
  </div>
);
const nodeTypes = { bb: NodoBB };

/** Árbol de ramificación y acotamiento: cada arista lleva la cota agregada (x ≤ k / x ≥ k+1). */
export const ArbolBB = ({ arbol }) => {
  const { colors } = useTheme();

  const { nodes, edges } = useMemo(() => {
    const visibles = arbol.nodos.slice(0, MAX_VISIBLES);
    const hijos = new Map(visibles.map((n) => [n.id, []]));
    visibles.forEach((n) => { if (n.padre !== null && hijos.has(n.padre)) hijos.get(n.padre).push(n.id); });
    // Posición horizontal por recorrido de hojas: el árbol no se superpone.
    const x = {};
    let hoja = 0;
    const ubicar = (id) => {
      const h = hijos.get(id);
      if (!h.length) { x[id] = hoja++; return; }
      h.forEach(ubicar);
      x[id] = (x[h[0]] + x[h[h.length - 1]]) / 2;
    };
    ubicar(visibles[0].id);
    const nodes = visibles.map((n) => ({ id: String(n.id), type: 'bb', position: { x: x[n.id] * 150, y: n.profundidad * 130 }, data: { ...n, tipo: tipoNodo(n) }, draggable: false }));
    const edges = visibles.filter((n) => n.padre !== null && hijos.has(n.padre)).map((n) => ({
      id: `b${n.id}`, source: String(n.padre), target: String(n.id), type: 'smoothstep', label: n.rama,
      labelStyle: { fill: colors.text, fontSize: 12, fontWeight: 700 }, labelBgStyle: { fill: colors.surface, fillOpacity: 0.9 },
      style: { stroke: n.optimo ? '#34d399' : colors.textMuted, strokeWidth: n.optimo ? 3 : 1.5 },
    }));
    return { nodes, edges };
  }, [arbol, colors]);

  return (
    <div>
      <div className="io-red io-red--alto" role="img" aria-label="Árbol de ramificación y acotamiento">
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
          zoomOnScroll={false} preventScrolling={false} proOptions={{ hideAttribution: true }} minZoom={0.15}
        >
          <Background color={colors.border} gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <ul className="io-leyenda">
        <li><i className="io-bb-muestra io-nodo-bb--optimo" />Óptimo entero</li>
        <li><i className="io-bb-muestra io-nodo-bb--incumbente" />Solución entera superada</li>
        <li><i className="io-bb-muestra io-nodo-bb--rama" />Se ramifica</li>
        <li><i className="io-bb-muestra io-nodo-bb--podado" />Podado por cota</li>
        <li><i className="io-bb-muestra io-nodo-bb--infactible" />Infactible</li>
      </ul>
      {arbol.nodos.length > MAX_VISIBLES && <p className="io-ayuda">Se dibujan los primeros {MAX_VISIBLES} de {arbol.nodos.length} subproblemas; la tabla del procedimiento los lista todos.</p>}
    </div>
  );
};

export default ArbolBB;
