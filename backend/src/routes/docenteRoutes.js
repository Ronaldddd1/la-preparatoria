const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/docenteController');
const { requiereAuth, requiereAdmin, requiereRoles } = require('../middleware/auth');
const validar = require('../middleware/validar');
const upload = require('../middleware/subida');
const { crearDocenteSchema, actualizarDocenteSchema } = require('../validators/esquemas');

router.get('/mis-clases', requiereAuth, requiereRoles('docente'), ctrl.misClases);
router.get('/mis-secciones', requiereAuth, requiereRoles('docente'), ctrl.misSecciones);
router.get('/', requiereAuth, ctrl.listarDocentes);
router.post('/', requiereAuth, requiereAdmin, validar({ body: crearDocenteSchema }), ctrl.crearDocente);
router.put('/:id', requiereAuth, requiereAdmin, validar({ body: actualizarDocenteSchema }), ctrl.actualizarDocente);
router.post('/:id/cuenta', requiereAuth, requiereAdmin, ctrl.crearCuentaDocente);
router.put('/:id/resetear-password', requiereAuth, requiereAdmin, ctrl.resetearPasswordDocente);
router.post('/:id/foto', requiereAuth, requiereAdmin, upload.single('foto'), ctrl.subirFoto);

module.exports = router;
