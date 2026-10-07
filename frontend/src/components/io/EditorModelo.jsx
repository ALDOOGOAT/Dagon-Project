import { useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Boton, Etiqueta } from './ui';
const NOMBRES = {
  objetivo: 'Función objetivo',
  restricciones: 'Restricciones',
  costos: 'Costos unitarios',
  oferta: 'Oferta por origen',
  demanda: 'Demanda por destino',
  matriz: 'Matriz de asignación',
  actividades: 'Actividades del proyecto',
  duracion: 'Duración',
  predecesoras: 'Predecesoras',
  a: 'Tiempo optimista a',
  m: 'Tiempo más probable',
  b: 'Tiempo pesimista b',
  plazo: 'Plazo objetivo',
  D: 'Demanda anual D',
  S: 'Costo por pedido S',
  H: 'Costo de mantener por unidad y año H',
  p: 'Costo por faltante p',
  P: 'Producción anual P',
  i: 'Tasa de mantenimiento i',
  tramos: 'Tramos de descuento',
  min: 'Cantidad mínima',
  precio: 'Precio unitario',
  d: 'Demanda por periodo d',
  L: 'Plazo de entrega L',
  sigma: 'Desviación de demanda σ',
  z: 'Factor de servicio z',
  T: 'Periodo de revisión T',
  inventario: 'Posición de inventario',
  lambda: 'Llegadas por unidad de tiempo λ',
  mu: 'Servicio por servidor μ',
  s: 'Número de servidores s',
  cs: 'Costo por servidor',
  cw: 'Costo por cliente en el sistema',
  inicial: 'Distribución inicial',
  n: 'Número de pasos',
  f: 'Función f',
  g: 'Restricción g',
  c: 'Valor c de la restricción',
  x0: 'Punto inicial x₀',
  id: 'Identificador de actividad',
  enteras: 'Variables enteras',
  binarias: 'Variables binarias (0 o 1)',
  aristas: 'Aristas de la red',
  origen: 'Nodo origen / fuente',
  destino: 'Nodo destino / sumidero',
  valor: 'Distancia, costo o capacidad',
  dirigido: 'Red dirigida (con sentido)',
  pagos: 'Tabla de pagos',
  alternativas: 'Alternativas',
  estados: 'Estados de la naturaleza',
  probabilidades: 'Probabilidad de cada estado',
  alfa: 'Coeficiente de optimismo α',
  filas: 'Estrategias del jugador A',
  columnas: 'Estrategias del jugador B',
  simbolos: 'Variables',
  inicio: 'Punto inicial'
};
const TIPOS = { pl: 'Programación lineal', cuadratica: 'Programación cuadrática', grafos: 'Redes (grafos)', decisiones: 'Teoría de decisiones', juegos: 'Teoría de juegos', transporte: 'Transporte', asignacion: 'Asignación', redes: 'Redes de proyectos', inventarios: 'Inventarios', colas: 'Líneas de espera', markov: 'Cadenas de Markov', noLineal: 'Programación no lineal' };
const METODOS = { simplex: 'Simplex', branch_bound: 'Ramificación y acotamiento', kkt: 'Condiciones KKT', ruta_corta: 'Ruta más corta (Dijkstra)', arbol_minimo: 'Árbol de expansión mínima (Kruskal)', flujo_maximo: 'Flujo máximo', incertidumbre: 'Criterios bajo incertidumbre', riesgo: 'Valor esperado (riesgo)', suma_cero: 'Suma cero de dos personas', multivariable: 'Newton multivariable', vogel: 'Vogel', noroeste: 'Esquina noroeste', costo_minimo: 'Costo mínimo', hungaro: 'Método húngaro', cpm: 'Ruta crítica CPM', pert: 'PERT', eoq: 'Lote económico EOQ', faltantes: 'EOQ con faltantes', epq: 'Lote de producción EPQ', descuentos: 'Descuentos por cantidad', reorden: 'Punto de reorden', periodo_fijo: 'Revisión por periodo fijo', mm1: 'M/M/1', mms: 'M/M/s', discreto: 'Transiciones discretas', dorada: 'Sección dorada', newton: 'Newton', lagrange: 'Multiplicadores de Lagrange' };
const titulo = (k, tipo) => tipo === 'markov' && k === 'P' ? 'Matriz de transición P' : tipo === 'noLineal' && k === 'a' ? 'Límite inferior a' : tipo === 'noLineal' && k === 'b' ? 'Límite superior b' : NOMBRES[k] || k;
const numero = valor => valor.trim() === '' ? '' : Number.isFinite(Number(valor)) ? Number(valor) : valor;
const copiaFila = valor => Array.isArray(valor) ? valor.map(() => 0) : valor && typeof valor === 'object' ? Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, Array.isArray(v) ? [] : typeof v === 'number' ? 0 : ''])) : typeof valor === 'number' ? 0 : '';

