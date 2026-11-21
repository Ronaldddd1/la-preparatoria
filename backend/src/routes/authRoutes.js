const express = require('express');
const router = express.Router();
const {
  login, cambiarPassword, perfil, aceptarTerminos,
  iniciarDosFactor, activarDosFactor, desactivarDosFactor,
} = require('../controllers/authController');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { loginSchema, cambiarPasswordSchema, codigoDosFactorSchema } = require('../validators/esquemas');
const { limitadorSensible } = require('../middleware/limitadores');

router.post('/login', validar({ body: loginSchema }), login);
router.put('/password', requiereAuth, validar({ body: cambiarPasswordSchema }), cambiarPassword);
router.get('/perfil', requiereAuth, perfil);
router.post('/aceptar-terminos', requiereAuth, aceptarTerminos);

router.post('/2fa/iniciar', requiereAuth, requiereAdmin, limitadorSensible, iniciarDosFactor);
router.post('/2fa/activar', requiereAuth, requiereAdmin, limitadorSensible, validar({ body: codigoDosFactorSchema }), activarDosFactor);
router.post('/2fa/desactivar', requiereAuth, requiereAdmin, limitadorSensible, validar({ body: codigoDosFactorSchema }), desactivarDosFactor);

module.exports = router;
