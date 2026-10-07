# Contrato enunciado → modelo → solución

## API

`POST /api/io/interpretar`, JWT, body `{enunciado:string}` (20–12000 caracteres).
Respuesta: `{estado:'listo'|'incompleto'|'no_soportado', fuente:'local'|'gemini'|'groq'|'ollama', resumen:string, modelo:object|null, preguntas:string[], advertencias:string[], supuestos:string[]}`.
No se permiten respuestas/soluciones numéricas generadas por IA: solo modelado. Solución matemática determinista en frontend. No enviar secretos, SQL ni ejecutar código del proveedor. Los modelos incompletos no se ejecutan; no inventar coeficientes faltantes. No requiere migraciones BD ni cambios al validador de misiones.

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
