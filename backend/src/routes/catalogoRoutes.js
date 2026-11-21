const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/catalogoController');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { crearSeccionSchema, crearCursoSchema } = require('../validators/esquemas');

router.get('/grados', requiereAuth, ctrl.listarGrados);
router.get('/secciones', requiereAuth, ctrl.listarSecciones);
router.post('/secciones', requiereAuth, requiereAdmin, validar({ body: crearSeccionSchema }), ctrl.crearSeccion);
router.get('/cursos', requiereAuth, ctrl.listarCursos);
router.post('/cursos', requiereAuth, requiereAdmin, validar({ body: crearCursoSchema }), ctrl.crearCurso);
router.post('/cursos/lote', requiereAuth, requiereAdmin, ctrl.crearCursoPorLote);

module.exports = router;
