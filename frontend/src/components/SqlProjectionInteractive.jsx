import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

const AVENTUREROS = [
  { id: 1, nombre: 'Loya', clase: 'Caballero', nivel: 15, arma: 'Espada Larga', oro: 250 },
  { id: 2, nombre: 'Aldo', clase: 'Guerrero', nivel: 30, arma: 'Hacha Doble', oro: 500 },
  { id: 3, nombre: 'Dan', clase: 'Asesino', nivel: 25, arma: 'Dagas Venenosas', oro: 800 },
  { id: 4, nombre: 'Mora', clase: 'Maga', nivel: 40, arma: 'Báculo Estelar', oro: 1200 },
  { id: 5, nombre: 'Fabio', clase: 'Arquero', nivel: 20, arma: 'Arco Élfico', oro: 150 },
];

const COLUMNS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'clase', label: 'Clase' },
  { key: 'nivel', label: 'Nivel' },
  { key: 'arma', label: 'Arma' },
  { key: 'oro', label: 'Oro' },
];

export const SqlProjectionInteractive = () => {
  // Estado para controlar qué columnas están visibles
  const [visibleCols, setVisibleCols] = useState({
    nombre: true,
    clase: true,
    nivel: true,
    arma: true,
    oro: true,
  });

  const toggleColumn = (key) => {
    setVisibleCols((prev) => {
      // Evitar que apaguen todas las columnas (SQL necesita al menos una)
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (activeCount === 1 && prev[key]) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  // Generador dinámico de la consulta SQL
  const dynamicQuery = useMemo(() => {
    const activeKeys = COLUMNS.filter(c => visibleCols[c.key]).map(c => c.key);
    if (activeKeys.length === COLUMNS.length) {
      return "SELECT * FROM aventureros;";
    }
    return `SELECT ${activeKeys.join(', ')} FROM aventureros;`;
  }, [visibleCols]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden font-sans">
      
      {/* Explicación rápida */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg">Los Lentes de Proyección</h3>
          <p className="text-slate-400 text-sm">Apaga las columnas para enfocar tu visión. Observa cómo cambia la consulta.</p>
        </div>
      </div>

      {/* Pantalla de la Consulta SQL */}
      <div className="bg-slate-950 p-4 rounded-2xl mb-6 border border-white/5 shadow-inner flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <code className="text-emerald-400 font-mono text-sm sm:text-base font-bold tracking-wide">
          {dynamicQuery}
        </code>
      </div>

      {/* Panel de Controles (Toggles) */}
      <div className="flex flex-wrap gap-3 mb-8">
        {COLUMNS.map((col) => {
          const isActive = visibleCols[col.key];
          return (
            <button
              key={col.key}
              onClick={() => toggleColumn(col.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border ${
                isActive 
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                  : 'bg-slate-800 border-white/5 text-slate-500 hover:bg-slate-700'
              }`}
            >
              {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {col.label}
            </button>
          );
        })}
      </div>

      {/* Tabla Interactiva */}
      <div className="bg-slate-950/50 rounded-2xl border border-white/10 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-white/10 text-sm uppercase tracking-wider">
                <AnimatePresence>
                  {COLUMNS.map((col) => (
                    visibleCols[col.key] && (
                      <motion.th
                        key={col.key}
                        initial={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }}
                        animate={{ opacity: 1, width: 'auto', paddingLeft: 16, paddingRight: 16 }}
                        exit={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }}
                        transition={{ duration: 0.3 }}
                        className="py-4 font-bold whitespace-nowrap text-cyan-300"
                      >
                        {col.label}
                      </motion.th>
                    )
                  ))}
                </AnimatePresence>
              </tr>
            </thead>
            <tbody>
              {AVENTUREROS.map((user, index) => (
                <tr 
                  key={user.id} 
                  className={`border-b border-white/5 hover:bg-slate-800/50 transition-colors ${index % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'}`}
                >
                  <AnimatePresence>
                    {COLUMNS.map((col) => (
                      visibleCols[col.key] && (
                        <motion.td
                          key={col.key}
                          initial={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }}
                          animate={{ opacity: 1, width: 'auto', paddingLeft: 16, paddingRight: 16 }}
                          exit={{ opacity: 0, width: 0, paddingLeft: 0, paddingRight: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`py-3 whitespace-nowrap ${col.key === 'nombre' ? 'font-bold text-white' : 'text-slate-300 font-mono text-sm'}`}
                        >
                          {user[col.key]}
                        </motion.td>
                      )
                    ))}
                  </AnimatePresence>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SqlProjectionInteractive;
