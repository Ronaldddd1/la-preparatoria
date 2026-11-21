class AppError extends Error {
  constructor(mensaje, statusCode = 400, detalles = null) {
    super(mensaje);
    this.statusCode = statusCode;
    this.esOperacional = true;
    this.detalles = detalles;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
