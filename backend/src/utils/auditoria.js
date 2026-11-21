const pool = require('../config/db');
const logger = require('./logger');

async function registrarAuditoria({ usuarioId, accion, entidad, entidadId = null, detalle = null }) {
  try {
    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle) VALUES ($1, $2, $3, $4, $5)',
      [usuarioId || null, accion, entidad, entidadId, detalle ? JSON.stringify(detalle) : null]
    );
  } catch (err) {
    logger.error({ err }, 'No se pudo registrar la auditoria.');
  }
}

module.exports = { registrarAuditoria };
