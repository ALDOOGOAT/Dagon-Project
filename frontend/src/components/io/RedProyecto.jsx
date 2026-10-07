import { useMemo } from 'react';
import { ReactFlow, Background, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from '../../contexts/ThemeContext';
import { fmt } from './ui';

const NodoActividad = ({ data }) => (
  <div className={`io-nodo ${data.critica ? 'io-nodo--critica' : ''}`}>
    <Handle type="target" position={Position.Left} isConnectable={false} />
    <div className="io-nodo__tiempos"><span>{fmt(data.ES)}</span><span>{fmt(data.EF)}</span></div>
    <div className="io-nodo__id">{data.id}</div>
    <div className="io-nodo__tiempos"><span>{fmt(data.LS)}</span><span>{fmt(data.LF)}</span></div>
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </div>
);

const nodeTypes = { actividad: NodoActividad };

// Red de actividades en nodos. Cada nodo: ES/EF arriba, actividad en el centro, LS/LF abajo.
export const RedProyecto = ({ actividades }) => {
  const { colors } = useTheme();

  const { nodes, edges } = useMemo(() => {
    const porId = Object.fromEntries(actividades.map((a) => [a.id, a]));
    const nivel = {};
    const calcular = (id, visitando = new Set()) => {
      if (nivel[id] !== undefined) return nivel[id];
      if (visitando.has(id)) return 0;
      visitando.add(id);
      const preds = (porId[id]?.predecesoras || []).filter((p) => porId[p]);
      nivel[id] = preds.length ? Math.max(...preds.map((p) => calcular(p, visitando))) + 1 : 0;
      return nivel[id];
    };
    actividades.forEach((a) => calcular(a.id));
    const contador = {};
    const nodes = actividades.map((a) => {
      const k = nivel[a.id];
      const fila = contador[k] || 0;
      contador[k] = fila + 1;
      return { id: a.id, type: 'actividad', position: { x: k * 150, y: fila * 120 }, data: a, draggable: false };
    });
    const edges = actividades.flatMap((a) => (a.predecesoras || []).filter((p) => porId[p]).map((p) => {
      const critica = a.critica && porId[p].critica;
      return {
        id: `${p}-${a.id}`, source: p, target: a.id,
        animated: critica,
        markerEnd: { type: MarkerType.ArrowClosed, color: critica ? colors.primary : colors.textMuted },
        style: { stroke: critica ? colors.primary : colors.textMuted, strokeWidth: critica ? 3 : 1.5 },
      };
    }));
    return { nodes, edges };
  }, [actividades, colors.primary, colors.textMuted]);

  return (
    <div className="io-red" role="img" aria-label="Red de actividades con la ruta crítica resaltada">
      <ReactFlow
        nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
        zoomOnScroll={false} preventScrolling={false} proOptions={{ hideAttribution: true }} minZoom={0.3}
      >
        <Background color={colors.border} gap={24} />
      </ReactFlow>
    </div>
  );
};

export default RedProyecto;
