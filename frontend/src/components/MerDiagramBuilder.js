import React, { useState, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Handle, 
  Position, 
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Database, Plus, Trash2, Settings2, Key, Link2 } from 'lucide-react';

// --- ARISTA CUSTOM CON CARDINALIDAD ---
const RelationshipEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
  });

  const onCardinalityChange = (evt) => {
    data.onChangeCardinality(id, evt.target.value);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="bg-slate-900 border border-cyan-500/50 rounded-lg px-2 py-1 shadow-lg flex items-center gap-2 group">
            <Settings2 className="w-3 h-3 text-cyan-400 group-hover:rotate-90 transition-transform" />
            <select
              value={data?.cardinality || '1:N'}
              onChange={onCardinalityChange}
              className="bg-transparent text-[10px] font-bold text-cyan-200 outline-none cursor-pointer uppercase"
            >
              <option value="1:1" className="bg-slate-900 text-white">1:1 (Uno a Uno)</option>
              <option value="1:N" className="bg-slate-900 text-white">1:N (Uno a Muchos)</option>
              <option value="M:N" className="bg-slate-900 text-white">M:N (Muchos a Muchos)</option>
            </select>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// --- EL DISEÑO DE LA TABLA (NODO CUSTOM) ---
const TableNode = ({ data, id, isConnectable }) => {
  return (
    <div className="bg-slate-900 border-2 border-blue-500/50 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] w-60 overflow-hidden font-mono text-sm transition-all hover:border-cyan-400">
      
      {/* Conectores de Red de Datos */}
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-fuchsia-500 border-2 border-slate-900 -left-1.5" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-cyan-400 border-2 border-slate-900 -right-1.5" />
      
      {/* Cabecera de la Tabla */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-black tracking-widest uppercase text-[10px]">
          <Database className="w-3 h-3" />
          <input 
            type="text" 
            defaultValue={data.label} 
            onChange={(e) => data.onChangeName(id, e.target.value)}
            className="bg-transparent border-none outline-none text-white w-32 placeholder-blue-300 font-bold"
            placeholder="TABLA"
          />
        </div>
      </div>

      {/* Cuerpo: Columnas con Roles Inteligentes */}
      <div className="p-3 text-slate-300 space-y-2 bg-[#0d1117]">
        {data.columns?.map((col, index) => (
          <div key={index} className="flex items-center gap-2 group/col">
            {/* Selector de Rol (PK, FK, Normal) */}
            <button
              onClick={() => data.onToggleRole(id, index)}
              className={`w-10 h-5 rounded flex items-center justify-center text-[8px] font-black transition-all border shrink-0 ${
                col.role === 'pk' ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-400' :
                col.role === 'fk' ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-400' :
                'bg-slate-800 border-slate-700 text-slate-500'
              }`}
              title="Cambiar rol (Normal / PK / FK)"
            >
              {col.role === 'pk' ? 'PK' : col.role === 'fk' ? 'FK' : 'COL'}
            </button>

            <input 
              type="text" 
              defaultValue={col.name}
              onChange={(e) => data.onChangeColumn(id, index, e.target.value)}
              className={`bg-transparent border-none outline-none text-[11px] w-full transition-colors ${
                col.role === 'pk' ? 'text-yellow-200 font-bold' :
                col.role === 'fk' ? 'text-cyan-200 font-bold' :
                'text-slate-300 focus:text-cyan-300'
              }`}
              placeholder="atributo_nombre"
            />
          </div>
        ))}
        
        <button 
          onClick={() => data.onAddColumn(id)}
          className="w-full mt-2 py-1.5 text-[10px] text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg flex items-center justify-center gap-1.5 transition-all border border-dashed border-slate-800 hover:border-cyan-500/30 uppercase font-bold tracking-tighter"
        >
          <Plus className="w-3 h-3" /> añadir atributo
        </button>
      </div>
    </div>
  );
};

// Registramos los tipos custom
const nodeTypes = { tableNode: TableNode };
const edgeTypes = { relationshipEdge: RelationshipEdge };

// --- EL LIENZO PRINCIPAL ---
export const MerDiagramBuilder = ({ onChangeData }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Notificar al padre (ExercisePage) cada vez que el diagrama cambia
  const notifyChange = useCallback((newNodes, newEdges) => {
    onChangeData({ nodes: newNodes, edges: newEdges });
  }, [onChangeData]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);
      notifyChange(updatedNodes, edges);
      return updatedNodes;
    });
  }, [edges, notifyChange]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      const updatedEdges = applyEdgeChanges(changes, eds);
      notifyChange(nodes, updatedEdges);
      return updatedEdges;
    });
  }, [nodes, notifyChange]);

  const handleChangeCardinality = useCallback((edgeId, newCardinality) => {
    setEdges((eds) => {
      const updatedEdges = eds.map((edge) => {
        if (edge.id === edgeId) {
          return { ...edge, data: { ...edge.data, cardinality: newCardinality } };
        }
        return edge;
      });
      notifyChange(nodes, updatedEdges);
      return updatedEdges;
    });
  }, [nodes, notifyChange]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => {
      // Líneas estilo neón cyberpunk con el nuevo tipo custom
      const newEdge = { 
        ...params, 
        id: `e-${uuidv4()}`,
        type: 'relationshipEdge',
        animated: true, 
        style: { stroke: '#22d3ee', strokeWidth: 2 },
        data: { 
          cardinality: '1:N',
          onChangeCardinality: handleChangeCardinality
        }
      };
      const updatedEdges = addEdge(newEdge, eds);
      notifyChange(nodes, updatedEdges);
      return updatedEdges;
    });
  }, [nodes, handleChangeCardinality, notifyChange]);

  // --- Funciones de mutación de datos de los nodos ---
  const updateNodeData = (id, newDataUpdater) => {
    setNodes((nds) => {
      const updated = nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: newDataUpdater(node.data) };
        }
        return node;
      });
      notifyChange(updated, edges);
      return updated;
    });
  };

  const handleChangeName = (id, newName) => updateNodeData(id, (data) => ({ ...data, label: newName }));
  
  const handleAddColumn = (id) => updateNodeData(id, (data) => ({ 
    ...data, 
    columns: [...(data.columns || []), { name: '', role: 'normal' }] 
  }));
  
  const handleChangeColumn = (id, index, newVal) => updateNodeData(id, (data) => {
    const newCols = [...data.columns];
    newCols[index] = { ...newCols[index], name: newVal };
    return { ...data, columns: newCols };
  });

  const handleToggleRole = (id, index) => updateNodeData(id, (data) => {
    const newCols = [...data.columns];
    const roles = ['normal', 'pk', 'fk'];
    const currentRole = newCols[index].role || 'normal';
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    newCols[index] = { ...newCols[index], role: nextRole };
    return { ...data, columns: newCols };
  });

  // --- Agregar Nueva Tabla ---
  const addTable = () => {
    const newNode = {
      id: uuidv4(),
      type: 'tableNode',
      position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 },
      data: { 
        label: '', 
        columns: [{ name: 'id', role: 'pk' }],
        onChangeName: handleChangeName,
        onAddColumn: handleAddColumn,
        onChangeColumn: handleChangeColumn,
        onToggleRole: handleToggleRole
      },
    };
    setNodes((nds) => {
      const updated = [...nds, newNode];
      notifyChange(updated, edges);
      return updated;
    });
  };

  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    notifyChange([], []);
  };

  return (
    <div className="w-full h-full relative bg-[#090b10]">
      {/* Panel de Herramientas Flotante */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button 
          onClick={addTable}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" /> Entidad
        </button>
        <button 
          onClick={clearCanvas}
          className="bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
          title="Limpiar Lienzo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="cyber-flow"
      >
        <Background color={colors.surface} gap={20} size={1} />
        <Controls style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="fill-blue-400" />
      </ReactFlow>
    </div>
  );
};