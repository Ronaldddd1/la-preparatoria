const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');

async function verificarCupo(conexion, seccionId) {
  const { rows: seccionRows } = await conexion.query('SELECT capacidad FROM secciones WHERE id = $1', [seccionId]);
  const seccion = seccionRows[0];
  if (!seccion) throw new AppError('La seccion indicada no existe.', 400);

  const { rows: ocupadosRows } = await conexion.query(
    `SELECT COUNT(*)::int AS ocupados FROM matriculas WHERE seccion_id = $1 AND estado = 'activo'`,
    [seccionId]
  );
  if (ocupadosRows[0].ocupados >= seccion.capacidad) {
    throw new AppError('Esa seccion ya no tiene vacantes disponibles.', 409);
  }
}

const crearMatricula = asyncHandler(async (req, res) => {
  const {
    dni, nombres, apellidos, fechaNacimiento, sexo, direccion, telefono, email,
    apoderadoNombre, apoderadoTelefono, gradoId, seccionId, anioEscolar, montoPago, observaciones,
  } = req.body;

  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    await verificarCupo(conexion, seccionId);

    const { rows: existente } = await conexion.query('SELECT id FROM usuarios WHERE username = $1', [dni]);
    let usuarioId, alumnoId;

    if (existente.length > 0) {
      usuarioId = existente[0].id;
      const { rows: alumnoExistente } = await conexion.query('SELECT id FROM alumnos WHERE usuario_id = $1', [usuarioId]);
      if (alumnoExistente.length === 0) throw new AppError('Ese DNI ya esta en uso por otra cuenta.', 409);
      alumnoId = alumnoExistente[0].id;
    } else {
      const passwordHash = await bcrypt.hash(dni, 10);
      const { rows: usuarioResult } = await conexion.query(
        `INSERT INTO usuarios (username, password_hash, rol, debe_cambiar_password) VALUES ($1, $2, 'alumno', TRUE) RETURNING id`,
        [dni, passwordHash]
      );
      usuarioId = usuarioResult[0].id;

      const { rows: alumnoResult } = await conexion.query(
        `INSERT INTO alumnos (usuario_id, dni, nombres, apellidos, fecha_nacimiento, sexo, direccion,
         telefono, email, apoderado_nombre, apoderado_telefono)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [usuarioId, dni, nombres, apellidos, fechaNacimiento || null, sexo || null, direccion || null,
         telefono || null, email || null, apoderadoNombre || null, apoderadoTelefono || null]
      );
      alumnoId = alumnoResult[0].id;
    }

    const { rows: matriculaResult } = await conexion.query(
      `INSERT INTO matriculas (alumno_id, grado_id, seccion_id, anio_escolar, fecha_matricula, monto_pago, observaciones)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6) RETURNING id`,
      [alumnoId, gradoId, seccionId, anioEscolar, montoPago || 0, observaciones || null]
    );
    const matriculaId = matriculaResult[0].id;

    await conexion.query('COMMIT');

    await registrarAuditoria({
      usuarioId: req.usuario.id, accion: 'crear_matricula', entidad: 'matricula', entidadId: matriculaId,
      detalle: { dni, anioEscolar, gradoId, seccionId },
    });

    res.status(201).json({
      mensaje: 'Matricula registrada correctamente.',
      matriculaId, alumnoId,
      credencialesIniciales: existente.length === 0 ? { username: dni, password: dni } : null,
    });
  } catch (err) {
    await conexion.query('ROLLBACK');
    if (err.code === '23505') throw new AppError('Ese alumno ya tiene una matricula para ese anio escolar.', 409);
    throw err;
  } finally {
    conexion.release();
  }
});

const renovarMatricula = asyncHandler(async (req, res) => {
  const { alumnoId } = req.params;
  const { gradoId, seccionId, anioEscolar, montoPago, observaciones } = req.body;

  const { rows: alumnos } = await pool.query('SELECT id FROM alumnos WHERE id = $1', [alumnoId]);
  if (alumnos.length === 0) throw new AppError('Alumno no encontrado.', 404);

  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    await verificarCupo(conexion, seccionId);

    const { rows: result } = await conexion.query(
      `INSERT INTO matriculas (alumno_id, grado_id, seccion_id, anio_escolar, fecha_matricula, monto_pago, observaciones)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6) RETURNING id`,
      [alumnoId, gradoId, seccionId, anioEscolar, montoPago || 0, observaciones || null]
    );
    await conexion.query('COMMIT');

    await registrarAuditoria({
      usuarioId: req.usuario.id, accion: 'renovar_matricula', entidad: 'matricula', entidadId: result[0].id,
      detalle: { alumnoId: Number(alumnoId), anioEscolar, gradoId, seccionId },
    });

    res.status(201).json({ mensaje: 'Matricula renovada correctamente.', matriculaId: result[0].id });
  } catch (err) {
    await conexion.query('ROLLBACK');
    if (err.code === '23505') throw new AppError('Ese alumno ya tiene una matricula para ese anio escolar.', 409);
    throw err;
  } finally {
    conexion.release();
  }
});

const listarMatriculas = asyncHandler(async (req, res) => {
  const { anio, estado, gradoId } = req.query;
  let sql = `SELECT m.*, a.dni, a.nombres, a.apellidos, g.nombre AS grado_nombre, s.nombre AS seccion_nombre
             FROM matriculas m
             JOIN alumnos a ON a.id = m.alumno_id
             JOIN grados g ON g.id = m.grado_id
             JOIN secciones s ON s.id = m.seccion_id
             WHERE 1=1`;
  const params = [];
  if (anio) { params.push(anio); sql += ` AND m.anio_escolar = $${params.length}`; }
  if (estado) { params.push(estado); sql += ` AND m.estado = $${params.length}`; }
  if (gradoId) { params.push(gradoId); sql += ` AND m.grado_id = $${params.length}`; }
  sql += ' ORDER BY m.fecha_matricula DESC LIMIT 500';

  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

const miMatricula = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!alumnoId) throw new AppError('Esta cuenta no esta asociada a un alumno.', 400);
  const { rows } = await pool.query(
    `SELECT m.*, g.nombre AS grado_nombre, s.nombre AS seccion_nombre
     FROM matriculas m JOIN grados g ON g.id = m.grado_id JOIN secciones s ON s.id = m.seccion_id
     WHERE m.alumno_id = $1 ORDER BY m.anio_escolar DESC LIMIT 1`,
    [alumnoId]
  );
  res.json(rows[0] || null);
});

const historialMatricula = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT h.*, u.username AS registrado_por
     FROM matriculas_historial h LEFT JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.matricula_id = $1 ORDER BY h.fecha DESC, h.id DESC`,
    [id]
  );
  res.json(rows);
});

