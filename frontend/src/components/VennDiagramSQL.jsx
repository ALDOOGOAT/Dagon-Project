import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Filter, GitMerge, Shield, XCircle, Merge, List, Zap, Users } from 'lucide-react';

const UNIVERSE = [
  { id: 1, nombre: 'Aldo', clase: 'Guerrero', nivel: 30 },
  { id: 2, nombre: 'Kratos', clase: 'Guerrero', nivel: 50 },
  { id: 3, nombre: 'Gimli', clase: 'Guerrero', nivel: 15 },
  { id: 4, nombre: 'Leonidas', clase: 'Guerrero', nivel: 10 },
  { id: 5, nombre: 'Merlin', clase: 'Mago', nivel: 40 },
  { id: 6, nombre: 'Gandalf', clase: 'Mago', nivel: 80 },
  { id: 7, nombre: 'Dan', clase: 'Asesino', nivel: 25 },
  { id: 8, nombre: 'Robin', clase: 'Arquero', nivel: 12 },
];

const OPERATIONS = [
  { 
    id: 'universe', 
    label: 'Universo', 
    sql: 'SELECT * FROM usuarios',
    icon: <Database className="w-4 h-4" />,
    filterFn: () => true,
    activeAreas: ['left', 'right', 'center', 'outside'],
    description: 'Todos los aventureros'
  },
  { 
    id: 'a', 
    label: 'WHERE clase', 
    sql: "WHERE clase = 'Guerrero'",
    icon: <Filter className="w-4 h-4" />,
    filterFn: (u) => u.clase === 'Guerrero',
    activeAreas: ['left', 'center'],
    description: 'Solo los Guerreros'
  },
  { 
    id: 'b',
    label: 'WHERE nivel',
    sql: 'WHERE nivel > 20',
    icon: <Zap className="w-4 h-4" />,
    filterFn: (u) => u.nivel > 20,
    activeAreas: ['right', 'center'],
    description: 'Nivel mayor a 20'
  },
  { 
    id: 'intersect', 
    label: 'AND', 
    sql: "WHERE clase = 'Guerrero' AND nivel > 20",
    icon: <Merge className="w-4 h-4" />,
    filterFn: (u) => u.clase === 'Guerrero' && u.nivel > 20,
    activeAreas: ['center'],
    description: 'Guerreros con nivel > 20'
  },
  { 
    id: 'union', 
    label: 'OR', 
    sql: "WHERE clase = 'Guerrero' OR nivel > 20",
    icon: <GitMerge className="w-4 h-4" />,
    filterFn: (u) => u.clase === 'Guerrero' || u.nivel > 20,
    activeAreas: ['left', 'right', 'center'],
    description: 'Guerreros o nivel > 20'
  },
  { 
    id: 'difference', 
    label: '!=', 
    sql: "WHERE clase != 'Guerrero'",
    icon: <XCircle className="w-4 h-4" />,
    filterFn: (u) => u.clase !== 'Guerrero',
    activeAreas: ['right', 'outside'],
    description: 'No son Guerreros'
  }
];

