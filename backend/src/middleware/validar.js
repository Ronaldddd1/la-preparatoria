const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

function validar(esquemas) {
  return (req, res, next) => {
    try {
      if (esquemas.body) req.body = esquemas.body.parse(req.body);
      if (esquemas.query) req.query = esquemas.query.parse(req.query);
      if (esquemas.params) req.params = esquemas.params.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const detalles = err.errors.map((e) => ({ campo: e.path.join('.'), mensaje: e.message }));
        return next(new AppError('Datos invalidos en la solicitud.', 400, detalles));
      }
      next(err);
    }
  };
}

module.exports = validar;