const actualizarMatricula = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { seccionId, estado, motivo, observaciones, montoPago } = req.body;

  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');

    const { rows: actuales } = await conexion.query('SELECT * FROM matriculas WHERE id = $1 FOR UPDATE', [id]);
    const actual = actuales[0];
    if (!actual) throw new AppError('Matricula no encontrada.', 404);

    const nuevaSeccion = seccionId || actual.seccion_id;
    const nuevoEstado = estado || actual.estado;

    if (nuevoEstado === 'activo' && (nuevaSeccion !== actual.seccion_id || actual.estado !== 'activo')) {
      await verificarCupo(conexion, nuevaSeccion);
    }
    if (estado && estado !== actual.estado && (estado === 'retirado' || estado === 'trasladado') && !motivo) {
      throw new AppError('Indica el motivo del retiro o traslado.', 400);
    }

    await conexion.query(
      `UPDATE matriculas SET seccion_id = $1, estado = $2, observaciones = COALESCE($3, observaciones),
       monto_pago = COALESCE($4, monto_pago) WHERE id = $5`,
      [nuevaSeccion, nuevoEstado, observaciones ?? null, montoPago ?? null, id]
    );

    if (estado && estado !== actual.estado) {
      await conexion.query(
        `INSERT INTO matriculas_historial (matricula_id, estado_anterior, estado_nuevo, motivo, fecha, usuario_id)
         VALUES ($1, $2, $3, $4, CURRENT_DATE, $5)`,
        [id, actual.estado, estado, motivo || null, req.usuario.id]
      );
    }

    await conexion.query('COMMIT');

    await registrarAuditoria({
      usuarioId: req.usuario.id, accion: 'actualizar_matricula', entidad: 'matricula', entidadId: Number(id),
      detalle: { estadoAnterior: actual.estado, estadoNuevo: nuevoEstado, motivo },
    });

    res.json({ mensaje: 'Matricula actualizada.' });
  } catch (err) {
    await conexion.query('ROLLBACK');
    throw err;
  } finally {
    conexion.release();
  }
});

module.exports = { crearMatricula, renovarMatricula, listarMatriculas, miMatricula, historialMatricula, actualizarMatricula };
