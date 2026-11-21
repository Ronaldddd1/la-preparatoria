const pool = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { registrarAuditoria } = require('../utils/auditoria');
const { feriadosPeru } = require('../utils/feriadosPeru');

const listar = asyncHandler(async (req, res) => {
  const { anioEscolar } = req.query;
  let sql = 'SELECT * FROM calendario_academico WHERE 1=1';
  const params = [];
  if (anioEscolar) { params.push(anioEscolar); sql += ` AND anio_escolar = $${params.length}`; }
  sql += ' ORDER BY fecha_inicio';
  const { rows } = await pool.query(sql, params);
  // Se agregan automáticamente los feriados nacionales del año pedido (o del
  // año actual), salvo los que el admin ya registró manualmente ese mismo día.
  const anio = Number(anioEscolar) || new Date().getFullYear();
  const yaRegistrados = new Set(rows.filter((e) => e.tipo === 'feriado').map((e) => String(e.fecha_inicio).slice(0, 10)));
  const automaticos = feriadosPeru(anio).filter((f) => !yaRegistrados.has(f.fecha_inicio));
  const todos = [...rows, ...automaticos].sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)));
  res.json(todos);
});

// Devuelve el evento de tipo 'feriado' que cubre una fecha dada, si existe
// (se usa para bloquear el registro de asistencia en ese día).
async function feriadoEnFecha(fecha) {
  const { rows } = await pool.query(
    `SELECT * FROM calendario_academico
     WHERE tipo = 'feriado' AND fecha_inicio <= $1 AND COALESCE(fecha_fin, fecha_inicio) >= $1
     LIMIT 1`,
    [fecha]
  );
  if (rows[0]) return rows[0];
  const iso = String(fecha instanceof Date ? fecha.toISOString() : fecha).slice(0, 10);
  const anio = Number(iso.slice(0, 4));
  return feriadosPeru(anio).find((f) => f.fecha_inicio === iso) || null;
}

const crear = asyncHandler(async (req, res) => {
  const { titulo, tipo, fechaInicio, fechaFin, descripcion, anioEscolar } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO calendario_academico (titulo, tipo, fecha_inicio, fecha_fin, descripcion, anio_escolar, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [titulo, tipo, fechaInicio, fechaFin || null, descripcion || null, anioEscolar, req.usuario.id]
  );
  await registrarAuditoria({ usuarioId: req.usuario.id, accion: 'crear_evento_calendario', entidad: 'calendario_academico', entidadId: rows[0].id });
  res.status(201).json({ id: rows[0].id, mensaje: 'Evento agregado al calendario.' });
});

const actualizar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { titulo, tipo, fechaInicio, fechaFin, descripcion, anioEscolar } = req.body;
  const result = await pool.query(
    `UPDATE calendario_academico SET titulo = $1, tipo = $2, fecha_inicio = $3, fecha_fin = $4, descripcion = $5, anio_escolar = $6
     WHERE id = $7`,
    [titulo, tipo, fechaInicio, fechaFin || null, descripcion || null, anioEscolar, id]
  );
  if (result.rowCount === 0) throw new AppError('Evento no encontrado.', 404);
  res.json({ mensaje: 'Evento actualizado.' });
});

const eliminar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM calendario_academico WHERE id = $1', [id]);
  if (result.rowCount === 0) throw new AppError('Evento no encontrado.', 404);
  await registrarAuditoria({ usuarioId: req.usuario.id, accion: 'eliminar_evento_calendario', entidad: 'calendario_academico', entidadId: Number(id) });
  res.json({ mensaje: 'Evento eliminado.' });
});

// Genera un archivo .ics estándar para que alumnos/docentes lo importen
// en Google Calendar, Apple Calendar, Outlook, etc.
function formatoFechaIcs(fecha) {
  return String(fecha).replace(/-/g, '').slice(0, 8);
}
function sumarUnDia(fechaISO) {
  const d = new Date(`${fechaISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function escaparTextoIcs(texto) {
  return String(texto || '').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
}

const exportarIcs = asyncHandler(async (req, res) => {
  const { anioEscolar } = req.query;
  let sql = 'SELECT * FROM calendario_academico WHERE 1=1';
  const params = [];
  if (anioEscolar) { params.push(anioEscolar); sql += ` AND anio_escolar = $${params.length}`; }
  sql += ' ORDER BY fecha_inicio';
  const { rows } = await pool.query(sql, params);

  const lineas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//La Preparatoria//Calendario Academico//ES'];
  rows.forEach((e) => {
    const fechaFinExclusiva = sumarUnDia(e.fecha_fin || e.fecha_inicio);
    lineas.push(
      'BEGIN:VEVENT',
      `UID:calendario-${e.id}@la-preparatoria`,
      `DTSTAMP:${formatoFechaIcs(new Date().toISOString())}T000000Z`,
      `DTSTART;VALUE=DATE:${formatoFechaIcs(e.fecha_inicio)}`,
      `DTEND;VALUE=DATE:${formatoFechaIcs(fechaFinExclusiva)}`,
      `SUMMARY:${escaparTextoIcs(e.titulo)}`,
      ...(e.descripcion ? [`DESCRIPTION:${escaparTextoIcs(e.descripcion)}`] : []),
      'END:VEVENT'
    );
  });
  lineas.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="calendario-la-preparatoria.ics"');
  res.send(lineas.join('\r\n'));
});

module.exports = { listar, crear, actualizar, eliminar, feriadoEnFecha, exportarIcs };
