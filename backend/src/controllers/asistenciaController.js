const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');
const { feriadoEnFecha } = require('./calendarioController');

// Verifica que el usuario tenga permiso para tomar/ver asistencia de una
// sección: el admin puede con cualquiera, el docente solo con secciones
// donde tiene al menos una clase asignada (horario).
async function verificarPermisoSeccion(req, seccionId) {
  const { rows } = await pool.query(
    `SELECT s.*, g.nombre AS grado_nombre, g.nivel
     FROM secciones s JOIN grados g ON g.id = s.grado_id
     WHERE s.id = $1`,
    [seccionId]
  );
  const seccion = rows[0];
  if (!seccion) throw new AppError('La sección indicada no existe.', 404);

  if (req.usuario.rol === 'docente') {
    const { rows: horarios } = await pool.query(
      'SELECT 1 FROM horarios WHERE seccion_id = $1 AND docente_id = $2 LIMIT 1',
      [seccionId, req.usuario.docenteId]
    );
    if (horarios.length === 0) throw new AppError('No tienes clases asignadas en esta sección.', 403);
  }
  return seccion;
}

const listarPorSeccionYFecha = asyncHandler(async (req, res) => {
  const { seccionId, fecha } = req.query;
  if (!seccionId || !fecha) throw new AppError('seccionId y fecha son obligatorios.', 400);
  const seccion = await verificarPermisoSeccion(req, seccionId);

  const { rows: alumnos } = await pool.query(
    `SELECT a.id AS alumno_id, a.dni, a.nombres, a.apellidos, asi.estado, asi.observacion
     FROM matriculas m
     JOIN alumnos a ON a.id = m.alumno_id
     LEFT JOIN asistencias asi ON asi.alumno_id = a.id AND asi.seccion_id = $1 AND asi.fecha = $2
     WHERE m.seccion_id = $3 AND m.estado = 'activo'
     ORDER BY a.apellidos, a.nombres`,
    [seccionId, fecha, seccion.id]
  );
  res.json({ seccion, alumnos });
});

const registrarAsistencia = asyncHandler(async (req, res) => {
  const { seccionId, fecha, registros } = req.body;
  await verificarPermisoSeccion(req, seccionId);

  const feriado = await feriadoEnFecha(fecha);
  if (feriado) throw new AppError(`No se puede registrar asistencia: ${fecha} es un día no laborable (${feriado.titulo}).`, 400);

  const conexion = await pool.connect();
  try {
    await conexion.query('BEGIN');
    for (const r of registros) {
      await conexion.query(
        `INSERT INTO asistencias (seccion_id, alumno_id, fecha, estado, observacion, registrado_por)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (seccion_id, alumno_id, fecha) WHERE seccion_id IS NOT NULL DO UPDATE SET
           estado = EXCLUDED.estado, observacion = EXCLUDED.observacion, registrado_por = EXCLUDED.registrado_por`,
        [seccionId, r.alumnoId, fecha, r.estado, r.observacion || null, req.usuario.id]
      );
    }
    await conexion.query('COMMIT');
  } catch (err) {
    await conexion.query('ROLLBACK');
    throw err;
  } finally {
    conexion.release();
  }

  await registrarAuditoria({
    usuarioId: req.usuario.id,
    accion: 'registrar_asistencia',
    entidad: 'seccion',
    entidadId: Number(seccionId),
    detalle: { fecha, alumnos: registros.length },
  });
  res.json({ mensaje: 'Asistencia registrada.' });
});

