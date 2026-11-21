const logger = require('../utils/logger');

const esProduccion = process.env.NODE_ENV === 'production';

function traducirErrorPostgres(err) {
  switch (err.code) {
    case '23505':
      return { statusCode: 409, mensaje: 'Ese registro ya existe (dato duplicado).' };
    case '23503':
      if (/is still referenced/i.test(err.message || '')) {
        return { statusCode: 409, mensaje: 'No se puede eliminar: hay otros registros que dependen de este.' };
      }
      return { statusCode: 400, mensaje: 'Uno de los datos hace referencia a algo que no existe.' };
    case '23502':
      return { statusCode: 400, mensaje: 'Falta un dato obligatorio.' };
    case 'ECONNREFUSED':
      return { statusCode: 503, mensaje: 'No se pudo conectar a la base de datos. Intenta nuevamente en unos minutos.' };
    default:
      return null;
  }
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let mensaje = err.esOperacional ? err.message : 'Ocurrio un error inesperado en el servidor.';
  const detalles = err.detalles || null;

  const esErrorDeArchivo = err.name === 'MulterError' || err.code === 'ALMACENAMIENTO_NO_CONFIGURADO';
  if (esErrorDeArchivo) {
    statusCode = err.code === 'ALMACENAMIENTO_NO_CONFIGURADO' ? 503 : 400;
    mensaje = err.code === 'LIMIT_FILE_SIZE' ? 'El archivo supera el tamaño máximo permitido (5 MB).' : err.message;
  }

  const traduccion = !esErrorDeArchivo && err.code ? traducirErrorPostgres(err) : null;
  if (traduccion) {
    statusCode = traduccion.statusCode;
    mensaje = traduccion.mensaje;
  }

  logger[statusCode >= 500 ? 'error' : 'warn']({ err, ruta: `${req.method} ${req.originalUrl}`, statusCode }, mensaje);

  const respuesta = { mensaje };
  if (detalles) respuesta.detalles = detalles;
  if (!esProduccion && statusCode >= 500) respuesta.stack = err.stack;

  res.status(statusCode).json(respuesta);
}

module.exports = manejadorErrores;
