require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./db');
const ExcelJS = require('exceljs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// GET - Listar productos con búsqueda, filtro y paginación
app.get('/api/productos', async (req, res) => {
  const { busqueda = '', categoria = '', pagina = 1, limite = 10, orden = 'id', dir = 'ASC' } = req.query;
  const offset = (pagina - 1) * limite;
  const columnas = ['id','nombre','sku','categoria','precio','stock','activo','fecha_registro'];
  const ordenSeguro = columnas.includes(orden) ? orden : 'id';
  const dirSeguro = dir === 'DESC' ? 'DESC' : 'ASC';

  try {
    const filtros = [];
    const valores = [];
    let i = 1;

    if (busqueda) {
      filtros.push(`(nombre ILIKE $${i} OR sku ILIKE $${i})`);
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

// GET - Categorías únicas
app.get('/api/categorias', async (req, res) => {
  const result = await pool.query('SELECT DISTINCT categoria FROM productos ORDER BY categoria');
  res.json(result.rows.map(r => r.categoria));
});

// GET - Un producto
app.get('/api/productos/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json(result.rows[0]);
});

// POST - Crear producto
app.post('/api/productos', async (req, res) => {
  const { nombre, sku, categoria, precio, stock, activo } = req.body;
  if (!nombre || !sku || !categoria || precio == null || stock == null)
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, sku, categoria, precio, stock, activo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [nombre, sku, categoria, precio, stock, activo ?? true]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT - Editar producto
app.put('/api/productos/:id', async (req, res) => {
  const { nombre, sku, categoria, precio, stock, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE productos SET nombre=$1, sku=$2, categoria=$3, precio=$4, stock=$5, activo=$6 WHERE id=$7 RETURNING *`,
      [nombre, sku, categoria, precio, stock, activo, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - Eliminar producto
app.delete('/api/productos/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'No encontrado' });
  res.json({ mensaje: 'Eliminado correctamente' });
});

// GET - Exportar Excel
app.get('/api/export/excel', async (req, res) => {
  const { busqueda = '', categoria = '' } = req.query;
  const filtros = [];
  const valores = [];
  let i = 1;
  if (busqueda) { filtros.push(`(nombre ILIKE $${i} OR sku ILIKE $${i})`); valores.push(`%${busqueda}%`); i++; }
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
