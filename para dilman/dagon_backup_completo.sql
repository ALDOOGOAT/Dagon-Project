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
1	1	¡Siente la dopamina! Extrae TODOS los datos de la tabla aventureros usando el comodín asterisco (*). Recuerda: SELECT * FROM nombre_tabla;	SELECT * FROM aventureros;	1	\N	1.1: Tu Primer Vistazo	1	HISTORIA	drag_drop
2	1	No siempre necesitas verlo todo. Selecciona únicamente las columnas "nombre" y "clase" de la tabla aventureros.	SELECT nombre, clase FROM aventureros;	1	\N	1.2: Eligiendo Columnas	2	HISTORIA	drag_drop
3	1	Hay otra tabla oculta en el gremio: equipamiento. Contiene las armas de los héroes. Usa SELECT * para revelar todo su contenido.	SELECT * FROM equipamiento;	1	\N	1.3: El Arsenal Oculto	3	HISTORIA	drag_drop
4	1	Hora de filtrar. Usa WHERE con igualdad exacta para encontrar al aventurero de la clase 'Guerrero'. Muestra todos sus datos. Recuerda: el texto va entre comillas simples.	SELECT * FROM aventureros WHERE clase = 'Guerrero';	2	\N	1.4: Buscando al Guerrero	4	HISTORIA	drag_drop
5	1	Busca a los más poderosos. Usa WHERE con el operador mayor que (>) para mostrar el nombre de los aventureros con nivel mayor a 20.	SELECT nombre FROM aventureros WHERE nivel > 20;	2	\N	1.5: Los Más Fuertes	5	HISTORIA	drag_drop
6	1	Usa LIKE y el comodín porcentaje (%). Encuentra a todos los aventureros cuyo nombre empiece con la letra 'A'. El patrón es 'A%'.	SELECT * FROM aventureros WHERE nombre LIKE 'A%';	2	\N	1.6: El Detective	6	HISTORIA	drag_drop
7	1	Los datos desordenados son inútiles. Usa ORDER BY para mostrar todos los aventureros ordenados por nivel de mayor a menor (DESC).	SELECT * FROM aventureros ORDER BY nivel DESC;	2	\N	1.7: Ordenando el Caos	7	HISTORIA	drag_drop
8	1	Frena la avalancha. Combina ORDER BY nivel DESC con LIMIT 3 para traer únicamente a los 3 aventureros más poderosos.	SELECT * FROM aventureros ORDER BY nivel DESC LIMIT 3;	3	\N	1.8: Los Tres Más Fuertes	8	HISTORIA	drag_drop
9	1	¿Cuántos héroes hay en total? Usa la función COUNT(*) para contar todas las filas de la tabla aventureros.	SELECT COUNT(*) FROM aventureros;	2	\N	1.9: Métrica Rápida	9	HISTORIA	drag_drop
10	2	Recluta a un nuevo héroe. Inserta al aventurero 'Gimli', clase 'Guerrero', nivel 10 en la tabla aventureros. Agrega RETURNING * al final para ver tu creación.	INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Gimli', 'Guerrero', 10) RETURNING *;	2	\N	2.1: El Nacimiento	1	HISTORIA	editor
11	2	Otro recluta se une al gremio. Inserta a la aventurera 'Freya', clase 'Paladín', nivel 12. No olvides RETURNING * para confirmar.	INSERT INTO aventureros (nombre, clase, nivel) VALUES ('Freya', 'Paladín', 12) RETURNING *;	2	\N	2.2: Doble Reclutamiento	2	HISTORIA	editor
12	2	Los héroes necesitan armas. Inserta en la tabla equipamiento un registro: id_aventurero = 1, item = 'Casco de Plata', precio = 80. Usa RETURNING *.	INSERT INTO equipamiento (id_aventurero, item, precio) VALUES (1, 'Casco de Plata', 80) RETURNING *;	2	\N	2.3: Equipando al Héroe	3	HISTORIA	editor
13	2	Loya ha entrenado duro. Usa UPDATE para cambiar su nivel a 20 en la tabla aventureros. IMPORTANTE: usa WHERE para apuntar solo a Loya. Termina con RETURNING *.	UPDATE aventureros SET nivel = 20 WHERE nombre = 'Loya' RETURNING *;	3	\N	2.4: El Ascenso	4	HISTORIA	editor
14	2	La Espada Larga ha sido mejorada. Usa UPDATE para cambiar su precio a 250 en la tabla equipamiento. Filtra con WHERE item = 'Espada Larga'. Usa RETURNING *.	UPDATE equipamiento SET precio = 250 WHERE item = 'Espada Larga' RETURNING *;	3	\N	2.5: Mejora de Equipo	5	HISTORIA	editor
15	2	El asesino Dan nos ha traicionado. Usa DELETE para borrarlo de la tabla aventureros. SIEMPRE usa WHERE para no borrar todo. Termina con RETURNING *.	DELETE FROM aventureros WHERE nombre = 'Dan' RETURNING *;	3	\N	2.6: El Sacrificio	6	HISTORIA	editor
16	3	Tu primera misión de arquitecto: crea UNA entidad llamada 'aventureros'. Dale al menos 2 atributos (columnas) como nombre y clase. Haz clic en '+ Entidad', ponle nombre y agrega atributos.	{"diagrama": "validado"}	2	{"min_entidades": 1, "min_relaciones": 0, "min_atributos": 2, "entidades_requeridas": [["aventurero", "aventureros", "heroes"]], "mensaje_error": "Necesitas crear la entidad 'aventureros'.", "mensaje_relaciones": ""}	3.1: Tu Primera Entidad	1	HISTORIA	diagram
17	3	Ahora crea DOS entidades: 'aventureros' y 'equipamiento'. Conéctalas arrastrando desde el punto cyan de una hasta el punto fucsia de la otra. Esto representa la relación entre ellas.	{"diagrama": "validado"}	3	{"min_entidades": 2, "min_relaciones": 1, "min_atributos": 2, "entidades_requeridas": [["aventurero", "aventureros"], ["equipamiento", "equipo", "armas", "items"]], "mensaje_error": "Necesitas las entidades 'aventureros' y 'equipamiento'.", "mensaje_relaciones": "Conecta las entidades arrastrando desde el punto cyan al fucsia."}	3.2: Conectando el Puente	2	HISTORIA	diagram
18	3	Diseña un mini-sistema de una Tienda: crea las entidades 'clientes' y 'productos', cada una con al menos 2 atributos. Conéctalas con una relación (un cliente compra productos).	{"diagrama": "validado"}	3	{"min_entidades": 2, "min_relaciones": 1, "min_atributos": 4, "entidades_requeridas": [["cliente", "clientes", "usuario", "usuarios", "comprador"], ["producto", "productos", "item", "items", "pocion", "pociones"]], "mensaje_error": "Necesitas entidades para los clientes y los productos.", "mensaje_relaciones": "Conecta clientes con productos para representar la relación de compra."}	3.3: La Tienda del Gremio	3	HISTORIA	diagram
19	3	Hora de usar SQL. Haz un INNER JOIN entre aventureros (alias a) y equipamiento (alias e). Únelos por id_aventurero y muestra el nombre del héroe y el item que porta.	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;	3	\N	3.4: Cruzando el Puente con SQL	4	HISTORIA	editor
20	3	Combina JOIN con WHERE. Repite el JOIN anterior pero filtra solo los items de la clase 'Caballero'. Muestra nombre e item.	SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE a.clase = 'Caballero';	4	\N	3.5: Arsenal del Caballero	5	HISTORIA	editor
21	3	Usa LEFT JOIN desde aventureros hacia equipamiento para ver a TODOS los héroes, incluso los que no tienen equipo (aparecerán con NULL). Muestra nombre e item.	SELECT a.nombre, e.item FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;	4	\N	3.6: Nadie se Queda Atrás	6	HISTORIA	editor
22	3	Cuenta cuántas armas tiene cada héroe. Usa LEFT JOIN + GROUP BY a.nombre con COUNT(e.item). Muestra nombre y la cuenta.	SELECT a.nombre, COUNT(e.item) FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre;	4	\N	3.7: Conteo de Arsenal	7	HISTORIA	editor
23	3	Calcula el gasto total de cada héroe en equipo. Usa INNER JOIN + GROUP BY a.nombre con SUM(e.precio). Muestra nombre y suma.	SELECT a.nombre, SUM(e.precio) FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre;	5	\N	3.8: El Valor de un Héroe	8	HISTORIA	editor
24	3	Une aventureros y equipamiento con INNER JOIN. Muestra nombre, item y precio. Filtra con WHERE para ver solo items con precio mayor a 100.	SELECT a.nombre, e.item, e.precio FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE e.precio > 100;	5	\N	3.9: Extracción Selectiva	9	HISTORIA	editor
25	4	Diseña el sistema completo de una Posada de Aventureros. Crea 3 entidades: 'huespedes', 'habitaciones' y 'reservas'. Cada una con al menos 2 atributos. Conecta huéspedes con reservas, y habitaciones con reservas.	{"diagrama": "validado"}	5	{"min_entidades": 3, "min_relaciones": 2, "min_atributos": 6, "entidades_requeridas": [["huesped", "huespedes", "cliente", "clientes"], ["habitacion", "habitaciones", "cuarto", "cuartos", "room"], ["reserva", "reservas", "reservacion", "booking"]], "mensaje_error": "La posada necesita entidades para los huéspedes, las habitaciones y las reservas.", "mensaje_relaciones": "Conecta huéspedes con reservas, y habitaciones con reservas (relación muchos a muchos)."}	Fase 1: La Posada del Arquitecto	1	HISTORIA	diagram
26	4	Demuestra tu dominio de JOINs. Une aventureros y equipamiento, filtra los items con precio mayor a 100. Muestra nombre, item y precio ordenados por precio de mayor a menor.	SELECT a.nombre, e.item, e.precio FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE e.precio > 100 ORDER BY e.precio DESC;	5	\N	Fase 2: Consulta Maestra	2	HISTORIA	editor
27	4	Reto final: muestra un ranking de héroes por su gasto total en equipo. Usa INNER JOIN, SUM(e.precio), GROUP BY, y ordena de mayor a menor gasto. Muestra nombre y total.	SELECT a.nombre, SUM(e.precio) AS total FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre ORDER BY total DESC;	5	\N	Fase 3: El Ranking Definitivo	3	HISTORIA	editor
\.


--
-- Data for Name: intentos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.intentos (id_intento, id_usuario, id_ejercicio, query_enviada, es_correcto, tiempo_ms, fecha_intento) FROM stdin;
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

SELECT pg_catalog.setval('lms_core.ejercicios_practicos_id_ejercicio_seq', 27, true);


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

