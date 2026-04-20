-- ============================================================================
-- MIGRACION DAGON — Script Maestro
-- Fecha: 2026-04-17
-- Autor: Tech Lead + Claude
-- Descripcion: Expande lms_sandbox con tablas RPG relacionadas (PK/FK),
--              y puebla lms_core con la curricula oficial de 4 modulos.
-- IMPORTANTE: Ejecutar con usuario postgres o superusuario.
--             NO altera tablas existentes ni borra datos.
-- ============================================================================

BEGIN;

-- =============================================
-- PARTE 1: EXPANSION DEL SANDBOX
-- Tres tablas relacionadas con tematica Dagon RPG
-- =============================================

-- 1.1 Tabla: clases (arquetipos de personaje)
CREATE TABLE IF NOT EXISTS lms_sandbox.clases (
    id_clase    SERIAL PRIMARY KEY,
    nombre      VARCHAR(60)  NOT NULL UNIQUE,
    descripcion TEXT,
    hp_base     INTEGER      NOT NULL DEFAULT 10,
    mana_base   INTEGER      NOT NULL DEFAULT 5
);

-- 1.2 Tabla: bestiario (criaturas del abismo)
CREATE TABLE IF NOT EXISTS lms_sandbox.bestiario (
    id_criatura   SERIAL PRIMARY KEY,
    nombre        VARCHAR(80)  NOT NULL,
    tipo          VARCHAR(40)  NOT NULL DEFAULT 'abismal',
    nivel_amenaza INTEGER      NOT NULL CHECK (nivel_amenaza BETWEEN 1 AND 10),
    debilidad     VARCHAR(60),
    descripcion   TEXT
);

-- 1.3 Tabla: pociones (tienda del Modulo 4)
CREATE TABLE IF NOT EXISTS lms_sandbox.pociones (
    id_pocion     SERIAL PRIMARY KEY,
    nombre        VARCHAR(80)  NOT NULL,
    efecto        TEXT         NOT NULL,
    precio_oro    INTEGER      NOT NULL CHECK (precio_oro > 0),
    id_criatura_origen INTEGER REFERENCES lms_sandbox.bestiario(id_criatura),
    rareza        VARCHAR(20)  NOT NULL DEFAULT 'comun'
        CHECK (rareza IN ('comun','rara','epica','legendaria'))
);

-- Asegurar que aventureros tenga FK a clases (agregar columna si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'lms_sandbox'
          AND table_name   = 'aventureros'
          AND column_name  = 'id_clase'
    ) THEN
        ALTER TABLE lms_sandbox.aventureros ADD COLUMN id_clase INTEGER;
        ALTER TABLE lms_sandbox.aventureros
            ADD CONSTRAINT fk_aventurero_clase
            FOREIGN KEY (id_clase) REFERENCES lms_sandbox.clases(id_clase);
    END IF;
END$$;

-- =============================================
-- DATOS SEMILLA — lms_sandbox
-- =============================================

-- Clases
INSERT INTO lms_sandbox.clases (nombre, descripcion, hp_base, mana_base) VALUES
('Invocador',     'Canaliza las voces del abismo para invocar entidades.',            8,  20),
('Cazador Abisal','Rastreador experto en criaturas de las profundidades.',            15,  8),
('Heraldo Oscuro','Guerrero bendecido por Dagon, resiste dano fisico y magico.',     22,  5),
('Alquimista',    'Transforma esencias abisales en pociones y venenos letales.',      10, 15),
('Ocultista',     'Estudioso de los textos prohibidos, maestro en maldiciones.',      9,  18)
ON CONFLICT (nombre) DO NOTHING;

-- Bestiario
INSERT INTO lms_sandbox.bestiario (nombre, tipo, nivel_amenaza, debilidad, descripcion) VALUES
('Leviatan Menor',      'acuatico',  7, 'fuego',      'Serpiente marina que patrulla las ruinas sumergidas de R''lyeh.'),
('Espectro de Silt',    'ethereo',   4, 'luz sagrada', 'Fantasma de un marinero ahogado, vaga entre la niebla.'),
('Gusano de las Fosas', 'terrestre', 5, 'acido',       'Lombriz gigante que excava tuneles bajo los templos antiguos.'),
('Ojo de Dagon',        'abismal',   9, 'plata',       'Orbe flotante que vigila los santuarios con vision omnisciente.'),
('Cangrejo Runa',       'acuatico',  3, 'electricidad','Crustaceo cuyo caparazon lleva grabadas runas de proteccion.')
ON CONFLICT DO NOTHING;

