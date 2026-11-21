const request = require('supertest');
const app = require('../src/app');

describe('GET /api/salud', () => {
  it('responde con estado ok sin necesitar base de datos', async () => {
    const res = await request(app).get('/api/salud');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ estado: 'ok', servicio: 'API La Preparatoria' });
  });
});

describe('Rutas no existentes', () => {
  it('responde 404 con un mensaje claro', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.statusCode).toBe(404);
    expect(res.body.mensaje).toBeDefined();
  });
});
