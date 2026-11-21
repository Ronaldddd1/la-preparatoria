const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/matriculaController');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { crearMatriculaSchema, actualizarMatriculaSchema, renovarMatriculaSchema } = require('../validators/esquemas');

router.get('/mia', requiereAuth, ctrl.miMatricula);
router.get('/', requiereAuth, requiereAdmin, ctrl.listarMatriculas);
router.post('/', requiereAuth, requiereAdmin, validar({ body: crearMatriculaSchema }), ctrl.crearMatricula);
router.post('/renovar/:alumnoId', requiereAuth, requiereAdmin, validar({ body: renovarMatriculaSchema }), ctrl.renovarMatricula);
router.get('/:id/historial', requiereAuth, requiereAdmin, ctrl.historialMatricula);
router.put('/:id', requiereAuth, requiereAdmin, validar({ body: actualizarMatriculaSchema }), ctrl.actualizarMatricula);

module.exports = router;
