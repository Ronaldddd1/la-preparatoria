import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { QrCode, X, CheckCircle2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import EscanerQr from '../components/EscanerQr';
import Logo from '../components/Logo';

// Pantalla pensada para dejar una tablet fija en la entrada del colegio:
// se elige una sola vez la sección y desde ahí queda escaneando QR en
// bucle, sin necesidad de que un docente esté frente a la pantalla.
// Vive fuera de Shell (pantalla completa, sin menú lateral).
function hoyISO() { return new Date().toISOString().slice(0, 10); }

export default function Quiosco() {
  const { usuario } = useAuth();
  const [secciones, setSecciones] = useState([]);
  const [seccionId, setSeccionId] = useState('');
  const [activo, setActivo] = useState(false);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (!usuario || usuario.rol === 'alumno') return;
    const endpoint = usuario.rol === 'admin' ? '/secciones' : '/docentes/mis-secciones';
    api.get(endpoint).then((res) => {
      setSecciones(res.data.map((s) => ({
        id: s.id ?? s.seccion_id,
        etiqueta: `${s.grado_nombre} "${s.nombre ?? s.seccion_nombre}"`,
      })));
    });
  }, [usuario]);

  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.rol === 'alumno') return <Navigate to="/alumno" replace />;

  async function detectarQr(dni) {
    try {
      const { data } = await api.post('/asistencias/marcar-qr', { seccionId, fecha: hoyISO(), dni });
      setAviso({ ok: true, texto: `${data.alumno.nombres} ${data.alumno.apellidos}` });
    } catch (err) {
      setAviso({ ok: false, texto: err.response?.data?.mensaje || 'Código no reconocido.' });
    }
    setTimeout(() => setAviso(null), 2200);
  }

  if (!activo) {
    return (
      <div className="min-h-screen bg-marino-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-soft p-6">
          <div className="flex items-center gap-3 mb-5">
            <Logo className="w-9 h-9" />
            <p className="font-display text-lg font-semibold text-marino-800">Modo quiosco</p>
          </div>
          <p className="text-sm text-marino-500 mb-4">Elige la sección para la que esta tablet va a marcar asistencia hoy.</p>
          <select
            value={seccionId}
            onChange={(e) => setSeccionId(e.target.value)}
            className="w-full rounded-xl border border-marino-200 px-4 py-2.5 bg-white mb-4 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
          >
            <option value="">Selecciona una sección</option>
            {secciones.map((s) => <option key={s.id} value={s.id}>{s.etiqueta}</option>)}
          </select>
          <button
            disabled={!seccionId}
            onClick={() => setActivo(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rojo-400 hover:bg-rojo-500 disabled:opacity-50 text-white font-semibold px-5 py-3 shadow-glow transition-all"
          >
            <QrCode className="w-4 h-4" /> Iniciar modo quiosco
          </button>
          <Link to={usuario.rol === 'admin' ? '/admin' : '/docente'} className="block text-center text-xs text-marino-400 hover:text-marino-600 mt-4">
            Volver al panel normal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-marino-900 flex flex-col items-center justify-center px-4 relative">
      <button
        onClick={() => setActivo(false)}
        aria-label="Salir del modo quiosco"
        className="absolute top-5 right-5 text-white/60 hover:text-white flex items-center gap-1.5 text-sm"
      >
        <LogOut className="w-4 h-4" /> Salir
      </button>

      <Logo className="w-14 h-14 mb-4" />
      <p className="text-white font-display text-xl font-semibold mb-1">Escanea tu código QR</p>
      <p className="text-marino-300 text-sm mb-6">para marcar tu asistencia de hoy</p>

      <EscanerQr onDetectar={detectarQr} pausaMs={3000} />

      {aviso && (
        <div className={`mt-6 flex items-center gap-2 rounded-xl px-5 py-3 text-white font-medium ${aviso.ok ? 'bg-esmeralda-500' : 'bg-rojo-500'}`}>
          {aviso.ok ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {aviso.texto}
        </div>
      )}
    </div>
  );
}
