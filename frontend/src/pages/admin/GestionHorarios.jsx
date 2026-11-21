import { useEffect, useState } from 'react';
import { CalendarPlus, Copy } from 'lucide-react';
import api from '../../api/axios';
import GrillaHorario from '../../components/GrillaHorario';
import { Card, PageHeader } from '../../components/ui';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const ANIO = 2026;
const formVacio = { cursoId: '', docenteId: '', diaSemana: 'Lunes', horaInicio: '08:00', horaFin: '09:00', aula: '' };

export default function GestionHorarios() {
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [gradoId, setGradoId] = useState('');
  const [seccionId, setSeccionId] = useState('');
  const [clases, setClases] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [seccionOrigenId, setSeccionOrigenId] = useState('');
  const [clonando, setClonando] = useState(false);
  const [clonMensaje, setClonMensaje] = useState('');
  const [clonError, setClonError] = useState('');

  useEffect(() => {
    api.get('/grados').then((res) => setGrados(res.data));
    api.get('/docentes').then((res) => setDocentes(res.data));
  }, []);
  useEffect(() => {
    if (!gradoId) { setSecciones([]); setSeccionId(''); return; }
    api.get('/secciones', { params: { gradoId, anio: ANIO } }).then((res) => setSecciones(res.data));
    api.get('/cursos', { params: { gradoId } }).then((res) => setCursos(res.data));
    setSeccionId('');
  }, [gradoId]);
  useEffect(() => { if (seccionId) cargarHorario(); else setClases([]); }, [seccionId]);

  function cargarHorario() { api.get('/horarios', { params: { seccionId } }).then((res) => setClases(res.data)); }

  async function agregarClase(e) {
    e.preventDefault(); setError(''); setMensaje('');
    try {
      await api.post('/horarios', {
        seccionId, cursoId: form.cursoId, docenteId: form.docenteId || null, diaSemana: form.diaSemana,
        horaInicio: `${form.horaInicio}:00`, horaFin: `${form.horaFin}:00`, aula: form.aula || null,
      });
      setMensaje('Clase agregada al horario.'); setForm(formVacio); cargarHorario();
    } catch (err) { setError(err.response?.data?.mensaje || 'No se pudo agregar la clase.'); }
  }

  async function eliminarClase(clase) {
    if (!confirm(`¿Quitar ${clase.curso_nombre} del ${clase.dia_semana}?`)) return;
    await api.delete(`/horarios/${clase.id}`);
    cargarHorario();
  }

  async function clonarHorario() {
    if (!seccionOrigenId) return;
    setClonError(''); setClonMensaje(''); setClonando(true);
    try {
      const { data } = await api.post('/horarios/clonar', { seccionOrigenId, seccionDestinoId: seccionId });
      setClonMensaje(
        data.omitidas.length > 0
          ? `${data.mensaje} ${data.omitidas.length} se omitieron por cruzarse con clases ya existentes.`
          : data.mensaje
      );
      setSeccionOrigenId('');
      cargarHorario();
    } catch (err) {
      setClonError(err.response?.data?.mensaje || 'No se pudo clonar el horario.');
    } finally {
      setClonando(false);
    }
  }

  return (
    <div>
      <PageHeader titulo="Horarios" subtitulo="Arma el horario semanal de cada sección." />

      <Card className="p-6 grid sm:grid-cols-2 gap-4 mb-6">
        <Selector etiqueta="Grado" valor={gradoId} onChange={setGradoId}>
          <option value="">Selecciona un grado</option>
          {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre} - {g.nivel}</option>)}
        </Selector>
        <Selector etiqueta="Sección" valor={seccionId} onChange={setSeccionId} disabled={!gradoId}>
          <option value="">Selecciona una sección</option>
          {secciones.map((s) => <option key={s.id} value={s.id}>Sección {s.nombre}</option>)}
        </Selector>
      </Card>

      {seccionId && (
        <>
          {secciones.filter((s) => String(s.id) !== String(seccionId)).length > 0 && (
            <Card className="p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Copy className="w-4 h-4 text-marino-500" aria-hidden="true" />
                <h2 className="font-display text-base font-semibold text-marino-800">Clonar horario desde otra sección</h2>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px]">
                  <Selector etiqueta="Copiar el horario de" valor={seccionOrigenId} onChange={setSeccionOrigenId}>
                    <option value="">Selecciona una sección</option>
                    {secciones.filter((s) => String(s.id) !== String(seccionId)).map((s) => (
                      <option key={s.id} value={s.id}>Sección {s.nombre}</option>
                    ))}
                  </Selector>
                </div>
                <button
                  type="button"
                  onClick={clonarHorario}
                  disabled={!seccionOrigenId || clonando}
                  className="rounded-xl bg-marino-800 hover:bg-marino-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 transition-colors"
                >
                  {clonando ? 'Copiando...' : 'Clonar horario'}
                </button>
              </div>
              <p className="text-xs text-marino-400 mt-2">
                Copia todas las clases de esa sección a la sección seleccionada arriba. Las clases que se crucen con horarios ya existentes se omiten.
              </p>
              {clonError && <p className="text-sm text-rojo-500 mt-3">{clonError}</p>}
              {clonMensaje && <p className="text-sm text-esmeralda-600 mt-3">{clonMensaje}</p>}
            </Card>
          )}

          <form onSubmit={agregarClase} className="mb-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CalendarPlus className="w-4 h-4 text-rojo-400" />
                <h2 className="font-display text-lg font-semibold text-marino-800">Agregar clase al horario</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Selector etiqueta="Curso" valor={form.cursoId} onChange={(v) => setForm({ ...form, cursoId: v })} requerido>
                  <option value="">Selecciona un curso</option>
                  {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Selector>
                <Selector etiqueta="Docente (opcional)" valor={form.docenteId} onChange={(v) => setForm({ ...form, docenteId: v })}>
                  <option value="">Sin asignar</option>
                  {docentes.map((d) => <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres}</option>)}
                </Selector>
                <Selector etiqueta="Día" valor={form.diaSemana} onChange={(v) => setForm({ ...form, diaSemana: v })} requerido>
                  {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Selector>
                <Campo etiqueta="Hora inicio" tipo="time" valor={form.horaInicio} onChange={(v) => setForm({ ...form, horaInicio: v })} />
                <Campo etiqueta="Hora fin" tipo="time" valor={form.horaFin} onChange={(v) => setForm({ ...form, horaFin: v })} />
                <Campo etiqueta="Aula (opcional)" valor={form.aula} onChange={(v) => setForm({ ...form, aula: v })} placeholder="Ej. 203" />
              </div>
              {error && <p className="text-sm text-rojo-500 mt-4">{error}</p>}
              {mensaje && <p className="text-sm text-esmeralda-600 mt-4">{mensaje}</p>}
              <button type="submit" className="mt-5 rounded-xl bg-rojo-400 hover:bg-rojo-500 text-white font-semibold px-5 py-2.5 shadow-glow transition-all">
                Agregar al horario
              </button>
            </Card>
          </form>

          <p className="text-sm text-marino-400 mb-3">Toca una clase para quitarla del horario.</p>
          <GrillaHorario clases={clases} accionable onClickClase={eliminarClase} />
        </>
      )}
    </div>
  );
}

function Campo({ etiqueta, valor, onChange, tipo = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
    </div>
  );
}
function Selector({ etiqueta, valor, onChange, children, disabled, requerido }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <select value={valor} required={requerido} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-200 px-4 py-2.5 bg-white disabled:opacity-50 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
        {children}
      </select>
    </div>
  );
}