// Los datos se editan con entradas y tablas, manteniendo la estructura del modelo.
const Campo = ({
  nombre,
  valor,
  onChange,
  ruta,
  tipoModelo
}) => {
  const numeroOriginal = useRef(typeof valor === 'number');
  if (Array.isArray(valor)) {
    const cambio = (i, v) => onChange(valor.map((a, j) => j === i ? v : a));
    return <fieldset className="io-editor-grupo">
  <legend>
    {titulo(nombre, tipoModelo)}
  </legend>
  {valor.map((v, i) => <div key={i} className="io-editor-fila">
    <div className="min-w-0 flex-1">
      <Campo nombre={String(i + 1)} valor={v} ruta={ruta + '-' + i} tipoModelo={tipoModelo} onChange={a => cambio(i, a)} />
    </div>
    <button type="button" className="io-editor-quitar" aria-label={'Quitar ' + titulo(nombre, tipoModelo) + ' ' + (i + 1)} onClick={() => onChange(valor.filter((_, j) => j !== i))}>
      <Trash2 className="h-4 w-4" />
    </button>
  </div>)}
  <div className="flex flex-wrap gap-2">
    <Boton variante="suave" icono={Plus} onClick={() => onChange([...valor, copiaFila(valor[0] ?? '')])}>Agregar {nombre === 'restricciones' ? 'restricción' : 'fila'}</Boton>
    {valor.length > 0 && valor.every(Array.isArray) && <>
      <Boton variante="suave" onClick={() => onChange(valor.map(f => [...f, 0]))}>Agregar columna</Boton>
      <Boton variante="suave" disabled={!valor[0]?.length} onClick={() => onChange(valor.map(f => f.slice(0, -1)))}>Quitar última columna</Boton>
    </>}
  </div>
</fieldset>;
  }
  if (valor && typeof valor === 'object') return <div className="io-editor-grid">
  {Object.entries(valor).map(([k, v]) => <Campo key={k} nombre={k} valor={v} ruta={ruta + '-' + k} tipoModelo={tipoModelo} onChange={nuevo => onChange({
      ...valor,
      [k]: nuevo
    })} />)}
</div>;
  if (typeof valor === 'boolean') return <label className="io-check min-w-0">
  <input id={ruta} type="checkbox" checked={valor} onChange={e => onChange(e.target.checked)} />
  {titulo(nombre, tipoModelo)}
</label>;
  const tipo = numeroOriginal.current;
  return <div className="min-w-0">
  <Etiqueta htmlFor={ruta}>
    {titulo(nombre, tipoModelo)}
  </Etiqueta>
  <input id={ruta} className="io-input io-mono" inputMode={tipo ? 'decimal' : undefined} value={valor ?? ''} onChange={e => onChange(tipo ? numero(e.target.value) : e.target.value)} />
</div>;
};
export const EditorModelo = ({
  modelo,
  onChange
}) => <div>
  <div className="mb-4 flex flex-wrap items-center gap-2">
    <span className="io-modelo-chip">
      {TIPOS[modelo.tipo] || modelo.tipo}
    </span>
    <span className="io-modelo-chip">
      {METODOS[modelo.metodo] || modelo.metodo}
    </span>
    <span className="text-sm opacity-70">Revisa los datos antes de usar la solución.</span>
  </div>
  <h3 className="io-subtitulo">Variables y significado</h3>
  <div className="io-editor-grid my-3">
    {(modelo.variables || []).map((v, i) => <div key={i} className="rounded-xl border border-slate-400/20 p-3">
      <strong className="io-mono text-amber-300">
        {v.simbolo}
      </strong>
      <p className="mt-1 text-sm">
        {v.nombre}
      </p>
      {v.unidad && <p className="mt-1 text-xs opacity-70">Unidad: {v.unidad}</p>}
    </div>)}
  </div>
  <Campo nombre="datos" valor={modelo.datos} ruta="modelo" tipoModelo={modelo.tipo} onChange={datos => onChange({
    ...modelo,
    datos
  })} />
</div>;
