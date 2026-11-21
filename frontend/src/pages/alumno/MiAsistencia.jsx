import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, CheckCircle2, Clock, XCircle, FileCheck, Paperclip, X, Download, FileText, Eye } from 'lucide-react';
import api from '../../api/axios';
import { Card, Chip, EmptyState, PageHeader, StatCard } from '../../components/ui';
import CalendarioMes, { Leyenda, hoyLocalISO } from '../../components/CalendarioMes';
import { descargarArchivo } from '../../utils/descargas';
import { useAuth } from '../../context/AuthContext';

const RESUMEN_CONFIG = [
  { clave: 'presente', etiqueta: 'Presentes', icono: CheckCircle2, color: 'esmeralda' },
  { clave: 'tardanza', etiqueta: 'Tardanzas', icono: Clock, color: 'ambar' },
  { clave: 'falta', etiqueta: 'Faltas', icono: XCircle, color: 'rojo' },
  { clave: 'justificado', etiqueta: 'Justificadas', icono: FileCheck, color: 'azul' },
];

const ETIQUETA_JUSTIFICACION = { pendiente: 'En revisión', aprobado: 'Aprobada', rechazado: 'Rechazada' };
const COLOR_JUSTIFICACION = {
  pendiente: 'bg-ambar-50 text-ambar-600',
  aprobado: 'bg-esmeralda-50 text-esmeralda-600',
  rechazado: 'bg-rojo-50 text-rojo-500',
};

