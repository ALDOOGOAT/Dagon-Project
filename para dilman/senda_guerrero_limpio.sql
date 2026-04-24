-- ============================================================
-- LIMPIEZA: Eliminar módulos insertados incorrectamente
-- ============================================================

DELETE FROM lms_core.ejercicios_practicos WHERE id_modulo >= 5 AND id_ejercicio >= 43;
DELETE FROM lms_core.modulos WHERE id_modulo >= 5;

-- Verificar limpieza
SELECT * FROM lms_core.modulos ORDER BY id_modulo;
SELECT MAX(id_ejercicio) FROM lms_core.ejercicios_practicos;

-- ============================================================
-- RE-INSERCIÓN CORRECTA
-- ============================================================

-- MÓDULO 5: Guardianes de los Datos (Constraints & Secuencias)
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(5, 1, 'Módulo 5: Los Sellos Sagrados', 1, 'Constraints y Secuencias: Domina las reglas que mantienen la integridad de tus datos.', 0);

-- MÓDULO 6: Sellos de Validación
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(6, 1, 'Módulo 6: Sellos de Validación', 2, 'UNIQUE, CHECK y DEFAULT: Validación de reglas de negocio.', 50);

-- MÓDULO 7: El Generador de IDs
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(7, 1, 'Módulo 7: El Generador de IDs', 3, 'SERIAL, BIGSERIAL y Secuencias: IDs automáticos.', 100);

-- MÓDULO 8: Los Filtros de Precisión
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(8, 1, 'Módulo 8: Los Filtros de Precisión', 4, 'BETWEEN, IN, IS NULL: Filtros avanzados.', 150);

-- MÓDULO 9: Las Ventanas Mágicas (Vistas)
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(9, 1, 'Módulo 9: Las Ventanas Mágicas', 5, 'Vistas: Atajos que muestran datos sin cambiar la fuente.', 200);

-- MÓDULO 10: Los Planos del Gremio
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(10, 1, 'Módulo 10: Los Planos del Gremio', 6, 'information_schema: Consultar metadatos.', 250);

-- MÓDULO 11: Patrones de Búsqueda
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(11, 1, 'Módulo 11: Patrones de Búsqueda', 7, 'LIKE, SIMILAR TO: Búsquedas con expresiones regulares.', 300);

-- MÓDULO 12: Los Hechizos Automáticos
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(12, 1, 'Módulo 12: Los Hechizos Automáticos', 8, 'Funciones: Código reutilizable que devuelve resultados.', 350);

-- MÓDULO 13: Rituales Programados
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(13, 1, 'Módulo 13: Rituales Programados', 9, 'Procedures: Bloques de código que ejecutan múltiples acciones.', 400);

-- MÓDULO 14: Los Gatillos Mágicos
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(14, 1, 'Módulo 14: Los Gatillos Mágicos', 10, 'Triggers: Código que se ejecuta automáticamente.', 450);

-- MÓDULO 15: Viaje Temporal
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(15, 1, 'Módulo 15: Viaje Temporal', 11, 'BEGIN, COMMIT, ROLLBACK: Control de transacciones.', 500);

-- MÓDULO 16: Cerrojos de Filas
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(16, 1, 'Módulo 16: Cerrojos de Filas', 12, 'FOR UPDATE, LOCK: Bloqueo pesimista.', 550);

-- MÓDULO 17: Álgebra Relacional
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(17, 1, 'Módulo 17: Álgebra Relacional', 13, 'UNION, INTERSECT, EXCEPT: Operaciones de conjuntos.', 600);

-- MÓDULO 18: Roles del Gremio
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(18, 1, 'Módulo 18: Roles del Gremio', 14, 'CREATE ROLE, GRANT, REVOKE: Control de acceso.', 650);

-- MÓDULO 19: Seguridad a Nivel de Fila
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(19, 1, 'Módulo 19: Seguridad a Nivel de Fila', 15, 'Row Level Security: Cada usuario ve solo sus datos.', 700);

-- MÓDULO 20: Proyecto Final
INSERT INTO lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) VALUES
(20, 1, 'Módulo 20: Proyecto Final', 16, 'Integración de todo lo aprendido.', 800);

