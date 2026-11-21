const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const listarAuditoria = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.username FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id
     ORDER BY a.creado_en DESC LIMIT 300`
  );
  res.json(rows);
});

module.exports = { listarAuditoria };
