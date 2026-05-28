-- Dagon - Fase 3 y 4: Misterios de Dagon y Laboratorio de Modelado.
--
-- Esta migracion solo registra cursos, modulos y ejercicios.
-- El dataset grande se crea de forma perezosa en el sandbox de cada usuario
-- cuando entra a una mision con dataset_detective = FRAUDE_BANCARIO.

BEGIN;

INSERT INTO lms_core.cursos (id_curso, titulo) OVERRIDING SYSTEM VALUE VALUES
    (3, 'Misterios de Dagon'),
    (4, 'Laboratorio de Modelado')
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
        21,
        3,
        'Misterio 1: Fraude en el Banco Abisal',
        1,
        'Investiga un millon de transferencias simuladas. Las consultas ingenuas se castigan con timeout; las buenas reducen filas temprano.',
        0,
        '["Leer planes de ejecucion", "Crear indices utiles", "Filtrar datos masivos", "Usar CTEs y window functions para investigar fraude"]'::jsonb,
        '["SELECT con WHERE", "CREATE INDEX", "ORDER BY y LIMIT", "Funciones de ventana basicas"]'::jsonb,
        '["Escanear un millon de filas sin filtro", "Crear indices sobre columnas que no reducen", "Ordenar todo antes de filtrar", "Usar SELECT * en investigaciones masivas"]'::jsonb,
        '{"slug":"misterio-fraude-bancario","duracion_segundos":130,"escenas":["dataset","timeout","indice","filtro","hallazgo"],"narrador":"dagon","objetivo_visual":"mostrar una investigacion de fraude sobre datos grandes"}'::jsonb
    ),
    (
        22,
        4,
        'Laboratorio 1: DDL a ERD',
        1,
        'Convierte sentencias CREATE TABLE y FOREIGN KEY en un diagrama ERD y vuelve a generar DDL desde el modelo.',
        0,
        '["Escribir CREATE TABLE con llaves", "Visualizar relaciones", "Hacer ingenieria inversa desde SQL", "Generar DDL desde un diagrama"]'::jsonb,
        '["Tablas", "PRIMARY KEY", "FOREIGN KEY"]'::jsonb,
        '["Crear tablas aisladas sin FK", "Usar nombres ambiguos", "Olvidar la PK antes de una relacion"]'::jsonb,
        '{"slug":"laboratorio-ddl-erd","duracion_segundos":110,"escenas":["sql","parser","entidades","relaciones","ddl"],"narrador":"dagon","objetivo_visual":"convertir codigo SQL en plano visual"}'::jsonb
    )
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

