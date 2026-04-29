--
-- PostgreSQL database dump
--

\restrict tdrRbRgUDxBrhEotBMpBU7IfNjFm7Pb33AhhRRJx5zC7IqAWjv6cj0OuJyP8DPb

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
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

ALTER TABLE IF EXISTS ONLY lms_sandbox_template.reservas DROP CONSTRAINT IF EXISTS reservas_id_huesped_fkey;
ALTER TABLE IF EXISTS ONLY lms_sandbox_template.reservas DROP CONSTRAINT IF EXISTS reservas_id_habitacion_fkey;
ALTER TABLE IF EXISTS ONLY lms_core.usuarios DROP CONSTRAINT IF EXISTS usuarios_id_rol_fkey;
ALTER TABLE IF EXISTS ONLY lms_core.modulos DROP CONSTRAINT IF EXISTS modulos_id_curso_fkey;
ALTER TABLE IF EXISTS ONLY lms_core.intentos DROP CONSTRAINT IF EXISTS intentos_id_usuario_fkey;
ALTER TABLE IF EXISTS ONLY lms_core.intentos DROP CONSTRAINT IF EXISTS intentos_id_ejercicio_fkey;
ALTER TABLE IF EXISTS ONLY lms_core.ejercicios_practicos DROP CONSTRAINT IF EXISTS ejercicios_practicos_id_modulo_fkey;
DROP TRIGGER IF EXISTS trg_desatar_multiverso ON lms_core.usuarios;
DROP TRIGGER IF EXISTS trg_auditar_update_ejercicio ON lms_core.ejercicios_practicos;
DROP RULE IF EXISTS regla_soft_delete_usuarios ON lms_core.usuarios;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas DROP CONSTRAINT IF EXISTS mascotas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas DROP CONSTRAINT IF EXISTS mascotas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas DROP CONSTRAINT IF EXISTS mascotas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY lms_sandbox_template.reservas DROP CONSTRAINT IF EXISTS reservas_pkey;
ALTER TABLE IF EXISTS ONLY lms_sandbox_template.huespedes DROP CONSTRAINT IF EXISTS huespedes_pkey;
ALTER TABLE IF EXISTS ONLY lms_sandbox_template.habitaciones DROP CONSTRAINT IF EXISTS habitaciones_pkey;
ALTER TABLE IF EXISTS ONLY lms_sandbox_template.equipamiento DROP CONSTRAINT IF EXISTS equipamiento_pkey;
ALTER TABLE IF EXISTS ONLY lms_sandbox_template.aventureros DROP CONSTRAINT IF EXISTS aventureros_pkey;
ALTER TABLE IF EXISTS ONLY lms_core.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY lms_core.usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
ALTER TABLE IF EXISTS ONLY lms_core.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY lms_core.roles DROP CONSTRAINT IF EXISTS roles_nombre_key;
ALTER TABLE IF EXISTS ONLY lms_core.modulos DROP CONSTRAINT IF EXISTS modulos_pkey;
ALTER TABLE IF EXISTS ONLY lms_core.modulos DROP CONSTRAINT IF EXISTS modulos_id_curso_orden_key;
ALTER TABLE IF EXISTS ONLY lms_core.intentos DROP CONSTRAINT IF EXISTS intentos_pkey;
ALTER TABLE IF EXISTS ONLY lms_core.ejercicios_practicos DROP CONSTRAINT IF EXISTS ejercicios_practicos_pkey;
ALTER TABLE IF EXISTS ONLY lms_core.cursos DROP CONSTRAINT IF EXISTS cursos_titulo_key;
ALTER TABLE IF EXISTS ONLY lms_core.cursos DROP CONSTRAINT IF EXISTS cursos_pkey;
ALTER TABLE IF EXISTS ONLY lms_core.auditoria_logs DROP CONSTRAINT IF EXISTS auditoria_logs_pkey;
ALTER TABLE IF EXISTS "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS lms_sandbox_template.reservas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS lms_sandbox_template.huespedes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS lms_sandbox_template.habitaciones ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS lms_sandbox_template.equipamiento ALTER COLUMN id_equipo DROP DEFAULT;
ALTER TABLE IF EXISTS lms_sandbox_template.aventureros ALTER COLUMN id_aventurero DROP DEFAULT;
ALTER TABLE IF EXISTS lms_core.roles ALTER COLUMN id_rol DROP DEFAULT;
ALTER TABLE IF EXISTS lms_core.modulos ALTER COLUMN id_modulo DROP DEFAULT;
ALTER TABLE IF EXISTS lms_core.ejercicios_practicos ALTER COLUMN id_ejercicio DROP DEFAULT;
ALTER TABLE IF EXISTS lms_core.cursos ALTER COLUMN id_curso DROP DEFAULT;
ALTER TABLE IF EXISTS lms_core.auditoria_logs ALTER COLUMN id_log DROP DEFAULT;
DROP TABLE IF EXISTS "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas;
DROP TABLE IF EXISTS "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".reservas;
DROP SEQUENCE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas_id_seq;
DROP TABLE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas;
DROP TABLE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".dias_semana_id_dia_seq;
DROP SEQUENCE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas;
DROP SEQUENCE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas_id_seq;
DROP TABLE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas;
DROP TABLE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas;
DROP TABLE IF EXISTS "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas;
DROP TABLE IF EXISTS "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas;
DROP TABLE IF EXISTS "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas;
DROP SEQUENCE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas_id_seq;
DROP TABLE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas;
DROP TABLE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas;
DROP TABLE IF EXISTS "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas;
DROP TABLE IF EXISTS "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".reservas;
DROP TABLE IF EXISTS "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros;
DROP TABLE IF EXISTS "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas;
DROP TABLE IF EXISTS "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes;
DROP TABLE IF EXISTS "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones;
DROP TABLE IF EXISTS "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento;
DROP SEQUENCE IF EXISTS "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros;
DROP SEQUENCE IF EXISTS lms_sandbox_template.reservas_id_seq;
DROP TABLE IF EXISTS lms_sandbox_template.reservas;
DROP SEQUENCE IF EXISTS lms_sandbox_template.huespedes_id_seq;
DROP TABLE IF EXISTS lms_sandbox_template.huespedes;
DROP SEQUENCE IF EXISTS lms_sandbox_template.habitaciones_id_seq;
DROP TABLE IF EXISTS lms_sandbox_template.habitaciones;
DROP SEQUENCE IF EXISTS lms_sandbox_template.equipamiento_id_equipo_seq;
DROP TABLE IF EXISTS lms_sandbox_template.equipamiento;
DROP SEQUENCE IF EXISTS lms_sandbox_template.aventureros_id_aventurero_seq;
DROP TABLE IF EXISTS lms_sandbox_template.aventureros;
DROP VIEW IF EXISTS lms_core.v_ranking_alumnos;
DROP VIEW IF EXISTS lms_core.v_contenido_modulos;
DROP TABLE IF EXISTS lms_core.usuarios;
DROP SEQUENCE IF EXISTS lms_core.roles_id_rol_seq;
DROP TABLE IF EXISTS lms_core.roles;
DROP SEQUENCE IF EXISTS lms_core.modulos_id_modulo_seq;
DROP TABLE IF EXISTS lms_core.modulos;
DROP TABLE IF EXISTS lms_core.intentos;
DROP SEQUENCE IF EXISTS lms_core.ejercicios_practicos_id_ejercicio_seq;
DROP TABLE IF EXISTS lms_core.ejercicios_practicos;
DROP SEQUENCE IF EXISTS lms_core.cursos_id_curso_seq;
DROP TABLE IF EXISTS lms_core.cursos;
DROP SEQUENCE IF EXISTS lms_core.auditoria_logs_id_log_seq;
DROP TABLE IF EXISTS lms_core.auditoria_logs;
DROP FUNCTION IF EXISTS lms_core.fn_crear_multiverso();
DROP FUNCTION IF EXISTS lms_core.fn_auditar_ejercicios();
DROP DOMAIN IF EXISTS lms_core.email_valido;
DROP EXTENSION IF EXISTS pgcrypto;
DROP SCHEMA IF EXISTS "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2";
DROP SCHEMA IF EXISTS "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892";
DROP SCHEMA IF EXISTS "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58";
DROP SCHEMA IF EXISTS "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301";
DROP SCHEMA IF EXISTS "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50";
DROP SCHEMA IF EXISTS "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8";
DROP SCHEMA IF EXISTS "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874";
DROP SCHEMA IF EXISTS "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3";
DROP SCHEMA IF EXISTS "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008";
DROP SCHEMA IF EXISTS "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4";
DROP SCHEMA IF EXISTS "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857";
DROP SCHEMA IF EXISTS lms_sandbox_template;
DROP SCHEMA IF EXISTS lms_core;
--
-- Name: lms_core; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA lms_core;


--
-- Name: lms_sandbox_template; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA lms_sandbox_template;


--
-- Name: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857";


--
-- Name: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4";


--
-- Name: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008";


--
-- Name: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3";


--
-- Name: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874";


--
-- Name: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8";


--
-- Name: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50";


--
-- Name: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301";


--
-- Name: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58";


--
-- Name: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892";


--
-- Name: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2";


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: email_valido; Type: DOMAIN; Schema: lms_core; Owner: -
--

CREATE DOMAIN lms_core.email_valido AS text
	CONSTRAINT email_valido_check CHECK ((VALUE ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$'::text));


--
-- Name: fn_auditar_ejercicios(); Type: FUNCTION; Schema: lms_core; Owner: -
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


--
-- Name: fn_crear_multiverso(); Type: FUNCTION; Schema: lms_core; Owner: -
--

CREATE FUNCTION lms_core.fn_crear_multiverso() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    nuevo_esquema TEXT;
    tabla RECORD;
BEGIN
    nuevo_esquema := 'sandbox_usuario_' || NEW.id_usuario;

    -- Crear esquema y asignar dueño
    EXECUTE format('CREATE SCHEMA %I', nuevo_esquema);
    EXECUTE format('ALTER SCHEMA %I OWNER TO app_sandbox_user', nuevo_esquema);

    -- Clonar tablas del template
    FOR tabla IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'lms_sandbox_template'
    LOOP
        EXECUTE format('CREATE TABLE %I.%I (LIKE lms_sandbox_template.%I INCLUDING ALL)', nuevo_esquema, tabla.tablename, tabla.tablename);
        EXECUTE format('INSERT INTO %I.%I SELECT * FROM lms_sandbox_template.%I', nuevo_esquema, tabla.tablename, tabla.tablename);
        EXECUTE format('ALTER TABLE %I.%I OWNER TO app_sandbox_user', nuevo_esquema, tabla.tablename);
    END LOOP;

    -- 🌟 NUEVA MAGIA: Crear y vincular la secuencia de la tabla aventureros 🌟
    EXECUTE format('CREATE SEQUENCE %I.aventureros_id_aventurero_seq', nuevo_esquema);
    EXECUTE format('ALTER SEQUENCE %I.aventureros_id_aventurero_seq OWNER TO app_sandbox_user', nuevo_esquema);
    
    -- Le decimos a la tabla que use esta nueva secuencia para generar sus IDs
    EXECUTE format('ALTER TABLE %I.aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval(''%I.aventureros_id_aventurero_seq'')', nuevo_esquema, nuevo_esquema);
    
    -- Amarramos la secuencia a la columna (si se borra la tabla, se borra la secuencia)
    EXECUTE format('ALTER SEQUENCE %I.aventureros_id_aventurero_seq OWNED BY %I.aventureros.id_aventurero', nuevo_esquema, nuevo_esquema);

    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditoria_logs; Type: TABLE; Schema: lms_core; Owner: -
--

CREATE TABLE lms_core.auditoria_logs (
    id_log integer NOT NULL,
    tabla_afectada text,
    operacion text,
    usuario_db text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    datos_antiguos jsonb
);


--
-- Name: auditoria_logs_id_log_seq; Type: SEQUENCE; Schema: lms_core; Owner: -
--

CREATE SEQUENCE lms_core.auditoria_logs_id_log_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_logs_id_log_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: -
--

ALTER SEQUENCE lms_core.auditoria_logs_id_log_seq OWNED BY lms_core.auditoria_logs.id_log;


--
-- Name: cursos; Type: TABLE; Schema: lms_core; Owner: -
--

CREATE TABLE lms_core.cursos (
    id_curso integer NOT NULL,
    titulo text NOT NULL
);


--
-- Name: cursos_id_curso_seq; Type: SEQUENCE; Schema: lms_core; Owner: -
--

CREATE SEQUENCE lms_core.cursos_id_curso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cursos_id_curso_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: -
--

ALTER SEQUENCE lms_core.cursos_id_curso_seq OWNED BY lms_core.cursos.id_curso;


--
-- Name: ejercicios_practicos; Type: TABLE; Schema: lms_core; Owner: -
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


--
-- Name: ejercicios_practicos_id_ejercicio_seq; Type: SEQUENCE; Schema: lms_core; Owner: -
--

CREATE SEQUENCE lms_core.ejercicios_practicos_id_ejercicio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ejercicios_practicos_id_ejercicio_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: -
--

ALTER SEQUENCE lms_core.ejercicios_practicos_id_ejercicio_seq OWNED BY lms_core.ejercicios_practicos.id_ejercicio;


--
-- Name: intentos; Type: TABLE; Schema: lms_core; Owner: -
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


--
-- Name: modulos; Type: TABLE; Schema: lms_core; Owner: -
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


--
-- Name: modulos_id_modulo_seq; Type: SEQUENCE; Schema: lms_core; Owner: -
--

CREATE SEQUENCE lms_core.modulos_id_modulo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modulos_id_modulo_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: -
--

ALTER SEQUENCE lms_core.modulos_id_modulo_seq OWNED BY lms_core.modulos.id_modulo;


--
-- Name: roles; Type: TABLE; Schema: lms_core; Owner: -
--

CREATE TABLE lms_core.roles (
    id_rol integer NOT NULL,
    nombre text NOT NULL
);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: lms_core; Owner: -
--

CREATE SEQUENCE lms_core.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: lms_core; Owner: -
--

ALTER SEQUENCE lms_core.roles_id_rol_seq OWNED BY lms_core.roles.id_rol;


--
-- Name: usuarios; Type: TABLE; Schema: lms_core; Owner: -
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


--
-- Name: v_contenido_modulos; Type: VIEW; Schema: lms_core; Owner: -
--

CREATE VIEW lms_core.v_contenido_modulos AS
 SELECT m.id_modulo,
    m.titulo AS modulo_titulo,
    e.id_ejercicio,
    e.titulo AS ejercicio_titulo,
    e.dificultad,
    e.orden AS ejercicio_orden
   FROM (lms_core.modulos m
     JOIN lms_core.ejercicios_practicos e ON ((m.id_modulo = e.id_modulo)))
  ORDER BY m.orden, e.orden;


--
-- Name: v_ranking_alumnos; Type: VIEW; Schema: lms_core; Owner: -
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


--
-- Name: aventureros; Type: TABLE; Schema: lms_sandbox_template; Owner: -
--

CREATE TABLE lms_sandbox_template.aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: lms_sandbox_template; Owner: -
--

CREATE SEQUENCE lms_sandbox_template.aventureros_id_aventurero_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox_template; Owner: -
--

ALTER SEQUENCE lms_sandbox_template.aventureros_id_aventurero_seq OWNED BY lms_sandbox_template.aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: lms_sandbox_template; Owner: -
--

CREATE TABLE lms_sandbox_template.equipamiento (
    id_equipo integer NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: equipamiento_id_equipo_seq; Type: SEQUENCE; Schema: lms_sandbox_template; Owner: -
--

CREATE SEQUENCE lms_sandbox_template.equipamiento_id_equipo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipamiento_id_equipo_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox_template; Owner: -
--

ALTER SEQUENCE lms_sandbox_template.equipamiento_id_equipo_seq OWNED BY lms_sandbox_template.equipamiento.id_equipo;


--
-- Name: habitaciones; Type: TABLE; Schema: lms_sandbox_template; Owner: -
--

CREATE TABLE lms_sandbox_template.habitaciones (
    id integer NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: habitaciones_id_seq; Type: SEQUENCE; Schema: lms_sandbox_template; Owner: -
--

CREATE SEQUENCE lms_sandbox_template.habitaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: habitaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox_template; Owner: -
--

ALTER SEQUENCE lms_sandbox_template.habitaciones_id_seq OWNED BY lms_sandbox_template.habitaciones.id;


--
-- Name: huespedes; Type: TABLE; Schema: lms_sandbox_template; Owner: -
--

CREATE TABLE lms_sandbox_template.huespedes (
    id integer NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: huespedes_id_seq; Type: SEQUENCE; Schema: lms_sandbox_template; Owner: -
--

CREATE SEQUENCE lms_sandbox_template.huespedes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: huespedes_id_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox_template; Owner: -
--

ALTER SEQUENCE lms_sandbox_template.huespedes_id_seq OWNED BY lms_sandbox_template.huespedes.id;


--
-- Name: reservas; Type: TABLE; Schema: lms_sandbox_template; Owner: -
--

CREATE TABLE lms_sandbox_template.reservas (
    id integer NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: lms_sandbox_template; Owner: -
--

CREATE SEQUENCE lms_sandbox_template.reservas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: lms_sandbox_template; Owner: -
--

ALTER SEQUENCE lms_sandbox_template.reservas_id_seq OWNED BY lms_sandbox_template.reservas.id;


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

CREATE TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

CREATE TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

CREATE TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

CREATE TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

CREATE TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

CREATE TABLE "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

CREATE TABLE "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

CREATE TABLE "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

CREATE TABLE "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

CREATE TABLE "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

CREATE TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

CREATE TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

CREATE TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

CREATE TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

CREATE TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

CREATE TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

CREATE TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

CREATE TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

CREATE TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

CREATE TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

CREATE TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

CREATE TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

CREATE TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

CREATE TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: mascotas; Type: TABLE; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

CREATE TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    nivel integer DEFAULT 1
);


--
-- Name: mascotas_id_seq; Type: SEQUENCE; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mascotas_id_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas_id_seq OWNED BY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas.id;


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

CREATE TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

CREATE TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

CREATE TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

CREATE TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

CREATE TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

CREATE TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

CREATE TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

CREATE TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

CREATE TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

CREATE TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

CREATE TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

CREATE TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

CREATE TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

CREATE TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

CREATE TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

CREATE TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

CREATE TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

CREATE TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

CREATE TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

CREATE TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: mascotas; Type: TABLE; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

CREATE TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    nivel integer DEFAULT 1
);


--
-- Name: mascotas_id_seq; Type: SEQUENCE; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mascotas_id_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas_id_seq OWNED BY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas.id;


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

CREATE TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE TABLE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros (
    id_aventurero integer DEFAULT nextval('lms_sandbox_template.aventureros_id_aventurero_seq'::regclass) NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dias_semana_id_dia_seq; Type: SEQUENCE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".dias_semana_id_dia_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE TABLE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE TABLE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE TABLE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: mascotas; Type: TABLE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE TABLE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    nivel integer DEFAULT 1
);


--
-- Name: mascotas_id_seq; Type: SEQUENCE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mascotas_id_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas_id_seq OWNED BY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas.id;


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

CREATE TABLE "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: aventureros; Type: TABLE; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

CREATE TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros (
    id_aventurero integer NOT NULL,
    nombre text,
    clase text,
    nivel integer
);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

CREATE SEQUENCE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros_id_aventurero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE OWNED BY; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

ALTER SEQUENCE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros_id_aventurero_seq OWNED BY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros.id_aventurero;


--
-- Name: equipamiento; Type: TABLE; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

CREATE TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento (
    id_equipo integer DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass) NOT NULL,
    id_aventurero integer,
    item text,
    precio integer
);


--
-- Name: habitaciones; Type: TABLE; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

CREATE TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones (
    id integer DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass) NOT NULL,
    numero integer,
    tipo character varying(50),
    precio_noche numeric(10,2)
);


--
-- Name: huespedes; Type: TABLE; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

CREATE TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes (
    id integer DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass) NOT NULL,
    nombre character varying(100),
    nivel_aventurero integer
);


--
-- Name: reservas; Type: TABLE; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

CREATE TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas (
    id integer DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass) NOT NULL,
    fecha_entrada date,
    id_huesped integer,
    id_habitacion integer
);


