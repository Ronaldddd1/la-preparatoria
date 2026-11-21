const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/avisoController');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');
const validar = require('../middleware/validar');
const { crearAvisoSchema } = require('../validators/esquemas');

router.get('/', requiereAuth, ctrl.listarAvisos);
router.post('/', requiereAuth, requiereAdmin, validar({ body: crearAvisoSchema }), ctrl.crearAviso);
router.get('/:avisoId/comentarios', requiereAuth, ctrl.listarComentarios);
router.post('/:avisoId/comentarios', requiereAuth, ctrl.comentar);

module.exports = router;
