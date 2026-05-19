import {
  Database,
  FileJson,
  Gauge,
  GitBranch,
  History,
  KeyRound,
  Layers,
  Search,
  Server,
  Shield,
  Terminal
} from 'lucide-react';

export const CHAPTERS = [
  {
    id: 'origen',
    label: 'Origen',
    icon: History,
    title: 'De Berkeley al mundo real',
    mood: 'thinking',
    accent: 'historia',
    narration:
      'PostgreSQL nació de POSTGRES, un proyecto de investigación en la Universidad de California en Berkeley. Su idea central fue construir un motor relacional extensible, confiable y preparado para datos complejos.',
    bullets: [
      'POSTGRES inició en los años ochenta bajo la dirección de Michael Stonebraker.',
      'PostgreSQL agregó SQL como lenguaje principal y mantuvo una cultura fuerte de software libre.',
      'Su reputación viene de cumplir estándares, cuidar la integridad y permitir extensiones.'
    ],
    codeLabel: 'identidad.sql',
    code: `SELECT version();
SHOW server_version;
SHOW standard_conforming_strings;`
  },
  {
    id: 'porque',
    label: 'Por qué',
    icon: Shield,
    title: 'Un motor pensado para datos serios',
    mood: 'determined',
    accent: 'confiabilidad',
    narration:
      'PostgreSQL se usa cuando los datos importan. Ofrece transacciones ACID, claves foráneas, constraints, vistas, funciones, índices avanzados y herramientas para analizar rendimiento.',
    bullets: [
      'Es una gran opción para LMS, ERPs, fintech, dashboards, APIs, reportes y analítica.',
      'Soporta datos relacionales, JSONB, búsqueda textual, geodatos mediante PostGIS y extensiones.',
      'Brilla cuando necesitas reglas fuertes, consultas complejas y evolución controlada del esquema.'
    ],
    codeLabel: 'reglas.sql',
    code: `ALTER TABLE usuarios
ADD CONSTRAINT email_unico UNIQUE (email);

ALTER TABLE progreso
ADD CONSTRAINT progreso_xp_valido CHECK (xp >= 0);`
  },
  {
    id: 'modelo',
    label: 'Modelo',
    icon: Database,
    title: 'Tablas, relaciones y significado',
    mood: 'happy',
    accent: 'modelo relacional',
    narration:
      'Aprender PostgreSQL no es memorizar comandos. Es aprender a modelar información: entidades, relaciones, restricciones y consultas que responden preguntas reales.',
    bullets: [
      'Una tabla representa una entidad del sistema.',
      'Las claves primarias identifican filas; las claves foráneas conectan tablas.',
      'Las consultas convierten datos guardados en respuestas útiles para una persona.'
    ],
    codeLabel: 'modelo.sql',
    code: `CREATE TABLE modulos (
  id_modulo integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo text NOT NULL,
  xp_requerida integer NOT NULL DEFAULT 0
);`
  },
  {
    id: 'flujo',
    label: 'Flujo',
    icon: GitBranch,
    title: 'El ciclo mental de una consulta',
    mood: 'excited',
    accent: 'consulta',
    narration:
      'Una consulta tiene flujo: eliges columnas, eliges tablas, conectas relaciones, filtras, agrupas, ordenas y limitas. PostgreSQL ejecuta ese plan con ayuda del optimizador.',
    bullets: [
      'SELECT define qué quieres ver.',
      'FROM y JOIN definen de dónde salen los datos.',
      'WHERE, GROUP BY, HAVING, ORDER BY y LIMIT moldean la respuesta final.'
    ],
    codeLabel: 'consulta.sql',
    code: `SELECT u.nombre, COUNT(e.id_ejercicio) AS resueltos
FROM usuarios u
JOIN ejercicios_resueltos e ON e.id_usuario = u.id_usuario
WHERE u.activo = true
GROUP BY u.nombre
ORDER BY resueltos DESC
LIMIT 10;`
  }
];

