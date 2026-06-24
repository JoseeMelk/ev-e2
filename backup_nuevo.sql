--
-- PostgreSQL database dump limpio
-- Listo para restaurar en VPS destino
-- Incluye campos: marca (varchar 100), codigo_barras (varchar 50)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Eliminar tabla si existe (para re-restauraciones limpias)
--
DROP TABLE IF EXISTS public.productos CASCADE;
DROP SEQUENCE IF EXISTS public.productos_id_seq CASCADE;

--
-- SEQUENCE
--
CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- TABLE: productos (con campos nuevos marca y codigo_barras)
--
CREATE TABLE public.productos (
    id integer NOT NULL DEFAULT nextval('public.productos_id_seq'::regclass),
    nombre character varying(150) NOT NULL,
    sku character varying(50) NOT NULL,
    categoria character varying(100) NOT NULL,
    precio numeric(10,2) NOT NULL,
    stock integer NOT NULL,
    activo boolean DEFAULT true,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    marca character varying(100),
    codigo_barras character varying(50)
);

ALTER TABLE public.productos OWNER TO postgres;

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;

--
-- DATA
--
INSERT INTO public.productos (id, nombre, sku, categoria, precio, stock, activo, fecha_registro, marca, codigo_barras) VALUES
(101, 'Smart TV 55 Pulgadas 4K',       'TV-55-4K-01',  'Electrónica',    450.00,  15, true,  '2025-01-15 10:00:00', NULL, NULL),
(102, 'Audífonos Bluetooth Pro',        'AUD-BT-02',    'Electrónica',     89.99,  45, true,  '2025-02-20 11:30:00', NULL, NULL),
(103, 'Laptop Pro 16GB RAM',            'LAP-PRO-16',   'Cómputo',       1200.00,   8, true,  '2025-03-05 09:15:00', NULL, NULL),
(104, 'Mouse Ergonómico',               'MOU-ERG-04',   'Cómputo',         35.50, 120, true,  '2025-04-12 14:00:00', NULL, NULL),
(105, 'Refrigerador No Frost 400L',     'REF-NF-400',   'Línea Blanca',   650.00,   5, true,  '2025-05-18 16:45:00', NULL, NULL),
(106, 'Tenis Deportivos Running',       'TEN-RUN-88',   'Moda',            75.00,  60, true,  '2025-06-01 12:00:00', NULL, NULL),
(107, 'Chaqueta de Cuero Sintético',    'CHA-CUE-07',   'Moda',           120.00,  25, true,  '2025-06-15 08:30:00', NULL, NULL),
(108, 'Sofá Cama Contemporáneo',        'SOF-CAM-05',   'Hogar y Cocina', 350.00,  12, true,  '2025-07-02 11:00:00', NULL, NULL),
(109, 'Cafetera de Goteo Programable',  'CAF-GOT-09',   'Hogar y Cocina',  45.00,  40, true,  '2025-07-22 15:20:00', NULL, NULL),
(110, 'Bicicleta de Montaña R29',       'BIC-MON-29',   'Deportes',       580.00,   7, true,  '2025-08-05 09:00:00', NULL, NULL),
(111, 'Set de Mancuernas 20kg',         'SET-MAN-20',   'Deportes',        65.00,  30, true,  '2025-08-19 17:10:00', NULL, NULL),
(112, 'Libro: Clean Code',              'LIB-CC-2022',  'Libros',          42.00,  50, true,  '2025-09-01 10:45:00', NULL, NULL),
(113, 'Set de Bloques de Construcción', 'JUG-BLO-13',   'Juguetes',        29.99,  85, true,  '2025-09-15 14:30:00', NULL, NULL),
(114, 'Compresor de Aire Portátil',     'AUT-COM-14',   'Automotriz',      55.00,  18, true,  '2025-10-02 11:15:00', NULL, NULL),
(115, 'Sérum Facial Ácido Hialurónico', 'BEL-SER-15',   'Belleza',         24.50, 100, false, '2025-10-20 16:00:00', NULL, NULL);

--
-- Sincronizar secuencia al máximo ID insertado
--
SELECT pg_catalog.setval('public.productos_id_seq', 116, true);

--
-- CONSTRAINTS
--
ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_sku_key UNIQUE (sku);

--
-- PERMISOS (ajusta el usuario si es diferente a diegoglez)
--
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'diegoglez') THEN
        GRANT ALL ON TABLE public.productos TO diegoglez;
        GRANT ALL ON SEQUENCE public.productos_id_seq TO diegoglez;
    END IF;
END
$$;
