const rateLimit = require('express-rate-limit');

const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
});

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { mensaje: 'Demasiados intentos de inicio de sesion. Espera unos minutos e intenta de nuevo.' },
});

const limitadorSensible = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' },
});

module.exports = { limitadorGeneral, limitadorLogin, limitadorSensible };
