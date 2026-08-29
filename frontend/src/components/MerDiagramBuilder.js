import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
    if (data?.readOnly) return;
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
              disabled={data?.readOnly}
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
const ROLE_STYLES = {
  pk: {
    badge: 'bg-amber-400/15 border-amber-400/60 text-amber-300',
    text: 'text-amber-200 font-bold',
    label: 'PK'
  },
  fk: {
    badge: 'bg-cyan-400/15 border-cyan-400/60 text-cyan-300',
    text: 'text-cyan-200 font-bold',
    label: 'FK'
  },
  normal: {
    badge: 'bg-slate-800 border-slate-700 text-slate-500',
    text: 'text-slate-300 focus:text-cyan-300',
    label: 'COL'
  }
};

const TableNode = ({ data, id, isConnectable }) => {
  const sinNombre = !String(data.label || '').trim();
  const sinPk = !(data.columns || []).some((col) => col.role === 'pk');

  return (
    <div
      className={`bg-slate-900 border-2 rounded-xl w-60 overflow-hidden font-mono text-sm transition-all ${
        sinNombre
          ? 'border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
          : 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-cyan-400'
      }`}
    >
      {/* Conectores de Red de Datos */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className={`w-3 h-3 border-2 border-slate-900 -left-1.5 cursor-pointer transition-all ${
          data.conectandoDesde && data.conectandoDesde !== id
            ? 'bg-fuchsia-400 scale-150 animate-pulse'
            : 'bg-fuchsia-500'
        }`}
        onClick={() => data.onHandleClick?.(id, 'target')}
        title={`Punto de entrada de ${data.label || 'esta entidad'}`}
        aria-label={`Punto de entrada de ${data.label || 'esta entidad'}`}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className={`w-3 h-3 border-2 border-slate-900 -right-1.5 cursor-pointer transition-all ${
          data.conectandoDesde === id ? 'bg-cyan-200 scale-150 animate-pulse' : 'bg-cyan-400'
        }`}
        onClick={() => data.onHandleClick?.(id, 'source')}
        title={`Punto de salida de ${data.label || 'esta entidad'}`}
        aria-label={`Punto de salida de ${data.label || 'esta entidad'}`}
      />

      {/* Cabecera de la Tabla */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-800 px-3 py-2 flex items-center justify-between gap-1">
        <div className="flex items-center gap-2 text-white font-black tracking-widest uppercase text-[10px] min-w-0">
          <Database className="w-3 h-3 shrink-0" />
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => data.onChangeName(id, e.target.value)}
            disabled={data.readOnly}
            className="bg-transparent border-none outline-none text-white w-28 placeholder-rose-200 font-bold"
            placeholder="SIN NOMBRE"
            aria-label="Nombre de la entidad"
          />
        </div>
        {!data.readOnly && (
          <button
            onClick={() => data.onDeleteNode(id)}
            className="text-blue-200 hover:text-rose-300 transition-colors shrink-0 nodrag"
            title="Eliminar esta entidad"
            aria-label="Eliminar esta entidad"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cuerpo: Columnas con Roles Inteligentes */}
      <div className="p-3 text-slate-300 space-y-2 bg-[#0d1117]">
        {data.columns?.map((col, index) => {
          const estilo = ROLE_STYLES[col.role] || ROLE_STYLES.normal;
          return (
            <div key={index} className="flex items-center gap-2 group/col">
              {/* Selector de Rol (PK, FK, Normal) */}
              <button
                onClick={() => data.onToggleRole(id, index)}
                disabled={data.readOnly}
                className={`w-10 h-5 rounded flex items-center justify-center gap-0.5 text-[8px] font-black transition-all border shrink-0 nodrag ${estilo.badge}`}
                title="Cambiar rol (Normal / PK / FK)"
              >
                {col.role === 'pk' && <Key className="w-2 h-2" />}
                {estilo.label}
              </button>

              <input
                type="text"
                value={col.name || ''}
                onChange={(e) => data.onChangeColumn(id, index, e.target.value)}
                disabled={data.readOnly}
                className={`bg-transparent border-none outline-none text-[11px] w-full transition-colors nodrag ${estilo.text}`}
                placeholder="atributo_nombre"
                aria-label="Nombre del atributo"
              />

              {!data.readOnly && (
                <button
                  onClick={() => data.onDeleteColumn(id, index)}
                  className="opacity-0 group-hover/col:opacity-100 text-slate-600 hover:text-rose-400 transition-all shrink-0 nodrag"
                  title="Eliminar este atributo"
                  aria-label="Eliminar este atributo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {sinPk && (
          <p className="text-[9px] text-amber-400/80 uppercase tracking-wider flex items-center gap-1">
            <Key className="w-2.5 h-2.5" /> sin clave primaria
          </p>
        )}

        {!data.readOnly && (
          <button
            onClick={() => data.onAddColumn(id)}
            className="w-full mt-2 py-1.5 text-[10px] text-slate-500 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg flex items-center justify-center gap-1.5 transition-all border border-dashed border-slate-800 hover:border-cyan-500/30 uppercase font-bold tracking-tighter nodrag"
          >
            <Plus className="w-3 h-3" /> añadir atributo
          </button>
        )}
      </div>
    </div>
  );
};

// Registramos los tipos custom
const nodeTypes = { tableNode: TableNode };
const edgeTypes = { relationshipEdge: RelationshipEdge };

const sanitizeIdentifier = (value, fallback = 'tabla') => {
  const clean = String(value || '')
    .trim()
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  if (!clean) return fallback;
  return /^\d/.test(clean) ? `_${clean}` : clean;
};

export const generateSqlFromDiagramData = ({ nodes = [], edges = [] } = {}) => {
  const nodeById = new Map((nodes || []).map((node) => [node.id, node]));
  const tableSql = (nodes || []).map((node) => {
    const tableName = sanitizeIdentifier(node?.data?.label, 'tabla');
    const columns = Array.isArray(node?.data?.columns) && node.data.columns.length > 0
      ? node.data.columns
      : [{ name: 'id', role: 'pk', type: 'INTEGER' }];

    const columnLines = columns.map((column) => {
      const name = sanitizeIdentifier(column?.name, 'columna');
      const role = column?.role || 'normal';
      const fallbackType = role === 'pk' || role === 'fk' ? 'INTEGER' : 'TEXT';
      const type = String(column?.type || fallbackType).trim() || fallbackType;
      return `    ${name} ${type}${role === 'pk' ? ' PRIMARY KEY' : ''}`;
    });

    return `CREATE TABLE ${tableName} (\n${columnLines.join(',\n')}\n);`;
  });

  const relationSql = (edges || []).map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return null;

    const sourceTable = sanitizeIdentifier(source?.data?.label, 'origen');
    const targetTable = sanitizeIdentifier(target?.data?.label, 'destino');
    const sourceColumns = Array.isArray(source?.data?.columns) ? source.data.columns : [];
    const targetColumns = Array.isArray(target?.data?.columns) ? target.data.columns : [];
    const fkColumn = sanitizeIdentifier(
      edge?.data?.sourceColumn || sourceColumns.find((column) => column.role === 'fk')?.name || `${targetTable}_id`,
      `${targetTable}_id`
    );
    const pkColumn = sanitizeIdentifier(
      edge?.data?.targetColumn || targetColumns.find((column) => column.role === 'pk')?.name || 'id',
      'id'
    );

    return `ALTER TABLE ${sourceTable} ADD CONSTRAINT fk_${sourceTable}_${targetTable} FOREIGN KEY (${fkColumn}) REFERENCES ${targetTable}(${pkColumn});`;
  }).filter(Boolean);

  return [...tableSql, ...relationSql].join('\n\n');
};

// --- EL LIENZO PRINCIPAL ---
export const MerDiagramBuilder = ({ onChangeData = () => {}, initialNodes = [], initialEdges = [], readOnly = false }) => {
  const [nodes, setNodes] = useState(Array.isArray(initialNodes) ? initialNodes : []);
  const [edges, setEdges] = useState(Array.isArray(initialEdges) ? initialEdges : []);

  // Sincronizar con props externos (solo si realmente cambiaron y no somos los mismos)
  useEffect(() => {
    if (Array.isArray(initialNodes) && initialNodes.length > 0) {
      // Solo actualizamos si es diferente a lo que ya tenemos
      // para evitar bucles si el padre reacciona a nuestros cambios
      const currentNodesStr = JSON.stringify(nodes);
      const newNodesStr = JSON.stringify(initialNodes);
      if (currentNodesStr !== newNodesStr) {
        setNodes(initialNodes);
      }
    }
    if (Array.isArray(initialEdges) && initialEdges.length > 0) {
      const currentEdgesStr = JSON.stringify(edges);
      const newEdgesStr = JSON.stringify(initialEdges);
      if (currentEdgesStr !== newEdgesStr) {
        setEdges(initialEdges);
      }
    }
    // 'nodes' y 'edges' se leen a proposito sin declararlos: incluirlos reintroduce el
    // bucle que la comparacion por JSON de arriba evita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges]);

  // Notificar al padre (ExercisePage) cada vez que el diagrama cambia
  const notifyChange = useCallback((newNodes, newEdges) => {
    // Usamos un timeout o useEffect para evitar colapsar el ciclo de renderizado de React
    onChangeData({ nodes: newNodes, edges: newEdges });
  }, [onChangeData]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);
      return updatedNodes;
    });
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      const updatedEdges = applyEdgeChanges(changes, eds);
      return updatedEdges;
    });
  }, []);

  const lastNotifiedRef = useRef('');

  // Notificar cambios de forma segura fuera del ciclo de renderizado inmediato
  useEffect(() => {
    const currentState = JSON.stringify({ nodes, edges });
    if (currentState === lastNotifiedRef.current) return;
    
    const timeout = setTimeout(() => {
      lastNotifiedRef.current = currentState;
      notifyChange(nodes, edges);
    }, 50);
    return () => clearTimeout(timeout);
  }, [nodes, edges, notifyChange]);

  const handleChangeCardinality = useCallback((edgeId, newCardinality) => {
    setEdges((eds) => {
      return eds.map((edge) => {
        if (edge.id === edgeId) {
          return { ...edge, data: { ...edge.data, cardinality: newCardinality } };
        }
        return edge;
      });
    });
  }, []);

  const crearRelacion = useCallback((params) => {
    setEdges((eds) => {
      const yaExiste = eds.some((e) => e.source === params.source && e.target === params.target);
      if (yaExiste) return eds;
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
      return addEdge(newEdge, eds);
    });
  }, [handleChangeCardinality]);

  const onConnect = useCallback((params) => {
    if (readOnly) return;
    crearRelacion(params);
  }, [crearRelacion, readOnly]);

  // Alternativa al arrastre: clic en el punto de salida de una entidad y luego en el de
  // entrada de otra. Acertar un punto de 12px con el raton es fragil en portatiles y
  // directamente imposible con teclado.
  const [conectandoDesde, setConectandoDesde] = useState(null);

  const handleHandleClick = useCallback((nodeId, tipo) => {
    if (readOnly) return;
    if (tipo === 'source') {
      setConectandoDesde((actual) => (actual === nodeId ? null : nodeId));
      return;
    }
    setConectandoDesde((origen) => {
      if (origen && origen !== nodeId) {
        crearRelacion({ source: origen, target: nodeId });
      }
      return null;
    });
  }, [crearRelacion, readOnly]);

  // --- Funciones de mutación de datos de los nodos ---
  const updateNodeData = useCallback((id, newDataUpdater) => {
    if (readOnly) return;
    setNodes((nds) => {
      return nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: newDataUpdater(node.data) };
        }
        return node;
      });
    });
  }, [readOnly]);

  const handleChangeName = useCallback((id, newName) => (
    updateNodeData(id, (data) => ({ ...data, label: newName }))
  ), [updateNodeData]);
  
  const handleAddColumn = useCallback((id) => (
    updateNodeData(id, (data) => ({
      ...data,
      columns: [...(data.columns || []), { name: '', role: 'normal' }]
    }))
  ), [updateNodeData]);
  
  const handleChangeColumn = useCallback((id, index, newVal) => updateNodeData(id, (data) => {
    const newCols = [...data.columns];
    newCols[index] = { ...newCols[index], name: newVal };
    return { ...data, columns: newCols };
  }), [updateNodeData]);

  const handleDeleteColumn = useCallback((id, index) => updateNodeData(id, (data) => ({
    ...data,
    columns: (data.columns || []).filter((_, i) => i !== index)
  })), [updateNodeData]);

  // Al borrar una entidad se van tambien sus relaciones: una arista huerfana
  // no se puede evaluar y deja el lienzo mintiendo sobre el modelo.
  const handleDeleteNode = useCallback((id) => {
    if (readOnly) return;
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [readOnly]);

  const handleToggleRole = useCallback((id, index) => updateNodeData(id, (data) => {
    const newCols = [...data.columns];
    const roles = ['normal', 'pk', 'fk'];
    const currentRole = newCols[index].role || 'normal';
    const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length];
    newCols[index] = { ...newCols[index], role: nextRole };
    return { ...data, columns: newCols };
  }), [updateNodeData]);

  // --- Agregar Nueva Tabla ---
  const addTable = () => {
    if (readOnly) return;
    // Rejilla en vez de posicion aleatoria: dos entidades seguidas se tapaban entre si
    // y el alumno no veia la que acababa de crear.
    const indice = nodes.length;
    const newNode = {
      id: uuidv4(),
      type: 'tableNode',
      position: { x: 60 + (indice % 3) * 300, y: 60 + Math.floor(indice / 3) * 260 },
      data: { 
        label: '', 
        columns: [{ name: 'id', role: 'pk' }],
        onChangeName: handleChangeName,
        onAddColumn: handleAddColumn,
        onChangeColumn: handleChangeColumn,
        onToggleRole: handleToggleRole,
        onDeleteColumn: handleDeleteColumn,
        onDeleteNode: handleDeleteNode,
        readOnly
      },
    };
    setNodes((nds) => {
      const updated = [...nds, newNode];
      notifyChange(updated, edges);
      return updated;
    });
  };

  const clearCanvas = () => {
    if (readOnly) return;
    setNodes([]);
    setEdges([]);
    setConectandoDesde(null);
    notifyChange([], []);
  };

  const nodesWithHandlers = useMemo(() => (
    nodes.map((node) => ({
      ...node,
      data: {
        ...(node.data || {}),
        onChangeName: handleChangeName,
        onAddColumn: handleAddColumn,
        onChangeColumn: handleChangeColumn,
        onToggleRole: handleToggleRole,
        onDeleteColumn: handleDeleteColumn,
        onDeleteNode: handleDeleteNode,
        onHandleClick: handleHandleClick,
        conectandoDesde,
        readOnly
      }
    }))
  ), [nodes, handleAddColumn, handleChangeColumn, handleChangeName, handleToggleRole,
      handleDeleteColumn, handleDeleteNode, handleHandleClick, conectandoDesde, readOnly]);

  const edgesWithHandlers = useMemo(() => (
    edges.map((edge) => ({
      ...edge,
      data: {
        ...(edge.data || {}),
        onChangeCardinality: handleChangeCardinality,
        readOnly
      }
    }))
  ), [edges, handleChangeCardinality, readOnly]);

  return (
    <div className="w-full h-full relative bg-[#090b10]">
      {/* Panel de Herramientas Flotante */}
      {!readOnly && (
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={addTable}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" /> Entidad
          </button>
          <button
            onClick={clearCanvas}
            className="bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
            title="Limpiar lienzo"
            aria-label="Limpiar lienzo"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Contador y leyenda: el alumno sabe que lleva sin tener que ejecutar */}
          <div className="bg-slate-900/90 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
            <span className="text-slate-400">
              <span className="text-cyan-300">{nodes.length}</span> entidad{nodes.length === 1 ? '' : 'es'}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Link2 className="w-3 h-3 text-fuchsia-400" />
              <span className="text-fuchsia-300">{edges.length}</span> relaci{edges.length === 1 ? 'ón' : 'ones'}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-amber-300 flex items-center gap-1" title="Clave primaria">
              <Key className="w-3 h-3" /> PK
            </span>
            <span className="text-cyan-300" title="Clave foránea">FK</span>
          </div>
        </div>
      )}

      {/* Conexion en curso iniciada con un clic */}
      {conectandoDesde && !readOnly && (
        <div className="absolute top-20 left-4 z-20 bg-cyan-500/15 border border-cyan-400/50 rounded-lg px-3 py-2 max-w-xs">
          <p className="text-[11px] text-cyan-200 font-bold leading-snug">
            Ahora pulsa el punto fucsia de la entidad con la que quieras relacionarla.
          </p>
          <button
            onClick={() => setConectandoDesde(null)}
            className="mt-1 text-[10px] uppercase font-black tracking-wider text-cyan-400/70 hover:text-cyan-200"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Estado vacío: sin esto el lienzo en blanco no dice qué hacer */}
      {nodes.length === 0 && !readOnly && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none px-6">
          <div className="text-center max-w-sm">
            <Database className="w-10 h-10 mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
              Lienzo vacío
            </p>
            <p className="text-slate-500 text-xs leading-relaxed">
              Pulsa <span className="text-blue-400 font-bold">+ Entidad</span> para crear una tabla,
              ponle nombre y marca su clave primaria con el botón <span className="text-amber-400 font-bold">PK</span>.
              Para relacionar dos entidades, pulsa el punto <span className="text-cyan-400 font-bold">cyan</span> de
              una y luego el <span className="text-fuchsia-400 font-bold">fucsia</span> de la otra (o arrastra
              de uno a otro).
            </p>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edgesWithHandlers}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        fitView
        className="cyber-flow"
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls style={{ backgroundColor: '#1e293b', borderColor: '#334155' }} className="fill-cyan-400" />
      </ReactFlow>
    </div>
  );
};
