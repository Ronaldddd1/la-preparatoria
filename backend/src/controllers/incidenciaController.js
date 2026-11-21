const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');

const crear = asyncHandler(async (req, res) => {
  const { alumnoId, tipo, descripcion } = req.body;

  const { rows: alumnos } = await pool.query('SELECT id FROM alumnos WHERE id = $1', [alumnoId]);
  if (alumnos.length === 0) throw new AppError('Alumno no encontrado.', 404);

  const { rows } = await pool.query(
    `INSERT INTO incidencias (alumno_id, tipo, descripcion, registrado_por) VALUES ($1, $2, $3, $4) RETURNING id, creado_en`,
    [alumnoId, tipo, descripcion, req.usuario.id]
  );

  await registrarAuditoria({ usuarioId: req.usuario.id, accion: 'crear_incidencia', entidad: 'alumno', entidadId: Number(alumnoId), detalle: { tipo } });
  res.status(201).json({ id: rows[0].id, mensaje: 'Incidencia registrada.' });
});

// Listado para admin/docente, con filtro opcional por alumno.
const listar = asyncHandler(async (req, res) => {
  const { alumnoId, tipo } = req.query;
  let sql = `SELECT i.*, a.dni, a.nombres, a.apellidos, u.username AS registrado_por_username
             FROM incidencias i
             JOIN alumnos a ON a.id = i.alumno_id
             LEFT JOIN usuarios u ON u.id = i.registrado_por
             WHERE 1=1`;
  const params = [];
  if (alumnoId) { params.push(alumnoId); sql += ` AND i.alumno_id = $${params.length}`; }
  if (tipo) { params.push(tipo); sql += ` AND i.tipo = $${params.length}`; }
  sql += ' ORDER BY i.creado_en DESC LIMIT 200';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

// El alumno solo ve las suyas.
const misIncidencias = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!alumnoId) throw new AppError('Esta cuenta no esta asociada a un alumno.', 400);
  const { rows } = await pool.query(
    'SELECT id, tipo, descripcion, creado_en FROM incidencias WHERE alumno_id = $1 ORDER BY creado_en DESC',
    [alumnoId]
  );
  res.json(rows);
});

const eliminar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM incidencias WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new AppError('Incidencia no encontrada.', 404);
  res.json({ mensaje: 'Incidencia eliminada.' });
});

module.exports = { crear, listar, misIncidencias, eliminar };
