import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, Chip, PageHeader } from '../components/ui';

export default function CambiarPassword() {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const { actualizarUsuario } = useAuth();

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (passwordNueva !== confirmacion) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    try {
      await api.put('/auth/password', { passwordActual, passwordNueva });
      actualizarUsuario({ debeCambiarPassword: false });
      setMensaje('Tu contraseña se actualizó correctamente.');
      setPasswordActual(''); setPasswordNueva(''); setConfirmacion('');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cambiar la contraseña.');
    }
  }

  return (
    <div>
      <PageHeader etiquetas={<Chip color="azul">MI CUENTA • SEGURIDAD</Chip>} titulo="Cambiar contraseña" subtitulo="Por seguridad, usa una contraseña distinta a tu DNI." />
      <Card className="max-w-md p-7">
        <div className="w-11 h-11 rounded-xl bg-rojo-50 flex items-center justify-center mb-4">
          <KeyRound className="w-5 h-5 text-rojo-400" />
        </div>
        <form onSubmit={manejarEnvio} className="space-y-4">
          <Campo etiqueta="Contraseña actual" valor={passwordActual} onChange={setPasswordActual} />
          <Campo etiqueta="Nueva contraseña" valor={passwordNueva} onChange={setPasswordNueva} />
          <Campo etiqueta="Confirmar nueva contraseña" valor={confirmacion} onChange={setConfirmacion} />
          {error && <p className="text-sm text-rojo-500">{error}</p>}
          {mensaje && <p className="text-sm text-esmeralda-500">{mensaje}</p>}
          <button type="submit" className="rounded-xl bg-marino-700 hover:bg-marino-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
            Actualizar contraseña
          </button>
        </form>
      </Card>
    </div>
  );
}

function Campo({ etiqueta, valor, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <input
        type="password" required value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-4 py-2.5 focus:border-marino-400 focus:ring-2 focus:ring-marino-100 outline-none transition-shadow"
      />
    </div>
  );
}
