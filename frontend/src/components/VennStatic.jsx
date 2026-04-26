import React from 'react';
import { motion } from 'framer-motion';
import { User, Globe, Filter, Zap, GitMerge, ShieldOff, CheckCircle2, XCircle } from 'lucide-react';

/* ─── TABLA DE AVENTUREROS (fuente de verdad) ─── */
const AVENTUREROS = [
  { id: 1, name: 'Loya',  clase: 'Guerrero', nivel: 5,  activo: true },
  { id: 2, name: 'Aldo',  clase: 'Guerrero', nivel: 15, activo: true },
  { id: 3, name: 'Mora',  clase: 'Maga',     nivel: 20, activo: false },
  { id: 4, name: 'Fabio', clase: 'Arquero',   nivel: 8,  activo: true },
  { id: 5, name: 'Zaca',  clase: 'Paladín',   nivel: 30, activo: true },
  { id: 6, name: 'Dan',   clase: 'Asesino',   nivel: 12, activo: false },
  { id: 7, name: 'Dagon', clase: 'Boss',      nivel: 99, activo: true },
];

const COLORS = {
  cyan: '#22d3ee', purple: '#a855f7', red: '#ef4444',
  blue: '#3b82f6', green: '#22c55e',
};

/* ─── CONDICIONES REALES POR OPERACIÓN ─── */
const CONDITIONS = {
  universe: {
    test: () => true,
    sql: 'SELECT * FROM aventureros;',
    icon: Globe,
    label: 'UNIVERSO',
    symbol: 'U',
  },
  subset: {
    testA: (a) => a.clase === 'Guerrero',
    test: (a) => a.clase === 'Guerrero',
    sql: "SELECT * FROM aventureros\nWHERE clase = 'Guerrero';",
    labelA: 'Guerreros',
    icon: Filter,
    label: 'SUBCONJUNTO',
    symbol: 'A ⊂ U',
  },
  intersect: {
    testA: (a) => a.clase === 'Guerrero',
    testB: (a) => a.nivel > 10,
    test:  (a) => a.clase === 'Guerrero' && a.nivel > 10,
    sql: "SELECT * FROM aventureros\nWHERE clase = 'Guerrero'\n  AND nivel > 10;",
    labelA: 'Guerreros',
    labelB: 'Nivel > 10',
    icon: Zap,
    label: 'INTERSECCIÓN',
    symbol: 'A ∩ B',
  },
  union: {
    testA: (a) => a.clase === 'Maga',
    testB: (a) => a.clase === 'Arquero',
    test:  (a) => a.clase === 'Maga' || a.clase === 'Arquero',
    sql: "SELECT * FROM aventureros\nWHERE clase = 'Maga'\n   OR clase = 'Arquero';",
    labelA: 'Magas',
    labelB: 'Arqueros',
    icon: GitMerge,
    label: 'UNIÓN',
    symbol: 'A ∪ B',
  },
  difference: {
    testA: () => true,
    testB: (a) => !a.activo,
    test:  (a) => a.activo,
    sql: "SELECT * FROM aventureros\nWHERE activo = true;",
    labelA: 'Todos',
    labelB: 'Inactivos',
    icon: ShieldOff,
    label: 'DIFERENCIA',
    symbol: 'A \\ B',
  },
};

/* Clasifica un aventurero en zona del diagrama de dos círculos */
const getZone = (av, cond) => {
  if (!cond.testA) return 'outside';
  const inA = cond.testA(av);
  const inB = cond.testB ? cond.testB(av) : false;
  if (inA && inB) return 'center';
  if (inA) return 'A';
  if (inB) return 'B';
  return 'outside';
};

/* ─── PUNTO: Círculo blanco con nombre ─── */
const SvgPoint = ({ x, y, name, highlighted, r = 13 }) => {
  const fill = highlighted ? 'white' : 'rgba(255,255,255,0.08)';
  const stroke = highlighted ? 'white' : 'rgba(255,255,255,0.15)';
  const textFill = highlighted ? '#0f172a' : 'rgba(255,255,255,0.25)';
  const glow = highlighted ? '0 0 10px rgba(255,255,255,0.5)' : 'none';

  return (
    <g style={{ filter: highlighted ? `drop-shadow(${glow})` : 'none' }}>
      <circle cx={x} cy={y} r={r}
        fill={fill} stroke={stroke} strokeWidth={highlighted ? '1.5' : '0.8'} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
        fill={textFill} fontSize="7.5" fontWeight="800" fontFamily="sans-serif"
        style={{ letterSpacing: '0.02em' }}>
        {name}
      </text>
    </g>
  );
};

