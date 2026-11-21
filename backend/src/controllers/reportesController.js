const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { aCsv } = require('../utils/csv');
const { enviarXlsx } = require('../utils/xlsx');

const constanciaMatricula = asyncHandler(async (req, res) => {
  const { alumnoId } = req.params;
  if (req.usuario.rol === 'alumno' && Number(alumnoId) !== req.usuario.alumnoId) {
    throw new AppError('Solo puedes descargar tu propia constancia.', 403);
  }

  const { rows: alumnos } = await pool.query('SELECT * FROM alumnos WHERE id = $1', [alumnoId]);
  const alumno = alumnos[0];
  if (!alumno) throw new AppError('Alumno no encontrado.', 404);

  const { rows: matriculas } = await pool.query(
    `SELECT m.*, g.nombre AS grado_nombre, g.nivel, s.nombre AS seccion_nombre
     FROM matriculas m JOIN grados g ON g.id = m.grado_id JOIN secciones s ON s.id = m.seccion_id
     WHERE m.alumno_id = $1 AND m.estado = 'activo' ORDER BY m.anio_escolar DESC LIMIT 1`,
    [alumnoId]
  );
  const matricula = matriculas[0];
  if (!matricula) throw new AppError('Este alumno no tiene una matricula activa.', 404);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="constancia-${alumno.dni}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 60 });
  doc.pipe(res);

  doc.fontSize(9).fillColor('#E4202A').text('LA PREPARATORIA', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(20).fillColor('#1B2A4A').text('Constancia de Matrícula', { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(11).fillColor('#141f38');
  doc.text(
    `Se deja constancia de que el/la estudiante ${alumno.nombres} ${alumno.apellidos}, ` +
      `identificado(a) con DNI N.° ${alumno.dni}, se encuentra matriculado(a) en el año ` +
      `escolar ${matricula.anio_escolar} en ${matricula.grado_nombre} de ${matricula.nivel}, ` +
      `sección "${matricula.seccion_nombre}".`,
    { align: 'justify', lineGap: 4 }
  );

  doc.moveDown(2);
  doc.fontSize(10).fillColor('#374775');
  doc.text(`Fecha de matrícula: ${new Date(matricula.fecha_matricula).toLocaleDateString('es-PE')}`);
  doc.text(`Estado: ${matricula.estado}`);

  doc.moveDown(3);
  doc.fontSize(9).fillColor('#7f8fc0').text(
    `Documento generado el ${new Date().toLocaleDateString('es-PE')} por el sistema de gestión de matrículas.`,
    { align: 'center' }
  );
  doc.end();
});

const boletaNotas = asyncHandler(async (req, res) => {
  const { alumnoId } = req.params;
  const { anioEscolar } = req.query;
  if (req.usuario.rol === 'alumno' && Number(alumnoId) !== req.usuario.alumnoId) {
    throw new AppError('Solo puedes descargar tu propia boleta.', 403);
  }
  const anio = anioEscolar || new Date().getFullYear();

  const { rows: alumnos } = await pool.query('SELECT * FROM alumnos WHERE id = $1', [alumnoId]);
  const alumno = alumnos[0];
  if (!alumno) throw new AppError('Alumno no encontrado.', 404);

  const { rows: matriculas } = await pool.query(
    `SELECT m.*, g.nombre AS grado_nombre, g.nivel, s.nombre AS seccion_nombre
     FROM matriculas m JOIN grados g ON g.id = m.grado_id JOIN secciones s ON s.id = m.seccion_id
     WHERE m.alumno_id = $1 AND m.anio_escolar = $2 ORDER BY m.fecha_matricula DESC LIMIT 1`,
    [alumnoId, anio]
  );
  const matricula = matriculas[0];

  const { rows: notas } = await pool.query(
    `SELECT c.nombre AS curso_nombre, n.periodo, n.nota
     FROM notas n JOIN cursos c ON c.id = n.curso_id
     WHERE n.alumno_id = $1 AND n.anio_escolar = $2
     ORDER BY c.nombre, n.periodo`,
    [alumnoId, anio]
  );
  if (notas.length === 0) throw new AppError('Este alumno no tiene notas registradas para ese año.', 404);

  const porCurso = notas.reduce((acc, n) => { (acc[n.curso_nombre] ||= []).push(n); return acc; }, {});
  const promedioGeneral = (notas.reduce((s, n) => s + Number(n.nota), 0) / notas.length).toFixed(2);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="boleta-${alumno.dni}-${anio}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 60 });
  doc.pipe(res);

  doc.fontSize(9).fillColor('#E4202A').text('LA PREPARATORIA', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(20).fillColor('#1B2A4A').text('Boleta de Notas', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor('#374775').text(`Año escolar ${anio}`, { align: 'center' });
  doc.moveDown(1.2);

  doc.fontSize(11).fillColor('#141f38');
  doc.text(`Alumno: ${alumno.nombres} ${alumno.apellidos}`);
  doc.text(`DNI: ${alumno.dni}`);
  if (matricula) doc.text(`Grado y sección: ${matricula.grado_nombre} "${matricula.seccion_nombre}" (${matricula.nivel})`);
  doc.moveDown(1);

  Object.entries(porCurso).forEach(([curso, filas]) => {
    doc.fontSize(12).fillColor('#1B2A4A').text(curso, { underline: false });
    doc.moveDown(0.2);
    filas.forEach((f) => {
      doc.fontSize(10).fillColor('#374775').text(`  ${f.periodo}:  ${Number(f.nota).toFixed(0)}`);
    });
    doc.moveDown(0.6);
  });

  doc.moveDown(0.5);
  doc.fontSize(13).fillColor('#E4202A').text(`Promedio general: ${promedioGeneral}`, { align: 'right' });

  doc.moveDown(3);
  doc.fontSize(9).fillColor('#7f8fc0').text(
    `Documento generado el ${new Date().toLocaleDateString('es-PE')} por el sistema de gestión académica.`,
    { align: 'center' }
  );
  doc.end();
});

const boletaAsistencia = asyncHandler(async (req, res) => {
  const { alumnoId } = req.params;
  const { anioEscolar } = req.query;
  if (req.usuario.rol === 'alumno' && Number(alumnoId) !== req.usuario.alumnoId) {
    throw new AppError('Solo puedes descargar tu propio reporte.', 403);
  }
  const anio = anioEscolar || new Date().getFullYear();

  const { rows: alumnos } = await pool.query('SELECT * FROM alumnos WHERE id = $1', [alumnoId]);
  const alumno = alumnos[0];
  if (!alumno) throw new AppError('Alumno no encontrado.', 404);

  const { rows: matriculas } = await pool.query(
    `SELECT m.*, g.nombre AS grado_nombre, g.nivel, s.nombre AS seccion_nombre
     FROM matriculas m JOIN grados g ON g.id = m.grado_id JOIN secciones s ON s.id = m.seccion_id
     WHERE m.alumno_id = $1 AND m.anio_escolar = $2 ORDER BY m.fecha_matricula DESC LIMIT 1`,
    [alumnoId, anio]
  );
  const matricula = matriculas[0];

  const { rows: registros } = await pool.query(
    `SELECT fecha, estado, observacion FROM asistencias
     WHERE alumno_id = $1 AND EXTRACT(YEAR FROM fecha) = $2
     ORDER BY fecha`,
    [alumnoId, anio]
  );
  if (registros.length === 0) throw new AppError('Este alumno no tiene asistencia registrada para ese año.', 404);

  const resumen = { presente: 0, tardanza: 0, falta: 0, justificado: 0 };
  registros.forEach((r) => { resumen[r.estado] = (resumen[r.estado] || 0) + 1; });
  const porcentajeAsistencia = (((resumen.presente + resumen.tardanza) / registros.length) * 100).toFixed(1);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="asistencia-${alumno.dni}-${anio}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 60 });
  doc.pipe(res);

  doc.fontSize(9).fillColor('#E4202A').text('LA PREPARATORIA', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(20).fillColor('#1B2A4A').text('Reporte de Asistencia', { align: 'center' });
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor('#374775').text(`Año escolar ${anio}`, { align: 'center' });
  doc.moveDown(1.2);

  doc.fontSize(11).fillColor('#141f38');
  doc.text(`Alumno: ${alumno.nombres} ${alumno.apellidos}`);
  doc.text(`DNI: ${alumno.dni}`);
  if (matricula) doc.text(`Grado y sección: ${matricula.grado_nombre} "${matricula.seccion_nombre}" (${matricula.nivel})`);
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#1B2A4A').text('Resumen');
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#374775');
  doc.text(`Presente: ${resumen.presente}    Tardanza: ${resumen.tardanza}    Falta: ${resumen.falta}    Justificado: ${resumen.justificado}`);
  doc.moveDown(0.3);
  doc.fontSize(13).fillColor('#E4202A').text(`Asistencia: ${porcentajeAsistencia}%`);
  doc.moveDown(1);

  doc.fontSize(12).fillColor('#1B2A4A').text('Detalle');
  doc.moveDown(0.3);
  registros.forEach((r) => {
    const fecha = new Date(r.fecha).toLocaleDateString('es-PE');
    doc.fontSize(9).fillColor('#374775').text(`  ${fecha}  —  ${r.estado}${r.observacion ? ` (${r.observacion})` : ''}`);
  });

  doc.moveDown(2);
  doc.fontSize(9).fillColor('#7f8fc0').text(
    `Documento generado el ${new Date().toLocaleDateString('es-PE')} por el sistema de gestión académica.`,
    { align: 'center' }
  );
  doc.end();
});

const exportarAlumnosCsv = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  let sql = `SELECT a.dni, a.nombres, a.apellidos, a.telefono, a.email, a.estado, u.username
             FROM alumnos a JOIN usuarios u ON u.id = a.usuario_id WHERE 1=1`;
  const params = [];
  if (estado) { params.push(estado); sql += ` AND a.estado = $${params.length}`; }
  sql += ' ORDER BY a.apellidos, a.nombres';

  const { rows } = await pool.query(sql, params);
  const csv = aCsv(rows, [
    { titulo: 'DNI', valor: (r) => r.dni },
    { titulo: 'Nombres', valor: (r) => r.nombres },
    { titulo: 'Apellidos', valor: (r) => r.apellidos },
    { titulo: 'Teléfono', valor: (r) => r.telefono },
    { titulo: 'Correo', valor: (r) => r.email },
    { titulo: 'Estado', valor: (r) => r.estado },
    { titulo: 'Usuario', valor: (r) => r.username },
  ]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="alumnos.csv"');
  res.send(csv);
});

const exportarMatriculasCsv = asyncHandler(async (req, res) => {
  const { anio, estado, gradoId } = req.query;
  let sql = `SELECT m.anio_escolar, m.fecha_matricula, m.estado, m.monto_pago,
                    a.dni, a.nombres, a.apellidos, g.nombre AS grado_nombre, s.nombre AS seccion_nombre
             FROM matriculas m
             JOIN alumnos a ON a.id = m.alumno_id
             JOIN grados g ON g.id = m.grado_id
             JOIN secciones s ON s.id = m.seccion_id
             WHERE 1=1`;
  const params = [];
  if (anio) { params.push(anio); sql += ` AND m.anio_escolar = $${params.length}`; }
  if (estado) { params.push(estado); sql += ` AND m.estado = $${params.length}`; }
  if (gradoId) { params.push(gradoId); sql += ` AND m.grado_id = $${params.length}`; }
  sql += ' ORDER BY m.fecha_matricula DESC';

  const { rows } = await pool.query(sql, params);
  const csv = aCsv(rows, [
    { titulo: 'Año escolar', valor: (r) => r.anio_escolar },
    { titulo: 'DNI', valor: (r) => r.dni },
    { titulo: 'Nombres', valor: (r) => r.nombres },
    { titulo: 'Apellidos', valor: (r) => r.apellidos },
    { titulo: 'Grado', valor: (r) => r.grado_nombre },
    { titulo: 'Sección', valor: (r) => r.seccion_nombre },
    { titulo: 'Fecha de matrícula', valor: (r) => new Date(r.fecha_matricula).toLocaleDateString('es-PE') },
    { titulo: 'Estado', valor: (r) => r.estado },
    { titulo: 'Monto pagado', valor: (r) => r.monto_pago },
  ]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="matriculas.csv"');
  res.send(csv);
});

const exportarAlumnosXlsx = asyncHandler(async (req, res) => {
  const { estado } = req.query;
  let sql = `SELECT a.dni, a.nombres, a.apellidos, a.telefono, a.email, a.estado, u.username
             FROM alumnos a JOIN usuarios u ON u.id = a.usuario_id WHERE 1=1`;
  const params = [];
  if (estado) { params.push(estado); sql += ` AND a.estado = $${params.length}`; }
  sql += ' ORDER BY a.apellidos, a.nombres';
  const { rows } = await pool.query(sql, params);

  await enviarXlsx(res, {
    nombreArchivo: 'alumnos.xlsx',
    hoja: 'Alumnos',
    columnas: [
      { titulo: 'DNI', clave: 'dni', ancho: 14 },
      { titulo: 'Nombres', clave: 'nombres', ancho: 22 },
      { titulo: 'Apellidos', clave: 'apellidos', ancho: 22 },
      { titulo: 'Teléfono', clave: 'telefono', ancho: 16 },
      { titulo: 'Correo', clave: 'email', ancho: 26 },
      { titulo: 'Estado', clave: 'estado', ancho: 12 },
      { titulo: 'Usuario', clave: 'username', ancho: 16 },
    ],
    filas: rows,
  });
});

const exportarMatriculasXlsx = asyncHandler(async (req, res) => {
  const { anio, estado, gradoId } = req.query;
  let sql = `SELECT m.anio_escolar, m.fecha_matricula, m.estado, m.monto_pago,
                    a.dni, a.nombres, a.apellidos, g.nombre AS grado_nombre, s.nombre AS seccion_nombre
             FROM matriculas m
             JOIN alumnos a ON a.id = m.alumno_id
             JOIN grados g ON g.id = m.grado_id
             JOIN secciones s ON s.id = m.seccion_id
             WHERE 1=1`;
  const params = [];
  if (anio) { params.push(anio); sql += ` AND m.anio_escolar = $${params.length}`; }
  if (estado) { params.push(estado); sql += ` AND m.estado = $${params.length}`; }
  if (gradoId) { params.push(gradoId); sql += ` AND m.grado_id = $${params.length}`; }
  sql += ' ORDER BY m.fecha_matricula DESC';
  const { rows } = await pool.query(sql, params);

  await enviarXlsx(res, {
    nombreArchivo: 'matriculas.xlsx',
    hoja: 'Matrículas',
    columnas: [
      { titulo: 'Año escolar', clave: 'anio_escolar', ancho: 12 },
      { titulo: 'DNI', clave: 'dni', ancho: 14 },
      { titulo: 'Nombres', clave: 'nombres', ancho: 22 },
      { titulo: 'Apellidos', clave: 'apellidos', ancho: 22 },
      { titulo: 'Grado', clave: 'grado_nombre', ancho: 18 },
      { titulo: 'Sección', clave: 'seccion_nombre', ancho: 10 },
      { titulo: 'Fecha de matrícula', clave: 'fecha_matricula', ancho: 18 },
      { titulo: 'Estado', clave: 'estado', ancho: 12 },
      { titulo: 'Monto pagado', clave: 'monto_pago', ancho: 14 },
    ],
    filas: rows.map((r) => ({ ...r, fecha_matricula: new Date(r.fecha_matricula).toLocaleDateString('es-PE') })),
  });
});

const exportarAsistenciasXlsx = asyncHandler(async (req, res) => {
  const { seccionId, desde, hasta } = req.query;
  if (!seccionId) throw new AppError('seccionId es obligatorio.', 400);
  let sql = `SELECT asi.fecha, a.dni, a.nombres, a.apellidos, asi.estado, asi.observacion
             FROM asistencias asi
             JOIN alumnos a ON a.id = asi.alumno_id
             WHERE asi.seccion_id = $1`;
  const params = [seccionId];
  if (desde) { params.push(desde); sql += ` AND asi.fecha >= $${params.length}`; }
  if (hasta) { params.push(hasta); sql += ` AND asi.fecha <= $${params.length}`; }
  sql += ' ORDER BY asi.fecha DESC, a.apellidos';
  const { rows } = await pool.query(sql, params);

  await enviarXlsx(res, {
    nombreArchivo: 'asistencias.xlsx',
    hoja: 'Asistencias',
    columnas: [
      { titulo: 'Fecha', clave: 'fecha', ancho: 14 },
      { titulo: 'DNI', clave: 'dni', ancho: 14 },
      { titulo: 'Nombres', clave: 'nombres', ancho: 22 },
      { titulo: 'Apellidos', clave: 'apellidos', ancho: 22 },
      { titulo: 'Estado', clave: 'estado', ancho: 14 },
      { titulo: 'Observación', clave: 'observacion', ancho: 26 },
    ],
    filas: rows.map((r) => ({ ...r, fecha: new Date(r.fecha).toLocaleDateString('es-PE') })),
  });
});

const exportarNotasXlsx = asyncHandler(async (req, res) => {
  const { seccionId, anioEscolar } = req.query;
  if (!seccionId || !anioEscolar) throw new AppError('seccionId y anioEscolar son obligatorios.', 400);
  const { rows } = await pool.query(
    `SELECT a.dni, a.nombres, a.apellidos, c.nombre AS curso_nombre, n.periodo, n.nota, n.observacion
     FROM notas n
     JOIN alumnos a ON a.id = n.alumno_id
     JOIN cursos c ON c.id = n.curso_id
     JOIN matriculas m ON m.alumno_id = a.id AND m.anio_escolar = n.anio_escolar AND m.estado = 'activo'
     WHERE m.seccion_id = $1 AND n.anio_escolar = $2
     ORDER BY a.apellidos, a.nombres, c.nombre, n.periodo`,
    [seccionId, anioEscolar]
  );

  await enviarXlsx(res, {
    nombreArchivo: 'notas.xlsx',
    hoja: 'Notas',
    columnas: [
      { titulo: 'DNI', clave: 'dni', ancho: 14 },
      { titulo: 'Nombres', clave: 'nombres', ancho: 22 },
      { titulo: 'Apellidos', clave: 'apellidos', ancho: 22 },
      { titulo: 'Curso', clave: 'curso_nombre', ancho: 22 },
      { titulo: 'Periodo', clave: 'periodo', ancho: 14 },
      { titulo: 'Nota', clave: 'nota', ancho: 10 },
      { titulo: 'Observación', clave: 'observacion', ancho: 26 },
    ],
    filas: rows,
  });
});

// Estadisticas agregadas para los dashboards del panel admin.
const dashboard = asyncHandler(async (req, res) => {
  const { anioEscolar } = req.query;
  const anio = anioEscolar || new Date().getFullYear();

  const [
    { rows: matriculasPorNivel },
    { rows: cuposPorGrado },
    { rows: asistenciaPorEstado },
    { rows: distribucionNotas },
    { rows: resumenGeneral },
    { rows: asistenciaMensual },
    { rows: rankingAlumnos },
    { rows: alertasRiesgo },
    { rows: pagosPendientes },
    { rows: cumpleanosHoy },
  ] = await Promise.all([
    pool.query(
      `SELECT g.nivel, COUNT(*) AS total
       FROM matriculas m JOIN grados g ON g.id = m.grado_id
       WHERE m.anio_escolar = $1 AND m.estado = 'activo'
       GROUP BY g.nivel ORDER BY g.nivel`,
      [anio]
    ),
    pool.query(
      `SELECT g.nombre AS grado_nombre, g.nivel, g.orden,
              SUM(s.capacidad) AS capacidad_total,
              COALESCE(SUM(oc.ocupados), 0) AS ocupados
       FROM secciones s
       JOIN grados g ON g.id = s.grado_id
       LEFT JOIN (
         SELECT seccion_id, COUNT(*) AS ocupados FROM matriculas WHERE estado = 'activo' GROUP BY seccion_id
       ) oc ON oc.seccion_id = s.id
       WHERE s.anio_escolar = $1
       GROUP BY g.nombre, g.nivel, g.orden ORDER BY g.orden`,
      [anio]
    ),
    pool.query(
      `SELECT asi.estado, COUNT(*) AS total
       FROM asistencias asi
       WHERE EXTRACT(YEAR FROM asi.fecha) = $1
       GROUP BY asi.estado`,
      [anio]
    ),
    pool.query(
      `SELECT
         CASE
           WHEN nota >= 18 THEN 'AD (18-20)'
           WHEN nota >= 14 THEN 'A (14-17)'
           WHEN nota >= 11 THEN 'B (11-13)'
           ELSE 'C (0-10)'
         END AS rango,
         COUNT(*) AS total
       FROM notas WHERE anio_escolar = $1
       GROUP BY rango`,
      [anio]
    ),
    pool.query(
      `SELECT
         (SELECT COUNT(*) FROM alumnos WHERE estado = 'activo') AS alumnos_activos,
         (SELECT COUNT(*) FROM docentes) AS total_docentes,
         (SELECT COUNT(*) FROM matriculas WHERE anio_escolar = $1 AND estado = 'activo') AS matriculas_activas,
         (SELECT COUNT(*) FROM avisos) AS total_avisos`,
      [anio]
    ),
    // Tendencia mensual de asistencia (para comparar mes a mes).
    pool.query(
      `SELECT EXTRACT(MONTH FROM fecha)::int AS mes,
              COUNT(*) FILTER (WHERE estado = 'presente') AS presente,
              COUNT(*) FILTER (WHERE estado = 'tardanza') AS tardanza,
              COUNT(*) FILTER (WHERE estado = 'falta') AS falta,
              COUNT(*) FILTER (WHERE estado = 'justificado') AS justificado
       FROM asistencias
       WHERE EXTRACT(YEAR FROM fecha) = $1
       GROUP BY mes ORDER BY mes`,
      [anio]
    ),
    // Ranking de alumnos con mejor promedio (mínimo 3 notas registradas).
    pool.query(
      `SELECT a.id, a.nombres, a.apellidos, ROUND(AVG(n.nota), 2) AS promedio, COUNT(n.id) AS cantidad_notas
       FROM notas n JOIN alumnos a ON a.id = n.alumno_id
       WHERE n.anio_escolar = $1
       GROUP BY a.id, a.nombres, a.apellidos
       HAVING COUNT(n.id) >= 3
       ORDER BY promedio DESC LIMIT 10`,
      [anio]
    ),
    // Alumnos en riesgo: 20% o más de faltas, o promedio menor a 11.
    pool.query(
      `WITH asistencia_alumno AS (
         SELECT a.id AS alumno_id, a.nombres, a.apellidos,
                COUNT(*) FILTER (WHERE asi.estado = 'falta') AS faltas,
                COUNT(*) AS total_registros
         FROM alumnos a
         JOIN asistencias asi ON asi.alumno_id = a.id
         WHERE EXTRACT(YEAR FROM asi.fecha) = $1
         GROUP BY a.id, a.nombres, a.apellidos
       ),
       notas_alumno AS (
         SELECT alumno_id, ROUND(AVG(nota), 2) AS promedio
         FROM notas WHERE anio_escolar = $1
         GROUP BY alumno_id
       )
       SELECT aa.alumno_id, aa.nombres, aa.apellidos, aa.faltas, aa.total_registros,
              ROUND((aa.faltas::numeric / NULLIF(aa.total_registros, 0)) * 100, 1) AS porcentaje_faltas,
              na.promedio
       FROM asistencia_alumno aa
       LEFT JOIN notas_alumno na ON na.alumno_id = aa.alumno_id
       WHERE (aa.faltas::numeric / NULLIF(aa.total_registros, 0)) >= 0.2 OR na.promedio < 11
       ORDER BY porcentaje_faltas DESC NULLS LAST LIMIT 15`,
      [anio]
    ),
    // Cobranza: matrículas activas sin pago registrado.
    pool.query(
      `SELECT a.dni, a.nombres, a.apellidos, g.nombre AS grado_nombre, s.nombre AS seccion_nombre, m.monto_pago
       FROM matriculas m
       JOIN alumnos a ON a.id = m.alumno_id
       JOIN grados g ON g.id = m.grado_id
       JOIN secciones s ON s.id = m.seccion_id
       WHERE m.anio_escolar = $1 AND m.estado = 'activo' AND (m.monto_pago IS NULL OR m.monto_pago = 0)
       ORDER BY a.apellidos LIMIT 20`,
      [anio]
    ),
    // Alumnos activos que cumplen años hoy.
    pool.query(
      `SELECT id, nombres, apellidos FROM alumnos
       WHERE estado = 'activo' AND fecha_nacimiento IS NOT NULL
       AND EXTRACT(MONTH FROM fecha_nacimiento) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(DAY FROM fecha_nacimiento) = EXTRACT(DAY FROM CURRENT_DATE)
       ORDER BY apellidos`
    ),
  ]);

  res.json({
    anioEscolar: Number(anio),
    matriculasPorNivel,
    cuposPorGrado,
    asistenciaPorEstado,
    distribucionNotas,
    resumenGeneral: resumenGeneral[0],
    asistenciaMensual,
    rankingAlumnos,
    alertasRiesgo,
    pagosPendientes,
    cumpleanosHoy,
  });
});

// Copia de seguridad descargable de los datos del sistema (solo admin).
const backupJson = asyncHandler(async (req, res) => {
  const tablas = [
    'grados', 'secciones', 'cursos', 'docentes', 'horarios',
    'alumnos', 'matriculas', 'matriculas_historial',
    'asistencias', 'notas', 'avisos', 'auditoria',
  ];

  const datos = {};
  for (const tabla of tablas) {
    // eslint-disable-next-line no-await-in-loop
    const { rows } = await pool.query(`SELECT * FROM ${tabla}`);
    datos[tabla] = rows;
  }

  const { rows: usuarios } = await pool.query(
    'SELECT id, username, rol, activo, debe_cambiar_password, created_at FROM usuarios'
  );
  datos.usuarios = usuarios; // nunca se incluye password_hash ni el secreto de 2FA

  const fecha = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="backup-la-preparatoria-${fecha}.json"`);
  res.send(JSON.stringify({ generadoEn: new Date().toISOString(), tablas: datos }, null, 2));
});

module.exports = {
  constanciaMatricula,
  boletaNotas,
  boletaAsistencia,
  exportarAlumnosCsv,
  exportarMatriculasCsv,
  exportarAlumnosXlsx,
  exportarMatriculasXlsx,
  exportarAsistenciasXlsx,
  exportarNotasXlsx,
  dashboard,
  backupJson,
};