-- ============================================================
-- EJERCICIOS MÓDULO 5: Sellos Sagrados
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(43, 5, '5.1: Crear tabla con sellos', 'Crea la tabla "mascotas" con: id (SERIAL, PK), nombre (VARCHAR 50, NOT NULL) y nivel (INTEGER DEFAULT 1).', 'CREATE TABLE mascotas (id SERIAL PRIMARY KEY, nombre VARCHAR(50) NOT NULL, nivel INTEGER DEFAULT 1);', 2, 1, 'HISTORIA', 'sql'),
(44, 5, '5.2: Añadir constraint PK', 'Añade PRIMARY KEY a la columna id_aventurero de la tabla aventureros.', 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);', 3, 2, 'HISTORIA', 'sql'),
(45, 5, '5.3: El DEFAULT del novato', 'Inserta un aventurero sin especificar nivel. Verifica que use DEFAULT 1.', 'INSERT INTO aventureros (nombre, clase) VALUES (''Nuevo'', ''Guerrero'');', 2, 3, 'HISTORIA', 'sql'),
(46, 5, '5.4: Valores obligatorios', 'Selecciona solo aventureros que tienen nombre (no NULL).', 'SELECT * FROM aventureros WHERE nombre IS NOT NULL;', 2, 4, 'HISTORIA', 'editor');

