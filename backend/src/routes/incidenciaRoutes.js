const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/incidenciaController');
const { requiereAuth, requiereAdmin, requiereRoles } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { crearIncidenciaSchema } = require('../validators/esquemas');

router.get('/mias', requiereAuth, requiereRoles('alumno'), ctrl.misIncidencias);
router.get('/', requiereAuth, requiereRoles('admin', 'docente'), ctrl.listar);
router.post('/', requiereAuth, requiereRoles('admin', 'docente'), validar({ body: crearIncidenciaSchema }), ctrl.crear);
router.delete('/:id', requiereAuth, requiereAdmin, ctrl.eliminar);

module.exports = router;
