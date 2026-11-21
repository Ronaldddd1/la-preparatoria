const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mensajeController');
const { requiereAuth, requiereRoles } = require('../middleware/auth');
const upload = require('../middleware/subida');

router.get('/conversaciones-docente', requiereAuth, requiereRoles('docente'), ctrl.listarConversacionesDocente);
router.get('/conversacion/:horarioId', requiereAuth, requiereRoles('alumno', 'docente'), ctrl.listarConversacion);
router.post('/', requiereAuth, requiereRoles('alumno', 'docente'), upload.single('archivo'), ctrl.enviarMensaje);

module.exports = router;
