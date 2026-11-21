const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
require('dotenv').config();

const logger = require('./utils/logger');
const AppError = require('./utils/AppError');
const manejadorErrores = require('./middleware/manejadorErrores');
const { limitadorGeneral, limitadorLogin } = require('./middleware/limitadores');

const authRoutes = require('./routes/authRoutes');
const alumnoRoutes = require('./routes/alumnoRoutes');
const matriculaRoutes = require('./routes/matriculaRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const notaRoutes = require('./routes/notaRoutes');
const avisoRoutes = require('./routes/avisoRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const busquedaRoutes = require('./routes/busquedaRoutes');
const justificacionRoutes = require('./routes/justificacionRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const calendarioRoutes = require('./routes/calendarioRoutes');
const incidenciaRoutes = require('./routes/incidenciaRoutes');

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/salud' } }));
app.use(limitadorGeneral);

app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok', servicio: 'API La Preparatoria' });
});

app.use('/api/auth/login', limitadorLogin);
app.use('/api/auth', authRoutes);
app.use('/api/alumnos', alumnoRoutes);
app.use('/api/matriculas', matriculaRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/docentes', docenteRoutes);
app.use('/api/asistencias', asistenciaRoutes);
app.use('/api/notas', notaRoutes);
app.use('/api/avisos', avisoRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/busqueda', busquedaRoutes);
app.use('/api/justificaciones', justificacionRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/calendario', calendarioRoutes);
app.use('/api/incidencias', incidenciaRoutes);
app.use('/api', catalogoRoutes);

app.use((req, res, next) => next(new AppError('Recurso no encontrado.', 404)));
app.use(manejadorErrores);

module.exports = app;
