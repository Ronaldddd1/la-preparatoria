const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportesController');
const { requiereAuth, requiereAdmin, requiereRoles } = require('../middleware/auth');

router.get('/constancia/:alumnoId', requiereAuth, requiereRoles('admin', 'alumno'), ctrl.constanciaMatricula);
router.get('/boleta/:alumnoId', requiereAuth, requiereRoles('admin', 'alumno'), ctrl.boletaNotas);
router.get('/asistencia-pdf/:alumnoId', requiereAuth, requiereRoles('admin', 'alumno'), ctrl.boletaAsistencia);
router.get('/alumnos.csv', requiereAuth, requiereAdmin, ctrl.exportarAlumnosCsv);
router.get('/matriculas.csv', requiereAuth, requiereAdmin, ctrl.exportarMatriculasCsv);
router.get('/alumnos.xlsx', requiereAuth, requiereAdmin, ctrl.exportarAlumnosXlsx);
router.get('/matriculas.xlsx', requiereAuth, requiereAdmin, ctrl.exportarMatriculasXlsx);
router.get('/asistencias.xlsx', requiereAuth, requiereRoles('admin', 'docente'), ctrl.exportarAsistenciasXlsx);
router.get('/notas.xlsx', requiereAuth, requiereRoles('admin', 'docente'), ctrl.exportarNotasXlsx);
router.get('/dashboard', requiereAuth, requiereAdmin, ctrl.dashboard);
router.get('/backup.json', requiereAuth, requiereAdmin, ctrl.backupJson);

module.exports = router;
