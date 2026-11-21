const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditoriaController');
const { requiereAuth, requiereAdmin } = require('../middleware/auth');

router.get('/', requiereAuth, requiereAdmin, ctrl.listarAuditoria);

module.exports = router;
