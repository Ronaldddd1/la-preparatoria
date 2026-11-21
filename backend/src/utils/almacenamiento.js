const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const almacenamientoConfigurado = !!(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

if (almacenamientoConfigurado) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Sube un archivo (buffer en memoria) a Cloudinary y devuelve { url, nombre }.
// Lanza un error con el codigo ALMACENAMIENTO_NO_CONFIGURADO si no se
// configuraron las variables de entorno de Cloudinary en el servidor.
function subirArchivo(archivo, carpeta) {
  if (!almacenamientoConfigurado) {
    const err = new Error('El almacenamiento de archivos no esta configurado en el servidor.');
    err.code = 'ALMACENAMIENTO_NO_CONFIGURADO';
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `la-preparatoria/${carpeta}`, resource_type: 'auto' },
      (err, resultado) => {
        if (err) return reject(err);
        resolve({ url: resultado.secure_url, nombre: archivo.originalname });
      }
    );
    streamifier.createReadStream(archivo.buffer).pipe(stream);
  });
}

module.exports = { subirArchivo, almacenamientoConfigurado };
