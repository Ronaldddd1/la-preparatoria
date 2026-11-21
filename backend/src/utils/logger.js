const pino = require('pino');

const esProduccion = process.env.NODE_ENV === 'production';
const esTest = process.env.NODE_ENV === 'test';

const logger = pino({
  level: process.env.LOG_LEVEL || (esTest ? 'silent' : esProduccion ? 'info' : 'debug'),
  transport: esProduccion
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
});

module.exports = logger;
