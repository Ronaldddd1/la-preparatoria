import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, X } from 'lucide-react';

// Escáner de QR usando la cámara del dispositivo. Lee frames de un <video>
// en un <canvas> oculto y busca un código con jsQR en un bucle con
// requestAnimationFrame. Al detectar un código llama a onDetectar(valor) y
// espera `pausaMs` antes de volver a intentar, para no disparar el mismo
// código varias veces mientras sigue frente a la cámara.
export default function EscanerQr({ onDetectar, pausaMs = 2500 }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const pausadoRef = useRef(false);
  const [error, setError] = useState('');
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    let animId;
    let montado = true;

    async function iniciar() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!montado) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setActivo(true);
        tick();
      } catch {
        setError('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
      }
    }

    function tick() {
      if (!montado) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !pausadoRef.current) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const codigo = jsQR(imagen.data, imagen.width, imagen.height);
        if (codigo?.data) {
          pausadoRef.current = true;
          onDetectar(codigo.data);
          setTimeout(() => { pausadoRef.current = false; }, pausaMs);
        }
      }
      animId = requestAnimationFrame(tick);
    }

    iniciar();
    return () => {
      montado = false;
      if (animId) cancelAnimationFrame(animId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-marino-900 aspect-video max-w-sm mx-auto">
      <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      {!activo && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm gap-2">
          <Camera className="w-4 h-4" /> Iniciando cámara...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm text-center px-4 gap-2">
          <X className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {activo && <div className="absolute inset-8 border-2 border-white/70 rounded-xl pointer-events-none" />}
    </div>
  );
}
