import { useEffect, useRef, useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui';

export default function HiloMensajes({ horarioId, alumnoId }) {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState(null);
  const [contenido, setContenido] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const finRef = useRef(null);

  function cargar() {
    api
      .get(`/mensajes/conversacion/${horarioId}`, { params: alumnoId ? { alumnoId } : undefined })
      .then((res) => setDatos(res.data));
  }

  useEffect(() => { setDatos(null); cargar(); }, [horarioId, alumnoId]);
  useEffect(() => { finRef.current?.scrollIntoView({ block: 'nearest' }); }, [datos]);

  async function enviar(e) {
    e.preventDefault();
    if (!contenido.trim() && !archivo) return;
    setError(''); setEnviando(true);
    try {
      const form = new FormData();
      form.append('horarioId', horarioId);
      if (alumnoId) form.append('alumnoId', alumnoId);
      form.append('contenido', contenido);
      if (archivo) form.append('archivo', archivo);
      await api.post('/mensajes', form);
      setContenido(''); setArchivo(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  }

  if (!datos) return <p className="text-marino-400">Cargando conversación...</p>;

  return (
    <Card className="flex flex-col h-[65vh]">
      <div className="px-5 py-3 border-b border-marino-50">
        <p className="font-display font-semibold text-marino-800 text-sm">{datos.horario.curso_nombre}</p>
        <p className="text-xs text-marino-400">{datos.horario.seccion_nombre ? `Sección "${datos.horario.seccion_nombre}"` : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {datos.mensajes.length === 0 && (
          <p className="text-sm text-marino-300 text-center py-10">Todavía no hay mensajes. Escribe el primero.</p>
        )}
        {datos.mensajes.map((m) => {
          const esPropio = m.remitente_id === usuario.id;
          return (
            <div key={m.id} className={`flex ${esPropio ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${esPropio ? 'bg-marino-800 text-white' : 'bg-papel text-marino-800'}`}>
                {m.contenido && <p className="whitespace-pre-wrap">{m.contenido}</p>}
                {m.archivo_url && (
                  <a href={m.archivo_url} target="_blank" rel="noreferrer" className={`flex items-center gap-1 text-xs mt-1 hover:underline ${esPropio ? 'text-marino-200' : 'text-rojo-500'}`}>
                    <Paperclip className="w-3 h-3" /> {m.archivo_nombre || 'Ver adjunto'}
                  </a>
                )}
                <p className={`text-[10px] mt-1 ${esPropio ? 'text-marino-300' : 'text-marino-400'}`}>
                  {new Date(m.creado_en).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviar} className="px-4 py-3 border-t border-marino-50">
        {error && <p className="text-xs text-rojo-500 mb-2">{error}</p>}
        <div className="flex items-center gap-2">
          <label className="text-marino-400 hover:text-marino-700 cursor-pointer shrink-0">
            <Paperclip className="w-4 h-4" />
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setArchivo(e.target.files[0] || null)} className="hidden" />
          </label>
          <input
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-xl border border-marino-200 px-4 py-2.5 text-sm focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
          />
          <button
            type="submit"
            disabled={enviando || (!contenido.trim() && !archivo)}
            className="shrink-0 w-10 h-10 rounded-xl bg-rojo-400 hover:bg-rojo-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors"
            aria-label="Enviar"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {archivo && <p className="text-xs text-marino-400 mt-1.5">Adjunto: {archivo.name}</p>}
      </form>
    </Card>
  );
}
