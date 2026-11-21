const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../utils/logger');

const usaCadenaUnica = !!process.env.DATABASE_URL;

const pool = usaCadenaUnica
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase exige SSL para conexiones externas.
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

pool.on('error', (err) => {
  logger.error({ err }, 'Error inesperado en el pool de PostgreSQL.');
});

// Cuando la base de datos es un proyecto Supabase compartido (p. ej. "TransJer"),
// las tablas de La Preparatoria viven en el schema "la_preparatoria" en vez de
// "public", para no chocar con las tablas de otros proyectos en ese mismo
// proyecto de Supabase. Fijamos el search_path en cada conexión nueva del pool.
const DB_SCHEMA = process.env.DB_SCHEMA || 'la_preparatoria';
pool.on('connect', (cliente) => {
  cliente.query(`SET search_path TO ${DB_SCHEMA}, public`).catch((err) => {
    logger.error({ err }, 'No se pudo fijar el search_path de PostgreSQL.');
  });
});

async function probarConexion() {
  const cliente = await pool.connect();
  try {
    await cliente.query('SELECT 1');
  } finally {
    cliente.release();
  }
}

module.exports = pool;
module.exports.probarConexion = probarConexion;