-- Aventureros (limpiar y reinsertar con clase)
DELETE FROM lms_sandbox.aventureros;
INSERT INTO lms_sandbox.aventureros (nombre, clase, nivel, id_clase) VALUES
('Kael el Profundo',    'Invocador',      5, 1),
('Lyra Sombraviento',   'Cazador Abisal', 3, 2),
('Thorn de Innsmouth',  'Heraldo Oscuro', 7, 3),
('Mira la Destiladora', 'Alquimista',     4, 4),
('Obed Marsh',          'Ocultista',      6, 5);

-- Pociones (requiere bestiario para FK)
INSERT INTO lms_sandbox.pociones (nombre, efecto, precio_oro, id_criatura_origen, rareza) VALUES
('Elixir de Branquias',     'Permite respirar bajo el agua durante 1 hora.',        50,  1, 'comun'),
('Tintura de Niebla',       'Otorga invisibilidad parcial por 30 segundos.',        120, 2, 'rara'),
('Bilis de Fosa',           'Inflige dano acido progresivo al enemigo.',            80,  3, 'comun'),
('Lagrima del Ojo',         'Restaura 50 puntos de mana instantaneamente.',         300, 4, 'epica'),
('Esencia Runa',            'Anade proteccion magica temporal al portador.',         200, 5, 'rara')
ON CONFLICT DO NOTHING;

-- Permisos para los usuarios de la app
GRANT SELECT ON TABLE lms_sandbox.clases     TO app_sandbox_user;
GRANT SELECT ON TABLE lms_sandbox.bestiario  TO app_sandbox_user;
GRANT SELECT ON TABLE lms_sandbox.pociones   TO app_sandbox_user;
GRANT SELECT ON TABLE lms_sandbox.clases     TO app_backend_user;
GRANT SELECT ON TABLE lms_sandbox.bestiario  TO app_backend_user;
GRANT SELECT ON TABLE lms_sandbox.pociones   TO app_backend_user;

GRANT USAGE ON SEQUENCE lms_sandbox.clases_id_clase_seq       TO app_sandbox_user;
GRANT USAGE ON SEQUENCE lms_sandbox.bestiario_id_criatura_seq TO app_sandbox_user;
GRANT USAGE ON SEQUENCE lms_sandbox.pociones_id_pocion_seq    TO app_sandbox_user;

-- =============================================
-- PARTE 2: CURRICULA OFICIAL — lms_core
-- 1 curso, 4 modulos, 8 ejercicios (2 por modulo)
-- =============================================

-- 2.1 Curso
INSERT INTO lms_core.cursos (titulo)
VALUES ('SQL: Las Profundidades de Dagon')
ON CONFLICT (titulo) DO NOTHING;

-- Capturar el ID del curso recien insertado
DO $$
DECLARE
    v_curso_id INTEGER;
    v_mod1 INTEGER;
    v_mod2 INTEGER;
    v_mod3 INTEGER;
    v_mod4 INTEGER;
