-- Crear tabla equivalente en PostgreSQL
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar los datos migrados
INSERT INTO productos (id, nombre, sku, categoria, precio, stock, activo, fecha_registro) VALUES
(101, 'Smart TV 55 Pulgadas 4K', 'TV-55-4K-01', 'Electrónica', 450.00, 15, TRUE, '2025-01-15 10:00:00'),
(102, 'Audífonos Bluetooth Pro', 'AUD-BT-02', 'Electrónica', 89.99, 45, TRUE, '2025-02-20 11:30:00'),
(103, 'Laptop Pro 16GB RAM', 'LAP-PRO-16', 'Cómputo', 1200.00, 8, TRUE, '2025-03-05 09:15:00'),
(104, 'Mouse Ergonómico', 'MOU-ERG-04', 'Cómputo', 35.50, 120, TRUE, '2025-04-12 14:00:00'),
(105, 'Refrigerador No Frost 400L', 'REF-NF-400', 'Línea Blanca', 650.00, 5, TRUE, '2025-05-18 16:45:00'),
(106, 'Tenis Deportivos Running', 'TEN-RUN-88', 'Moda', 75.00, 60, TRUE, '2025-06-01 12:00:00'),
(107, 'Chaqueta de Cuero Sintético', 'CHA-CUE-07', 'Moda', 120.00, 25, TRUE, '2025-06-15 08:30:00'),
(108, 'Sofá Cama Contemporáneo', 'SOF-CAM-05', 'Hogar y Cocina', 350.00, 12, TRUE, '2025-07-02 11:00:00'),
(109, 'Cafetera de Goteo Programable', 'CAF-GOT-09', 'Hogar y Cocina', 45.00, 40, TRUE, '2025-07-22 15:20:00'),
(110, 'Bicicleta de Montaña R29', 'BIC-MON-29', 'Deportes', 580.00, 7, TRUE, '2025-08-05 09:00:00'),
(111, 'Set de Mancuernas 20kg', 'SET-MAN-20', 'Deportes', 65.00, 30, TRUE, '2025-08-19 17:10:00'),
(112, 'Libro: Clean Code', 'LIB-CC-2022', 'Libros', 42.00, 50, TRUE, '2025-09-01 10:45:00'),
(113, 'Set de Bloques de Construcción', 'JUG-BLO-13', 'Juguetes', 29.99, 85, TRUE, '2025-09-15 14:30:00'),
(114, 'Compresor de Aire Portátil', 'AUT-COM-14', 'Automotriz', 55.00, 18, TRUE, '2025-10-02 11:15:00'),
(115, 'Sérum Facial Ácido Hialurónico', 'BEL-SER-15', 'Belleza', 24.50, 100, FALSE, '2025-10-20 16:00:00');

-- Ajustar el SERIAL para que continúe desde el último id
SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));
