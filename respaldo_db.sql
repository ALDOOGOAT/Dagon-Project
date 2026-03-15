--
-- PostgreSQL database dump
--

\restrict ZsALPPcbPl8YWamFHh4o5i59vTYZZFwZsAUxwjSGXbneWIX5out57ArFZLIhLNp

-- Dumped from database version 18.2 (Ubuntu 18.2-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.2 (Ubuntu 18.2-1.pgdg24.04+1)

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

CREATE DOMAIN lms_core.email_valido AS character varying(150)
	CONSTRAINT email_valido_check CHECK (((VALUE)::text ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'::text));


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
    tabla_afectada character varying(50),
    operacion character varying(10),
    usuario_db character varying(50),
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
    titulo character varying(150) NOT NULL
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
    titulo character varying(150) DEFAULT 'Misión Desconocida'::character varying,
    orden integer DEFAULT 1,
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
    titulo character varying(150) NOT NULL,
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
    nombre character varying(50) NOT NULL
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
    nombre character varying(100) NOT NULL,
    email lms_core.email_valido NOT NULL,
    password_hash character varying(255) NOT NULL,
    id_rol integer,
    activo boolean DEFAULT true,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    COALESCE(sum((e.dificultad * 10)), (0)::bigint) AS xp_total
   FROM ((lms_core.usuarios u
     LEFT JOIN ( SELECT DISTINCT intentos.id_usuario,
            intentos.id_ejercicio
           FROM lms_core.intentos
          WHERE (intentos.es_correcto = true)) i ON ((u.id_usuario = i.id_usuario)))
     LEFT JOIN lms_core.ejercicios_practicos e ON ((i.id_ejercicio = e.id_ejercicio)))
  WHERE (u.activo = true)
  GROUP BY u.id_usuario, u.nombre, u.email
  ORDER BY COALESCE(sum((e.dificultad * 10)), (0)::bigint) DESC, (count(DISTINCT i.id_ejercicio)) DESC, u.nombre;


ALTER VIEW lms_core.v_ranking_alumnos OWNER TO postgres;

--
-- Name: aventureros; Type: TABLE; Schema: lms_sandbox; Owner: postgres
--

CREATE TABLE lms_sandbox.aventureros (
    id_aventurero integer NOT NULL,
    nombre character varying(50),
    clase character varying(50),
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
-- Data for Name: auditoria_logs; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.auditoria_logs (id_log, tabla_afectada, operacion, usuario_db, fecha, datos_antiguos) FROM stdin;
\.


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.cursos (id_curso, titulo) FROM stdin;
1	Fundamentos de SQL
2	Dagon: Fundamentos de SQL
\.


--
-- Data for Name: ejercicios_practicos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.ejercicios_practicos (id_ejercicio, id_modulo, enunciado, query_maestra, dificultad, configuracion_extra, titulo, orden) FROM stdin;
1	1	Los registros antiguos indican que hay aventureros durmiendo en la base de datos. Trae TODAS las columnas de la tabla aventureros usando el asterisco (*).	SELECT * FROM aventureros;	1	\N	Misión 1: El Despertar	1
2	1	No necesitamos todos los datos ahora. Escribe una consulta que seleccione únicamente la columna "nombre" y "clase" de la tabla aventureros.	SELECT nombre, clase FROM aventureros;	2	\N	Misión 2: Identificando a los Héroes	2
3	1	Usa la cláusula WHERE para filtrar. Selecciona el "nombre" de los aventureros que tengan un "nivel" mayor a 15.	SELECT nombre FROM aventureros WHERE nivel > 15;	3	\N	Misión 3: Reclutamiento de Élite	3
4	1	Encuentra a los magos. Selecciona todas las columnas (*) de los aventureros donde la "clase" sea exactamente 'Maga Suprema'.	SELECT * FROM aventureros WHERE clase = 'Maga Suprema';	3	\N	Misión 4: Búsqueda Específica	4
5	2	El Gremio necesita un inventario rápido. Usa la función COUNT(*) para saber cuántos aventureros en total están registrados.	SELECT COUNT(*) FROM aventureros;	2	\N	Misión 1: Contando Tropas	1
6	2	El tesorero quiere saber cuánto oro hay invertido. Usa SUM(precio) para calcular el valor total en la tabla equipamiento.	SELECT SUM(precio) FROM equipamiento;	2	\N	Misión 2: El Tesoro del Gremio	2
7	2	Necesitamos enviar al mejor guerrero a una misión peligrosa. Usa MAX(nivel) para descubrir el nivel más alto entre los aventureros.	SELECT MAX(nivel) FROM aventureros;	3	\N	Misión 3: El Guerrero Más Fuerte	3
8	2	¡Hora de agrupar! El rey quiere saber cuántos aventureros hay de cada clase. Muestra la columna "clase" y usa COUNT(*) combinándolo con GROUP BY.	SELECT clase, COUNT(*) FROM aventureros GROUP BY clase;	4	\N	Misión 4: Censando por Clases	4
9	3	Haz un INNER JOIN entre la tabla aventureros y equipamiento. Une ambas usando "id_aventurero" y muestra el "nombre" y el "item".	SELECT aventureros.nombre, equipamiento.item FROM aventureros INNER JOIN equipamiento ON aventureros.id_aventurero = equipamiento.id_aventurero;	3	\N	Misión 1: Uniendo Fuerzas	1
10	3	Haz el mismo INNER JOIN de la misión anterior, pero agrega un WHERE para mostrar únicamente los items de la clase 'Caballero'.	SELECT aventureros.nombre, equipamiento.item FROM aventureros INNER JOIN equipamiento ON aventureros.id_aventurero = equipamiento.id_aventurero WHERE aventureros.clase = 'Caballero';	4	\N	Misión 2: Arsenal Específico	2
11	3	Usa un LEFT JOIN desde aventureros hacia equipamiento para mostrar los nombres de TODOS los aventureros, incluso si no tienen item.	SELECT aventureros.nombre, equipamiento.item FROM aventureros LEFT JOIN equipamiento ON aventureros.id_aventurero = equipamiento.id_aventurero;	4	\N	Misión 3: Nadie se Queda Atrás	3
12	3	Une aventureros y equipamiento, muestra el "nombre", usa SUM(precio) para sumar el valor de sus armas, y agrupa por nombre.	SELECT aventureros.nombre, SUM(equipamiento.precio) FROM aventureros INNER JOIN equipamiento ON aventureros.id_aventurero = equipamiento.id_aventurero GROUP BY aventureros.nombre;	5	\N	Misión 4: El Valor de un Héroe	4
\.


--
-- Data for Name: intentos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.intentos (id_intento, id_usuario, id_ejercicio, query_enviada, es_correcto, tiempo_ms, fecha_intento) FROM stdin;
a2edfc4c-e28d-4923-802b-739b57f23669	2cbbf24f-d178-474d-80ae-c90ac3aad008	1	SELECT * FROM aventureros ;	t	\N	2026-03-15 02:10:13.779102
f6deb6f9-01d8-4ae1-95f7-59733eb958e7	2cbbf24f-d178-474d-80ae-c90ac3aad008	2	SELECT nombre, clase FROM aventureros ;	t	\N	2026-03-15 02:11:03.428605
fe0674fa-0066-4b55-a583-d57135562601	2cbbf24f-d178-474d-80ae-c90ac3aad008	3	SELECT nombre FROM aventureros WHERE nivel > 15 ;	t	\N	2026-03-15 02:13:03.175208
50271ce5-5338-4b73-a432-d2b8c1b6a7c9	2cbbf24f-d178-474d-80ae-c90ac3aad008	4	SELECT * FROM aventureros WHERE clase = 'Maga Suprema' ;	t	\N	2026-03-15 02:16:12.785433
0661bcec-3698-4b58-929e-de7967f78918	d504a92f-4c82-47ee-b9f7-a4be05df3e58	1	SELECT * FROM aventureros ;	t	\N	2026-03-15 02:36:49.511597
\.


--
-- Data for Name: modulos; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.modulos (id_modulo, id_curso, titulo, orden, descripcion, xp_requerida) FROM stdin;
1	1	Módulo 1: Selección Básica	1	Aprende a consultar datos con SELECT y filtros WHERE.	0
2	1	Módulo 2: Funciones Agregadas	2	Domina COUNT, SUM, AVG y agrupaciones con GROUP BY.	60
3	1	Módulo 3: El Arte de los JOINs	3	Combina múltiples tablas como un experto relacional.	150
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.roles (id_rol, nombre) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: lms_core; Owner: postgres
--

COPY lms_core.usuarios (id_usuario, nombre, email, password_hash, id_rol, activo, fecha_registro) FROM stdin;
2cbbf24f-d178-474d-80ae-c90ac3aad008	Aldo	aldo@dagon.com	miPasswordSuperSecreta	\N	t	2026-03-09 15:18:38.116732
3429077a-8f83-46a3-9145-dc0633b919c3	aldito	aldofabiocontreras9898@gmail.com	1234	\N	t	2026-03-10 01:03:05.320254
d504a92f-4c82-47ee-b9f7-a4be05df3e58	maximo	max@gmail.com	123	\N	t	2026-03-10 01:52:39.586369
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

SELECT pg_catalog.setval('lms_core.ejercicios_practicos_id_ejercicio_seq', 12, true);


--
-- Name: modulos_id_modulo_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.modulos_id_modulo_seq', 3, true);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: postgres
--

SELECT pg_catalog.setval('lms_core.roles_id_rol_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: lms_sandbox; Owner: postgres
--

SELECT pg_catalog.setval('lms_sandbox.aventureros_id_aventurero_seq', 5, true);


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

GRANT SELECT ON TABLE lms_sandbox.aventureros TO app_sandbox_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: lms_sandbox; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA lms_sandbox GRANT SELECT ON TABLES TO app_sandbox_user;


--
-- PostgreSQL database dump complete
--

\unrestrict ZsALPPcbPl8YWamFHh4o5i59vTYZZFwZsAUxwjSGXbneWIX5out57ArFZLIhLNp