-- ============================================================
-- EJERCICIOS MÓDULO 6: Sellos de Validación
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(47, 6, '6.1: Nombres únicos', 'Añade constraint UNIQUE a la columna nombre de aventureros.', 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nombre_unique UNIQUE (nombre);', 3, 1, 'HISTORIA', 'sql'),
(48, 6, '6.2: CHECK nivel válido', 'Añade CHECK para que nivel sea entre 1 y 99.', 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);', 3, 2, 'HISTORIA', 'sql'),
(49, 6, '6.3: CHECK precio positivo', 'Añade CHECK para que precio sea mayor a 0 en equipamiento.', 'ALTER TABLE equipamiento ADD CONSTRAINT equipamiento_precio_check CHECK (precio > 0);', 3, 3, 'HISTORIA', 'sql'),
(50, 6, '6.4: DEFAULT automático', 'Inserta habitación sin precio y verifica que usa DEFAULT.', 'INSERT INTO habitaciones (numero, tipo) VALUES (999, ''Especial''); SELECT precio_noche FROM habitaciones WHERE numero = 999;', 2, 4, 'HISTORIA', 'sql');

-- ============================================================
-- EJERCICIOS MÓDULO 7: Generador de IDs
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(51, 7, '7.1: Ver siguiente serial', 'Muestra el siguiente valor de la secuencia de aventureros.', 'SELECT nextval(''aventureros_id_aventurero_seq'');', 2, 1, 'HISTORIA', 'editor'),
(52, 7, '7.2: Currval de secuencia', 'Muestra el último valor usado por la secuencia.', 'SELECT currval(''aventureros_id_aventurero_seq'');', 2, 2, 'HISTORIA', 'editor'),
(53, 7, '7.3: Crear secuencia manual', 'Crea una secuencia llamada "seq_custom" que empiece en 100.', 'CREATE SEQUENCE seq_custom START 100; SELECT nextval(''seq_custom'');', 3, 3, 'HISTORIA', 'sql'),
(54, 7, '7.4: Eliminar secuencia', 'Elimina la secuencia seq_custom.', 'DROP SEQUENCE seq_custom;', 2, 4, 'HISTORIA', 'sql');

-- ============================================================
-- EJERCICIOS MÓDULO 8: Filtros de Precisión
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(55, 8, '8.1: BETWEEN poderoso', 'Selecciona aventureros con nivel entre 10 y 20.', 'SELECT * FROM aventureros WHERE nivel BETWEEN 10 AND 20;', 2, 1, 'HISTORIA', 'editor'),
(56, 8, '8.2: IN Selectivo', 'Selecciona aventureros de clase Guerrero o Maga Suprema.', 'SELECT * FROM aventureros WHERE clase IN (''Guerrero'', ''Maga Suprema'');', 2, 2, 'HISTORIA', 'editor'),
(57, 8, '8.3: Los sin equipo', 'Encuentra aventureros que tienen NULL en nivel.', 'SELECT * FROM aventureros WHERE nivel IS NULL;', 2, 3, 'HISTORIA', 'editor'),
(58, 8, '8.4: Los que sí tienen', 'Encuentra aventureros que tienen nivel definido.', 'SELECT * FROM aventureros WHERE nivel IS NOT NULL;', 2, 4, 'HISTORIA', 'editor');

-- ============================================================
-- EJERCICIOS MÓDULO 9: Ventanas Mágicas (Vistas)
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(59, 9, '9.1: Vista simple', 'Crea una vista "vista_guerreros" que muestre los aventureros de clase Guerrero.', 'CREATE VIEW vista_guerreros AS SELECT * FROM aventureros WHERE clase = ''Guerrero'';', 3, 1, 'HISTORIA', 'sql'),
(60, 9, '9.2: Vista con JOIN', 'Crea vista "vista_equipados" con nombre del aventurero y su item.', 'CREATE VIEW vista_equipados AS SELECT a.nombre, e.item FROM aventureros a JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;', 3, 2, 'HISTORIA', 'sql'),
(61, 9, '9.3: Consultar vista', 'Selecciona todo de la vista vista_guerreros.', 'SELECT * FROM vista_guerreros;', 1, 3, 'HISTORIA', 'editor'),
(62, 9, '9.4: Eliminar vista', 'Elimina la vista vista_guerreros.', 'DROP VIEW IF EXISTS vista_guerreros;', 2, 4, 'HISTORIA', 'sql');

-- ============================================================
-- EJERCICIOS MÓDULO 10: Planos del Gremio
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(63, 10, '10.1: Ver tablas del esquema', 'Lista todas las tablas en tu esquema actual.', 'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema();', 2, 1, 'HISTORIA', 'editor'),
(64, 10, '10.2: Ver columnas', 'Muestra las columnas de la tabla aventureros.', 'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ''aventureros'';', 2, 2, 'HISTORIA', 'editor'),
(65, 10, '10.3: Ver constraints', 'Lista los constraints de la tabla equipamiento.', 'SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = ''equipamiento'';', 3, 3, 'HISTORIA', 'editor'),
(66, 10, '10.4: Ver secuencias', 'Lista las secuencias disponibles.', 'SELECT sequence_name FROM information_schema.sequences;', 2, 4, 'HISTORIA', 'editor');

-- ============================================================
-- EJERCICIOS MÓDULO 11: Patrones de Búsqueda
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(67, 11, '11.1: LIKE comodín inicio', 'Busca aventureros cuyos nombres empiezan con "L".', 'SELECT * FROM aventureros WHERE nombre LIKE ''L%'';', 2, 1, 'HISTORIA', 'editor'),
(68, 11, '11.2: LIKE comodín fin', 'Busca aventureros cuyos nombres terminan con "a".', 'SELECT * FROM aventureros WHERE nombre LIKE ''%a'';', 2, 2, 'HISTORIA', 'editor'),
(69, 11, '11.3: LIKE ambos lados', 'Busca aventureros que tengan "o" en cualquier parte del nombre.', 'SELECT * FROM aventureros WHERE nombre LIKE ''%o%'';', 2, 3, 'HISTORIA', 'editor'),
(70, 11, '11.4: NOT LIKE', 'Busca aventureros que NO empiecen con "A".', 'SELECT * FROM aventureros WHERE nombre NOT LIKE ''A%'';', 2, 4, 'HISTORIA', 'editor');

-- ============================================================
-- EJERCICIOS MÓDULO 12: Hechizos Automáticos (Funciones)
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(71, 12, '12.1: Función básica', 'Crea función "sumar" que sume dos números.', 'CREATE FUNCTION sumar(a INTEGER, b INTEGER) RETURNS INTEGER AS '' SELECT a + b; '' LANGUAGE SQL; SELECT sumar(5, 3);', 3, 1, 'HISTORIA', 'sql'),
(72, 12, '12.2: Contar aventureros', 'Crea función que cuente aventureros por clase.', 'CREATE FUNCTION contar_por_clase(clase_param VARCHAR) RETURNS INTEGER AS '' SELECT COUNT(*) FROM aventureros WHERE clase = clase_param; '' LANGUAGE SQL; SELECT contar_por_clase(''Guerrero'');', 4, 2, 'HISTORIA', 'sql'),
(73, 12, '12.3: Función con IF', 'Crea función que diga si el nivel es alto (>20) o bajo.', 'CREATE FUNCTION verificar_nivel(n INTEGER) RETURNS TEXT AS '' SELECT CASE WHEN n > 20 THEN ''Alto'' ELSE ''Bajo'' END; '' LANGUAGE SQL; SELECT verificar_nivel(25);', 4, 3, 'HISTORIA', 'sql'),
(74, 12, '12.4: Función con tabla', 'Crea función que devuelva aventureros con nivel mayor al dado.', 'CREATE FUNCTION aventureros_fuertes(min_nivel INTEGER) RETURNS TABLE(nombre TEXT, nivel INTEGER) AS '' SELECT nombre, nivel FROM aventureros WHERE nivel >= min_nivel; '' LANGUAGE SQL; SELECT * FROM aventureros_fuertes(20);', 5, 4, 'HISTORIA', 'sql');

-- ============================================================
-- EJERCICIOS MÓDULO 13: Rituales Programados
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(75, 13, '13.1: Procedure insertar', 'Crea función que inserte aventurero y devuelva mensaje.', 'CREATE FUNCTION crear_aventurero(n VARCHAR, c VARCHAR) RETURNS TEXT AS '' BEGIN INSERT INTO aventureros (nombre, clase) VALUES (n, c); RETURN ''Aventurero '' || n || '' creado!''; END; '' LANGUAGE plpgsql; SELECT crear_aventurero(''Test'', ''Mago'');', 4, 1, 'HISTORIA', 'sql'),
(76, 13, '13.2: Transacción múltiples inserts', 'Crea función que inserte aventurero Y su equipo.', 'CREATE FUNCTION reclutar_con_equipo(av_nombre VARCHAR, av_clase VARCHAR, eq_item VARCHAR, eq_precio INTEGER) RETURNS INTEGER AS '' DECLARE new_id INTEGER; BEGIN INSERT INTO aventureros (nombre, clase) VALUES (av_nombre, av_clase) RETURNING id_aventurero INTO new_id; INSERT INTO equipamiento (id_aventurero, item, precio) VALUES (new_id, eq_item, eq_precio); RETURN new_id; END; '' LANGUAGE plpgsql;', 5, 2, 'HISTORIA', 'sql');

-- ============================================================
-- EJERCICIOS MÓDULO 14: Gatillos Mágicos
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(77, 14, '14.1: Trigger básico', 'Crea trigger que muestre mensaje al insertar.', 'CREATE FUNCTION fn_saludo() RETURNS TRIGGER AS '' BEGIN RAISE NOTICE ''Nuevo aventurero: %'', NEW.nombre; RETURN NEW; END; '' LANGUAGE plpgsql; CREATE TRIGGER trg_saludo AFTER INSERT ON aventureros FOR EACH ROW EXECUTE FUNCTION fn_saludo();', 5, 1, 'HISTORIA', 'sql'),
(78, 14, '14.2: Trigger con auditoría', 'Crea tabla de logs y trigger de auditoría.', 'CREATE TABLE log_cambios (id SERIAL, accion TEXT, tabla TEXT, fecha TIMESTAMP DEFAULT NOW()); CREATE FUNCTION fn_auditar() RETURNS TRIGGER AS '' BEGIN INSERT INTO log_cambios (accion, tabla) VALUES (TG_OP, TG_TABLE_NAME); RETURN NEW; END; '' LANGUAGE plpgsql; CREATE TRIGGER trg_auditar AFTER INSERT ON aventureros FOR EACH ROW EXECUTE FUNCTION fn_auditar();', 5, 2, 'HISTORIA', 'sql'),
(79, 14, '14.3: Trigger BEFORE validación', 'Crea trigger BEFORE que valide nivel antes de insertar.', 'CREATE FUNCTION fn_validar_nivel() RETURNS TRIGGER AS '' BEGIN IF NEW.nivel < 1 OR NEW.nivel > 99 THEN RAISE EXCEPTION ''Nivel debe estar entre 1 y 99''; END IF; RETURN NEW; END; '' LANGUAGE plpgsql; CREATE TRIGGER trg_validar_nivel BEFORE INSERT ON aventureros FOR EACH ROW EXECUTE FUNCTION fn_validar_nivel();', 5, 3, 'HISTORIA', 'sql');

-- ============================================================
-- EJERCICIOS MÓDULO 15: Viaje Temporal
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(80, 15, '15.1: Insert y Commit', 'Inserta un nuevo aventurero (implícito COMMIT).', 'BEGIN; INSERT INTO aventureros (nombre, clase, nivel) VALUES (''Temporal1'', ''Guerrero'', 50); COMMIT; SELECT * FROM aventureros WHERE nombre = ''Temporal1'';', 3, 1, 'HISTORIA', 'sql'),
(81, 15, '15.2: ROLLBACK', 'Inserta y deshaz los cambios.', 'BEGIN; INSERT INTO aventureros (nombre, clase) VALUES (''Desechado'', ''Mago''); ROLLBACK; SELECT COUNT(*) FROM aventureros WHERE nombre = ''Desechado'';', 3, 2, 'HISTORIA', 'sql'),
(82, 15, '15.3: SAVEPOINT', 'Usa SAVEPOINT para hacer rollback parcial.', 'BEGIN; INSERT INTO aventureros (nombre, clase) VALUES (''Primero'', ''Guerrero''); SAVEPOINT sp1; INSERT INTO aventureros (nombre, clase) VALUES (''Segundo'', ''Mago''); ROLLBACK TO SAVEPOINT sp1; COMMIT; SELECT COUNT(*) FROM aventureros WHERE nombre IN (''Primero'', ''Segundo'');', 5, 3, 'HISTORIA', 'sql');

-- ============================================================
-- EJERCICIOS MÓDULO 16: Cerrojos de Filas
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(83, 16, '16.1: FOR UPDATE básico', 'Usa FOR UPDATE para bloquear una fila.', 'SELECT * FROM aventureros WHERE id_aventurero = 1 FOR UPDATE;', 4, 1, 'HISTORIA', 'editor'),
(84, 16, '16.2: NOWAIT', 'Intenta bloquear con NOWAIT.', 'SELECT * FROM aventureros WHERE id_aventurero = 1 FOR UPDATE NOWAIT;', 4, 2, 'HISTORIA', 'editor');

-- ============================================================
-- EJERCICIOS MÓDULO 17: Álgebra Relacional
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(85, 17, '17.1: UNION', 'Une nombres de aventureros con items.', 'SELECT nombre FROM aventureros UNION SELECT item FROM equipamiento ORDER BY 1;', 3, 1, 'HISTORIA', 'editor'),
(86, 17, '17.2: UNION ALL', 'Une con duplicados.', 'SELECT clase FROM aventureros UNION ALL SELECT item FROM equipamiento LIMIT 10;', 3, 2, 'HISTORIA', 'editor'),
(87, 17, '17.3: INTERSECT', 'Encuentra clases que también son items.', 'SELECT clase FROM aventureros INTERSECT SELECT item FROM equipamiento;', 4, 3, 'HISTORIA', 'editor'),
(88, 17, '17.4: EXCEPT', 'Muestra clases que NO son items.', 'SELECT clase FROM aventureros EXCEPT SELECT item FROM equipamiento;', 4, 4, 'HISTORIA', 'editor');

-- ============================================================
-- EJERCICIOS MÓDULO 18: Roles del Gremio
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(89, 18, '18.1: Ver roles actuales', 'Consulta los roles existentes.', 'SELECT rolname FROM pg_roles WHERE rolname NOT LIKE ''pg_%;', 2, 1, 'HISTORIA', 'editor'),
(90, 18, '18.2: Ver permisos', 'Muestra los permisos en la tabla aventureros.', 'SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name = ''aventureros'';', 3, 2, 'HISTORIA', 'editor'),
(91, 18, '18.3: Ver rol actual', 'Muestra el usuario actual.', 'SELECT current_user, session_user, current_database();', 1, 3, 'HISTORIA', 'editor');

-- ============================================================
-- EJERCICIOS MÓDULO 19: Seguridad a Nivel de Fila
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(92, 19, '19.1: Tu esquema personal', 'Consulta los esquemas disponibles.', 'SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;', 2, 1, 'HISTORIA', 'editor'),
(93, 19, '19.2: Entender el multiverso', 'Muestra el search_path actual.', 'SELECT current_setting(''search_path'');', 3, 2, 'HISTORIA', 'editor');

-- ============================================================
-- EJERCICIOS MÓDULO 20: Proyecto Final
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(94, 20, '20.1: Tabla con constraints', 'Crea tabla "bestiario" con PK, NOT NULL, CHECK.', 'CREATE TABLE bestiario (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, nivel INTEGER CHECK (nivel >= 1 AND nivel <= 50), tipo VARCHAR(50));', 4, 1, 'HISTORIA', 'sql'),
(95, 20, '20.2: Función de cálculo', 'Crea función que calcule XP necesaria.', 'CREATE FUNCTION xp_para_nivel(target INTEGER) RETURNS INTEGER AS '' SELECT target * 10; '' LANGUAGE SQL; SELECT xp_para_nivel(15);', 4, 2, 'HISTORIA', 'sql'),
(96, 20, '20.3: Vista de resumen', 'Crea vista con aventureros y total de oro.', 'CREATE VIEW resumen_heroes AS SELECT a.nombre, a.clase, COALESCE(SUM(e.precio), 0) AS total_oro FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.id_aventurero, a.nombre, a.clase;', 5, 3, 'HISTORIA', 'sql'),
(97, 20, '20.4: Transacción segura', 'Inserta aventurero con equipo en transacción.', 'BEGIN; INSERT INTO aventureros (nombre, clase, nivel) VALUES (''Final'', ''Paladín'', 25); INSERT INTO equipamiento (id_aventurero, item, precio) VALUES (currval(''aventureros_id_aventurero_seq''), ''Espada Final'', 500); COMMIT;', 5, 4, 'HISTORIA', 'sql');

-- ============================================================
-- PRÁCTICAS RÁPIDAS
-- ============================================================

INSERT INTO lms_core.ejercicios_practicos (id_ejercicio, id_modulo, titulo, enunciado, query_maestra, dificultad, orden, tipo_mision, formato) VALUES
(98, 5, 'Rápida: CHECK rápido', 'Verifica que el nivel sea mayor a 0.', 'SELECT * FROM aventureros WHERE nivel > 0;', 1, 201, 'RAPIDA', 'editor'),
(99, 5, 'Rápida: Nombres duplicados', 'Busca nombres duplicados.', 'SELECT nombre, COUNT(*) FROM aventureros GROUP BY nombre HAVING COUNT(*) > 1;', 2, 202, 'RAPIDA', 'editor'),
(100, 6, 'Rápida: DEFAULT fecha', 'Inserta reserva sin fecha.', 'INSERT INTO reservas (id_huesped, id_habitacion) VALUES (1, 1); SELECT fecha_entrada FROM reservas ORDER BY id DESC LIMIT 1;', 2, 201, 'RAPIDA', 'sql'),
(101, 7, 'Rápida: Siguiente ID', 'Muestra el siguiente ID.', 'SELECT nextval(''aventureros_id_aventurero_seq'');', 1, 201, 'RAPIDA', 'editor'),
(102, 8, 'Rápida: BETWEEN clásico', 'Nivel entre 10 y 30.', 'SELECT * FROM aventureros WHERE nivel BETWEEN 10 AND 30;', 1, 201, 'RAPIDA', 'editor'),
(103, 8, 'Rápida: NULL especial', 'Quién tiene nivel NULL.', 'SELECT nombre FROM aventureros WHERE nivel IS NULL;', 1, 202, 'RAPIDA', 'editor');

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

SELECT m.id_modulo, m.titulo, COUNT(e.id_ejercicio) as ejercicios
FROM lms_core.modulos m
LEFT JOIN lms_core.ejercicios_practicos e ON m.id_modulo = e.id_modulo
WHERE m.id_curso = 1
GROUP BY m.id_modulo, m.titulo
ORDER BY m.id_modulo;