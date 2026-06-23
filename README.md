# Evaluación Técnica VPS B — Administrador de Productos

Aplicación web CRUD para administración de productos, desarrollada con Node.js + Express y PostgreSQL. Incluye migración completa desde MySQL.

## URLs de acceso

- **Aplicación:** http://143.198.237.96
- **Repositorio:** https://github.com/Trickster7u7/evaluacion-tienda-admin

## Credenciales de prueba

- **Base de datos:** appdb
- **Usuario BD:** diegoglez

## Arquitectura

VPS DigitalOcean (Ubuntu)
- Nginx (puerto 80) - Proxy reverso
- Node.js/Express (puerto 3000) - API REST
- PostgreSQL - Base de datos
- PM2 - Gestor de procesos

## Tecnologías

- Ubuntu 24.04 LTS
- Node.js 20
- Express.js
- PostgreSQL 16
- node-postgres (pg)
- ExcelJS
- Nginx
- PM2

## Instalación y Despliegue

### 1. Clonar repositorio

git clone https://github.com/Trickster7u7/evaluacion-tienda-admin.git
cd evaluacion-tienda-admin

### 2. Instalar dependencias

npm install

### 3. Configurar variables de entorno

Crear archivo .env con el siguiente contenido:

DB_USER=diegoglez
DB_HOST=localhost
DB_NAME=appdb
DB_PASSWORD=123456
DB_PORT=5432
PORT=3000

### 4. Crear base de datos PostgreSQL

sudo -u postgres psql
CREATE USER diegoglez WITH PASSWORD '123456';
CREATE DATABASE appdb OWNER diegoglez;
GRANT ALL PRIVILEGES ON DATABASE appdb TO diegoglez;
\q

### 5. Ejecutar migración

cp migrar.sql /tmp/migrar.sql
sudo -u postgres psql -d appdb -f /tmp/migrar.sql
sudo -u postgres psql -d appdb -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO diegoglez;"
sudo -u postgres psql -d appdb -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO diegoglez;"

### 6. Iniciar con PM2

npm install -g pm2
pm2 start index.js --name tienda
pm2 save
pm2 startup

### 7. Configurar Nginx

Crear archivo /etc/nginx/sites-available/tienda con proxy_pass a localhost:3000
Activar con symlink y reiniciar nginx

## Migración MySQL a PostgreSQL

Cambios de tipos de datos realizados:
- INT AUTO_INCREMENT -> SERIAL
- TINYINT(1) -> BOOLEAN
- DATETIME -> TIMESTAMP
- DECIMAL(10,2) -> NUMERIC(10,2)

Pasos realizados:
1. Análisis del esquema MySQL original
2. Conversión de tipos de datos
3. Creación de estructura en PostgreSQL
4. Inserción de 15 registros con IDs originales
5. Ajuste de secuencia con setval

## Respaldo y Restauración

Generar respaldo:
PGPASSWORD=123456 pg_dump -U diegoglez -h localhost -d appdb -F c -f respaldo_appdb.dump

Restaurar respaldo:
PGPASSWORD=123456 pg_restore -U diegoglez -h localhost -d appdb -F c respaldo_appdb.dump

## Funcionalidades

- Alta de productos
- Consulta con paginación
- Edicion de registros
- Eliminacion de registros
- Busqueda por nombre y SKU
- Filtrado por categoria
- Ordenamiento por columnas
- Exportacion a Excel (.xlsx)
- Validaciones en formulario

## Seguridad implementada

- Usuario de BD sin privilegios de superusuario
- Firewall UFW configurado (puertos 22, 80, 443)
- Variables de entorno para credenciales
- Nginx como proxy reverso
- Consultas con parametros preparados

## Autor

Diego Gonzalez - Evaluacion Tecnica VPS B - Junio 2026
