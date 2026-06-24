# Modificaciones Implementadas – Evaluación Técnica Etapa 2

## Resumen

Se asumió la operación de una solución desarrollada por un tercero, se migró a un nuevo servidor VPS y se implementaron las modificaciones funcionales solicitadas: nuevos campos `marca` y `codigo_barras`, actualización de búsqueda, ordenamiento y exportación Excel.

---

## 1. Base de Datos (PostgreSQL)

### Problema encontrado
El respaldo original (`backup.sql`) contenía directivas propietarias de DigitalOcean (`\restrict` / `\unrestrict`) que impedían su restauración en un entorno estándar. Adicionalmente, el VPS destino utiliza PostgreSQL dentro de un contenedor Docker con usuario `diegoglez` como propietario, por lo que los comandos `ALTER ... OWNER TO postgres` generaban errores (no críticos, pero ruidosos).

### Solución
Se generó un archivo `backup_nuevo.sql` con las siguientes características:

- Eliminación de las directivas `\restrict` / `\unrestrict`.
- Uso de `DROP TABLE IF EXISTS` y `DROP SEQUENCE IF EXISTS` para permitir re-ejecuciones sin errores.
- `GRANT` condicional mediante bloque `DO $$` que solo ejecuta si el rol `diegoglez` existe, evitando errores en entornos distintos.
- **Nuevos campos agregados directamente en el `CREATE TABLE`:**

```sql
marca         character varying(100),
codigo_barras character varying(50)
```

### Comando de restauración en Docker

```bash
docker exec -i evaluacion_postgres psql -U diegoglez -d appdb < /tmp/backup_nuevo.sql
```

---

## 2. Backend (`server.js`)

### Campo de columnas válidas para ordenamiento

Se agregaron `marca` y `codigo_barras` a la lista blanca de columnas permitidas para ordenamiento seguro:

```js
// Antes
const columnas = ['id','nombre','sku','categoria','precio','stock','activo','fecha_registro'];

// Después
const columnas = ['id','nombre','sku','categoria','precio','stock','activo','fecha_registro','marca','codigo_barras'];
```

### Búsqueda ampliada (GET /api/productos y GET /api/export/excel)

La búsqueda ahora abarca `nombre`, `sku`, `categoria` **y `marca`**:

```js
// Antes
filtros.push(`(nombre ILIKE $${i} OR sku ILIKE $${i})`);

// Después
filtros.push(`(nombre ILIKE $${i} OR sku ILIKE $${i} OR categoria ILIKE $${i} OR marca ILIKE $${i})`);
```

### Crear producto (POST /api/productos)

Se extrae y persiste `marca` y `codigo_barras` del body:

```js
const { nombre, sku, categoria, precio, stock, activo, marca, codigo_barras } = req.body;

// Query actualizado
'INSERT INTO productos (nombre, sku, categoria, precio, stock, activo, marca, codigo_barras) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
[nombre, sku, categoria, precio, stock, activo ?? true, marca ?? null, codigo_barras ?? null]
```

### Editar producto (PUT /api/productos/:id)

```js
const { nombre, sku, categoria, precio, stock, activo, marca, codigo_barras } = req.body;

// Query actualizado
`UPDATE productos SET nombre=$1, sku=$2, categoria=$3, precio=$4, stock=$5, activo=$6, marca=$7, codigo_barras=$8 WHERE id=$9 RETURNING *`,
[nombre, sku, categoria, precio, stock, activo, marca ?? null, codigo_barras ?? null, req.params.id]
```

### Exportación Excel (GET /api/export/excel)

Se agregaron dos columnas nuevas al worksheet:

```js
{ header: 'Marca',            key: 'marca',         width: 20 },
{ header: 'Código de Barras', key: 'codigo_barras',  width: 22 },
```

---

## 3. Frontend (`index.html`)

### Tabla de productos

Se agregaron dos columnas en el `<thead>`. `Marca` permite ordenamiento:

```html
<th onclick="ordenar('marca')">Marca ↕</th>
<th>Código Barras</th>
```

Y sus celdas correspondientes en la función `cargar()`:

```js
<td>${p.marca ?? ''}</td>
<td>${p.codigo_barras ?? ''}</td>
```

### Modal de creación / edición

Se agregaron los dos campos nuevos (opcionales):

```html
<div class="form-group">
  <label>Marca</label>
  <input id="fMarca" placeholder="Ej: Samsung">
</div>
<div class="form-group">
  <label>Código de Barras</label>
  <input id="fCodigoBarras" placeholder="Ej: 7501234567890">
</div>
```

Se agregó `max-height` y `overflow-y: auto` al modal para que no se desborde con los campos adicionales.

### Función `abrirModal()`

Se limpian los campos nuevos al abrir el modal en modo creación:

```js
['fNombre','fSku','fCategoria','fPrecio','fStock','fMarca','fCodigoBarras']
  .forEach(f => document.getElementById(f).value = '');
```

### Función `editar()`

Se poblan los campos al cargar un producto existente:

```js
document.getElementById('fMarca').value = p.marca ?? '';
document.getElementById('fCodigoBarras').value = p.codigo_barras ?? '';
```

### Función `guardar()`

Se incluyen en el body del request:

```js
marca:         document.getElementById('fMarca').value.trim() || null,
codigo_barras: document.getElementById('fCodigoBarras').value.trim() || null,
```

### Buscador

Se actualizó el placeholder para reflejar que ahora busca también por categoría y marca:

```html
placeholder="Buscar por nombre, SKU, categoría o marca..."
```

---

## 4. Oportunidades de mejora identificadas

1. **Validación de datos en el backend:** Actualmente solo se validan los campos obligatorios con un `if` simple. Se recomienda incorporar una librería como `Joi` o `zod` para validar tipos, longitudes máximas y formatos (por ejemplo, que `precio` sea positivo y `sku` no tenga espacios).

2. **Manejo de errores en el frontend:** Las llamadas `fetch` no tienen bloque `try/catch`. Si el servidor no responde o hay un error de red, la interfaz queda en silencio sin avisar al usuario. Se recomienda capturar errores de red y mostrar mensajes claros.

3. **Seguridad y autenticación:** La API no tiene ningún mecanismo de autenticación. Cualquier persona con acceso a la IP puede crear, editar o eliminar productos. Se recomienda implementar al menos autenticación básica con JWT o sesiones para proteger los endpoints.

3. **Repositorio:** Hay archivos trackeados que no deberian estar, por ejemplo el .env, esta en el repositorio.

3. **Arquitectura:** No hay arquitectura clara en el proyecto, no hay separacion de responsabilidades, esto puede generar que los archivos crezcan demasiado.
