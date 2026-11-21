import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import api from '../api/axios';

export default function HiloComentariosAviso({ avisoId }) {
  const [comentarios, setComentarios] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  function cargar() { api.get(`/avisos/${avisoId}/comentarios`).then((res) => setComentarios(res.data)); }
  useEffect(cargar, [avisoId]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/avisos/${avisoId}/comentarios`, { contenido: texto });
      setTexto('');
      cargar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-marino-50 space-y-2.5">
      {!comentarios ? (
        <p className="text-xs text-marino-400">Cargando comentarios...</p>
      ) : comentarios.length === 0 ? (
        <p className="text-xs text-marino-300">Sin comentarios todavía.</p>
      ) : (
        comentarios.map((c) => (
          <div key={c.id} className="text-sm">
            <span className="font-medium text-marino-700">@{c.username || 'usuario'}</span>{' '}
            <span className="text-marino-600">{c.contenido}</span>
            <p className="text-[11px] text-marino-300">{new Date(c.creado_en).toLocaleString('es-PE')}</p>
          </div>
        ))
      )}
      <form onSubmit={enviar} className="flex items-center gap-2 pt-1">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un comentario..."
          maxLength={500}
          className="flex-1 rounded-lg border border-marino-200 px-3 py-1.5 text-sm focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
        />
        <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar comentario"
          className="shrink-0 w-8 h-8 rounded-lg bg-marino-800 hover:bg-marino-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
