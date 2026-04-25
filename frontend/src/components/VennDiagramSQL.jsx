import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Database, Filter, GitMerge, Shield, XCircle, Merge, List, Zap } from 'lucide-react';

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
    sql: 'SELECT * FROM usuarios;',
    icon: <Database className="w-4 h-4" />,
    filterFn: () => true,
    activeAreas: ['left', 'right', 'center', 'outside']
  },
  { 
    id: 'a', 
    label: 'WHERE clase', 
    sql: "SELECT * FROM usuarios WHERE clase = 'Guerrero';",
    icon: <Filter className="w-4 h-4" />,
    filterFn: (u) => u.clase === 'Guerrero',
    activeAreas: ['left', 'center']
  },
  { 
    id: 'intersect', 
    label: 'AND', 
    sql: "SELECT * FROM usuarios WHERE clase = 'Guerrero' AND nivel > 20;",
    icon: <Merge className="w-4 h-4" />,
    filterFn: (u) => u.clase === 'Guerrero' && u.nivel > 20,
    activeAreas: ['center']
  },
  { 
    id: 'union', 
    label: 'OR', 
    sql: "SELECT * FROM usuarios WHERE clase = 'Guerrero' OR nivel > 20;",
    icon: <GitMerge className="w-4 h-4" />,
    filterFn: (u) => u.clase === 'Guerrero' || u.nivel > 20,
    activeAreas: ['left', 'right', 'center']
  },
  { 
    id: 'difference', 
    label: '!=', 
    sql: "SELECT * FROM usuarios WHERE clase != 'Guerrero';",
    icon: <XCircle className="w-4 h-4" />,
    filterFn: (u) => u.clase !== 'Guerrero',
    activeAreas: ['right', 'outside']
  }
];

export const VennDiagramSQL = ({ operation = 'universe' }) => {
  const [activeOp, setActiveOp] = useState(
    OPERATIONS.find(op => op.id === operation) || OPERATIONS[0]
  );

  const primaryColor = '#22d3ee';
  const secondaryColor = '#a855f7';

  return (
    <div className="w-full max-w-4xl mx-auto p-6 rounded-3xl backdrop-blur-md border"
         style={{ 
           backgroundColor: 'rgba(15, 23, 42, 0.8)', 
           borderColor: `${primaryColor}33` 
         }}>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {OPERATIONS.map((op) => (
          <button
            key={op.id}
            onClick={() => setActiveOp(op)}
            className={`flex flex-col items-center p-2 rounded-xl border transition-all duration-300 text-xs font-bold uppercase tracking-wider ${
              activeOp.id === op.id 
                ? 'bg-opacity-20 border-opacity-100 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                : 'bg-slate-800 border-white/5 text-slate-400'
            }`}
            style={{ 
              backgroundColor: activeOp.id === op.id ? `${primaryColor}33` : undefined,
              borderColor: activeOp.id === op.id ? primaryColor : undefined,
              color: activeOp.id === op.id ? primaryColor : undefined
            }}
          >
            {op.icon} {op.label}
          </button>
        ))}
      </div>

      <div className="p-3 rounded-xl mb-6 flex items-center gap-3" style={{ 
        backgroundColor: 'rgba(0,0,0,0.3)', 
        border: '1px solid rgba(255,255,255,0.05)' 
      }}>
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        <code className="text-emerald-400 font-mono text-sm">
          {activeOp.sql}
        </code>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-center">
        <div className="relative aspect-square max-w-[350px] mx-auto flex items-center justify-center rounded-2xl overflow-hidden"
             style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
          
          <motion.div animate={{ opacity: isAreaActive('outside') ? 1 : 0.15 }} 
                      className="absolute inset-0 bg-slate-800/50" />
          <div className="absolute top-2 left-2 text-xs font-bold text-slate-500 tracking-widest uppercase z-20">Universo</div>

          <motion.div 
            animate={{ 
              opacity: isAreaActive('left') || isAreaActive('center') ? 0.85 : 0.15,
              scale: isAreaActive('left') ? 1.02 : 1
            }}
            transition={{ duration: 0.4 }}
            className="absolute left-[8%] w-[58%] aspect-square rounded-full flex items-center justify-start pl-6 border-2"
            style={{ 
              backgroundColor: `${primaryColor}66`, 
              borderColor: primaryColor 
            }}
          >
            <span className="text-white font-black text-sm drop-shadow-md z-10">GUERREROS</span>
          </motion.div>

          <motion.div 
            animate={{ 
              opacity: isAreaActive('right') || isAreaActive('center') ? 0.85 : 0.15,
              scale: isAreaActive('right') ? 1.02 : 1
            }}
            transition={{ duration: 0.4 }}
            className="absolute right-[8%] w-[58%] aspect-square rounded-full flex items-center justify-end pr-6 border-2"
            style={{ 
              backgroundColor: `${secondaryColor}66`, 
              borderColor: secondaryColor 
            }}
          >
            <span className="text-white font-black text-sm drop-shadow-md z-10 text-right">NIVEL {'>'}20</span>
          </motion.div>
        </div>

        <div className="rounded-2xl overflow-hidden h-full max-h-[320px] flex flex-col"
             style={{ backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="px-4 py-2 border-b flex justify-between items-center"
               style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(30,41,59,0.8)' }}>
            <span className="text-sm font-bold text-slate-300">Resultados</span>
            <span className="px-2 py-1 rounded text-xs font-bold" 
                  style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}>
              {filteredData.length} filas
            </span>
          </div>
          <div className="overflow-y-auto p-3 flex-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <th className="pb-2 font-medium text-left">Nombre</th>
                  <th className="pb-2 font-medium text-left">Clase</th>
                  <th className="pb-2 font-medium text-right">Nivel</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-b last:border-0"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <td className="py-2 font-medium text-slate-200">{user.nombre}</td>
                    <td className={`py-2 ${user.clase === 'Guerrero' ? 'font-bold' : 'text-slate-400'}`}
                        style={{ color: user.clase === 'Guerrero' ? primaryColor : undefined }}>
                      {user.clase}
                    </td>
                    <td className={`py-2 text-right ${user.nivel > 20 ? 'font-bold' : 'text-slate-400'}`}
                        style={{ color: user.nivel > 20 ? secondaryColor : undefined }}>
                      {user.nivel}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">Conjunto vacío</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};