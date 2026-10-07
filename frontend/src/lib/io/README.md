# Solvers de Investigación de Operaciones

Módulos ES sin React. La API pública se importa desde `index.js`; `util.js` y
`formulas.js` son utilidades internas. Los índices de filas, columnas y pivotes
comienzan en cero. Cada resultado es independiente de las entradas y los pasos
son instantáneas, no referencias a matrices que posteriormente se modifican.

## Convenciones numéricas y de modelado

- Se usan doubles de JavaScript y se limpian valores con valor absoluto menor
  que 1e-9 al devolver resultados. Los límites de sensibilidad sin cota usan
  `Infinity` o `-Infinity`; si se serializan como JSON, deben codificarse aparte.
- El parser asume no negatividad de todas las variables, como en la forma
  estándar del curso. Acepta declaraciones explícitas de no negatividad.
  En un modelo construido directamente, las variables ausentes de
  `noNegativas` son libres y el simplex las desdobla.
- Las constantes de las restricciones pasan al lado derecho. El contrato de
  PL no tiene campo para una constante del objetivo: se rechazan objetivos
  con constante distinta de cero para evitar devolver un Z incorrecto.
- Big-M se compara simbólicamente por pares (coeficiente de M, valor real).
  Las tablas muestran una M representativa de `1e6 * max(1, |c_i|)`;
  **esa cifra se usa solo para visualizar**. Las decisiones de pivoteo no
  dependen de esa M. Se aplica Bland para entrada y desempate de salida.
- La sensibilidad describe variaciones de un coeficiente a la vez conservando
  la base óptima. Para modelos sin óptimo se devuelven límites `null` y duales
  vacíos. La multiplicidad distingue cambios de base degenerados de cambios
  reales de las variables de decisión.
- Las holguras se llaman `s_1`, etc.; para restricciones >= se usan `e_1`, etc.
  Para igualdad, `s_i` representa el residuo (cero en una solución factible).
- El gráfico conserva intersecciones factibles e infactibles en `vertices`;
  `region` es la región factible recortada al cuadro de visualización, en CCW
  cuando tiene área. Una igualdad puede dejar solo un segmento o punto.
- Transporte se balancea con costos ficticios cero. Una básica degenerada
  representa epsilon simbólico y muestra asignación cero: nunca se agrega
  una cantidad ficticia a la oferta o la demanda. Cada iteración MODI muestra
  la solución **antes** de ejecutar su ciclo; la última tiene `entra: null`.
- Húngaro incluye tareas ficticias en sus matrices didácticas y las excluye
  de la asignación final. En maximización convierte costos con `max - costo`.
- PERT usa la aproximación normal de la ruta crítica. En empates de duración,
  elige la ruta de mayor varianza. No equivale a la distribución conjunta de
  todas las rutas. Sin plazo, `plazo`, `z` y `probabilidad` son `null`.
- D, P, S y H en inventarios usan un año como unidad de tiempo. En faltantes,
  p es costo anual por unidad pendiente. `curva.mantener` agrupa mantenimiento
  y faltantes; los costos separados están en `costoMantener` y `costoFaltantes`.
  Descuentos aplica precio a todas las unidades, no descuentos incrementales.
  En reorden y período fijo, sigma es desviación de demanda por unidad de
  tiempo y se supone independencia; `inventario` es posición de inventario.
- `costoColas` devuelve un número: `s*cs + L*cw`, usando clientes en el sistema.
  Las tasas lambda y mu comparten unidad de tiempo; W y Wq usan esa unidad.
- Markov normaliza el redondeo permitido (1e-6). Si la estacionaria no es
  única, entrega una distribución e informa la elección en sus pasos.
- Sección dorada requiere una función unimodal en el intervalo. Newton busca
  un punto estacionario, no necesariamente un óptimo global. Si la segunda derivada es cero, examina derivadas
  superiores hasta orden 12; `inflexion` indica un primer orden no nulo impar
  o una clasificación indeterminada después de ese límite. Lagrange usa `grad(f) = lambda*grad(g)` y devuelve
  un punto estacionario regular; no garantiza optimalidad global. El contrato
  de Lagrange no incluye pasos. El muestreo devuelve n puntos con extremos.

## Pruebas

```sh
CI=true yarn test --watchAll=false --testPathPattern=src/lib/io
```

Desde `frontend/`. No es necesario cambiar la configuración de CRA/CRACO para
importar `mathjs` con `create` y `all` en este entorno.
