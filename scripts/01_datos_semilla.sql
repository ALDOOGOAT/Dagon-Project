-- Dagon - datos semilla seguros
--
-- Este archivo contiene catalogos y contenido pedagogico base.
-- No incluye usuarios reales, password_hash reales, intentos, auditoria historica
-- ni esquemas sandbox_usuario_<uuid>.
-- Los ejercicios completos estan separados en scripts/02_ejercicios_semilla.sql.

BEGIN;

INSERT INTO lms_core.roles (id_rol, nombre) OVERRIDING SYSTEM VALUE VALUES
    (1, 'alumno'),
    (2, 'docente'),
    (3, 'admin')
ON CONFLICT (nombre) DO UPDATE
SET nombre = EXCLUDED.nombre;

INSERT INTO lms_core.cursos (id_curso, titulo) OVERRIDING SYSTEM VALUE VALUES
    (1, 'Senda del Guerrero: Administracion SQL'),
    (2, 'Senda del Arquitecto: Diseno de BD')
ON CONFLICT (id_curso) DO UPDATE
SET titulo = EXCLUDED.titulo;

INSERT INTO lms_core.modulos (
    id_modulo,
    id_curso,
    titulo,
    orden,
    descripcion,
    xp_requerida,
    objetivos,
    prerequisitos,
    errores_comunes,
    cinematica_config
) OVERRIDING SYSTEM VALUE VALUES
    (
        1,
        2,
        'Modulo 1: Teoria de Conjuntos',
        1,
        'Aprende a pensar en SQL como matematico: conjuntos, intersecciones y uniones.',
        0,
        '["Entender tablas como conjuntos de filas", "Usar SELECT, WHERE, AND, OR e IN", "Relacionar filtros SQL con operaciones de conjuntos"]'::jsonb,
        '["Lectura basica de tablas", "Concepto visual de conjunto y subconjunto"]'::jsonb,
        '["Confundir AND con OR", "Olvidar el punto y coma", "Usar texto sin comillas simples"]'::jsonb,
        '{"slug":"teoria-conjuntos","duracion_segundos":90,"escenas":["universo","subconjunto","interseccion","union","cierre"],"narrador":"dagon","objetivo_visual":"mostrar filas entrando y saliendo de conjuntos"}'::jsonb
    ),
    (
        2,
        2,
        'Modulo 2: Manipulacion de Datos',
        2,
        'El CRUD: el poder y peligro de INSERT, UPDATE y DELETE.',
        80,
        '["Distinguir CREATE, READ, UPDATE y DELETE", "Modificar datos con condiciones seguras", "Entender por que RETURNING ayuda a verificar cambios"]'::jsonb,
        '["SELECT basico", "Filtros con WHERE"]'::jsonb,
        '["Ejecutar UPDATE o DELETE sin WHERE", "No verificar la fila afectada", "Confundir INSERT con SELECT"]'::jsonb,
        '{"slug":"crud","duracion_segundos":105,"escenas":["crear","leer","actualizar","eliminar","verificar"],"narrador":"dagon","objetivo_visual":"mostrar consecuencias de cambiar datos"}'::jsonb
    ),
    (
        3,
        2,
        'Modulo 3: El Arquitecto y los Vinculos',
        3,
        'Diseno y relaciones: teoria MER, DDL, llaves primarias/foraneas y JOINs.',
        180,
        '["Relacionar entidades con llaves", "Construir consultas con JOIN", "Crear estructuras simples con DDL"]'::jsonb,
        '["CRUD basico", "Identificacion de columnas clave"]'::jsonb,
        '["Unir tablas por columnas incorrectas", "Confundir PK con FK", "Crear tablas sin clave primaria"]'::jsonb,
        '{"slug":"arquitecto-vinculos","duracion_segundos":120,"escenas":["entidades","llaves","relaciones","join","ddl"],"narrador":"dagon","objetivo_visual":"convertir un diagrama en tablas conectadas"}'::jsonb
    ),
    (
        4,
        2,
        'Modulo 4: La Prueba de Dagon',
        4,
        'Reto final: disena, construye, puebla y consulta un negocio desde cero.',
        300,
        '["Integrar diseno MER y SQL", "Crear una solucion de varias tablas", "Consultar datos relacionados"]'::jsonb,
        '["MER", "DDL", "JOIN", "Filtros"]'::jsonb,
        '["Disenar relaciones incompletas", "Crear tablas sin orden logico", "Probar consultas antes de tener datos"]'::jsonb,
        '{"slug":"prueba-dagon","duracion_segundos":130,"escenas":["reto","plano","construccion","consulta","cierre"],"narrador":"dagon","objetivo_visual":"mostrar el ciclo completo de una base de datos"}'::jsonb
    ),
    (
        5,
        1,
        'Modulo 5: Los Sellos Sagrados',
        1,
        'Constraints y secuencias: domina las reglas que mantienen la integridad de tus datos.',
        0,
        '["Crear tablas con reglas", "Usar PRIMARY KEY", "Comprender DEFAULT y NOT NULL"]'::jsonb,
        '["Tablas y columnas", "INSERT basico"]'::jsonb,
        '["Confundir constraint con dato", "Olvidar nombres de constraints", "No probar valores invalidos"]'::jsonb,
        '{"slug":"sellos-sagrados","duracion_segundos":100,"escenas":["reglas","primary-key","not-null","default","practica"],"narrador":"dagon","objetivo_visual":"representar constraints como sellos de seguridad"}'::jsonb
    ),
    (
        6,
        1,
        'Modulo 6: Sellos de Validacion',
        2,
        'UNIQUE, CHECK y DEFAULT: validacion de reglas de negocio.',
        50,
        '["Aplicar UNIQUE", "Aplicar CHECK", "Usar DEFAULT para valores automaticos"]'::jsonb,
        '["Constraints basicos", "ALTER TABLE"]'::jsonb,
        '["Crear CHECK demasiado permisivo", "Repetir nombres unicos", "Esperar DEFAULT cuando se manda NULL explicito"]'::jsonb,
        '{"slug":"sellos-validacion","duracion_segundos":95,"escenas":["unique","check","default","errores","cierre"],"narrador":"dagon","objetivo_visual":"mostrar datos aceptados y rechazados por reglas"}'::jsonb
    ),
    (
        7,
        1,
        'Modulo 7: El Generador de IDs',
        3,
        'SERIAL, BIGSERIAL y secuencias: IDs automaticos.',
        100,
        '["Entender secuencias", "Usar nextval y currval", "Reconocer SERIAL como atajo de secuencia"]'::jsonb,
        '["PRIMARY KEY", "INSERT"]'::jsonb,
        '["Llamar currval antes de nextval", "Reiniciar secuencias sin cuidado", "Confundir ID con posicion visual"]'::jsonb,
        '{"slug":"generador-ids","duracion_segundos":90,"escenas":["ticket","serial","nextval","currval","cierre"],"narrador":"dagon","objetivo_visual":"mostrar IDs saliendo de una maquina de tickets"}'::jsonb
    ),
    (
        8,
        1,
        'Modulo 8: Los Filtros de Precision',
        4,
        'BETWEEN, IN, IS NULL: filtros avanzados.',
        150,
        '["Filtrar rangos con BETWEEN", "Comparar listas con IN", "Detectar valores NULL"]'::jsonb,
        '["WHERE", "Operadores de comparacion"]'::jsonb,
        '["Usar = NULL", "Creer que BETWEEN excluye extremos", "Confundir IN con LIKE"]'::jsonb,
        '{"slug":"filtros-precision","duracion_segundos":90,"escenas":["rango","lista","null","combinacion","cierre"],"narrador":"dagon","objetivo_visual":"usar lupas para seleccionar filas especificas"}'::jsonb
    ),
    (
        9,
        1,
        'Modulo 9: Las Ventanas Magicas',
        5,
        'Vistas: atajos que muestran datos sin cambiar la fuente.',
        200,
        '["Crear vistas", "Consultar vistas", "Eliminar vistas sin afectar tablas base"]'::jsonb,
        '["SELECT", "JOIN"]'::jsonb,
        '["Pensar que una vista duplica datos siempre", "Olvidar permisos de vista", "Cambiar la tabla base sin revisar la vista"]'::jsonb,
        '{"slug":"vistas","duracion_segundos":95,"escenas":["tabla-base","ventana","vista-join","consulta","cierre"],"narrador":"dagon","objetivo_visual":"mostrar una ventana que observa tablas reales"}'::jsonb
    ),
    (
        10,
        1,
        'Modulo 10: Los Planos del Gremio',
        6,
        'information_schema: consultar metadatos.',
        250,
        '["Explorar tablas", "Explorar columnas", "Explorar constraints y secuencias"]'::jsonb,
        '["Vistas", "Estructura de tablas"]'::jsonb,
        '["Confundir metadatos con datos de negocio", "Filtrar por esquema incorrecto", "No usar current_schema"]'::jsonb,
        '{"slug":"information-schema","duracion_segundos":100,"escenas":["catalogo","tablas","columnas","constraints","cierre"],"narrador":"dagon","objetivo_visual":"abrir planos internos de PostgreSQL"}'::jsonb
    ),
    (
        11,
        1,
        'Modulo 11: Patrones de Busqueda',
        7,
        'LIKE, SIMILAR TO: busquedas con patrones.',
        300,
        '["Usar comodines de LIKE", "Buscar prefijos y sufijos", "Negar patrones con NOT LIKE"]'::jsonb,
        '["WHERE", "Texto entre comillas"]'::jsonb,
        '["Olvidar el porcentaje", "Confundir mayusculas y minusculas", "Buscar patrones sin comillas"]'::jsonb,
        '{"slug":"patrones-busqueda","duracion_segundos":90,"escenas":["prefijo","sufijo","contiene","negacion","cierre"],"narrador":"dagon","objetivo_visual":"mostrar patrones como runas que encajan con textos"}'::jsonb
    ),
    (
        12,
        1,
        'Modulo 12: Los Hechizos Automaticos',
        8,
        'Funciones: codigo reutilizable que devuelve resultados.',
        350,
        '["Crear funciones SQL", "Recibir parametros", "Devolver valores o tablas"]'::jsonb,
        '["SELECT", "Tipos de datos", "Expresiones"]'::jsonb,
        '["No declarar tipos de retorno", "Confundir funcion con procedimiento", "Olvidar probar con SELECT"]'::jsonb,
        '{"slug":"funciones","duracion_segundos":110,"escenas":["entrada","proceso","salida","tabla","cierre"],"narrador":"dagon","objetivo_visual":"representar funciones como hechizos reutilizables"}'::jsonb
    ),
    (
        13,
        1,
        'Modulo 13: Rituales Programados',
        9,
        'Procedures y bloques PL/pgSQL que ejecutan multiples acciones.',
        400,
        '["Usar bloques procedural", "Declarar variables", "Ejecutar multiples inserts de forma controlada"]'::jsonb,
        '["Funciones", "INSERT", "Transacciones basicas"]'::jsonb,
        '["No capturar IDs generados", "Mezclar comillas SQL y PL/pgSQL", "No pensar en fallos parciales"]'::jsonb,
        '{"slug":"procedural","duracion_segundos":115,"escenas":["bloque","variable","insert","retorno","cierre"],"narrador":"dagon","objetivo_visual":"mostrar acciones encadenadas como ritual"}'::jsonb
    ),
    (
        14,
        1,
        'Modulo 14: Los Gatillos Magicos',
        10,
        'Triggers: codigo que se ejecuta automaticamente.',
        450,
        '["Crear funciones trigger", "Crear triggers AFTER y BEFORE", "Auditar o validar cambios"]'::jsonb,
        '["Funciones PL/pgSQL", "INSERT", "Constraints"]'::jsonb,
        '["Olvidar RETURN NEW", "Crear trigger sobre tabla equivocada", "No controlar recursividad"]'::jsonb,
        '{"slug":"triggers","duracion_segundos":120,"escenas":["evento","funcion-trigger","after","before","auditoria"],"narrador":"dagon","objetivo_visual":"mostrar acciones automaticas despues de un cambio"}'::jsonb
    ),
    (
        15,
        1,
        'Modulo 15: Viaje Temporal',
        11,
        'BEGIN, COMMIT, ROLLBACK: control de transacciones.',
        500,
        '["Abrir transacciones", "Confirmar cambios", "Deshacer cambios completos o parciales"]'::jsonb,
        '["INSERT", "UPDATE", "DELETE"]'::jsonb,
        '["Olvidar COMMIT", "Creer que ROLLBACK borra datos ya confirmados", "Confundir SAVEPOINT con copia completa"]'::jsonb,
        '{"slug":"transacciones","duracion_segundos":125,"escenas":["begin","cambio-pendiente","commit","rollback","savepoint"],"narrador":"dagon","objetivo_visual":"mostrar una linea de tiempo reversible"}'::jsonb
    ),
    (
        16,
        1,
        'Modulo 16: Cerrojos de Filas',
        12,
        'FOR UPDATE, LOCK: bloqueo pesimista.',
        550,
        '["Entender bloqueos de fila", "Usar FOR UPDATE", "Reconocer NOWAIT"]'::jsonb,
        '["Transacciones", "SELECT"]'::jsonb,
        '["Bloquear mas filas de las necesarias", "No cerrar la transaccion", "Confundir bloqueo con permiso"]'::jsonb,
        '{"slug":"bloqueos","duracion_segundos":105,"escenas":["fila","cerrojo","sesion-a","sesion-b","nowait"],"narrador":"dagon","objetivo_visual":"mostrar dos sesiones compitiendo por una fila"}'::jsonb
    ),
    (
        17,
        1,
        'Modulo 17: Algebra Relacional',
        13,
        'UNION, INTERSECT, EXCEPT: operaciones de conjuntos.',
        600,
        '["Combinar resultados con UNION", "Encontrar coincidencias con INTERSECT", "Restar conjuntos con EXCEPT"]'::jsonb,
        '["SELECT", "Teoria de conjuntos"]'::jsonb,
        '["No alinear columnas", "Esperar duplicados en UNION", "Confundir EXCEPT con NOT LIKE"]'::jsonb,
        '{"slug":"algebra-relacional","duracion_segundos":100,"escenas":["union","union-all","intersect","except","cierre"],"narrador":"dagon","objetivo_visual":"volver a los conjuntos con consultas reales"}'::jsonb
    ),
    (
        18,
        1,
        'Modulo 18: Roles del Gremio',
        14,
        'CREATE ROLE, GRANT, REVOKE: control de acceso.',
        650,
        '["Consultar roles", "Entender privilegios", "Distinguir rol actual y sesion"]'::jsonb,
        '["information_schema", "Seguridad basica"]'::jsonb,
        '["Dar privilegios excesivos", "Confundir usuario de app con usuario sandbox", "Revisar permisos en esquema incorrecto"]'::jsonb,
        '{"slug":"roles-permisos","duracion_segundos":110,"escenas":["roles","grant","revoke","current-user","cierre"],"narrador":"dagon","objetivo_visual":"mostrar llaves de acceso por rol"}'::jsonb
    ),
    (
        19,
        1,
        'Modulo 19: Seguridad a Nivel de Fila',
        15,
        'Row Level Security: cada usuario ve solo sus datos.',
        700,
        '["Entender aislamiento por usuario", "Explorar search_path", "Relacionar seguridad con contexto"]'::jsonb,
        '["Roles", "Esquemas", "Permisos"]'::jsonb,
        '["Creer que RLS reemplaza permisos", "Olvidar politicas", "Probar con el rol incorrecto"]'::jsonb,
        '{"slug":"row-level-security","duracion_segundos":120,"escenas":["usuario-a","usuario-b","politica","aislamiento","cierre"],"narrador":"dagon","objetivo_visual":"mostrar capas de visibilidad por usuario"}'::jsonb
    ),
    (
        20,
        1,
        'Modulo 20: Proyecto Final',
        16,
        'Integracion de todo lo aprendido.',
        800,
        '["Construir una solucion completa", "Usar constraints, funciones, vistas y transacciones", "Explicar decisiones de diseno"]'::jsonb,
        '["Todos los modulos anteriores"]'::jsonb,
        '["Resolver sin plan", "No validar datos borde", "No explicar decisiones tecnicas"]'::jsonb,
        '{"slug":"proyecto-final","duracion_segundos":140,"escenas":["brief","modelo","implementacion","validacion","presentacion"],"narrador":"dagon","objetivo_visual":"mostrar el camino completo hasta una entrega defendible"}'::jsonb
    )
