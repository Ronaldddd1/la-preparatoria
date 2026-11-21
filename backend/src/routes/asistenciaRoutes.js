const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/asistenciaController');
const { requiereAuth, requiereRoles } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { registrarAsistenciaSchema, marcarAsistenciaQrSchema } = require('../validators/esquemas');

router.get('/mia', requiereAuth, requiereRoles('alumno'), ctrl.miAsistencia);
router.post('/marcar-qr', requiereAuth, requiereRoles('admin', 'docente'), validar({ body: marcarAsistenciaQrSchema }), ctrl.marcarPorQr);
router.get('/mia/resumen', requiereAuth, requiereRoles('alumno'), ctrl.miResumenAsistencia);
router.get('/resumen/alumno/:alumnoId', requiereAuth, requiereRoles('admin', 'docente'), ctrl.resumenPorAlumnoId);
router.get('/resumen/seccion/:seccionId', requiereAuth, requiereRoles('admin', 'docente'), ctrl.resumenPorSeccion);
router.get('/', requiereAuth, requiereRoles('admin', 'docente'), ctrl.listarPorSeccionYFecha);
router.post('/', requiereAuth, requiereRoles('admin', 'docente'), validar({ body: registrarAsistenciaSchema }), ctrl.registrarAsistencia);

module.exports = router;
