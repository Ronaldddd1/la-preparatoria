const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { subirArchivo } = require('../utils/almacenamiento');
const { registrarAuditoria } = require('../utils/auditoria');

const solicitar = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!alumnoId) throw new AppError('Esta cuenta no esta asociada a un alumno.', 400);

  const { asistenciaId, comentario } = req.body;
  if (!asistenciaId) throw new AppError('Selecciona la falta que quieres justificar.', 400);

  const { rows: asistencias } = await pool.query(
    'SELECT * FROM asistencias WHERE id = $1 AND alumno_id = $2',
    [asistenciaId, alumnoId]
  );
  const asistencia = asistencias[0];
  if (!asistencia) throw new AppError('Esa falta no existe o no te pertenece.', 404);
  if (asistencia.estado !== 'falta') throw new AppError('Solo se pueden justificar registros marcados como falta.', 400);

  let archivoUrl = null;
  let archivoNombre = null;
  if (req.file) {
    const subida = await subirArchivo(req.file, 'justificaciones');
    archivoUrl = subida.url;
    archivoNombre = subida.nombre;
  }

  const { rows: result } = await pool.query(
    `INSERT INTO justificaciones_falta (asistencia_id, alumno_id, comentario, archivo_url, archivo_nombre)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [asistenciaId, alumnoId, comentario || null, archivoUrl, archivoNombre]
  );

  res.status(201).json({ id: result[0].id, mensaje: 'Solicitud de justificación enviada. Un administrador la revisará.' });
});

const misJustificaciones = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!alumnoId) throw new AppError('Esta cuenta no esta asociada a un alumno.', 400);

  const { rows } = await pool.query(
    `SELECT jf.*, asi.fecha
     FROM justificaciones_falta jf
     JOIN asistencias asi ON asi.id = jf.asistencia_id
     WHERE jf.alumno_id = $1 ORDER BY jf.creado_en DESC`,
    [alumnoId]
  );
  res.json(rows);
});

const listar = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  let sql = `SELECT jf.*, asi.fecha, a.dni, a.nombres, a.apellidos
             FROM justificaciones_falta jf
             JOIN asistencias asi ON asi.id = jf.asistencia_id
             JOIN alumnos a ON a.id = jf.alumno_id
             WHERE 1=1`;
  const params = [];
  if (estado) { params.push(estado); sql += ` AND jf.estado = $${params.length}`; }
  sql += ' ORDER BY jf.creado_en DESC LIMIT 100';

  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

const resolver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!['aprobado', 'rechazado'].includes(estado)) throw new AppError('Estado invalido.', 400);

  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    const { rows } = await conexion.query('SELECT * FROM justificaciones_falta WHERE id = $1 FOR UPDATE', [id]);
    const justificacion = rows[0];
    if (!justificacion) throw new AppError('Justificación no encontrada.', 404);
    if (justificacion.estado !== 'pendiente') throw new AppError('Esta justificación ya fue resuelta.', 409);

    await conexion.query(
      'UPDATE justificaciones_falta SET estado = $1, resuelto_por = $2, resuelto_en = now() WHERE id = $3',
      [estado, req.usuario.id, id]
    );
    if (estado === 'aprobado') {
      await conexion.query("UPDATE asistencias SET estado = 'justificado' WHERE id = $1", [justificacion.asistencia_id]);
    }
    await conexion.query('COMMIT');
  } catch (err) {
    await conexion.query('ROLLBACK');
    throw err;
  } finally {
    conexion.release();
  }

  await registrarAuditoria({ usuarioId: req.usuario.id, accion: `justificacion_${estado}`, entidad: 'justificacion_falta', entidadId: Number(id) });
  res.json({ mensaje: estado === 'aprobado' ? 'Justificación aprobada. La falta ahora figura como justificada.' : 'Justificación rechazada.' });
});

module.exports = { solicitar, misJustificaciones, listar, resolver };