ON CONFLICT (id_modulo) DO UPDATE
SET id_curso = EXCLUDED.id_curso,
    titulo = EXCLUDED.titulo,
    orden = EXCLUDED.orden,
    descripcion = EXCLUDED.descripcion,
    xp_requerida = EXCLUDED.xp_requerida,
    objetivos = EXCLUDED.objetivos,
    prerequisitos = EXCLUDED.prerequisitos,
    errores_comunes = EXCLUDED.errores_comunes,
    cinematica_config = EXCLUDED.cinematica_config;

INSERT INTO lms_sandbox_template.aventureros (id_aventurero, nombre, clase, nivel) OVERRIDING SYSTEM VALUE VALUES
    (1, 'Loya', 'Caballero', 15),
    (2, 'Zoe', 'Maga Suprema', 20),
    (3, 'Jared', 'Arquero', 8),
    (4, 'Aldo', 'Guerrero', 30),
    (5, 'Dan', 'Asesino', 25),
    (6, 'Gimli', 'Guerrero', NULL)
ON CONFLICT (id_aventurero) DO UPDATE
SET nombre = EXCLUDED.nombre,
    clase = EXCLUDED.clase,
    nivel = EXCLUDED.nivel;

INSERT INTO lms_sandbox_template.equipamiento (id_equipo, id_aventurero, item, precio) OVERRIDING SYSTEM VALUE VALUES
    (1, 1, 'Espada Larga', 150),
    (2, 1, 'Escudo de Hierro', 100),
    (3, 2, 'Baculo de Fuego', 300),
    (4, 4, 'Hacha Doble', 200),
    (5, 5, 'Daga Venenosa', 120)
