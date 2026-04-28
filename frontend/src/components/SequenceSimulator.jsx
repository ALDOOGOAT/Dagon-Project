import React, { useState, useEffect, useRef } from 'react';

const SequenceSimulator = () => {
  const [globalCounter, setGlobalCounter] = useState(0);
  const [sessionValue, setSessionValue] = useState(null);
  const [logs, setLogs] = useState([
    { type: 'info', text: '🐲 Simulador iniciado. Base de datos conectada.' }
  ]);
  
  const consoleEndRef = useRef(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (type, text) => {
    setLogs(prev => [...prev, { type, text }]);
  };

  const handleNextval = () => {
    const nextValue = globalCounter + 1;
    setGlobalCounter(nextValue);
    setSessionValue(nextValue);
    addLog('success', `✓ nextval() => ${nextValue}`);
  };

  const handleCurrval = () => {
    if (sessionValue === null) {
      addLog('error', `✗ ERROR: currval no definido en esta sesión`);
    } else {
      addLog('success', `✓ currval() => ${sessionValue}`);
    }
  };

  const handleNewSession = () => {
    setSessionValue(null);
    addLog('warning', '🔌 Nueva sesión iniciada (valor local se reinicia)');
  };

  return (
    <div className="flex flex-col gap-4 p-5 bg-slate-900 border border-cyan-500/30 rounded-xl shadow-lg font-sans">
      <div className="text-center">
        <h3 className="text-lg font-bold text-cyan-400 mb-1">🐲 Simulador de Secuencias</h3>
        <p className="text-xs text-slate-400">Understand why currval needs nextval first</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-800 border-t-4 border-purple-500 rounded-lg text-center">
          <span className="text-xs uppercase text-purple-400 font-bold">DB Global</span>
          <div className="text-4xl font-black text-white mt-1">{globalCounter}</div>
        </div>
        <div className="p-3 bg-slate-800 border-t-4 border-cyan-500 rounded-lg text-center">
          <span className="text-xs uppercase text-cyan-400 font-bold">Sesión Local</span>
          <div className="text-4xl font-black mt-1" style={{ color: sessionValue ? 'white' : '#475569' }}>
            {sessionValue ?? '?'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={handleNextval} className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono rounded">
          nextval()
        </button>
        <button onClick={handleCurrval} className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono rounded">
          currval()
        </button>
        <button onClick={handleNewSession} className="py-2 px-3 bg-rose-900 hover:bg-rose-800 text-rose-200 text-xs font-mono rounded border border-rose-700">
          Nueva Sesión
        </button>
      </div>

      <div className="bg-black p-3 rounded-lg h-32 overflow-y-auto font-mono text-[10px]">
        {logs.map((log, i) => (
          <div key={i} className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-400' : 'text-slate-400'}>
            {log.text}
          </div>
        ))}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
};

export default SequenceSimulator;