const { verificarToken } = require('../utils/jwt');

function requiereAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ mensaje: 'No autorizado. Falta el token.' });
  }
  const token = header.split(' ')[1];
  try {
    req.usuario = verificarToken(token); // { id, username, rol, alumnoId?, docenteId? }
    next();
  } catch (err) {
    return res.status(401).json({ mensaje: 'Token invalido o expirado.' });
  }
}

function requiereAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Requiere privilegios de administrador.' });
  }
  next();
}

function requiereRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permiso para realizar esta accion.' });
    }
    next();
  };
}

module.exports = { requiereAuth, requiereAdmin, requiereRoles };
