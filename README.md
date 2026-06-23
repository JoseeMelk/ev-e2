# Evaluación Técnica VPS B — Administrador de Productos

Aplicación web CRUD para administración de productos, desarrollada con Node.js + Express y PostgreSQL. Incluye migración completa desde MySQL, proxy reverso con Nginx, HTTPS con SSL y gestión de procesos con PM2.


## URLs de acceso

- **Aplicación (HTTPS):** https://143.198.237.96
- **Aplicación (HTTP):** http://143.198.237.96
- **Repositorio:** https://github.com/Trickster7u7/evaluacion-tienda-admin

## Credenciales de prueba

- **Base de datos:** appdb
- **Usuario BD:** diegoglez

## Arquitectura
Internet

|

Nginx (puerto 80/443) — Proxy reverso + SSL

|

Node.js/Express (puerto 3000) — API REST

|

PostgreSQL — Base de datos

|

PM2 — Gestor de procesos (auto-restart)
## Tecnologías utilizadas

| Componente | Tecnología |
|-----------|-----------|
| Sistema Operativo | Ubuntu 24.04 LTS |
| Runtime | Node.js 20 |
| Framework | Express.js |
| Base de datos | PostgreSQL 16 |
| Driver BD | node-postgres (pg) |
| Exportación Excel | ExcelJS |
| Proxy reverso | Nginx |
| Gestor de procesos | PM2 |
| SSL | OpenSSL (autofirmado) |

---

## Instalación y Despliegue

### Requisitos previos

- Ubuntu 24.04 LTS
- Node.js 20+
- PostgreSQL 16+
- Nginx
- PM2

### 1. Clonar repositorio

```bash
git clone https://github.com/Trickster7u7/evaluacion-tienda-admin.git
cd evaluacion-tienda-admin
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo .env con el siguiente contenido:

```bash
DB_USER=diegoglez
DB_HOST=localhost
DB_NAME=appdb
DB_PASSWORD=123456
DB_PORT=5432
PORT=3000
```

### 4. Crear base de datos PostgreSQL

```bash
sudo -u postgres psql
CREATE USER diegoglez WITH PASSWORD '123456';
CREATE DATABASE appdb OWNER diegoglez;
GRANT ALL PRIVILEGES ON DATABASE appdb TO diegoglez;
\q
```

### 5. Ejecutar migración

```bash
cp migrar.sql /tmp/migrar.sql
sudo -u postgres psql -d appdb -f /tmp/migrar.sql
sudo -u postgres psql -d appdb -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO diegoglez;"
sudo -u postgres psql -d appdb -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO diegoglez;"
```

### 6. Iniciar con PM2

```bash
npm install -g pm2
pm2 start index.js --name tienda
pm2 save
pm2 startup
```

### 7. Configurar Nginx como proxy reverso

```bash
cat > /etc/nginx/sites-available/tienda << 'EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name _;
    ssl_certificate /etc/ssl/certs/tienda.crt;
    ssl_certificate_key /etc/ssl/private/tienda.key;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/tienda /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

### 8. Despliegue automatizado

Para actualizar la app con los últimos cambios de GitHub:

```bash
./deploy.sh
```

El script realiza: git pull, npm install y pm2 restart automáticamente.

---

## Migración MySQL a PostgreSQL

### Cambios de tipos de datos

| MySQL | PostgreSQL | Motivo |
|-------|-----------|--------|
| INT AUTO_INCREMENT | SERIAL | Secuencia automática nativa |
| TINYINT(1) | BOOLEAN | Tipo booleano nativo |
| DATETIME | TIMESTAMP | Equivalente en PostgreSQL |
| DECIMAL(10,2) | NUMERIC(10,2) | Precisión decimal exacta |

### Pasos realizados

1. Análisis del esquema MySQL original (respaldo_origen.sql)
2. Conversión de tipos de datos incompatibles
3. Creación de estructura equivalente en PostgreSQL
4. Inserción de 15 registros conservando IDs originales (101-115)
5. Ajuste de secuencia con setval para evitar conflictos en inserciones futuras
6. Verificación de integridad: SELECT COUNT(*) FROM productos; → 15 registros

---

## Respaldo y Restauración

### Generar respaldo

```bash
PGPASSWORD=123456 pg_dump -U diegoglez -h localhost -d appdb -F c -f respaldo_appdb.dump
```

### Restaurar respaldo

```bash
PGPASSWORD=123456 pg_restore -U diegoglez -h localhost -d appdb -F c respaldo_appdb.dump
```

---

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/productos | Listar con búsqueda, filtros y paginación |
| GET | /api/productos/:id | Obtener un producto |
| POST | /api/productos | Crear producto |
| PUT | /api/productos/:id | Editar producto |
| DELETE | /api/productos/:id | Eliminar producto |
| GET | /api/categorias | Listar categorías únicas |
| GET | /api/export/excel | Exportar a Excel (.xlsx) |

### Parámetros disponibles en GET /api/productos

- busqueda — filtra por nombre o SKU
- categoria — filtra por categoría exacta
- pagina — número de página (default: 1)
- limite — registros por página (default: 10)
- orden — columna de ordenamiento (default: id)
- dir — dirección ASC o DESC (default: ASC)

---

## Funcionalidades de la app

- Alta de productos
- Consulta con paginación
- Edición de registros
- Eliminación de registros
- Búsqueda por nombre y SKU
- Filtrado por categoría
- Ordenamiento por columnas
- Exportación a Excel (.xlsx)
- Validaciones en formulario

---

## Seguridad implementada

- Usuario de BD (diegoglez) sin privilegios de superusuario
- Usuario administrativo del sistema distinto a root (diegoglez con sudo)
- Firewall UFW configurado (puertos 22, 80, 443)
- Variables de entorno para credenciales (archivo .env)
- Nginx como proxy reverso
- HTTPS con SSL autofirmado
- Consultas con parámetros preparados (prevención SQL injection)

---

## HTTPS y SSL

La aplicación cuenta con HTTPS habilitado mediante certificado SSL autofirmado generado con OpenSSL.

Al acceder vía https://143.198.237.96 el navegador mostrará una advertencia de seguridad. Esto es normal con certificados autofirmados ya que no están emitidos por una autoridad certificadora reconocida, pero la conexión sí está cifrada.

Para acceder: clic en "Configuración avanzada" y luego "Acceder al sitio".

Para producción real con dominio propio se recomienda Let's Encrypt:

```bash
certbot --nginx -d tudominio.com
```

---

## Autor

Diego González — Evaluación Técnica VPS B — Junio 2026
