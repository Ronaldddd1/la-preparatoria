const multer = require('multer');

// Archivos en memoria (no en disco): se suben directo a Cloudinary.
// Limite de 5 MB, solo imagenes y PDF para justificaciones/mensajes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (permitidos.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Solo se permiten imagenes (JPG, PNG, WEBP) o PDF.'));
  },
});

module.exports = upload;
