const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');

const SQL_BASE = `
  SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fin, h.aula,
         c.id AS curso_id, c.nombre AS curso_nombre,
         s.id AS seccion_id, s.nombre AS seccion_nombre,
         g.nombre AS grado_nombre, g.nivel,
         d.id AS docente_id, d.nombres AS docente_nombres, d.apellidos AS docente_apellidos
  FROM horarios h
  JOIN cursos c ON c.id = h.curso_id
  JOIN secciones s ON s.id = h.seccion_id
  JOIN grados g ON g.id = s.grado_id
  LEFT JOIN docentes d ON d.id = h.docente_id
`;
const ORDEN_DIAS = `array_position(ARRAY['Lunes','Martes','Miercoles','Jueves','Viernes'], h.dia_semana), h.hora_inicio`;

const listarPorSeccion = asyncHandler(async (req, res) => {
  const { seccionId } = req.query;
  if (!seccionId) throw new AppError('seccionId es obligatorio.', 400);
  const { rows } = await pool.query(`${SQL_BASE} WHERE h.seccion_id = $1 ORDER BY ${ORDEN_DIAS}`, [seccionId]);
  res.json(rows);
});

const miHorario = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!alumnoId) throw new AppError('Esta cuenta no esta asociada a un alumno.', 400);

  const { rows: matriculas } = await pool.query(
    `SELECT seccion_id FROM matriculas WHERE alumno_id = $1 AND estado = 'activo' ORDER BY anio_escolar DESC LIMIT 1`,
    [alumnoId]
  );
  if (matriculas.length === 0) return res.json({ matriculado: false, horario: [] });

  const { rows } = await pool.query(`${SQL_BASE} WHERE h.seccion_id = $1 ORDER BY ${ORDEN_DIAS}`, [matriculas[0].seccion_id]);
  res.json({ matriculado: true, horario: rows });
});

const crearHorario = asyncHandler(async (req, res) => {
  const { seccionId, cursoId, docenteId, diaSemana, horaInicio, horaFin, aula } = req.body;

  const { rows: choque } = await pool.query(
    `SELECT id FROM horarios WHERE seccion_id = $1 AND dia_semana = $2 AND NOT (hora_fin <= $3 OR hora_inicio >= $4)`,
    [seccionId, diaSemana, horaInicio, horaFin]
  );
  if (choque.length > 0) throw new AppError('Ese horario se cruza con otra clase de la misma seccion.', 409);

  const { rows: result } = await pool.query(
    `INSERT INTO horarios (seccion_id, curso_id, docente_id, dia_semana, hora_inicio, hora_fin, aula)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [seccionId, cursoId, docenteId || null, diaSemana, horaInicio, horaFin, aula || null]
  );

  await registrarAuditoria({
    usuarioId: req.usuario.id, accion: 'crear_horario', entidad: 'horario', entidadId: result[0].id,
    detalle: { seccionId, cursoId, diaSemana, horaInicio, horaFin },
  });

  res.status(201).json({ id: result[0].id });
});

const actualizarHorario = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cursoId, docenteId, diaSemana, horaInicio, horaFin, aula } = req.body;

  const result = await pool.query(
    `UPDATE horarios SET curso_id = $1, docente_id = $2, dia_semana = $3, hora_inicio = $4, hora_fin = $5, aula = $6 WHERE id = $7`,
    [cursoId, docenteId || null, diaSemana, horaInicio, horaFin, aula || null, id]
  );
  if (result.rowCount === 0) throw new AppError('Horario no encontrado.', 404);
  res.json({ mensaje: 'Horario actualizado.' });
});

const clonarHorario = asyncHandler(async (req, res) => {
  const { seccionOrigenId, seccionDestinoId } = req.body;
  if (!seccionOrigenId || !seccionDestinoId) throw new AppError('Selecciona la sección de origen y de destino.', 400);
  if (Number(seccionOrigenId) === Number(seccionDestinoId)) {
    throw new AppError('La sección de origen y destino no pueden ser la misma.', 400);
  }

  const { rows: clasesOrigen } = await pool.query(
    'SELECT curso_id, docente_id, dia_semana, hora_inicio, hora_fin, aula FROM horarios WHERE seccion_id = $1',
    [seccionOrigenId]
  );
  if (clasesOrigen.length === 0) throw new AppError('La sección de origen no tiene un horario para copiar.', 404);

  let copiadas = 0;
  const omitidas = [];
  for (const clase of clasesOrigen) {
    // eslint-disable-next-line no-await-in-loop
    const { rows: choque } = await pool.query(
      `SELECT id FROM horarios WHERE seccion_id = $1 AND dia_semana = $2 AND NOT (hora_fin <= $3 OR hora_inicio >= $4)`,
      [seccionDestinoId, clase.dia_semana, clase.hora_inicio, clase.hora_fin]
    );
    if (choque.length > 0) {
      omitidas.push(`${clase.dia_semana} ${clase.hora_inicio}`);
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    await pool.query(
      `INSERT INTO horarios (seccion_id, curso_id, docente_id, dia_semana, hora_inicio, hora_fin, aula)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [seccionDestinoId, clase.curso_id, clase.docente_id, clase.dia_semana, clase.hora_inicio, clase.hora_fin, clase.aula]
    );
    copiadas += 1;
  }

  await registrarAuditoria({
    usuarioId: req.usuario.id, accion: 'clonar_horario', entidad: 'horario',
    detalle: { seccionOrigenId, seccionDestinoId, copiadas, omitidas: omitidas.length },
  });

  res.json({ mensaje: `Se copiaron ${copiadas} clase(s).`, copiadas, omitidas });
});

const eliminarHorario = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM horarios WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new AppError('Horario no encontrado.', 404);
  await registrarAuditoria({ usuarioId: req.usuario.id, accion: 'eliminar_horario', entidad: 'horario', entidadId: Number(id) });
  res.json({ mensaje: 'Horario eliminado.' });
});

module.exports = { listarPorSeccion, miHorario, crearHorario, actualizarHorario, clonarHorario, eliminarHorario };
