import { useEffect, useState } from 'react';
import { Megaphone, Send, MessageSquare } from 'lucide-react';
import api from '../../api/axios';
import { Card, PageHeader } from '../../components/ui';
import HiloComentariosAviso from '../../components/HiloComentariosAviso';

const formVacio = { titulo: '', contenido: '', dirigidoA: 'todos' };

export default function GestionAvisos() {
  const [avisos, setAvisos] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [abiertos, setAbiertos] = useState({});
  function alternar(id) { setAbiertos((prev) => ({ ...prev, [id]: !prev[id] })); }

  useEffect(() => { cargar(); }, []);
  function cargar() { api.get('/avisos').then((res) => setAvisos(res.data)); }

  async function publicar(e) {
    e.preventDefault(); setError(''); setGuardando(true);
    try { await api.post('/avisos', form); setForm(formVacio); cargar(); }
    catch (err) { setError(err.response?.data?.mensaje || 'No se pudo publicar el aviso.'); }
    finally { setGuardando(false); }
  }

  return (
    <div>
      <PageHeader titulo="Avisos" subtitulo="Publica comunicados para alumnos, docentes o todo el colegio." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-rojo-400" />
            <h2 className="font-display text-lg font-semibold text-marino-800">Publicar aviso</h2>
          </div>
          <form onSubmit={publicar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-marino-700 mb-1.5">Título</label>
              <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-marino-700 mb-1.5">Contenido</label>
              <textarea required rows={5} value={form.contenido} onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-marino-700 mb-1.5">Dirigido a</label>
              <select value={form.dirigidoA} onChange={(e) => setForm({ ...form, dirigidoA: e.target.value })}
                className="w-full rounded-xl border border-marino-200 px-4 py-2.5 bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
                <option value="todos">Todos</option><option value="alumnos">Solo alumnos</option><option value="docentes">Solo docentes</option>
              </select>
            </div>
            {error && <p className="text-sm text-rojo-500">{error}</p>}
            <button disabled={guardando} className="flex items-center gap-2 rounded-xl bg-rojo-400 hover:bg-rojo-500 text-white font-semibold px-5 py-2.5 shadow-glow disabled:opacity-60 transition-all">
              <Send className="w-4 h-4" /> {guardando ? 'Publicando...' : 'Publicar'}
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          {avisos.map((a) => (
            <Card key={a.id} className="p-5" hover>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-semibold text-marino-800">{a.titulo}</h3>
                <span className="text-xs rounded-full bg-marino-50 text-marino-500 px-2.5 py-0.5">{a.dirigido_a}</span>
              </div>
              <p className="text-sm text-marino-600 whitespace-pre-wrap">{a.contenido}</p>
              <p className="text-xs text-marino-400 mt-2">{new Date(a.created_at).toLocaleDateString('es-PE')} · {a.publicado_por_username}</p>
              <button
                onClick={() => alternar(a.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-marino-500 hover:text-rojo-500 transition-colors mt-3"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Comentarios
              </button>
              {abiertos[a.id] && <HiloComentariosAviso avisoId={a.id} />}
            </Card>
          ))}
          {avisos.length === 0 && <p className="text-marino-400 text-sm">Aún no hay avisos publicados.</p>}
        </div>
      </div>
    </div>
  );
}
