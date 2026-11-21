const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');

const listarAvisos = asyncHandler(async (req, res) => {
  const { rol } = req.usuario;
  let destinatarios = ['todos'];
  if (rol === 'alumno') destinatarios.push('alumnos');
  if (rol === 'docente') destinatarios.push('docentes');
  if (rol === 'admin') destinatarios = ['todos', 'alumnos', 'docentes'];

  const { rows } = await pool.query(
    `SELECT av.*, u.username AS publicado_por_username
     FROM avisos av LEFT JOIN usuarios u ON u.id = av.publicado_por
     WHERE av.dirigido_a = ANY($1)
     ORDER BY av.created_at DESC LIMIT 100`,
    [destinatarios]
  );
  res.json(rows);
});

const crearAviso = asyncHandler(async (req, res) => {
  const { titulo, contenido, dirigidoA } = req.body;
  const { rows: result } = await pool.query(
    'INSERT INTO avisos (titulo, contenido, dirigido_a, publicado_por) VALUES ($1, $2, $3, $4) RETURNING id',
    [titulo, contenido, dirigidoA, req.usuario.id]
  );

  await registrarAuditoria({ usuarioId: req.usuario.id, accion: 'crear_aviso', entidad: 'aviso', entidadId: result[0].id });
  res.status(201).json({ id: result[0].id });
});

// Los comentarios de un aviso son visibles para cualquiera que pueda ver
// el aviso (no se vuelve a filtrar por dirigido_a: si ya lo ves, puedes
// leer y escribir en su hilo).
const listarComentarios = asyncHandler(async (req, res) => {
  const { avisoId } = req.params;
  const { rows } = await pool.query(
    `SELECT ac.*, u.username, u.rol
     FROM avisos_comentarios ac LEFT JOIN usuarios u ON u.id = ac.usuario_id
     WHERE ac.aviso_id = $1 ORDER BY ac.creado_en`,
    [avisoId]
  );
  res.json(rows);
});

const comentar = asyncHandler(async (req, res) => {
  const { avisoId } = req.params;
  const { contenido } = req.body;
  if (!contenido || !contenido.trim()) throw new AppError('Escribe un comentario.', 400);

  const { rows: avisos } = await pool.query('SELECT id FROM avisos WHERE id = $1', [avisoId]);
  if (avisos.length === 0) throw new AppError('Aviso no encontrado.', 404);

  const { rows } = await pool.query(
    'INSERT INTO avisos_comentarios (aviso_id, usuario_id, contenido) VALUES ($1, $2, $3) RETURNING id, creado_en',
    [avisoId, req.usuario.id, contenido.trim().slice(0, 500)]
  );
  res.status(201).json({ id: rows[0].id, creado_en: rows[0].creado_en });
});

module.exports = { listarAvisos, crearAviso, listarComentarios, comentar };