export const COMMAND_TIERS = {
  basico: {
    label: 'Básico',
    icon: Terminal,
    colorHint: 'inicio',
    commands: [
      {
        name: 'SELECT',
        purpose: 'Leer información sin modificar datos.',
        detail:
          'SELECT es el comando principal para consultar datos en PostgreSQL. No cambia la información guardada; solo permite ver columnas, cálculos, funciones y resultados filtrados.',
        theory: [
          'SELECT indica qué columnas o expresiones quieres mostrar.',
          'FROM indica desde qué tabla se van a leer los datos.',
          'Puede usarse con WHERE, ORDER BY, LIMIT, JOIN y funciones.',
          'Aunque se escribe primero, PostgreSQL normalmente resuelve primero el origen de los datos y después decide qué mostrar.'
        ],
        deepTheory: [
          'SELECT es una operación de lectura. Eso significa que no altera filas ni estructura de tablas.',
          'El resultado de SELECT es una tabla temporal: existe solo como respuesta de la consulta.',
          'Puedes seleccionar columnas reales, expresiones calculadas, funciones, literales y alias.',
          'En una aplicación web, SELECT suele ser la base de pantallas como perfiles, dashboards, listas, reportes y buscadores.'
        ],
        analogies: [
          'Imagina que la base de datos es una biblioteca. SELECT es pedirle al bibliotecario que te muestre ciertos libros o ciertos datos, sin mover ni destruir nada.',
          'También puedes verlo como usar una linterna: no cambias el cuarto, solo iluminas la parte que quieres observar.'
        ],
        syntax: `SELECT columna1, columna2
FROM nombre_tabla
WHERE condicion
ORDER BY columna DESC
LIMIT cantidad;`,
        example: `SELECT nombre, xp, xp + 50 AS xp_bonus
FROM usuarios
WHERE xp >= 100
ORDER BY xp DESC
LIMIT 10;`,
        explanation: [
          'nombre y xp son columnas reales de la tabla usuarios.',
          'xp + 50 AS xp_bonus crea una columna calculada temporal.',
          'WHERE xp >= 100 filtra usuarios con 100 XP o más.',
          'ORDER BY xp DESC ordena los resultados de mayor a menor XP.',
          'LIMIT 10 muestra únicamente los primeros diez resultados.'
        ],
        commonMistakes: [
          'Usar SELECT * siempre, aunque solo necesites pocas columnas.',
          'Olvidar FROM cuando quieres consultar columnas de una tabla.',
          'Pensar que SELECT modifica datos.',
          'No usar alias cuando una columna calculada queda difícil de entender.'
        ],
        bestPractices: [
          'Selecciona solo las columnas necesarias.',
          'Usa alias claros con AS.',
          'Combina SELECT con WHERE para evitar traer datos innecesarios.',
          'Usa LIMIT cuando solo necesitas una cantidad pequeña de resultados.'
        ],
        practice: `SELECT nombre, xp
FROM usuarios;`,
        exercise:
          'Crea una consulta que muestre nombre, correo y XP de los usuarios con más de 200 XP.',
        summary:
          'SELECT es la base de la lectura de datos. Si lo dominas, puedes empezar a construir consultas útiles para cualquier aplicación.'
      },
      {
        name: 'WHERE',
        purpose: 'Filtrar filas con condiciones.',
        detail:
          'WHERE permite reducir los resultados de una consulta mostrando únicamente las filas que cumplen una condición.',
        theory: [
          'WHERE se usa para filtrar filas antes de mostrar el resultado final.',
          'Puede comparar números, textos, fechas, booleanos y valores nulos.',
          'Se combina con operadores como =, !=, >, <, BETWEEN, IN, LIKE, ILIKE e IS NULL.',
          'También permite combinar condiciones usando AND y OR.'
        ],
        deepTheory: [
          'WHERE es una de las partes más importantes para optimizar consultas porque reduce la cantidad de datos que PostgreSQL necesita procesar.',
          'Cuando una columna filtrada tiene índice, PostgreSQL puede encontrar datos más rápido.',
          'En UPDATE y DELETE, WHERE es crítico porque define qué filas serán modificadas o eliminadas.'
        ],
        analogies: [
          'WHERE es como un colador: tienes muchos datos, pero solo dejas pasar los que cumplen cierta condición.',
          'También es como decirle a una lista: muéstrame solo los alumnos aprobados, solo los activos o solo los que tienen más de cierta puntuación.'
        ],
        syntax: `SELECT columnas
FROM tabla
WHERE condicion;`,
        example: `SELECT titulo, xp_requerida
FROM modulos
WHERE xp_requerida BETWEEN 50 AND 200;`,
        explanation: [
          'FROM modulos indica la tabla que se consultará.',
          'WHERE xp_requerida BETWEEN 50 AND 200 filtra los módulos dentro de ese rango.',
          'El resultado no modifica la tabla, solo muestra una parte de ella.'
        ],
        commonMistakes: [
          'Usar = NULL en lugar de IS NULL.',
          'Olvidar comillas en textos.',
          'No usar paréntesis cuando mezclas AND y OR.',
          'Usar condiciones demasiado generales en UPDATE o DELETE.'
        ],
        bestPractices: [
          'Prueba primero tu condición con SELECT antes de usarla en UPDATE o DELETE.',
          'Usa ILIKE para búsquedas de texto sin importar mayúsculas.',
          'Usa paréntesis cuando combines AND y OR.'
        ],
        practice: `SELECT *
FROM modulos
WHERE xp_requerida <= 100;`,
        exercise:
          'Consulta los usuarios cuyo rol sea alumno y que tengan más de 50 XP.',
        summary:
          'WHERE convierte una tabla completa en una respuesta específica.'
      },
      {
        name: 'ORDER BY',
        purpose: 'Ordenar resultados.',
        detail:
          'ORDER BY organiza las filas devueltas por una consulta. Sirve para rankings, fechas recientes, reportes y tablas fáciles de leer.',
        theory: [
          'ORDER BY puede ordenar de forma ascendente con ASC.',
          'También puede ordenar de forma descendente con DESC.',
          'Puedes ordenar por columnas reales, alias o columnas calculadas.',
          'Si no escribes ASC o DESC, PostgreSQL usa ASC por defecto.'
        ],
        deepTheory: [
          'El orden de una tabla no está garantizado si no usas ORDER BY.',
          'ORDER BY suele ejecutarse casi al final de la consulta.',
          'Ordenar muchos datos puede ser costoso si no existen índices útiles.'
        ],
        analogies: [
          'ORDER BY es como acomodar una fila de personas por edad, estatura o puntuación.',
          'Los datos no cambian, solo cambia la manera en que los ves.'
        ],
        syntax: `SELECT columnas
FROM tabla
ORDER BY columna ASC;

SELECT columnas
FROM tabla
ORDER BY columna DESC;`,
        example: `SELECT nombre, xp
FROM usuarios
ORDER BY xp DESC, nombre ASC;`,
        explanation: [
          'Primero ordena por XP de mayor a menor.',
          'Si dos usuarios tienen el mismo XP, los ordena por nombre de A a Z.',
          'Esto es útil para rankings o leaderboards.'
        ],
        commonMistakes: [
          'Creer que una tabla siempre mantiene el mismo orden.',
          'Olvidar DESC cuando quieres ver primero los valores más altos.',
          'Ordenar por columnas que no ayudan a responder la pregunta.'
        ],
        bestPractices: [
          'Usa ORDER BY siempre que el orden sea importante.',
          'Combina ORDER BY con LIMIT para rankings.',
          'Agrega una segunda columna de orden para resolver empates.'
        ],
        practice: `SELECT nombre, xp
FROM usuarios
ORDER BY xp DESC;`,
        exercise:
          'Muestra los 10 usuarios con más XP ordenados de mayor a menor.',
        summary:
          'ORDER BY hace que tus resultados sean más legibles y útiles.'
      },
      {
        name: 'INSERT RETURNING',
        purpose: 'Crear datos y recuperar lo creado.',
        detail:
          'INSERT agrega registros nuevos. RETURNING permite que PostgreSQL devuelva inmediatamente los datos insertados.',
        theory: [
          'INSERT INTO indica la tabla donde se creará el registro.',
          'VALUES contiene los datos nuevos.',
          'RETURNING devuelve columnas del registro insertado.',
          'Es muy útil en APIs porque evita hacer otro SELECT para obtener el ID creado.'
        ],
        deepTheory: [
          'RETURNING es muy práctico cuando una tabla genera IDs automáticamente.',
          'También puede devolver columnas calculadas, valores por defecto o timestamps.',
          'Ayuda a que el backend responda al frontend con el objeto recién creado.'
        ],
        analogies: [
          'Es como registrar a una persona en una lista y pedir que inmediatamente te den su número de folio.',
          'Primero escribes el nuevo dato y PostgreSQL te entrega el comprobante.'
        ],
        syntax: `INSERT INTO tabla (columna1, columna2)
VALUES (valor1, valor2)
RETURNING *;`,
        example: `INSERT INTO cursos (titulo, descripcion)
VALUES ('PostgreSQL esencial', 'Curso inicial de bases de datos')
RETURNING id_curso, titulo, descripcion;`,
        explanation: [
          'Se crea un curso nuevo.',
          'RETURNING devuelve el id_curso generado.',
          'Esto evita una segunda consulta para saber qué se creó.'
        ],
        commonMistakes: [
          'No respetar el orden de columnas y valores.',
          'Intentar insertar valores nulos en columnas NOT NULL.',
          'Olvidar RETURNING cuando necesitas el ID generado.'
        ],
        bestPractices: [
          'Especifica siempre las columnas en el INSERT.',
          'Usa RETURNING en endpoints de creación.',
          'Valida datos antes de insertarlos.'
        ],
        practice: `INSERT INTO cursos (titulo)
VALUES ('PostgreSQL esencial')
RETURNING id_curso, titulo;`,
        exercise:
          'Inserta un módulo nuevo y devuelve su ID, título y XP requerida.',
        summary:
          'INSERT RETURNING es ideal para crear datos y responder rápido al frontend.'
      },
      {
        name: 'UPDATE',
        purpose: 'Modificar filas existentes.',
        detail:
          'UPDATE cambia datos existentes en una tabla. Es poderoso, pero debe usarse con cuidado porque puede modificar muchas filas si no tiene WHERE.',
        theory: [
          'UPDATE indica qué tabla será modificada.',
          'SET define qué columnas cambiarán.',
          'WHERE limita qué filas serán afectadas.',
          'RETURNING permite ver qué filas fueron modificadas.'
        ],
        deepTheory: [
          'UPDATE sin WHERE afecta todas las filas de una tabla.',
          'Puede combinarse con transacciones para operaciones más seguras.',
          'En sistemas reales se usa para perfiles, progreso, inventario, estados y configuraciones.'
        ],
        analogies: [
          'UPDATE es como corregir una ficha ya existente. No creas una nueva, solo cambias un dato.',
          'WHERE sería decir exactamente qué ficha quieres corregir.'
        ],
        syntax: `UPDATE tabla
SET columna = nuevo_valor
WHERE condicion
RETURNING *;`,
        example: `UPDATE usuarios
SET xp = xp + 20
WHERE id_usuario = 7
RETURNING id_usuario, nombre, xp;`,
        explanation: [
          'Se modifica la tabla usuarios.',
          'SET xp = xp + 20 suma 20 XP al valor actual.',
          'WHERE id_usuario = 7 evita modificar a todos los usuarios.',
          'RETURNING muestra el usuario actualizado.'
        ],
        commonMistakes: [
          'Ejecutar UPDATE sin WHERE.',
          'Actualizar datos sensibles sin revisar primero qué filas serán afectadas.',
          'Confundir una asignación SET con una comparación.'
        ],
        bestPractices: [
          'Antes de un UPDATE importante, prueba el WHERE con SELECT.',
          'Usa RETURNING para confirmar cambios.',
          'En operaciones críticas, usa transacciones.'
        ],
        practice: `UPDATE usuarios
SET xp = xp + 20
WHERE id_usuario = 7
RETURNING nombre, xp;`,
        exercise:
          'Actualiza el XP de un usuario específico y devuelve su nombre y nuevo XP.',
        summary:
          'UPDATE modifica datos. Su seguridad depende de usar bien WHERE.'
      }
    ]
  },

  medio: {
    label: 'Medio',
    icon: Layers,
    colorHint: 'relaciones',
    commands: [
      {
        name: 'JOIN',
        purpose: 'Unir tablas relacionadas.',
        detail:
          'JOIN permite combinar información de varias tablas usando una relación lógica, normalmente una clave primaria y una clave foránea.',
        theory: [
          'JOIN es fundamental en bases de datos relacionales.',
          'INNER JOIN devuelve solo registros con coincidencia.',
          'LEFT JOIN conserva los registros de la tabla izquierda.',
          'ON explica cómo se conectan las tablas.'
        ],
        deepTheory: [
          'JOIN permite responder preguntas que no viven en una sola tabla.',
          'La calidad del modelo relacional afecta directamente qué tan fáciles son tus JOIN.',
          'Los índices en claves foráneas pueden mejorar el rendimiento de consultas con JOIN.'
        ],
        analogies: [
          'JOIN es como juntar dos hojas de Excel usando una columna en común.',
          'Una hoja tiene usuarios y otra tiene su progreso; JOIN te permite ver usuario + progreso juntos.'
        ],
        syntax: `SELECT columnas
FROM tabla_a a
JOIN tabla_b b ON b.id = a.id_relacionado;`,
        example: `SELECT u.nombre, m.titulo
FROM usuarios u
JOIN progreso p ON p.id_usuario = u.id_usuario
JOIN modulos m ON m.id_modulo = p.id_modulo;`,
        explanation: [
          'usuarios se conecta con progreso usando id_usuario.',
          'progreso se conecta con modulos usando id_modulo.',
          'El resultado muestra qué módulos tiene relacionados cada usuario.'
        ],
        commonMistakes: [
          'Olvidar la condición ON.',
          'Unir tablas por columnas incorrectas.',
          'No usar alias y terminar con consultas difíciles de leer.'
        ],
        bestPractices: [
          'Usa alias cortos y claros.',
          'Verifica tus claves primarias y foráneas.',
          'Usa LEFT JOIN cuando necesites conservar registros sin coincidencia.'
        ],
        practice: `SELECT u.nombre, m.titulo
FROM usuarios u
JOIN progreso p ON p.id_usuario = u.id_usuario
JOIN modulos m ON m.id_modulo = p.id_modulo;`,
        exercise:
          'Consulta el nombre del usuario y los módulos que ha desbloqueado.',
        summary:
          'JOIN permite responder preguntas que viven en más de una tabla.'
      },
      {
        name: 'GROUP BY',
        purpose: 'Agrupar filas para calcular métricas.',
        detail:
          'GROUP BY junta filas que comparten un valor para calcular totales, promedios, conteos u otras métricas.',
        theory: [
          'GROUP BY se usa con COUNT, SUM, AVG, MIN y MAX.',
          'Cada grupo produce una fila en el resultado.',
          'Las columnas seleccionadas sin función agregada deben aparecer en GROUP BY.',
          'Es clave para reportes, estadísticas y dashboards.'
        ],
        deepTheory: [
          'GROUP BY cambia el nivel de detalle de la consulta.',
          'Una consulta sin GROUP BY puede mostrar filas individuales.',
          'Una consulta con GROUP BY muestra resúmenes por grupo.'
        ],
        analogies: [
          'GROUP BY es como separar alumnos por salón y luego contar cuántos hay en cada salón.'
        ],
        syntax: `SELECT columna, COUNT(*) AS total
FROM tabla
GROUP BY columna;`,
        example: `SELECT id_modulo, COUNT(*) AS intentos
FROM intentos_sql
GROUP BY id_modulo;`,
        explanation: [
          'Agrupa los intentos por módulo.',
          'COUNT(*) cuenta cuántos intentos existen en cada grupo.',
          'El resultado puede servir para saber qué módulo se practica más.'
        ],
        commonMistakes: [
          'Seleccionar columnas que no están en GROUP BY ni en una función agregada.',
          'Confundir WHERE con HAVING.',
          'Agrupar por demasiadas columnas y fragmentar el resultado.'
        ],
        bestPractices: [
          'Agrupa solo por las columnas necesarias.',
          'Usa alias claros para las métricas.',
          'Combina GROUP BY con ORDER BY.'
        ],
        practice: `SELECT id_modulo, COUNT(*) AS intentos
FROM intentos_sql
GROUP BY id_modulo;`,
        exercise:
          'Cuenta cuántos ejercicios ha resuelto cada usuario.',
        summary:
          'GROUP BY transforma filas individuales en métricas resumidas.'
      },
      {
        name: 'HAVING',
        purpose: 'Filtrar grupos después de agrupar.',
        detail:
          'HAVING filtra resultados agregados. WHERE filtra filas antes de agrupar; HAVING filtra grupos después del GROUP BY.',
        theory: [
          'HAVING se usa cuando la condición depende de una función agregada.',
          'Es común usarlo con COUNT, SUM o AVG.',
          'Permite mostrar solo grupos que cumplen cierta métrica.',
          'No reemplaza a WHERE; ambos pueden usarse juntos.'
        ],
        deepTheory: [
          'WHERE actúa antes del agrupamiento.',
          'HAVING actúa después del agrupamiento.',
          'Por eso HAVING puede usar resultados de COUNT, SUM, AVG, etc.'
        ],
        analogies: [
          'HAVING es como decir: después de contar alumnos por grupo, muéstrame solo los grupos con más de 20 alumnos.'
        ],
        syntax: `SELECT columna, COUNT(*) AS total
FROM tabla
GROUP BY columna
HAVING COUNT(*) >= cantidad;`,
        example: `SELECT id_usuario, COUNT(*) AS resueltos
FROM ejercicios_resueltos
GROUP BY id_usuario
HAVING COUNT(*) >= 5;`,
        explanation: [
          'Primero agrupa ejercicios por usuario.',
          'Luego cuenta cuántos ejercicios resolvió cada usuario.',
          'HAVING muestra solo usuarios con 5 o más ejercicios resueltos.'
        ],
        commonMistakes: [
          'Usar WHERE COUNT(*) >= 5.',
          'Usar HAVING para filtros simples que deberían ir en WHERE.',
          'No entender que HAVING ocurre después del GROUP BY.'
        ],
        bestPractices: [
          'Usa WHERE para filtrar filas normales.',
          'Usa HAVING para filtrar métricas agregadas.',
          'Escribe la función agregada de forma clara.'
        ],
        practice: `SELECT id_usuario, COUNT(*) AS resueltos
FROM ejercicios_resueltos
GROUP BY id_usuario
HAVING COUNT(*) >= 5;`,
        exercise:
          'Muestra los módulos que tengan más de 20 intentos registrados.',
        summary:
          'HAVING filtra grupos, no filas individuales.'
      }
    ]
  },

  avanzado: {
    label: 'Avanzado',
    icon: Gauge,
    colorHint: 'optimización',
    commands: [
      {
        name: 'EXPLAIN ANALYZE',
        purpose: 'Ver cómo PostgreSQL ejecuta una consulta.',
        detail:
          'EXPLAIN ANALYZE muestra el plan real de ejecución de una consulta y cuánto tiempo tomó cada parte.',
        theory: [
          'EXPLAIN muestra el plan estimado.',
          'EXPLAIN ANALYZE ejecuta la consulta y muestra tiempos reales.',
          'BUFFERS ayuda a ver lectura de memoria y disco.',
          'Es esencial para diagnosticar consultas lentas.'
        ],
        deepTheory: [
          'El plan de ejecución muestra cómo PostgreSQL decidió resolver tu consulta.',
          'Puedes detectar si una consulta usa índices o escanea toda la tabla.',
          'También puedes comparar estimaciones contra resultados reales.'
        ],
        analogies: [
          'EXPLAIN ANALYZE es como pedirle a PostgreSQL que te enseñe la ruta que tomó para encontrar una respuesta.'
        ],
        syntax: `EXPLAIN (ANALYZE, BUFFERS)
SELECT columnas
FROM tabla
WHERE condicion;`,
        example: `EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM usuarios
WHERE email ILIKE '%@correo.com';`,
        explanation: [
          'PostgreSQL ejecuta la consulta realmente.',
          'Muestra si usó sequential scan, index scan u otro método.',
          'Permite detectar si falta un índice o si la condición es costosa.'
        ],
        commonMistakes: [
          'Usarlo en DELETE, UPDATE o INSERT sin cuidado porque ANALYZE sí ejecuta.',
          'Ver solo el costo y no revisar el tiempo real.',
          'Crear índices sin entender el plan de ejecución.'
        ],
        bestPractices: [
          'Úsalo en consultas lentas antes de optimizar.',
          'Compara el plan antes y después de crear índices.',
          'Revisa filas estimadas contra filas reales.'
        ],
        practice: `EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM usuarios
WHERE email ILIKE '%@correo.com';`,
        exercise:
          'Ejecuta EXPLAIN ANALYZE sobre una consulta con WHERE y revisa si usa índice.',
        summary:
          'EXPLAIN ANALYZE te permite ver lo que PostgreSQL realmente está haciendo.'
      },
      {
        name: 'INDEX',
        purpose: 'Acelerar búsquedas frecuentes.',
        detail:
          'Un índice es una estructura auxiliar que permite encontrar datos más rápido, especialmente en columnas usadas en WHERE, JOIN y ORDER BY.',
        theory: [
          'El índice más común en PostgreSQL es B-tree.',
          'Un índice acelera lecturas, pero puede hacer más lentas las escrituras.',
          'No todos los filtros aprovechan índices.',
          'Los índices deben crearse según consultas reales.'
        ],
        deepTheory: [
          'Un índice ocupa espacio adicional.',
          'Cada INSERT, UPDATE o DELETE puede tener costo extra si hay muchos índices.',
          'Los índices son más útiles cuando una columna se consulta frecuentemente.'
        ],
        analogies: [
          'Un índice es como el índice de un libro: en vez de revisar página por página, vas directo al tema.'
        ],
        syntax: `CREATE INDEX nombre_indice
ON tabla (columna);`,
        example: `CREATE INDEX idx_usuarios_email
ON usuarios (email);`,
        explanation: [
          'Se crea un índice sobre la columna email.',
          'Las búsquedas por email pueden volverse más rápidas.',
          'PostgreSQL decidirá si conviene usar el índice según el tamaño y estadísticas.'
        ],
        commonMistakes: [
          'Crear índices para todas las columnas.',
          'No medir con EXPLAIN ANALYZE.',
          'Esperar que un índice ayude en búsquedas con comodín inicial como ILIKE %texto.'
        ],
        bestPractices: [
          'Indexa columnas usadas frecuentemente en filtros o joins.',
          'Mide antes y después.',
          'Elimina índices que no se usan.'
        ],
        practice: `CREATE INDEX idx_usuarios_email
ON usuarios (email);`,
        exercise:
          'Crea un índice para acelerar búsquedas por id_modulo en una tabla de progreso.',
        summary:
          'Los índices aceleran consultas, pero deben diseñarse con intención.'
      },
      {
        name: 'JSONB',
        purpose: 'Guardar datos flexibles consultables.',
        detail:
          'JSONB permite guardar datos semiestructurados dentro de PostgreSQL sin abandonar el motor relacional.',
        theory: [
          'JSONB guarda JSON en formato binario optimizado.',
          'Permite consultar propiedades internas.',
          'Es útil para preferencias, perfiles o configuraciones.',
          'No debe reemplazar tablas relacionales cuando el dato tiene estructura fija.'
        ],
        deepTheory: [
          'JSONB da flexibilidad, pero usarlo para todo puede empeorar el diseño.',
          'Para relaciones importantes, conviene usar tablas normales.',
          'Para configuraciones variables, JSONB puede ser muy útil.'
        ],
        analogies: [
          'JSONB es como guardar una mochila flexible dentro de una fila: puede traer distintos objetos y aún puedes revisar qué contiene.'
        ],
        syntax: `SELECT columna_jsonb->>'propiedad'
FROM tabla
WHERE columna_jsonb @> '{"clave": "valor"}'::jsonb;`,
        example: `SELECT perfil->>'pais' AS pais
FROM usuarios
WHERE perfil @> '{"rol": "alumno"}'::jsonb;`,
        explanation: [
          'perfil->>pais extrae el país como texto.',
          '@> verifica si el JSON contiene cierta estructura.',
          '::jsonb convierte el texto a JSONB para comparar correctamente.'
        ],
        commonMistakes: [
          'Guardar todo como JSONB y perder relaciones importantes.',
          'Confundir -> con ->>.',
          'No crear índices GIN cuando consultas JSONB frecuentemente.'
        ],
        bestPractices: [
          'Usa JSONB para partes flexibles del modelo.',
          'Mantén en columnas normales los datos importantes para relaciones.',
          'Considera índices GIN para búsquedas frecuentes.'
        ],
        practice: `SELECT perfil->>'pais' AS pais
FROM usuarios
WHERE perfil @> '{"rol": "alumno"}'::jsonb;`,
        exercise:
          'Consulta usuarios cuyo perfil JSONB tenga el campo rol con valor alumno.',
        summary:
          'JSONB da flexibilidad, pero debe usarse con criterio.'
      }
    ]
  }
};

