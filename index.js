require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./db');
const ExcelJS = require('exceljs');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Listar productos con búsqueda, filtros y paginación
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *         description: Buscar por nombre, SKU, categoría o marca
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *         description: Registros por página
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *         description: Columna de ordenamiento
 *       - in: query
 *         name: dir
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Dirección del ordenamiento
 *     responses:
 *       200:
 *         description: Lista de productos
 */
app.get('/api/productos', async (req, res) => {
  const { busqueda = '', categoria = '', pagina = 1, limite = 10, orden = 'id', dir = 'ASC' } = req.query;
  const offset = (pagina - 1) * limite;
  const columnas = ['id','nombre','sku','categoria','precio','stock','activo','fecha_registro','marca','codigo_barras'];
  const ordenSeguro = columnas.includes(orden) ? orden : 'id';
  const dirSeguro = dir === 'DESC' ? 'DESC' : 'ASC';

  try {
    const filtros = [];
    const valores = [];
    let i = 1;

    if (busqueda) {
      filtros.push(`(nombre ILIKE $${i} OR sku ILIKE $${i} OR categoria ILIKE $${i} OR marca ILIKE $${i})`);
      valores.push(`%${busqueda}%`);
      i++;
    }
    if (categoria) {
      filtros.push(`categoria = $${i}`);
      valores.push(categoria);
      i++;
    }

    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

    const total = await pool.query(`SELECT COUNT(*) FROM productos ${where}`, valores);
    const datos = await pool.query(
      `SELECT * FROM productos ${where} ORDER BY ${ordenSeguro} ${dirSeguro} LIMIT $${i} OFFSET $${i+1}`,
      [...valores, limite, offset]
    );

    res.json({ total: parseInt(total.rows[0].count), datos: datos.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Listar categorías únicas
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
app.get('/api/categorias', async (req, res) => {
  const result = await pool.query('SELECT DISTINCT categoria FROM productos ORDER BY categoria');
  res.json(result.rows.map(r => r.categoria));
});

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto encontrado
 *       404:
 *         description: No encontrado
 */
app.get('/api/productos/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(result.rows[0]);
});

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear un nuevo producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, sku, categoria, precio, stock]
 *             properties:
 *               nombre:
 *                 type: string
 *               sku:
 *                 type: string
 *               categoria:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               activo:
 *                 type: boolean
 *               marca:
 *                 type: string
 *               codigo_barras:
 *                 type: string
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         description: Faltan campos obligatorios
 */
app.post('/api/productos', async (req, res) => {
  const { nombre, sku, categoria, precio, stock, activo, marca, codigo_barras } = req.body;
  if (!nombre || !sku || !categoria || precio == null || stock == null)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, sku, categoria, precio, stock, activo, marca, codigo_barras) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [nombre, sku, categoria, precio, stock, activo ?? true, marca ?? null, codigo_barras ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Editar un producto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               sku:
 *                 type: string
 *               categoria:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               activo:
 *                 type: boolean
 *               marca:
 *                 type: string
 *               codigo_barras:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       404:
 *         description: No encontrado
 */
app.put('/api/productos/:id', async (req, res) => {
  const { nombre, sku, categoria, precio, stock, activo, marca, codigo_barras } = req.body;
  try {
    const result = await pool.query(
      `UPDATE productos SET nombre=$1, sku=$2, categoria=$3, precio=$4, stock=$5, activo=$6, marca=$7, codigo_barras=$8 WHERE id=$9 RETURNING *`,
      [nombre, sku, categoria, precio, stock, activo, marca ?? null, codigo_barras ?? null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Eliminado correctamente
 *       404:
 *         description: No encontrado
 */
app.delete('/api/productos/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json({ mensaje: 'Eliminado correctamente' });
});

/**
 * @swagger
 * /api/export/excel:
 *   get:
 *     summary: Exportar productos a Excel
 *     parameters:
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo Excel generado
 */
app.get('/api/export/excel', async (req, res) => {
  const { busqueda = '', categoria = '' } = req.query;
  const filtros = [];
  const valores = [];
  let i = 1;
  if (busqueda) { filtros.push(`(nombre ILIKE $${i} OR sku ILIKE $${i} OR categoria ILIKE $${i} OR marca ILIKE $${i})`); valores.push(`%${busqueda}%`); i++; }
  if (categoria) { filtros.push(`categoria = $${i}`); valores.push(categoria); i++; }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

  const result = await pool.query(`SELECT * FROM productos ${where} ORDER BY id`, valores);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Productos');
  sheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Nombre', key: 'nombre', width: 30 },
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Marca', key: 'marca', width: 20 },
    { header: 'Código de Barras', key: 'codigo_barras', width: 22 },
    { header: 'Precio', key: 'precio', width: 12 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Activo', key: 'activo', width: 10 },
    { header: 'Fecha Registro', key: 'fecha_registro', width: 22 },
  ];
  sheet.getRow(1).font = { bold: true };
  result.rows.forEach(p => sheet.addRow({ ...p, activo: p.activo ? 'Sí' : 'No' }));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));