INSERT INTO lms_core.ejercicios_practicos (
    id_ejercicio,
    id_modulo,
    enunciado,
    query_maestra,
    dificultad,
    configuracion_extra,
    titulo,
    orden,
    tipo_mision,
    formato
) OVERRIDING SYSTEM VALUE VALUES
    (
        120,
        21,
        'Antes de investigar, crea un indice sobre cuenta_origen en transferencias_misteriosas. El dataset tiene 1,000,000 de filas y este indice sera la llave para evitar scans completos.',
        'CREATE INDEX IF NOT EXISTS idx_transferencias_cuenta_origen ON transferencias_misteriosas (cuenta_origen);',
        4,
        '{"tipo_validacion":"ddl","dataset_detective":"FRAUDE_BANCARIO","indice_requerido":{"tabla":"transferencias_misteriosas","columnas":["cuenta_origen"]},"detective_timeout_ms":1600}'::jsonb,
        '1.1: La llave de la cuenta',
        1,
        'HISTORIA',
        'sql'
    ),
    (
        121,
        21,
        'Encuentra las primeras 20 transferencias originadas por la cuenta CTA-00042. Devuelve id_evento, cuenta_origen, cuenta_destino y monto ordenados por id_evento.',
        'SELECT id_evento, cuenta_origen, cuenta_destino, monto FROM transferencias_misteriosas WHERE cuenta_origen = ''CTA-00042'' ORDER BY id_evento LIMIT 20;',
        4,
        '{"dataset_detective":"FRAUDE_BANCARIO","detective_timeout_ms":1600,"foco":["WHERE selectivo","indice","ORDER BY con LIMIT"]}'::jsonb,
        '1.2: Rastro de una cuenta',
        2,
        'HISTORIA',
        'editor'
    ),
    (
        122,
        21,
        'Crea un indice compuesto para acelerar busquedas por riesgo y monto. Debe empezar por riesgo y luego monto.',
        'CREATE INDEX IF NOT EXISTS idx_transferencias_riesgo_monto ON transferencias_misteriosas (riesgo, monto DESC);',
        5,
        '{"tipo_validacion":"ddl","dataset_detective":"FRAUDE_BANCARIO","indice_requerido":{"tabla":"transferencias_misteriosas","columnas":["riesgo","monto"]},"detective_timeout_ms":1600}'::jsonb,
        '1.3: Radar de riesgo',
        3,
        'HISTORIA',
        'sql'
    ),
    (
        123,
        21,
        'Detecta las 10 transferencias de mayor monto entre las operaciones de riesgo alto. Devuelve id_evento, cuenta_origen, cuenta_destino, monto y riesgo.',
        'SELECT id_evento, cuenta_origen, cuenta_destino, monto, riesgo FROM transferencias_misteriosas WHERE riesgo >= 95 ORDER BY monto DESC LIMIT 10;',
        5,
        '{"dataset_detective":"FRAUDE_BANCARIO","detective_timeout_ms":1600,"foco":["indice compuesto","ORDER BY","LIMIT"]}'::jsonb,
        '1.4: Top sospechoso',
        4,
        'HISTORIA',
        'editor'
    ),
    (
        124,
        21,
        'Usa una CTE y ROW_NUMBER para quedarte con la transferencia mas grande por cuenta de origen entre los casos de riesgo alto. Devuelve cuenta_origen, cuenta_destino, monto y riesgo; ordena por monto desc y limita a 10.',
        'WITH sospechosas AS (SELECT cuenta_origen, cuenta_destino, monto, riesgo, ROW_NUMBER() OVER (PARTITION BY cuenta_origen ORDER BY monto DESC) AS rn FROM transferencias_misteriosas WHERE riesgo >= 95) SELECT cuenta_origen, cuenta_destino, monto, riesgo FROM sospechosas WHERE rn = 1 ORDER BY monto DESC LIMIT 10;',
        5,
        '{"dataset_detective":"FRAUDE_BANCARIO","detective_timeout_ms":2200,"foco":["CTE","window function","top por grupo"]}'::jsonb,
        '1.5: El patrón por cuenta',
        5,
        'HISTORIA',
        'editor'
    ),
    (
        130,
        22,
        'Escribe el DDL de dos tablas: clientes con id_cliente como PRIMARY KEY, y pedidos con id_pedido como PRIMARY KEY e id_cliente como FOREIGN KEY hacia clientes(id_cliente). Usa el panel del laboratorio para visualizar el ERD antes de ejecutar.',
        'CREATE TABLE clientes (id_cliente INTEGER PRIMARY KEY, nombre TEXT NOT NULL); CREATE TABLE pedidos (id_pedido INTEGER PRIMARY KEY, id_cliente INTEGER REFERENCES clientes(id_cliente), total NUMERIC(10,2));',
        4,
        '{"tipo_validacion":"ddl","modo":"laboratorio_modelado","foco":["CREATE TABLE","PRIMARY KEY","FOREIGN KEY"]}'::jsonb,
        '1.1: Del SQL al plano',
        1,
        'HISTORIA',
        'sql'
    ),
    (
        131,
        22,
        'Disena visualmente un modelo con tres entidades conectadas. Dagon generara el DDL mientras mueves las cajas y relaciones.',
        '{"diagrama":"validado"}',
        4,
        '{"modo":"laboratorio_modelado","min_entidades":3,"min_relaciones":2,"min_atributos":6,"mensaje_error":"El laboratorio necesita al menos tres entidades con atributos claros.","mensaje_relaciones":"Conecta las entidades para que el modelo genere llaves foraneas."}'::jsonb,
        '1.2: Del plano al SQL',
        2,
        'HISTORIA',
        'diagram'
    )
ON CONFLICT (id_ejercicio) DO UPDATE SET
    id_modulo = EXCLUDED.id_modulo,
    enunciado = EXCLUDED.enunciado,
    query_maestra = EXCLUDED.query_maestra,
    dificultad = EXCLUDED.dificultad,
    configuracion_extra = EXCLUDED.configuracion_extra,
    titulo = EXCLUDED.titulo,
    orden = EXCLUDED.orden,
    tipo_mision = EXCLUDED.tipo_mision,
    formato = EXCLUDED.formato;

SELECT setval(pg_get_serial_sequence('lms_core.cursos', 'id_curso'), COALESCE((SELECT MAX(id_curso) FROM lms_core.cursos), 1), true);
SELECT setval(pg_get_serial_sequence('lms_core.modulos', 'id_modulo'), COALESCE((SELECT MAX(id_modulo) FROM lms_core.modulos), 1), true);
SELECT setval(pg_get_serial_sequence('lms_core.ejercicios_practicos', 'id_ejercicio'), COALESCE((SELECT MAX(id_ejercicio) FROM lms_core.ejercicios_practicos), 1), true);

COMMIT;
