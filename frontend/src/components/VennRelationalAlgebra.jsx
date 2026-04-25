import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitMerge, Filter, MinusCircle, Database, Users, ArrowRight } from 'lucide-react';

const PERSONAJES = [
  { id: 1, nombre: 'Aldo', clase: 'Guerrero', nivel: 30 },
  { id: 2, nombre: 'Zoe', clase: 'Arquera', nivel: 25 },
  { id: 3, nombre: 'Dilman', clase: 'Mago', nivel: 45 },
  { id: 4, nombre: 'Daniel', clase: 'Guerrero', nivel: 15 },
  { id: 5, nombre: 'Loya', clase: 'Picaro', nivel: 20 },
  { id: 6, nombre: 'Gimli', clase: 'Enano', nivel: 50 },
  { id: 7, nombre: 'Merlin', clase: 'Mago', nivel: 80 },
  { id: 8, nombre: 'Robin', clase: 'Arquero', nivel: 12 },
];

const OPERACIONES = [
  { 
    id: 'union', 
    label: 'UNION', 
    sql: '...UNION...',
    desc: 'Une ambos conjuntos, sin duplicados',
    icon: <GitMerge className="w-5 h-5" />,
    color: '#22d3ee',
    filterFn: (A, B) => [...new Set([...A, ...B])],
    setA: PERSONAJES.filter(p => p.clase === 'Guerrero').map(p => p.nombre),
    setB: PERSONAJES.filter(p => p.nivel > 30).map(p => p.nombre),
    setAName: 'Guerreros',
    setBName: 'Nv > 30'
  },
  { 
    id: 'intersect', 
    label: 'INTERSECT', 
    sql: '...INTERSECT...',
    desc: 'Lo que está en AMBOS conjuntos',
    icon: <Filter className="w-5 h-5" />,
    color: '#a855f7',
    filterFn: (A, B) => A.filter(x => B.includes(x)),
    setA: PERSONAJES.filter(p => p.clase === 'Guerrero').map(p => p.nombre),
    setB: PERSONAJES.filter(p => p.nivel > 30).map(p => p.nombre),
    setAName: 'Guerreros',
    setBName: 'Nv > 30'
  },
  { 
    id: 'except', 
    label: 'EXCEPT', 
    sql: '...EXCEPT...',
    desc: 'Está en A pero NO en B',
    icon: <MinusCircle className="w-5 h-5" />,
    color: '#ef4444',
    filterFn: (A, B) => A.filter(x => !B.includes(x)),
    setA: PERSONAJES.filter(p => p.clase === 'Guerrero').map(p => p.nombre),
    setB: PERSONAJES.filter(p => p.nivel > 30).map(p => p.nombre),
    setAName: 'Guerreros',
    setBName: 'Nv > 30'
  }
];

