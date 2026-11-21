const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');
const { subirArchivo } = require('../utils/almacenamiento');

const listarDocentes = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT d.*, u.username, u.activo AS usuario_activo
     FROM docentes d LEFT JOIN usuarios u ON u.id = d.usuario_id ORDER BY d.apellidos`
  );
  res.json(rows);
});

const crearDocente = asyncHandler(async (req, res) => {
  const { dni, nombres, apellidos, especialidad } = req.body;
  try {
    const { rows: result } = await pool.query(
      'INSERT INTO docentes (dni, nombres, apellidos, especialidad) VALUES ($1, $2, $3, $4) RETURNING id',
      [dni || null, nombres, apellidos, especialidad || null]
    );
    res.status(201).json({ id: result[0].id });
  } catch (err) {
    if (err.code === '23505') throw new AppError('Ya existe un docente con ese DNI.', 409);
    throw err;
  }
});

const actualizarDocente = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dni, nombres, apellidos, especialidad } = req.body;
  try {
    const result = await pool.query(
      'UPDATE docentes SET dni = $1, nombres = $2, apellidos = $3, especialidad = $4 WHERE id = $5',
      [dni || null, nombres, apellidos, especialidad || null, id]
    );
    if (result.rowCount === 0) throw new AppError('Docente no encontrado.', 404);
    res.json({ mensaje: 'Datos del docente actualizados.' });
  } catch (err) {
    if (err.code === '23505') throw new AppError('Ya existe un docente con ese DNI.', 409);
    throw err;
  }
});

const crearCuentaDocente = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: docentes } = await pool.query('SELECT * FROM docentes WHERE id = $1', [id]);
  const docente = docentes[0];
  if (!docente) throw new AppError('Docente no encontrado.', 404);
  if (docente.usuario_id) throw new AppError('Este docente ya tiene una cuenta de acceso.', 409);
  if (!docente.dni) throw new AppError('Registra primero el DNI del docente para crear su cuenta.', 400);

  const { rows: existente } = await pool.query('SELECT id FROM usuarios WHERE username = $1', [docente.dni]);
  if (existente.length > 0) throw new AppError('Ese DNI ya esta en uso por otra cuenta.', 409);

  const passwordHash = await bcrypt.hash(docente.dni, 10);
  const { rows: usuarioResult } = await pool.query(
    `INSERT INTO usuarios (username, password_hash, rol, debe_cambiar_password) VALUES ($1, $2, 'docente', TRUE) RETURNING id`,
    [docente.dni, passwordHash]
  );
  await pool.query('UPDATE docentes SET usuario_id = $1 WHERE id = $2', [usuarioResult[0].id, id]);

  await registrarAuditoria({ usuarioId: req.usuario.id, accion: 'crear_cuenta_docente', entidad: 'docente', entidadId: Number(id) });

  res.status(201).json({ mensaje: 'Cuenta de acceso creada.', credenciales: { username: docente.dni, password: docente.dni } });
});

const resetearPasswordDocente = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows: docentes } = await pool.query('SELECT * FROM docentes WHERE id = $1', [id]);
  const docente = docentes[0];
  if (!docente) throw new AppError('Docente no encontrado.', 404);
  if (!docente.usuario_id) throw new AppError('Este docente no tiene una cuenta de acceso todavia.', 400);

  const passwordHash = await bcrypt.hash(docente.dni, 10);
  await pool.query('UPDATE usuarios SET password_hash = $1, debe_cambiar_password = TRUE WHERE id = $2', [passwordHash, docente.usuario_id]);

  await registrarAuditoria({ usuarioId: req.usuario.id, accion: 'resetear_password_docente', entidad: 'docente', entidadId: Number(id) });
  res.json({ mensaje: 'Contrasena reiniciada a su DNI.', credenciales: { password: docente.dni } });
});

const misClases = asyncHandler(async (req, res) => {
  const { docenteId } = req.usuario;
  if (!docenteId) throw new AppError('Esta cuenta no esta asociada a un docente.', 400);

  const { rows } = await pool.query(
    `SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fin, h.aula,
            c.id AS curso_id, c.nombre AS curso_nombre,
            s.id AS seccion_id, s.nombre AS seccion_nombre,
            g.nombre AS grado_nombre, g.nivel
     FROM horarios h
     JOIN cursos c ON c.id = h.curso_id
     JOIN secciones s ON s.id = h.seccion_id
     JOIN grados g ON g.id = s.grado_id
     WHERE h.docente_id = $1
     ORDER BY array_position(ARRAY['Lunes','Martes','Miercoles','Jueves','Viernes'], h.dia_semana), h.hora_inicio`,
    [docenteId]
  );
  res.json(rows);
});

// Secciones distintas donde el docente tiene al menos una clase asignada.
// Se usa para elegir la sección al tomar asistencia diaria (que ya no es
// por curso, sino una vez al día por toda la sección).
const misSecciones = asyncHandler(async (req, res) => {
  const { docenteId } = req.usuario;
  if (!docenteId) throw new AppError('Esta cuenta no esta asociada a un docente.', 400);

  const { rows } = await pool.query(
    `SELECT DISTINCT s.id AS seccion_id, s.nombre AS seccion_nombre, g.nombre AS grado_nombre, g.nivel, g.orden
     FROM horarios h
     JOIN secciones s ON s.id = h.seccion_id
     JOIN grados g ON g.id = s.grado_id
     WHERE h.docente_id = $1
     ORDER BY g.orden, s.nombre`,
    [docenteId]
  );
  res.json(rows);
});

const subirFoto = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!req.file) throw new AppError('Selecciona una imagen.', 400);
  const subida = await subirArchivo(req.file, 'perfiles');
  const result = await pool.query('UPDATE docentes SET foto_url = $1 WHERE id = $2', [subida.url, id]);
  if (result.rowCount === 0) throw new AppError('Docente no encontrado.', 404);
  res.json({ mensaje: 'Foto de perfil actualizada.', fotoUrl: subida.url });
});

module.exports = {
  listarDocentes, crearDocente, actualizarDocente, crearCuentaDocente, resetearPasswordDocente,
  misClases, misSecciones, subirFoto,
};
