// Adaptación didáctica original; fuentes y alcance en docs/IO_TEMARIO_UNACH.md.
export const ioTheory = {
  "io-i": {
    "1": {
      "titulo": "Introducción a la Investigación de Operaciones",
      "objetivos": [
        "Distinguir decisiones, parámetros y restricciones",
        "Conectar un modelo con una decisión real"
      ],
      "contenido": [
        "La IO transforma una decisión en un modelo verificable. Primero delimita el problema, obtiene datos, formula variables y restricciones, resuelve, valida con la realidad y revisa los supuestos.",
        "Una variable representa una decisión controlable; un parámetro se estima con datos. La función objetivo expresa la medida de éxito y las restricciones los recursos y compromisos. Un óptimo matemático depende de la calidad del modelo."
      ],
      "erroresComunes": [
        "Optimizar antes de definir la decisión",
        "Confundir pronósticos con variables controlables"
      ],
      "formulas": [
        "\\max Z=\\sum_j c_jx_j"
      ]
    },
    "2": {
      "titulo": "Formulación de modelos de programación lineal",
      "objetivos": [
        "Traducir recursos y ganancias a coeficientes",
        "Declarar unidades y no negatividad"
      ],
      "contenido": [
        "Define x1 y x2 con unidades explícitas. La contribución unitaria multiplicada por cada cantidad construye Z; el consumo unitario construye cada restricción.",
        "La PL supone proporcionalidad, aditividad, divisibilidad y coeficientes conocidos. Si las cantidades deben ser enteras, redondear un óptimo continuo puede volverlo infactible: requiere un modelo entero."
      ],
      "erroresComunes": [
        "Cambiar unidades entre lados de una desigualdad",
        "Invertir el sentido de un mínimo exigido"
      ],
      "formulas": [
        "\\max Z=3x_1+5x_2",
        "3x_1+2x_2\\le18,\\quad x_1,x_2\\ge0"
      ]
    },
    "3": {
      "titulo": "Método gráfico",
      "objetivos": [
        "Construir la región factible",
        "Comparar el objetivo en vértices"
      ],
      "contenido": [
        "Para dos variables dibuja las fronteras, prueba el lado factible de cada desigualdad y conserva su intersección con los ejes no negativos. Una frontera se obtiene reemplazando la desigualdad por igualdad.",
        "Evalúa Z en los vértices factibles. Una región vacía es infactible; una región abierta puede o no tener un objetivo no acotado. Restricciones activas tienen residuo cero."
      ],
      "erroresComunes": [
        "Usar intersecciones que violan otra restricción",
        "Confundir región no acotada con objetivo no acotado"
      ],
      "formulas": [
        "Z(v)=3v_1+5v_2"
      ]
    },
    "4": {
      "titulo": "Simplex para maximizar",
      "objetivos": [
        "Interpretar bases y pivotes",
        "Comprobar factibilidad al cambiar de base"
      ],
      "contenido": [
        "Agrega holguras a restricciones <= y parte de una base factible. Los costos reducidos identifican mejoras posibles. Con un tableau que usa Zj-Cj, una entrada negativa señala mejora al maximizar.",
        "Selecciona salida con el menor cociente no negativo b/a entre coeficientes positivos de la columna de entrada. Normaliza el pivote y elimina esa columna en las otras filas. Bland desempata por orden de variable para evitar ciclos; el pivote puede diferir del criterio de mayor mejora."
      ],
      "erroresComunes": [
        "Dividir por coeficientes negativos en el test de cocientes",
        "Mezclar Cj-Zj y Zj-Cj"
      ],
      "formulas": [
        "x_B=B^{-1}b",
        "\\bar c_j=c_j-c_B^TB^{-1}A_j"
      ]
    },
    "5": {
      "titulo": "Minimización y variables artificiales",
      "objetivos": [
        "Distinguir excedentes de artificiales",
        "Detectar infactibilidad con Gran M"
      ],
      "contenido": [
        "Una restricción >= se vuelve igualdad restando un excedente; una artificial permite construir una base inicial. Las igualdades también pueden requerir artificiales.",
        "Gran M penaliza artificiales: +M en minimización y -M en maximización. Una artificial positiva al terminar significa que el modelo original no tiene solución factible. El solver compara M simbólicamente; no debes escoger un número arbitrario esperando que siempre funcione."
      ],
      "erroresComunes": [
        "Sumar una holgura a una desigualdad >=",
        "Aceptar como factible una artificial positiva"
      ],
      "formulas": [
        "x+y-e+a=4",
        "\\min Z=2x+3y+M\\sum a_i"
      ]
    },
    "6": {
      "titulo": "Dualidad y sensibilidad",
      "objetivos": [
        "Interpretar precios sombra",
        "Respetar los rangos de validez de una base"
      ],
      "contenido": [
        "El dual de max c^T x con Ax<=b, x>=0 es min b^T y con A^T y>=c, y>=0. Bajo optimalidad factible, ambos objetivos coinciden. La complementariedad vincula holguras y variables duales.",
        "Un precio sombra predice el cambio marginal de Z por una unidad de recurso mientras se conserve la base óptima. Los rangos del solver cambian un coeficiente a la vez; no justifican modificar simultáneamente varios recursos."
      ],
      "erroresComunes": [
        "Aplicar precios sombra fuera de su rango",
        "Suponer que todo recurso tiene precio sombra positivo"
      ],
      "formulas": [
        "\\Delta Z=y^T\\Delta b"
      ]
    },
    "7": {
      "titulo": "Transporte: soluciones iniciales y MODI",
      "objetivos": [
        "Balancear oferta y demanda",
        "Distinguir costo inicial de óptimo"
      ],
      "contenido": [
        "Una matriz de transporte conecta ofertas por fila con demandas por columna. Si los totales difieren, incorpora un origen o destino ficticio; costo cero supone ausencia de penalización, y debe justificarse.",
        "Noroeste usa disponibilidad, costo mínimo privilegia celdas baratas y Vogel considera penalizaciones. MODI calcula potenciales u,v en básicas y costos reducidos c-u-v; un negativo permite mejorar en minimización mediante un ciclo alternado. Degeneración necesita básicas de asignación cero sin inventar demanda."
      ],
      "erroresComunes": [
        "Llamar óptimo a una solución inicial",
        "Olvidar balancear o alterar cantidades con epsilon numérico"
      ],
      "formulas": [
        "\\min Z=\\sum_i\\sum_j c_{ij}x_{ij}",
        "\\Delta_{ij}=c_{ij}-u_i-v_j"
      ]
    },
    "8": {
      "titulo": "Asignación: método húngaro",
      "objetivos": [
        "Resolver asignaciones uno a uno",
        "Transformar una maximización"
      ],
      "contenido": [
        "Una asignación selecciona una celda por trabajador y por tarea. Balancea matrices rectangulares con tareas o trabajadores ficticios. Para minimizar, reduce filas y columnas y busca ceros independientes.",
        "Si faltan ceros independientes, cubre los ceros con el menor número de líneas y ajusta con el menor elemento no cubierto. Maximizar puede transformarse mediante max(c)-c; el costo reportado debe regresar a la matriz original."
      ],
      "erroresComunes": [
        "Seleccionar dos ceros en la misma columna",
        "Reportar el objetivo de la matriz transformada"
      ],
      "formulas": [
        "d_{ij}=\\max(c)-c_{ij}"
      ]
    }
  },
  "io-ii": {
    "1": {
      "titulo": "CPM y ruta crítica",
      "objetivos": [
        "Realizar recorridos hacia adelante y atrás",
        "Interpretar holguras y precedencias"
      ],
      "contenido": [
        "En una red sin ciclos, ES de una actividad es el máximo EF de sus predecesoras y EF=ES+t. Desde la duración del proyecto, LF es el mínimo LS de sus sucesoras y LS=LF-t.",
        "Holgura=LS-ES. Las actividades de holgura cero forman rutas críticas, puede haber más de una. Una tarea crítica retrasada afecta el proyecto bajo el modelo sin recursos limitados; CPM no nivela automáticamente personal ni maquinaria."
      ],
      "erroresComunes": [
        "Usar el mínimo en el recorrido hacia adelante",
        "Confundir duración de actividad con duración de proyecto"
      ],
      "formulas": [
        "EF=ES+t,\\quad LS=LF-t",
        "H=LS-ES"
      ]
    },
    "2": {
      "titulo": "PERT y probabilidad de terminación",
      "objetivos": [
        "Calcular duración esperada y varianza",
        "Entender la aproximación normal"
      ],
      "contenido": [
        "PERT resume tiempos optimista a, más probable m y pesimista b, con a<=m<=b. El tiempo esperado pesa cuatro veces m; la varianza depende del rango.",
        "La suma de medias y varianzas sobre la ruta crítica permite una aproximación normal si los tiempos son independientes. El cambio de ruta crítica y la dependencia entre actividades limitan esta aproximación; no es una garantía de entrega."
      ],
      "erroresComunes": [
        "Sumar desviaciones en lugar de varianzas",
        "Confundir probabilidad con certeza contractual"
      ],
      "formulas": [
        "t_e=\\frac{a+4m+b}{6}",
        "\\sigma^2=\\left(\\frac{b-a}{6}\\right)^2",
        "z=\\frac{T-\\mu}{\\sigma}"
      ]
    },
    "3": {
      "titulo": "Inventarios deterministas",
      "objetivos": [
        "Calcular EOQ y lote de producción",
        "Comparar faltantes y descuentos"
      ],
      "contenido": [
        "EOQ equilibra pedir y mantener con demanda anual D, costo por pedido S y costo anual por unidad H. Supone demanda constante, reposición instantánea y ausencia de faltantes.",
        "EPQ modela producción gradual a tasa P>D. Con faltantes planeados debe explicitarse el costo anual de pendientes. En descuentos por volumen de todas las unidades, compara costos totales en EOQ factibles y puntos de quiebre incluyendo compra."
      ],
      "erroresComunes": [
        "Mezclar costos mensuales con demanda anual",
        "Ignorar el costo de compra cuando cambia el precio"
      ],
      "formulas": [
        "Q^*=\\sqrt{\\frac{2DS}{H}}",
        "Q_{EPQ}=\\sqrt{\\frac{2DS}{H(1-D/P)}}"
      ]
    },
    "4": {
      "titulo": "Inventarios con incertidumbre y período fijo",
      "objetivos": [
        "Calcular stock de seguridad y reorden",
        "Usar posición de inventario"
      ],
      "contenido": [
        "Con demanda media d por día y plazo L, la demanda esperada durante entrega es dL. Si las demandas diarias son independientes con desviación sigma y plazo constante, la desviación durante entrega es sigma*sqrt(L).",
        "La revisión periódica cada T días protege T+L. El pedido es nivel objetivo menos posición de inventario, truncado en cero. Posición significa disponible más pedidos en tránsito menos pendientes. El factor z representa servicio de ciclo bajo normalidad, no tasa de llenado."
      ],
      "erroresComunes": [
        "Usar sigma*L en vez de sigma*sqrt(L)",
        "Confundir inventario disponible con posición"
      ],
      "formulas": [
        "R=dL+z\\sigma\\sqrt L",
        "S=d(T+L)+z\\sigma\\sqrt{T+L}"
      ]
    },
    "5": {
      "titulo": "Líneas de espera M/M/1 y M/M/s",
      "objetivos": [
        "Comprobar estabilidad",
        "Distinguir sistema y cola"
      ],
      "contenido": [
        "M/M/1 supone llegadas Poisson, servicios exponenciales, un servidor, población y capacidad ilimitadas y régimen estacionario. Usa tasas lambda y mu en la misma unidad. Si lambda>=mu, las medidas estacionarias no existen.",
        "M/M/s tiene s servidores idénticos con mu por servidor y exige lambda<s*mu. Erlang C obtiene probabilidad de esperar y medidas de cola. Por Little, L=lambda*W y Lq=lambda*Wq. El costo de espera depende de si valoras clientes en cola o en todo el sistema."
      ],
      "erroresComunes": [
        "Introducir minutos junto con tasas por hora",
        "Usar mu total cuando el modelo espera mu por servidor"
      ],
      "formulas": [
        "\\rho=\\frac{\\lambda}{s\\mu}",
        "L=\\lambda W,\\quad L_q=\\lambda W_q"
      ]
    },
    "6": {
      "titulo": "Cadenas de Markov",
      "objetivos": [
        "Proyectar distribuciones por transición",
        "Distinguir estacionaria de convergencia"
      ],
      "contenido": [
        "Cada fila de P contiene probabilidades del próximo estado condicionado al actual y suma uno. Con vectores fila, la distribución evoluciona como p(n+1)=p(n)P. La hipótesis de Markov depende del estado actual, no de toda la historia.",
        "Una estacionaria satisface pi P=pi y suma uno. Su existencia no implica que todas las distribuciones converjan a ella: periodicidad y clases cerradas pueden producir oscilaciones o no unicidad. Describe los estados y el intervalo de transición para interpretar resultados."
      ],
      "erroresComunes": [
        "Multiplicar en la orientación equivocada",
        "Afirmar convergencia solo porque existe una estacionaria"
      ],
      "formulas": [
        "p_n=p_0P^n",
        "\\pi P=\\pi,\\quad\\sum_i\\pi_i=1"
      ]
    },
    "7": {
      "titulo": "Programación no lineal",
      "objetivos": [
        "Comparar sección dorada y Newton",
        "Formular condiciones de Lagrange"
      ],
      "contenido": [
        "Sección dorada estrecha un intervalo donde la función es unimodal. Newton aplicado a f prima usa x siguiente=x-f prima/f segunda para buscar estacionarios; puede no converger y requiere derivadas válidas.",
        "Clasifica estacionarios con derivadas y compara fronteras si el dominio está acotado. Lagrange para g(x,y)=c impone grad(f)=lambda grad(g). Cumplir condiciones necesarias no prueba un óptimo global; revisa regularidad, curvatura y dominio."
      ],
      "erroresComunes": [
        "Declarar óptimo global cualquier punto estacionario",
        "Aplicar sección dorada sin verificar unimodalidad"
      ],
      "formulas": [
        "x_{k+1}=x_k-\\frac{f\\prime(x_k)}{f\\prime\\prime(x_k)}",
        "\\nabla f=\\lambda\\nabla g"
      ]
    }
  }
};

export function getIoTheory(curso, orden) {
  const nombre = String(curso || "").toLowerCase();
  const clave = /\bii\b/.test(nombre) ? "io-ii" : "io-i";
  return ioTheory[clave]?.[Number(orden)] || null;
}
export default ioTheory;
