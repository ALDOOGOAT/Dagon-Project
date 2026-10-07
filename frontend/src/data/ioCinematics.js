// Cinemáticas de Investigación de Operaciones: se indexan por curso y orden, igual que ioTheory,
// porque los IDs de módulo vienen de la BD. Contenido didáctico original (ver docs/IO_TEMARIO_UNACH.md).

const escena = (kicker, title, body, extra = {}) => ({
  kicker, title, body, duration: 8200, mood: 'thinking', visual: 'chart',
  prompt: 'Identifica qué se decide, qué se conoce y qué limita la decisión.', ...extra,
});

const pregunta = (question, correcta, distractores) => ({
  question,
  options: [
    { label: correcta, correct: true, feedback: 'Correcto. Lleva esa idea a las misiones.' },
    ...distractores.map((label) => ({ label, correct: false, feedback: 'No del todo: revisa la escena anterior y piensa qué representa cada parte del modelo.' })),
  ],
});

export const IO_CINEMATICS = {
  'io-i': {
    1: {
      title: 'Decidir con modelos', subtitle: 'De una situación real a un modelo verificable', accent: 'from-amber-500 to-orange-600', ambient: 'mystic',
      scenes: [
        escena('Escena 1', 'Toda decisión tiene tres piezas', 'Lo que controlas (variables), lo que sabes (parámetros) y lo que te limita (restricciones). La Investigación de Operaciones empieza separando esas piezas.', { visual: 'target', mood: 'happy' }),
        escena('Escena 2', 'Un objetivo medible', 'Ganancia, costo, tiempo o riesgo: el objetivo convierte "lo mejor" en un número que se puede comparar entre alternativas.', { visual: 'chart', code: 'max z = ganancia total\nmin z = costo total' }),
        escena('Escena 3', 'El modelo se valida', 'Un óptimo matemático solo es tan bueno como sus supuestos. Siempre vuelve al problema real y pregunta si la solución tiene sentido.', { visual: 'warning', mood: 'determined' }),
      ],
      checkpoint: pregunta('¿Qué es una variable de decisión?', 'Una cantidad que la persona que decide puede controlar.', ['Un dato fijo que se mide en el sistema.', 'El valor óptimo de la función objetivo.']),
    },
    2: {
      title: 'Formular programación lineal', subtitle: 'Variables, objetivo y restricciones', accent: 'from-amber-500 to-yellow-500', ambient: 'build',
      scenes: [
        escena('Escena 1', 'Nombra las decisiones', 'Antes de escribir números, define x1, x2… con unidades: "x1 = mesas producidas por semana". Sin unidades, el modelo no se puede revisar.', { visual: 'formula', code: 'x1 = mesas por semana\nx2 = sillas por semana' }),
        escena('Escena 2', 'Cada recurso es una restricción', 'Horas, material o presupuesto se convierten en desigualdades: lo que consume cada unidad, multiplicado por cuántas haces, no puede superar lo disponible.', { visual: 'scale', code: '3x1 + 2x2 ≤ 18   (horas de acabado)' }),
        escena('Escena 3', 'No olvides la no negatividad', 'No se fabrican mesas negativas. x1, x2 ≥ 0 parece obvio, pero sin ella el modelo puede dar respuestas imposibles.', { visual: 'shield', mood: 'determined' }),
      ],
      checkpoint: pregunta('Si cada mesa usa 3 horas y hay 18 disponibles, ¿qué restricción escribes?', '3x1 ≤ 18 (sumando lo que usen las demás variables).', ['x1 ≤ 3', '18x1 ≥ 3']),
    },
    3: {
      title: 'Método gráfico', subtitle: 'Ver la región factible', accent: 'from-amber-500 to-cyan-500', ambient: 'mystic',
      scenes: [
        escena('Escena 1', 'Cada restricción es una recta', 'Con dos variables, cada desigualdad divide el plano en dos. La región factible es la intersección de todas las mitades permitidas.', { visual: 'chart', mood: 'happy' }),
        escena('Escena 2', 'El óptimo está en un vértice', 'Si existe óptimo, al menos uno está en una esquina de la región. Por eso basta evaluar Z en los vértices factibles.', { visual: 'target', code: 'Wyndor: (2, 6) → Z = 3·2 + 5·6 = 36' }),
        escena('Escena 3', 'Desliza la recta de Z', 'La recta de nivel de Z se mueve en la dirección que mejora el objetivo hasta tocar la región por última vez.', { visual: 'trend', mood: 'determined' }),
      ],
      checkpoint: pregunta('¿Dónde buscas el óptimo de un modelo lineal con dos variables?', 'En los vértices de la región factible.', ['En el centro de la región.', 'En cualquier punto con x1 = x2.']),
    },
    4: {
      title: 'Simplex de maximización', subtitle: 'Recorrer vértices con álgebra', accent: 'from-amber-500 to-orange-600', ambient: 'build',
      scenes: [
        escena('Escena 1', 'Holguras: la forma estándar', 'Cada ≤ recibe una holgura s ≥ 0 que mide lo que sobra del recurso. Así las desigualdades se vuelven igualdades y empieza la tabla.', { visual: 'table', code: '3x1 + 2x2 + s3 = 18' }),
        escena('Escena 2', 'Entra, sale, pivote', 'Entra la variable que más mejora Z; sale la que primero llega a cero según la prueba de razón mínima. El pivote actualiza toda la tabla.', { visual: 'formula', mood: 'determined' }),
        escena('Escena 3', '¿Cuándo termina?', 'Cuando ningún coeficiente de la fila Z puede mejorar el objetivo, la tabla es óptima. Si una columna no tiene razones válidas, el problema no está acotado.', { visual: 'target' }),
      ],
      checkpoint: pregunta('¿Qué regla elige la variable que sale de la base?', 'La razón mínima entre el lado derecho y los coeficientes positivos de la columna que entra.', ['El coeficiente más grande de la fila Z.', 'La variable con mayor valor actual.']),
    },
    5: {
      title: 'Minimización y artificiales', subtitle: 'Gran M y dos fases', accent: 'from-amber-500 to-rose-500', ambient: 'risk',
      scenes: [
        escena('Escena 1', 'Las ≥ no dan base inicial', 'Una restricción ≥ resta un excedente; para empezar el simplex se agrega una artificial que luego debe desaparecer.', { visual: 'warning', code: '10x1 + 4x2 − e1 + a1 = 20' }),
        escena('Escena 2', 'La Gran M castiga artificiales', 'Con un costo M enorme, el simplex prefiere sacar las artificiales. Si al final alguna sigue positiva, el modelo es infactible.', { visual: 'scale', mood: 'determined' }),
        escena('Escena 3', 'Minimizar también es optimizar', 'Puedes minimizar directamente o maximizar −Z. Lo importante es leer bien qué signo mejora el objetivo.', { visual: 'formula' }),
      ],
      checkpoint: pregunta('Si una artificial queda positiva en la tabla final, ¿qué significa?', 'El modelo no tiene solución factible.', ['El óptimo es múltiple.', 'El objetivo no está acotado.']),
    },
    6: {
      title: 'Dualidad y sensibilidad', subtitle: 'El valor de cada recurso', accent: 'from-amber-500 to-emerald-500', ambient: 'mystic',
      scenes: [
        escena('Escena 1', 'Precio sombra', 'El dual asigna a cada recurso cuánto mejora Z por una unidad extra. Es lo máximo que convendría pagar por ese recurso.', { visual: 'coins', mood: 'happy' }),
        escena('Escena 2', 'Rangos de validez', 'El precio sombra solo vale mientras b se mantenga dentro de su rango; fuera de él cambia la base óptima.', { visual: 'scale', code: 'b actual = 18, rango [12, 24] → y3 = 1' }),
        escena('Escena 3', 'Holgura complementaria', 'Si un recurso sobra (holgura > 0), su precio sombra es cero: tener más no ayuda.', { visual: 'formula', mood: 'determined' }),
      ],
      checkpoint: pregunta('Un recurso con holgura positiva en el óptimo tiene precio sombra…', 'Cero.', ['Igual al coeficiente de Z.', 'Infinito.']),
    },
    7: {
      title: 'Transporte y MODI', subtitle: 'Enviar al menor costo', accent: 'from-amber-500 to-sky-500', ambient: 'build',
      scenes: [
        escena('Escena 1', 'Oferta y demanda balanceadas', 'Si no coinciden, se agrega un origen o destino ficticio con costo cero. Así toda la oferta y la demanda quedan representadas.', { visual: 'network', mood: 'happy' }),
        escena('Escena 2', 'Solución inicial', 'Esquina noroeste, costo mínimo o Vogel dan un punto de partida. Vogel suele empezar más cerca del óptimo porque mide penalizaciones.', { visual: 'table' }),
        escena('Escena 3', 'MODI mejora la solución', 'Con potenciales u + v = c en celdas básicas, cada celda vacía revela si reasignar baja el costo. Si ningún costo reducido es negativo, es óptimo.', { visual: 'formula', code: 'cᵢⱼ − uᵢ − vⱼ ≥ 0 en todas las celdas vacías' }),
      ],
      checkpoint: pregunta('¿Qué indica un costo reducido negativo en MODI?', 'Que enviar por esa celda reduce el costo total.', ['Que el problema está balanceado.', 'Que la celda debe quedar vacía.']),
    },
    8: {
      title: 'Asignación', subtitle: 'Una tarea para cada recurso', accent: 'from-amber-500 to-violet-500', ambient: 'mystic',
      scenes: [
        escena('Escena 1', 'Uno a uno', 'Cada trabajador a una tarea y cada tarea a un trabajador. Es un transporte especial con ofertas y demandas iguales a 1.', { visual: 'network', mood: 'happy' }),
        escena('Escena 2', 'Reducir filas y columnas', 'El método húngaro resta el mínimo de cada fila y columna. Los ceros marcan asignaciones de costo relativo nulo.', { visual: 'table' }),
        escena('Escena 3', 'Cubrir ceros', 'Si se necesitan menos líneas que el tamaño de la matriz para cubrir los ceros, se ajusta la matriz y se repite.', { visual: 'formula', mood: 'determined' }),
      ],
      checkpoint: pregunta('¿Cómo se maximiza con el método húngaro?', 'Convirtiendo ganancias en pérdidas de oportunidad (máximo − valor) y minimizando.', ['Sumando los máximos de cada fila.', 'No se puede maximizar.']),
    },
  },
  'io-ii': {
    1: {
      title: 'Ruta crítica (CPM)', subtitle: 'Qué actividad no puede retrasarse', accent: 'from-amber-500 to-red-500', ambient: 'risk',
      scenes: [
        escena('Escena 1', 'Una red de precedencias', 'Cada actividad empieza cuando terminan sus predecesoras. Dibujar la red evita ciclos y olvidos.', { visual: 'network', mood: 'happy' }),
        escena('Escena 2', 'Ida y vuelta', 'El recorrido hacia adelante da los inicios más tempranos (ES, EF); hacia atrás, los más tardíos (LS, LF).', { visual: 'clock', code: 'Holgura = LS − ES' }),
        escena('Escena 3', 'Holgura cero = crítica', 'Las actividades sin holgura forman la ruta crítica: cualquier retraso en ellas retrasa todo el proyecto.', { visual: 'warning', mood: 'determined' }),
      ],
      checkpoint: pregunta('¿Qué caracteriza a una actividad crítica?', 'Su holgura es cero.', ['Es la de mayor costo.', 'No tiene predecesoras.']),
    },
    2: {
      title: 'PERT', subtitle: 'Duraciones inciertas', accent: 'from-amber-500 to-indigo-500', ambient: 'mystic',
      scenes: [
        escena('Escena 1', 'Tres estimaciones', 'Optimista a, más probable m y pesimista b. La media pondera más el valor probable.', { visual: 'formula', code: 'tₑ = (a + 4m + b) / 6\nσ² = ((b − a) / 6)²' }),
        escena('Escena 2', 'La ruta crítica suma varianzas', 'Suponiendo independencia, la varianza del proyecto es la suma de las varianzas de las actividades críticas.', { visual: 'chart' }),
        escena('Escena 3', 'Probabilidad de cumplir', 'Con aproximación normal: z = (plazo − media) / σ. Es una estimación, no una garantía.', { visual: 'trend', mood: 'determined' }),
      ],
      checkpoint: pregunta('¿Qué distribución aproxima la duración total en PERT?', 'Una normal con la suma de medias y varianzas de la ruta crítica.', ['Una uniforme entre a y b.', 'Una exponencial.']),
    },
    3: {
      title: 'Inventarios deterministas', subtitle: 'Cuánto y cuándo pedir', accent: 'from-amber-500 to-lime-500', ambient: 'build',
      scenes: [
        escena('Escena 1', 'Dos costos en tensión', 'Pedir poco obliga a pedir seguido (costo de ordenar); pedir mucho acumula inventario (costo de mantener).', { visual: 'scale', mood: 'happy' }),
        escena('Escena 2', 'El lote económico', 'El EOQ iguala ambos costos anuales. En la gráfica, es el punto más bajo de la curva de costo total.', { visual: 'chart', code: 'Q* = √(2DS / H)' }),
        escena('Escena 3', 'Variantes', 'Con faltantes permitidos, producción gradual (EPQ) o descuentos, la idea es la misma: comparar costos totales.', { visual: 'formula', mood: 'determined' }),
      ],
      checkpoint: pregunta('Si la demanda anual se cuadruplica, ¿qué pasa con el EOQ?', 'Se duplica (por la raíz cuadrada).', ['Se cuadruplica.', 'No cambia.']),
    },
    4: {
      title: 'Incertidumbre y periodo fijo', subtitle: 'Inventario de seguridad', accent: 'from-amber-500 to-teal-500', ambient: 'risk',
      scenes: [
        escena('Escena 1', 'La demanda varía', 'Durante el plazo de entrega la demanda puede superar el promedio. El stock de seguridad cubre esa variación.', { visual: 'warning', mood: 'nervous' }),
        escena('Escena 2', 'Punto de reorden', 'Se pide cuando el inventario baja a la demanda esperada del plazo más el stock de seguridad.', { visual: 'formula', code: 'R = d·L + z·σ·√L' }),
        escena('Escena 3', 'Revisión periódica', 'Si solo revisas cada T periodos, debes cubrir T + L: por eso el nivel objetivo es mayor.', { visual: 'clock', mood: 'determined' }),
      ],
      checkpoint: pregunta('¿Qué controla el factor z?', 'El nivel de servicio deseado (probabilidad de no quedarse sin inventario).', ['El costo por pedido.', 'La duración del plazo de entrega.']),
    },
    5: {
      title: 'Líneas de espera', subtitle: 'M/M/1 y M/M/s', accent: 'from-amber-500 to-cyan-500', ambient: 'mystic',
      scenes: [
        escena('Escena 1', 'Llegadas y servicio', 'λ clientes llegan por hora y cada servidor atiende μ por hora. Si λ ≥ s·μ la cola crece sin límite.', { visual: 'clock', code: 'ρ = λ / (s·μ) < 1' }),
        escena('Escena 2', 'Métricas', 'L y Lq cuentan clientes; W y Wq miden tiempos. La ley de Little las conecta: L = λW.', { visual: 'formula' }),
        escena('Escena 3', 'Costo de esperar vs. servir', 'Más servidores reducen la espera pero cuestan. El mejor s minimiza el costo total.', { visual: 'scale', mood: 'determined' }),
      ],
      checkpoint: pregunta('Con λ = 4/h y μ = 6/h en M/M/1, ¿cuánto vale L?', 'L = λ / (μ − λ) = 2 clientes.', ['L = 0.67', 'L = 10']),
    },
    6: {
      title: 'Cadenas de Markov', subtitle: 'Estados y transiciones', accent: 'from-amber-500 to-fuchsia-500', ambient: 'mystic',
      scenes: [
        escena('Escena 1', 'Sin memoria', 'El siguiente estado depende solo del actual. La matriz P guarda las probabilidades de pasar de un estado a otro.', { visual: 'network', mood: 'happy' }),
        escena('Escena 2', 'Avanzar n pasos', 'Multiplicar la distribución por P avanza un periodo. Después de n pasos: π₀·Pⁿ.', { visual: 'formula', code: 'πₙ = π₀ · Pⁿ' }),
        escena('Escena 3', 'Estado estable', 'Si la cadena converge, π = πP con Σπ = 1. Revisa periodicidad y clases antes de afirmarlo.', { visual: 'chart', mood: 'determined' }),
      ],
      checkpoint: pregunta('¿Qué condición cumple cada fila de P?', 'Sus probabilidades suman 1.', ['Su diagonal vale 1.', 'Todas sus entradas son iguales.']),
    },
    7: {
      title: 'Programación no lineal', subtitle: 'Curvas, gradientes y multiplicadores', accent: 'from-amber-500 to-pink-500', ambient: 'build',
      scenes: [
        escena('Escena 1', 'El óptimo puede estar dentro', 'En problemas no lineales el óptimo no siempre está en un vértice: puede estar donde la derivada se anula.', { visual: 'trend', mood: 'happy', code: "f'(x) = 0  →  punto estacionario" }),
        escena('Escena 2', 'Clasificar con la curvatura', 'La segunda derivada (o el Hessiano en varias variables) dice si es mínimo, máximo o silla.', { visual: 'formula' }),
        escena('Escena 3', 'Restricciones de igualdad', 'Con Lagrange, el gradiente de f es paralelo al de g en el óptimo: ∇f = λ∇g. Con desigualdades, las condiciones KKT agregan μ ≥ 0.', { visual: 'chart', mood: 'determined', code: '∇f = λ∇g,  g(x, y) = c' }),
      ],
      checkpoint: pregunta('Si el Hessiano tiene autovalores de signos distintos, el punto es…', 'Un punto silla.', ['Un mínimo global.', 'Un máximo local.']),
    },
  },
};

export function getIoCinematica(curso, orden) {
  const nombre = String(curso || '').toLowerCase();
  const clave = /\bii\b/.test(nombre) ? 'io-ii' : 'io-i';
  return IO_CINEMATICS[clave]?.[Number(orden)] || null;
}