ON CONFLICT (id_equipo) DO UPDATE
SET id_aventurero = EXCLUDED.id_aventurero,
    item = EXCLUDED.item,
    precio = EXCLUDED.precio;

INSERT INTO lms_sandbox_template.habitaciones (id, numero, tipo, precio_noche) OVERRIDING SYSTEM VALUE VALUES
    (1, 101, 'Simple', 50.00),
    (2, 102, 'Simple', 55.00),
    (3, 201, 'Suite', 150.00),
    (4, 301, 'Imperial', 500.00)
ON CONFLICT (id) DO UPDATE
SET numero = EXCLUDED.numero,
    tipo = EXCLUDED.tipo,
    precio_noche = EXCLUDED.precio_noche;

INSERT INTO lms_sandbox_template.huespedes (id, nombre, nivel_aventurero) OVERRIDING SYSTEM VALUE VALUES
    (1, 'Loya', 15),
    (2, 'Zoe', 20),
    (3, 'Jared', 8),
    (4, 'Aldo', 30)
ON CONFLICT (id) DO UPDATE
SET nombre = EXCLUDED.nombre,
    nivel_aventurero = EXCLUDED.nivel_aventurero;

INSERT INTO lms_sandbox_template.reservas (id, fecha_entrada, id_huesped, id_habitacion) OVERRIDING SYSTEM VALUE VALUES
    (1, '2026-04-20', 1, 1),
    (2, '2026-04-21', 2, 3),
    (3, '2026-04-22', 4, 4),
    (4, '2026-04-23', 1, 2)
