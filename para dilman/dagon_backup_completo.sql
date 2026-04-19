--
-- PostgreSQL database dump
--

\restrict EpC16IttIZ3pNBkuQtgZahK8etpsI1mw1NqAuLIMGrNQ4LYWZ1qulajOmQcm4cY

-- Dumped from database version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)

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
-- Data for Name: auditoria_logs; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.auditoria_logs (id_log, tabla_afectada, operacion, usuario_db, fecha, datos_antiguos) FROM stdin;
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
1	1	¡Siente la dopamina! Extrae todos los datos de la tabla de aventureros usando el comodín asterisco (*).	SELECT * FROM aventureros;	1	\N	1.1 y 1.2: Tu Primer Vistazo	1	HISTORIA	drag_drop
2	1	Usa la cláusula WHERE para un filtro exacto. Selecciona el "nombre" de los aventureros que tengan nivel exactamente igual a 5.	SELECT nombre FROM aventureros WHERE nivel = 5;	2	\N	1.3: El Francotirador	2	HISTORIA	drag_drop
3	1	Usa LIKE y comodines (%). Encuentra a todos los aventureros cuyo nombre empiece con la letra "A".	SELECT * FROM aventureros WHERE nombre LIKE 'A%';	3	\N	1.4: El Detective	3	HISTORIA	drag_drop
4	1	Frena la avalancha de datos. Trae a los 3 aventureros con mayor nivel ordenándolos de forma descendente.	SELECT * FROM aventureros ORDER BY nivel DESC LIMIT 3;	3	\N	1.5: Orden y Límite	4	HISTORIA	drag_drop
5	1	¿Cuántos enemigos o aliados existen? Usa COUNT(*) para contar el total de aventureros.	SELECT COUNT(*) FROM aventureros;	2	\N	1.6: Métrica Rápida	5	HISTORIA	drag_drop
9	2	Agrega un nuevo registro. Inserta al aventurero 'Gimli', clase 'Guerrero', nivel 10 en la tabla aventureros. Agrega "RETURNING *" al final para ver a tu creación.	INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Gimli', 'Guerrero', 10) RETURNING *;	2	\N	2.1: El Nacimiento (Insertar)	1	HISTORIA	editor
10	2	Loya ha entrenado duro. Usa UPDATE para cambiar su nivel a 20 en la tabla aventureros. Usa "RETURNING *" al final para verificar el cambio.	UPDATE aventureros SET nivel = 20 WHERE nombre = 'Loya' RETURNING *;	3	\N	2.2: El Ascenso (Modificar)	2	HISTORIA	editor
11	2	El asesino Dan nos ha traicionado. Usa DELETE para borrarlo de la tabla aventureros. Recuerda usar WHERE y "RETURNING *" al final.	DELETE FROM aventureros WHERE nombre = 'Dan' RETURNING *;	3	\N	2.3: El Sacrificio (Eliminar)	3	HISTORIA	editor
12	3	Haz un INNER JOIN entre aventureros (a) y equipamiento (e). Une ambas usando "id_aventurero" y muestra el "nombre" del héroe y el "item" que porta.	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;	3	\N	3.1: Cruzando el Puente (INNER JOIN)	1	HISTORIA	editor
13	3	Haz el mismo JOIN de la misión anterior, pero agrega un filtro (WHERE) para mostrar únicamente los items de la clase 'Caballero'.	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE a.clase = 'Caballero';	4	\N	3.2: Arsenal Específico	2	HISTORIA	editor
14	3	Usa un LEFT JOIN desde aventureros hacia equipamiento para mostrar los nombres de TODOS los héroes, incluso si no tienen armas compradas.	SELECT a.nombre, e.item FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;	4	\N	3.3: Nadie se Queda Atrás (LEFT JOIN)	3	HISTORIA	editor
15	3	Une ambas tablas. Muestra el "nombre", usa SUM(precio) para calcular el valor total de sus armas, y usa GROUP BY para agrupar por nombre.	SELECT a.nombre, SUM(e.precio) FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre;	5	\N	3.4: El Valor de un Héroe	4	HISTORIA	editor
16	4	Demuestra tu comprensión abstracta. Diseña el diagrama Entidad-Relación. Crea al menos dos Entidades y conéctalas con una Llave Foránea.	{"diagrama": "validado"}	5	\N	Fase 1: El Lienzo del Arquitecto	1	HISTORIA	diagram
17	4	Último reto de código. Une aventureros y equipamiento, filtra aquellos que tengan un item con precio MAYOR a 100. Muestra el nombre y el item.	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE e.precio > 100;	5	\N	Fase 2: Extracción Maestra	2	HISTORIA	editor
\.


