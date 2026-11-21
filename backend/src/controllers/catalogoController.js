const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listarGrados = asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM grados ORDER BY orden');
  res.json(rows);
});

const listarSecciones = asyncHandler(async (req, res) => {
  const { anio, gradoId } = req.query;
  let sql = `
    SELECT s.*, g.nombre AS grado_nombre, g.nivel,
           COALESCE(m.ocupados, 0) AS cupos_ocupados,
           s.capacidad - COALESCE(m.ocupados, 0) AS cupos_disponibles
    FROM secciones s
    JOIN grados g ON g.id = s.grado_id
    LEFT JOIN (
      SELECT seccion_id, COUNT(*) AS ocupados FROM matriculas WHERE estado = 'activo' GROUP BY seccion_id
    ) m ON m.seccion_id = s.id
    WHERE 1=1`;
  const params = [];
  if (anio) { params.push(anio); sql += ` AND s.anio_escolar = $${params.length}`; }
  if (gradoId) { params.push(gradoId); sql += ` AND s.grado_id = $${params.length}`; }
  sql += ' ORDER BY g.orden, s.nombre';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

const crearSeccion = asyncHandler(async (req, res) => {
  const { gradoId, nombre, capacidad, anioEscolar } = req.body;
  try {
    const { rows: result } = await pool.query(
      'INSERT INTO secciones (grado_id, nombre, capacidad, anio_escolar) VALUES ($1, $2, $3, $4) RETURNING id',
      [gradoId, nombre.toUpperCase(), capacidad || 30, anioEscolar]
    );
    res.status(201).json({ id: result[0].id });
  } catch (err) {
    if (err.code === '23505') throw new AppError('Esa seccion ya existe para ese grado y anio.', 409);
    throw err;
  }
});

const listarCursos = asyncHandler(async (req, res) => {
  const { gradoId } = req.query;
  let sql = 'SELECT * FROM cursos WHERE 1=1';
  const params = [];
  if (gradoId) { params.push(gradoId); sql += ` AND grado_id = $${params.length}`; }
  sql += ' ORDER BY nombre';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

const crearCurso = asyncHandler(async (req, res) => {
  const { nombre, gradoId } = req.body;
  const { rows: result } = await pool.query('INSERT INTO cursos (nombre, grado_id) VALUES ($1, $2) RETURNING id', [nombre, gradoId]);
  res.status(201).json({ id: result[0].id });
});

// Crea el mismo curso para todos los grados de un nivel (o para todos los
// grados si no se especifica nivel), en vez de repetir el alta grado por grado.
const crearCursoPorLote = asyncHandler(async (req, res) => {
  const { nombre, nivel } = req.body;
  if (!nombre || !nombre.trim()) throw new AppError('El nombre del curso es obligatorio.', 400);

  let sqlGrados = 'SELECT id, nombre, nivel FROM grados';
  const params = [];
  if (nivel) {
    params.push(nivel);
    sqlGrados += ' WHERE nivel = $1';
  }
  const { rows: grados } = await pool.query(sqlGrados, params);
  if (grados.length === 0) throw new AppError('No hay grados para ese nivel.', 400);

  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    const creados = [];
    const yaExistian = [];
    for (const grado of grados) {
      const { rows: existente } = await conexion.query(
        'SELECT id FROM cursos WHERE grado_id = $1 AND lower(nombre) = lower($2) LIMIT 1',
        [grado.id, nombre.trim()]
      );
      if (existente.length > 0) {
        yaExistian.push(grado.nombre + ' ' + grado.nivel);
        continue;
      }
      const { rows: result } = await conexion.query(
        'INSERT INTO cursos (nombre, grado_id) VALUES ($1, $2) RETURNING id',
        [nombre.trim(), grado.id]
      );
      creados.push({ id: result[0].id, grado: grado.nombre + ' ' + grado.nivel });
    }
    await conexion.query('COMMIT');
    res.status(201).json({
      mensaje: `Curso "${nombre.trim()}" creado en ${creados.length} grado(s).`,
      creados,
      yaExistian,
    });
  } catch (err) {
    await conexion.query('ROLLBACK');
    throw err;
  } finally {
    conexion.release();
  }
});

module.exports = { listarGrados, listarSecciones, crearSeccion, listarCursos, crearCurso, crearCursoPorLote };
