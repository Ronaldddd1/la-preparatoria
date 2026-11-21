const { generateSecret, generateURI, verify } = require('otplib');

// Esta prueba existe porque otplib v13 cambio su API por completo (ya no
// tiene el objeto "authenticator" de versiones anteriores) y ese cambio
// rompio el 2FA en produccion sin que ningun test lo detectara. Verificamos
// aqui el flujo completo: generar secreto, generar el codigo QR (uri), y
// validar un codigo TOTP contra ese secreto.
describe('Integracion con otplib (2FA)', () => {
  it('genera un secreto, una uri otpauth y valida un codigo correcto', async () => {
    const secreto = generateSecret();
    expect(typeof secreto).toBe('string');
    expect(secreto.length).toBeGreaterThan(10);

    const uri = generateURI({ strategy: 'totp', issuer: 'La Preparatoria', label: 'admin', secret: secreto });
    expect(uri).toMatch(/^otpauth:\/\/totp\//);

    const { generate } = require('otplib');
    const codigo = await generate({ secret: secreto });
    expect(codigo).toMatch(/^\d{6}$/);

    const resultado = await verify({ secret: secreto, token: codigo });
    expect(resultado.valid).toBe(true);
  });

  it('rechaza un codigo incorrecto', async () => {
    const secreto = generateSecret();
    const resultado = await verify({ secret: secreto, token: '000000' });
    expect(resultado.valid).toBe(false);
  });
});