// Marca a un solo alumno como presente al escanear su código QR (que
// codifica su DNI). Pensado para acelerar el pase de lista.
const marcarPorQr = asyncHandler(async (req, res) => {
  const { seccionId, fecha, dni } = req.body;
  const seccion = await verificarPermisoSeccion(req, seccionId);

  const feriado = await feriadoEnFecha(fecha);
  if (feriado) throw new AppError(`No se puede registrar asistencia: ${fecha} es un día no laborable (${feriado.titulo}).`, 400);

  const { rows: alumnos } = await pool.query(
    `SELECT a.id, a.nombres, a.apellidos FROM alumnos a
     JOIN matriculas m ON m.alumno_id = a.id
     WHERE a.dni = $1 AND m.seccion_id = $2 AND m.estado = 'activo'`,
    [dni, seccion.id]
  );
  const alumno = alumnos[0];
  if (!alumno) throw new AppError('Ese código no corresponde a un alumno matriculado en esta sección.', 404);

  await pool.query(
    `INSERT INTO asistencias (seccion_id, alumno_id, fecha, estado, registrado_por)
     VALUES ($1, $2, $3, 'presente', $4)
     ON CONFLICT (seccion_id, alumno_id, fecha) WHERE seccion_id IS NOT NULL DO UPDATE SET estado = 'presente', registrado_por = EXCLUDED.registrado_por`,
    [seccionId, alumno.id, fecha, req.usuario.id]
  );

  res.json({ mensaje: 'Asistencia marcada.', alumno: { id: alumno.id, nombres: alumno.nombres, apellidos: alumno.apellidos } });
});

const miAsistencia = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!alumnoId) throw new AppError('Esta cuenta no esta asociada a un alumno.', 400);

  const { rows } = await pool.query(
    `SELECT asi.id, asi.fecha, asi.estado, asi.observacion,
            jf.estado AS justificacion_estado
     FROM asistencias asi
     LEFT JOIN justificaciones_falta jf ON jf.asistencia_id = asi.id
     WHERE asi.alumno_id = $1 ORDER BY asi.fecha DESC LIMIT 200`,
    [alumnoId]
  );
  res.json(rows);
});

// Contador de asistencia (presente/tardanza/falta/justificado) por alumno,
// para mostrar un resumen en vez de solo el listado crudo.
async function resumenPorAlumno(alumnoId, anioEscolar) {
  let sql = `SELECT estado, COUNT(*) AS total FROM asistencias WHERE alumno_id = $1`;
  const params = [alumnoId];
  if (anioEscolar) {
    params.push(anioEscolar);
    sql += ` AND EXTRACT(YEAR FROM fecha) = $${params.length}`;
  }
  sql += ' GROUP BY estado';
  const { rows } = await pool.query(sql, params);
  const resumen = { presente: 0, tardanza: 0, falta: 0, justificado: 0, total: 0 };
  for (const r of rows) {
    resumen[r.estado] = Number(r.total);
    resumen.total += Number(r.total);
  }
  return resumen;
}

const miResumenAsistencia = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!alumnoId) throw new AppError('Esta cuenta no esta asociada a un alumno.', 400);
  const { anioEscolar } = req.query;
  res.json(await resumenPorAlumno(alumnoId, anioEscolar));
});

const resumenPorAlumnoId = asyncHandler(async (req, res) => {
  const { alumnoId } = req.params;
  const { anioEscolar } = req.query;
  res.json(await resumenPorAlumno(alumnoId, anioEscolar));
});

// Resumen de asistencia de toda una seccion (para el docente/admin), con el
// conteo de cada alumno matriculado en esa seccion.
const resumenPorSeccion = asyncHandler(async (req, res) => {
  const { seccionId } = req.params;
  const { anioEscolar } = req.query;
  const { rows: alumnos } = await pool.query(
    `SELECT a.id, a.dni, a.nombres, a.apellidos
     FROM matriculas m JOIN alumnos a ON a.id = m.alumno_id
     WHERE m.seccion_id = $1 AND m.estado = 'activo'
     ORDER BY a.apellidos, a.nombres`,
    [seccionId]
  );
  const resultado = [];
  for (const a of alumnos) {
    const resumen = await resumenPorAlumno(a.id, anioEscolar);
    resultado.push({ alumnoId: a.id, dni: a.dni, nombres: a.nombres, apellidos: a.apellidos, ...resumen });
  }
  res.json(resultado);
});

module.exports = {
  listarPorSeccionYFecha,
  registrarAsistencia,
  marcarPorQr,
  miAsistencia,
  miResumenAsistencia,
  resumenPorAlumnoId,
  resumenPorSeccion,
};