--
-- Data for Name: intentos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.intentos (id_intento, id_usuario, id_ejercicio, query_enviada, es_correcto, tiempo_ms, fecha_intento) FROM stdin;
6cb23369-6147-4c1e-9c98-8cd0c8e584cf	2cbbf24f-d178-474d-80ae-c90ac3aad008	1	SELECT * FROM aventureros ;	t	\N	2026-04-18 23:06:23.258604
4e019c29-676a-49d7-97ff-a76bedd17b5c	2cbbf24f-d178-474d-80ae-c90ac3aad008	2	SELECT nombre FROM aventureros WHERE nivel = 5 ;	t	\N	2026-04-18 23:08:27.922998
d3a98ecd-dd24-4e9d-8558-6fdd342f2167	e1eeb361-e273-48f4-8558-97a61cbd1892	1	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
933453cf-e7e2-4ca5-bd0c-9070ed634dbc	e1eeb361-e273-48f4-8558-97a61cbd1892	2	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
d97ae441-e822-4d7a-a6a4-bdb5af28b1cb	e1eeb361-e273-48f4-8558-97a61cbd1892	3	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
25fb3698-c119-4e4b-8dd4-d3d3db677f31	e1eeb361-e273-48f4-8558-97a61cbd1892	4	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
a4447374-441f-4fe9-bbf9-f76838d6c962	e1eeb361-e273-48f4-8558-97a61cbd1892	5	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
9f99abda-e04f-46db-8483-1ad52df3f948	e1eeb361-e273-48f4-8558-97a61cbd1892	9	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
b639fc29-afc0-4332-b914-111fe1a37f5b	e1eeb361-e273-48f4-8558-97a61cbd1892	10	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
38ac780d-0aae-4cc9-8f59-5288360f991e	e1eeb361-e273-48f4-8558-97a61cbd1892	11	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
19cdd27c-fd91-4aba-86b6-13169e9d8a28	e1eeb361-e273-48f4-8558-97a61cbd1892	12	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
e4439ee9-c803-44d2-9949-774ffda06600	e1eeb361-e273-48f4-8558-97a61cbd1892	13	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
d67d55c1-5dd7-4015-a608-c11a97470d81	e1eeb361-e273-48f4-8558-97a61cbd1892	14	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
08316216-a376-4939-acfb-7a12b7898533	e1eeb361-e273-48f4-8558-97a61cbd1892	15	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
f17a61fc-4525-481d-8aad-b664ec2fce30	e1eeb361-e273-48f4-8558-97a61cbd1892	16	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
e89d0a6e-6da3-4dff-8e48-a856d4d6b32f	e1eeb361-e273-48f4-8558-97a61cbd1892	17	-- Consulta de prueba completada por el sistema	t	\N	2026-04-18 23:36:14.645668
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
-- Name: auditoria_logs_id_log_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.auditoria_logs_id_log_seq', 1, false);


--
-- Name: cursos_id_curso_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.cursos_id_curso_seq', 2, true);


--
-- Name: ejercicios_practicos_id_ejercicio_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.ejercicios_practicos_id_ejercicio_seq', 17, true);


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

SELECT pg_catalog.setval('lms_sandbox.aventureros_id_aventurero_seq', 5, true);


--
-- Name: equipamiento_id_equipo_seq; Type: SEQUENCE SET; Schema: lms_sandbox; Owner: postgres
--

SELECT pg_catalog.setval('lms_sandbox.equipamiento_id_equipo_seq', 5, true);


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

\unrestrict EpC16IttIZ3pNBkuQtgZahK8etpsI1mw1NqAuLIMGrNQ4LYWZ1qulajOmQcm4cY

