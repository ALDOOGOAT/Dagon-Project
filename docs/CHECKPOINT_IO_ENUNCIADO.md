# Enunciado → solución IO — 5 octubre 2026

## Solicitud

El usuario pide comprobar y añadir resolución desde el enunciado natural: descomponer variables, fórmulas y ecuaciones, calcular, graficar y mostrar resultados; mejorar UI/UX y delegar agentes necesarios.

## Verificación inicial

La calculadora existente solo recibe fórmulas y parámetros manuales. No había entrada natural ni endpoint IO de interpretación. La nueva experiencia añade este flujo; no cambia las misiones/XP ni necesita migraciones.

## Contrato y propietarios

Ver `CONTRATO_IO_ENUNCIADO.md`.

- Backend: POST autenticado `/api/io/interpretar`, proveedores JSON y fallback local, guardas y tests. No IA para inventar soluciones.
- Solvers: `lib/io/desdeEnunciado.js`, valida y adapta los 8 tipos a los solvers deterministas existentes; normaliza resultados/pasos/gráficas.
- Frontend: cuaderno de modelado ámbar/cian, entrada principal por enunciado, modelos editables y resultados legibles, preserva métodos manuales.
- Integrador: API local real, corpus de aceptación, pruebas/build, documentación y apertura en navegador.

## Entorno preservado

Frontend activo 3000, backend local 18080, PostgreSQL 5434/base dagon_io_retoma_20261005. Import de .env desactivado; DB nunca Railway. Cuenta de demo ya creada. Claves Gemini/Groq están presentes en backend/.env, pero no cargadas en el proceso de preview inicial. No imprimirlas. No se afirma conexión de proveedor sin probarla.

## Casos de aceptación

- PL natural: producir mesas/sillas, beneficios 3/5, topes 4/6, acabado 3/2 y disponibilidad18; continuo/no negativo → variables con significado, objetivo max3x1+5x2, óptimo (2,6), Z36, región factible y tablas.
- EOQ: demanda anual10000, costo por pedido50, mantenimiento anual por unidad25 → Q200, costos y curva.
- Colas: llegadas4/hora, servicio6/hora,1servidor, Poisson/exponencial → rho2/3,L2,W0.5horas, Pn.
- Falta capacidad/beneficio/tasa/unidad o ambigüedad → preguntas y ninguna solución fabricada.
- Modelos infactibles/no acotados/inestables → resultado específico, nunca óptimo falso.
- API caída/respuesta inválida/cambios de texto durante extracción → conservar entrada, error legible y no mostrar resultado obsoleto.
- IA y fallback entregan el mismo contrato; solver valida también los datos editados.

## Integración verificada

- API real sobre PostgreSQL local en 5434; modelos naturales de producción, EOQ y colas → solvers reales por `scripts/verificar_io_enunciado.py`. También contratos ejecutables de transporte, asignación, CPM, Markov y no lineal; PL infactible/no acotada e incompletos sin resultados fabricados. Registro: `/tmp/dagon-enunciado-api.log`.
- La aceptación HTTP descubrió incompatibilidad Jackson 2 JsonNode/Jackson 3 de Spring Boot 4: se serializaban flags internos en lugar de datos. Controller devuelve Map/List ordinarios y hay prueba con el serializador Jackson 3 real.
- Groq POST real con clave existente y `openai/gpt-oss-20b` respondió 200. User-Agent `DagonIO/1.0` evita el rechazo 403/1010 observado con clientes sin esta cabecera. Modelo anterior no disponible en el inventario real. Gemini listado de modelos accesible, pero generación 2.5-flash dio 404 y 3.1-flash-lite timeout; no se declara generación Gemini comprobada. Ollama no probado ni activado.
- Chrome 148 con pantalla real (CDP9223 perfil temporal), renderer **ANGLE Intel Mesa RPL-P**, GPU compositing/WebGL activos, sin SwiftShader. Login demo y calculadora con datos HTTP reales: Z36, gráfica SVG, editar objetivo→Z30, incompleto→preguntas. 390/768/1440 sin overflow, 0 errores JavaScript/consola en esa prueba y 0 violaciones axe automáticas en `.io-enunciado`. Navegación pestañas flechas/Home funciona. No se certifica accesibilidad completa ni regresión visual: no hay baseline previo.
- Muestra requestAnimationFrame en vista visible inicial: 120 intervalos/1.206s, ~99.5FPS sobre Intel; es una muestra breve, no benchmark de toda la aplicación.
- Evidencia UI: `/tmp/dagon-enunciado-browser-qa.json`, `/tmp/dagon-enunciado-resuelto-{390,768,1440}.png`. Browser queda abierto con sesión local.

## Cierre verificado

- **118 pruebas backend**, **216 frontend / 21 suites**, build de producción correcto y `git diff --check` limpio. Logs `/tmp/dagon-backend-recovery.log`, `/tmp/dagon-enunciado-frontend-tests.log`, `/tmp/dagon-enunciado-build.log`.
- **50 comprobaciones HTTP + solvers reales** en `/tmp/dagon-enunciado-api.log`, sobre los ocho tipos. El script admite `--con-ia` para comprobar adicionalmente un proveedor configurado con cuota disponible.
- El esquema Groq real rechazó un `anyOf` con dos discriminadores (tipo y método), incluso con enums de método idénticos. Se conserva un único discriminador `tipo` de ocho ramas; `metodo` es texto obligatorio y se valida con enum en servidor. Parámetros opcionales nulos se eliminan antes del adaptador. POST estricto real **200** comprobado.
- **Recorrido IA completo en Chrome, sin respuestas simuladas**: enunciado de transporte con oferta15/25, demanda20/20 y costos[[6,2],[1,5]] → fuente `groq`, `transporte/costo_minimo`, variable `x_ij` con significado/unidad, coeficientes correctos y citas literales → solver real → **costo óptimo75** mostrado en UI. Otro cálculo del mismo modelo vía puente Node confirma75. 0 errores JS y sin overflow móvil. Modelo en `/tmp/dagon-enunciado-proveedor.json`; capturas `/tmp/dagon-transporte-ia-{390,1440}.png`.
- Procedimiento simplex legible con Base/variables/Solución/Razón/filaZ y pivote resaltado (incluye fila/columna0). Regresión real Wyndor cubierta. La revisión axe detectó una tabla desplazable sin foco; se corrigió TablaScroll para teclado. Repetición final: **0 violaciones axe automáticas**, 0 errores consola/JS, 390/768/1440 sin overflow.
- Frontend permanece en http://localhost:3000/io/calculadora, abierto en Chrome con demo y ejemplo Wyndor resuelto. Backend **18080**, PID1759841/sesión85660; log `/tmp/dagon-preview-io-ready.log` confirma exclusivamente PostgreSQL local `127.0.0.1:5434/dagon_io_retoma_20261005`. Claves existentes Gemini/Groq cargadas sin importar configuración DB de `.env`. No cambios de BD en esta fase, ni Railway, commits o despliegues.
- Gemini generación y Ollama siguen sin comprobarse; no se presentan como proveedores conectados. Fallback local conservador pide datos ante límites ambiguos, monedas/unidades incompatibles o modelos incompletos; PL entera/binaria se rechaza, no se redondea.

No hay tareas obligatorias pendientes del flujo solicitado. Alcance: ocho familias de IO y variantes declaradas en el contrato; no un solver universal. Validación automatizada no certifica accesibilidad completa ni rendimiento de toda la aplicación.
