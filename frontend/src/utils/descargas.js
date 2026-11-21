import api from '../api/axios';

export async function descargarArchivo(url, nombreArchivo, abrirEnPestana = false) {
  const respuesta = await api.get(url, { responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(respuesta.data);
  if (abrirEnPestana) {
    window.open(blobUrl, '_blank');
    return;
  }
  const enlace = document.createElement('a');
  enlace.href = blobUrl;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(blobUrl);
}
