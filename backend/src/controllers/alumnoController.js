const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');
const { subirArchivo } = require('../utils/almacenamiento');

// El código QR de un alumno codifica su DNI: es lo que el lector de la
// página de Asistencia (docente) decodifica para marcarlo presente.
async function generarQrAlumno(alumno) {
  const qr = await QRCode.toDataURL(alumno.dni, { margin: 1, width: 300 });
  return { qr, dni: alumno.dni, nombres: alumno.nombres, apellidos: alumno.apellidos };
}

const listarAlumnos = asyncHandler(async (req, res) => {
  const { buscar, estado, gradoId, seccionId, anioEscolar } = req.query;
  const filtrandoPorMatricula = gradoId || seccionId || anioEscolar;

  let sql = `SELECT a.*, u.username, u.activo AS usuario_activo
             FROM alumnos a JOIN usuarios u ON u.id = a.usuario_id`;
  if (filtrandoPorMatricula) {
    sql += ` JOIN matriculas m ON m.alumno_id = a.id`;
  }
  sql += ' WHERE 1=1';
  const params = [];
  if (buscar) {
    params.push(`%${buscar}%`);
    sql += ` AND (a.dni ILIKE $${params.length} OR a.nombres ILIKE $${params.length} OR a.apellidos ILIKE $${params.length})`;
  }
  if (estado) { params.push(estado); sql += ` AND a.estado = $${params.length}`; }
  if (gradoId) { params.push(gradoId); sql += ` AND m.grado_id = $${params.length}`; }
  if (seccionId) { params.push(seccionId); sql += ` AND m.seccion_id = $${params.length}`; }
  if (anioEscolar) { params.push(anioEscolar); sql += ` AND m.anio_escolar = $${params.length}`; }
  sql += ' ORDER BY a.apellidos, a.nombres LIMIT 200';

  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

const obtenerAlumno = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT a.*, u.username FROM alumnos a JOIN usuarios u ON u.id = a.usuario_id WHERE a.id = $1`,
    [id]
  );
  if (rows.length === 0) throw new AppError('Alumno no encontrado.', 404);

  const { rows: matriculas } = await pool.query(
    `SELECT m.*, g.nombre AS grado_nombre, s.nombre AS seccion_nombre
     FROM matriculas m JOIN grados g ON g.id = m.grado_id JOIN secciones s ON s.id = m.seccion_id
     WHERE m.alumno_id = $1 ORDER BY m.anio_escolar DESC`,
    [id]
  );

  res.json({ ...rows[0], matriculas });
});

const actualizarAlumno = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombres, apellidos, fechaNacimiento, sexo, direccion, telefono, email,
          apoderadoNombre, apoderadoTelefono, estado } = req.body;

  const result = await pool.query(
    `UPDATE alumnos SET nombres=$1, apellidos=$2, fecha_nacimiento=$3, sexo=$4, direccion=$5,
     telefono=$6, email=$7, apoderado_nombre=$8, apoderado_telefono=$9, estado=$10 WHERE id=$11`,
    [nombres, apellidos, fechaNacimiento || null, sexo || null, direccion || null,
     telefono || null, email || null, apoderadoNombre || null, apoderadoTelefono || null,
     estado || 'activo', id]
  );
  if (result.rowCount === 0) throw new AppError('Alumno no encontrado.', 404);
  res.json({ mensaje: 'Datos del alumno actualizados.' });
});

const miPerfil = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  const { rows } = await pool.query('SELECT * FROM alumnos WHERE id = $1', [alumnoId]);
  if (rows.length === 0) throw new AppError('Perfil no encontrado.', 404);
  res.json(rows[0]);
});

const actualizarMiPerfil = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  const { direccion, telefono, email } = req.body;
  await pool.query('UPDATE alumnos SET direccion = $1, telefono = $2, email = $3 WHERE id = $4',
    [direccion || null, telefono || null, email || null, alumnoId]);
  res.json({ mensaje: 'Tus datos de contacto se actualizaron.' });
});

const resetearPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT * FROM alumnos WHERE id = $1', [id]);
  const alumno = rows[0];
  if (!alumno) throw new AppError('Alumno no encontrado.', 404);

  const passwordHash = await bcrypt.hash(alumno.dni, 10);
  await pool.query('UPDATE usuarios SET password_hash = $1, debe_cambiar_password = TRUE WHERE id = $2',
    [passwordHash, alumno.usuario_id]);

  await registrarAuditoria({ usuarioId: req.usuario.id, accion: 'resetear_password_alumno', entidad: 'alumno', entidadId: Number(id) });
  res.json({ mensaje: 'Contrasena reiniciada a su DNI.', credenciales: { password: alumno.dni } });
});

const miQr = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  const { rows } = await pool.query('SELECT dni, nombres, apellidos FROM alumnos WHERE id = $1', [alumnoId]);
  if (rows.length === 0) throw new AppError('Perfil no encontrado.', 404);
  res.json(await generarQrAlumno(rows[0]));
});

const qrPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query('SELECT dni, nombres, apellidos FROM alumnos WHERE id = $1', [id]);
  if (rows.length === 0) throw new AppError('Alumno no encontrado.', 404);
  res.json(await generarQrAlumno(rows[0]));
});

const subirMiFoto = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!req.file) throw new AppError('Selecciona una imagen.', 400);
  const subida = await subirArchivo(req.file, 'perfiles');
  await pool.query('UPDATE alumnos SET foto_url = $1 WHERE id = $2', [subida.url, alumnoId]);
  res.json({ mensaje: 'Foto de perfil actualizada.', fotoUrl: subida.url });
});

const subirFotoPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.file) throw new AppError('Selecciona una imagen.', 400);
  const subida = await subirArchivo(req.file, 'perfiles');
  const result = await pool.query('UPDATE alumnos SET foto_url = $1 WHERE id = $2', [subida.url, id]);
  if (result.rowCount === 0) throw new AppError('Alumno no encontrado.', 404);
  res.json({ mensaje: 'Foto de perfil actualizada.', fotoUrl: subida.url });
});

module.exports = {
  listarAlumnos, obtenerAlumno, actualizarAlumno, miPerfil, actualizarMiPerfil, resetearPassword,
  miQr, qrPorId, subirMiFoto, subirFotoPorId,
};
