import { useEffect, useState } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { Card, Chip, PageHeader } from '../../components/ui';
import CalendarioAcademico from '../../components/CalendarioAcademico';

const ETIQUETA_TIPO = {
  feriado: 'Feriado / no laborable',
  examen: 'Examen',
  inicio_bimestre: 'Inicio de bimestre',
  fin_bimestre: 'Fin de bimestre',
  otro: 'Otro',
};

function hoyISO() { return new Date().toISOString().slice(0, 10); }
const formVacio = { titulo: '', tipo: 'feriado', fechaInicio: hoyISO(), fechaFin: '', descripcion: '', anioEscolar: new Date().getFullYear() };

export default function GestionCalendario() {
  const [eventos, setEventos] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargar(); }, []);
  function cargar() { api.get('/calendario', { params: { anioEscolar: new Date().getFullYear() } }).then((res) => setEventos(res.data)); }

  async function agregar(e) {
    e.preventDefault(); setError(''); setGuardando(true);
    try {
      await api.post('/calendario', form);
      setForm({ ...formVacio, anioEscolar: form.anioEscolar });
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo agregar el evento.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este evento del calendario?')) return;
    await api.delete(`/calendario/${id}`);
    cargar();
  }

  return (
    <div>
      <PageHeader etiquetas={<Chip color="azul">ADMINISTRACIÓN • CALENDARIO</Chip>} titulo="Calendario académico" subtitulo="Los feriados nacionales del Perú se agregan solos. Aquí registras exámenes, inicio/fin de bimestre y otros eventos del colegio." />
      <div className="mb-6"><CalendarioAcademico eventos={eventos} /></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <CalendarPlus className="w-4 h-4 text-rojo-400" />
            <h2 className="font-display text-lg font-semibold text-marino-800">Nuevo evento</h2>
          </div>
          <form onSubmit={agregar} className="space-y-4">
            <Campo etiqueta="Título" valor={form.titulo} onChange={(v) => setForm({ ...form, titulo: v })} />
            <div>
              <label className="block text-sm font-medium text-marino-700 mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-xl border border-marino-200 px-4 py-2.5 bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
                {Object.entries(ETIQUETA_TIPO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Campo etiqueta="Fecha inicio" tipo="date" valor={form.fechaInicio} onChange={(v) => setForm({ ...form, fechaInicio: v })} />
              <Campo etiqueta="Fecha fin (opcional)" tipo="date" valor={form.fechaFin} onChange={(v) => setForm({ ...form, fechaFin: v })} />
            </div>
            <Campo etiqueta="Descripción (opcional)" valor={form.descripcion} onChange={(v) => setForm({ ...form, descripcion: v })} />
            <Campo etiqueta="Año escolar" tipo="number" valor={form.anioEscolar} onChange={(v) => setForm({ ...form, anioEscolar: v })} />
            {error && <p className="text-sm text-rojo-500">{error}</p>}
            <button disabled={guardando} className="rounded-xl bg-rojo-400 hover:bg-rojo-500 text-white font-semibold px-5 py-2.5 shadow-glow disabled:opacity-60 transition-all">
              {guardando ? 'Guardando...' : 'Agregar al calendario'}
            </button>
          </form>
        </Card>

        <div className="space-y-3">
          {eventos.filter((e) => !e.automatico).map((e) => (
            <Card key={e.id} className="p-4 flex items-start justify-between gap-3" hover>
              <div className="min-w-0">
                <p className="font-display font-semibold text-marino-800">{e.titulo}</p>
                <p className="text-xs text-marino-400">{ETIQUETA_TIPO[e.tipo]} · {new Date(e.fecha_inicio).toLocaleDateString('es-PE')}{e.fecha_fin ? ` — ${new Date(e.fecha_fin).toLocaleDateString('es-PE')}` : ''}</p>
                {e.descripcion && <p className="text-sm text-marino-600 mt-1">{e.descripcion}</p>}
              </div>
              <button onClick={() => eliminar(e.id)} aria-label="Eliminar" className="text-marino-300 hover:text-rojo-500 transition-colors shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
          {eventos.filter((e) => !e.automatico).length === 0 && <p className="text-marino-400 text-sm">Aún no registraste eventos propios (los feriados nacionales ya aparecen en el calendario).</p>}
        </div>
      </div>
    </div>
  );
}

function Campo({ etiqueta, valor, onChange, tipo = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
    </div>
  );
}
