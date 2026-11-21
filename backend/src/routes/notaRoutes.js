const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notaController');
const { requiereAuth, requiereRoles } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { registrarNotaSchema, ponderacionNotasSchema } = require('../validators/esquemas');

router.get('/config', requiereAuth, ctrl.obtenerConfig);
router.put('/config', requiereAuth, requiereRoles('admin'), validar({ body: ponderacionNotasSchema }), ctrl.actualizarConfig);
router.get('/mias', requiereAuth, requiereRoles('alumno'), ctrl.misNotas);
router.get('/historial', requiereAuth, requiereRoles('admin', 'docente'), ctrl.historialNota);
router.get('/completo', requiereAuth, requiereRoles('admin'), ctrl.listarCompletoPorSeccion);
router.get('/', requiereAuth, requiereRoles('admin', 'docente'), ctrl.listarPorSeccionYCurso);
router.post('/', requiereAuth, requiereRoles('admin', 'docente'), validar({ body: registrarNotaSchema }), ctrl.registrarNota);

module.exports = router;
