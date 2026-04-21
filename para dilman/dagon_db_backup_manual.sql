--
-- PostgreSQL database dump
--

\restrict CAgicoKIYHfryotwRZaAsacJOHB2eHAFPv0gsUgew46YGOGPghKqNyHLRbAVfgx

-- Dumped from database version 17.9 (Postgres.app)
-- Dumped by pg_dump version 17.9 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: lms_core; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA lms_core;


ALTER SCHEMA lms_core OWNER TO postgres;

--
-- Name: lms_sandbox; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA lms_sandbox;


ALTER SCHEMA lms_sandbox OWNER TO postgres;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: email_valido; Type: DOMAIN; Schema: lms_core; Owner: postgres
--

CREATE DOMAIN lms_core.email_valido AS text
	CONSTRAINT email_valido_check CHECK ((VALUE ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'::text));


ALTER DOMAIN lms_core.email_valido OWNER TO postgres;

--
-- Name: fn_auditar_ejercicios(); Type: FUNCTION; Schema: lms_core; Owner: postgres
--

CREATE FUNCTION lms_core.fn_auditar_ejercicios() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION lms_core.fn_auditar_ejercicios() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditoria_logs; Type: TABLE; Schema: lms_core; Owner: postgres
--

CREATE TABLE lms_core.auditoria_logs (
    id_log integer NOT NULL,
    tabla_afectada text,
    operacion text,
    usuario_db text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    datos_antiguos jsonb
);


ALTER TABLE lms_core.auditoria_logs OWNER TO postgres;

--
-- Name: auditoria_logs_id_log_seq; Type: SEQUENCE; Schema: lms_core; Owner: postgres
--

CREATE SEQUENCE lms_core.auditoria_logs_id_log_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_core.auditoria_logs_id_log_seq OWNER TO postgres;

--
-- Name: auditoria_logs_id_log_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: postgres
--

ALTER SEQUENCE lms_core.auditoria_logs_id_log_seq OWNED BY lms_core.auditoria_logs.id_log;


--
-- Name: cursos; Type: TABLE; Schema: lms_core; Owner: postgres
--

CREATE TABLE lms_core.cursos (
    id_curso integer NOT NULL,
    titulo text NOT NULL
);


ALTER TABLE lms_core.cursos OWNER TO postgres;

--
-- Name: cursos_id_curso_seq; Type: SEQUENCE; Schema: lms_core; Owner: postgres
--

CREATE SEQUENCE lms_core.cursos_id_curso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_core.cursos_id_curso_seq OWNER TO postgres;

--
-- Name: cursos_id_curso_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: postgres
--

ALTER SEQUENCE lms_core.cursos_id_curso_seq OWNED BY lms_core.cursos.id_curso;


--
-- Name: ejercicios_practicos; Type: TABLE; Schema: lms_core; Owner: postgres
--

CREATE TABLE lms_core.ejercicios_practicos (
    id_ejercicio integer NOT NULL,
    id_modulo integer,
    enunciado text NOT NULL,
    query_maestra text NOT NULL,
    dificultad integer,
    configuracion_extra jsonb,
    titulo text DEFAULT 'Misión Desconocida'::character varying,
    orden integer DEFAULT 1,
    tipo_mision text DEFAULT 'HISTORIA'::text,
    formato character varying(50) DEFAULT 'editor'::character varying,
    CONSTRAINT ejercicios_practicos_dificultad_check CHECK (((dificultad >= 1) AND (dificultad <= 5)))
);


ALTER TABLE lms_core.ejercicios_practicos OWNER TO postgres;

--
-- Name: ejercicios_practicos_id_ejercicio_seq; Type: SEQUENCE; Schema: lms_core; Owner: postgres
--

CREATE SEQUENCE lms_core.ejercicios_practicos_id_ejercicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_core.ejercicios_practicos_id_ejercicio_seq OWNER TO postgres;

--
-- Name: ejercicios_practicos_id_ejercicio_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: postgres
--

ALTER SEQUENCE lms_core.ejercicios_practicos_id_ejercicio_seq OWNED BY lms_core.ejercicios_practicos.id_ejercicio;


--
-- Name: intentos; Type: TABLE; Schema: lms_core; Owner: postgres
--

CREATE TABLE lms_core.intentos (
    id_intento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid,
    id_ejercicio integer,
    query_enviada text NOT NULL,
    es_correcto boolean NOT NULL,
    tiempo_ms numeric(8,2),
    fecha_intento timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE lms_core.intentos OWNER TO postgres;

--
-- Name: modulos; Type: TABLE; Schema: lms_core; Owner: postgres
--

CREATE TABLE lms_core.modulos (
    id_modulo integer NOT NULL,
    id_curso integer,
    titulo text NOT NULL,
    orden integer NOT NULL,
    descripcion text,
    xp_requerida integer DEFAULT 0,
    CONSTRAINT modulos_orden_check CHECK ((orden > 0))
);


ALTER TABLE lms_core.modulos OWNER TO postgres;

--
-- Name: modulos_id_modulo_seq; Type: SEQUENCE; Schema: lms_core; Owner: postgres
--

CREATE SEQUENCE lms_core.modulos_id_modulo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_core.modulos_id_modulo_seq OWNER TO postgres;

--
-- Name: modulos_id_modulo_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: postgres
--

ALTER SEQUENCE lms_core.modulos_id_modulo_seq OWNED BY lms_core.modulos.id_modulo;


--
-- Name: roles; Type: TABLE; Schema: lms_core; Owner: postgres
--

CREATE TABLE lms_core.roles (
    id_rol integer NOT NULL,
    nombre text NOT NULL
);


ALTER TABLE lms_core.roles OWNER TO postgres;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: lms_core; Owner: postgres
--

CREATE SEQUENCE lms_core.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_core.roles_id_rol_seq OWNER TO postgres;

--
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: postgres
--

ALTER SEQUENCE lms_core.roles_id_rol_seq OWNED BY lms_core.roles.id_rol;


--
-- Name: usuarios; Type: TABLE; Schema: lms_core; Owner: postgres
--

CREATE TABLE lms_core.usuarios (
    id_usuario uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    email lms_core.email_valido NOT NULL,
    password_hash text NOT NULL,
    id_rol integer,
    activo boolean DEFAULT true,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    racha_actual integer DEFAULT 0,
    ultima_practica date,
    mejor_racha integer DEFAULT 0
);


ALTER TABLE lms_core.usuarios OWNER TO postgres;

--
-- Name: v_ranking_alumnos; Type: VIEW; Schema: lms_core; Owner: postgres
--

CREATE VIEW lms_core.v_ranking_alumnos AS
 SELECT u.id_usuario,
    u.nombre,
    u.email,
    count(DISTINCT i.id_ejercicio) AS ejercicios_resueltos,
    COALESCE(sum(
        CASE
            WHEN (e.tipo_mision = 'RAPIDA'::text) THEN 5
            ELSE (e.dificultad * 10)
        END), (0)::bigint) AS xp_total
   FROM ((lms_core.usuarios u
     LEFT JOIN ( SELECT DISTINCT intentos.id_usuario,
            intentos.id_ejercicio
           FROM lms_core.intentos
          WHERE (intentos.es_correcto = true)) i ON ((u.id_usuario = i.id_usuario)))
     LEFT JOIN lms_core.ejercicios_practicos e ON ((i.id_ejercicio = e.id_ejercicio)))
  WHERE (u.activo = true)
  GROUP BY u.id_usuario, u.nombre, u.email
  ORDER BY COALESCE(sum(
        CASE
            WHEN (e.tipo_mision = 'RAPIDA'::text) THEN 5
            ELSE (e.dificultad * 10)
        END), (0)::bigint) DESC, (count(DISTINCT i.id_ejercicio)) DESC, u.nombre;


ALTER VIEW lms_core.v_ranking_alumnos OWNER TO postgres;

--
-- Name: aventureros; Type: TABLE; Schema: lms_sandbox; Owner: postgres
--

CREATE TABLE lms_sandbox.aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


ALTER TABLE lms_sandbox.aventureros OWNER TO postgres;

--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: lms_sandbox; Owner: postgres
--

CREATE SEQUENCE lms_sandbox.aventureros_id_aventurero_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_sandbox.aventureros_id_aventurero_seq OWNER TO postgres;

--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox; Owner: postgres
--

ALTER SEQUENCE lms_sandbox.aventureros_id_aventurero_seq OWNED BY lms_sandbox.aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: lms_sandbox; Owner: postgres
--

CREATE TABLE lms_sandbox.equipamiento (
    id_equipo integer NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


ALTER TABLE lms_sandbox.equipamiento OWNER TO postgres;

--
-- Name: equipamiento_id_equipo_seq; Type: SEQUENCE; Schema: lms_sandbox; Owner: postgres
--

CREATE SEQUENCE lms_sandbox.equipamiento_id_equipo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_sandbox.equipamiento_id_equipo_seq OWNER TO postgres;

--
-- Name: equipamiento_id_equipo_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox; Owner: postgres
--

ALTER SEQUENCE lms_sandbox.equipamiento_id_equipo_seq OWNED BY lms_sandbox.equipamiento.id_equipo;


--
-- Name: habitaciones; Type: TABLE; Schema: lms_sandbox; Owner: dilhanmora
--

CREATE TABLE lms_sandbox.habitaciones (
    id integer NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


ALTER TABLE lms_sandbox.habitaciones OWNER TO dilhanmora;

--
-- Name: habitaciones_id_seq; Type: SEQUENCE; Schema: lms_sandbox; Owner: dilhanmora
--

CREATE SEQUENCE lms_sandbox.habitaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_sandbox.habitaciones_id_seq OWNER TO dilhanmora;

--
-- Name: habitaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER SEQUENCE lms_sandbox.habitaciones_id_seq OWNED BY lms_sandbox.habitaciones.id;


--
-- Name: huespedes; Type: TABLE; Schema: lms_sandbox; Owner: dilhanmora
--

CREATE TABLE lms_sandbox.huespedes (
    id integer NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


ALTER TABLE lms_sandbox.huespedes OWNER TO dilhanmora;

--
-- Name: huespedes_id_seq; Type: SEQUENCE; Schema: lms_sandbox; Owner: dilhanmora
--

CREATE SEQUENCE lms_sandbox.huespedes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_sandbox.huespedes_id_seq OWNER TO dilhanmora;

--
-- Name: huespedes_id_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER SEQUENCE lms_sandbox.huespedes_id_seq OWNED BY lms_sandbox.huespedes.id;


--
-- Name: reservas; Type: TABLE; Schema: lms_sandbox; Owner: dilhanmora
--

CREATE TABLE lms_sandbox.reservas (
    id integer NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


ALTER TABLE lms_sandbox.reservas OWNER TO dilhanmora;

--
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: lms_sandbox; Owner: dilhanmora
--

CREATE SEQUENCE lms_sandbox.reservas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE lms_sandbox.reservas_id_seq OWNER TO dilhanmora;

--
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER SEQUENCE lms_sandbox.reservas_id_seq OWNED BY lms_sandbox.reservas.id;


--
-- Name: auditoria_logs id_log; Type: DEFAULT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.auditoria_logs ALTER COLUMN id_log SET DEFAULT nextval('lms_core.auditoria_logs_id_log_seq'::regclass);


--
-- Name: cursos id_curso; Type: DEFAULT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.cursos ALTER COLUMN id_curso SET DEFAULT nextval('lms_core.cursos_id_curso_seq'::regclass);


--
-- Name: ejercicios_practicos id_ejercicio; Type: DEFAULT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.ejercicios_practicos ALTER COLUMN id_ejercicio SET DEFAULT nextval('lms_core.ejercicios_practicos_id_ejercicio_seq'::regclass);


--
-- Name: modulos id_modulo; Type: DEFAULT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.modulos ALTER COLUMN id_modulo SET DEFAULT nextval('lms_core.modulos_id_modulo_seq'::regclass);


--
-- Name: roles id_rol; Type: DEFAULT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.roles ALTER COLUMN id_rol SET DEFAULT nextval('lms_core.roles_id_rol_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: lms_sandbox; Owner: postgres
--

ALTER TABLE ONLY lms_sandbox.aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('lms_sandbox.aventureros_id_aventurero_seq'::regclass);


--
-- Name: equipamiento id_equipo; Type: DEFAULT; Schema: lms_sandbox; Owner: postgres
--

ALTER TABLE ONLY lms_sandbox.equipamiento ALTER COLUMN id_equipo SET DEFAULT nextval('lms_sandbox.equipamiento_id_equipo_seq'::regclass);


--
-- Name: habitaciones id; Type: DEFAULT; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER TABLE ONLY lms_sandbox.habitaciones ALTER COLUMN id SET DEFAULT nextval('lms_sandbox.habitaciones_id_seq'::regclass);


--
-- Name: huespedes id; Type: DEFAULT; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER TABLE ONLY lms_sandbox.huespedes ALTER COLUMN id SET DEFAULT nextval('lms_sandbox.huespedes_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER TABLE ONLY lms_sandbox.reservas ALTER COLUMN id SET DEFAULT nextval('lms_sandbox.reservas_id_seq'::regclass);


--
-- Data for Name: auditoria_logs; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.auditoria_logs (id_log, tabla_afectada, operacion, usuario_db, fecha, datos_antiguos) FROM stdin;
1	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 11:53:32.041361	{"orden": 1, "titulo": "2.1: El Nacimiento", "formato": "editor", "enunciado": "Recluta a un nuevo héroe. Inserta al aventurero 'Gimli', clase 'Guerrero', nivel 10 en la tabla aventureros. Agrega RETURNING * al final para ver tu creación.", "id_modulo": 2, "dificultad": 2, "tipo_mision": "HISTORIA", "id_ejercicio": 10, "query_maestra": "INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Gimli', 'Guerrero', 10) RETURNING *;", "configuracion_extra": null}
2	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 11:53:32.041361	{"orden": 2, "titulo": "2.2: Doble Reclutamiento", "formato": "editor", "enunciado": "Otro recluta se une al gremio. Inserta a la aventurera 'Freya', clase 'Paladín', nivel 12. No olvides RETURNING * para confirmar.", "id_modulo": 2, "dificultad": 2, "tipo_mision": "HISTORIA", "id_ejercicio": 11, "query_maestra": "INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Freya', 'Paladín', 12) RETURNING *;", "configuracion_extra": null}
3	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 11:53:32.041361	{"orden": 3, "titulo": "2.3: Equipando al Héroe", "formato": "editor", "enunciado": "Los héroes necesitan armas. Inserta en la tabla equipamiento un registro: id_aventurero = 1, item = 'Casco de Plata', precio = 80. Usa RETURNING *.", "id_modulo": 2, "dificultad": 2, "tipo_mision": "HISTORIA", "id_ejercicio": 12, "query_maestra": "INSERT INTO equipamiento (id_aventurero, item, precio) VALUES (1, 'Casco de Plata', 80) RETURNING *;", "configuracion_extra": null}
4	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 11:53:32.041361	{"orden": 4, "titulo": "2.4: El Ascenso", "formato": "editor", "enunciado": "Loya ha entrenado duro. Usa UPDATE para cambiar su nivel a 20 en la tabla aventureros. IMPORTANTE: usa WHERE para apuntar solo a Loya. Termina con RETURNING *.", "id_modulo": 2, "dificultad": 3, "tipo_mision": "HISTORIA", "id_ejercicio": 13, "query_maestra": "UPDATE aventureros SET nivel = 20 WHERE nombre = 'Loya' RETURNING *;", "configuracion_extra": null}
5	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 11:53:32.041361	{"orden": 5, "titulo": "2.5: Mejora de Equipo", "formato": "editor", "enunciado": "La Espada Larga ha sido mejorada. Usa UPDATE para cambiar su precio a 250 en la tabla equipamiento. Filtra con WHERE item = 'Espada Larga'. Usa RETURNING *.", "id_modulo": 2, "dificultad": 3, "tipo_mision": "HISTORIA", "id_ejercicio": 14, "query_maestra": "UPDATE equipamiento SET precio = 250 WHERE item = 'Espada Larga' RETURNING *;", "configuracion_extra": null}
6	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 11:53:32.041361	{"orden": 6, "titulo": "2.6: El Sacrificio", "formato": "editor", "enunciado": "El asesino Dan nos ha traicionado. Usa DELETE para borrarlo de la tabla aventureros. SIEMPRE usa WHERE para no borrar todo. Termina con RETURNING *.", "id_modulo": 2, "dificultad": 3, "tipo_mision": "HISTORIA", "id_ejercicio": 15, "query_maestra": "DELETE FROM aventureros WHERE nombre = 'Dan' RETURNING *;", "configuracion_extra": null}
7	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 13:42:10.166366	{"orden": 2, "titulo": "Fase 2: Consulta Maestra", "formato": "editor", "enunciado": "Demuestra tu dominio de JOINs. Une aventureros y equipamiento, filtra los items con precio mayor a 100. Muestra nombre, item y precio ordenados por precio de mayor a menor.", "id_modulo": 4, "dificultad": 5, "tipo_mision": "HISTORIA", "id_ejercicio": 26, "query_maestra": "SELECT a.nombre, e.item, e.precio FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE e.precio > 100 ORDER BY e.precio DESC;", "configuracion_extra": null}
8	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 13:42:10.166366	{"orden": 3, "titulo": "Fase 3: El Ranking Definitivo", "formato": "editor", "enunciado": "Reto final: muestra un ranking de héroes por su gasto total en equipo. Usa INNER JOIN, SUM(e.precio), GROUP BY, y ordena de mayor a menor gasto. Muestra nombre y total.", "id_modulo": 4, "dificultad": 5, "tipo_mision": "HISTORIA", "id_ejercicio": 27, "query_maestra": "SELECT a.nombre, SUM(e.precio) AS total FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre ORDER BY total DESC;", "configuracion_extra": null}
9	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 13:45:02.332115	{"orden": 2, "titulo": "Fase 2: ¿Quién duerme dónde?", "formato": "sql", "enunciado": "¡El posadero está confundido! Necesita una lista de los nombres de los huéspedes y el número de habitación que tienen reservada. \\n\\nInstrucciones:\\n1. Une la tabla \\"huespedes\\" con \\"reservas\\" usando id_huesped.\\n2. Une el resultado con \\"habitaciones\\" usando id_habitacion.\\n3. Muestra solo las columnas \\"nombre\\" (del huésped) y \\"numero\\" (de la habitación).", "id_modulo": 4, "dificultad": 5, "tipo_mision": "HISTORIA", "id_ejercicio": 26, "query_maestra": "SELECT h.nombre, r.numero FROM huespedes h JOIN reservas res ON h.id = res.id_huesped JOIN habitaciones r ON res.id_habitacion = r.id;", "configuracion_extra": null}
10	ejercicios_practicos	UPDATE	dilhanmora	2026-04-20 13:45:02.332115	{"orden": 3, "titulo": "Fase 3: El Oro de la Posada", "formato": "sql", "enunciado": "¡Hora de las cuentas! Dagon quiere saber cuánto oro ha generado cada habitación en total.\\n\\nInstrucciones:\\n1. Une \\"habitaciones\\" con \\"reservas\\".\\n2. Usa SUM(precio_noche) para calcular el total por habitación.\\n3. Agrupa por el \\"numero\\" de habitación.\\n4. Muestra el \\"numero\\" y el \\"total\\".", "id_modulo": 4, "dificultad": 5, "tipo_mision": "HISTORIA", "id_ejercicio": 27, "query_maestra": "SELECT h.numero, SUM(h.precio_noche) as total FROM habitaciones h JOIN reservas r ON h.id = r.id_habitacion GROUP BY h.numero;", "configuracion_extra": null}
\.


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.cursos (id_curso, titulo) FROM stdin;
1	Senda del Guerrero: Administración SQL
2	Senda del Arquitecto: Diseño de BD
\.


--
-- Data for Name: ejercicios_practicos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.ejercicios_practicos (id_ejercicio, id_modulo, enunciado, query_maestra, dificultad, configuracion_extra, titulo, orden, tipo_mision, formato) FROM stdin;
16	3	Tu primera misión de arquitecto: crea UNA entidad llamada 'aventureros'. Dale al menos 2 atributos (columnas) como nombre y clase. Haz clic en '+ Entidad', ponle nombre y agrega atributos.	{"diagrama": "validado"}	2	{"mensaje_error": "Necesitas crear la entidad 'aventureros'.", "min_atributos": 2, "min_entidades": 1, "min_relaciones": 0, "mensaje_relaciones": "", "entidades_requeridas": [["aventurero", "aventureros", "heroes"]]}	3.1: Tu Primera Entidad	1	HISTORIA	diagram
17	3	Ahora crea DOS entidades: 'aventureros' y 'equipamiento'. Conéctalas arrastrando desde el punto cyan de una hasta el punto fucsia de la otra. Esto representa la relación entre ellas.	{"diagrama": "validado"}	3	{"mensaje_error": "Necesitas las entidades 'aventureros' y 'equipamiento'.", "min_atributos": 2, "min_entidades": 2, "min_relaciones": 1, "mensaje_relaciones": "Conecta las entidades arrastrando desde el punto cyan al fucsia.", "entidades_requeridas": [["aventurero", "aventureros"], ["equipamiento", "equipo", "armas", "items"]]}	3.2: Conectando el Puente	2	HISTORIA	diagram
19	4	Hora de usar SQL. Haz un INNER JOIN entre aventureros (alias a) y equipamiento (alias e). Únelos por id_aventurero y muestra el nombre del héroe y el item que porta.	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;	3	\N	3.4: Cruzando el Puente con SQL	1	HISTORIA	editor
20	4	Combina JOIN con WHERE. Repite el JOIN anterior pero filtra solo los items de la clase 'Caballero'. Muestra nombre e item.	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE a.clase = 'Caballero';	4	\N	3.5: Arsenal del Caballero	2	HISTORIA	editor
10	2	¡Nuevo recluta! Añade a un aventurero llamado 'Gimli', de clase 'Guerrero' y nivel 10 a nuestra tabla.	INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Gimli', 'Guerrero', 10);	2	\N	2.1: El Nacimiento	1	HISTORIA	editor
21	4	Usa LEFT JOIN desde aventureros hacia equipamiento para ver a TODOS los héroes, incluso los que no tienen equipo (aparecerán con NULL). Muestra nombre e item.	SELECT a.nombre, e.item FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;	4	\N	3.6: Nadie se Queda Atrás	3	HISTORIA	editor
22	4	Cuenta cuántas armas tiene cada héroe. Usa LEFT JOIN + GROUP BY a.nombre con COUNT(e.item). Muestra nombre y la cuenta.	SELECT a.nombre, COUNT(e.item) FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre;	4	\N	3.7: Conteo de Arsenal	4	HISTORIA	editor
12	2	¡Loya (que tiene el ID 1) necesita equipo nuevo! Para darle un objeto, debemos añadirlo a la tabla "equipamiento". \n\nEscribe una consulta que inserte un registro con estos datos:\n- id_aventurero: 1 (esto vincula el casco con Loya)\n- item: 'Casco de Plata'\n- precio: 80\n\nPiensa en el id_aventurero como una etiqueta que dice a quién le pertenece el casco.	INSERT INTO equipamiento (id_aventurero, item, precio) VALUES (1, 'Casco de Plata', 80);	2	\N	2.3: Equipando al Héroe	3	HISTORIA	editor
11	2	¡Una paladina se une! Inserta a 'Freya', clase 'Paladín', nivel 12 en la tabla de aventureros.	INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Freya', 'Paladín', 12);	2	\N	2.2: Doble Reclutamiento	2	HISTORIA	editor
13	2	¡Loya ha subido de nivel! Usa UPDATE para cambiar su nivel a 20. No olvides el WHERE para no subirle el nivel a todo el mundo por error.	UPDATE aventureros SET nivel = 20 WHERE nombre = 'Loya';	3	\N	2.4: El Ascenso	4	HISTORIA	editor
14	2	La inflacción llega al gremio. Cambia el precio de la 'Espada Larga' a 250 en la tabla de equipamiento.	UPDATE equipamiento SET precio = 250 WHERE item = 'Espada Larga';	3	\N	2.5: Mejora de Equipo	5	HISTORIA	editor
15	2	El traidor Dan debe ser expulsado. Usa DELETE para borrar su registro de la tabla de aventureros. ¡Asegúrate de apuntar bien con el WHERE!	DELETE FROM aventureros WHERE nombre = 'Dan';	3	\N	2.6: El Sacrificio	6	HISTORIA	editor
18	3	Diseña un sistema para la Tienda del Gremio. Necesitamos rastrear quién compra qué. \n\nPasos a seguir:\n1. Crea la entidad "clientes" con los atributos: id (PK), nombre y oro_disponible.\n2. Crea la entidad "productos" con los atributos: id (PK), nombre y precio.\n3. Conecta ambas tablas con una relación de Uno a Muchos (1:N), ya que un cliente puede comprar muchos productos.	{"diagrama": "validado"}	3	{"min_atributos": 4, "min_entidades": 2, "min_relaciones": 1, "entidades_requeridas": [["cliente", "clientes"], ["producto", "productos"]], "relaciones_requeridas": [{"source": "clientes", "target": "productos", "cardinality": "1:N"}]}	3.3: La Tienda del Gremio	3	HISTORIA	diagram
1	1	¡Bienvenido al gremio! Para empezar, necesitamos ver la lista completa de aventureros. Usa el comando mágico SELECT con un asterisco (*) para traer todos los datos de la tabla "aventureros".	SELECT * FROM aventureros;	1	\N	1.1: Tu Primer Vistazo	1	HISTORIA	drag_drop
2	1	A veces no necesitas saber todo. Solo queremos los nombres y las clases de los héroes. Selecciona las columnas "nombre" y "clase" de la tabla "aventureros".	SELECT nombre, clase FROM aventureros;	1	\N	1.2: Eligiendo Columnas	2	HISTORIA	drag_drop
3	1	¡Hay un arsenal secreto! Echa un vistazo a todo lo que hay en la tabla "equipamiento" usando el asterisco (*).	SELECT * FROM equipamiento;	1	\N	1.3: El Arsenal Oculto	3	HISTORIA	drag_drop
4	1	Necesitamos encontrar específicamente al Guerrero. Usa un filtro WHERE para buscar en la tabla "aventureros" a aquel cuya clase sea exactamente igual a 'Guerrero'.	SELECT * FROM aventureros WHERE clase = 'Guerrero';	2	\N	1.4: Buscando al Guerrero	4	HISTORIA	drag_drop
23	4	Calcula el gasto total de cada héroe en equipo. Usa INNER JOIN + GROUP BY a.nombre con SUM(e.precio). Muestra nombre y suma.	SELECT a.nombre, SUM(e.precio) FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre;	5	\N	3.8: El Valor de un Héroe	5	HISTORIA	editor
24	4	Une aventureros y equipamiento con INNER JOIN. Muestra nombre, item y precio. Filtra con WHERE para ver solo items con precio mayor a 100.	SELECT a.nombre, e.item, e.precio FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE e.precio > 100;	5	\N	3.9: Extracción Selectiva	6	HISTORIA	editor
5	1	¡Busca a los veteranos! Muestra solo los nombres de los aventureros que tengan un nivel mayor a 20.	SELECT nombre FROM aventureros WHERE nivel > 20;	2	\N	1.5: Los Más Fuertes	5	HISTORIA	drag_drop
6	1	El detective del gremio busca nombres que empiecen con la letra 'A'. Usa LIKE y el comodín 'A%' para encontrarlos en la tabla "aventureros".	SELECT * FROM aventureros WHERE nombre LIKE 'A%';	2	\N	1.6: El Detective	6	HISTORIA	drag_drop
7	1	¡Orden en las filas! Muestra a todos los aventureros, pero ordénalos por nivel de mayor a menor usando ORDER BY nivel DESC.	SELECT * FROM aventureros ORDER BY nivel DESC;	2	\N	1.7: Ordenando el Caos	7	HISTORIA	drag_drop
8	1	Solo queremos ver a los 3 héroes más poderosos. Combina el orden por nivel descendente con un LIMIT 3.	SELECT * FROM aventureros ORDER BY nivel DESC LIMIT 3;	3	\N	1.8: Los Tres Más Fuertes	8	HISTORIA	drag_drop
9	1	¿Cuántos somos en total? Usa la función COUNT(*) para que la base de datos cuente a todos los aventureros por ti.	SELECT COUNT(*) FROM aventureros;	2	\N	1.9: Métrica Rápida	9	HISTORIA	drag_drop
37	3	¡Has diseñado el plano! Ahora, forja la tabla "pociones" con id (SERIAL PK), nombre (VARCHAR 50) y poder (INTEGER).	CREATE TABLE pociones (id SERIAL PRIMARY KEY, nombre VARCHAR(50), poder INTEGER);	3	{"tipo_validacion": "ddl"}	3.4: Forjando el Metal (DDL)	4	HISTORIA	sql
38	3	¡Cuidado! Olvidamos la columna "rareza". Añádela a la tabla "pociones" (VARCHAR 20).	ALTER TABLE pociones ADD COLUMN rareza VARCHAR(20);	3	{"tipo_validacion": "ddl"}	3.5: Reforzando la Armadura (ALTER)	5	HISTORIA	sql
39	3	La tabla "trastos_viejos" no sirve. Elíminala del registro para siempre.	DROP TABLE trastos_viejos;	2	{"tipo_validacion": "ddl"}	3.6: El Desvío del Abismo (DROP)	6	HISTORIA	sql
40	4	Diseña la Posada: Huespedes, Habitaciones y Reservas.	-- MER JSON --	4	{"min_entidades": 3, "min_relaciones": 2}	Reto Final Fase 1: El Plano	7	HISTORIA	diagram
41	4	Crea la tabla "habitaciones" (id SERIAL PK, numero INTEGER, precio NUMERIC).	CREATE TABLE habitaciones (id SERIAL PRIMARY KEY, numero INTEGER, precio NUMERIC);	4	{"tipo_validacion": "ddl"}	Reto Final Fase 2: Construcción	8	HISTORIA	sql
42	4	Une Huespedes con Habitaciones para el reporte diario.	SELECT h.nombre, hab.numero FROM huespedes h JOIN reservas r ON h.id = r.id_huesped JOIN habitaciones hab ON r.id_habitacion = hab.id;	5	{}	Reto Final Fase 3: Consultas	9	HISTORIA	sql
\.


--
-- Data for Name: intentos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.intentos (id_intento, id_usuario, id_ejercicio, query_enviada, es_correcto, tiempo_ms, fecha_intento) FROM stdin;
f43b5c9b-fb21-4f2c-b746-45698e8e889e	04fa7034-091e-4e3d-82a7-596527b0171b	1	SELECT * FROM aventureros;	t	1500.00	2026-04-19 23:26:06.952636
ecdc604e-f8a5-483c-bf75-2bd2f548fe0a	04fa7034-091e-4e3d-82a7-596527b0171b	2	SELECT nombre, clase FROM aventureros;	t	1500.00	2026-04-19 23:26:06.952636
4ee9df24-e902-4ae2-bd7c-bcae0422b9de	04fa7034-091e-4e3d-82a7-596527b0171b	3	SELECT * FROM equipamiento;	t	1500.00	2026-04-19 23:26:06.952636
30ebd687-93e6-4dae-bc97-f7340da2ef8a	04fa7034-091e-4e3d-82a7-596527b0171b	4	SELECT * FROM aventureros WHERE clase = 'Guerrero';	t	1500.00	2026-04-19 23:26:06.952636
3c5cebdf-53cb-48f8-9d80-7791001d6c96	04fa7034-091e-4e3d-82a7-596527b0171b	5	SELECT nombre FROM aventureros WHERE nivel > 20;	t	1500.00	2026-04-19 23:26:06.952636
37fcb6ed-5bfa-4bed-b235-b12d52761341	04fa7034-091e-4e3d-82a7-596527b0171b	6	SELECT * FROM aventureros WHERE nombre LIKE 'A%';	t	1500.00	2026-04-19 23:26:06.952636
10356fae-1804-45bd-8b46-7857fa11fef8	04fa7034-091e-4e3d-82a7-596527b0171b	7	SELECT * FROM aventureros ORDER BY nivel DESC;	t	1500.00	2026-04-19 23:26:06.952636
57e2a3a7-91d8-45e1-9c30-4b391e159c51	04fa7034-091e-4e3d-82a7-596527b0171b	8	SELECT * FROM aventureros ORDER BY nivel DESC LIMIT 3;	t	1500.00	2026-04-19 23:26:06.952636
1d6c19fb-3b8d-4bf9-a086-75ea00862d08	04fa7034-091e-4e3d-82a7-596527b0171b	9	SELECT COUNT(*) FROM aventureros;	t	1500.00	2026-04-19 23:26:06.952636
28b3094f-86c9-427f-b1e3-f2f5f12273d0	04fa7034-091e-4e3d-82a7-596527b0171b	10	INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Gimli', 'Guerrero', 10) RETURNING *;	t	1500.00	2026-04-19 23:26:06.952636
7a97f251-293e-48c9-89ed-b2deedea9603	04fa7034-091e-4e3d-82a7-596527b0171b	11	INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Freya', 'Paladín', 12) RETURNING *;	t	1500.00	2026-04-19 23:26:06.952636
90af0b88-06c4-4375-8b53-e84c6f6286f1	04fa7034-091e-4e3d-82a7-596527b0171b	12	INSERT INTO equipamiento (id_aventurero, item, precio) VALUES (1, 'Casco de Plata', 80) RETURNING *;	t	1500.00	2026-04-19 23:26:06.952636
09f28ab8-f62d-4aae-a511-05c5938eb873	04fa7034-091e-4e3d-82a7-596527b0171b	13	UPDATE aventureros SET nivel = 20 WHERE nombre = 'Loya' RETURNING *;	t	1500.00	2026-04-19 23:26:06.952636
eb261e30-3481-497b-ac31-d626a10c3a18	04fa7034-091e-4e3d-82a7-596527b0171b	14	UPDATE equipamiento SET precio = 250 WHERE item = 'Espada Larga' RETURNING *;	t	1500.00	2026-04-19 23:26:06.952636
606c9e0d-4b84-4dc7-ae17-51e517fdd9fa	04fa7034-091e-4e3d-82a7-596527b0171b	15	DELETE FROM aventureros WHERE nombre = 'Dan' RETURNING *;	t	1500.00	2026-04-19 23:26:06.952636
8f6a66cb-0ac5-4cb1-bf7b-3b34a49478d1	04fa7034-091e-4e3d-82a7-596527b0171b	16	{"diagrama": "validado"}	t	1500.00	2026-04-19 23:26:06.952636
441f871d-0bbc-4500-ac5d-8cf5abaf9dca	04fa7034-091e-4e3d-82a7-596527b0171b	17	{"diagrama": "validado"}	t	1500.00	2026-04-19 23:26:06.952636
8a55aad3-057f-41b3-bc2b-90841320c1ca	04fa7034-091e-4e3d-82a7-596527b0171b	18	{"diagrama": "validado"}	t	1500.00	2026-04-19 23:26:06.952636
5ecb62fb-1600-46cc-acfd-1137836b202a	04fa7034-091e-4e3d-82a7-596527b0171b	19	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;	t	1500.00	2026-04-19 23:26:06.952636
231077b2-d740-43a0-a93e-583b4091664f	04fa7034-091e-4e3d-82a7-596527b0171b	20	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE a.clase = 'Caballero';	t	1500.00	2026-04-19 23:26:06.952636
066f3d49-059a-4e83-a97e-888a4fee7107	04fa7034-091e-4e3d-82a7-596527b0171b	21	SELECT a.nombre, e.item FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;	t	1500.00	2026-04-19 23:26:06.952636
11835d97-9e4f-4c44-9ddd-fe9afb68bae2	04fa7034-091e-4e3d-82a7-596527b0171b	22	SELECT a.nombre, COUNT(e.item) FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre;	t	1500.00	2026-04-19 23:26:06.952636
112aa454-4cbc-4049-b2b2-ce9b193b99b7	04fa7034-091e-4e3d-82a7-596527b0171b	23	SELECT a.nombre, SUM(e.precio) FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre;	t	1500.00	2026-04-19 23:26:06.952636
2cfd0925-ffaf-494c-bcc6-c1be46f16c89	04fa7034-091e-4e3d-82a7-596527b0171b	24	SELECT a.nombre, e.item, e.precio FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE e.precio > 100;	t	1500.00	2026-04-19 23:26:06.952636
b1191a70-b913-4bbe-ab03-e025de1a0760	04fa7034-091e-4e3d-82a7-596527b0171b	16	{"nodes":[{"id":"28306aa4-45eb-41db-aad9-13e857d710d4","type":"tableNode","position":{"x":182.5895035164233,"y":134.78329879359336},"data":{"label":"Aventureros","columns":["nombre","clase"]},"measured":{"width":224,"height":165},"selected":false}],"edges":[]}	t	\N	2026-04-19 23:28:56.322386
bf201411-300a-4c87-85e4-8a34c2bf5bfe	04fa7034-091e-4e3d-82a7-596527b0171b	17	{"nodes":[{"id":"28306aa4-45eb-41db-aad9-13e857d710d4","type":"tableNode","position":{"x":22.654376697475243,"y":68.2616088777477},"data":{"label":"Aventureros","columns":["nombre","clase"]},"measured":{"width":224,"height":165},"selected":false,"dragging":false},{"id":"62cfc257-41b5-4ba6-b5e5-a429e20e5ee9","type":"tableNode","position":{"x":346.7359987558494,"y":101.32142768852182},"data":{"label":"Equipamiento","columns":["nombre"]},"measured":{"width":224,"height":141},"selected":true,"dragging":false}],"edges":[{"source":"28306aa4-45eb-41db-aad9-13e857d710d4","target":"62cfc257-41b5-4ba6-b5e5-a429e20e5ee9","animated":true,"style":{"stroke":"#22d3ee","strokeWidth":2},"id":"xy-edge__28306aa4-45eb-41db-aad9-13e857d710d4-62cfc257-41b5-4ba6-b5e5-a429e20e5ee9"}]}	t	\N	2026-04-19 23:29:26.373342
72a11389-21ba-44a2-a302-01662cf7d2b2	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros (nombre, clase, nivel) VALUES ('Gimil' , 'Guerrero' , 10) RETURNING*;\n	f	\N	2026-04-19 23:44:59.260125
bc33e84a-3f0d-4eaa-9ee2-b3ba0baec4b0	04fa7034-091e-4e3d-82a7-596527b0171b	10	INSERT INTO aventureros (nombre , clase , nivel) \nVALUES ('Gimli', 'Guerrero' , 10) RETURNING*;\n	f	\N	2026-04-19 23:51:41.308298
0876d02f-0137-41cc-b85d-bdbf9ed1c69b	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Gimli', 'Guerrero', 10)\nRETURNING *;	f	\N	2026-04-19 23:52:13.280685
80d94012-94b5-412b-b7c9-d1437ae1734d	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nInsert into aventureros (nombre ,clase, nivel) values ('Gimli' , 'Guerrero' , 10);	f	\N	2026-04-20 12:00:17.632227
00e4b366-8b8c-4554-b6b6-48dacb06d4c6	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nInsert into aventureros (nombre ,clase, nivel) values ('Gimli' , 'Guerrero' , '10');	f	\N	2026-04-20 12:00:25.501124
e2c11bab-4959-41d3-b596-a5e534e0b2b6	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nInsert into aventureros (nombre ,clase, nivel) values ('Gimli' , 'Guerrero' , 10);	f	\N	2026-04-20 12:00:34.04414
10575fd3-9a98-4fce-a2b6-efa16330879c	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros (nombre, clase, nivel) VALUES ('Gimli' , 'Guerrero' , 10);	f	\N	2026-04-20 12:02:29.312756
5543ee93-9b69-4016-ab24-b00097626536	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros (nombre, clase, nivel) VALUES ('Gimli' , 'Guerrero' , 10);	f	\N	2026-04-20 12:02:39.306067
08617f86-9585-4810-acdc-43f532f0ed8f	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Gimli', 'Guerrero', 10);	f	\N	2026-04-20 12:04:48.741246
fdddaea6-2b5e-46d3-9877-9031a47bf342	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Gimli', 'Guerrero', 10);	f	\N	2026-04-20 12:07:50.785346
ba84cea1-b536-45ad-84cc-44c29aa9addb	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Gimli', 'Guerrero', 10);	f	\N	2026-04-20 12:07:52.474086
f3d38858-4c57-403b-a5b3-056fbfc63554	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Gimli', 'Guerrero', 10);	f	\N	2026-04-20 12:09:12.057913
c82389b4-4aec-4ea0-84de-d8fd483c410b	04fa7034-091e-4e3d-82a7-596527b0171b	10	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Gimli', 'Guerrero', 10);	t	\N	2026-04-20 12:13:45.920522
3d993850-fd3f-4ac6-a2d1-921189305511	04fa7034-091e-4e3d-82a7-596527b0171b	11	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Freya', 'Paladin', 12);	f	\N	2026-04-20 12:14:23.157052
da701794-c86f-4cc6-9519-c1b1d3ed19ef	04fa7034-091e-4e3d-82a7-596527b0171b	11	-- Escribe tu consulta SQL aquí\nINSERT INTO aventureros\n  (nombre, clase, nivel)\nVALUES\n  ('Freya', 'Paladín', 12);	t	\N	2026-04-20 12:14:50.966165
8b340930-5ea3-4a61-b158-3b9682ddbe58	04fa7034-091e-4e3d-82a7-596527b0171b	16	{"nodes":[{"id":"e5e4bbe5-e1e6-4f0c-a495-ef2702171663","type":"tableNode","position":{"x":116.81788163726998,"y":177.6100946230706},"data":{"label":"aventureros","columns":["nombre","clase"]},"measured":{"width":224,"height":165},"selected":true,"dragging":false}],"edges":[]}	t	\N	2026-04-20 12:40:45.330382
37127377-56c0-4253-ad95-d4647b340570	04fa7034-091e-4e3d-82a7-596527b0171b	17	{"nodes":[{"id":"ad132cb7-9651-4fcf-a551-7c6da03e85bc","type":"tableNode","position":{"x":4.642275217280712,"y":131.3673037037329},"data":{"label":"aventureros","columns":[""]},"measured":{"width":224,"height":141},"selected":true,"dragging":false},{"id":"80e993ae-9c32-4027-bc58-2dbd738757f9","type":"tableNode","position":{"x":251.67199145490306,"y":129.83039193850487},"data":{"label":"equipamiento","columns":[""]},"measured":{"width":224,"height":141},"selected":false,"dragging":false}],"edges":[{"source":"ad132cb7-9651-4fcf-a551-7c6da03e85bc","target":"80e993ae-9c32-4027-bc58-2dbd738757f9","animated":true,"style":{"stroke":"#22d3ee","strokeWidth":2},"id":"xy-edge__ad132cb7-9651-4fcf-a551-7c6da03e85bc-80e993ae-9c32-4027-bc58-2dbd738757f9"}]}	t	\N	2026-04-20 12:41:19.447583
63849341-e6f0-4f83-9d89-e788d85fe669	04fa7034-091e-4e3d-82a7-596527b0171b	16	{"nodes":[{"id":"435b8126-07be-470d-a25f-8edefd8eed08","type":"tableNode","position":{"x":240.90772430126967,"y":136.96878917888307},"data":{"label":"aventureros","columns":["nombre","clase"]},"measured":{"width":224,"height":165},"selected":true}],"edges":[]}	t	\N	2026-04-20 12:57:59.021121
4667fce1-4f81-4d1c-9ebe-64abac4475f3	04fa7034-091e-4e3d-82a7-596527b0171b	16	{"nodes":[{"id":"435b8126-07be-470d-a25f-8edefd8eed08","type":"tableNode","position":{"x":240.90772430126967,"y":136.96878917888307},"data":{"label":"aventureros","columns":["nombre","clase"]},"measured":{"width":224,"height":165},"selected":true}],"edges":[]}	t	\N	2026-04-20 12:58:00.813279
207d4a80-8de8-4f62-a530-d6bcac7a6a80	04fa7034-091e-4e3d-82a7-596527b0171b	17	{"nodes":[{"id":"91437431-fd39-4952-b36c-f45d21c78604","type":"tableNode","position":{"x":-43.400190438650384,"y":112.72610806891613},"data":{"label":"aventureros","columns":["nombre","clase"]},"measured":{"width":224,"height":165},"selected":false,"dragging":false},{"id":"078f0dbd-9a0c-4722-a125-fbe4ffe31b87","type":"tableNode","position":{"x":368.46865743702926,"y":125.2575147074327},"data":{"label":"equipamiento","columns":[""]},"measured":{"width":224,"height":141},"selected":false,"dragging":false}],"edges":[{"source":"91437431-fd39-4952-b36c-f45d21c78604","target":"078f0dbd-9a0c-4722-a125-fbe4ffe31b87","id":"e-ddf5944f-cb02-4455-b141-6094687f52e3","type":"relationshipEdge","animated":true,"style":{"stroke":"#22d3ee","strokeWidth":2},"data":{"cardinality":"1:N"},"selected":false}]}	t	\N	2026-04-20 12:58:59.296707
0094d2af-bed4-43e1-9123-d75102e35531	04fa7034-091e-4e3d-82a7-596527b0171b	18	{"nodes":[{"id":"feec531e-3db5-4c90-8fba-aafd44d61c08","type":"tableNode","position":{"x":121.50227699441004,"y":214.93083902744254},"data":{"label":"clientes","columns":["nombre","oro_disponible"]},"measured":{"width":224,"height":165},"selected":true,"dragging":false},{"id":"a716592b-aca2-43fc-9d4c-6955b09e751f","type":"tableNode","position":{"x":528.3307489658162,"y":212.52572492882976},"data":{"label":"productos","columns":["nombre","precio"]},"measured":{"width":224,"height":165},"selected":false,"dragging":false}],"edges":[{"source":"feec531e-3db5-4c90-8fba-aafd44d61c08","target":"a716592b-aca2-43fc-9d4c-6955b09e751f","id":"e-12160ca9-4c13-4488-88b7-db57ae559015","type":"relationshipEdge","animated":true,"style":{"stroke":"#22d3ee","strokeWidth":2},"data":{"cardinality":"1:N"}}]}	t	\N	2026-04-20 13:01:34.95383
da86f40a-a2e9-4157-8f19-891920796a34	04fa7034-091e-4e3d-82a7-596527b0171b	16	{"nodes":[{"id":"789e8b37-49e5-4061-b9df-c6d79865f83b","type":"tableNode","position":{"x":-63.85806060704084,"y":54.72133788783046},"data":{"label":"aventurero ","columns":[{"name":"id","role":"pk"},{"name":"nombre","role":"normal"},{"name":"clase","role":"normal"}]},"measured":{"width":240,"height":182},"selected":true,"dragging":false}],"edges":[]}	t	\N	2026-04-20 21:18:02.904743
\.


--
-- Data for Name: modulos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) FROM stdin;
1	2	Módulo 1: Conociendo a la Bestia	1	Anatomía y Lectura: Estructura de tablas, SELECT, WHERE, LIKE, ORDER BY y COUNT.	0
2	2	Módulo 2: Manipulación de Datos	2	El CRUD: El poder (y peligro) de INSERT, UPDATE y DELETE.	80
3	2	Módulo 3: El Arquitecto y los Vínculos	3	Diseño y Relaciones: Teoría MER, DDL, Llaves Primarias/Foráneas y JOINs.	180
4	2	Módulo 4: La Prueba de Dagon	4	Reto Final: Diseña, Construye, Puebla y Consulta un negocio desde cero.	300
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.roles (id_rol, nombre) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.usuarios (id_usuario, nombre, email, password_hash, id_rol, activo, fecha_registro, racha_actual, ultima_practica, mejor_racha) FROM stdin;
2cbbf24f-d178-474d-80ae-c90ac3aad008	Aldo	aldo@dagon.com	miPasswordSuperSecreta	\N	t	2026-03-09 15:18:38.116732	0	\N	0
d504a92f-4c82-47ee-b9f7-a4be05df3e58	maximo	max@gmail.com	123	\N	t	2026-03-10 01:52:39.586369	0	\N	0
3429077a-8f83-46a3-9145-dc0633b919c3	aldito	aldofabiocontreras9898@gmail.com	1234	\N	t	2026-03-10 01:03:05.320254	1	2026-04-13	1
e1eeb361-e273-48f4-8558-97a61cbd1892	Dagon Tester	tester@dagon.com	admin123	\N	t	2026-04-11 23:36:14.649212	0	\N	0
04fa7034-091e-4e3d-82a7-596527b0171b	Maestro Dagon	maestro@dagon.com	admin123	\N	t	2026-04-19 23:26:06.952636	99	\N	99
\.


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: lms_sandbox; Owner: postgres
--

COPY lms_sandbox.aventureros (id_aventurero, nombre, clase, nivel) FROM stdin;
1	Loya	Caballero	15
2	Zoe	Maga Suprema	20
3	Jared	Arquero	8
4	Aldo	Guerrero	30
5	Dan	Asesino	25
6	Gimil	Guerrero	10
8	Gimil	Guerrero	10
9	Gimli	Guerrero	10
10	Gimil	Guerrero	10
12	Gimli	Guerrero	10
13	Gimli	Guerrero	10
14	Gimli	Guerrero	10
15	Gimli	Guerrero	10
16	Gimli	Guerrero	10
17	Gimli	Guerrero	10
18	Gimli	Guerrero	10
19	Gimli	Guerrero	10
20	Gimli	Guerrero	10
21	Gimli	Guerrero	10
22	Gimli	Guerrero	10
23	Gimli	Guerrero	10
24	Gimli	Guerrero	10
25	Gimli	Guerrero	10
26	Gimli	Guerrero	10
27	Gimli	Guerrero	10
28	Gimli	Guerrero	10
29	Gimli	Guerrero	10
30	Gimli	Guerrero	10
31	Gimli	Guerrero	10
32	Gimli	Guerrero	10
33	Gimli	Guerrero	10
34	Gimli	Guerrero	10
35	Gimli	Guerrero	10
36	Freya	Paladin	12
37	Freya	Paladín	12
38	Freya	Paladín	12
39	Freya	Paladín	12
\.


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: lms_sandbox; Owner: postgres
--

COPY lms_sandbox.equipamiento (id_equipo, id_aventurero, item, precio) FROM stdin;
1	1	Espada Larga	150
2	1	Escudo de Hierro	100
3	2	Báculo de Fuego	300
4	4	Hacha Doble	200
5	5	Daga Venenosa	120
\.


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: lms_sandbox; Owner: dilhanmora
--

COPY lms_sandbox.habitaciones (id, numero, tipo, precio_noche) FROM stdin;
1	101	Simple	50.00
2	102	Simple	55.00
3	201	Suite	150.00
4	301	Imperial	500.00
\.


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: lms_sandbox; Owner: dilhanmora
--

COPY lms_sandbox.huespedes (id, nombre, nivel_aventurero) FROM stdin;
1	Loya	15
2	Zoe	20
3	Jared	8
4	Aldo	30
\.


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: lms_sandbox; Owner: dilhanmora
--

COPY lms_sandbox.reservas (id, fecha_entrada, id_huesped, id_habitacion) FROM stdin;
1	2026-04-20	1	1
2	2026-04-21	2	3
3	2026-04-22	4	4
4	2026-04-23	1	2
\.


--
-- Name: auditoria_logs_id_log_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.auditoria_logs_id_log_seq', 10, true);


--
-- Name: cursos_id_curso_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.cursos_id_curso_seq', 2, true);


--
-- Name: ejercicios_practicos_id_ejercicio_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.ejercicios_practicos_id_ejercicio_seq', 42, true);


--
-- Name: modulos_id_modulo_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.modulos_id_modulo_seq', 4, true);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.roles_id_rol_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: lms_sandbox; Owner: postgres
--

SELECT pg_catalog.setval('lms_sandbox.aventureros_id_aventurero_seq', 39, true);


--
-- Name: equipamiento_id_equipo_seq; Type: SEQUENCE SET; Schema: lms_sandbox; Owner: postgres
--

SELECT pg_catalog.setval('lms_sandbox.equipamiento_id_equipo_seq', 5, true);


--
-- Name: habitaciones_id_seq; Type: SEQUENCE SET; Schema: lms_sandbox; Owner: dilhanmora
--

SELECT pg_catalog.setval('lms_sandbox.habitaciones_id_seq', 1, false);


--
-- Name: huespedes_id_seq; Type: SEQUENCE SET; Schema: lms_sandbox; Owner: dilhanmora
--

SELECT pg_catalog.setval('lms_sandbox.huespedes_id_seq', 1, false);


--
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: lms_sandbox; Owner: dilhanmora
--

SELECT pg_catalog.setval('lms_sandbox.reservas_id_seq', 4, true);


--
-- Name: auditoria_logs auditoria_logs_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.auditoria_logs
    ADD CONSTRAINT auditoria_logs_pkey PRIMARY KEY (id_log);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (id_curso);


--
-- Name: cursos cursos_titulo_key; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.cursos
    ADD CONSTRAINT cursos_titulo_key UNIQUE (titulo);


--
-- Name: ejercicios_practicos ejercicios_practicos_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.ejercicios_practicos
    ADD CONSTRAINT ejercicios_practicos_pkey PRIMARY KEY (id_ejercicio);


--
-- Name: intentos intentos_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.intentos
    ADD CONSTRAINT intentos_pkey PRIMARY KEY (id_intento);


--
-- Name: modulos modulos_id_curso_orden_key; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.modulos
    ADD CONSTRAINT modulos_id_curso_orden_key UNIQUE (id_curso, orden);


--
-- Name: modulos modulos_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.modulos
    ADD CONSTRAINT modulos_pkey PRIMARY KEY (id_modulo);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: lms_sandbox; Owner: postgres
--

ALTER TABLE ONLY lms_sandbox.aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: lms_sandbox; Owner: postgres
--

ALTER TABLE ONLY lms_sandbox.equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER TABLE ONLY lms_sandbox.habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER TABLE ONLY lms_sandbox.huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER TABLE ONLY lms_sandbox.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: usuarios regla_soft_delete_usuarios; Type: RULE; Schema: lms_core; Owner: postgres
--

CREATE RULE regla_soft_delete_usuarios AS
    ON DELETE TO lms_core.usuarios DO INSTEAD  UPDATE lms_core.usuarios SET activo = false
  WHERE (usuarios.id_usuario = old.id_usuario);


--
-- Name: ejercicios_practicos trg_auditar_update_ejercicio; Type: TRIGGER; Schema: lms_core; Owner: postgres
--

CREATE TRIGGER trg_auditar_update_ejercicio AFTER UPDATE ON lms_core.ejercicios_practicos FOR EACH ROW WHEN ((old.query_maestra IS DISTINCT FROM new.query_maestra)) EXECUTE FUNCTION lms_core.fn_auditar_ejercicios();


--
-- Name: ejercicios_practicos ejercicios_practicos_id_modulo_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.ejercicios_practicos
    ADD CONSTRAINT ejercicios_practicos_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES lms_core.modulos(id_modulo) ON DELETE CASCADE;


--
-- Name: intentos intentos_id_ejercicio_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.intentos
    ADD CONSTRAINT intentos_id_ejercicio_fkey FOREIGN KEY (id_ejercicio) REFERENCES lms_core.ejercicios_practicos(id_ejercicio) ON DELETE CASCADE;


--
-- Name: intentos intentos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.intentos
    ADD CONSTRAINT intentos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES lms_core.usuarios(id_usuario) ON DELETE CASCADE;


--
-- Name: modulos modulos_id_curso_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.modulos
    ADD CONSTRAINT modulos_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES lms_core.cursos(id_curso) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: postgres
--

ALTER TABLE ONLY lms_core.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES lms_core.roles(id_rol) ON DELETE RESTRICT;


--
-- Name: reservas reservas_id_habitacion_fkey; Type: FK CONSTRAINT; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER TABLE ONLY lms_sandbox.reservas
    ADD CONSTRAINT reservas_id_habitacion_fkey FOREIGN KEY (id_habitacion) REFERENCES lms_sandbox.habitaciones(id);


--
-- Name: reservas reservas_id_huesped_fkey; Type: FK CONSTRAINT; Schema: lms_sandbox; Owner: dilhanmora
--

ALTER TABLE ONLY lms_sandbox.reservas
    ADD CONSTRAINT reservas_id_huesped_fkey FOREIGN KEY (id_huesped) REFERENCES lms_sandbox.huespedes(id);


--
-- Name: SCHEMA lms_core; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA lms_core TO app_backend_user;


--
-- Name: SCHEMA lms_sandbox; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA lms_sandbox TO app_backend_user;
GRANT USAGE ON SCHEMA lms_sandbox TO app_sandbox_user;


--
-- Name: TABLE auditoria_logs; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.auditoria_logs TO app_backend_user;


--
-- Name: SEQUENCE auditoria_logs_id_log_seq; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.auditoria_logs_id_log_seq TO app_backend_user;


--
-- Name: TABLE cursos; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.cursos TO app_backend_user;


--
-- Name: SEQUENCE cursos_id_curso_seq; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.cursos_id_curso_seq TO app_backend_user;


--
-- Name: TABLE ejercicios_practicos; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.ejercicios_practicos TO app_backend_user;


--
-- Name: SEQUENCE ejercicios_practicos_id_ejercicio_seq; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.ejercicios_practicos_id_ejercicio_seq TO app_backend_user;


--
-- Name: TABLE intentos; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.intentos TO app_backend_user;


--
-- Name: TABLE modulos; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.modulos TO app_backend_user;


--
-- Name: SEQUENCE modulos_id_modulo_seq; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.modulos_id_modulo_seq TO app_backend_user;


--
-- Name: TABLE roles; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.roles TO app_backend_user;


--
-- Name: SEQUENCE roles_id_rol_seq; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.roles_id_rol_seq TO app_backend_user;


--
-- Name: TABLE usuarios; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.usuarios TO app_backend_user;


--
-- Name: TABLE v_ranking_alumnos; Type: ACL; Schema: lms_core; Owner: postgres
--

GRANT SELECT ON TABLE lms_core.v_ranking_alumnos TO app_backend_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: lms_sandbox; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_sandbox.aventureros TO app_sandbox_user;


--
-- Name: SEQUENCE aventureros_id_aventurero_seq; Type: ACL; Schema: lms_sandbox; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE lms_sandbox.aventureros_id_aventurero_seq TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: lms_sandbox; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_sandbox.equipamiento TO app_sandbox_user;


--
-- Name: SEQUENCE equipamiento_id_equipo_seq; Type: ACL; Schema: lms_sandbox; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE lms_sandbox.equipamiento_id_equipo_seq TO app_sandbox_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: lms_sandbox; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA lms_sandbox GRANT SELECT ON TABLES TO app_sandbox_user;


--
-- PostgreSQL database dump complete
--

\unrestrict CAgicoKIYHfryotwRZaAsacJOHB2eHAFPv0gsUgew46YGOGPghKqNyHLRbAVfgx