export const VennRelationalAlgebra = ({ operation = 'union', onOperationChange }) => {
  const [activeOp, setActiveOp] = useState(
    OPERACIONES.find(op => op.id === operation) || OPERACIONES[0]
  );
  const [hoveredSet, setHoveredSet] = useState(null);

  const resultado = useMemo(() => {
    return activeOp.filterFn(activeOp.setA, activeOp.setB);
  }, [activeOp]);

  const handleOpClick = (op) => {
    setActiveOp(op);
    onOperationChange?.(op.id);
  };

  const primaryColor = activeOp.color;
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      
      {/* Panel de operaciones */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {OPERACIONES.map((op) => (
          <button
            key={op.id}
            onClick={() => handleOpClick(op)}
            className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-300 ${
              activeOp.id === op.id 
                ? 'scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
                : 'hover:scale-102'
            }`}
            style={{ 
              backgroundColor: activeOp.id === op.id ? `${op.color}22` : 'rgba(30,41,59,0.8)',
              borderColor: activeOp.id === op.id ? op.color : 'rgba(255,255,255,0.1)',
              color: activeOp.id === op.id ? op.color : 'rgba(148,163,184,0.8)'
            }}
          >
            <div className="mb-1">{op.icon}</div>
            <span className="font-bold text-sm">{op.label}</span>
            <span className="text-xs text-slate-500">{op.desc}</span>
          </button>
        ))}
      </div>

      {/* Query SQL */}
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
        <code className="text-emerald-400 font-mono text-sm flex-1">
          SELECT nombre FROM aventureros WHERE clase = 'Guerrero'
        </code>
        <span className="text-cyan-400">{activeOp.label}</span>
        <code className="text-emerald-400 font-mono text-sm flex-1">
          SELECT nombre FROM aventureros WHERE nivel {'>'} 30
        </code>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Diagrama de Venn para Álgebra Relacional */}
        <div 
          className="relative aspect-square max-w-[320px] mx-auto flex items-center justify-center rounded-2xl overflow-hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Fondo */}
          <motion.div 
            animate={{ opacity: hoveredSet ? 0.3 : 1 }} 
            className="absolute inset-0 bg-slate-800/50" 
          />
          <div className="absolute top-2 left-2 text-xs font-bold text-slate-500 tracking-widest uppercase z-20">
            Álgebra Relacional
          </div>

          {/* Conjunto A: Guerreros */}
          <motion.div 
            animate={{ 
              opacity: hoveredSet === 'A' || hoveredSet === 'result' ? 0.85 : 0.5,
              scale: hoveredSet === 'A' ? 1.05 : 1
            }}
            transition={{ duration: 0.3 }}
            className="absolute left-[10%] top-[20%] w-[50%] aspect-square rounded-full flex flex-col items-center justify-center border-2 cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(34,211,238,0.15)', 
              borderColor: '#22d3ee',
              boxShadow: `0 0 25px rgba(34,211,238,${hoveredSet === 'A' ? 0.5 : 0.2})`
            }}
            onMouseEnter={() => setHoveredSet('A')}
            onMouseLeave={() => setHoveredSet(null)}
          >
            <Users className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-white font-bold text-sm">{activeOp.setAName}</span>
            <span className="text-xs text-cyan-300 mt-1">
              [{activeOp.setA.join(', ')}]
            </span>
          </motion.div>

          {/* Conjunto B: Nivel > 30 */}
          <motion.div 
            animate={{ 
              opacity: hoveredSet === 'B' || hoveredSet === 'result' ? 0.85 : 0.5,
              scale: hoveredSet === 'B' ? 1.05 : 1
            }}
            transition={{ duration: 0.3 }}
            className="absolute right-[10%] top-[20%] w-[50%] aspect-square rounded-full flex flex-col items-center justify-center border-2 cursor-pointer"
            style={{ 
              backgroundColor: 'rgba(168,85,247,0.15)', 
              borderColor: '#a855f7',
              boxShadow: `0 0 25px rgba(168,85,247,${hoveredSet === 'B' ? 0.5 : 0.2})`
            }}
            onMouseEnter={() => setHoveredSet('B')}
            onMouseLeave={() => setHoveredSet(null)}
          >
            <Database className="w-5 h-5 text-purple-400 mb-1" />
            <span className="text-white font-bold text-sm">{activeOp.setBName}</span>
            <span className="text-xs text-purple-300 mt-1">
              [{activeOp.setB.join(', ')}]
            </span>
          </motion.div>

          {/* Resultado / Intersección */}
          {activeOp.id !== 'union' ? (
            <motion.div 
              animate={{ 
                opacity: hoveredSet === 'result' ? 0.9 : 0.7,
                scale: hoveredSet === 'result' ? 1.1 : 1
              }}
              transition={{ duration: 0.3 }}
              className="absolute top-[38%] left-[38%] w-[24%] aspect-square rounded-full border-2 border-white/60 flex items-center justify-center"
              style={{ 
                backgroundColor: `${primaryColor}33`,
                borderColor: primaryColor
              }}
              onMouseEnter={() => setHoveredSet('result')}
              onMouseLeave={() => setHoveredSet(null)}
            >
              <span className="text-white font-bold text-xs">{activeOp.label}</span>
            </motion.div>
          ) : (
            <motion.div 
              animate={{ opacity: hoveredSet === 'result' ? 0.9 : 0.5 }}
              className="absolute inset-0 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center"
            >
              <ArrowRight className="w-8 h-8 text-white/30" />
            </motion.div>
          )}
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
              <Users className="w-4 h-4" style={{ color: primaryColor }} />
              <span className="text-sm font-bold text-slate-300">Resultado</span>
            </div>
            <span 
              className="px-2 py-1 rounded text-xs font-bold" 
              style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
            >
              {resultado.length} filas
            </span>
          </div>
          <div className="overflow-y-auto p-2 flex-1">
            <AnimatePresence mode="pop">
              {resultado.length > 0 ? (
                <div className="grid grid-cols-1 gap-1">
                  {resultado.map((nombre, idx) => {
                    const personaje = PERSONAJES.find(p => p.nombre === nombre);
                    return (
                      <motion.div
                        key={nombre}
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
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-200">{nombre}</div>
                          <div className="text-xs text-slate-500">{personaje?.clase} • nv. {personaje?.nivel}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-slate-500 text-sm"
                >
                  Conjunto vacío
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VennRelationalAlgebra;