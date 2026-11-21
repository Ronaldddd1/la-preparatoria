const bcrypt = require('bcryptjs');
const { generateSecret, generateURI, verify: verificarTotp } = require('otplib');
const QRCode = require('qrcode');
const pool = require('../config/db');
const { firmarToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { username, password, codigo } = req.body;

  const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1 AND activo = TRUE', [username]);
  if (rows.length === 0) throw new AppError('Credenciales incorrectas.', 401);

  const usuario = rows[0];
  const claveValida = await bcrypt.compare(password, usuario.password_hash);
  if (!claveValida) throw new AppError('Credenciales incorrectas.', 401);

  if (usuario.dos_factor_activo) {
    if (!codigo) {
      return res.json({ requiereDosFactor: true });
    }
    const resultado = await verificarTotp({ token: codigo, secret: usuario.dos_factor_secreto });
    if (!resultado.valid) throw new AppError('El código de verificación es incorrecto.', 401);
  }

  let alumno = null;
  let docente = null;
  if (usuario.rol === 'alumno') {
    const { rows: alumnos } = await pool.query('SELECT * FROM alumnos WHERE usuario_id = $1', [usuario.id]);
    alumno = alumnos[0] || null;
  } else if (usuario.rol === 'docente') {
    const { rows: docentes } = await pool.query('SELECT * FROM docentes WHERE usuario_id = $1', [usuario.id]);
    docente = docentes[0] || null;
  }

  const token = firmarToken({
    id: usuario.id,
    username: usuario.username,
    rol: usuario.rol,
    alumnoId: alumno?.id || null,
    docenteId: docente?.id || null,
  });

  res.json({
    token,
    usuario: {
      id: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
      debeCambiarPassword: usuario.debe_cambiar_password,
      aceptoTerminos: usuario.acepto_terminos,
      dosFactorActivo: usuario.dos_factor_activo,
      alumno,
      docente,
    },
  });
});

const cambiarPassword = asyncHandler(async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  const { id } = req.usuario;

  const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  const usuario = rows[0];
  if (!usuario) throw new AppError('Usuario no encontrado.', 404);

  const claveValida = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!claveValida) throw new AppError('La contrasena actual no es correcta.', 401);

  const nuevoHash = await bcrypt.hash(passwordNueva, 10);
  await pool.query('UPDATE usuarios SET password_hash = $1, debe_cambiar_password = FALSE WHERE id = $2', [nuevoHash, id]);

  res.json({ mensaje: 'Contrasena actualizada correctamente.' });
});

const perfil = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT debe_cambiar_password, acepto_terminos, dos_factor_activo FROM usuarios WHERE id = $1',
    [req.usuario.id]
  );
  const extra = rows[0] || {};
  res.json({
    usuario: {
      ...req.usuario,
      debeCambiarPassword: extra.debe_cambiar_password,
      aceptoTerminos: extra.acepto_terminos,
      dosFactorActivo: extra.dos_factor_activo,
    },
  });
});

const aceptarTerminos = asyncHandler(async (req, res) => {
  const { id } = req.usuario;
  await pool.query('UPDATE usuarios SET acepto_terminos = TRUE WHERE id = $1', [id]);
  res.json({ mensaje: 'Términos y condiciones aceptados.' });
});

// ------------------------------------------------------------
// Verificación en dos pasos (2FA) — solo para administradores
// ------------------------------------------------------------

const iniciarDosFactor = asyncHandler(async (req, res) => {
  const { id, username } = req.usuario;
  const secreto = generateSecret();
  await pool.query('UPDATE usuarios SET dos_factor_secreto = $1, dos_factor_activo = FALSE WHERE id = $2', [secreto, id]);

  const otpauth = generateURI({ strategy: 'totp', issuer: 'La Preparatoria', label: username, secret: secreto });
  const qr = await QRCode.toDataURL(otpauth);

  res.json({ qr, secretoManual: secreto });
});

const activarDosFactor = asyncHandler(async (req, res) => {
  const { id } = req.usuario;
  const { codigo } = req.body;

  const { rows } = await pool.query('SELECT dos_factor_secreto FROM usuarios WHERE id = $1', [id]);
  const secreto = rows[0]?.dos_factor_secreto;
  if (!secreto) throw new AppError('Primero genera el código QR de configuración.', 400);

  const resultado = await verificarTotp({ token: codigo, secret: secreto });
  if (!resultado.valid) throw new AppError('El código de verificación es incorrecto.', 401);

  await pool.query('UPDATE usuarios SET dos_factor_activo = TRUE WHERE id = $1', [id]);
  res.json({ mensaje: 'Verificación en dos pasos activada.' });
});

const desactivarDosFactor = asyncHandler(async (req, res) => {
  const { id } = req.usuario;
  const { codigo } = req.body;

  const { rows } = await pool.query('SELECT dos_factor_secreto FROM usuarios WHERE id = $1', [id]);
  const secreto = rows[0]?.dos_factor_secreto;
  if (!secreto) throw new AppError('La verificación en dos pasos no está activa.', 400);

  const resultado = await verificarTotp({ token: codigo, secret: secreto });
  if (!resultado.valid) throw new AppError('El código de verificación es incorrecto.', 401);

  await pool.query('UPDATE usuarios SET dos_factor_activo = FALSE, dos_factor_secreto = NULL WHERE id = $1', [id]);
  res.json({ mensaje: 'Verificación en dos pasos desactivada.' });
});

module.exports = {
  login, cambiarPassword, perfil, aceptarTerminos,
  iniciarDosFactor, activarDosFactor, desactivarDosFactor,
};
