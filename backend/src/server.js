const app = require('./app');
const logger = require('./utils/logger');
const pool = require('./config/db');

const PORT = process.env.PORT || 4000;

async function iniciar() {
  try {
    await pool.probarConexion();
    logger.info('Conexion a la base de datos verificada.');
  } catch (err) {
    logger.error({ err }, 'No se pudo conectar a la base de datos. Revisa tu archivo .env.');
    process.exit(1);
  }

  const servidor = app.listen(PORT, () => {
    logger.info(`API de La Preparatoria escuchando en http://localhost:${PORT}`);
  });

  const apagar = (senal) => {
    logger.info(`Senal ${senal} recibida, cerrando servidor...`);
    servidor.close(() => { pool.end().finally(() => process.exit(0)); });
  };
  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Promesa rechazada sin manejar.');
});

iniciar();