BEGIN
    SELECT id_curso INTO v_curso_id
    FROM lms_core.cursos
    WHERE titulo = 'SQL: Las Profundidades de Dagon';

    -- 2.2 Modulos
    INSERT INTO lms_core.modulos (id_curso, titulo, orden, descripcion, xp_requerida)
    VALUES (v_curso_id, 'Lectura del Abismo', 1,
            'Domina SELECT, WHERE, LIKE y COUNT para leer los registros de las profundidades.', 0)
    ON CONFLICT (id_curso, orden) DO NOTHING;

    INSERT INTO lms_core.modulos (id_curso, titulo, orden, descripcion, xp_requerida)
    VALUES (v_curso_id, 'Manipulacion Oscura', 2,
            'Aprende INSERT, UPDATE y DELETE para alterar los datos del santuario.', 80)
    ON CONFLICT (id_curso, orden) DO NOTHING;

    INSERT INTO lms_core.modulos (id_curso, titulo, orden, descripcion, xp_requerida)
    VALUES (v_curso_id, 'Arquitectura Profunda', 3,
            'Crea tablas con CREATE TABLE, define PK/FK y domina INNER JOIN.', 200)
    ON CONFLICT (id_curso, orden) DO NOTHING;

    INSERT INTO lms_core.modulos (id_curso, titulo, orden, descripcion, xp_requerida)
    VALUES (v_curso_id, 'Reto Final: La Tienda de Pociones', 4,
            'Combina DDL y DML para construir y poblar la tienda de pociones de Dagon.', 350)
    ON CONFLICT (id_curso, orden) DO NOTHING;

    -- Obtener IDs de los modulos
    SELECT id_modulo INTO v_mod1 FROM lms_core.modulos WHERE id_curso = v_curso_id AND orden = 1;
    SELECT id_modulo INTO v_mod2 FROM lms_core.modulos WHERE id_curso = v_curso_id AND orden = 2;
    SELECT id_modulo INTO v_mod3 FROM lms_core.modulos WHERE id_curso = v_curso_id AND orden = 3;
    SELECT id_modulo INTO v_mod4 FROM lms_core.modulos WHERE id_curso = v_curso_id AND orden = 4;

    -- =============================================
    -- 2.3 EJERCICIOS — Modulo 1: Lectura (Drag & Drop)
    -- =============================================

    -- Ejercicio 1.1 — SELECT basico
    INSERT INTO lms_core.ejercicios_practicos
        (id_modulo, titulo, enunciado, query_maestra, dificultad, orden, configuracion_extra)
    VALUES (
        v_mod1,
        'Los Aventureros del Abismo',
        'El Oraculo necesita un censo. Recupera el nombre y el nivel de todos los aventureros registrados en el santuario.',
        'SELECT nombre, nivel FROM aventureros;',
        1, 1,
        '{
            "tipo_interaccion": "drag_drop",
            "tipo_validacion": "resultado",
            "word_bank": ["SELECT","nombre","nivel","FROM","aventureros",";","WHERE","id_clase","bestiario","*","INSERT"],
            "pista": "Necesitas dos columnas: nombre y nivel. La tabla se llama aventureros."
        }'::jsonb
    );

    -- Ejercicio 1.2 — WHERE + LIKE + COUNT
    INSERT INTO lms_core.ejercicios_practicos
        (id_modulo, titulo, enunciado, query_maestra, dificultad, orden, configuracion_extra)
    VALUES (
        v_mod1,
        'Criaturas Acuaticas',
        'Los vigias reportan actividad en las aguas. Cuenta cuantas criaturas de tipo acuatico hay en el bestiario.',
        'SELECT COUNT(*) FROM bestiario WHERE tipo = ''acuatico'';',
        2, 2,
        '{
            "tipo_interaccion": "drag_drop",
            "tipo_validacion": "resultado",
            "word_bank": ["SELECT","COUNT(*)","FROM","bestiario","WHERE","tipo","=","''acuatico''",";","nombre","LIKE","''%abisal%''","nivel_amenaza",">"],
            "pista": "Usa COUNT(*) para contar filas. Filtra con WHERE tipo = ''acuatico''."
        }'::jsonb
    );

    -- =============================================
    -- 2.3 EJERCICIOS — Modulo 2: CRUD (Editor Monaco)
    -- =============================================

    -- Ejercicio 2.1 — INSERT
    INSERT INTO lms_core.ejercicios_practicos
        (id_modulo, titulo, enunciado, query_maestra, dificultad, orden, configuracion_extra)
    VALUES (
        v_mod2,
        'Nuevo Recluta',
        'Un nuevo aventurero llega al santuario. Inserta un registro con nombre ''Darius el Marcado'', clase ''Ocultista'' y nivel 1.',
        'INSERT INTO aventureros (nombre, clase, nivel) VALUES (''Darius el Marcado'', ''Ocultista'', 1);',
        2, 1,
        '{
            "tipo_interaccion": "editor",
            "tipo_validacion": "resultado",
            "starter_code": "-- Inserta el nuevo aventurero aqui\nINSERT INTO ",
            "pista": "La sintaxis es: INSERT INTO tabla (col1, col2, col3) VALUES (val1, val2, val3);"
        }'::jsonb
    );

    -- Ejercicio 2.2 — UPDATE + DELETE
    INSERT INTO lms_core.ejercicios_practicos
        (id_modulo, titulo, enunciado, query_maestra, dificultad, orden, configuracion_extra)
    VALUES (
        v_mod2,
        'Ascenso de Poder',
        'Kael el Profundo ha completado su entrenamiento. Actualiza su nivel a 8.',
        'UPDATE aventureros SET nivel = 8 WHERE nombre = ''Kael el Profundo'';',
        2, 2,
        '{
            "tipo_interaccion": "editor",
            "tipo_validacion": "resultado",
            "starter_code": "-- Actualiza el nivel de Kael\nUPDATE aventureros SET ",
            "pista": "Usa UPDATE tabla SET columna = valor WHERE condicion;"
        }'::jsonb
    );

    -- =============================================
    -- 2.3 EJERCICIOS — Modulo 3: Arquitectura (Editor Monaco)
    -- =============================================

    -- Ejercicio 3.1 — CREATE TABLE con PK
    INSERT INTO lms_core.ejercicios_practicos
        (id_modulo, titulo, enunciado, query_maestra, dificultad, orden, configuracion_extra)
    VALUES (
        v_mod3,
        'Forja de Reliquias',
        'El herrero necesita un inventario. Crea la tabla "reliquias" con: id_reliquia (SERIAL, PK), nombre (VARCHAR(80), NOT NULL), poder (INTEGER, NOT NULL), maldita (BOOLEAN, default FALSE).',
        'CREATE TABLE reliquias (id_reliquia SERIAL PRIMARY KEY, nombre VARCHAR(80) NOT NULL, poder INTEGER NOT NULL, maldita BOOLEAN DEFAULT FALSE);',
        3, 1,
        '{
            "tipo_interaccion": "editor",
            "tipo_validacion": "ddl",
            "starter_code": "-- Crea la tabla reliquias\nCREATE TABLE reliquias (\n    \n);",
            "esquema_esperado": {
                "tabla": "reliquias",
                "columnas": [
                    {"nombre": "id_reliquia", "tipo_base": "integer",   "nullable": "NO"},
                    {"nombre": "nombre",      "tipo_base": "varchar",   "nullable": "NO"},
                    {"nombre": "poder",       "tipo_base": "integer",   "nullable": "NO"},
                    {"nombre": "maldita",     "tipo_base": "boolean",   "nullable": "YES"}
                ],
                "pk": ["id_reliquia"]
            },
            "pista": "SERIAL genera la secuencia automaticamente. No olvides PRIMARY KEY."
        }'::jsonb
    );

    -- Ejercicio 3.2 — CREATE TABLE con FK + INNER JOIN
    INSERT INTO lms_core.ejercicios_practicos
        (id_modulo, titulo, enunciado, query_maestra, dificultad, orden, configuracion_extra)
    VALUES (
        v_mod3,
        'Vinculos del Destino',
        'Los aventureros necesitan equiparse. Escribe un INNER JOIN que muestre el nombre del aventurero junto al nombre de su clase (usa las tablas aventureros y clases, unidas por id_clase).',
        'SELECT a.nombre, c.nombre FROM aventureros a INNER JOIN clases c ON a.id_clase = c.id_clase;',
        3, 2,
        '{
            "tipo_interaccion": "editor",
            "tipo_validacion": "resultado",
            "starter_code": "-- Une aventureros con clases usando INNER JOIN\nSELECT ",
            "pista": "INNER JOIN conecta dos tablas por una columna comun. Usa alias: aventureros a, clases c."
        }'::jsonb
    );

    -- =============================================
    -- 2.3 EJERCICIOS — Modulo 4: Reto Final (Editor + Canvas)
    -- =============================================

    -- Ejercicio 4.1 — DDL completo: Crear tabla tienda
    INSERT INTO lms_core.ejercicios_practicos
        (id_modulo, titulo, enunciado, query_maestra, dificultad, orden, configuracion_extra)
    VALUES (
        v_mod4,
        'Cimientos de la Tienda',
        'Construye la tabla "tienda_pociones" con: id_venta (SERIAL, PK), id_pocion (INTEGER, FK a pociones), id_aventurero (INTEGER, FK a aventureros), cantidad (INTEGER, NOT NULL, CHECK > 0), fecha_venta (TIMESTAMP, default CURRENT_TIMESTAMP).',
        'CREATE TABLE tienda_pociones (id_venta SERIAL PRIMARY KEY, id_pocion INTEGER REFERENCES pociones(id_pocion), id_aventurero INTEGER REFERENCES aventureros(id_aventurero), cantidad INTEGER NOT NULL CHECK (cantidad > 0), fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP);',
        4, 1,
        '{
            "tipo_interaccion": "editor",
            "tipo_validacion": "ddl",
            "starter_code": "-- Crea la tabla tienda_pociones con todas sus restricciones\nCREATE TABLE tienda_pociones (\n    \n);",
            "esquema_esperado": {
                "tabla": "tienda_pociones",
                "columnas": [
                    {"nombre": "id_venta",       "tipo_base": "integer",   "nullable": "NO"},
                    {"nombre": "id_pocion",      "tipo_base": "integer",   "nullable": "YES"},
                    {"nombre": "id_aventurero",  "tipo_base": "integer",   "nullable": "YES"},
                    {"nombre": "cantidad",       "tipo_base": "integer",   "nullable": "NO"},
                    {"nombre": "fecha_venta",    "tipo_base": "timestamp", "nullable": "YES"}
                ],
                "pk": ["id_venta"],
                "fks": [
                    {"columna": "id_pocion",     "ref_tabla": "pociones",    "ref_columna": "id_pocion"},
                    {"columna": "id_aventurero", "ref_tabla": "aventureros", "ref_columna": "id_aventurero"}
                ]
            },
            "pista": "Usa REFERENCES para las FK. El CHECK va junto a la columna cantidad."
        }'::jsonb
    );

    -- Ejercicio 4.2 — DML: Poblar la tienda y consultar
    INSERT INTO lms_core.ejercicios_practicos
        (id_modulo, titulo, enunciado, query_maestra, dificultad, orden, configuracion_extra)
    VALUES (
        v_mod4,
        'Primera Venta del Abismo',
        'La tienda abre sus puertas. Inserta una venta: Kael el Profundo (id_aventurero=1) compra 3 unidades del Elixir de Branquias (id_pocion=1).',
        'INSERT INTO tienda_pociones (id_pocion, id_aventurero, cantidad) VALUES (1, 1, 3);',
        5, 2,
        '{
            "tipo_interaccion": "editor",
            "tipo_validacion": "resultado",
            "starter_code": "-- Registra la primera venta de la tienda\nINSERT INTO tienda_pociones ",
            "pista": "Solo necesitas id_pocion, id_aventurero y cantidad. fecha_venta se llena sola.",
            "requiere_ejercicio_previo": true
        }'::jsonb
    );

END$$;

-- =============================================
-- VERIFICACION RAPIDA
-- Ejecuta estas queries para confirmar que todo quedo bien
-- =============================================
-- SELECT * FROM lms_sandbox.clases;
-- SELECT * FROM lms_sandbox.bestiario;
-- SELECT * FROM lms_sandbox.pociones;
-- SELECT * FROM lms_sandbox.aventureros;
-- SELECT c.titulo AS curso, m.orden, m.titulo AS modulo, m.xp_requerida
--   FROM lms_core.cursos c
--   JOIN lms_core.modulos m ON c.id_curso = m.id_curso
--  ORDER BY m.orden;
-- SELECT e.id_ejercicio, m.titulo AS modulo, e.titulo, e.orden, e.dificultad,
--        e.configuracion_extra->>'tipo_interaccion' AS tipo,
--        e.configuracion_extra->>'tipo_validacion' AS validacion
--   FROM lms_core.ejercicios_practicos e
--   JOIN lms_core.modulos m ON e.id_modulo = m.id_modulo
--  ORDER BY m.orden, e.orden;

COMMIT;
