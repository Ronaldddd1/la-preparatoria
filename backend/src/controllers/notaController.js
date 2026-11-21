const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');

async function verificarPermisoCurso(req, seccionId, cursoId) {
  if (req.usuario.rol === 'admin') return;
  const { rows } = await pool.query(
    'SELECT id FROM horarios WHERE seccion_id = $1 AND curso_id = $2 AND docente_id = $3 LIMIT 1',
    [seccionId, cursoId, req.usuario.docenteId]
  );
  if (rows.length === 0) throw new AppError('No dictas ese curso en esa seccion.', 403);
}

const COMPONENTES = ['promTareas', 'promPracticas', 'examen1', 'examen2'];

async function leerPesos() {
  const { rows } = await pool.query('SELECT peso_tareas, peso_practicas, peso_examen1, peso_examen2 FROM config_evaluacion WHERE id = 1');
  const r = rows[0] || { peso_tareas: 20, peso_practicas: 20, peso_examen1: 30, peso_examen2: 30 };
  return {
    pesoTareas: Number(r.peso_tareas), pesoPracticas: Number(r.peso_practicas),
    pesoExamen1: Number(r.peso_examen1), pesoExamen2: Number(r.peso_examen2),
  };
}

function calcularNota(c, p) {
  const total = c.promTareas * p.pesoTareas + c.promPracticas * p.pesoPracticas
    + c.examen1 * p.pesoExamen1 + c.examen2 * p.pesoExamen2;
  return Math.round(total) / 100; // un decimal (ej. 16.8)
}

const obtenerConfig = asyncHandler(async (req, res) => {
  res.json(await leerPesos());
});

const actualizarConfig = asyncHandler(async (req, res) => {
  const { pesoTareas, pesoPracticas, pesoExamen1, pesoExamen2 } = req.body;
  await pool.query(
    `UPDATE config_evaluacion SET peso_tareas = $1, peso_practicas = $2, peso_examen1 = $3, peso_examen2 = $4,
       actualizado_por = $5, actualizado_en = now() WHERE id = 1`,
    [pesoTareas, pesoPracticas, pesoExamen1, pesoExamen2, req.usuario.id]
  );
  await registrarAuditoria({
    usuarioId: req.usuario.id, accion: 'cambiar_ponderacion_notas', entidad: 'config_evaluacion', entidadId: 1,
    detalle: { pesoTareas, pesoPracticas, pesoExamen1, pesoExamen2 },
  });
  res.json({ mensaje: 'Ponderación actualizada. Se aplicará a las notas que se guarden desde ahora.' });
});

const listarPorSeccionYCurso = asyncHandler(async (req, res) => {
  const { seccionId, cursoId, anioEscolar, periodo } = req.query;
  if (!seccionId || !cursoId || !anioEscolar || !periodo) {
    throw new AppError('seccionId, cursoId, anioEscolar y periodo son obligatorios.', 400);
  }
  await verificarPermisoCurso(req, seccionId, cursoId);

  const { rows: alumnos } = await pool.query(
    `SELECT a.id AS alumno_id, a.dni, a.nombres, a.apellidos, n.nota, n.observacion,
            n.prom_tareas, n.prom_practicas, n.examen1, n.examen2
     FROM matriculas m
     JOIN alumnos a ON a.id = m.alumno_id
     LEFT JOIN notas n ON n.alumno_id = a.id AND n.curso_id = $1 AND n.anio_escolar = $2 AND n.periodo = $3
     WHERE m.seccion_id = $4 AND m.estado = 'activo'
     ORDER BY a.apellidos, a.nombres`,
    [cursoId, anioEscolar, periodo, seccionId]
  );
  res.json({ pesos: await leerPesos(), alumnos });
});

const DIAS_LIMITE_EDICION = 2;