export const USE_CASES = [
  {
    icon: Server,
    label: 'APIs con reglas fuertes',
    text: 'Usuarios, pagos, permisos y progreso necesitan consistencia.'
  },
  {
    icon: FileJson,
    label: 'Datos híbridos',
    text: 'JSONB permite flexibilidad sin cambiar de motor.'
  },
  {
    icon: Search,
    label: 'Búsqueda y análisis',
    text: 'Índices, vistas y EXPLAIN ayudan a escalar consultas.'
  },
  {
    icon: KeyRound,
    label: 'Seguridad',
    text: 'Roles, permisos y transacciones hacen controlable el acceso.'
  }
];

export const getTierKeys = () => Object.keys(COMMAND_TIERS);

export const buildBookPagesFromCommand = (command) => {
  if (!command) return [];

  const pages = [
    {
      id: 'cover',
      kicker: 'Capítulo',
      title: command.name,
      subtitle: command.purpose,
      narration: `${command.name}. ${command.detail}`,
      blocks: [
        {
          type: 'quote',
          content: command.detail
        },
        {
          type: 'paragraph',
          content:
            'En este capítulo vas a entender qué hace este comando, cuándo conviene usarlo y qué errores debes evitar.'
        }
      ]
    },
    {
      id: 'what-is',
      kicker: 'Teoría',
      title: `¿Qué es ${command.name}?`,
      subtitle: 'La idea principal antes del código',
      narration: command.detail,
      blocks: [
        {
          type: 'paragraph',
          content: command.detail
        },
        {
          type: 'bullets',
          title: 'Ideas clave',
          items: command.theory || []
        }
      ]
    },
    {
      id: 'deep-theory',
      kicker: 'Profundización',
      title: `${command.name} a profundidad`,
      subtitle: 'Lo que pasa detrás de la instrucción',
      narration: (command.deepTheory || []).join(' '),
      blocks: [
        {
          type: 'bullets',
          title: 'Teoría profunda',
          items: command.deepTheory || []
        }
      ]
    },
    {
      id: 'analogy',
      kicker: 'Analogía',
      title: `${command.name} explicado fácil`,
      subtitle: 'Una forma humana de entenderlo',
      narration: (command.analogies || []).join(' '),
      blocks: [
        {
          type: 'bullets',
          title: 'Analogías',
          items: command.analogies || []
        }
      ]
    },
    {
      id: 'syntax',
      kicker: 'Sintaxis',
      title: `Cómo se escribe ${command.name}`,
      subtitle: 'La estructura base del comando',
      narration: `Ahora veremos la sintaxis de ${command.name}. La sintaxis es la forma correcta de escribir el comando.`,
      blocks: [
        {
          type: 'code',
          label: 'sintaxis.sql',
          content: command.syntax || command.practice || ''
        },
        {
          type: 'paragraph',
          content:
            'La sintaxis es el molde. Después cambias nombres de tablas, columnas y condiciones según tu base de datos.'
        }
      ]
    },
    {
      id: 'example',
      kicker: 'Ejemplo',
      title: `Ejemplo real de ${command.name}`,
      subtitle: 'Aplicado como en un proyecto',
      narration: `Veamos un ejemplo práctico de ${command.name}.`,
      blocks: [
        {
          type: 'code',
          label: 'ejemplo_real.sql',
          content: command.example || command.practice || ''
        },
        {
          type: 'bullets',
          title: 'Explicación paso a paso',
          items: command.explanation || []
        }
      ]
    },
    {
      id: 'mistakes',
      kicker: 'Cuidado',
      title: `Errores comunes con ${command.name}`,
      subtitle: 'Lo que suele romper consultas',
      narration: `Estos son errores comunes al usar ${command.name}.`,
      blocks: [
        {
          type: 'bullets',
          title: 'Errores frecuentes',
          items: command.commonMistakes || []
        }
      ]
    },
    {
      id: 'best-practices',
      kicker: 'Buenas prácticas',
      title: `Cómo usar bien ${command.name}`,
      subtitle: 'Consejos para escribir SQL más limpio',
      narration: `Estas son buenas prácticas para usar ${command.name}.`,
      blocks: [
        {
          type: 'bullets',
          title: 'Recomendaciones',
          items: command.bestPractices || []
        }
      ]
    },
    {
      id: 'practice',
      kicker: 'Práctica',
      title: `Practica ${command.name}`,
      subtitle: 'Ahora te toca pensarlo',
      narration: command.exercise || command.summary || '',
      blocks: [
        {
          type: 'paragraph',
          title: 'Reto',
          content: command.exercise || ''
        },
        {
          type: 'code',
          label: 'practica.sql',
          content: command.practice || ''
        },
        {
          type: 'callout',
          title: 'Mini resumen',
          content: command.summary || ''
        }
      ]
    }
  ];

  return pages.filter((page) =>
    page.blocks?.some((block) => {
      if (block.type === 'paragraph') return Boolean(block.content);
      if (block.type === 'quote') return Boolean(block.content);
      if (block.type === 'callout') return Boolean(block.content);
      if (block.type === 'code') return Boolean(block.content);
      if (block.type === 'bullets') return Boolean(block.items?.length);
      return false;
    })
  );
};