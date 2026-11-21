const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/calendarioController');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { crearEventoCalendarioSchema } = require('../validators/esquemas');

router.get('/', requiereAuth, ctrl.listar);
router.get('/exportar.ics', requiereAuth, ctrl.exportarIcs);
router.post('/', requiereAuth, requiereAdmin, validar({ body: crearEventoCalendarioSchema }), ctrl.crear);
router.put('/:id', requiereAuth, requiereAdmin, validar({ body: crearEventoCalendarioSchema }), ctrl.actualizar);
router.delete('/:id', requiereAuth, requiereAdmin, ctrl.eliminar);

module.exports = router;
