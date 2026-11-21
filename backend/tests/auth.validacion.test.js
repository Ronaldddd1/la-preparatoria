const request = require('supertest');
const app = require('../src/app');

// Estas pruebas solo verifican la validacion de entrada (zod), que corre
// antes de tocar la base de datos, para que puedan correr sin conexion real.

describe('POST /api/auth/login — validacion', () => {
  it('rechaza si falta el usuario', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: '123456' });
    expect(res.statusCode).toBe(400);
  });

  it('rechaza si falta la contrasena', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
    expect(res.statusCode).toBe(400);
  });

  it('rechaza un body vacio', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('Rutas protegidas', () => {
  it('GET /api/auth/perfil sin token responde 401', async () => {
    const res = await request(app).get('/api/auth/perfil');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/reportes/dashboard sin token responde 401', async () => {
    const res = await request(app).get('/api/reportes/dashboard');
    expect(res.statusCode).toBe(401);
  });
});
