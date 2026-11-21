const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const buscar = asyncHandler(async (req, res) => {
  const termino = (req.query.q || '').trim();
  if (termino.length < 1) {
    return res.json({ alumnos: [], docentes: [], avisos: [] });
  }
  const like = `%${termino}%`;

  const [alumnos, docentes, avisos] = await Promise.all([
    pool.query(
      `SELECT a.id, a.nombres, a.apellidos, a.dni,
              g.nombre AS grado_nombre, s.nombre AS seccion_nombre
       FROM alumnos a
       LEFT JOIN matriculas m ON m.alumno_id = a.id AND m.estado = 'activo'
       LEFT JOIN secciones s ON s.id = m.seccion_id
       LEFT JOIN grados g ON g.id = m.grado_id
       WHERE a.nombres ILIKE $1 OR a.apellidos ILIKE $1 OR a.dni ILIKE $1
       ORDER BY a.apellidos LIMIT 8`,
      [like]
    ),
    pool.query(
      `SELECT id, nombres, apellidos, dni, especialidad
       FROM docentes
       WHERE nombres ILIKE $1 OR apellidos ILIKE $1 OR dni ILIKE $1
       ORDER BY apellidos LIMIT 8`,
      [like]
    ),
    pool.query(
      `SELECT id, titulo, dirigido_a
       FROM avisos
       WHERE titulo ILIKE $1 OR contenido ILIKE $1
       ORDER BY created_at DESC LIMIT 8`,
      [like]
    ),
  ]);

  res.json({ alumnos: alumnos.rows, docentes: docentes.rows, avisos: avisos.rows });
});

module.exports = { buscar };
