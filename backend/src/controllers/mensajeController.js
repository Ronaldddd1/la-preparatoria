const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { subirArchivo } = require('../utils/almacenamiento');

// Verifica que el alumno tenga (o haya tenido) una matrícula activa en la
// sección de ese horario, o que el docente esté asignado a ese horario.
async function verificarAcceso(req, horarioId, alumnoId) {
  const { rows: horarios } = await pool.query(
    `SELECT h.*, c.nombre AS curso_nombre, s.nombre AS seccion_nombre
     FROM horarios h JOIN cursos c ON c.id = h.curso_id JOIN secciones s ON s.id = h.seccion_id
     WHERE h.id = $1`,
    [horarioId]
  );
  const horario = horarios[0];
  if (!horario) throw new AppError('La clase indicada no existe.', 404);

  if (req.usuario.rol === 'docente') {
    if (horario.docente_id !== req.usuario.docenteId) throw new AppError('Esta clase no está asignada a tu cuenta.', 403);
  } else if (req.usuario.rol === 'alumno') {
    if (Number(alumnoId) !== req.usuario.alumnoId) throw new AppError('No puedes ver la conversación de otro alumno.', 403);
    const { rows: matriculas } = await pool.query(
      `SELECT 1 FROM matriculas WHERE alumno_id = $1 AND seccion_id = $2`,
      [alumnoId, horario.seccion_id]
    );
    if (matriculas.length === 0) throw new AppError('No tienes clases en esa sección.', 403);
  } else {
    throw new AppError('No tienes permiso para esta acción.', 403);
  }
  return horario;
}

const listarConversacion = asyncHandler(async (req, res) => {
  const { horarioId } = req.params;
  const alumnoId = req.usuario.rol === 'alumno' ? req.usuario.alumnoId : req.query.alumnoId;
  if (!alumnoId) throw new AppError('alumnoId es obligatorio.', 400);

  const horario = await verificarAcceso(req, horarioId, alumnoId);

  const { rows: mensajes } = await pool.query(
    `SELECT m.*, u.username AS remitente_username, u.rol AS remitente_rol
     FROM mensajes m JOIN usuarios u ON u.id = m.remitente_id
     WHERE m.horario_id = $1 AND m.alumno_id = $2
     ORDER BY m.creado_en ASC LIMIT 200`,
    [horarioId, alumnoId]
  );
  res.json({ horario, mensajes });
});

const enviarMensaje = asyncHandler(async (req, res) => {
  const { horarioId, contenido } = req.body;
  const alumnoId = req.usuario.rol === 'alumno' ? req.usuario.alumnoId : req.body.alumnoId;
  if (!horarioId || !alumnoId) throw new AppError('horarioId y alumnoId son obligatorios.', 400);
  if (!contenido?.trim() && !req.file) throw new AppError('Escribe un mensaje o adjunta un archivo.', 400);

  await verificarAcceso(req, horarioId, alumnoId);

  let archivoUrl = null;
  let archivoNombre = null;
  if (req.file) {
    const subida = await subirArchivo(req.file, 'mensajes');
    archivoUrl = subida.url;
    archivoNombre = subida.nombre;
  }

  const { rows: result } = await pool.query(
    `INSERT INTO mensajes (horario_id, alumno_id, remitente_id, contenido, archivo_url, archivo_nombre)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, creado_en`,
    [horarioId, alumnoId, req.usuario.id, contenido?.trim() || '', archivoUrl, archivoNombre]
  );

  res.status(201).json({ id: result[0].id, creadoEn: result[0].creado_en });
});

const listarConversacionesDocente = asyncHandler(async (req, res) => {
  const { docenteId } = req.usuario;
  if (!docenteId) throw new AppError('Esta cuenta no esta asociada a un docente.', 400);

  const { rows } = await pool.query(
    `SELECT DISTINCT ON (m.horario_id, m.alumno_id)
            m.horario_id, m.alumno_id, a.nombres, a.apellidos,
            c.nombre AS curso_nombre, s.nombre AS seccion_nombre,
            m.contenido AS ultimo_mensaje, m.creado_en AS ultima_fecha
     FROM mensajes m
     JOIN horarios h ON h.id = m.horario_id
     JOIN cursos c ON c.id = h.curso_id
     JOIN secciones s ON s.id = h.seccion_id
     JOIN alumnos a ON a.id = m.alumno_id
     WHERE h.docente_id = $1
     ORDER BY m.horario_id, m.alumno_id, m.creado_en DESC`,
    [docenteId]
  );
  rows.sort((a, b) => new Date(b.ultima_fecha) - new Date(a.ultima_fecha));
  res.json(rows);
});

module.exports = { listarConversacion, enviarMensaje, listarConversacionesDocente };
