const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/justificacionController');
const { requiereAuth, requiereAdmin, requiereRoles } = require('../middleware/auth');
const upload = require('../middleware/subida');

router.post('/', requiereAuth, requiereRoles('alumno'), upload.single('archivo'), ctrl.solicitar);
router.get('/mias', requiereAuth, requiereRoles('alumno'), ctrl.misJustificaciones);
router.get('/', requiereAuth, requiereAdmin, ctrl.listar);
router.put('/:id', requiereAuth, requiereAdmin, ctrl.resolver);

module.exports = router;
