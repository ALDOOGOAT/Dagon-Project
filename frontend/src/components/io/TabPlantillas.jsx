import { useState } from 'react';
import { Boxes, Play, RotateCcw } from 'lucide-react';
import { resolverModeloInterpretado } from '../../lib/io/desdeEnunciado';
import { Boton, ErrorIO, Panel, useResolver } from './ui';
import { EditorModelo } from './EditorModelo';
import { ResultadoModelo } from './ResultadoModelo';

const aristas = (lista) => lista.map(([origen, destino, valor]) => ({ origen, destino, valor }));
const SEERVADA = aristas([['O', 'A', 2], ['O', 'B', 5], ['O', 'C', 4], ['A', 'B', 2], ['A', 'D', 7], ['B', 'C', 1], ['B', 'D', 4], ['B', 'E', 3], ['C', 'E', 4], ['D', 'E', 1], ['D', 'T', 5], ['E', 'T', 7]]);

// Modelos de ejemplo editables. Cada uno se resuelve con el mismo contrato que "Desde un enunciado".
export const PLANTILLAS = [
  {
    clave: 'entera', titulo: 'Programación entera', descripcion: 'Producción en unidades completas: la relajación (2.25, 3.75) no se redondea.',
    modelo: { tipo: 'pl', metodo: 'branch_bound', variables: [{ simbolo: 'x1', nombre: 'Lotes del producto 1' }, { simbolo: 'x2', nombre: 'Lotes del producto 2' }], datos: { objetivo: 'max z = 5x1 + 8x2', restricciones: ['x1 + x2 <= 6', '5x1 + 9x2 <= 45', 'x1, x2 >= 0'], enteras: ['x1', 'x2'] } },
  },
  {
    clave: 'binaria', titulo: 'Programación binaria', descripcion: 'Selección de proyectos (mochila 0-1) con presupuesto de 14.',
    modelo: { tipo: 'pl', metodo: 'branch_bound', variables: [1, 2, 3, 4].map((i) => ({ simbolo: `y${i}`, nombre: `Elegir el proyecto ${i}` })), datos: { objetivo: 'max z = 8y1 + 11y2 + 6y3 + 4y4', restricciones: ['5y1 + 7y2 + 4y3 + 3y4 <= 14'], binarias: ['y1', 'y2', 'y3', 'y4'] } },
  },
  {
    clave: 'cuadratica', titulo: 'Programación cuadrática', descripcion: 'Objetivo cuadrático con restricciones lineales (condiciones KKT).',
    modelo: { tipo: 'cuadratica', metodo: 'kkt', variables: [{ simbolo: 'x1', nombre: 'Producto 1' }, { simbolo: 'x2', nombre: 'Producto 2' }], datos: { objetivo: 'max z = 15x1 + 30x2 + 4x1*x2 - 2x1^2 - 4x2^2', restricciones: ['x1 + 2x2 <= 30', 'x1, x2 >= 0'] } },
  },
  {
    clave: 'multivariable', titulo: 'No lineal multivariable', descripcion: 'Óptimo sin restricciones con Newton y clasificación por el Hessiano.',
    modelo: { tipo: 'noLineal', metodo: 'multivariable', variables: [], datos: { f: 'x^2 + x*y + y^2 - 6*x - 9*y', simbolos: ['x', 'y'], inicio: [0, 0], objetivo: 'min' } },
  },
  {
    clave: 'ruta', titulo: 'Ruta más corta', descripcion: 'Red de Seervada Park: de la entrada O a la estación T.',
    modelo: { tipo: 'grafos', metodo: 'ruta_corta', variables: [], datos: { aristas: SEERVADA, origen: 'O', destino: 'T', dirigido: false } },
  },
  {
    clave: 'arbol', titulo: 'Árbol de expansión mínima', descripcion: 'Conectar todas las estaciones con la menor longitud de cable.',
    modelo: { tipo: 'grafos', metodo: 'arbol_minimo', variables: [], datos: { aristas: SEERVADA } },
  },
  {
    clave: 'flujo', titulo: 'Flujo máximo', descripcion: 'Capacidad de viajes por camino; muestra el corte mínimo.',
    modelo: { tipo: 'grafos', metodo: 'flujo_maximo', variables: [], datos: { aristas: aristas([['O', 'A', 5], ['O', 'B', 7], ['O', 'C', 4], ['A', 'B', 1], ['A', 'D', 3], ['B', 'C', 2], ['B', 'D', 4], ['B', 'E', 5], ['C', 'E', 4], ['D', 'T', 9], ['E', 'D', 1], ['E', 'T', 6]]), origen: 'O', destino: 'T', dirigido: true } },
  },
  {
    clave: 'incertidumbre', titulo: 'Decisión bajo incertidumbre', descripcion: 'Maximax, maximin, Laplace, Hurwicz y Savage sobre una tabla de pagos.',
    modelo: { tipo: 'decisiones', metodo: 'incertidumbre', variables: [], datos: { pagos: [[50, 20, -10], [30, 25, 15], [10, 10, 10]], objetivo: 'max', alternativas: ['Ampliar', 'Mantener', 'Vender'], estados: ['Demanda alta', 'Media', 'Baja'], alfa: 0.6 } },
  },
  {
    clave: 'riesgo', titulo: 'Decisión bajo riesgo', descripcion: 'Valor esperado y valor de la información perfecta (VEIP).',
    modelo: { tipo: 'decisiones', metodo: 'riesgo', variables: [], datos: { pagos: [[50, 20, -10], [30, 25, 15], [10, 10, 10]], objetivo: 'max', alternativas: ['Ampliar', 'Mantener', 'Vender'], estados: ['Demanda alta', 'Media', 'Baja'], probabilidades: [0.3, 0.5, 0.2] } },
  },
  {
    clave: 'juegos', titulo: 'Juego de suma cero', descripcion: 'Punto silla o estrategias mixtas por programación lineal.',
    modelo: { tipo: 'juegos', metodo: 'suma_cero', variables: [], datos: { pagos: [[2, -3], [-1, 4]], filas: ['Precio bajo', 'Precio alto'], columnas: ['Publicidad', 'Descuento'] } },
  },
];