ON CONFLICT (id) DO UPDATE
SET fecha_entrada = EXCLUDED.fecha_entrada,
    id_huesped = EXCLUDED.id_huesped,
    id_habitacion = EXCLUDED.id_habitacion;

INSERT INTO lms_sandbox.aventureros (id_aventurero, nombre, clase, nivel) OVERRIDING SYSTEM VALUE
SELECT id_aventurero, nombre, clase, nivel
FROM lms_sandbox_template.aventureros
ON CONFLICT (id_aventurero) DO UPDATE
SET nombre = EXCLUDED.nombre,
    clase = EXCLUDED.clase,
    nivel = EXCLUDED.nivel;

INSERT INTO lms_sandbox.equipamiento (id_equipo, id_aventurero, item, precio) OVERRIDING SYSTEM VALUE
SELECT id_equipo, id_aventurero, item, precio
FROM lms_sandbox_template.equipamiento
ON CONFLICT (id_equipo) DO UPDATE
SET id_aventurero = EXCLUDED.id_aventurero,
    item = EXCLUDED.item,
    precio = EXCLUDED.precio;

INSERT INTO lms_sandbox.habitaciones (id, numero, tipo, precio_noche) OVERRIDING SYSTEM VALUE
SELECT id, numero, tipo, precio_noche
FROM lms_sandbox_template.habitaciones
ON CONFLICT (id) DO UPDATE
SET numero = EXCLUDED.numero,
    tipo = EXCLUDED.tipo,
    precio_noche = EXCLUDED.precio_noche;

