import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, XCircle, FileCheck, Download, Users, QrCode, X, Save } from 'lucide-react';
import api from '../../api/axios';
import { Card, Chip, PageHeader } from '../../components/ui';
import { descargarArchivo } from '../../utils/descargas';
import EscanerQr from '../../components/EscanerQr';

const OPCIONES = [
  { valor: 'presente', etiqueta: 'Presente', icono: CheckCircle2, activo: 'bg-esmeralda-500 text-white' },
  { valor: 'tardanza', etiqueta: 'Tardanza', icono: Clock, activo: 'bg-ambar-400 text-white' },
  { valor: 'falta', etiqueta: 'Falta', icono: XCircle, activo: 'bg-rojo-400 text-white' },
  { valor: 'justificado', etiqueta: 'Justificado', icono: FileCheck, activo: 'bg-marino-700 text-white' },
];

function hoyISO() { return new Date().toISOString().slice(0, 10); }

function Avatar({ nombres, apellidos }) {
  const t = `${(nombres || '?')[0]}${(apellidos || '')[0] || ''}`.toUpperCase();
  return (
    <span className="w-9 h-9 rounded-full bg-marino-50 text-marino-700 text-xs font-bold flex items-center justify-center shrink-0">
      {t}
    </span>
  );
}

export default function Asistencia() {
  const [secciones, setSecciones] = useState([]);
  const [seccionId, setSeccionId] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [alumnos, setAlumnos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [resumenSeccion, setResumenSeccion] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const [avisoQr, setAvisoQr] = useState(null);

  useEffect(() => { api.get('/docentes/mis-secciones').then((res) => setSecciones(res.data)); }, []);
  useEffect(() => { if (seccionId && fecha) cargar(); else setAlumnos([]); }, [seccionId, fecha]);

  useEffect(() => {
    if (!seccionId) { setResumenSeccion(null); return; }
    api.get(`/asistencias/resumen/seccion/${seccionId}`).then((res) => setResumenSeccion(res.data));
  }, [seccionId]);

  function cargar() {
    setError(''); setMensaje('');
    api.get('/asistencias', { params: { seccionId, fecha } })
      .then((res) => setAlumnos(res.data.alumnos.map((a) => ({ ...a, estado: a.estado || 'presente' }))))
      .catch((err) => setError(err.response?.data?.mensaje || 'No se pudo cargar la sección.'));
  }

  function marcar(alumnoId, estado) {
    setAlumnos((prev) => prev.map((a) => (a.alumno_id === alumnoId ? { ...a, estado } : a)));
  }

  function marcarTodosPresentes() {
    setAlumnos((prev) => prev.map((a) => ({ ...a, estado: 'presente' })));
  }

  async function detectarQr(dni) {
    try {
      const { data } = await api.post('/asistencias/marcar-qr', { seccionId, fecha, dni });
      setAvisoQr({ ok: true, texto: `${data.alumno.nombres} ${data.alumno.apellidos} marcado presente.` });
      setAlumnos((prev) => prev.map((a) => (a.alumno_id === data.alumno.id ? { ...a, estado: 'presente' } : a)));
    } catch (err) {
      setAvisoQr({ ok: false, texto: err.response?.data?.mensaje || 'Código no reconocido.' });
    }
  }

  async function guardar() {
    setGuardando(true); setMensaje(''); setError('');
    try {
      await api.post('/asistencias', {
        seccionId, fecha,
        registros: alumnos.map((a) => ({ alumnoId: a.alumno_id, estado: a.estado, observacion: a.observacion })),
      });
      setMensaje('Asistencia guardada.');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar la asistencia.');
    } finally {
      setGuardando(false);
    }
  }

  const conteo = useMemo(() => {
    const c = { presente: 0, tardanza: 0, falta: 0, justificado: 0 };
    alumnos.forEach((a) => { if (c[a.estado] !== undefined) c[a.estado] += 1; });
    return c;
  }, [alumnos]);

  return (
    <div>
      <PageHeader
        etiquetas={<Chip color="azul">MI TRABAJO • REGISTRO DIARIO DE ASISTENCIA</Chip>}
        titulo="Toma de Asistencia y Control Escolar"
        subtitulo="Marca la asistencia diaria de toda la sección (una vez al día, sin importar el curso)."
        accion={alumnos.length > 0 && (
          <>
            <button onClick={marcarTodosPresentes}
              className="flex items-center gap-2 rounded-xl border border-marino-200 bg-white text-marino-700 text-sm font-semibold px-4 py-2.5 hover:bg-marino-50 transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Marcar todos presentes
            </button>
            <button onClick={() => { setEscaneando((v) => !v); setAvisoQr(null); }}
              className="flex items-center gap-2 rounded-xl border border-marino-200 bg-white text-marino-700 text-sm font-semibold px-4 py-2.5 hover:bg-marino-50 transition-colors">
              <QrCode className="w-4 h-4" /> Escanear QR
            </button>
            <button onClick={guardar} disabled={guardando}
              className="flex items-center gap-2 rounded-xl bg-marino-700 hover:bg-marino-800 text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-60 transition-colors">
              <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar asistencia del día'}
            </button>
          </>
        )}
      />

      <div className="grid lg:grid-cols-[1fr_auto] gap-4 mb-6">
        <Card className="p-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-marino-400 mb-1.5">Sección</label>
            <select value={seccionId} onChange={(e) => setSeccionId(e.target.value)}
              className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-4 py-2.5 text-sm text-marino-800 focus:border-marino-400 focus:ring-2 focus:ring-marino-100 outline-none">
              <option value="">Selecciona una sección</option>
              {secciones.map((s) => <option key={s.seccion_id} value={s.seccion_id}>{s.grado_nombre} "{s.seccion_nombre}"</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-marino-400 mb-1.5">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-4 py-2.5 text-sm text-marino-800 focus:border-marino-400 focus:ring-2 focus:ring-marino-100 outline-none" />
          </div>
        </Card>

        {alumnos.length > 0 && (
          <Card className="p-5 grid grid-cols-4 gap-5 text-center lg:min-w-[380px]">
            <Contador etiqueta="Presentes" valor={conteo.presente} clase="text-esmeralda-600" />
            <Contador etiqueta="Tardanzas" valor={conteo.tardanza} clase="text-ambar-500" />
            <Contador etiqueta="Faltas" valor={conteo.falta} clase="text-rojo-500" />
            <Contador etiqueta="Total" valor={alumnos.length} clase="text-marino-900" />
          </Card>
        )}
      </div>

      {error && <p className="text-sm text-rojo-500 mb-4">{error}</p>}
      {mensaje && <p className="text-sm text-esmeralda-600 mb-4">{mensaje}</p>}

      {escaneando && (
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-base font-semibold text-marino-900">Escanea el QR del alumno</p>
            <button onClick={() => setEscaneando(false)} aria-label="Cerrar escáner" className="text-marino-400 hover:text-marino-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <EscanerQr onDetectar={detectarQr} />
          {avisoQr && (
            <p className={`text-sm text-center mt-3 ${avisoQr.ok ? 'text-esmeralda-600' : 'text-rojo-500'}`}>{avisoQr.texto}</p>
          )}
        </Card>
      )}

      {alumnos.length > 0 && (
        <Card className="overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-marino-400 text-[11px] uppercase tracking-wider bg-marino-50/50">
                  <th className="px-5 py-3 w-12">N°</th>
                  <th className="px-3 py-3">Estudiante</th>
                  <th className="px-3 py-3">DNI</th>
                  <th className="px-5 py-3">Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-marino-50">
                {alumnos.map((a, i) => (
                  <tr key={a.alumno_id} className="hover:bg-marino-50/30">
                    <td className="px-5 py-3 text-marino-400">{i + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar nombres={a.nombres} apellidos={a.apellidos} />
                        <span className="text-marino-900 font-semibold">{a.apellidos}, {a.nombres}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-marino-500 tabular-nums">{a.dni || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="inline-flex rounded-xl bg-marino-50 p-1 gap-0.5">
                        {OPCIONES.map((o) => (
                          <button key={o.valor} type="button" onClick={() => marcar(a.alumno_id, o.valor)}
                            aria-pressed={a.estado === o.valor}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                              a.estado === o.valor ? o.activo : 'text-marino-500 hover:bg-white'
                            }`}>
                            <o.icono className="w-3 h-3" /> {o.etiqueta}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {resumenSeccion && resumenSeccion.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rojo-400" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-marino-900">Asistencia contabilizada de la sección</h2>
            </div>
            <button
              onClick={() => descargarArchivo(`/reportes/asistencias.xlsx?seccionId=${seccionId}`, 'asistencias.xlsx')}
              className="flex items-center gap-1.5 text-xs font-semibold text-marino-500 hover:text-rojo-500 transition-colors"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> Exportar a Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-marino-400 text-[11px] uppercase tracking-wider">
                  <th className="px-3 py-2">Alumno</th>
                  <th className="px-3 py-2">Presente</th>
                  <th className="px-3 py-2">Tardanza</th>
                  <th className="px-3 py-2">Falta</th>
                  <th className="px-3 py-2">Justificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-marino-50">
                {resumenSeccion.map((r) => (
                  <tr key={r.alumnoId}>
                    <td className="px-3 py-2 text-marino-800 font-medium">{r.apellidos}, {r.nombres}</td>
                    <td className="px-3 py-2 text-esmeralda-600">{r.presente}</td>
                    <td className="px-3 py-2 text-ambar-500">{r.tardanza}</td>
                    <td className="px-3 py-2 text-rojo-500">{r.falta}</td>
                    <td className="px-3 py-2 text-marino-500">{r.justificado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Contador({ etiqueta, valor, clase }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-marino-400">{etiqueta}</p>
      <p className={`font-display text-[28px] font-semibold leading-tight ${clase}`}>{valor}</p>
    </div>
  );
}
