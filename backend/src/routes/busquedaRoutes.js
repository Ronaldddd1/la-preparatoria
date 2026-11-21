const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/busquedaController');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');

router.get('/', requiereAuth, requiereAdmin, ctrl.buscar);

module.exports = router;
