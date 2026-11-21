const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/alumnoController');
const { requiereAuth, requiereAdmin, requiereRoles } = require('../middleware/auth');
const validar = require('../middleware/validar');
const upload = require('../middleware/subida');
const { actualizarAlumnoSchema, actualizarMiPerfilSchema } = require('../validators/esquemas');

router.get('/mi-perfil', requiereAuth, ctrl.miPerfil);
router.get('/mi-perfil/qr', requiereAuth, requiereRoles('alumno'), ctrl.miQr);
router.put('/mi-perfil', requiereAuth, validar({ body: actualizarMiPerfilSchema }), ctrl.actualizarMiPerfil);
router.post('/mi-perfil/foto', requiereAuth, requiereRoles('alumno'), upload.single('foto'), ctrl.subirMiFoto);

// Docentes pueden buscar alumnos (p.ej. para registrar una incidencia),
// pero solo el admin puede ver/editar el detalle completo o el QR de otro.
router.get('/', requiereAuth, requiereRoles('admin', 'docente'), ctrl.listarAlumnos);
router.get('/:id', requiereAuth, requiereAdmin, ctrl.obtenerAlumno);
router.get('/:id/qr', requiereAuth, requiereAdmin, ctrl.qrPorId);
router.post('/:id/foto', requiereAuth, requiereAdmin, upload.single('foto'), ctrl.subirFotoPorId);
router.put('/:id', requiereAuth, requiereAdmin, validar({ body: actualizarAlumnoSchema }), ctrl.actualizarAlumno);
router.put('/:id/resetear-password', requiereAuth, requiereAdmin, ctrl.resetearPassword);

module.exports = router;