--
-- Name: auditoria_logs id_log; Type: DEFAULT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.auditoria_logs ALTER COLUMN id_log SET DEFAULT nextval('lms_core.auditoria_logs_id_log_seq'::regclass);


--
-- Name: cursos id_curso; Type: DEFAULT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.cursos ALTER COLUMN id_curso SET DEFAULT nextval('lms_core.cursos_id_curso_seq'::regclass);


--
-- Name: ejercicios_practicos id_ejercicio; Type: DEFAULT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.ejercicios_practicos ALTER COLUMN id_ejercicio SET DEFAULT nextval('lms_core.ejercicios_practicos_id_ejercicio_seq'::regclass);


--
-- Name: modulos id_modulo; Type: DEFAULT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.modulos ALTER COLUMN id_modulo SET DEFAULT nextval('lms_core.modulos_id_modulo_seq'::regclass);


--
-- Name: roles id_rol; Type: DEFAULT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.roles ALTER COLUMN id_rol SET DEFAULT nextval('lms_core.roles_id_rol_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('lms_sandbox_template.aventureros_id_aventurero_seq'::regclass);


--
-- Name: equipamiento id_equipo; Type: DEFAULT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.equipamiento ALTER COLUMN id_equipo SET DEFAULT nextval('lms_sandbox_template.equipamiento_id_equipo_seq'::regclass);


--
-- Name: habitaciones id; Type: DEFAULT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.habitaciones ALTER COLUMN id SET DEFAULT nextval('lms_sandbox_template.habitaciones_id_seq'::regclass);


--
-- Name: huespedes id; Type: DEFAULT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.huespedes ALTER COLUMN id SET DEFAULT nextval('lms_sandbox_template.huespedes_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.reservas ALTER COLUMN id SET DEFAULT nextval('lms_sandbox_template.reservas_id_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros_id_aventurero_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros_id_aventurero_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros_id_aventurero_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros_id_aventurero_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros_id_aventurero_seq'::regclass);


--
-- Name: mascotas id; Type: DEFAULT; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas ALTER COLUMN id SET DEFAULT nextval('"sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas_id_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros_id_aventurero_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros_id_aventurero_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros_id_aventurero_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros_id_aventurero_seq'::regclass);


--
-- Name: mascotas id; Type: DEFAULT; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas ALTER COLUMN id SET DEFAULT nextval('"sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas_id_seq'::regclass);


--
-- Name: mascotas id; Type: DEFAULT; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas ALTER COLUMN id SET DEFAULT nextval('"sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas_id_seq'::regclass);


--
-- Name: aventureros id_aventurero; Type: DEFAULT; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros ALTER COLUMN id_aventurero SET DEFAULT nextval('"sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros_id_aventurero_seq'::regclass);


--
-- Data for Name: auditoria_logs; Type: TABLE DATA; Schema: lms_core; Owner: -
--

INSERT INTO lms_core.auditoria_logs VALUES (1, 'ejercicios_practicos', 'UPDATE', 'postgres', '2026-04-27 07:25:03.793177', '{"orden": 3, "titulo": "5.3: El DEFAULT del novato", "formato": "sql", "enunciado": "Inserta un aventurero sin especificar nivel. Verifica que use DEFAULT 1.", "id_modulo": 5, "dificultad": 2, "tipo_mision": "HISTORIA", "id_ejercicio": 45, "query_maestra": "INSERT INTO aventureros (nombre, clase) VALUES (''Nuevo'', ''Guerrero'');", "configuracion_extra": null}');
INSERT INTO lms_core.auditoria_logs VALUES (2, 'ejercicios_practicos', 'UPDATE', 'postgres', '2026-04-27 07:44:04.680817', '{"orden": 201, "titulo": "Rápida: CHECK rápido", "formato": "editor", "enunciado": "Verifica que el nivel sea mayor a 0.", "id_modulo": 5, "dificultad": 1, "tipo_mision": "RAPIDA", "id_ejercicio": 98, "query_maestra": "SELECT * FROM aventureros WHERE nivel > 0;", "configuracion_extra": null}');
INSERT INTO lms_core.auditoria_logs VALUES (3, 'ejercicios_practicos', 'UPDATE', 'postgres', '2026-04-27 18:49:58.920097', '{"orden": 4, "titulo": "6.4: DEFAULT automático", "formato": "sql", "enunciado": "Inserta habitación sin precio y verifica que usa DEFAULT.", "id_modulo": 6, "dificultad": 2, "tipo_mision": "HISTORIA", "id_ejercicio": 50, "query_maestra": "INSERT INTO habitaciones (numero, tipo) VALUES (999, ''Especial''); SELECT precio_noche FROM habitaciones WHERE numero = 999;", "configuracion_extra": null}');
INSERT INTO lms_core.auditoria_logs VALUES (4, 'ejercicios_practicos', 'UPDATE', 'postgres', '2026-04-27 18:49:59.065096', '{"orden": 201, "titulo": "Rápida: DEFAULT fecha", "formato": "sql", "enunciado": "Inserta reserva sin fecha.", "id_modulo": 6, "dificultad": 2, "tipo_mision": "RAPIDA", "id_ejercicio": 100, "query_maestra": "INSERT INTO reservas (id_huesped, id_habitacion) VALUES (1, 1); SELECT fecha_entrada FROM reservas ORDER BY id DESC LIMIT 1;", "configuracion_extra": null}');


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: lms_core; Owner: -
--

INSERT INTO lms_core.cursos VALUES (1, 'Senda del Guerrero: Administración SQL');
INSERT INTO lms_core.cursos VALUES (2, 'Senda del Arquitecto: Diseño de BD');


--
-- Data for Name: ejercicios_practicos; Type: TABLE DATA; Schema: lms_core; Owner: -
--

INSERT INTO lms_core.ejercicios_practicos VALUES (12, 3, 'Haz un INNER JOIN entre aventureros (a) y equipamiento (e). Une ambas usando "id_aventurero" y muestra el "nombre" del héroe y el "item" que porta.', 'SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;', 3, NULL, '3.1: Cruzando el Puente (INNER JOIN)', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (13, 3, 'Haz el mismo JOIN de la misión anterior, pero agrega un filtro (WHERE) para mostrar únicamente los items de la clase ''Caballero''.', 'SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE a.clase = ''Caballero'';', 4, NULL, '3.2: Arsenal Específico', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (14, 3, 'Usa un LEFT JOIN desde aventureros hacia equipamiento para mostrar los nombres de TODOS los héroes, incluso si no tienen armas compradas.', 'SELECT a.nombre, e.item FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;', 4, NULL, '3.3: Nadie se Queda Atrás (LEFT JOIN)', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (15, 3, 'Une ambas tablas. Muestra el "nombre", usa SUM(precio) para calcular el valor total de sus armas, y usa GROUP BY para agrupar por nombre.', 'SELECT a.nombre, SUM(e.precio) FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre;', 5, NULL, '3.4: El Valor de un Héroe', 4, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (16, 4, 'Demuestra tu comprensión abstracta. Diseña el diagrama Entidad-Relación. Crea al menos dos Entidades y conéctalas con una Llave Foránea.', '{"diagrama": "validado"}', 5, NULL, 'Fase 1: El Lienzo del Arquitecto', 1, 'HISTORIA', 'diagram');
INSERT INTO lms_core.ejercicios_practicos VALUES (17, 4, 'Último reto de código. Une aventureros y equipamiento, filtra aquellos que tengan un item con precio MAYOR a 100. Muestra el nombre y el item.', 'SELECT a.nombre, e.item FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE e.precio > 100;', 5, NULL, 'Fase 2: Extracción Maestra', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (10, 2, 'Loya ha entrenado duro. Usa UPDATE para cambiar su nivel a 20 en la tabla aventureros. Usa "RETURNING *" al final para verificar el cambio.', 'UPDATE aventureros SET nivel = 20 WHERE nombre = ''Loya'' RETURNING *;', 3, NULL, '2.3: UPDATE - Cambiar el Destino', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (11, 2, 'El asesino Dan nos ha traicionado. Usa DELETE para borrarlo de la tabla aventureros. Recuerda usar WHERE y "RETURNING *" al final.', 'DELETE FROM aventureros WHERE nombre = ''Dan'' RETURNING *;', 3, NULL, '2.4: DELETE - El Abismo', 4, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (23, 2, 'Busca el arma más barata. Usa la función MIN(precio) en la tabla equipamiento.', 'SELECT MIN(precio) FROM equipamiento;', 2, NULL, 'Práctica Relámpago: Ganga', 101, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (24, 2, '¿Cuál es la media de nuestro gremio? Calcula el promedio de nivel usando AVG(nivel) en la tabla aventureros.', 'SELECT AVG(nivel) FROM aventureros;', 2, NULL, 'Práctica Relámpago: Promedio de Poder', 102, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (25, 2, 'Encuentra el valor del arma más cara usando MAX(precio) en el equipamiento.', 'SELECT MAX(precio) FROM equipamiento;', 2, NULL, 'Práctica Relámpago: Objeto de Lujo', 103, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (26, 2, 'Cuenta cuántos objetos en total tenemos guardados usando COUNT(*) en la tabla equipamiento.', 'SELECT COUNT(*) FROM equipamiento;', 1, NULL, 'Práctica Relámpago: Inventario Total', 104, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (27, 2, '¿Quién es el más fuerte de cada clase? Muestra la "clase" y el MAX(nivel), agrupando por clase.', 'SELECT clase, MAX(nivel) FROM aventureros GROUP BY clase;', 4, NULL, 'Práctica Relámpago: Cima de Clases', 105, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (28, 4, 'Diseña el sistema completo de una Posada de Aventureros. Crea 3 entidades: ''huespedes'', ''habitaciones'' y ''reservas''. Cada una con al menos 2 atributos. Conecta huéspedes con reservas, y habitaciones con reservas.', '{"diagrama": "validado"}', 5, '{"mensaje_error": "La posada necesita entidades para los huéspedes, las habitaciones y las reservas.", "min_atributos": 6, "min_entidades": 3, "min_relaciones": 2, "mensaje_relaciones": "Conecta huéspedes con reservas, y habitaciones con reservas (relación muchos a muchos).", "entidades_requeridas": [["huesped", "huespedes", "cliente", "clientes"], ["habitacion", "habitaciones", "cuarto", "cuartos", "room"], ["reserva", "reservas", "reservacion", "booking"]]}', 'Fase 1: La Posada del Arquitecto', 1, 'HISTORIA', 'diagram');
INSERT INTO lms_core.ejercicios_practicos VALUES (29, 4, 'Demuestra tu dominio de JOINs. Une aventureros y equipamiento, filtra los items con precio mayor a 100. Muestra nombre, item y precio ordenados por precio de mayor a menor.', 'SELECT a.nombre, e.item, e.precio FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero WHERE e.precio > 100 ORDER BY e.precio DESC;', 5, NULL, 'Fase 2: Consulta Maestra', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (104, 1, 'El Gran salón contiene TODOS los aventureros. Imagina el Gran Salón del Gremio donde están TODOS. Tu misión es usar el asterisco (*) para mirar al Universo completo.', 'SELECT * FROM aventureros;', 1, '{"wordBank": ["SELECT", "*", "FROM", "aventureros", ";", "WHERE", "clase"]}', '1.1: El Conjunto Universo', 1, 'HISTORIA', 'drag_drop');
INSERT INTO lms_core.ejercicios_practicos VALUES (30, 4, 'Reto final: muestra un ranking de héroes por su gasto total en equipo. Usa INNER JOIN, SUM(e.precio), GROUP BY, y ordena de mayor a menor gasto. Muestra nombre y total.', 'SELECT a.nombre, SUM(e.precio) AS total FROM aventureros a INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.nombre ORDER BY total DESC;', 5, NULL, 'Fase 3: El Ranking Definitivo', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (37, 3, '¡Has diseñado el plano! Ahora, forja la tabla "pociones" con id (SERIAL PK), nombre (VARCHAR 50) y poder (INTEGER).', 'CREATE TABLE pociones (id SERIAL PRIMARY KEY, nombre VARCHAR(50), poder INTEGER);', 3, '{"tipo_validacion": "ddl"}', '3.4: Forjando el Metal (DDL)', 4, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (38, 3, '¡Cuidado! Olvidamos la columna "rareza". Añádela a la tabla "pociones" (VARCHAR 20).', 'ALTER TABLE pociones ADD COLUMN rareza VARCHAR(20);', 3, '{"tipo_validacion": "ddl"}', '3.5: Reforzando la Armadura (ALTER)', 5, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (39, 3, 'La tabla "trastos_viejos" no sirve. Elíminala del registro para siempre.', 'DROP TABLE trastos_viejos;', 2, '{"tipo_validacion": "ddl"}', '3.6: El Desvío del Abismo (DROP)', 6, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (40, 4, 'Diseña la Posada: Huespedes, Habitaciones y Reservas.', '{"diagrama": "validado"}', 4, '{"min_entidades": 3, "min_relaciones": 2}', 'Reto Final Fase 1: El Plano', 7, 'HISTORIA', 'diagram');
INSERT INTO lms_core.ejercicios_practicos VALUES (41, 4, 'Crea la tabla "habitaciones" (id SERIAL PK, numero INTEGER, precio NUMERIC).', 'CREATE TABLE habitaciones (id SERIAL PRIMARY KEY, numero INTEGER, precio NUMERIC);', 4, '{"tipo_validacion": "ddl"}', 'Reto Final Fase 2: Construcción', 8, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (42, 4, 'Une Huespedes con Habitaciones para el reporte diario.', 'SELECT h.nombre, hab.numero FROM huespedes h JOIN reservas r ON h.id = r.id_huesped JOIN habitaciones hab ON r.id_habitacion = hab.id;', 5, '{}', 'Reto Final Fase 3: Consultas', 9, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (9, 2, 'Agrega un nuevo registro. Inserta al aventurero ''Gimli'', clase ''Guerrero'', nivel 10 en la tabla aventureros. Agrega "RETURNING *" al final para ver a tu creación.', 'INSERT INTO aventureros (nombre, clase, nivel) VALUES (''Gimli'', ''Guerrero'', 10) RETURNING *;', 2, NULL, '2.1: CREATE - El Aliento de Vida', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (111, 2, 'La ''R'' de CRUD significa Read (Leer). Usa SELECT para encontrar a todos los aventureros que tengan un nivel mayor a 10.', 'SELECT * FROM aventureros WHERE nivel > 10;', 1, NULL, '2.2: READ - La Visión del Oráculo', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (112, 2, 'Usa LIKE y el comodín % para encontrar a los aventureros cuyo nombre empiece con la letra "A".', 'SELECT * FROM aventureros WHERE nombre LIKE ''A%'';', 2, NULL, '2.5: El Detective (LIKE)', 5, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (113, 2, 'Frena la avalancha de datos. Trae a los 3 aventureros con mayor nivel ordenándolos de forma descendente (DESC).', 'SELECT * FROM aventureros ORDER BY nivel DESC LIMIT 3;', 2, NULL, '2.6: Orden y Límite', 6, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (107, 1, 'El Rey llama a la guerra. Cualquiera que sea Mago O Arquero entra al grupo. Une ambos conjuntos.', 'SELECT * FROM aventureros WHERE clase = ''Mago'' OR clase = ''Arquero'';', 1, '{"wordBank": ["SELECT", "*", "FROM", "aventureros", "WHERE", "clase", "=", "''Mago''", "OR", "''Arquero''", "AND", "''Guerrero''", ";"]}', '1.4: La Unión - OR', 4, 'HISTORIA', 'drag_drop');
INSERT INTO lms_core.ejercicios_practicos VALUES (108, 1, 'Ha habido un robo. Sospechamos de todos EXCEPTO de los Paladines. Usa el símbolo != (distinto de) para excluirlos del conjunto.', 'SELECT * FROM aventureros WHERE clase != ''Paladin'';', 1, '{"wordBank": ["SELECT", "*", "FROM", "aventureros", "WHERE", "clase", "!=", "''Paladin''", "=", "''Mago''", ";"]}', '1.5: La Diferencia - NOT/!=', 5, 'HISTORIA', 'drag_drop');
INSERT INTO lms_core.ejercicios_practicos VALUES (105, 1, 'De todos los del Gran Salón, queremos que los Magos den un paso al frente. Usa WHERE para crear este Subconjunto.', 'SELECT * FROM aventureros WHERE clase = ''Mago'';', 1, '{"wordBank": ["SELECT", "*", "FROM", "aventureros", "WHERE", "clase", "=", "''Mago''", "''Guerrero''", ";"]}', '1.2: El Subconjunto - Filtrado', 2, 'HISTORIA', 'drag_drop');
INSERT INTO lms_core.ejercicios_practicos VALUES (106, 1, 'Queremos a los héroes de élite. Deben pertenecer al conjunto de GUERREROS Y además tener un nivel mayor a 20 (> 20).', 'SELECT * FROM aventureros WHERE clase = ''Guerrero'' AND nivel > 20;', 1, '{"wordBank": ["SELECT", "*", "FROM", "aventureros", "WHERE", "clase", "=", "''Guerrero''", "AND", "nivel", ">", "20", "OR", "10", ";"]}', '1.3: La Intersección - AND', 3, 'HISTORIA', 'drag_drop');
INSERT INTO lms_core.ejercicios_practicos VALUES (109, 1, 'Filtremos más a fondo. Encuentra a los Guerreros que tengan un nivel mayor a 15 Y que también tengan nivel menor a 30.', 'SELECT * FROM aventureros WHERE clase = ''Guerrero'' AND nivel > 15 AND nivel < 30;', 1, '{"wordBank": ["SELECT", "*", "FROM", "aventureros", "WHERE", "clase", "=", "''Guerrero''", "AND", "nivel", ">", "15", "<", "30", "OR", ";"]}', '1.6: Múltiples Intersecciones', 6, 'HISTORIA', 'drag_drop');
INSERT INTO lms_core.ejercicios_practicos VALUES (110, 1, 'Selecciona a los que sean Mago, Arquero o Guerrero. Puedes usar múltiples OR, o intentar usar la función IN(...) para atrapar a los tres grupos.', 'SELECT * FROM aventureros WHERE clase IN (''Mago'', ''Arquero'', ''Guerrero'');', 1, '{"wordBank": ["SELECT", "*", "FROM", "aventureros", "WHERE", "clase", "IN", "(", "''Mago''", ",", "''Arquero''", "''Guerrero''", ")", "OR", ";"]}', '1.7: Múltiples Uniones - IN', 7, 'HISTORIA', 'drag_drop');
INSERT INTO lms_core.ejercicios_practicos VALUES (52, 7, 'Muestra el último valor usado por la secuencia.', 'SELECT currval(''aventureros_id_aventurero_seq'');', 2, '{"tipo_validacion": "ddl"}', '7.2: Currval de secuencia', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (53, 7, 'Crea una secuencia llamada "seq_custom" que empiece en 100.', 'CREATE SEQUENCE seq_custom START 100; SELECT nextval(''seq_custom'');', 3, '{"tipo_validacion": "ddl"}', '7.3: Crear secuencia manual', 3, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (54, 7, 'Elimina la secuencia seq_custom.', 'DROP SEQUENCE seq_custom;', 2, '{"tipo_validacion": "ddl"}', '7.4: Eliminar secuencia', 4, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (45, 5, 'Inserta un aventurero llamado ''Nuevo'' con la clase ''Guerrero'' sin especificar su nivel. Verifica que use DEFAULT 1.', 'INSERT INTO aventureros (nombre, clase) VALUES (''Nuevo'', ''Guerrero'') RETURNING *;', 2, NULL, '5.3: El DEFAULT del novato', 3, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (46, 5, 'El gremio necesita un listado oficial. Selecciona todos los datos de la tabla "aventureros", pero filtra los resultados para mostrar ÚNICAMENTE a aquellos cuyo nombre no esté vacío utilizando la condición IS NOT NULL.', 'SELECT * FROM aventureros WHERE nombre IS NOT NULL;', 2, NULL, '5.4: Valores obligatorios', 4, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (51, 7, 'Las secuencias son "generadores de tickets" invisibles en SQL. Cuando usas SERIAL, PostgreSQL crea una por ti. Usa la función nextval(''nombre_secuencia'') para pedirle a la base de datos el siguiente número disponible en la fila.', 'SELECT nextval(''aventureros_id_aventurero_seq'');', 2, '{"tipo_validacion": "ddl"}', '7.1: Ver siguiente serial', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (43, 5, 'Crea la tabla "mascotas" con: id (SERIAL, PK), nombre (VARCHAR 50, NOT NULL) y nivel (INTEGER DEFAULT 1).', 'CREATE TABLE mascotas (id SERIAL PRIMARY KEY, nombre VARCHAR(50) NOT NULL, nivel INTEGER DEFAULT 1);', 2, NULL, '5.1: Crear tabla con sellos', 1, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (44, 5, 'Añade PRIMARY KEY a la columna id_aventurero de la tabla aventureros.', 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);', 3, NULL, '5.2: Añadir constraint PK', 2, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (47, 6, 'Añade constraint UNIQUE a la columna nombre de aventureros.', 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nombre_unique UNIQUE (nombre);', 3, NULL, '6.1: Nombres únicos', 1, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (48, 6, 'Añade CHECK para que nivel sea entre 1 y 99.', 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);', 3, NULL, '6.2: CHECK nivel válido', 2, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (49, 6, 'Añade CHECK para que precio sea mayor a 0 en equipamiento.', 'ALTER TABLE equipamiento ADD CONSTRAINT equipamiento_precio_check CHECK (precio > 0);', 3, NULL, '6.3: CHECK precio positivo', 3, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (55, 8, 'Selecciona aventureros con nivel entre 10 y 20.', 'SELECT * FROM aventureros WHERE nivel BETWEEN 10 AND 20;', 2, NULL, '8.1: BETWEEN poderoso', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (56, 8, 'Selecciona aventureros de clase Guerrero o Maga Suprema.', 'SELECT * FROM aventureros WHERE clase IN (''Guerrero'', ''Maga Suprema'');', 2, NULL, '8.2: IN Selectivo', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (57, 8, 'Encuentra aventureros que tienen NULL en nivel.', 'SELECT * FROM aventureros WHERE nivel IS NULL;', 2, NULL, '8.3: Los sin equipo', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (58, 8, 'Encuentra aventureros que tienen nivel definido.', 'SELECT * FROM aventureros WHERE nivel IS NOT NULL;', 2, NULL, '8.4: Los que sí tienen', 4, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (59, 9, 'Crea una vista "vista_guerreros" que muestre los aventureros de clase Guerrero.', 'CREATE VIEW vista_guerreros AS SELECT * FROM aventureros WHERE clase = ''Guerrero'';', 3, NULL, '9.1: Vista simple', 1, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (60, 9, 'Crea vista "vista_equipados" con nombre del aventurero y su item.', 'CREATE VIEW vista_equipados AS SELECT a.nombre, e.item FROM aventureros a JOIN equipamiento e ON a.id_aventurero = e.id_aventurero;', 3, NULL, '9.2: Vista con JOIN', 2, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (61, 9, 'Selecciona todo de la vista vista_guerreros.', 'SELECT * FROM vista_guerreros;', 1, NULL, '9.3: Consultar vista', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (62, 9, 'Elimina la vista vista_guerreros.', 'DROP VIEW IF EXISTS vista_guerreros;', 2, NULL, '9.4: Eliminar vista', 4, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (63, 10, 'Lista todas las tablas en tu esquema actual.', 'SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema();', 2, NULL, '10.1: Ver tablas del esquema', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (64, 10, 'Muestra las columnas de la tabla aventureros.', 'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ''aventureros'';', 2, NULL, '10.2: Ver columnas', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (65, 10, 'Lista los constraints de la tabla equipamiento.', 'SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = ''equipamiento'';', 3, NULL, '10.3: Ver constraints', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (66, 10, 'Lista las secuencias disponibles.', 'SELECT sequence_name FROM information_schema.sequences;', 2, NULL, '10.4: Ver secuencias', 4, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (67, 11, 'Busca aventureros cuyos nombres empiezan con "L".', 'SELECT * FROM aventureros WHERE nombre LIKE ''L%'';', 2, NULL, '11.1: LIKE comodín inicio', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (68, 11, 'Busca aventureros cuyos nombres terminan con "a".', 'SELECT * FROM aventureros WHERE nombre LIKE ''%a'';', 2, NULL, '11.2: LIKE comodín fin', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (69, 11, 'Busca aventureros que tengan "o" en cualquier parte del nombre.', 'SELECT * FROM aventureros WHERE nombre LIKE ''%o%'';', 2, NULL, '11.3: LIKE ambos lados', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (50, 6, 'El gremio necesita registrar una nueva habitación (numero: 999, tipo: ''Especial''). Ingrésala sin especificar el precio para aprovechar nuestro valor por defecto. IMPORTANTE: Necesitamos ver el comprobante inmediatamente. Haz que tu instrucción de inserción "retorne" todos los datos generados (*) al finalizar.', 'INSERT INTO habitaciones (numero, tipo) VALUES (999, ''Especial'') RETURNING *;', 2, '{"tipo_validacion": "ddl"}', '6.4: DEFAULT automático', 4, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (70, 11, 'Busca aventureros que NO empiecen con "A".', 'SELECT * FROM aventureros WHERE nombre NOT LIKE ''A%'';', 2, NULL, '11.4: NOT LIKE', 4, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (71, 12, 'Crea función "sumar" que sume dos números.', 'CREATE FUNCTION sumar(a INTEGER, b INTEGER) RETURNS INTEGER AS '' SELECT a + b; '' LANGUAGE SQL; SELECT sumar(5, 3);', 3, NULL, '12.1: Función básica', 1, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (72, 12, 'Crea función que cuente aventureros por clase.', 'CREATE FUNCTION contar_por_clase(clase_param VARCHAR) RETURNS INTEGER AS '' SELECT COUNT(*) FROM aventureros WHERE clase = clase_param; '' LANGUAGE SQL; SELECT contar_por_clase(''Guerrero'');', 4, NULL, '12.2: Contar aventureros', 2, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (73, 12, 'Crea función que diga si el nivel es alto (>20) o bajo.', 'CREATE FUNCTION verificar_nivel(n INTEGER) RETURNS TEXT AS '' SELECT CASE WHEN n > 20 THEN ''Alto'' ELSE ''Bajo'' END; '' LANGUAGE SQL; SELECT verificar_nivel(25);', 4, NULL, '12.3: Función con IF', 3, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (74, 12, 'Crea función que devuelva aventureros con nivel mayor al dado.', 'CREATE FUNCTION aventureros_fuertes(min_nivel INTEGER) RETURNS TABLE(nombre TEXT, nivel INTEGER) AS '' SELECT nombre, nivel FROM aventureros WHERE nivel >= min_nivel; '' LANGUAGE SQL; SELECT * FROM aventureros_fuertes(20);', 5, NULL, '12.4: Función con tabla', 4, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (75, 13, 'Crea función que inserte aventurero y devuelva mensaje.', 'CREATE FUNCTION crear_aventurero(n VARCHAR, c VARCHAR) RETURNS TEXT AS '' BEGIN INSERT INTO aventureros (nombre, clase) VALUES (n, c); RETURN ''Aventurero '' || n || '' creado!''; END; '' LANGUAGE plpgsql; SELECT crear_aventurero(''Test'', ''Mago'');', 4, NULL, '13.1: Procedure insertar', 1, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (76, 13, 'Crea función que inserte aventurero Y su equipo.', 'CREATE FUNCTION reclutar_con_equipo(av_nombre VARCHAR, av_clase VARCHAR, eq_item VARCHAR, eq_precio INTEGER) RETURNS INTEGER AS '' DECLARE new_id INTEGER; BEGIN INSERT INTO aventureros (nombre, clase) VALUES (av_nombre, av_clase) RETURNING id_aventurero INTO new_id; INSERT INTO equipamiento (id_aventurero, item, precio) VALUES (new_id, eq_item, eq_precio); RETURN new_id; END; '' LANGUAGE plpgsql;', 5, NULL, '13.2: Transacción múltiples inserts', 2, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (77, 14, 'Crea trigger que muestre mensaje al insertar.', 'CREATE FUNCTION fn_saludo() RETURNS TRIGGER AS '' BEGIN RAISE NOTICE ''Nuevo aventurero: %'', NEW.nombre; RETURN NEW; END; '' LANGUAGE plpgsql; CREATE TRIGGER trg_saludo AFTER INSERT ON aventureros FOR EACH ROW EXECUTE FUNCTION fn_saludo();', 5, NULL, '14.1: Trigger básico', 1, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (78, 14, 'Crea tabla de logs y trigger de auditoría.', 'CREATE TABLE log_cambios (id SERIAL, accion TEXT, tabla TEXT, fecha TIMESTAMP DEFAULT NOW()); CREATE FUNCTION fn_auditar() RETURNS TRIGGER AS '' BEGIN INSERT INTO log_cambios (accion, tabla) VALUES (TG_OP, TG_TABLE_NAME); RETURN NEW; END; '' LANGUAGE plpgsql; CREATE TRIGGER trg_auditar AFTER INSERT ON aventureros FOR EACH ROW EXECUTE FUNCTION fn_auditar();', 5, NULL, '14.2: Trigger con auditoría', 2, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (79, 14, 'Crea trigger BEFORE que valide nivel antes de insertar.', 'CREATE FUNCTION fn_validar_nivel() RETURNS TRIGGER AS '' BEGIN IF NEW.nivel < 1 OR NEW.nivel > 99 THEN RAISE EXCEPTION ''Nivel debe estar entre 1 y 99''; END IF; RETURN NEW; END; '' LANGUAGE plpgsql; CREATE TRIGGER trg_validar_nivel BEFORE INSERT ON aventureros FOR EACH ROW EXECUTE FUNCTION fn_validar_nivel();', 5, NULL, '14.3: Trigger BEFORE validación', 3, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (80, 15, 'Inserta un nuevo aventurero (implícito COMMIT).', 'BEGIN; INSERT INTO aventureros (nombre, clase, nivel) VALUES (''Temporal1'', ''Guerrero'', 50); COMMIT; SELECT * FROM aventureros WHERE nombre = ''Temporal1'';', 3, NULL, '15.1: Insert y Commit', 1, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (81, 15, 'Inserta y deshaz los cambios.', 'BEGIN; INSERT INTO aventureros (nombre, clase) VALUES (''Desechado'', ''Mago''); ROLLBACK; SELECT COUNT(*) FROM aventureros WHERE nombre = ''Desechado'';', 3, NULL, '15.2: ROLLBACK', 2, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (82, 15, 'Usa SAVEPOINT para hacer rollback parcial.', 'BEGIN; INSERT INTO aventureros (nombre, clase) VALUES (''Primero'', ''Guerrero''); SAVEPOINT sp1; INSERT INTO aventureros (nombre, clase) VALUES (''Segundo'', ''Mago''); ROLLBACK TO SAVEPOINT sp1; COMMIT; SELECT COUNT(*) FROM aventureros WHERE nombre IN (''Primero'', ''Segundo'');', 5, NULL, '15.3: SAVEPOINT', 3, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (83, 16, 'Usa FOR UPDATE para bloquear una fila.', 'SELECT * FROM aventureros WHERE id_aventurero = 1 FOR UPDATE;', 4, NULL, '16.1: FOR UPDATE básico', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (84, 16, 'Intenta bloquear con NOWAIT.', 'SELECT * FROM aventureros WHERE id_aventurero = 1 FOR UPDATE NOWAIT;', 4, NULL, '16.2: NOWAIT', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (85, 17, 'Une nombres de aventureros con items.', 'SELECT nombre FROM aventureros UNION SELECT item FROM equipamiento ORDER BY 1;', 3, NULL, '17.1: UNION', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (86, 17, 'Une con duplicados.', 'SELECT clase FROM aventureros UNION ALL SELECT item FROM equipamiento LIMIT 10;', 3, NULL, '17.2: UNION ALL', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (87, 17, 'Encuentra clases que también son items.', 'SELECT clase FROM aventureros INTERSECT SELECT item FROM equipamiento;', 4, NULL, '17.3: INTERSECT', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (88, 17, 'Muestra clases que NO son items.', 'SELECT clase FROM aventureros EXCEPT SELECT item FROM equipamiento;', 4, NULL, '17.4: EXCEPT', 4, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (89, 18, 'Consulta los roles existentes.', 'SELECT rolname FROM pg_roles WHERE rolname NOT LIKE ''pg_%;', 2, NULL, '18.1: Ver roles actuales', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (90, 18, 'Muestra los permisos en la tabla aventureros.', 'SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name = ''aventureros'';', 3, NULL, '18.2: Ver permisos', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (91, 18, 'Muestra el usuario actual.', 'SELECT current_user, session_user, current_database();', 1, NULL, '18.3: Ver rol actual', 3, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (92, 19, 'Consulta los esquemas disponibles.', 'SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;', 2, NULL, '19.1: Tu esquema personal', 1, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (93, 19, 'Muestra el search_path actual.', 'SELECT current_setting(''search_path'');', 3, NULL, '19.2: Entender el multiverso', 2, 'HISTORIA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (94, 20, 'Crea tabla "bestiario" con PK, NOT NULL, CHECK.', 'CREATE TABLE bestiario (id SERIAL PRIMARY KEY, nombre VARCHAR(100) NOT NULL, nivel INTEGER CHECK (nivel >= 1 AND nivel <= 50), tipo VARCHAR(50));', 4, NULL, '20.1: Tabla con constraints', 1, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (95, 20, 'Crea función que calcule XP necesaria.', 'CREATE FUNCTION xp_para_nivel(target INTEGER) RETURNS INTEGER AS '' SELECT target * 10; '' LANGUAGE SQL; SELECT xp_para_nivel(15);', 4, NULL, '20.2: Función de cálculo', 2, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (96, 20, 'Crea vista con aventureros y total de oro.', 'CREATE VIEW resumen_heroes AS SELECT a.nombre, a.clase, COALESCE(SUM(e.precio), 0) AS total_oro FROM aventureros a LEFT JOIN equipamiento e ON a.id_aventurero = e.id_aventurero GROUP BY a.id_aventurero, a.nombre, a.clase;', 5, NULL, '20.3: Vista de resumen', 3, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (97, 20, 'Inserta aventurero con equipo en transacción.', 'BEGIN; INSERT INTO aventureros (nombre, clase, nivel) VALUES (''Final'', ''Paladín'', 25); INSERT INTO equipamiento (id_aventurero, item, precio) VALUES (currval(''aventureros_id_aventurero_seq''), ''Espada Final'', 500); COMMIT;', 5, NULL, '20.4: Transacción segura', 4, 'HISTORIA', 'sql');
INSERT INTO lms_core.ejercicios_practicos VALUES (101, 7, 'Muestra el siguiente ID.', 'SELECT nextval(''aventureros_id_aventurero_seq'');', 1, NULL, 'Rápida: Siguiente ID', 201, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (102, 8, 'Nivel entre 10 y 30.', 'SELECT * FROM aventureros WHERE nivel BETWEEN 10 AND 30;', 1, NULL, 'Rápida: BETWEEN clásico', 201, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (103, 8, 'Quién tiene nivel NULL.', 'SELECT nombre FROM aventureros WHERE nivel IS NULL;', 1, NULL, 'Rápida: NULL especial', 202, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (98, 5, 'Añade una restricción matemática a la tabla aventureros. Asegúrate de que nadie pueda tener un nivel de cero o negativo utilizando ADD CHECK (nivel > 0).', 'ALTER TABLE aventureros ADD CHECK (nivel > 0);', 1, '{"tipo_validacion": "ddl"}', 'Rápida: CHECK rápido', 201, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (99, 5, 'Busca los nombres duplicados en la tabla. Agrupa los registros por nombre y muestra el "nombre" y el "COUNT(*)" de aquellos cuyo conteo sea mayor a 1 utilizando HAVING.', 'SELECT nombre, COUNT(*) FROM aventureros GROUP BY nombre HAVING COUNT(*) > 1;', 2, NULL, 'Rápida: Nombres duplicados', 202, 'RAPIDA', 'editor');
INSERT INTO lms_core.ejercicios_practicos VALUES (100, 6, 'Un cliente VIP acaba de llegar. Inserta una nueva reserva relacionando al huésped 1 con la habitación 1. Al igual que antes, asegúrate de que tu instrucción "retorne" toda la fila (*) para que podamos ver la fecha que se generó por defecto.', 'INSERT INTO reservas (id_huesped, id_habitacion) VALUES (1, 1) RETURNING *;', 2, '{"tipo_validacion": "ddl"}', 'Rápida: DEFAULT fecha', 201, 'RAPIDA', 'sql');


--
-- Data for Name: intentos; Type: TABLE DATA; Schema: lms_core; Owner: -
--

INSERT INTO lms_core.intentos VALUES ('9f99abda-e04f-46db-8483-1ad52df3f948', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 9, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('b639fc29-afc0-4332-b914-111fe1a37f5b', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 10, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('38ac780d-0aae-4cc9-8f59-5288360f991e', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('19cdd27c-fd91-4aba-86b6-13169e9d8a28', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 12, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('e4439ee9-c803-44d2-9949-774ffda06600', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 13, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('d67d55c1-5dd7-4015-a608-c11a97470d81', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 14, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('08316216-a376-4939-acfb-7a12b7898533', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 15, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('f17a61fc-4525-481d-8aad-b664ec2fce30', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 16, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('e89d0a6e-6da3-4dff-8e48-a856d4d6b32f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 17, '-- Consulta de prueba completada por el sistema', true, NULL, '2026-04-18 23:36:14.645668');
INSERT INTO lms_core.intentos VALUES ('f0553146-2074-4a46-b537-44efd964ad98', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 16, '{"nodes":[{"id":"c82fb200-a3ae-46d6-8a3f-28806fcc1fc2","type":"tableNode","position":{"x":48.350204284174126,"y":118.30767976817222},"data":{"label":"clientes","columns":["nombre"]},"measured":{"width":280,"height":175},"selected":false,"dragging":false},{"id":"6da335cb-5ab2-4f7f-be37-fd75597ebd06","type":"tableNode","position":{"x":378.7049494700827,"y":122.10658183703087},"data":{"label":"productos","columns":["id_cliente (FK)"]},"measured":{"width":280,"height":175},"selected":false,"dragging":false}],"edges":[{"source":"c82fb200-a3ae-46d6-8a3f-28806fcc1fc2","target":"6da335cb-5ab2-4f7f-be37-fd75597ebd06","animated":true,"style":{"stroke":"#22d3ee","strokeWidth":2},"id":"xy-edge__c82fb200-a3ae-46d6-8a3f-28806fcc1fc2-6da335cb-5ab2-4f7f-be37-fd75597ebd06"}]}', true, NULL, '2026-04-20 10:47:07.72437');
INSERT INTO lms_core.intentos VALUES ('f1ba87d5-51af-4113-bed0-b5780297f9ee', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 17, '-- Escribe tu consulta SQL aquí
SELECT a.nombre, e.item 
FROM aventureros a 
INNER JOIN equipamiento e ON a.id_aventurero = e.id_aventurero 
WHERE e.precio > 100;', true, NULL, '2026-04-20 10:50:03.499499');
INSERT INTO lms_core.intentos VALUES ('7dd8cc18-a62c-4cf2-bb08-0fb4dd110cce', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 23, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('5c60ca23-c0a2-441f-935b-0a516e13ab2f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 24, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('5490d600-d351-4aae-a5b5-80c15f514d4e', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 25, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('e3b1e8df-6677-4782-848a-92de2558437d', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 26, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('80fdb4d9-69d1-4f00-8ef2-e2e5f9519367', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 27, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('5a5a8cf1-b70c-4c52-9473-8ef7f0fa33c0', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 28, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('97778403-2d16-4014-8842-307f1ed863a2', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 29, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('1b22c279-c1d1-4352-9a51-d1bc171adfe3', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 30, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('8271730b-8ed2-4b11-8aeb-42d7c69a8703', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 37, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('3a4dc5eb-95c0-4512-bb3d-cc74800cf9a6', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 38, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('ecb1c993-bc03-4643-8250-06d84589b79e', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 39, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('ae0ac657-2a2c-4a68-a470-484e628f0a76', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 40, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('129bbbc9-7d4a-4245-af1b-df7507aca33d', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 41, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('905ff015-f6ae-4b67-98e7-fe22a5dad3b6', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 42, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('1022267d-6bc9-4661-9c87-b10df01c8e4e', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 43, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('377bd174-c070-440f-b918-c9277c6f321f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 44, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('9713e27d-b9f7-47b3-853d-f09ddde9ea09', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 45, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('02afaeb2-3d75-40f6-bb3c-d879c606b964', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 46, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('afdf8557-028b-4afc-985e-a9806e7d5568', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 47, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('1d1e3c4b-434a-4cd7-a321-089a5f92ed38', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('e4badc78-79a1-4476-a8e0-b54c38c0040f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 49, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('8f4f81a6-fc3b-4cab-958c-29c90d07127f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 50, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('f2090802-1919-481b-80e0-c78974f38cc4', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('d27d4385-5ffc-4231-9b38-bb6855b6b557', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 52, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('cbf55257-28c5-4220-aff7-754d7c177e03', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 53, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('e95b1a32-a2ee-42ad-89da-a4041e31123a', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 54, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('c1c8f59c-e07d-44ac-8414-63c2bbf4a928', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 55, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('78d469c8-6163-45bd-98bc-9ef21168bfca', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 56, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('8ffe559a-1383-4b72-ae65-04139c120bdd', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 57, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('bffb690e-6fb2-4691-9cc4-61a346908a71', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 58, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('acbbe497-78d5-46ac-b55e-445e92775c03', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 59, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('eba2e79e-1abd-4f48-9222-4f0fa26cd5de', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 60, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('fec97ef9-bc78-4c1c-b63e-7a036bcdf591', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 61, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('0201e3ac-3bcd-4b31-88c8-c5998cc7c705', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 62, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('de34f859-497c-4d88-b042-84c033b5abf6', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 63, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('4d16f487-02ff-4282-9bf5-37acb646cd83', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 64, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('34e5486d-9593-4003-b2e5-73780d595072', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 65, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('74f73c05-6abd-4b93-bd5e-b6448bb32316', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 66, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('aa8e0300-4d73-40c9-bc4f-b5da8a2dd7d3', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 67, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('5183a3a5-d7f4-4d33-9f48-69f9295ae074', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 68, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('ab98fbd5-8522-462f-89bd-0623a6240f5a', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 69, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('2456da5f-86e8-4cae-a8a1-1aee882926d2', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 70, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('e9329cf6-dca4-4657-ba64-9e34046a9ef9', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 71, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('df6f5932-4cf5-4d0b-9c7f-1330ccd2ba78', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 72, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('c372023d-9a9b-4d75-b9b3-e9198c29a7b4', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 73, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('c93a53bd-e5f5-4f43-8cd0-ae908085e1ba', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 74, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('f52ce4ea-5560-41dd-8d48-9b12477d6206', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 75, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('a169e497-4a01-4b06-adbc-c666434ff484', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 76, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('6fa54ef1-64ed-413b-8b0d-f6669b48ddd8', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 77, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('85a52da8-6560-4b9c-92f3-9d6e8466a5bd', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 78, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('c906ae57-58ca-4614-b6dc-5672abbb5b19', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 79, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('32479258-7ce3-4f9a-b33f-1d9931161e21', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 80, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('b7762b86-8175-44eb-9e02-02dee25d0081', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 81, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('c2d86973-a3ee-4778-af58-e78d9f361487', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 82, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('dfd7cb99-ec26-47ea-8ec3-7897e67e8483', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 83, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('fecbf909-ed2c-4592-a792-99ca5d6d46f4', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 84, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('8101c3e2-dd2a-4524-b385-a3516467f216', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 85, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('adeb7475-3480-4880-9bfb-55ec7ec15e9c', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 86, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('f23fbfd2-5d24-4cb6-a3d0-c9af2c936d94', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 87, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('412a77fc-287b-4c27-886b-a30a7f6c5a08', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 88, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('bb7a2aa4-2f6b-458b-b811-59fa142b5068', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 89, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('e702899a-ffaf-4f5d-86e3-e70fa121f850', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 90, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('9639874b-fd44-4642-9916-09fae3bcf93f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 91, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('6087c45d-3d37-4aaa-8955-0ff5bc565af0', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 92, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('692773e8-309b-405f-a7ca-e007bb60a909', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 93, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('fa2dbd5e-1ff5-4165-ac1c-2f5a72865c36', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 94, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('fe097459-6bda-4db4-928a-8508f8de47be', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 95, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('c4795941-af6f-44d9-ad96-d1e490ecb8ce', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 96, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('64f3eda0-afe4-4911-ae65-eede24fecb32', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 97, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('73099fb5-2fb7-4f21-b08a-c4787b133b45', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 98, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('800d26f6-d11e-462f-9d97-df525707e56b', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 99, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('28afb565-af7d-48c9-820b-fb887b949440', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 100, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('8f1f1e6b-4790-46e1-b128-7fa8fb9646fe', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 101, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('dde6b723-1110-46ec-911a-72e719e5594a', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 102, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('9d28b24a-c472-4201-9e6b-c1a1f5af25fe', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 103, 'Completado por script de prueba', true, NULL, '2026-04-24 07:34:39.463169');
INSERT INTO lms_core.intentos VALUES ('ba5b2bb2-b9f3-43d4-aa85-86db510c15f1', 'd504a92f-4c82-47ee-b9f7-a4be05df3e58', 106, 'SELECT * FROM aventureros
WHERE clase = ''Guerrero'' AND nivel > 20;', true, NULL, '2026-04-25 09:07:18.196608');
INSERT INTO lms_core.intentos VALUES ('b85a429d-0ecc-4e0a-915d-88bda8c8314f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 104, 'SELECT * FROM aventureros ;', true, NULL, '2026-04-25 10:19:00.26783');
INSERT INTO lms_core.intentos VALUES ('cf5ee283-bfc0-4616-9ce0-d666edfec20e', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 105, 'SELECT * FROM aventureros WHERE clase = ''Mago'' ;', true, NULL, '2026-04-25 10:27:17.217484');
INSERT INTO lms_core.intentos VALUES ('b134965d-3b73-494b-90f3-b06d64a66abe', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 104, 'SELECT * FROM aventureros ;', true, NULL, '2026-04-25 14:36:21.347593');
INSERT INTO lms_core.intentos VALUES ('0ad2919f-90f6-47bf-bc0e-9a6d827f580d', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 104, 'SELECT * FROM aventureros ;', true, NULL, '2026-04-25 14:53:18.972013');
INSERT INTO lms_core.intentos VALUES ('0e83780b-dd4a-43ac-8eb9-37457ae3775f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 111, 'SELECT * FROM aventureros where nivel >10;
', true, NULL, '2026-04-25 16:09:36.774192');
INSERT INTO lms_core.intentos VALUES ('ba50ec5e-2d24-4651-ad40-e5087c1f3c88', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 104, 'SELECT * FROM aventureros ;', true, NULL, '2026-04-26 14:59:03.610864');
INSERT INTO lms_core.intentos VALUES ('1f26ed03-2f06-4342-8402-ab07066e9b22', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, 'DELETE FROM aventureros 
WHERE nombre = ''Dan'' 
RETURNING *;', false, NULL, '2026-04-26 16:35:03.991597');
INSERT INTO lms_core.intentos VALUES ('222549a3-1c46-4cc1-b1ae-088c72ae9309', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, 'DELETE FROM aventureros 
WHERE nombre = ''Dan'' 
RETURNING *;', true, NULL, '2026-04-26 16:35:36.518842');
INSERT INTO lms_core.intentos VALUES ('82b8397f-c1b9-444b-9944-404430034bb1', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, 'DELETE FROM aventureros WHERE nombre = ''Dan'' RETURNING *;
', true, NULL, '2026-04-26 16:40:18.253066');
INSERT INTO lms_core.intentos VALUES ('655687e7-90f2-4c60-8549-ae176f94b2ff', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, 'DELETE FROM aventureros WHERE nombre = ''Dan'' RETURNING *;', true, NULL, '2026-04-26 16:41:08.169336');
INSERT INTO lms_core.intentos VALUES ('935ea9d3-4da6-4bbc-838b-76bf481d4a5c', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, '-- Escribe tu consulta SQL aquí
DELETE FROM aventureros WHERE nombre = ''Dan'' RETURNING *;', true, NULL, '2026-04-26 16:42:32.714148');
INSERT INTO lms_core.intentos VALUES ('161a7ca3-10b9-4ab4-b603-b6adc9531449', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, '-- Escribe tu consulta SQL aquí
DELETE FROM aventureros WHERE nombre = ''Dan'' RETURNING*;', true, NULL, '2026-04-26 16:44:40.864304');
INSERT INTO lms_core.intentos VALUES ('c66ce561-921f-4bf5-abf0-88f1335c08bd', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, '-- Escribe tu consulta SQL aquí
DELETE FROM aventureros 
WHERE nombre = ''Dan'' 
RETURNING *;', true, NULL, '2026-04-26 16:46:09.187517');
INSERT INTO lms_core.intentos VALUES ('acdd0090-f2ba-4731-a62a-9e23283ef2e5', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, '-- Escribe tu consulta SQL aquí
DELETE FROM aventureros 
WHERE nombre = ''Dan'' 
RETURNING *;
', true, NULL, '2026-04-26 16:48:06.480252');
INSERT INTO lms_core.intentos VALUES ('cafefd95-0fb2-4f19-973a-b27bd4a9659d', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, '-- Escribe tu consulta SQL aquí
truncate table aventureros;

', true, NULL, '2026-04-26 16:49:01.030273');
INSERT INTO lms_core.intentos VALUES ('57646ef2-c7ef-411c-b1b8-b9fcf6672565', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 104, 'SELECT * FROM aventureros ;', true, NULL, '2026-04-26 16:56:48.295215');
INSERT INTO lms_core.intentos VALUES ('320e274a-8176-4cf4-87da-753863de7f07', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, 'TRUNCATE TABLE aventureros;', true, NULL, '2026-04-26 16:59:13.044984');
INSERT INTO lms_core.intentos VALUES ('a0d4369c-478e-418c-a97d-1eb681d2998e', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 11, '-- Escribe tu consulta SQL aquí
TRUNCATE TABLE aventureros;
', true, NULL, '2026-04-26 17:01:36.95638');
INSERT INTO lms_core.intentos VALUES ('7cd69eef-116d-4b75-b9a3-c80177279e31', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 67, '-- Escribe tu consulta SQL aquí
SELECT * FROM aventureros 
WHERE nombre LIKE ''_L%'';', false, NULL, '2026-04-26 20:03:21.356152');
INSERT INTO lms_core.intentos VALUES ('d440bcae-19b5-4700-ae7f-04be5f0289fb', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, '-- Escribe tu consulta SQL aquí
SELECT nextval(''aventureros_id_aventurero_seq'');', false, NULL, '2026-04-27 02:26:06.874731');
INSERT INTO lms_core.intentos VALUES ('bfdd562a-1aaf-4d58-b529-409ef7700b3a', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, '-- Escribe tu consulta SQL aquí
INSERT INTO aventureros (nombre) 
VALUES (''Zoe'');', false, NULL, '2026-04-27 02:27:29.426432');
INSERT INTO lms_core.intentos VALUES ('f4b0a581-9473-44e2-9cbc-53e0a8ef8967', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, 'SELECT nextval(''aventureros_id_aventurero_seq'');', false, NULL, '2026-04-27 02:29:01.863095');
INSERT INTO lms_core.intentos VALUES ('5871ebac-eefd-4dcd-95d1-a39fbfbc1872', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, 'SELECT nextval(''aventureros_id_aventurero_seq'');', false, NULL, '2026-04-27 02:33:53.835824');
INSERT INTO lms_core.intentos VALUES ('8a4ecfe5-03e4-4c8e-b3e1-faca474a1b78', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, '-- Escribe tu consulta SQL aquí
SELECT nextval(''aventureros_id_aventurero_seq'');', true, NULL, '2026-04-27 02:52:03.373711');
INSERT INTO lms_core.intentos VALUES ('66765a91-d6a9-4f7d-a3d7-2f2487e09ced', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 43, 'CREATE TABLE mascotas (
id serial primary key,
nombre VARCHAR(50) not null,

nivel integer default 1

);', true, NULL, '2026-04-27 06:36:34.41101');
INSERT INTO lms_core.intentos VALUES ('3d053cbe-e5c6-4838-a82a-5c2f57d40362', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 44, 'ALTER TABLE aventureros DROP CONSTRAINT aventureros_pkey;', true, NULL, '2026-04-27 06:46:50.711828');
INSERT INTO lms_core.intentos VALUES ('1b29bc64-7a4e-4287-ab99-35c141593b48', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 44, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros DROP CONSTRAINT aventureros_pkey;
', false, NULL, '2026-04-27 06:48:24.706556');
INSERT INTO lms_core.intentos VALUES ('cad74c19-b6bb-4e80-8d3c-262a678dcfae', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 44, 'ALTER TABLE aventureros DROP CONSTRAINT aventureros_pkey;', true, NULL, '2026-04-27 06:48:51.455304');
INSERT INTO lms_core.intentos VALUES ('cd4284d7-cb90-4d13-8a04-ef77a86d10d2', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 44, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros DROP CONSTRAINT aventureros_pkey;', false, NULL, '2026-04-27 06:53:15.1493');
INSERT INTO lms_core.intentos VALUES ('bf06f32e-e83c-43e2-b069-d07f78976a8d', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 44, 'ALTER TABLE aventureros DROP CONSTRAINT aventureros_pkey;', true, NULL, '2026-04-27 06:53:49.879886');
INSERT INTO lms_core.intentos VALUES ('3f63a2be-65bd-4da8-bec8-b7aec5dd23fc', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 43, 'CREATE TABLE mascotas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  nivel integer default 1
);', true, NULL, '2026-04-27 07:10:53.587769');
INSERT INTO lms_core.intentos VALUES ('565d7f13-3648-4aab-b3f5-2afe933e39a7', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 43, 'CREATE TABLE aventureros (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL
);', false, NULL, '2026-04-27 07:11:30.664891');
INSERT INTO lms_core.intentos VALUES ('2d8b1389-13b9-4b3e-8982-01628bed3676', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 43, 'CREATE TABLE mascotas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  nivel integer default 1
);', true, NULL, '2026-04-27 07:12:45.105909');
INSERT INTO lms_core.intentos VALUES ('dc118035-58f4-4355-a517-8bbc4f8200ed', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 45, '-- Escribe tu consulta SQL aquí
INSERT INTO aventureros (nombre, clase) VALUES (''Dagon'', ''Mago'');', false, NULL, '2026-04-27 07:18:10.13553');
INSERT INTO lms_core.intentos VALUES ('ef004c46-6171-4d2a-8b1f-afb4fec5c2ea', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 45, 'INSERT INTO aventureros (nombre, clase) VALUES (''Nuevo'', ''Guerrero'');', false, NULL, '2026-04-27 07:21:25.675309');
INSERT INTO lms_core.intentos VALUES ('943efb7a-32f1-4f06-8c35-9e300fc20041', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 45, '-- Escribe tu consulta SQL aquí
INSERT INTO aventureros (nombre, clase) VALUES (''Nuevo'', ''Guerrero'');', true, NULL, '2026-04-27 07:27:40.843915');
INSERT INTO lms_core.intentos VALUES ('6d299442-15a6-4b24-b43d-6dbbd8225422', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 45, 'INSERT INTO aventureros (nombre, clase) VALUES (''Nuevo'', ''Guerrero'');', true, NULL, '2026-04-27 07:27:55.470319');
INSERT INTO lms_core.intentos VALUES ('2ae71c01-07a2-434e-96ba-82c356741358', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 45, 'INSERT INTO aventureros (nombre, clase) VALUES (''Nuevo'', ''Guerrero'');', true, NULL, '2026-04-27 07:28:17.972903');
INSERT INTO lms_core.intentos VALUES ('5aef909c-8890-44fe-9260-79fc7fd20e72', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 45, 'INSERT INTO aventureros (nombre, clase) VALUES (''Nuevo'', ''Guerrero'');', true, NULL, '2026-04-27 07:28:29.446372');
INSERT INTO lms_core.intentos VALUES ('0885885e-d9c0-42e0-ab6d-0fceff0cc57e', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 46, '-- Escribe tu consulta SQL aquí
SELECT * FROM aventureros WHERE nombre IS NOT NULL;', true, NULL, '2026-04-27 07:33:18.794019');
INSERT INTO lms_core.intentos VALUES ('932ba61b-8761-41de-a5d4-550433822537', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 98, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD CHECK (nivel > 0);', false, NULL, '2026-04-27 07:39:21.786853');
INSERT INTO lms_core.intentos VALUES ('325909ad-b69f-4ee3-b33b-58ea7112f826', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 98, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD CHECK (nivel > 0);', true, NULL, '2026-04-27 07:44:14.709564');
INSERT INTO lms_core.intentos VALUES ('ce7af648-d2ec-49e6-be67-1f904e8504c5', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 99, '-- Escribe tu consulta SQL aquí
SELECT nombre, COUNT(*) FROM aventureros GROUP BY nombre HAVING COUNT(*) > 1;', true, NULL, '2026-04-27 07:45:35.59541');
INSERT INTO lms_core.intentos VALUES ('089c3832-dbbd-4c2d-8903-6b954fbba328', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 99, '-- Escribe tu consulta SQL aquí
SELECT nombre, COUNT(*) FROM aventureros GROUP BY nombre HAVING COUNT(*) > 1;', true, NULL, '2026-04-27 07:48:21.53763');
INSERT INTO lms_core.intentos VALUES ('f22ca9be-56c0-4398-b69a-ca7df62aa73c', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 43, 'CREATE TABLE mascotas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL, nivel INTEGER DEFAULT 1
);', true, NULL, '2026-04-27 15:05:46.47723');
INSERT INTO lms_core.intentos VALUES ('ef68a83d-7ed4-4817-95ca-a477e32f6b1c', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 45, 'INSERT INTO aventureros (nombre , clase) VALUES (''Nuevo'' , ''Guerrero'');', true, NULL, '2026-04-27 15:10:47.04292');
INSERT INTO lms_core.intentos VALUES ('57a1d3bf-9e06-4ba9-8975-9115e8bdf536', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 47, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD UNIQUE (nombre);', false, NULL, '2026-04-27 17:43:37.583582');
INSERT INTO lms_core.intentos VALUES ('fa12ed24-95af-4376-ba58-2c8e56b1f428', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 47, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nombre_unique UNIQUE (nombre); ', true, NULL, '2026-04-27 17:50:30.386153');
INSERT INTO lms_core.intentos VALUES ('2edd2933-9b84-4b28-b0e8-972e7386e6ab', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);  ', false, NULL, '2026-04-27 17:53:12.95568');
INSERT INTO lms_core.intentos VALUES ('9ebb8f0e-7850-4f95-aa67-118979db5a10', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);', false, NULL, '2026-04-27 17:53:19.491305');
INSERT INTO lms_core.intentos VALUES ('31e7aba2-41b6-4020-b5dd-62b003f5da79', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);  ', true, NULL, '2026-04-27 17:53:36.953947');
INSERT INTO lms_core.intentos VALUES ('6c556d07-3e85-464d-ba29-8c287f6d899c', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);  ', true, NULL, '2026-04-27 17:54:19.603393');
INSERT INTO lms_core.intentos VALUES ('302f5b9a-8779-43e1-b207-27334e20f1b6', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);  ', false, NULL, '2026-04-27 17:54:28.004174');
INSERT INTO lms_core.intentos VALUES ('8abda9e8-3cbd-48eb-b077-1d00fe6aa11f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);', true, NULL, '2026-04-27 17:56:34.265854');
INSERT INTO lms_core.intentos VALUES ('35d5b501-4ac8-41b6-8730-1278517a37bf', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);', false, NULL, '2026-04-27 18:38:06.852308');
INSERT INTO lms_core.intentos VALUES ('a95fc8f8-06b6-45bb-951e-dbf03995531f', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99);', true, NULL, '2026-04-27 18:38:18.873559');
INSERT INTO lms_core.intentos VALUES ('a5fdfccb-1a15-440f-b2df-06c2f3fb1d4d', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 47, '-- Escribe tu consulta SQL aquí
 ALTER TABLE aventureros ADD CONSTRAINT aventureros_nombre_unique UNIQUE (nombre);', false, NULL, '2026-04-27 18:39:24.662657');
INSERT INTO lms_core.intentos VALUES ('6b5d38cf-8480-4a5d-bb9c-4bc4e0f46d18', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 47, ' ALTER TABLE aventureros ADD CONSTRAINT aventureros_nombre_unique UNIQUE (nombre);', true, NULL, '2026-04-27 18:39:35.24844');
INSERT INTO lms_core.intentos VALUES ('8727f839-1737-42d2-94f2-434efdb038f5', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 49, '-- Escribe tu consulta SQL aquí
ALTER TABLE equipamiento ADD CONSTRAINT equipamiento_precio_check CHECK (precio > 0); ', false, NULL, '2026-04-27 18:42:28.02727');
INSERT INTO lms_core.intentos VALUES ('9fa8e4f2-2570-49a3-83c3-da63e9dfeb3d', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 49, 'ALTER TABLE equipamiento ADD CONSTRAINT equipamiento_precio_check CHECK (precio > 0); ', true, NULL, '2026-04-27 18:42:36.953084');
INSERT INTO lms_core.intentos VALUES ('4edeafb2-ee8b-4ece-bc71-6276fa184185', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 47, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nombre_unique UNIQUE (nombre);', true, NULL, '2026-04-27 18:48:24.916115');
INSERT INTO lms_core.intentos VALUES ('1d81d973-016e-4a55-a2d5-c439ccd36fc6', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99); 
', true, NULL, '2026-04-27 18:49:03.063791');
INSERT INTO lms_core.intentos VALUES ('f3d6f852-f8f0-4007-b53c-0b470ea1da84', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 49, '-- Escribe tu consulta SQL aquí
ALTER TABLE equipamiento ADD CONSTRAINT equipamiento_precio_check CHECK (precio > 0);     ', false, NULL, '2026-04-27 18:49:19.650183');
INSERT INTO lms_core.intentos VALUES ('f802d4b4-c24e-4b71-8573-041d94932649', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 49, 'ALTER TABLE equipamiento ADD CONSTRAINT equipamiento_precio_check CHECK (precio > 0);     ', true, NULL, '2026-04-27 18:49:31.849835');
INSERT INTO lms_core.intentos VALUES ('c15a88e0-706e-47ec-b3d6-f738c091237e', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 50, 'INSERT INTO habitaciones (numero, tipo) VALUES (999, ''Especial'') RETURNING *;', false, NULL, '2026-04-27 18:51:37.204473');
INSERT INTO lms_core.intentos VALUES ('9d99898b-b67e-455e-a8d3-77cce09bb498', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 50, 'INSERT INTO habitaciones (numero, tipo) VALUES (999, ''Especial'');', false, NULL, '2026-04-27 18:52:18.3992');
INSERT INTO lms_core.intentos VALUES ('69b23081-1ab5-42a9-bed5-2cf555f917c2', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 50, '-- Escribe tu consulta SQL aquí
INSERT INTO habitaciones (numero, tipo) VALUES (999, ''Especial'') RETURNING *;', true, NULL, '2026-04-27 18:54:38.410226');
INSERT INTO lms_core.intentos VALUES ('a105a50a-f303-4f9a-9135-c199aa833065', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 100, '-- Escribe tu consulta SQL aquí
INSERT INTO reservas (id_huesped, id_habitacion) VALUES (1, 1) RETURNING *;', true, NULL, '2026-04-27 18:58:51.159796');
INSERT INTO lms_core.intentos VALUES ('bd70a285-67f3-409a-8d35-9226659e296d', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, '-- Escribe tu consulta SQL aquí
CREATE SEQUENCE aventureros_id_aventurero_seq START 1;', true, NULL, '2026-04-27 19:08:33.916541');
INSERT INTO lms_core.intentos VALUES ('7277bd63-cecd-4b8a-94ce-a64727cd7392', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, 'SELECT nextval(''aventureros_id_aventurero_seq'');', true, NULL, '2026-04-27 19:08:49.615769');
INSERT INTO lms_core.intentos VALUES ('93c36bd0-7852-4d6e-8ab0-74476f2074f9', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, '-- Escribe tu consulta SQL aquí
SELECT nextval(''aventureros_id_aventurero_seq'');', true, NULL, '2026-04-27 19:08:58.333471');
INSERT INTO lms_core.intentos VALUES ('5c506f56-f1b1-43e4-a27d-84974f956656', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 104, 'SELECT * FROM aventureros ;', true, NULL, '2026-04-27 19:16:08.455481');
INSERT INTO lms_core.intentos VALUES ('30299622-9cba-4a7a-9363-68f6705a3c60', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, '-- Escribe tu consulta SQL aquí
SELECT nextval(''aventureros_id_aventurero_seq'');', true, NULL, '2026-04-27 19:24:56.833998');
INSERT INTO lms_core.intentos VALUES ('c205fac4-0cc5-4c50-a76c-8e00822b8f62', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 51, '-- Escribe tu consulta SQL aquí
SELECT nextval(''aventureros_id_aventurero_seq'');', true, NULL, '2026-04-27 19:29:26.02385');
INSERT INTO lms_core.intentos VALUES ('6b0e7641-5814-4304-9b81-f0d29037c2c2', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 104, 'SELECT * FROM aventureros ;', true, NULL, '2026-04-27 19:58:12.223261');
INSERT INTO lms_core.intentos VALUES ('d3deb146-b943-43b8-92cb-00a1d55ff301', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99); ', false, NULL, '2026-04-27 20:52:49.410667');
INSERT INTO lms_core.intentos VALUES ('f17d9d2d-99fb-461f-a8c2-3ebac5844243', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 48, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nivel_check CHECK (nivel >= 1 AND nivel <= 99); ', true, NULL, '2026-04-27 20:53:00.30228');
INSERT INTO lms_core.intentos VALUES ('5096c549-57a0-4c1f-b6c6-0d596fca60bc', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 47, '-- Escribe tu consulta SQL aquí
ALTER TABLE aventureros ADD CONSTRAINT aventureros_nombre_unique UNIQUE (nombre);', false, NULL, '2026-04-27 20:53:23.954525');
INSERT INTO lms_core.intentos VALUES ('c82fcac8-80cd-4a2c-8060-e714e308aedc', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 47, 'ALTER TABLE aventureros ADD CONSTRAINT aventureros_nombre_unique UNIQUE (nombre);', true, NULL, '2026-04-27 20:53:32.676966');
INSERT INTO lms_core.intentos VALUES ('c6ad80e5-1c21-4d1e-a031-b185dd9b2c38', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 52, '-- Escribe tu consulta SQL aquí
SELECT nextval(''aventureros_id_aventurero_seq'');', true, NULL, '2026-04-27 22:09:32.313413');
INSERT INTO lms_core.intentos VALUES ('98052e79-861e-47ec-9d28-9c3bfb90fca5', 'e1eeb361-e273-48f4-8558-97a61cbd1892', 42, '-- Escribe tu consulta SQL aquí
SELECT h.nombre, hab.numero FROM huespedes h JOIN reservas r ON h.id = r.id_huesped JOIN habitaciones hab ON r.id_habitacion = hab.id;', true, NULL, '2026-04-28 06:16:00.879094');
INSERT INTO lms_core.intentos VALUES ('bdeb9ae8-ddb2-4238-a9e7-0f29d2a6aabb', '269ed901-dd07-403b-80ae-e353a45d7bd4', 12, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('ae897f78-a898-4881-b713-22908f5e015d', '269ed901-dd07-403b-80ae-e353a45d7bd4', 13, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('3b5d640f-73a5-4c1e-bc50-d36bbd617e62', '269ed901-dd07-403b-80ae-e353a45d7bd4', 14, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('9dd567ad-4a37-4c9f-b394-eae7539ddecf', '269ed901-dd07-403b-80ae-e353a45d7bd4', 15, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('23b8220a-5841-4be5-ac0d-23e30e5dc82e', '269ed901-dd07-403b-80ae-e353a45d7bd4', 16, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('d39f6a34-fc92-43c6-937b-5b3150bb2e69', '269ed901-dd07-403b-80ae-e353a45d7bd4', 17, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('2e1cff8c-e028-42f3-9016-c69257548e63', '269ed901-dd07-403b-80ae-e353a45d7bd4', 10, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('12c1cef9-735a-47e4-b134-624fd17f9462', '269ed901-dd07-403b-80ae-e353a45d7bd4', 11, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('ada6b958-7fa6-45f5-8676-8effe5696ceb', '269ed901-dd07-403b-80ae-e353a45d7bd4', 23, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('fdb1dada-0b1b-42a9-beb4-cd49b0269509', '269ed901-dd07-403b-80ae-e353a45d7bd4', 24, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('e6c71e13-af51-4f85-b9e7-e00a526b5bed', '269ed901-dd07-403b-80ae-e353a45d7bd4', 25, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('2dc6ff46-ca64-4f2e-ae50-3469adaa03a5', '269ed901-dd07-403b-80ae-e353a45d7bd4', 26, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('5927b8f0-3ce0-4301-aa25-83e7a4cc3bc1', '269ed901-dd07-403b-80ae-e353a45d7bd4', 27, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('64c4407f-2151-4781-8352-9ed58b5f2107', '269ed901-dd07-403b-80ae-e353a45d7bd4', 28, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('70874be8-fde1-4d6c-a60e-f48ec34e18c7', '269ed901-dd07-403b-80ae-e353a45d7bd4', 29, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('46c17553-2278-4ce1-a8b3-854a6738271b', '269ed901-dd07-403b-80ae-e353a45d7bd4', 104, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('ede8a2db-c8ed-43a2-8b8c-0f88a4b38171', '269ed901-dd07-403b-80ae-e353a45d7bd4', 30, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('b4efadd4-262e-496a-95ec-1c9beae82269', '269ed901-dd07-403b-80ae-e353a45d7bd4', 37, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('2bf6c7a4-db61-4ec1-85b0-e6a3c0bd6ff8', '269ed901-dd07-403b-80ae-e353a45d7bd4', 38, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('be5075d8-6662-49b3-ad38-bde6dd47e1dc', '269ed901-dd07-403b-80ae-e353a45d7bd4', 39, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('8351bbc0-f091-4f98-8454-c2231b96e8ba', '269ed901-dd07-403b-80ae-e353a45d7bd4', 40, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('1575d02b-05b5-4aa1-905d-5c4e7e44fd6c', '269ed901-dd07-403b-80ae-e353a45d7bd4', 41, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('b38b932e-ea7d-43a1-aa53-73e13f89cf94', '269ed901-dd07-403b-80ae-e353a45d7bd4', 42, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('37ec936a-a6c0-4287-a864-653b360a1f7a', '269ed901-dd07-403b-80ae-e353a45d7bd4', 9, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('a617057a-b26d-44c0-8ae4-45b36373a679', '269ed901-dd07-403b-80ae-e353a45d7bd4', 111, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('6ed1cad7-541e-43aa-b00d-e6f92278f9e2', '269ed901-dd07-403b-80ae-e353a45d7bd4', 112, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('b359ec87-5cf4-4ad1-a92a-e9fcf8d2e666', '269ed901-dd07-403b-80ae-e353a45d7bd4', 113, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('03bc54da-f101-4f42-aacf-353ccea6dc5f', '269ed901-dd07-403b-80ae-e353a45d7bd4', 107, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('a25198d5-0183-4968-afa9-9e6479902a67', '269ed901-dd07-403b-80ae-e353a45d7bd4', 108, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('880b0da6-0729-49a2-9c7a-73f54b749809', '269ed901-dd07-403b-80ae-e353a45d7bd4', 105, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('87865634-37b9-4c51-a9af-b1ff36e2cc29', '269ed901-dd07-403b-80ae-e353a45d7bd4', 106, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('cbc7c1f9-65d0-4992-aff1-a3af3c04a883', '269ed901-dd07-403b-80ae-e353a45d7bd4', 109, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('210a7861-d73d-4170-8d4c-30077cf3f803', '269ed901-dd07-403b-80ae-e353a45d7bd4', 110, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('4c0caaf2-f5a9-440f-ba56-c470deac9a47', '269ed901-dd07-403b-80ae-e353a45d7bd4', 52, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('2c078c76-327b-4fa0-b540-4fbfa46e7ba8', '269ed901-dd07-403b-80ae-e353a45d7bd4', 53, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('c7b09edd-13b8-49cc-89c4-b3bd4449ed75', '269ed901-dd07-403b-80ae-e353a45d7bd4', 54, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('02231062-dae7-4c47-9332-15e6dde91250', '269ed901-dd07-403b-80ae-e353a45d7bd4', 45, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('1e721800-c47e-4762-8fa6-91591207bdb3', '269ed901-dd07-403b-80ae-e353a45d7bd4', 46, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('9193a7d0-976b-4c18-9d41-1f32feff0ffd', '269ed901-dd07-403b-80ae-e353a45d7bd4', 51, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('4e6691d0-3fe6-49d2-b2b0-d403f63cfa1c', '269ed901-dd07-403b-80ae-e353a45d7bd4', 43, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('a9db65f3-b5e3-4de5-8de0-433f9789e9a6', '269ed901-dd07-403b-80ae-e353a45d7bd4', 44, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('8dfa251d-eeb2-413a-b7fa-eeab62de965d', '269ed901-dd07-403b-80ae-e353a45d7bd4', 47, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('1931419a-8b7c-4e68-a554-56e17534b385', '269ed901-dd07-403b-80ae-e353a45d7bd4', 48, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('b1fe932e-5384-43fb-aa00-1d6e09e665e1', '269ed901-dd07-403b-80ae-e353a45d7bd4', 49, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('f1a406d2-d7cf-4ab9-a524-2a96736a5c35', '269ed901-dd07-403b-80ae-e353a45d7bd4', 55, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('7b8fb492-6841-45ea-88de-6aa111b3cfa2', '269ed901-dd07-403b-80ae-e353a45d7bd4', 56, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('f4896785-91c6-49e0-99f4-4e0d49fa9371', '269ed901-dd07-403b-80ae-e353a45d7bd4', 57, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('739c89d1-4302-4694-8851-4c6adadb1a5d', '269ed901-dd07-403b-80ae-e353a45d7bd4', 58, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('33e95db9-db10-49c3-8f27-830bfe301299', '269ed901-dd07-403b-80ae-e353a45d7bd4', 59, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('41c2b8dd-f6ce-453f-9220-225dcc181fef', '269ed901-dd07-403b-80ae-e353a45d7bd4', 60, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('ef15e05f-ef09-431a-95a6-1700e49fd37d', '269ed901-dd07-403b-80ae-e353a45d7bd4', 61, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('5721f6c2-fda0-4d84-810d-41d5bd0be66b', '269ed901-dd07-403b-80ae-e353a45d7bd4', 62, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('2d8322f7-316b-4345-8e80-73965f1211ff', '269ed901-dd07-403b-80ae-e353a45d7bd4', 63, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('aba53eab-44ea-4b8f-80b3-c5f7fd7e3012', '269ed901-dd07-403b-80ae-e353a45d7bd4', 64, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('263dca78-b70b-4907-9691-f491ee60859a', '269ed901-dd07-403b-80ae-e353a45d7bd4', 65, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('4baf9a97-6ee7-4d95-a5b2-ac26c34b771c', '269ed901-dd07-403b-80ae-e353a45d7bd4', 66, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('39f9f9f4-e2c6-4dde-8c42-a6563f9d14cd', '269ed901-dd07-403b-80ae-e353a45d7bd4', 67, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('c6f5fe9d-9b54-43cb-accb-96c461b0c4a3', '269ed901-dd07-403b-80ae-e353a45d7bd4', 68, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('e2737d8f-8153-44ed-a70b-0e890331eafc', '269ed901-dd07-403b-80ae-e353a45d7bd4', 69, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('423f3552-3d71-4070-b9e5-729e7d6a1af7', '269ed901-dd07-403b-80ae-e353a45d7bd4', 50, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('f1b3b7b9-5f78-4467-bbc5-78137fc58fd1', '269ed901-dd07-403b-80ae-e353a45d7bd4', 70, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('3e2d63b4-74e5-48ba-8208-8cd5261a6cde', '269ed901-dd07-403b-80ae-e353a45d7bd4', 71, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('20f13925-c35b-497a-94f4-9312d3c91ee9', '269ed901-dd07-403b-80ae-e353a45d7bd4', 72, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('589491a6-1b08-4430-ac3a-2c4d405e62e0', '269ed901-dd07-403b-80ae-e353a45d7bd4', 73, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('2731f8be-f355-4dad-bd30-5c2387184c9e', '269ed901-dd07-403b-80ae-e353a45d7bd4', 74, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('49a4ae25-0ae5-4540-9fde-21211f17a5f6', '269ed901-dd07-403b-80ae-e353a45d7bd4', 75, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('152807c2-9420-42f3-bd07-a1d86b7466f2', '269ed901-dd07-403b-80ae-e353a45d7bd4', 76, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('74b001a8-222a-458e-9bfc-a7ba7734d8e6', '269ed901-dd07-403b-80ae-e353a45d7bd4', 77, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('2bb42ebf-9874-4f4a-a3c0-9e6764d97558', '269ed901-dd07-403b-80ae-e353a45d7bd4', 78, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('c3a4fe86-01f4-470c-bd62-80ecb7f2eb6c', '269ed901-dd07-403b-80ae-e353a45d7bd4', 79, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('95701558-ff8d-405b-b317-0b707a5ac610', '269ed901-dd07-403b-80ae-e353a45d7bd4', 80, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('489e568d-78a2-41b7-880b-22e61f41c8ac', '269ed901-dd07-403b-80ae-e353a45d7bd4', 81, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('62fd2525-c6ff-4d70-9e30-a16f92870032', '269ed901-dd07-403b-80ae-e353a45d7bd4', 82, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('0917e8c6-a69f-422e-8f85-345766606e2f', '269ed901-dd07-403b-80ae-e353a45d7bd4', 83, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('4701d680-6ad6-4c71-9a92-35feae25f003', '269ed901-dd07-403b-80ae-e353a45d7bd4', 84, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('6e91308f-565d-46c0-8db0-012538a73482', '269ed901-dd07-403b-80ae-e353a45d7bd4', 85, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('c7485e22-2076-45ce-817d-e66873a361d1', '269ed901-dd07-403b-80ae-e353a45d7bd4', 86, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('caf03b92-c5af-419b-aebc-a2cf56dbfd01', '269ed901-dd07-403b-80ae-e353a45d7bd4', 87, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('2704f20c-89c5-4a23-b28d-ec7002c14638', '269ed901-dd07-403b-80ae-e353a45d7bd4', 88, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('59069e94-cefc-4702-b4fe-cfd476b13abc', '269ed901-dd07-403b-80ae-e353a45d7bd4', 89, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('e22b7a98-1dab-4fda-b08e-c1cc7b991d81', '269ed901-dd07-403b-80ae-e353a45d7bd4', 90, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('fe69fc02-bc34-4957-9272-4f0b29e0fb97', '269ed901-dd07-403b-80ae-e353a45d7bd4', 91, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('d3cec402-dbf0-43a0-9686-c57011e5a734', '269ed901-dd07-403b-80ae-e353a45d7bd4', 92, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('b79da1e2-bb8b-4d01-8883-492a3561de95', '269ed901-dd07-403b-80ae-e353a45d7bd4', 93, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('6e8e21ae-7067-4de5-89c3-c0c15b8e2b95', '269ed901-dd07-403b-80ae-e353a45d7bd4', 94, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('acd8a057-16aa-4d3c-a44a-b9f4c0184ee8', '269ed901-dd07-403b-80ae-e353a45d7bd4', 95, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('7d49b45c-5421-4333-ad3e-95d07edc10ee', '269ed901-dd07-403b-80ae-e353a45d7bd4', 96, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('e0f1dd36-d118-45f0-8b69-49e5ebe3f0db', '269ed901-dd07-403b-80ae-e353a45d7bd4', 97, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('af463916-e43e-40f9-afec-187ad0ca1d97', '269ed901-dd07-403b-80ae-e353a45d7bd4', 101, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('65876b63-3cd0-4e57-bffc-07dee40acf46', '269ed901-dd07-403b-80ae-e353a45d7bd4', 102, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('b6e98765-4802-42ac-afc2-11b3852b8ddf', '269ed901-dd07-403b-80ae-e353a45d7bd4', 103, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('89d1f938-e118-4c2b-a9f5-7d3f00c57e4a', '269ed901-dd07-403b-80ae-e353a45d7bd4', 98, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('d2af239e-7de8-45fe-8aaf-951b8428a5e3', '269ed901-dd07-403b-80ae-e353a45d7bd4', 99, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('a42da19d-6fbb-4654-83b4-a8be7d2ac4a6', '269ed901-dd07-403b-80ae-e353a45d7bd4', 100, '-- Resuelto automáticamente por comando VIP', true, NULL, '2026-04-28 06:26:55.420377');
INSERT INTO lms_core.intentos VALUES ('082ebdfc-4250-4dfc-8483-fed3a2157ec7', '269ed901-dd07-403b-80ae-e353a45d7bd4', 83, '-- Escribe tu consulta SQL aquí
 SELECT * FROM aventureros WHERE id_aventurero = 1 FOR UPDATE;
', true, NULL, '2026-04-28 07:11:55.74801');
INSERT INTO lms_core.intentos VALUES ('4e7f8475-cea5-46d4-b2fe-ee5841b95d5f', '269ed901-dd07-403b-80ae-e353a45d7bd4', 83, '-- Escribe tu consulta SQL aquí
 SELECT * FROM aventureros WHERE id_aventurero = 1 FOR UPDATE;
', true, NULL, '2026-04-28 07:12:53.720088');
INSERT INTO lms_core.intentos VALUES ('b96db8b3-d31c-467d-a599-632e333c9f48', '269ed901-dd07-403b-80ae-e353a45d7bd4', 83, '-- Escribe tu consulta SQL aquí
SELECT * FROM aventureros WHERE id_aventurero = 1 FOR UPDATE NOWAIT;', true, NULL, '2026-04-28 07:13:57.249378');


--
-- Data for Name: modulos; Type: TABLE DATA; Schema: lms_core; Owner: -
--

INSERT INTO lms_core.modulos VALUES (2, 2, 'Módulo 2: Manipulación de Datos', 2, 'El CRUD: El poder (y peligro) de INSERT, UPDATE y DELETE.', 80);
INSERT INTO lms_core.modulos VALUES (3, 2, 'Módulo 3: El Arquitecto y los Vínculos', 3, 'Diseño y Relaciones: Teoría MER, DDL, Llaves Primarias/Foráneas y JOINs.', 180);
INSERT INTO lms_core.modulos VALUES (4, 2, 'Módulo 4: La Prueba de Dagon', 4, 'Reto Final: Diseña, Construye, Puebla y Consulta un negocio desde cero.', 300);
INSERT INTO lms_core.modulos VALUES (5, 1, 'Módulo 5: Los Sellos Sagrados', 1, 'Constraints y Secuencias: Domina las reglas que mantienen la integridad de tus datos.', 0);
INSERT INTO lms_core.modulos VALUES (6, 1, 'Módulo 6: Sellos de Validación', 2, 'UNIQUE, CHECK y DEFAULT: Validación de reglas de negocio.', 50);
INSERT INTO lms_core.modulos VALUES (7, 1, 'Módulo 7: El Generador de IDs', 3, 'SERIAL, BIGSERIAL y Secuencias: IDs automáticos.', 100);
INSERT INTO lms_core.modulos VALUES (8, 1, 'Módulo 8: Los Filtros de Precisión', 4, 'BETWEEN, IN, IS NULL: Filtros avanzados.', 150);
INSERT INTO lms_core.modulos VALUES (9, 1, 'Módulo 9: Las Ventanas Mágicas', 5, 'Vistas: Atajos que muestran datos sin cambiar la fuente.', 200);
INSERT INTO lms_core.modulos VALUES (10, 1, 'Módulo 10: Los Planos del Gremio', 6, 'information_schema: Consultar metadatos.', 250);
INSERT INTO lms_core.modulos VALUES (11, 1, 'Módulo 11: Patrones de Búsqueda', 7, 'LIKE, SIMILAR TO: Búsquedas con expresiones regulares.', 300);
INSERT INTO lms_core.modulos VALUES (12, 1, 'Módulo 12: Los Hechizos Automáticos', 8, 'Funciones: Código reutilizable que devuelve resultados.', 350);
INSERT INTO lms_core.modulos VALUES (13, 1, 'Módulo 13: Rituales Programados', 9, 'Procedures: Bloques de código que ejecutan múltiples acciones.', 400);
INSERT INTO lms_core.modulos VALUES (14, 1, 'Módulo 14: Los Gatillos Mágicos', 10, 'Triggers: Código que se ejecuta automáticamente.', 450);
INSERT INTO lms_core.modulos VALUES (15, 1, 'Módulo 15: Viaje Temporal', 11, 'BEGIN, COMMIT, ROLLBACK: Control de transacciones.', 500);
INSERT INTO lms_core.modulos VALUES (16, 1, 'Módulo 16: Cerrojos de Filas', 12, 'FOR UPDATE, LOCK: Bloqueo pesimista.', 550);
INSERT INTO lms_core.modulos VALUES (17, 1, 'Módulo 17: Álgebra Relacional', 13, 'UNION, INTERSECT, EXCEPT: Operaciones de conjuntos.', 600);
INSERT INTO lms_core.modulos VALUES (18, 1, 'Módulo 18: Roles del Gremio', 14, 'CREATE ROLE, GRANT, REVOKE: Control de acceso.', 650);
INSERT INTO lms_core.modulos VALUES (19, 1, 'Módulo 19: Seguridad a Nivel de Fila', 15, 'Row Level Security: Cada usuario ve solo sus datos.', 700);
INSERT INTO lms_core.modulos VALUES (20, 1, 'Módulo 20: Proyecto Final', 16, 'Integración de todo lo aprendido.', 800);
INSERT INTO lms_core.modulos VALUES (1, 2, 'Módulo 1: Teoría de Conjuntos', 1, 'Aprende a pensar en SQL como matemático: Conjuntos, intersecciones y uniones', 0);


--
-- Data for Name: roles; Type: TABLE DATA; Schema: lms_core; Owner: -
--



--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: lms_core; Owner: -
--

INSERT INTO lms_core.usuarios VALUES ('2cbbf24f-d178-474d-80ae-c90ac3aad008', 'Aldo', 'aldo@dagon.com', 'miPasswordSuperSecreta', NULL, true, '2026-03-09 15:18:38.116732', 0, NULL, 0);
INSERT INTO lms_core.usuarios VALUES ('3429077a-8f83-46a3-9145-dc0633b919c3', 'aldito', 'aldofabiocontreras9898@gmail.com', '1234', NULL, true, '2026-03-10 01:03:05.320254', 1, '2026-04-13', 1);
INSERT INTO lms_core.usuarios VALUES ('1a460781-78f1-42a7-ac0c-fc0c8c781857', 'aldo', 'aldosexo@gmail.com', '123456', NULL, true, '2026-04-21 04:10:29.417108', 0, NULL, 0);
INSERT INTO lms_core.usuarios VALUES ('e384433d-e11e-4a7d-952b-8397591901a2', 'fabio', 'fabi@gmail.com', '123456789', NULL, true, '2026-04-21 10:33:33.647632', 0, NULL, 0);
INSERT INTO lms_core.usuarios VALUES ('3d5d360d-33e8-4f74-beb5-e14daa65e874', 'Fabian', 'aldofabiocontreras2006@gmail.com', 'Supercell98@', NULL, true, '2026-04-21 10:59:01.291229', 0, NULL, 0);
INSERT INTO lms_core.usuarios VALUES ('c949cfe8-6102-49d8-bb53-c720bf6cc301', 'Alumno Clon', 'alumno_multiverso@dagon.com', '1234', NULL, true, '2026-04-21 16:18:19.209892', 0, NULL, 0);
INSERT INTO lms_core.usuarios VALUES ('7e8614ad-1336-462b-a09c-0f4127c03d50', 'Zacarias', 'zacarias@unach.mx', 'zaca123', NULL, true, '2026-04-21 16:48:41.871367', 1, '2026-04-21', 1);
INSERT INTO lms_core.usuarios VALUES ('41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8', 'Mora', 'mora@dagon.com', 'admin123', NULL, true, '2026-04-21 17:13:33.484724', 0, NULL, 0);
INSERT INTO lms_core.usuarios VALUES ('d504a92f-4c82-47ee-b9f7-a4be05df3e58', 'maximo', 'max@gmail.com', '123', NULL, true, '2026-03-10 01:52:39.586369', 2, '2026-04-25', 2);
INSERT INTO lms_core.usuarios VALUES ('e1eeb361-e273-48f4-8558-97a61cbd1892', 'Dagon Tester', 'tester@dagon.com', 'admin123', NULL, true, '2026-04-11 23:36:14.649212', 5, '2026-04-28', 5);
INSERT INTO lms_core.usuarios VALUES ('269ed901-dd07-403b-80ae-e353a45d7bd4', 'aldopro', 'aldopro@dagon.com', 'Supercell98@', NULL, true, '2026-04-28 06:20:42.7185', 1, '2026-04-28', 1);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: lms_sandbox_template; Owner: -
--

INSERT INTO lms_sandbox_template.aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO lms_sandbox_template.aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO lms_sandbox_template.aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO lms_sandbox_template.aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO lms_sandbox_template.aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO lms_sandbox_template.aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: lms_sandbox_template; Owner: -
--

INSERT INTO lms_sandbox_template.equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO lms_sandbox_template.equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO lms_sandbox_template.equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO lms_sandbox_template.equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO lms_sandbox_template.equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: lms_sandbox_template; Owner: -
--

INSERT INTO lms_sandbox_template.habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO lms_sandbox_template.habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO lms_sandbox_template.habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO lms_sandbox_template.habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: lms_sandbox_template; Owner: -
--

INSERT INTO lms_sandbox_template.huespedes VALUES (1, 'Loya', 15);
INSERT INTO lms_sandbox_template.huespedes VALUES (2, 'Zoe', 20);
INSERT INTO lms_sandbox_template.huespedes VALUES (3, 'Jared', 8);
INSERT INTO lms_sandbox_template.huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: lms_sandbox_template; Owner: -
--

INSERT INTO lms_sandbox_template.reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO lms_sandbox_template.reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO lms_sandbox_template.reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO lms_sandbox_template.reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: mascotas; Type: TABLE DATA; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--



--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: mascotas; Type: TABLE DATA; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--



--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: mascotas; Type: TABLE DATA; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--



--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Data for Name: aventureros; Type: TABLE DATA; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros VALUES (1, 'Loya', 'Caballero', 15);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros VALUES (2, 'Zoe', 'Maga Suprema', 20);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros VALUES (3, 'Jared', 'Arquero', 8);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros VALUES (4, 'Aldo', 'Guerrero', 30);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros VALUES (5, 'Dan', 'Asesino', 25);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros VALUES (6, 'Gimli', 'Guerrero', NULL);


--
-- Data for Name: equipamiento; Type: TABLE DATA; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento VALUES (1, 1, 'Espada Larga', 150);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento VALUES (2, 1, 'Escudo de Hierro', 100);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento VALUES (3, 2, 'Báculo de Fuego', 300);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento VALUES (4, 4, 'Hacha Doble', 200);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento VALUES (5, 5, 'Daga Venenosa', 120);


--
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones VALUES (1, 101, 'Simple', 50.00);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones VALUES (2, 102, 'Simple', 55.00);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones VALUES (3, 201, 'Suite', 150.00);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones VALUES (4, 301, 'Imperial', 500.00);


--
-- Data for Name: huespedes; Type: TABLE DATA; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes VALUES (1, 'Loya', 15);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes VALUES (2, 'Zoe', 20);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes VALUES (3, 'Jared', 8);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes VALUES (4, 'Aldo', 30);


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas VALUES (1, '2026-04-20', 1, 1);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas VALUES (2, '2026-04-21', 2, 3);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas VALUES (3, '2026-04-22', 4, 4);
INSERT INTO "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas VALUES (4, '2026-04-23', 1, 2);


--
-- Name: auditoria_logs_id_log_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: -
--

SELECT pg_catalog.setval('lms_core.auditoria_logs_id_log_seq', 4, true);


--
-- Name: cursos_id_curso_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: -
--

SELECT pg_catalog.setval('lms_core.cursos_id_curso_seq', 2, true);


--
-- Name: ejercicios_practicos_id_ejercicio_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: -
--

SELECT pg_catalog.setval('lms_core.ejercicios_practicos_id_ejercicio_seq', 113, true);


--
-- Name: modulos_id_modulo_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: -
--

SELECT pg_catalog.setval('lms_core.modulos_id_modulo_seq', 4, true);


--
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: lms_core; Owner: -
--

SELECT pg_catalog.setval('lms_core.roles_id_rol_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: lms_sandbox_template; Owner: -
--

SELECT pg_catalog.setval('lms_sandbox_template.aventureros_id_aventurero_seq', 32, true);


--
-- Name: equipamiento_id_equipo_seq; Type: SEQUENCE SET; Schema: lms_sandbox_template; Owner: -
--

SELECT pg_catalog.setval('lms_sandbox_template.equipamiento_id_equipo_seq', 5, true);


--
-- Name: habitaciones_id_seq; Type: SEQUENCE SET; Schema: lms_sandbox_template; Owner: -
--

SELECT pg_catalog.setval('lms_sandbox_template.habitaciones_id_seq', 16, true);


--
-- Name: huespedes_id_seq; Type: SEQUENCE SET; Schema: lms_sandbox_template; Owner: -
--

SELECT pg_catalog.setval('lms_sandbox_template.huespedes_id_seq', 4, true);


--
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: lms_sandbox_template; Owner: -
--

SELECT pg_catalog.setval('lms_sandbox_template.reservas_id_seq', 6, true);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros_id_aventurero_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros_id_aventurero_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros_id_aventurero_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros_id_aventurero_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros_id_aventurero_seq', 1, false);


--
-- Name: mascotas_id_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas_id_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros_id_aventurero_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros_id_aventurero_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros_id_aventurero_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros_id_aventurero_seq', 1, false);


--
-- Name: mascotas_id_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas_id_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros_id_aventurero_seq', 5, true);


--
-- Name: dias_semana_id_dia_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".dias_semana_id_dia_seq', 1, false);


--
-- Name: mascotas_id_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas_id_seq', 1, false);


--
-- Name: aventureros_id_aventurero_seq; Type: SEQUENCE SET; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

SELECT pg_catalog.setval('"sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros_id_aventurero_seq', 1, false);


--
-- Name: auditoria_logs auditoria_logs_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.auditoria_logs
    ADD CONSTRAINT auditoria_logs_pkey PRIMARY KEY (id_log);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (id_curso);


--
-- Name: cursos cursos_titulo_key; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.cursos
    ADD CONSTRAINT cursos_titulo_key UNIQUE (titulo);


--
-- Name: ejercicios_practicos ejercicios_practicos_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.ejercicios_practicos
    ADD CONSTRAINT ejercicios_practicos_pkey PRIMARY KEY (id_ejercicio);


--
-- Name: intentos intentos_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.intentos
    ADD CONSTRAINT intentos_pkey PRIMARY KEY (id_intento);


--
-- Name: modulos modulos_id_curso_orden_key; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.modulos
    ADD CONSTRAINT modulos_id_curso_orden_key UNIQUE (id_curso, orden);


--
-- Name: modulos modulos_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.modulos
    ADD CONSTRAINT modulos_pkey PRIMARY KEY (id_modulo);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_269ed901-dd07-403b-80ae-e353a45d7bd4".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: mascotas mascotas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".mascotas
    ADD CONSTRAINT mascotas_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: mascotas mascotas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".mascotas
    ADD CONSTRAINT mascotas_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: mascotas mascotas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".mascotas
    ADD CONSTRAINT mascotas_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e1eeb361-e273-48f4-8558-97a61cbd1892".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: aventureros aventureros_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros
    ADD CONSTRAINT aventureros_pkey PRIMARY KEY (id_aventurero);


--
-- Name: equipamiento equipamiento_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento
    ADD CONSTRAINT equipamiento_pkey PRIMARY KEY (id_equipo);


--
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- Name: huespedes huespedes_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes
    ADD CONSTRAINT huespedes_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

ALTER TABLE ONLY "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: usuarios regla_soft_delete_usuarios; Type: RULE; Schema: lms_core; Owner: -
--

CREATE RULE regla_soft_delete_usuarios AS
    ON DELETE TO lms_core.usuarios DO INSTEAD  UPDATE lms_core.usuarios SET activo = false
  WHERE (usuarios.id_usuario = old.id_usuario);


--
-- Name: ejercicios_practicos trg_auditar_update_ejercicio; Type: TRIGGER; Schema: lms_core; Owner: -
--

CREATE TRIGGER trg_auditar_update_ejercicio AFTER UPDATE ON lms_core.ejercicios_practicos FOR EACH ROW WHEN ((old.query_maestra IS DISTINCT FROM new.query_maestra)) EXECUTE FUNCTION lms_core.fn_auditar_ejercicios();


--
-- Name: usuarios trg_desatar_multiverso; Type: TRIGGER; Schema: lms_core; Owner: -
--

CREATE TRIGGER trg_desatar_multiverso AFTER INSERT ON lms_core.usuarios FOR EACH ROW EXECUTE FUNCTION lms_core.fn_crear_multiverso();


--
-- Name: ejercicios_practicos ejercicios_practicos_id_modulo_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.ejercicios_practicos
    ADD CONSTRAINT ejercicios_practicos_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES lms_core.modulos(id_modulo) ON DELETE CASCADE;


--
-- Name: intentos intentos_id_ejercicio_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.intentos
    ADD CONSTRAINT intentos_id_ejercicio_fkey FOREIGN KEY (id_ejercicio) REFERENCES lms_core.ejercicios_practicos(id_ejercicio) ON DELETE CASCADE;


--
-- Name: intentos intentos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.intentos
    ADD CONSTRAINT intentos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES lms_core.usuarios(id_usuario) ON DELETE CASCADE;


--
-- Name: modulos modulos_id_curso_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.modulos
    ADD CONSTRAINT modulos_id_curso_fkey FOREIGN KEY (id_curso) REFERENCES lms_core.cursos(id_curso) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: lms_core; Owner: -
--

ALTER TABLE ONLY lms_core.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES lms_core.roles(id_rol) ON DELETE RESTRICT;


--
-- Name: reservas reservas_id_habitacion_fkey; Type: FK CONSTRAINT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.reservas
    ADD CONSTRAINT reservas_id_habitacion_fkey FOREIGN KEY (id_habitacion) REFERENCES lms_sandbox_template.habitaciones(id);


--
-- Name: reservas reservas_id_huesped_fkey; Type: FK CONSTRAINT; Schema: lms_sandbox_template; Owner: -
--

ALTER TABLE ONLY lms_sandbox_template.reservas
    ADD CONSTRAINT reservas_id_huesped_fkey FOREIGN KEY (id_huesped) REFERENCES lms_sandbox_template.huespedes(id);


--
-- Name: SCHEMA lms_core; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA lms_core TO app_backend_user;


--
-- Name: SCHEMA lms_sandbox_template; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA lms_sandbox_template TO app_backend_user;
GRANT USAGE ON SCHEMA lms_sandbox_template TO app_sandbox_user;


--
-- Name: TABLE auditoria_logs; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.auditoria_logs TO app_backend_user;


--
-- Name: SEQUENCE auditoria_logs_id_log_seq; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.auditoria_logs_id_log_seq TO app_backend_user;


--
-- Name: TABLE cursos; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.cursos TO app_backend_user;


--
-- Name: SEQUENCE cursos_id_curso_seq; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.cursos_id_curso_seq TO app_backend_user;


--
-- Name: TABLE ejercicios_practicos; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.ejercicios_practicos TO app_backend_user;


--
-- Name: SEQUENCE ejercicios_practicos_id_ejercicio_seq; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.ejercicios_practicos_id_ejercicio_seq TO app_backend_user;


--
-- Name: TABLE intentos; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.intentos TO app_backend_user;


--
-- Name: TABLE modulos; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.modulos TO app_backend_user;


--
-- Name: SEQUENCE modulos_id_modulo_seq; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.modulos_id_modulo_seq TO app_backend_user;


--
-- Name: TABLE roles; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.roles TO app_backend_user;


--
-- Name: SEQUENCE roles_id_rol_seq; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE lms_core.roles_id_rol_seq TO app_backend_user;


--
-- Name: TABLE usuarios; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_core.usuarios TO app_backend_user;


--
-- Name: TABLE v_ranking_alumnos; Type: ACL; Schema: lms_core; Owner: -
--

GRANT SELECT ON TABLE lms_core.v_ranking_alumnos TO app_backend_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_sandbox_template.aventureros TO app_sandbox_user;


--
-- Name: SEQUENCE aventureros_id_aventurero_seq; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE lms_sandbox_template.aventureros_id_aventurero_seq TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_sandbox_template.equipamiento TO app_sandbox_user;


--
-- Name: SEQUENCE equipamiento_id_equipo_seq; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE lms_sandbox_template.equipamiento_id_equipo_seq TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_sandbox_template.habitaciones TO app_sandbox_user;


--
-- Name: SEQUENCE habitaciones_id_seq; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT USAGE ON SEQUENCE lms_sandbox_template.habitaciones_id_seq TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_sandbox_template.huespedes TO app_sandbox_user;


--
-- Name: SEQUENCE huespedes_id_seq; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT USAGE ON SEQUENCE lms_sandbox_template.huespedes_id_seq TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE lms_sandbox_template.reservas TO app_sandbox_user;


--
-- Name: SEQUENCE reservas_id_seq; Type: ACL; Schema: lms_sandbox_template; Owner: -
--

GRANT USAGE ON SEQUENCE lms_sandbox_template.reservas_id_seq TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_1a460781-78f1-42a7-ac0c-fc0c8c781857".reservas TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_2cbbf24f-d178-474d-80ae-c90ac3aad008".reservas TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3429077a-8f83-46a3-9145-dc0633b919c3".reservas TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_3d5d360d-33e8-4f74-beb5-e14daa65e874".reservas TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_41ddd304-9c1c-40cc-b07b-8ee4dfbe9fd8".reservas TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_7e8614ad-1336-462b-a09c-0f4127c03d50".reservas TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_c949cfe8-6102-49d8-bb53-c720bf6cc301".reservas TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_d504a92f-4c82-47ee-b9f7-a4be05df3e58".reservas TO app_sandbox_user;


--
-- Name: TABLE aventureros; Type: ACL; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".aventureros TO app_sandbox_user;


--
-- Name: TABLE equipamiento; Type: ACL; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".equipamiento TO app_sandbox_user;


--
-- Name: TABLE habitaciones; Type: ACL; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".habitaciones TO app_sandbox_user;


--
-- Name: TABLE huespedes; Type: ACL; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".huespedes TO app_sandbox_user;


--
-- Name: TABLE reservas; Type: ACL; Schema: sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2; Owner: -
--

GRANT ALL ON TABLE "sandbox_usuario_e384433d-e11e-4a7d-952b-8397591901a2".reservas TO app_sandbox_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: lms_sandbox_template; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA lms_sandbox_template GRANT SELECT ON TABLES TO app_sandbox_user;


--
-- PostgreSQL database dump complete
--

\unrestrict tdrRbRgUDxBrhEotBMpBU7IfNjFm7Pb33AhhRRJx5zC7IqAWjv6cj0OuJyP8DPb