const copiar = (x) => JSON.parse(JSON.stringify(x));

export const TabPlantillas = () => {
  const [clave, setClave] = useState(PLANTILLAS[0].clave);
  const plantilla = PLANTILLAS.find((p) => p.clave === clave);
  const [modelo, setModelo] = useState(() => copiar(plantilla.modelo));
  const { resultado, error, correr, limpiar } = useResolver();

  const elegir = (p) => { setClave(p.clave); setModelo(copiar(p.modelo)); limpiar(); };
  const editar = (m) => { setModelo(m); limpiar(); };

  return (
    <div className="space-y-4">
      <Panel titulo="Elige un tipo de modelo" icono={Boxes}>
        <div className="io-plantillas" role="radiogroup" aria-label="Plantillas de modelos">
          {PLANTILLAS.map((p) => (
            <button key={p.clave} type="button" role="radio" aria-checked={p.clave === clave} className={`io-plantilla ${p.clave === clave ? 'is-activo' : ''}`} onClick={() => elegir(p)}>
              <strong>{p.titulo}</strong>
              <span>{p.descripcion}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel
        titulo={`Datos: ${plantilla.titulo}`}
        accion={<Boton variante="suave" icono={RotateCcw} onClick={() => elegir(plantilla)}>Restaurar ejemplo</Boton>}
      >
        <EditorModelo modelo={modelo} onChange={editar} />
        <div className="mt-4">
          <Boton icono={Play} onClick={() => correr(() => resolverModeloInterpretado(modelo))}>Resolver</Boton>
        </div>
      </Panel>
      <ErrorIO mensaje={error} />
      {resultado && <ResultadoModelo solucion={resultado} />}
    </div>
  );
};

export default TabPlantillas;
