# Contrato enunciado → modelo → solución

## API

`POST /api/io/interpretar`, JWT, body `{enunciado:string}` (20–12000 caracteres).
Respuesta: `{estado:'listo'|'incompleto'|'no_soportado', fuente:'local'|'gemini'|'groq'|'ollama', resumen:string, modelo:object|null, preguntas:string[], advertencias:string[], supuestos:string[]}`.
No se permiten respuestas/soluciones numéricas generadas por IA: solo modelado. Solución matemática determinista en frontend (`lib/io`) y en servidor (`service/io/solver`, ver abajo). No enviar secretos, SQL ni ejecutar código del proveedor. Los modelos incompletos no se ejecutan; no inventar coeficientes faltantes. No requiere migraciones BD ni cambios al validador de misiones.

`modelo`: `{tipo, metodo, variables:[{simbolo,nombre,unidad?}], datos:{...}, evidencias:[{campo,texto}]}`.

Tipos y datos, alineados con solvers existentes:

- `pl`, método `simplex`: datos `{objetivo:'max z=3x1+5x2', restricciones:['x1<=4',...,'x1,x2>=0']}`. Variables continuas/no negativas; avisar o rechazar modelos enteros, no redondear solución.
- `transporte`, método `vogel|noroeste|costo_minimo`: datos `{costos:number[][],oferta:number[],demanda:number[]}`.
- `asignacion`, método `hungaro`: datos `{matriz:number[][],objetivo:'min'|'max'}`.
- `redes`, método `cpm|pert`: datos `{actividades:[{id,predecesoras:[],duracion}|{id,predecesoras:[],a,m,b}],plazo?}`.
- `inventarios`, método `eoq|faltantes|epq|descuentos|reorden|periodo_fijo`: datos según API existente (`D,S,H`, `p`, `P`, `i,tramos`, `d,L,sigma,z`, `d,T,L,sigma,z,inventario`). Mantener unidades temporales explícitas y coherentes.
- `colas`, método `mm1|mms`: datos `{lambda,mu,s?,cs?,cw?}`. Tasas misma unidad. Modelos exponenciales/Poisson como supuesto explícito; no asumir tasas si faltan.
- `markov`, método `discreto`: datos `{P:number[][],inicial:number[],n:number}`.
- `noLineal`, método `dorada|newton|lagrange`: datos `{f,a,b,objetivo}` o `{f,x0,a?,b?}` o `{f,g,c}`. Alcance y límites explícitos.

## Resolución en servidor

`POST /api/io/resolver`, JWT y mismo límite por usuario. Body `{enunciado:string}` (20–12000) o `{modelo:{tipo,metodo,datos,variables?}}`. Respuesta: el contrato de `/interpretar` más `solucion` (`{tipo,metodo,estado,resumen,metricas:[{etiqueta,valor,unidad}],pasos:[{texto,tabla}],resultado,advertencias}`) y `errorSolucion` (texto o null). `estado`: `optimo|infactible|no_acotado|aproximado|estacionario|calculado`.

Pipeline de `IoInterpretacionService` (también lo usa `/interpretar`):
1. Modelo JSON escrito en el texto → se valida y se resuelve, sin IA.
2. Caché: memoria (LRU 300) y `lms_core.clawbot_cache` con clave `io_modelo|texto normalizado`. Lo leído de BD vuelve a pasar por `IoModeloValidator` y por el solver antes de salir.
3. IA (Groq → Gemini → Ollama) como primer intento de modelado. Cada modelo "listo" se resuelve en el servidor: si el solver lo rechaza o no tiene óptimo (infactible/no acotado) se prueba la siguiente fuente; si la IA omite la integralidad que exige el texto, también.
4. Respaldo determinista: `IoParserLocal` interpreta el enunciado y `IoSolverService` lo resuelve. Si la IA y el servidor llegan a cifras distintas, se añade una advertencia.
5. Solo se cachean modelos resueltos con óptimo.

Solvers Java en `service/io/solver/` (uno por tipo, despachados por `IoSolverService`): simplex de dos fases con Bland, duales y rangos de sensibilidad; branch & bound (3000 nodos); juegos por PL; transporte con Vogel/noroeste/costo mínimo + MODI; húngaro; CPM/PERT; Dijkstra, Kruskal, Edmonds-Karp; inventarios; M/M/1 y M/M/s (hasta 1000 servidores, Erlang por recurrencia); Markov; decisiones; sección dorada, Newton, Lagrange, Newton multivariable; cuadrática por KKT de conjuntos activos. `IoExpresion` es un parser de fórmulas por descenso recursivo, sin eval. Las claves de `resultado` son las del solver JS equivalente. `IoOraculoCruzadoTest` exige al backend las mismas cifras que el frontend en 71 modelos (`src/test/resources/io/oraculo_io.json`).

## Solver frontend

`lib/io/desdeEnunciado.js` exporta `resolverModeloInterpretado(modelo)` y `validarModeloInterpretado(modelo)` (validación lanza Error en español).
Retorno `{tipo,metodo,estado,resumen,metricas:[{etiqueta,valor,unidad?}],pasos:[],grafico:object|null,resultado:object,advertencias:[]}`.
`grafico`: PL `{tipo:'pl',datos:resultadoGrafico,variables:[simbolos]}`; series `{tipo:'series',datos:[...],xKey,series:[{key,nombre}],xLabel?,yLabel?}`; redes `{tipo:'red',actividades:[...]}`; matrices/asignación ofrecen pasos/tablas aunque no tengan curva continua.
`pasos` conserva tablas detalladas del solver y texto/fórmulas; frontend debe mostrarlos de forma legible. Matrices/datos se editan estructurados con validación; JSON avanzado puede ser opcional, no entrada principal.

## Responsabilidades

- Backend: controlador/service io, proveedores con timeouts, parser fallback, prompts y validación estricta del contrato; tests aislados de proveedores sin cargos reales.
- Solvers: adaptador, guardas dimensionales/límites razonables y tests de modelo → resultado; sin tocar UI ni backend.
- UI: entrada enunciado, ejemplos naturales, extracción y resolución automática si listo, revisión editable del modelo, preguntas/errores, variables y evidencia, pasos y visualizaciones; conservar métodos manuales existentes.
- Integración: pruebas HTTP local de fallback y UI, documentación/checkpoints, verificación visual si el navegador conectado permite verla.
