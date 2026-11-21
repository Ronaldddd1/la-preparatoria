const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/horarioController');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { crearHorarioSchema, actualizarHorarioSchema } = require('../validators/esquemas');

router.get('/mio', requiereAuth, ctrl.miHorario);
router.get('/', requiereAuth, ctrl.listarPorSeccion);
router.post('/', requiereAuth, requiereAdmin, validar({ body: crearHorarioSchema }), ctrl.crearHorario);
router.post('/clonar', requiereAuth, requiereAdmin, ctrl.clonarHorario);
router.put('/:id', requiereAuth, requiereAdmin, validar({ body: actualizarHorarioSchema }), ctrl.actualizarHorario);
router.delete('/:id', requiereAuth, requiereAdmin, ctrl.eliminarHorario);

module.exports = router;
