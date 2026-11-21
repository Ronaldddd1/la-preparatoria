import { useState } from 'react';
import { ScrollText, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card, PageHeader } from '../components/ui';

export default function TerminosCondiciones() {
  const [acepto, setAcepto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const { actualizarUsuario } = useAuth();

  async function manejarEnvio(e) {
    e.preventDefault();
    if (!acepto) return;
    setEnviando(true);
    setError('');
    try {
      await api.post('/auth/aceptar-terminos');
      actualizarUsuario({ aceptoTerminos: true });
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo registrar tu aceptación. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <PageHeader
        titulo="Términos y condiciones de uso"
        subtitulo="Léelos con atención. Debes aceptarlos para continuar usando el sistema."
      />
      <Card className="max-w-2xl p-6">
        <div
          className="w-11 h-11 rounded-xl bg-marino-50 flex items-center justify-center mb-4"
          aria-hidden="true"
        >
          <ScrollText className="w-5 h-5 text-marino-700" />
        </div>

        <div
          className="max-h-80 overflow-y-auto rounded-xl border border-marino-100 bg-papel-50/60 p-4 text-sm text-marino-700 leading-relaxed space-y-3"
          tabIndex={0}
          role="region"
          aria-label="Texto de los términos y condiciones"
        >
          <p>
            Este sistema es una herramienta interna de <strong>La Preparatoria</strong> para la
            gestión de matrículas, horarios, asistencia, notas y comunicados. El acceso es
            personal e intransferible: no debes compartir tu usuario ni tu contraseña con
            terceros.
          </p>
          <p>
            La información académica y personal registrada aquí (datos de alumnos, notas,
            asistencia, contacto de apoderados) es confidencial y solo debe usarse para los
            fines administrativos y académicos del colegio.
          </p>
          <p>
            Cada acción administrativa sensible (matrícula, retiro, traslado, creación de
            cuentas, edición de notas fuera de plazo) queda registrada en el módulo de
            auditoría con fecha, usuario y detalle.
          </p>
          <p>
            Las notas registradas por un docente solo pueden editarse dentro de los 2 días
            siguientes a su registro; pasado ese plazo, únicamente el administrador puede
            corregirlas.
          </p>
          <p>
            El mal uso del sistema (acceso indebido a datos de terceros, alteración de
            registros, uso de credenciales ajenas) puede dar lugar a la suspensión de la
            cuenta y a las medidas disciplinarias que correspondan según las normas del
            colegio.
          </p>
          <p>
            Este sistema no usa cookies de seguimiento ni de publicidad. Solo guarda en tu
            navegador los datos mínimos necesarios para mantener tu sesión iniciada, y se
            eliminan al cerrar sesión.
          </p>
          <p>
            Al aceptar, confirmas que usarás el sistema de forma responsable y de acuerdo con
            estos términos.
          </p>
        </div>

        <form onSubmit={manejarEnvio} className="mt-5 space-y-4">
          <label className="flex items-start gap-3 text-sm text-marino-800 cursor-pointer">
            <input
              type="checkbox"
              checked={acepto}
              onChange={(e) => setAcepto(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-marino-300 text-rojo-500 focus:ring-rojo-300"
              aria-describedby="terminos-descripcion"
            />
            <span id="terminos-descripcion">
              He leído y acepto los términos y condiciones de uso del sistema.
            </span>
          </label>

          {error && (
            <p className="text-sm text-rojo-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!acepto || enviando}
            className="inline-flex items-center gap-2 rounded-xl bg-marino-800 hover:bg-marino-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            Aceptar y continuar
          </button>
        </form>
      </Card>
    </div>
  );
}
