import { useEffect, useState } from 'react';
import { Layers, BookPlus, UserSquare2, BookCopy } from 'lucide-react';
import api from '../../api/axios';
import { Card, PageHeader } from '../../components/ui';

const ANIO = 2026;

export default function GestionCatalogo() {
  const [grados, setGrados] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [gradoSeleccionado, setGradoSeleccionado] = useState('');
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [nuevoCurso, setNuevoCurso] = useState('');
  const [nuevoDocente, setNuevoDocente] = useState({ nombres: '', apellidos: '', especialidad: '' });
  const [mensaje, setMensaje] = useState('');

  const [cursoLote, setCursoLote] = useState('');
  const [nivelLote, setNivelLote] = useState('');
  const [mensajeLote, setMensajeLote] = useState('');
  const [enviandoLote, setEnviandoLote] = useState(false);

  useEffect(() => { api.get('/grados').then((res) => setGrados(res.data)); cargarDocentes(); }, []);
  useEffect(() => {
    if (gradoSeleccionado) api.get('/cursos', { params: { gradoId: gradoSeleccionado } }).then((res) => setCursos(res.data));
    else setCursos([]);
  }, [gradoSeleccionado]);

  function cargarDocentes() { api.get('/docentes').then((res) => setDocentes(res.data)); }

  async function agregarSeccion(e) {
    e.preventDefault();
    if (!gradoSeleccionado || !nuevaSeccion) return;
    await api.post('/secciones', { gradoId: gradoSeleccionado, nombre: nuevaSeccion, anioEscolar: ANIO });
    setNuevaSeccion(''); setMensaje(`Sección "${nuevaSeccion.toUpperCase()}" creada para ${ANIO}.`);
  }

  async function agregarCurso(e) {
    e.preventDefault();
    if (!gradoSeleccionado || !nuevoCurso) return;
    await api.post('/cursos', { gradoId: gradoSeleccionado, nombre: nuevoCurso });
    setNuevoCurso('');
    api.get('/cursos', { params: { gradoId: gradoSeleccionado } }).then((res) => setCursos(res.data));
  }

  async function agregarCursoPorLote(e) {
    e.preventDefault();
    if (!cursoLote.trim()) return;
    setEnviandoLote(true);
    setMensajeLote('');
    try {
      const { data } = await api.post('/cursos/lote', {
        nombre: cursoLote.trim(),
        nivel: nivelLote || undefined,
      });
      setMensajeLote(data.mensaje);
      setCursoLote('');
      if (gradoSeleccionado) {
        api.get('/cursos', { params: { gradoId: gradoSeleccionado } }).then((res) => setCursos(res.data));
      }
    } catch (err) {
      setMensajeLote(err.response?.data?.mensaje || 'No se pudo crear el curso por lote.');
    } finally {
      setEnviandoLote(false);
    }
  }

  async function agregarDocente(e) {
    e.preventDefault();
    if (!nuevoDocente.nombres || !nuevoDocente.apellidos) return;
    await api.post('/docentes', nuevoDocente);
    setNuevoDocente({ nombres: '', apellidos: '', especialidad: '' });
    cargarDocentes();
  }

  return (
    <div>
      <PageHeader titulo="Cursos y secciones" subtitulo="Administra el catálogo académico del colegio." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-marino-700 mb-1.5">Grado de trabajo</label>
            <select value={gradoSeleccionado} onChange={(e) => setGradoSeleccionado(e.target.value)}
              className="w-full rounded-xl border border-marino-200 px-4 py-2.5 bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
              <option value="">Selecciona un grado</option>
              {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre} - {g.nivel}</option>)}
            </select>
          </div>

          <form onSubmit={agregarSeccion} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-marino-700 mb-1.5"><Layers className="w-3.5 h-3.5" /> Nueva sección ({ANIO})</label>
              <input value={nuevaSeccion} onChange={(e) => setNuevaSeccion(e.target.value)} placeholder="Ej. B"
                className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
            </div>
            <button disabled={!gradoSeleccionado} className="rounded-xl bg-marino-800 hover:bg-marino-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 transition-colors">Crear</button>
          </form>

          <form onSubmit={agregarCurso} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-marino-700 mb-1.5"><BookPlus className="w-3.5 h-3.5" /> Nuevo curso para este grado</label>
              <input value={nuevoCurso} onChange={(e) => setNuevoCurso(e.target.value)} placeholder="Ej. Historia"
                className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
            </div>
            <button disabled={!gradoSeleccionado} className="rounded-xl bg-marino-800 hover:bg-marino-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 transition-colors">Crear</button>
          </form>

          {gradoSeleccionado && (
            <div>
              <p className="text-sm font-medium text-marino-700 mb-2">Cursos de este grado</p>
              <div className="flex flex-wrap gap-1.5">
                {cursos.map((c) => <span key={c.id} className="rounded-full bg-marino-50 text-marino-600 text-xs font-medium px-3 py-1">{c.nombre}</span>)}
                {cursos.length === 0 && <span className="text-marino-300 text-sm">Aún no hay cursos.</span>}
              </div>
            </div>
          )}
          {mensaje && <p className="text-sm text-esmeralda-600" role="status">{mensaje}</p>}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookCopy className="w-4 h-4 text-rojo-400" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-marino-800">Curso por lote</h2>
          </div>
          <p className="text-sm text-marino-500">
            Crea el mismo curso para todos los grados de un nivel (o de todo el colegio) en una
            sola vez, en vez de repetirlo grado por grado.
          </p>
          <form onSubmit={agregarCursoPorLote} className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div>
              <label htmlFor="curso-lote-nombre" className="block text-sm font-medium text-marino-700 mb-1.5">
                Nombre del curso
              </label>
              <input
                id="curso-lote-nombre"
                value={cursoLote}
                onChange={(e) => setCursoLote(e.target.value)}
                placeholder="Ej. Educación Financiera"
                className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
              />
            </div>
            <div>
              <label htmlFor="curso-lote-nivel" className="block text-sm font-medium text-marino-700 mb-1.5">
                Nivel
              </label>
              <select
                id="curso-lote-nivel"
                value={nivelLote}
                onChange={(e) => setNivelLote(e.target.value)}
                className="rounded-xl border border-marino-200 px-4 py-2.5 bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
              >
                <option value="">Todos los niveles</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
              </select>
            </div>
            <button
              disabled={!cursoLote.trim() || enviandoLote}
              className="rounded-xl bg-rojo-400 hover:bg-rojo-500 disabled:opacity-50 text-white font-medium px-4 py-2.5 transition-colors"
            >
              {enviandoLote ? 'Creando…' : 'Aplicar a todos'}
            </button>
          </form>
          {mensajeLote && <p className="text-sm text-marino-600" role="status">{mensajeLote}</p>}
        </Card>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <UserSquare2 className="w-4 h-4 text-rojo-400" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-marino-800">Docentes</h2>
          </div>
          <form onSubmit={agregarDocente} className="grid sm:grid-cols-2 gap-3">
            <input value={nuevoDocente.nombres} onChange={(e) => setNuevoDocente({ ...nuevoDocente, nombres: e.target.value })} placeholder="Nombres"
              className="rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
            <input value={nuevoDocente.apellidos} onChange={(e) => setNuevoDocente({ ...nuevoDocente, apellidos: e.target.value })} placeholder="Apellidos"
              className="rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
            <input value={nuevoDocente.especialidad} onChange={(e) => setNuevoDocente({ ...nuevoDocente, especialidad: e.target.value })} placeholder="Especialidad"
              className="sm:col-span-2 rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
            <button className="sm:col-span-2 rounded-xl bg-rojo-400 hover:bg-rojo-500 text-white font-semibold px-4 py-2.5 shadow-glow transition-all">Agregar docente</button>
          </form>
          <ul className="text-sm text-marino-500 space-y-1 max-h-64 overflow-y-auto">
            {docentes.map((d) => <li key={d.id}>· {d.apellidos}, {d.nombres} {d.especialidad ? `— ${d.especialidad}` : ''}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}