const FECHA = (v) => String(v).slice(0, 10);
const fechaLarga = (v) => new Date(`${FECHA(v)}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fechaCorta = (v) => new Date(`${FECHA(v)}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const COLOR_ESTADO_JUST = { pendiente: 'ambar', aprobado: 'verde', rechazado: 'rojo' };

export default function MiAsistencia() {
  const { usuario } = useAuth();
  const [asistencia, setAsistencia] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [justificaciones, setJustificaciones] = useState([]);
  const [feriados, setFeriados] = useState({});
  const [justificando, setJustificando] = useState(null);
  const ahora = new Date();
  const [mes, setMes] = useState({ anio: ahora.getFullYear(), mes0: ahora.getMonth() });

  async function descargarPdf() {
    await descargarArchivo(`/reportes/asistencia-pdf/${usuario.alumno.id}`, `mi-asistencia.pdf`, true);
  }

  function cargar() {
    api.get('/asistencias/mia').then((res) => setAsistencia(res.data));
    api.get('/asistencias/mia/resumen').then((res) => setResumen(res.data));
    api.get('/justificaciones/mias').then((res) => setJustificaciones(res.data)).catch(() => setJustificaciones([]));
  }
  useEffect(cargar, []);

  // Feriados (nacionales automáticos + los que registre el colegio) del año que se está viendo.
  useEffect(() => {
    api.get('/calendario', { params: { anioEscolar: mes.anio } }).then((res) => {
      const mapa = {};
      res.data.filter((e) => e.tipo === 'feriado').forEach((e) => { mapa[FECHA(e.fecha_inicio)] = e.titulo; });
      setFeriados(mapa);
    }).catch(() => setFeriados({}));
  }, [mes.anio]);

  const porFecha = useMemo(() => {
    const m = {};
    (asistencia || []).forEach((a) => { m[FECHA(a.fecha)] = a; });
    return m;
  }, [asistencia]);

  if (!asistencia) return <p className="text-marino-400">Cargando asistencia...</p>;

  const hoy = hoyLocalISO();
  const faltasSinJustificar = asistencia.filter((a) => a.estado === 'falta' && !a.justificacion_estado);
  const eventosRecientes = asistencia.filter((a) => a.estado !== 'presente').slice(0, 5);

  function celda(iso, d, finDeSemana) {
    if (finDeSemana) return { tono: 'libre' };
    const a = porFecha[iso];
    if (feriados[iso] && !a) return { tono: 'feriado', titulo: feriados[iso], sub: 'Feriado' };
    if (a) {
      if (a.estado === 'presente') return { tono: 'ok', titulo: 'Puntual' };
      if (a.estado === 'tardanza') return { tono: 'tardanza', titulo: 'Tardanza', sub: a.observacion };
      if (a.estado === 'justificado') return { tono: 'justificado', titulo: 'Falta justif.', sub: a.observacion };
      const pendiente = !a.justificacion_estado;
      return {
        tono: 'falta',
        titulo: 'Falta',
        sub: pendiente ? 'Toca para justificar' : `Justificación ${ETIQUETA_JUSTIFICACION[a.justificacion_estado].toLowerCase()}`,
        onClick: pendiente ? () => setJustificando(a) : undefined,
      };
    }
    if (iso > hoy) return { tono: 'futuro' };
    return { tono: 'neutro', sub: 'Sin registro' };
  }

  return (
    <div>
      <PageHeader
        etiquetas={<Chip color="azul">MI PROGRESO • ASISTENCIA</Chip>}
        titulo="Mi asistencia"
        subtitulo="Tu calendario de asistencia y tus solicitudes de justificación de faltas."
        accion={asistencia.length > 0 && (
          <button onClick={descargarPdf} className="flex items-center gap-2 rounded-xl bg-marino-700 hover:bg-marino-800 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
            <Download className="w-4 h-4" aria-hidden="true" /> Descargar reporte en PDF
          </button>
        )}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {RESUMEN_CONFIG.map(({ clave, etiqueta, icono, color }) => {
          const v = resumen?.[clave] ?? 0;
          const total = asistencia.length || 1;
          return <StatCard key={clave} icono={icono} etiqueta={etiqueta} valor={v} color={color} detalle={`${Math.round((v / total) * 100)}% de los registros`} />;
        })}
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-5 mb-6">
        <Card className="p-5">
          <CalendarioMes mes={mes} setMes={setMes} celda={celda} soloLectiva
            cabecera="Los feriados nacionales se muestran automáticamente." />
          <Leyenda items={[['ok', 'Puntual'], ['tardanza', 'Tardanza'], ['justificado', 'Falta justificada'], ['falta', 'Falta injustificada'], ['feriado', 'Feriado']]} />
        </Card>

        <Card className="p-5 h-fit">
          <h2 className="font-display text-lg font-semibold text-marino-900 mb-3">Eventos recientes</h2>
          {eventosRecientes.length === 0 ? (
            <p className="text-sm text-marino-400">Sin tardanzas ni faltas registradas. ¡Sigue así!</p>
          ) : (
            <ul className="space-y-2.5">
              {eventosRecientes.map((a) => {
                const esFalta = a.estado === 'falta';
                return (
                  <li key={a.id} className="rounded-xl bg-marino-50/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-marino-900 capitalize">
                        {a.estado === 'justificado' ? 'Falta justificada' : a.estado}
                      </p>
                      <Chip color={a.estado === 'tardanza' ? 'ambar' : a.estado === 'falta' ? 'rojo' : 'azul'}>{fechaCorta(a.fecha)}</Chip>
                    </div>
                    {a.observacion && <p className="text-xs text-marino-500 mt-1">{a.observacion}</p>}
                    {esFalta && !a.justificacion_estado && (
                      <button onClick={() => setJustificando(a)} className="mt-2 text-xs font-semibold text-rojo-500 hover:underline">Justificar esta falta</button>
                    )}
                    {esFalta && a.justificacion_estado && (
                      <p className="mt-1.5 text-xs text-marino-500">Justificación: <span className="font-semibold">{ETIQUETA_JUSTIFICACION[a.justificacion_estado]}</span></p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-marino-900">Historial de justificaciones de falta</h2>
            <p className="text-xs text-marino-400 mt-0.5">Solicitudes enviadas a Coordinación Académica. Puedes adjuntar certificado o constancia.</p>
          </div>
          <Chip color="gris">{justificaciones.length} {justificaciones.length === 1 ? 'registro' : 'registros'}</Chip>
        </div>

        {faltasSinJustificar.length > 0 && (
          <div className="mx-5 mb-4 rounded-xl bg-rojo-50 border border-rojo-100 p-4">
            <p className="text-sm font-semibold text-rojo-500 mb-2">Tienes {faltasSinJustificar.length} {faltasSinJustificar.length === 1 ? 'falta' : 'faltas'} sin justificar</p>
            <div className="flex flex-wrap gap-2">
              {faltasSinJustificar.map((a) => (
                <button key={a.id} onClick={() => setJustificando(a)}
                  className="rounded-lg bg-white border border-rojo-100 px-3 py-1.5 text-xs font-semibold text-rojo-500 hover:bg-rojo-100/40 transition-colors">
                  Justificar {fechaCorta(a.fecha)}
                </button>
              ))}
            </div>
          </div>
        )}

        {justificaciones.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-marino-400">Aún no has enviado solicitudes de justificación.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-marino-400 text-[11px] uppercase tracking-wider bg-marino-50/50">
                  <th className="px-5 py-3">Fecha de falta</th>
                  <th className="px-3 py-3">Motivo</th>
                  <th className="px-3 py-3">Documento de respaldo</th>
                  <th className="px-3 py-3">Fecha de solicitud</th>
                  <th className="px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-marino-50">
                {justificaciones.map((j) => (
                  <tr key={j.id}>
                    <td className="px-5 py-3 font-semibold text-marino-900 capitalize">{fechaLarga(j.fecha)}</td>
                    <td className="px-3 py-3 text-marino-600 max-w-[240px]">{j.comentario || '—'}</td>
                    <td className="px-3 py-3">
                      {j.archivo_url ? (
                        <a href={j.archivo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-marino-700 hover:text-rojo-500">
                          <FileText className="w-4 h-4 text-rojo-400" /> {j.archivo_nombre || 'Ver archivo'} <Eye className="w-3.5 h-3.5" />
                        </a>
                      ) : <span className="text-xs text-marino-300">Sin documento</span>}
                    </td>
                    <td className="px-3 py-3 text-marino-500">{fechaCorta(j.creado_en)}</td>
                    <td className="px-5 py-3"><Chip color={COLOR_ESTADO_JUST[j.estado] || 'gris'} punto>{ETIQUETA_JUSTIFICACION[j.estado] || j.estado}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {justificando && (
        <ModalJustificar asistencia={justificando} onCerrar={() => setJustificando(null)} onExito={() => { setJustificando(null); cargar(); }} />
      )}
    </div>
  );
}

function ModalJustificar({ asistencia, onCerrar, onExito }) {
  const [comentario, setComentario] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setError(''); setEnviando(true);
    try {
      const form = new FormData();
      form.append('asistenciaId', asistencia.id);
      form.append('comentario', comentario);
      if (archivo) form.append('archivo', archivo);
      await api.post('/justificaciones', form);
      onExito();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-marino-900/50 backdrop-blur-sm flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-6 relative">
        <button onClick={onCerrar} aria-label="Cerrar" className="absolute top-4 right-4 text-marino-300 hover:text-marino-600">
          <X className="w-4 h-4" />
        </button>
        <h2 className="font-display text-lg font-semibold text-marino-800 mb-1">Justificar falta</h2>
        <p className="text-sm text-marino-400 mb-4">
          {new Date(asistencia.fecha).toLocaleDateString('es-PE')}
        </p>
        <form onSubmit={enviar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-marino-700 mb-1.5">Motivo</label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder="Ej. Cita médica, motivo familiar..."
              className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-marino-700 mb-1.5">
              Adjuntar certificado o constancia (opcional)
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-marino-200 px-4 py-3 text-sm text-marino-500 cursor-pointer hover:border-marino-300 transition-colors">
              <Paperclip className="w-4 h-4 shrink-0" aria-hidden="true" />
              {archivo ? archivo.name : 'JPG, PNG o PDF, hasta 5 MB'}
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setArchivo(e.target.files[0] || null)} className="hidden" />
            </label>
          </div>
          {error && <p className="text-sm text-rojo-500" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-marino-800 hover:bg-marino-700 disabled:opacity-60 text-white font-medium py-2.5 transition-colors"
          >
            {enviando ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </form>
      </Card>
    </div>
  );
}