/* ─── TARJETA RESULTADO (verde/rojo) ─── */
const ResultRow = ({ av, passes, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.25 }}
    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
      passes
        ? 'bg-emerald-500/[0.07] border-emerald-500/20'
        : 'bg-red-500/[0.05] border-red-500/15'
    }`}
  >
    {passes
      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      : <XCircle className="w-4 h-4 text-red-400/60 shrink-0" />
    }
    <div className="flex flex-col min-w-0">
      <span className={`text-xs font-bold tracking-tight ${passes ? 'text-white' : 'text-slate-500 line-through'}`}>
        {av.name}
      </span>
      <span className={`text-[10px] font-mono ${passes ? 'text-slate-400' : 'text-slate-600'}`}>
        {av.clase} · Lv{av.nivel}
      </span>
    </div>
  </motion.div>
);

/* ─── SVG: UNIVERSO ─── */
const SvgUniverse = ({ c1 }) => {
  const W = 340, H = 220;
  const positions = [
    { x: 65,  y: 70  }, { x: 150, y: 58  }, { x: 240, y: 72  },
    { x: 100, y: 130 }, { x: 195, y: 140 }, { x: 275, y: 128 },
    { x: 160, y: 185 },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <rect x="14" y="14" width={W - 28} height={H - 28} rx="14"
        fill={`${c1}08`} stroke={c1} strokeWidth="1.2" strokeDasharray="6 4" strokeOpacity="0.45" />
      <text x="28" y="34" fill={c1} fontSize="9" fontWeight="800" fontFamily="monospace" opacity="0.5">
        U = AVENTUREROS
      </text>
      {AVENTUREROS.map((av, i) => (
        <SvgPoint key={av.id} x={positions[i].x} y={positions[i].y}
          name={av.name} highlighted={true} />
      ))}
    </svg>
  );
};

/* ─── SVG: SUBCONJUNTO ─── */
const SvgSubset = ({ c1, cond }) => {
  const W = 340, H = 220;
  const cx = W / 2, cy = H / 2 + 10, R = 72;
  const inside = AVENTUREROS.filter(a => cond.test(a));
  const outside = AVENTUREROS.filter(a => !cond.test(a));

  // Distribuir dentro del círculo (con margen seguro del borde)
  const POINT_R = 13;
  const safeR = R - POINT_R - 6; // margen de 6px extra del borde
  const insidePos = inside.map((_, i) => {
    const angle = (i / inside.length) * Math.PI * 2 - Math.PI / 2;
    const pr = Math.min(inside.length <= 2 ? 28 : 36, safeR);
    return { x: cx + Math.cos(angle) * pr, y: cy + Math.sin(angle) * pr + 4 };
  });

  // Distribuir fuera en las esquinas
  const outsideSlots = [
    { x: 42, y: 42 }, { x: W - 42, y: 42 },
    { x: 42, y: H - 36 }, { x: W - 42, y: H - 36 },
    { x: W / 2, y: H - 30 },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {/* Universo */}
      <rect x="10" y="10" width={W - 20} height={H - 20} rx="12"
        fill="none" stroke="white" strokeWidth="0.7" strokeDasharray="5 4" strokeOpacity="0.1" />
      <text x="22" y="28" fill="white" fontSize="8" fontWeight="700" fontFamily="monospace" opacity="0.2">U</text>

      {/* Círculo subconjunto */}
      <circle cx={cx} cy={cy} r={R} fill={`${c1}0a`} stroke={c1} strokeWidth="1.2" />
      {/* Label arriba del círculo */}
      <text x={cx} y={cy - R - 10} textAnchor="middle"
        fill={c1} fontSize="10" fontWeight="800" fontFamily="monospace">
        {cond.labelA || 'Subconjunto'}
      </text>

      {inside.map((av, i) => (
        <SvgPoint key={av.id} x={insidePos[i].x} y={insidePos[i].y}
          name={av.name} highlighted={true} />
      ))}
      {outside.map((av, i) => (
        <SvgPoint key={av.id}
          x={outsideSlots[i % outsideSlots.length].x}
          y={outsideSlots[i % outsideSlots.length].y}
          name={av.name} highlighted={false} r={11} />
      ))}
    </svg>
  );
};

/* ─── SVG: DOS CÍRCULOS (intersect, union, difference) ─── */
const SvgTwoSets = ({ operation, c1, c2, cond, s1Label, s2Label }) => {
  const W = 360, H = 240;
  const R = 75;
  const cx1 = W / 2 - 48, cx2 = W / 2 + 48, cy = H / 2 + 8;

  const classified = AVENTUREROS.map(av => ({ ...av, zone: getZone(av, cond) }));
  const zones = { A: [], B: [], center: [], outside: [] };
  classified.forEach(av => zones[av.zone].push(av));

  const fillA = operation === 'difference' ? `${c1}12` : `${c1}0a`;
  const fillB = `${c2}08`;
  const strokeBColor = (operation === 'intersect' || operation === 'difference') ? `${c2}55` : c2;

  /* Posiciones por zona — cada punto se valida contra el borde del círculo */
  const POINT_R = 13;
  const margin = POINT_R + 4; // el punto nunca toca el borde

  const clampToCircle = (px, py, ccx, ccy, circleR) => {
    const dx = px - ccx, dy = py - ccy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = circleR - margin;
    if (dist <= maxDist) return { x: px, y: py };
    const scale = maxDist / dist;
    return { x: ccx + dx * scale, y: ccy + dy * scale };
  };

  const getPositions = (zone, items) => {
    return items.map((_, i) => {
      const total = items.length;
      const spacing = 30;
      const startY = cy - ((total - 1) * spacing) / 2;
      switch (zone) {
        case 'A': return clampToCircle(cx1 - 22, startY + i * spacing, cx1, cy, R);
        case 'B': return clampToCircle(cx2 + 22, startY + i * spacing, cx2, cy, R);
        case 'center': {
          return clampToCircle(W / 2, startY + i * spacing, W / 2, cy, R * 0.6);
        }
        default: {
          const slots = [
            { x: 28, y: 22 }, { x: W - 28, y: 22 },
            { x: 28, y: H - 18 }, { x: W - 28, y: H - 18 },
          ];
          return slots[i % slots.length];
        }
      }
    });
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <defs>
        <clipPath id="cA"><circle cx={cx1} cy={cy} r={R} /></clipPath>
      </defs>

      {/* Círculos */}
      <circle cx={cx1} cy={cy} r={R} fill={fillA} stroke={c1} strokeWidth="1.2" />
      <circle cx={cx2} cy={cy} r={R} fill={fillB} stroke={strokeBColor} strokeWidth="1.2" />

      {/* Zona intersección sutil */}
      {operation === 'intersect' && (
        <circle cx={cx2} cy={cy} r={R} fill={`${c1}15`} clipPath="url(#cA)" />
      )}
      {operation === 'union' && (
        <circle cx={cx2} cy={cy} r={R} fill="rgba(255,255,255,0.03)" clipPath="url(#cA)" />
      )}

      {/* Labels ARRIBA de cada círculo, sin chocar */}
      <text x={cx1} y={cy - R - 12} textAnchor="middle"
        fill={c1} fontSize="10" fontWeight="800" fontFamily="monospace">
        {s1Label}
      </text>
      <text x={cx2} y={cy - R - 12} textAnchor="middle"
        fill={c2} fontSize="10" fontWeight="800" fontFamily="monospace">
        {s2Label}
      </text>

      {/* Renderizar puntos por zona */}
      {['A', 'center', 'B', 'outside'].map(zone => {
        const items = zones[zone];
        const positions = getPositions(zone, items);
        return items.map((av, i) => (
          <SvgPoint key={av.id}
            x={positions[i].x} y={positions[i].y}
            name={av.name}
            highlighted={cond.test(av)}
            r={zone === 'outside' ? 11 : 13}
          />
        ));
      })}
    </svg>
  );
};

/* ─── BLOQUE SQL + RESULTADOS ─── */
const SqlPanel = ({ operation, cond }) => {
  const Icon = cond.icon;
  const passing = AVENTUREROS.filter(a => cond.test(a));
  const failing = AVENTUREROS.filter(a => !cond.test(a));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">{cond.label}</span>
          <span className="text-xs font-mono font-bold text-white">{cond.symbol}</span>
        </div>
      </div>

      {/* Query SQL */}
      <div className="bg-slate-950 rounded-xl border border-white/5 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/5 bg-slate-900/50">
          <span className="w-2 h-2 rounded-full bg-rose-500/60" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
          <span className="ml-2 text-[8px] font-mono text-slate-500">query.sql</span>
        </div>
        <pre className="px-3 py-3 text-[11px] font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
          {cond.sql}
        </pre>
      </div>

      {/* Resultados */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
            Cumplen ({passing.length})
          </span>
          <div className="flex-1 h-px bg-emerald-500/20" />
        </div>
        <div className="flex flex-col gap-1 mb-3">
          {passing.map((av, i) => (
            <ResultRow key={av.id} av={av} passes={true} delay={i * 0.05} />
          ))}
        </div>

        {failing.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-400/70">
                No cumplen ({failing.length})
              </span>
              <div className="flex-1 h-px bg-red-500/15" />
            </div>
            <div className="flex flex-col gap-1">
              {failing.map((av, i) => (
                <ResultRow key={av.id} av={av} passes={false} delay={0.2 + i * 0.04} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── COMPONENTE PRINCIPAL ─── */
const VennStatic = ({ operation = 'universe', sets = [], headline, lead }) => {
  const s1 = sets[0] || { label: 'Criterio A', color: 'cyan' };
  const s2 = sets[1] || { label: 'Criterio B', color: 'purple' };
  const c1 = COLORS[s1.color] || COLORS.cyan;
  const c2 = COLORS[s2.color] || COLORS.purple;
  const cond = CONDITIONS[operation] || CONDITIONS.universe;

  const renderDiagram = () => {
    switch (operation) {
      case 'universe':
        return <SvgUniverse c1={c1} />;
      case 'subset':
        return <SvgSubset c1={c1} cond={cond} />;
      default:
        return <SvgTwoSets operation={operation} c1={c1} c2={c2} cond={cond} s1Label={s1.label} s2Label={s2.label} />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-5 sm:p-7 bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Grid: diagrama + SQL */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-slate-950/30 rounded-2xl border border-white/5 p-3 flex items-center justify-center min-h-[240px]">
          {renderDiagram()}
        </div>
        <div className="lg:col-span-2">
          <SqlPanel operation={operation} cond={cond} />
        </div>
      </div>
    </div>
  );
};

export default VennStatic;