const registrarNota = asyncHandler(async (req, res) => {
  const { alumnoId, cursoId, anioEscolar, periodo, observacion } = req.body;
  const conComponentes = COMPONENTES.every((k) => req.body[k] !== undefined && req.body[k] !== null && req.body[k] !== '');
  const componentes = conComponentes ? Object.fromEntries(COMPONENTES.map((k) => [k, Number(req.body[k])])) : null;
  // Con los 4 componentes la nota del bimestre se calcula con la ponderación
  // vigente; solo se acepta una nota directa si no se envían componentes.
  const nota = conComponentes ? calcularNota(componentes, await leerPesos()) : req.body.nota;
  if (nota === undefined || nota === null || nota === '') {
    throw new AppError('Ingresa los 4 componentes (tareas, prácticas, examen 1 y examen 2).', 400);
  }

  const { rows: matriculas } = await pool.query(
    `SELECT seccion_id FROM matriculas WHERE alumno_id = $1 AND anio_escolar = $2 LIMIT 1`,
    [alumnoId, anioEscolar]
  );
  if (matriculas.length === 0) throw new AppError('Ese alumno no tiene matricula para ese anio escolar.', 400);
  await verificarPermisoCurso(req, matriculas[0].seccion_id, cursoId);

  // Si la nota ya existe y pasaron mas de 2 dias desde que se registro, solo
  // el administrador puede modificarla (el docente ya no puede editarla).
  const { rows: existentes } = await pool.query(
    `SELECT id, created_at, nota, observacion FROM notas WHERE alumno_id = $1 AND curso_id = $2 AND anio_escolar = $3 AND periodo = $4`,
    [alumnoId, cursoId, anioEscolar, periodo]
  );
  let editandoFueraDePlazo = false;
  if (existentes.length > 0) {
    const antiguedadMs = Date.now() - new Date(existentes[0].created_at).getTime();
    const limiteMs = DIAS_LIMITE_EDICION * 24 * 60 * 60 * 1000;
    editandoFueraDePlazo = antiguedadMs > limiteMs;
    if (editandoFueraDePlazo && req.usuario.rol !== 'admin') {
      throw new AppError(
        `Esta nota ya no se puede modificar: pasaron mas de ${DIAS_LIMITE_EDICION} dias desde que se registro. Solo un administrador puede corregirla.`,
        403
      );
    }
  }

  // Si es una corrección (ya existía y el valor cambia), guarda el valor
  // anterior en el historial antes de sobrescribirlo.
  const existente = existentes[0];
  if (existente && (Number(existente.nota) !== Number(nota) || (existente.observacion || '') !== (observacion || ''))) {
    await pool.query(
      `INSERT INTO notas_historial (nota_id, nota_anterior, observacion_anterior, modificado_por)
       VALUES ($1, $2, $3, $4)`,
      [existente.id, existente.nota, existente.observacion, req.usuario.id]
    );
  }

  await pool.query(
    `INSERT INTO notas (alumno_id, curso_id, anio_escolar, periodo, nota, observacion, registrado_por,
                        prom_tareas, prom_practicas, examen1, examen2)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (alumno_id, curso_id, anio_escolar, periodo) DO UPDATE SET
       nota = EXCLUDED.nota, observacion = EXCLUDED.observacion, registrado_por = EXCLUDED.registrado_por,
       prom_tareas = EXCLUDED.prom_tareas, prom_practicas = EXCLUDED.prom_practicas,
       examen1 = EXCLUDED.examen1, examen2 = EXCLUDED.examen2`,
    [alumnoId, cursoId, anioEscolar, periodo, nota, observacion || null, req.usuario.id,
      componentes?.promTareas ?? null, componentes?.promPracticas ?? null, componentes?.examen1 ?? null, componentes?.examen2 ?? null]
  );

  if (editandoFueraDePlazo) {
    await registrarAuditoria({
      usuarioId: req.usuario.id,
      accion: 'nota_editada_fuera_de_plazo',
      entidad: 'notas',
      entidadId: alumnoId,
      detalle: { cursoId, anioEscolar, periodo, nota },
    });
  }

  res.json({ mensaje: 'Nota registrada.', nota });
});

// Vista completa: todos los alumnos de una sección, con TODOS sus cursos y
// TODOS los bimestres en una sola matriz (en vez de un curso+periodo a la
// vez). Pensado para que el admin revise el boletín completo de una sección.
const listarCompletoPorSeccion = asyncHandler(async (req, res) => {
  const { seccionId, anioEscolar } = req.query;
  if (!seccionId || !anioEscolar) {
    throw new AppError('seccionId y anioEscolar son obligatorios.', 400);
  }

  const { rows: alumnos } = await pool.query(
    `SELECT a.id AS alumno_id, a.nombres, a.apellidos
     FROM matriculas m
     JOIN alumnos a ON a.id = m.alumno_id
     WHERE m.seccion_id = $1 AND m.anio_escolar = $2 AND m.estado = 'activo'
     ORDER BY a.apellidos, a.nombres`,
    [seccionId, anioEscolar]
  );

  const { rows: notas } = await pool.query(
    `SELECT n.alumno_id, n.curso_id, n.periodo, n.nota
     FROM notas n
     JOIN matriculas m ON m.alumno_id = n.alumno_id
     WHERE m.seccion_id = $1 AND n.anio_escolar = $2 AND m.estado = 'activo'`,
    [seccionId, anioEscolar]
  );

  const porAlumno = {};
  for (const n of notas) {
    (porAlumno[n.alumno_id] ||= {})[`${n.curso_id}-${n.periodo}`] = Number(n.nota);
  }

  res.json(alumnos.map((a) => ({ ...a, notas: porAlumno[a.alumno_id] || {} })));
});

// Historial de correcciones de una nota puntual (alumno+curso+año+periodo).
const historialNota = asyncHandler(async (req, res) => {
  const { alumnoId, cursoId, anioEscolar, periodo } = req.query;
  if (!alumnoId || !cursoId || !anioEscolar || !periodo) {
    throw new AppError('alumnoId, cursoId, anioEscolar y periodo son obligatorios.', 400);
  }
  const { rows: notas } = await pool.query(
    'SELECT id FROM notas WHERE alumno_id = $1 AND curso_id = $2 AND anio_escolar = $3 AND periodo = $4',
    [alumnoId, cursoId, anioEscolar, periodo]
  );
  if (notas.length === 0) return res.json([]);

  const { rows } = await pool.query(
    `SELECT nh.nota_anterior, nh.observacion_anterior, nh.modificado_en, u.username AS modificado_por_username
     FROM notas_historial nh LEFT JOIN usuarios u ON u.id = nh.modificado_por
     WHERE nh.nota_id = $1 ORDER BY nh.modificado_en DESC`,
    [notas[0].id]
  );
  res.json(rows);
});

const misNotas = asyncHandler(async (req, res) => {
  const { alumnoId } = req.usuario;
  if (!alumnoId) throw new AppError('Esta cuenta no esta asociada a un alumno.', 400);

  const { rows } = await pool.query(
    `SELECT n.anio_escolar, n.periodo, n.nota, n.observacion, n.prom_tareas, n.prom_practicas, n.examen1, n.examen2, c.nombre AS curso_nombre
     FROM notas n JOIN cursos c ON c.id = n.curso_id
     WHERE n.alumno_id = $1 ORDER BY n.anio_escolar DESC, c.nombre, n.periodo`,
    [alumnoId]
  );
  res.json(rows);
});

module.exports = { obtenerConfig, actualizarConfig, listarPorSeccionYCurso, registrarNota, misNotas, historialNota, listarCompletoPorSeccion };