export const VennDiagramSQL = ({ operation = 'universe', onOperationChange }) => {
  const [activeOp, setActiveOp] = useState(
    OPERATIONS.find(op => op.id === operation) || OPERATIONS[0]
  );
  const [hoveredArea, setHoveredArea] = useState(null);

  const filteredData = useMemo(() => {
    return UNIVERSE.filter(activeOp.filterFn);
  }, [activeOp]);

  const isAreaActive = (area) => activeOp.activeAreas.includes(area);
  const isAreaHovered = (area) => hoveredArea === area;

  const handleOpClick = (op) => {
    setActiveOp(op);
    onOperationChange?.(op.id);
  };

  const primaryColor = '#22d3ee';
  const secondaryColor = '#a855f7';
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      
      {/* Panel de controles SQL */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            onClick={() => handleOpClick(op)}
            onMouseEnter={() => setHoveredArea(op.activeAreas[0])}
            onMouseLeave={() => setHoveredArea(null)}
            className={`flex flex-col items-center p-2 rounded-xl border transition-all duration-300 text-xs font-bold ${
              activeOp.id === op.id 
                ? 'scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
                : 'hover:scale-102'
            }`}
            style={{ 
              backgroundColor: activeOp.id === op.id ? `${primaryColor}22` : 'rgba(30,41,59,0.8)',
              borderColor: activeOp.id === op.id ? primaryColor : 'rgba(255,255,255,0.1)',
              color: activeOp.id === op.id ? primaryColor : 'rgba(148,163,184,0.8)'
            }}
          >
            <div className="mb-1">{op.icon}</div>
            <span>{op.label}</span>
          </button>
        ))}
      </div>

      {/* Query SQL mostrada */}
      <motion.div 
        key={activeOp.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-3 mb-4 flex items-center gap-3"
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.4)', 
          border: '1px solid rgba(255,255,255,0.08)' 
        }}
      >
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        <code className="text-emerald-400 font-mono text-sm">
          {activeOp.sql}
        </code>
        <span className="ml-auto text-xs text-slate-500">
          {activeOp.description}
        </span>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Diagrama de Venn interactivo */}
        <div 
          className="relative aspect-square max-w-[320px] mx-auto flex items-center justify-center rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
          onMouseLeave={() => setHoveredArea(null)}
        >
          {/* Fondo del universo */}
          <motion.div 
            animate={{ opacity: isAreaActive('outside') ? 1 : 0.15 }} 
            className="absolute inset-0 bg-slate-800/50" 
          />
          <div className="absolute top-2 left-2 text-xs font-bold text-slate-500 tracking-widest uppercase z-20">
            Universo ({UNIVERSE.length})
          </div>

          {/* Círculo A: Guerrero */}
          <motion.div 
            animate={{ 
              opacity: (isAreaActive('left') || isAreaActive('center')) ? 0.85 : 0.2,
              scale: isAreaHovered('left') ? 1.05 : 1
            }}
            transition={{ duration: 0.3 }}
            className="absolute left-[8%] top-[20%] w-[55%] aspect-square rounded-full flex flex-col items-center justify-center border-2 cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(34,211,238,0.15)', 
              borderColor: primaryColor,
              boxShadow: isAreaActive('left') ? `0 0 25px ${primaryColor}44` : 'none'
            }}
            onMouseEnter={() => setHoveredArea('left')}
            onClick={() => handleOpClick(OPERATIONS[1])}
          >
            <span className="text-white font-black text-sm drop-shadow-lg">GUERREROS</span>
            <span className="text-xs text-cyan-300 mt-1">
              {UNIVERSE.filter(u => u.clase === 'Guerrero').length}
            </span>
          </motion.div>

          {/* Círculo B: Nivel > 20 */}
          <motion.div 
            animate={{ 
              opacity: (isAreaActive('right') || isAreaActive('center')) ? 0.85 : 0.2,
              scale: isAreaHovered('right') ? 1.05 : 1
            }}
            transition={{ duration: 0.3 }}
            className="absolute right-[8%] top-[20%] w-[55%] aspect-square rounded-full flex flex-col items-center justify-center border-2 cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(168,85,247,0.15)', 
              borderColor: secondaryColor,
              boxShadow: isAreaActive('right') ? `0 0 25px ${secondaryColor}44` : 'none'
            }}
            onMouseEnter={() => setHoveredArea('right')}
            onClick={() => handleOpClick(OPERATIONS[2])}
          >
            <span className="text-white font-black text-sm drop-shadow-lg text-right">NIVEL {'>'}20</span>
            <span className="text-xs text-purple-300 mt-1">
              {UNIVERSE.filter(u => u.nivel > 20).length}
            </span>
          </motion.div>

          {/* Intersección */}
          <motion.div 
            animate={{ 
              opacity: isAreaActive('center') ? 0.9 : 0,
              scale: isAreaActive('center') ? 1 : 0.8
            }}
            transition={{ duration: 0.4 }}
            className="absolute top-[35%] left-[35%] w-[30%] aspect-square rounded-full border-2 border-white/70 flex items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)',
              mixBlendMode: 'overlay'
            }}
            onMouseEnter={() => setHoveredArea('center')}
            onClick={() => handleOpClick(OPERATIONS[3])}
          >
            <span className="text-white font-bold text-xs text-center drop-shadow-lg">
              AND
            </span>
          </motion.div>
        </div>

        {/* Tabla de resultados */}
        <div 
          className="rounded-2xl overflow-hidden h-full max-h-[320px] flex flex-col"
          style={{ backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div 
            className="px-4 py-2 border-b flex justify-between items-center"
            style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(30,41,59,0.8)' }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-slate-300">Resultados</span>
            </div>
            <span 
              className="px-2 py-1 rounded text-xs font-bold" 
              style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
            >
              {filteredData.length} filas
            </span>
          </div>
          <div className="overflow-y-auto p-2 flex-1">
            <AnimatePresence mode="pop">
              {filteredData.length > 0 ? (
                <div className="grid grid-cols-1 gap-1">
                  {filteredData.map((user, idx) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ 
                        backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' 
                      }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                           style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}>
                        {user.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{user.nombre}</div>
                        <div className="text-xs text-slate-500">{user.clase}</div>
                      </div>
                      <div className={`text-right font-bold ${
                        user.clase === 'Guerrero' ? 'text-cyan-300' : 
                        user.nivel > 20 ? 'text-purple-300' : 'text-slate-400'
                      }`}>
                        nv. {user.nivel}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-slate-500 text-sm"
                >
                 Ningún aventurero cumple la condición
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VennDiagramSQL;