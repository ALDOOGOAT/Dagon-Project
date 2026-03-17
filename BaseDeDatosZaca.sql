-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Para generar UUIDs

-- 2. Esquemas de separación lógica
CREATE SCHEMA IF NOT EXISTS lms_core;
        CREATE SCHEMA IF NOT EXISTS lms_sandbox;

-- 3. Dominios con POSIX Regex (Validación estricta a nivel motor)
CREATE DOMAIN lms_core.email_valido AS VARCHAR(150)
CHECK (
    VALUE ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'
);

-- 4. Seguridad: Roles del Sistema
CREATE TABLE lms_core.roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

-- 5. Usuarios (Blindado con el dominio email_valido)
CREATE TABLE lms_core.usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email lms_core.email_valido UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT REFERENCES lms_core.roles(id_rol) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Estructura Académica (Cursos y Módulos)
CREATE TABLE lms_core.cursos (
    id_curso SERIAL PRIMARY KEY,
    titulo VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE lms_core.modulos (
    id_modulo SERIAL PRIMARY KEY,
    id_curso INT REFERENCES lms_core.cursos(id_curso) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    orden INT NOT NULL CHECK (orden > 0),
    UNIQUE (id_curso, orden) -- Evita que dos módulos tengan el mismo orden en un curso
);

-- 7. Ejercicios Prácticos (JSONB para flexibilidad extrema)
CREATE TABLE lms_core.ejercicios_practicos (
    id_ejercicio SERIAL PRIMARY KEY,
    id_modulo INT REFERENCES lms_core.modulos(id_modulo) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    query_maestra TEXT NOT NULL,
    dificultad INT CHECK (dificultad BETWEEN 1 AND 5),
    configuracion_extra JSONB -- Ejemplo: {"prohibido_usar": ["DROP", "TRUNCATE"]}
);

-- 8. Transaccional: Intentos de Resolución
CREATE TABLE lms_core.intentos (
    id_intento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES lms_core.usuarios(id_usuario) ON DELETE CASCADE,
    id_ejercicio INT REFERENCES lms_core.ejercicios_practicos(id_ejercicio) ON DELETE CASCADE,
    query_enviada TEXT NOT NULL,
    es_correcto BOOLEAN NOT NULL,
    tiempo_ms NUMERIC(8,2), -- Tiempo de ejecución del EXPLAIN
    fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Auditoría (Para registrar movimientos del profesor)
CREATE TABLE lms_core.auditoria_logs (
    id_log SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50),
    operacion VARCHAR(10),
    usuario_db VARCHAR(50),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_antiguos JSONB
);

-- Función Trigger para Auditoría
CREATE OR REPLACE FUNCTION lms_core.fn_auditar_ejercicios()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO lms_core.auditoria_logs (tabla_afectada, operacion, usuario_db, datos_antiguos)
    VALUES (
        TG_TABLE_NAME, 
        TG_OP, 
        current_user, 
        row_to_json(OLD)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger disparado al actualizar un ejercicio
CREATE TRIGGER trg_auditar_update_ejercicio
AFTER UPDATE ON lms_core.ejercicios_practicos
FOR EACH ROW
WHEN (OLD.query_maestra IS DISTINCT FROM NEW.query_maestra)
EXECUTE FUNCTION lms_core.fn_auditar_ejercicios();

-- Interceptar DELETE en usuarios y convertirlo en UPDATE (activo = false)
CREATE RULE regla_soft_delete_usuarios AS 
ON DELETE TO lms_core.usuarios
DO INSTEAD 
    UPDATE lms_core.usuarios 
    SET activo = FALSE 
    WHERE id_usuario = OLD.id_usuario;

-- Vista Materializada del Ranking (Leaderboard)
CREATE MATERIALIZED VIEW lms_core.mv_ranking_alumnos AS
SELECT 
    u.id_usuario,
    u.nombre,
    COUNT(i.id_intento) AS ejercicios_resueltos,
    SUM(e.dificultad * 10) AS xp_total
FROM lms_core.usuarios u
JOIN lms_core.intentos i ON u.id_usuario = i.id_usuario
JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio
WHERE i.es_correcto = TRUE AND u.activo = TRUE
GROUP BY u.id_usuario, u.nombre
ORDER BY xp_total DESC;

-- Índice para que la vista sea ultrarrápida al buscar un usuario específico
CREATE UNIQUE INDEX idx_mv_ranking_usuario ON lms_core.mv_ranking_alumnos(id_usuario);

-- Crear el rol para la aplicación Spring Boot
CREATE ROLE app_backend_user WITH LOGIN PASSWORD 'Supercell98@';

-- Dar permiso de uso en los esquemas
GRANT USAGE ON SCHEMA lms_core TO app_backend_user;
GRANT USAGE ON SCHEMA lms_sandbox TO app_backend_user;

-- Dar permisos CRUD a todas las tablas actuales en core
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA lms_core TO app_backend_user;

-- Dar permisos a las secuencias (importante para las tablas con SERIAL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA lms_core TO app_backend_user;


-------
-- 1. Borramos la vista materializada estática y su índice
DROP MATERIALIZED VIEW IF EXISTS lms_core.mv_ranking_alumnos CASCADE;

-- 2. Creamos una Vista Dinámica (Tiempo real) con el parche anti-farmeo (DISTINCT)
CREATE VIEW lms_core.v_ranking_alumnos AS
SELECT 
    u.id_usuario,
    u.nombre,
    COUNT(DISTINCT i.id_ejercicio) AS ejercicios_resueltos,
    SUM(e.dificultad * 10) AS xp_total
FROM lms_core.usuarios u
JOIN (
    -- Subconsulta que filtra solo los aciertos únicos por usuario
    SELECT DISTINCT id_usuario, id_ejercicio 
    FROM lms_core.intentos 
    WHERE es_correcto = TRUE
) i ON u.id_usuario = i.id_usuario
JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio
WHERE u.activo = TRUE
GROUP BY u.id_usuario, u.nombre
ORDER BY xp_total DESC;

-- 3. Le damos permiso al usuario de Java para leer esta nueva vista
GRANT SELECT ON lms_core.v_ranking_alumnos TO app_backend_user;



-- 1. Asegurarnos de que el área de juegos (Sandbox) existe
CREATE SCHEMA IF NOT EXISTS lms_sandbox;

-- 2. Creamos la tabla de práctica que pide la Misión 1, 2 y 3
CREATE TABLE lms_sandbox.aventureros (
    id_aventurero SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    clase VARCHAR(50),
    nivel INT
);

-- 3. Sembramos datos de prueba (Los personajes de tu juego)
INSERT INTO lms_sandbox.aventureros (nombre, clase, nivel) VALUES 
('Loya', 'Caballero', 15),
('Zoe', 'Maga Suprema', 20),
('Jared', 'Arquero', 8),
('Aldo', 'Guerrero', 30),
('Dan', 'Asesino', 25);

-- 4. ¡LA MAGIA DE LA SEGURIDAD! Creamos al usuario restringido
CREATE ROLE app_sandbox_user WITH LOGIN PASSWORD 'Taxi2097';

-- 5. Le damos permiso ÚNICAMENTE de entrar al Sandbox
GRANT USAGE ON SCHEMA lms_sandbox TO app_sandbox_user;

-- 6. Le damos permiso ÚNICAMENTE de hacer SELECT (leer). ¡Cero INSERT, UPDATE o DELETE!
GRANT SELECT ON ALL TABLES IN SCHEMA lms_sandbox TO app_sandbox_user;

-- 7. (Opcional pero recomendado) Si creamos más tablas de práctica a futuro, 
-- que el sandbox_user tenga permiso de leerlas automáticamente
ALTER DEFAULT PRIVILEGES IN SCHEMA lms_sandbox GRANT SELECT ON TABLES TO app_sandbox_user;

-- 8. Nos aseguramos de bloquearle la puerta al esquema principal (core)
REVOKE ALL ON SCHEMA lms_core FROM app_sandbox_user;

--------modificacion
-- 1. Insertamos un Curso Base (Tu tabla modulos requiere un id_curso por llave foránea)
INSERT INTO lms_core.cursos (titulo)
VALUES ('Dagon: Fundamentos de SQL')
ON CONFLICT (titulo) DO NOTHING;

-- 2. Evolucionamos tu tabla de Módulos (Agregamos la XP y Descripción)
ALTER TABLE lms_core.modulos
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS xp_requerida INT DEFAULT 0;

-- 3. Evolucionamos tu tabla de Ejercicios (Ahora serán visualmente las "Misiones")
ALTER TABLE lms_core.ejercicios_practicos
ADD COLUMN IF NOT EXISTS titulo VARCHAR(150) DEFAULT 'Misión Desconocida',
ADD COLUMN IF NOT EXISTS orden INT DEFAULT 1;

-- 4. Actualizamos/Insertamos el Módulo 1 (Si ya tenías el de aventureros aquí, esto no lo borra, solo le actualiza la descripción y la XP)
INSERT INTO lms_core.modulos (id_curso, titulo, descripcion, orden, xp_requerida)
SELECT id_curso, 'Módulo 1: Selección Básica', 'Aprende a consultar datos con SELECT y filtros WHERE.', 1, 0
FROM lms_core.cursos WHERE titulo = 'Dagon: Fundamentos de SQL'
ON CONFLICT (id_curso, orden) 
DO UPDATE SET descripcion = EXCLUDED.descripcion, xp_requerida = EXCLUDED.xp_requerida;

-- 5. Insertamos los Módulos 2 y 3 (Bloqueados por XP)
INSERT INTO lms_core.modulos (id_curso, titulo, descripcion, orden, xp_requerida)
SELECT id_curso, 'Módulo 2: Funciones Agregadas', 'Domina COUNT, SUM, AVG y agrupaciones con GROUP BY.', 2, 60
FROM lms_core.cursos WHERE titulo = 'Dagon: Fundamentos de SQL'
ON CONFLICT (id_curso, orden) DO NOTHING;

INSERT INTO lms_core.modulos (id_curso, titulo, descripcion, orden, xp_requerida)
SELECT id_curso, 'Módulo 3: El Arte de los JOINs', 'Combina múltiples tablas como un experto relacional.', 3, 150
FROM lms_core.cursos WHERE titulo = 'Dagon: Fundamentos de SQL'
ON CONFLICT (id_curso, orden) DO NOTHING;


---------modificacion a modulos arreglo
-- 1. LIMPIEZA TOTAL: Borramos módulos y misiones duplicadas, y reiniciamos los IDs a 1, 2 y 3.
TRUNCATE TABLE lms_core.modulos CASCADE;
ALTER SEQUENCE lms_core.modulos_id_modulo_seq RESTART WITH 1;
ALTER SEQUENCE lms_core.ejercicios_practicos_id_ejercicio_seq RESTART WITH 1;

-- 2. Insertamos los 3 Módulos de forma limpia y perfecta
INSERT INTO lms_core.modulos (id_curso, titulo, descripcion, orden, xp_requerida) VALUES
((SELECT id_curso FROM lms_core.cursos LIMIT 1), 'Módulo 1: Selección Básica', 'Aprende a consultar datos con SELECT y filtros WHERE.', 1, 0),
((SELECT id_curso FROM lms_core.cursos LIMIT 1), 'Módulo 2: Funciones Agregadas', 'Domina COUNT, SUM, AVG y agrupaciones con GROUP BY.', 2, 60),
((SELECT id_curso FROM lms_core.cursos LIMIT 1), 'Módulo 3: El Arte de los JOINs', 'Combina múltiples tablas como un experto relacional.', 3, 150);

-- ==========================================
-- MISIONES DEL MÓDULO 1 (4 Niveles)
-- ==========================================
INSERT INTO lms_core.ejercicios_practicos (id_modulo, titulo, enunciado, query_maestra, dificultad, orden) VALUES
(1, 'Misión 1: El Despertar', 'Los registros antiguos indican que hay aventureros durmiendo en la base de datos. Trae TODAS las columnas de la tabla aventureros usando el asterisco (*).', 'SELECT * FROM aventureros;', 1, 1),
(1, 'Misión 2: Identificando a los Héroes', 'No necesitamos todos los datos ahora. Escribe una consulta que seleccione únicamente la columna "nombre" y "clase" de la tabla aventureros.', 'SELECT nombre, clase FROM aventureros;', 2, 2),
(1, 'Misión 3: Reclutamiento de Élite', 'Usa la cláusula WHERE para filtrar. Selecciona el "nombre" de los aventureros que tengan un "nivel" mayor a 15.', 'SELECT nombre FROM aventureros WHERE nivel > 15;', 3, 3),
(1, 'Misión 4: Búsqueda Específica', 'Encuentra a los magos. Selecciona todas las columnas (*) de los aventureros donde la "clase" sea exactamente ''Maga Suprema''.', 'SELECT * FROM aventureros WHERE clase = ''Maga Suprema'';', 3, 4);

-- ==========================================
-- MISIONES DEL MÓDULO 2 (4 Niveles)
-- ==========================================
INSERT INTO lms_core.ejercicios_practicos (id_modulo, titulo, enunciado, query_maestra, dificultad, orden) VALUES
(2, 'Misión 1: Contando Tropas', 'El Gremio necesita un inventario rápido. Usa la función COUNT(*) para saber cuántos aventureros en total están registrados.', 'SELECT COUNT(*) FROM aventureros;', 2, 1),
(2, 'Misión 2: El Tesoro del Gremio', 'El tesorero quiere saber cuánto oro hay invertido. Usa SUM(precio) para calcular el valor total en la tabla equipamiento.', 'SELECT SUM(precio) FROM equipamiento;', 2, 2),
(2, 'Misión 3: El Guerrero Más Fuerte', 'Necesitamos enviar al mejor guerrero a una misión peligrosa. Usa MAX(nivel) para descubrir el nivel más alto entre los aventureros.', 'SELECT MAX(nivel) FROM aventureros;', 3, 3),
(2, 'Misión 4: Censando por Clases', '¡Hora de agrupar! El rey quiere saber cuántos aventureros hay de cada clase. Muestra la columna "clase" y usa COUNT(*) combinándolo con GROUP BY.', 'SELECT clase, COUNT(*) FROM aventureros GROUP BY clase;', 4, 4);

-- ==========================================
-- MISIONES DEL MÓDULO 3 (4 Niveles)
-- ==========================================
INSERT INTO lms_core.ejercicios_practicos (id_modulo, titulo, enunciado, query_maestra, dificultad, orden) VALUES
(3, 'Misión 1: Uniendo Fuerzas', 'Haz un INNER JOIN entre la tabla aventureros y equipamiento. Une ambas usando "id_aventurero" y muestra el "nombre" y el "item".', 'SELECT aventureros.nombre, equipamiento.item FROM aventureros INNER JOIN equipamiento ON aventureros.id_aventurero = equipamiento.id_aventurero;', 3, 1),
(3, 'Misión 2: Arsenal Específico', 'Haz el mismo INNER JOIN de la misión anterior, pero agrega un WHERE para mostrar únicamente los items de la clase ''Caballero''.', 'SELECT aventureros.nombre, equipamiento.item FROM aventureros INNER JOIN equipamiento ON aventureros.id_aventurero = equipamiento.id_aventurero WHERE aventureros.clase = ''Caballero'';', 4, 2),
(3, 'Misión 3: Nadie se Queda Atrás', 'Usa un LEFT JOIN desde aventureros hacia equipamiento para mostrar los nombres de TODOS los aventureros, incluso si no tienen item.', 'SELECT aventureros.nombre, equipamiento.item FROM aventureros LEFT JOIN equipamiento ON aventureros.id_aventurero = equipamiento.id_aventurero;', 4, 3),
(3, 'Misión 4: El Valor de un Héroe', 'Une aventureros y equipamiento, muestra el "nombre", usa SUM(precio) para sumar el valor de sus armas, y agrupa por nombre.', 'SELECT aventureros.nombre, SUM(equipamiento.precio) FROM aventureros INNER JOIN equipamiento ON aventureros.id_aventurero = equipamiento.id_aventurero GROUP BY aventureros.nombre;', 5, 4);


-----

-- 1. Borramos la vista anterior para poder modificarla
DROP VIEW IF EXISTS lms_core.v_ranking_alumnos CASCADE;

-- 2. Creamos la Nueva Vista Maestra (Incluyendo a todos los usuarios y su email)
CREATE VIEW lms_core.v_ranking_alumnos AS
SELECT 
    u.id_usuario,
    u.nombre,
    u.email, -- Agregamos el email para que Java pueda buscar al usuario logueado
    COUNT(DISTINCT i.id_ejercicio) AS ejercicios_resueltos,
    COALESCE(SUM(e.dificultad * 10), 0) AS xp_total
FROM lms_core.usuarios u
LEFT JOIN (
    -- Subconsulta que filtra solo los aciertos únicos por usuario
    SELECT DISTINCT id_usuario, id_ejercicio 
    FROM lms_core.intentos 
    WHERE es_correcto = TRUE
) i ON u.id_usuario = i.id_usuario
LEFT JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio
WHERE u.activo = TRUE
GROUP BY u.id_usuario, u.nombre, u.email
ORDER BY xp_total DESC, ejercicios_resueltos DESC, u.nombre ASC;

-- 3. Nos aseguramos de que el usuario de Java pueda leerla
GRANT SELECT ON lms_core.v_ranking_alumnos TO app_backend_user;-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Para generar UUIDs

-- 2. Esquemas de separación lógica
CREATE SCHEMA IF NOT EXISTS lms_core;
        CREATE SCHEMA IF NOT EXISTS lms_sandbox;

-- 3. Dominios con POSIX Regex (Validación estricta a nivel motor)
CREATE DOMAIN lms_core.email_valido AS VARCHAR(150)
CHECK (
    VALUE ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'
);

-- 4. Seguridad: Roles del Sistema
CREATE TABLE lms_core.roles (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

-- 5. Usuarios (Blindado con el dominio email_valido)
CREATE TABLE lms_core.usuarios (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email lms_core.email_valido UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    id_rol INT REFERENCES lms_core.roles(id_rol) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Estructura Académica (Cursos y Módulos)
CREATE TABLE lms_core.cursos (
    id_curso SERIAL PRIMARY KEY,
    titulo VARCHAR(150) UNIQUE NOT NULL
);

CREATE TABLE lms_core.modulos (
    id_modulo SERIAL PRIMARY KEY,
    id_curso INT REFERENCES lms_core.cursos(id_curso) ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    orden INT NOT NULL CHECK (orden > 0),
    UNIQUE (id_curso, orden) -- Evita que dos módulos tengan el mismo orden en un curso
);

-- 7. Ejercicios Prácticos (JSONB para flexibilidad extrema)
CREATE TABLE lms_core.ejercicios_practicos (
    id_ejercicio SERIAL PRIMARY KEY,
    id_modulo INT REFERENCES lms_core.modulos(id_modulo) ON DELETE CASCADE,
    enunciado TEXT NOT NULL,
    query_maestra TEXT NOT NULL,
    dificultad INT CHECK (dificultad BETWEEN 1 AND 5),
    configuracion_extra JSONB -- Ejemplo: {"prohibido_usar": ["DROP", "TRUNCATE"]}
);

-- 8. Transaccional: Intentos de Resolución
CREATE TABLE lms_core.intentos (
    id_intento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID REFERENCES lms_core.usuarios(id_usuario) ON DELETE CASCADE,
    id_ejercicio INT REFERENCES lms_core.ejercicios_practicos(id_ejercicio) ON DELETE CASCADE,
    query_enviada TEXT NOT NULL,
    es_correcto BOOLEAN NOT NULL,
    tiempo_ms NUMERIC(8,2), -- Tiempo de ejecución del EXPLAIN
    fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Auditoría (Para registrar movimientos del profesor)
CREATE TABLE lms_core.auditoria_logs (
    id_log SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50),
    operacion VARCHAR(10),
    usuario_db VARCHAR(50),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    datos_antiguos JSONB
);

-- Función Trigger para Auditoría
CREATE OR REPLACE FUNCTION lms_core.fn_auditar_ejercicios()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO lms_core.auditoria_logs (tabla_afectada, operacion, usuario_db, datos_antiguos)
    VALUES (
        TG_TABLE_NAME, 
        TG_OP, 
        current_user, 
        row_to_json(OLD)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger disparado al actualizar un ejercicio
CREATE TRIGGER trg_auditar_update_ejercicio
AFTER UPDATE ON lms_core.ejercicios_practicos
FOR EACH ROW
WHEN (OLD.query_maestra IS DISTINCT FROM NEW.query_maestra)
EXECUTE FUNCTION lms_core.fn_auditar_ejercicios();

-- Interceptar DELETE en usuarios y convertirlo en UPDATE (activo = false)
CREATE RULE regla_soft_delete_usuarios AS 
ON DELETE TO lms_core.usuarios
DO INSTEAD 
    UPDATE lms_core.usuarios 
    SET activo = FALSE 
    WHERE id_usuario = OLD.id_usuario;

-- Vista Materializada del Ranking (Leaderboard)
CREATE MATERIALIZED VIEW lms_core.mv_ranking_alumnos AS
SELECT 
    u.id_usuario,
    u.nombre,
    COUNT(i.id_intento) AS ejercicios_resueltos,
    SUM(e.dificultad * 10) AS xp_total
FROM lms_core.usuarios u
JOIN lms_core.intentos i ON u.id_usuario = i.id_usuario
JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio
WHERE i.es_correcto = TRUE AND u.activo = TRUE
GROUP BY u.id_usuario, u.nombre
ORDER BY xp_total DESC;

-- Índice para que la vista sea ultrarrápida al buscar un usuario específico
CREATE UNIQUE INDEX idx_mv_ranking_usuario ON lms_core.mv_ranking_alumnos(id_usuario);

-- Crear el rol para la aplicación Spring Boot
CREATE ROLE app_backend_user WITH LOGIN PASSWORD 'Supercell98@';

-- Dar permiso de uso en los esquemas
GRANT USAGE ON SCHEMA lms_core TO app_backend_user;
GRANT USAGE ON SCHEMA lms_sandbox TO app_backend_user;

-- Dar permisos CRUD a todas las tablas actuales en core
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA lms_core TO app_backend_user;

-- Dar permisos a las secuencias (importante para las tablas con SERIAL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA lms_core TO app_backend_user;


-------
-- 1. Borramos la vista materializada estática y su índice
DROP MATERIALIZED VIEW IF EXISTS lms_core.mv_ranking_alumnos CASCADE;

-- 2. Creamos una Vista Dinámica (Tiempo real) con el parche anti-farmeo (DISTINCT)
CREATE VIEW lms_core.v_ranking_alumnos AS
SELECT 
    u.id_usuario,
    u.nombre,
    COUNT(DISTINCT i.id_ejercicio) AS ejercicios_resueltos,
    SUM(e.dificultad * 10) AS xp_total
FROM lms_core.usuarios u
JOIN (
    -- Subconsulta que filtra solo los aciertos únicos por usuario
    SELECT DISTINCT id_usuario, id_ejercicio 
    FROM lms_core.intentos 
    WHERE es_correcto = TRUE
) i ON u.id_usuario = i.id_usuario
JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio
WHERE u.activo = TRUE
GROUP BY u.id_usuario, u.nombre
ORDER BY xp_total DESC;

-- 3. Le damos permiso al usuario de Java para leer esta nueva vista
GRANT SELECT ON lms_core.v_ranking_alumnos TO app_backend_user;

--- sida cambio de nuevo
-- 1. Nos aseguramos de que el esquema Sandbox exista
CREATE SCHEMA IF NOT EXISTS lms_sandbox;

-- ==========================================
-- TABLA 1: AVENTUREROS (Para Módulo 1, 2 y 3)
-- ==========================================
CREATE TABLE IF NOT EXISTS lms_sandbox.aventureros (
    id_aventurero SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    clase VARCHAR(50),
    nivel INT
);

-- Limpiamos e insertamos datos frescos
TRUNCATE TABLE lms_sandbox.aventureros RESTART IDENTITY CASCADE;
INSERT INTO lms_sandbox.aventureros (nombre, clase, nivel) VALUES 
('Loya', 'Caballero', 15),
('Zoe', 'Maga Suprema', 20),
('Jared', 'Arquero', 8),
('Aldo', 'Guerrero', 30),
('Dan', 'Asesino', 25);

-- ==========================================
-- TABLA 2: EQUIPAMIENTO (Para Módulo 2 y 3)
-- ==========================================
CREATE TABLE IF NOT EXISTS lms_sandbox.equipamiento (
    id_equipo SERIAL PRIMARY KEY,
    id_aventurero INT,
    item VARCHAR(50),
    precio INT
);

-- Limpiamos e insertamos datos frescos
TRUNCATE TABLE lms_sandbox.equipamiento RESTART IDENTITY CASCADE;
INSERT INTO lms_sandbox.equipamiento (id_aventurero, item, precio) VALUES
(1, 'Espada Larga', 150),
(1, 'Escudo de Hierro', 100),
(2, 'Báculo de Fuego', 300),
(4, 'Hacha Doble', 200),
(5, 'Daga Venenosa', 120);

-- ==========================================
-- SEGURIDAD: PERMISOS DEL SANDBOX
-- ==========================================
-- Le damos permiso al usuario restringido de Java para entrar al sandbox
GRANT USAGE ON SCHEMA lms_sandbox TO app_sandbox_user;

-- Le damos permiso EXCLUSIVO de lectura (SELECT) a ambas tablas
GRANT SELECT ON lms_sandbox.aventureros TO app_sandbox_user;
GRANT SELECT ON lms_sandbox.equipamiento TO app_sandbox_user;
