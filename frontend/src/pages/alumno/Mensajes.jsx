import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import api from '../../api/axios';
import { Card, EmptyState, PageHeader } from '../../components/ui';
import HiloMensajes from '../../components/HiloMensajes';

export default function Mensajes() {
  const [clases, setClases] = useState(null);
  const [horarioId, setHorarioId] = useState(null);

  useEffect(() => {
    api.get('/horarios/mio').then((res) => {
      // Una clase por curso (evita repetir el mismo curso varias veces a la semana).
      const vistos = new Set();
      const unicas = (res.data.horario || []).filter((h) => {
        if (vistos.has(h.curso_id)) return false;
        vistos.add(h.curso_id);
        return true;
      });
      setClases(unicas);
      if (unicas.length > 0) setHorarioId(unicas[0].id);
    });
  }, []);

  if (!clases) return <p className="text-marino-400">Cargando...</p>;

  return (
    <div>
      <PageHeader titulo="Mensajes" subtitulo="Escribe a tus docentes sobre alguna de tus clases." />
      {clases.length === 0 ? (
        <EmptyState icono={MessageCircle} titulo="Todavía no tienes clases asignadas" descripcion="Cuando tengas un horario matriculado, vas a poder escribir a tus docentes." />
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 divide-y divide-marino-50 h-fit">
            {clases.map((c) => (
              <button
                key={c.id}
                onClick={() => setHorarioId(c.id)}
                className={`w-full text-left px-4 py-3 hover:bg-papel transition-colors ${horarioId === c.id ? 'bg-rojo-50' : ''}`}
              >
                <p className="font-medium text-marino-800 text-sm">{c.curso_nombre}</p>
                <p className="text-xs text-marino-400">{c.docente_nombres ? `${c.docente_nombres} ${c.docente_apellidos}` : 'Sin docente asignado'}</p>
              </button>
            ))}
          </Card>
          <div className="lg:col-span-3">
            {horarioId && <HiloMensajes horarioId={horarioId} />}
          </div>
        </div>
      )}
    </div>
  );
}