INSERT INTO lms_sandbox.huespedes (id, nombre, nivel_aventurero) OVERRIDING SYSTEM VALUE
SELECT id, nombre, nivel_aventurero
FROM lms_sandbox_template.huespedes
ON CONFLICT (id) DO UPDATE
SET nombre = EXCLUDED.nombre,
    nivel_aventurero = EXCLUDED.nivel_aventurero;

INSERT INTO lms_sandbox.reservas (id, fecha_entrada, id_huesped, id_habitacion) OVERRIDING SYSTEM VALUE
SELECT id, fecha_entrada, id_huesped, id_habitacion
FROM lms_sandbox_template.reservas
ON CONFLICT (id) DO UPDATE
SET fecha_entrada = EXCLUDED.fecha_entrada,
    id_huesped = EXCLUDED.id_huesped,
    id_habitacion = EXCLUDED.id_habitacion;

INSERT INTO lms_core.cursos (id_curso, titulo) OVERRIDING SYSTEM VALUE VALUES
    (3, 'Misterios de Dagon'),
    (4, 'Laboratorio de Modelado')
ON CONFLICT (id_curso) DO UPDATE
SET titulo = EXCLUDED.titulo;

INSERT INTO lms_core.modulos (
    id_modulo, id_curso, titulo, orden, descripcion, xp_requerida,
    objetivos, prerequisitos, errores_comunes, cinematica_config
) OVERRIDING SYSTEM VALUE VALUES
    (21, 3, 'Misterio 1: Fraude en el Banco Abisal', 1,
     'Investiga un millon de transferencias simuladas. Las consultas ingenuas se castigan con timeout; las buenas reducen filas temprano.',
     0,
     '["Leer planes de ejecucion", "Crear indices utiles", "Filtrar datos masivos", "Usar CTEs y window functions para investigar fraude"]'::jsonb,
     '["SELECT con WHERE", "CREATE INDEX", "ORDER BY y LIMIT", "Funciones de ventana basicas"]'::jsonb,
     '["Escanear un millon de filas sin filtro", "Crear indices sobre columnas que no reducen", "Ordenar todo antes de filtrar", "Usar SELECT * en investigaciones masivas"]'::jsonb,
     '{"slug":"misterio-fraude-bancario","duracion_segundos":130,"escenas":["dataset","timeout","indice","filtro","hallazgo"],"narrador":"dagon","objetivo_visual":"mostrar una investigacion de fraude sobre datos grandes"}'::jsonb),
    (22, 4, 'Laboratorio 1: DDL a ERD', 1,
     'Convierte sentencias CREATE TABLE y FOREIGN KEY en un diagrama ERD y vuelve a generar DDL desde el modelo.',
     0,
     '["Escribir CREATE TABLE con llaves", "Visualizar relaciones", "Hacer ingenieria inversa desde SQL", "Generar DDL desde un diagrama"]'::jsonb,
     '["Tablas", "PRIMARY KEY", "FOREIGN KEY"]'::jsonb,
     '["Crear tablas aisladas sin FK", "Usar nombres ambiguos", "Olvidar la PK antes de una relacion"]'::jsonb,
     '{"slug":"laboratorio-ddl-erd","duracion_segundos":110,"escenas":["sql","parser","entidades","relaciones","ddl"],"narrador":"dagon","objetivo_visual":"convertir codigo SQL en plano visual"}'::jsonb)
