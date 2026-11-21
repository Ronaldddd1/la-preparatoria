import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const INTERVALO_MS = 45000;

export default function Notificaciones({ className = '' }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [noLeidos, setNoLeidos] = useState(0);

  const claveVisto = usuario ? `lp_avisos_visto_${usuario.id}` : null;

  const revisar = useCallback(() => {
    if (!usuario) return;
    api
      .get('/avisos')
      .then((res) => {
        const visto = claveVisto ? localStorage.getItem(claveVisto) : null;
        const umbral = visto ? new Date(visto) : new Date(0);
        const nuevos = res.data.filter((a) => new Date(a.created_at) > umbral).length;
        setNoLeidos(nuevos);
      })
      .catch(() => {});
  }, [usuario, claveVisto]);

  useEffect(() => {
    revisar();
    const id = setInterval(revisar, INTERVALO_MS);
    return () => clearInterval(id);
  }, [revisar]);

  if (!usuario) return null;

  function abrir() {
    if (claveVisto) localStorage.setItem(claveVisto, new Date().toISOString());
    setNoLeidos(0);
    navigate(`/${usuario.rol}/avisos`);
  }

  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={noLeidos > 0 ? `Avisos, ${noLeidos} sin leer` : 'Avisos'}
      className={`relative flex items-center justify-center shrink-0 transition-colors ${className}`}
    >
      <Bell className="w-5 h-5" aria-hidden="true" />
      {noLeidos > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rojo-400 text-white text-[10px] font-semibold flex items-center justify-center">
          {noLeidos > 9 ? '9+' : noLeidos}
        </span>
      )}
    </button>
  );
}
