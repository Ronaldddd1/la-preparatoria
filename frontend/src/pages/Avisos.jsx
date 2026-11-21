import { useEffect, useState } from 'react';
import { Megaphone, Calendar, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import { Card, EmptyState, PageHeader } from '../components/ui';
import HiloComentariosAviso from '../components/HiloComentariosAviso';

export default function Avisos() {
  const [avisos, setAvisos] = useState(null);
  const [abiertos, setAbiertos] = useState({});

  useEffect(() => { api.get('/avisos').then((res) => setAvisos(res.data)); }, []);

  function alternar(id) {
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      <PageHeader titulo="Avisos" subtitulo="Comunicados publicados por el colegio." />
      {!avisos ? (
        <p className="text-marino-400">Cargando...</p>
      ) : avisos.length === 0 ? (
        <EmptyState icono={Megaphone} titulo="No hay avisos" descripcion="Cuando el colegio publique un comunicado, aparecerá aquí." />
      ) : (
        <div className="space-y-4 max-w-2xl">
          {avisos.map((a) => (
            <Card key={a.id} className="p-5" hover>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rojo-50 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4 text-rojo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-semibold text-marino-800">{a.titulo}</h2>
                    <span className="flex items-center gap-1 text-xs text-marino-400 shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(a.created_at).toLocaleDateString('es-PE')}
                    </span>
                  </div>
                  <p className="text-sm text-marino-600 whitespace-pre-wrap mt-1.5">{a.contenido}</p>
                  <button
                    onClick={() => alternar(a.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-marino-500 hover:text-rojo-500 transition-colors mt-3"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Comentarios
                  </button>
                  {abiertos[a.id] && <HiloComentariosAviso avisoId={a.id} />}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