ON CONFLICT (id_modulo) DO UPDATE SET
    id_curso = EXCLUDED.id_curso,
    titulo = EXCLUDED.titulo,
    orden = EXCLUDED.orden,
    descripcion = EXCLUDED.descripcion,
    xp_requerida = EXCLUDED.xp_requerida,
    objetivos = EXCLUDED.objetivos,
    prerequisitos = EXCLUDED.prerequisitos,
    errores_comunes = EXCLUDED.errores_comunes,
    cinematica_config = EXCLUDED.cinematica_config;

SELECT setval(pg_get_serial_sequence('lms_core.roles', 'id_rol'), COALESCE((SELECT MAX(id_rol) FROM lms_core.roles), 1), true);
SELECT setval(pg_get_serial_sequence('lms_core.cursos', 'id_curso'), COALESCE((SELECT MAX(id_curso) FROM lms_core.cursos), 1), true);
SELECT setval(pg_get_serial_sequence('lms_core.modulos', 'id_modulo'), COALESCE((SELECT MAX(id_modulo) FROM lms_core.modulos), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox_template.aventureros', 'id_aventurero'), COALESCE((SELECT MAX(id_aventurero) FROM lms_sandbox_template.aventureros), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox_template.equipamiento', 'id_equipo'), COALESCE((SELECT MAX(id_equipo) FROM lms_sandbox_template.equipamiento), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox_template.habitaciones', 'id'), COALESCE((SELECT MAX(id) FROM lms_sandbox_template.habitaciones), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox_template.huespedes', 'id'), COALESCE((SELECT MAX(id) FROM lms_sandbox_template.huespedes), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox_template.reservas', 'id'), COALESCE((SELECT MAX(id) FROM lms_sandbox_template.reservas), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox.aventureros', 'id_aventurero'), COALESCE((SELECT MAX(id_aventurero) FROM lms_sandbox.aventureros), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox.equipamiento', 'id_equipo'), COALESCE((SELECT MAX(id_equipo) FROM lms_sandbox.equipamiento), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox.habitaciones', 'id'), COALESCE((SELECT MAX(id) FROM lms_sandbox.habitaciones), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox.huespedes', 'id'), COALESCE((SELECT MAX(id) FROM lms_sandbox.huespedes), 1), true);
SELECT setval(pg_get_serial_sequence('lms_sandbox.reservas', 'id'), COALESCE((SELECT MAX(id) FROM lms_sandbox.reservas), 1), true);

COMMIT;
