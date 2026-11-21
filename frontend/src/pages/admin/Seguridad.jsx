import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, KeyRound, Download, DatabaseBackup, QrCode } from 'lucide-react';
import api from '../../api/axios';
import { descargarArchivo } from '../../utils/descargas';
import { Card, PageHeader } from '../../components/ui';

export default function Seguridad() {
  const [activo, setActivo] = useState(null);
  const [qr, setQr] = useState(null);
  const [secretoManual, setSecretoManual] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    api.get('/auth/perfil').then((res) => setActivo(!!res.data.usuario.dosFactorActivo));
  }, []);

  async function iniciarConfiguracion() {
    setError(''); setMensaje(''); setCargando(true);
    try {
      const { data } = await api.post('/auth/2fa/iniciar');
      setQr(data.qr);
      setSecretoManual(data.secretoManual);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar la configuración.');
    } finally {
      setCargando(false);
    }
  }

  async function activar(e) {
    e.preventDefault();
    setError(''); setMensaje(''); setCargando(true);
    try {
      await api.post('/auth/2fa/activar', { codigo });
      setActivo(true);
      setQr(null);
      setSecretoManual('');
      setCodigo('');
      setMensaje('Verificación en dos pasos activada. La próxima vez que ingreses, te pediremos el código.');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'El código no es correcto.');
    } finally {
      setCargando(false);
    }
  }

  async function desactivar(e) {
    e.preventDefault();
    setError(''); setMensaje(''); setCargando(true);
    try {
      await api.post('/auth/2fa/desactivar', { codigo });
      setActivo(false);
      setCodigo('');
      setMensaje('Verificación en dos pasos desactivada.');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'El código no es correcto.');
    } finally {
      setCargando(false);
    }
  }

  async function descargarBackup() {
    setDescargando(true);
    try {
      const fecha = new Date().toISOString().slice(0, 10);
      await descargarArchivo('/reportes/backup.json', `backup-la-preparatoria-${fecha}.json`);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div>
      <PageHeader titulo="Seguridad" subtitulo="Verificación en dos pasos para tu cuenta y copia de seguridad de los datos." />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            {activo ? <ShieldCheck className="w-4 h-4 text-esmeralda-500" /> : <ShieldOff className="w-4 h-4 text-marino-400" />}
            <h2 className="font-display text-lg font-semibold text-marino-800">Verificación en dos pasos</h2>
          </div>
          <p className="text-sm text-marino-400 mb-4">
            Añade un código de un app como Google Authenticator o Authy, además de tu contraseña, al iniciar sesión.
          </p>

          {activo === null && <p className="text-sm text-marino-300">Cargando...</p>}

          {activo === true && !qr && (
            <form onSubmit={desactivar} className="space-y-3">
              <div className="rounded-xl bg-esmeralda-50 border border-esmeralda-100 px-4 py-2.5 text-sm text-esmeralda-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" /> Está activada en tu cuenta.
              </div>
              <div>
                <label className="block text-sm font-medium text-marino-700 mb-1.5">
                  Para desactivarla, ingresa el código actual de tu app
                </label>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="123456"
                  className="w-40 tracking-widest text-center rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
                />
              </div>
              <button
                type="submit"
                disabled={cargando || codigo.length !== 6}
                className="inline-flex items-center gap-2 rounded-xl bg-rojo-500 hover:bg-rojo-600 disabled:opacity-50 text-white font-medium px-5 py-2.5 transition-colors"
              >
                <ShieldOff className="w-4 h-4" /> Desactivar
              </button>
            </form>
          )}

          {activo === false && !qr && (
            <button
              type="button"
              onClick={iniciarConfiguracion}
              disabled={cargando}
              className="inline-flex items-center gap-2 rounded-xl bg-marino-800 hover:bg-marino-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 transition-colors"
            >
              <QrCode className="w-4 h-4" /> Configurar verificación en dos pasos
            </button>
          )}

          {qr && (
            <div className="space-y-4">
              <p className="text-sm text-marino-600">
                Escanea este código con tu app de autenticación y luego ingresa el código de 6 dígitos que genera.
              </p>
              <img src={qr} alt="Código QR para configurar la verificación en dos pasos" className="w-40 h-40 rounded-xl border border-marino-100 p-2" />
              <p className="text-xs text-marino-400">
                ¿No puedes escanear? Ingresa esta clave manualmente: <span className="font-mono font-semibold">{secretoManual}</span>
              </p>
              <form onSubmit={activar} className="space-y-3">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  placeholder="123456"
                  className="w-40 tracking-widest text-center rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
                />
                <div>
                  <button
                    type="submit"
                    disabled={cargando || codigo.length !== 6}
                    className="inline-flex items-center gap-2 rounded-xl bg-esmeralda-500 hover:bg-esmeralda-600 disabled:opacity-50 text-white font-medium px-5 py-2.5 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" /> Confirmar y activar
                  </button>
                </div>
              </form>
            </div>
          )}

          {mensaje && <p className="text-sm text-esmeralda-600 mt-4">{mensaje}</p>}
          {error && <p className="text-sm text-rojo-500 mt-4" role="alert">{error}</p>}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <DatabaseBackup className="w-4 h-4 text-marino-700" />
            <h2 className="font-display text-lg font-semibold text-marino-800">Copia de seguridad</h2>
          </div>
          <p className="text-sm text-marino-400 mb-4">
            Descarga un respaldo completo de los datos del sistema (alumnos, matrículas, asistencia, notas, avisos y
            auditoría) en un archivo JSON. No incluye contraseñas ni claves de seguridad. Guárdalo en un lugar seguro
            de forma periódica.
          </p>
          <button
            type="button"
            onClick={descargarBackup}
            disabled={descargando}
            className="inline-flex items-center gap-2 rounded-xl border border-marino-200 text-marino-700 font-medium px-5 py-2.5 hover:bg-papel disabled:opacity-60 transition-colors"
          >
            <Download className="w-4 h-4" /> {descargando ? 'Generando...' : 'Descargar backup'}
          </button>
        </Card>
      </div>
    </div>
  );
}
