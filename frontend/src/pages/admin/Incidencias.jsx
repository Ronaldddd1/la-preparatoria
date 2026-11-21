import { useEffect, useState } from 'react';
import { Search, AlertTriangle, Send, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { Card, PageHeader } from '../../components/ui';

const ETIQUETA_TIPO = { positiva: 'Positiva', leve: 'Leve', moderada: 'Moderada', grave: 'Grave' };
const COLOR_TIPO = {
  positiva: 'bg-esmeralda-50 text-esmeralda-600',
  leve: 'bg-ambar-50 text-ambar-600',
  moderada: 'bg-rojo-50 text-rojo-500',
  grave: 'bg-rojo-100 text-rojo-600',
};

export default function Incidencias() {
  const [todas, setTodas] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [resultados, setResultados] = useState([]);
  const [alumno, setAlumno] = useState(null);
  const [incidencias, setIncidencias] = useState([]);
  const [form, setForm] = useState({ tipo: 'leve', descripcion: '' });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarTodas(); }, []);
  function cargarTodas() { api.get('/incidencias').then((res) => setTodas(res.data)); }

  async function buscarAlumnos(e) {
    e.preventDefault();
    const { data } = await api.get('/alumnos', { params: { buscar } });
    setResultados(data);
  }

  async function elegirAlumno(a) {
    setAlumno(a);
    setResultados([]);
    setBuscar('');
    setMensaje('');
    const { data } = await api.get('/incidencias', { params: { alumnoId: a.id } });
    setIncidencias(data);
  }

  async function registrar(e) {
    e.preventDefault(); setError(''); setGuardando(true);
    try {
      await api.post('/incidencias', { alumnoId: alumno.id, ...form });
      setForm({ tipo: 'leve', descripcion: '' });
      setMensaje('Incidencia registrada.');
      const { data } = await api.get('/incidencias', { params: { alumnoId: alumno.id } });
      setIncidencias(data);
      cargarTodas();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo registrar la incidencia.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta incidencia?')) return;
    await api.delete(`/incidencias/${id}`);
    cargarTodas();
    if (alumno) elegirAlumno(alumno);
  }

  return (
    <div>
      <PageHeader titulo="Incidencias" subtitulo="Registra y consulta observaciones de conducta de los alumnos." />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6 h-fit">
          {!alumno ? (
            <>
              <h2 className="font-display text-lg font-semibold text-marino-800 mb-4">Buscar alumno</h2>
              <form onSubmit={buscarAlumnos} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marino-300" />
                  <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="DNI o nombre..."
                    className="w-full rounded-xl border border-marino-200 pl-10 pr-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
                </div>
                <button className="rounded-xl bg-marino-800 hover:bg-marino-700 text-white px-4 font-medium transition-colors">Buscar</button>
              </form>
              {resultados.length > 0 && (
                <Card className="mt-3 divide-y divide-marino-50">
                  {resultados.map((a) => (
                    <button key={a.id} onClick={() => elegirAlumno(a)} className="w-full text-left px-4 py-3 hover:bg-papel transition-colors">
                      <p className="font-medium text-marino-800">{a.apellidos}, {a.nombres}</p>
                      <p className="text-xs text-marino-400">DNI {a.dni}</p>
                    </button>
                  ))}
                </Card>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-marino-800">{alumno.nombres} {alumno.apellidos}</h2>
                <button onClick={() => setAlumno(null)} className="text-xs font-medium text-marino-500 hover:text-rojo-500 transition-colors">Cambiar alumno</button>
              </div>
              <form onSubmit={registrar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-marino-700 mb-1.5">Tipo</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full rounded-xl border border-marino-200 px-4 py-2.5 bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
                    {Object.entries(ETIQUETA_TIPO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-marino-700 mb-1.5">Descripción</label>
                  <textarea required rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
                </div>
                {error && <p className="text-sm text-rojo-500">{error}</p>}
                {mensaje && <p className="text-sm text-esmeralda-600">{mensaje}</p>}
                <button disabled={guardando} className="flex items-center gap-2 rounded-xl bg-rojo-400 hover:bg-rojo-500 text-white font-semibold px-5 py-2.5 shadow-glow disabled:opacity-60 transition-all">
                  <Send className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Registrar incidencia'}
                </button>
              </form>

              {incidencias.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h3 className="text-sm font-medium text-marino-700">Historial</h3>
                  {incidencias.map((i) => (
                    <div key={i.id} className="rounded-xl border border-marino-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${COLOR_TIPO[i.tipo]}`}>{ETIQUETA_TIPO[i.tipo]}</span>
                        <span className="text-xs text-marino-400">{new Date(i.creado_en).toLocaleDateString('es-PE')}</span>
                      </div>
                      <p className="text-sm text-marino-700 mt-1.5">{i.descripcion}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-marino-700">Últimas incidencias registradas</h3>
          {todas.map((i) => (
            <Card key={i.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-marino-800 text-sm">{i.apellidos}, {i.nombres} <span className="text-marino-400 font-normal">· DNI {i.dni}</span></p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${COLOR_TIPO[i.tipo]}`}>{ETIQUETA_TIPO[i.tipo]}</span>
                  <span className="text-xs text-marino-400">{new Date(i.creado_en).toLocaleDateString('es-PE')}</span>
                </div>
                <p className="text-sm text-marino-600 mt-1.5">{i.descripcion}</p>
              </div>
              <button onClick={() => eliminar(i.id)} aria-label="Eliminar" className="text-marino-300 hover:text-rojo-500 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
          {todas.length === 0 && (
            <p className="text-sm text-marino-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Aún no hay incidencias registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
