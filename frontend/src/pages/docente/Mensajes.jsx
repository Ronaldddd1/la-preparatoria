import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import api from '../../api/axios';
import { Card, EmptyState, PageHeader } from '../../components/ui';
import HiloMensajes from '../../components/HiloMensajes';

export default function Mensajes() {
  const [conversaciones, setConversaciones] = useState(null);
  const [seleccion, setSeleccion] = useState(null);

  useEffect(() => {
    api.get('/mensajes/conversaciones-docente').then((res) => {
      setConversaciones(res.data);
      if (res.data.length > 0) setSeleccion(res.data[0]);
    });
  }, []);

  if (!conversaciones) return <p className="text-marino-400">Cargando...</p>;

  return (
    <div>
      <PageHeader titulo="Mensajes" subtitulo="Conversaciones que tus alumnos iniciaron sobre tus clases." />
      {conversaciones.length === 0 ? (
        <EmptyState icono={MessageCircle} titulo="Sin conversaciones todavía" descripcion="Cuando un alumno te escriba sobre una de tus clases, aparecerá aquí." />
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 divide-y divide-marino-50 h-fit">
            {conversaciones.map((c) => (
              <button
                key={`${c.horario_id}-${c.alumno_id}`}
                onClick={() => setSeleccion(c)}
                className={`w-full text-left px-4 py-3 hover:bg-papel transition-colors ${
                  seleccion?.horario_id === c.horario_id && seleccion?.alumno_id === c.alumno_id ? 'bg-rojo-50' : ''
                }`}
              >
                <p className="font-medium text-marino-800 text-sm">{c.apellidos}, {c.nombres}</p>
                <p className="text-xs text-marino-400">{c.curso_nombre} · Sección "{c.seccion_nombre}"</p>
                <p className="text-xs text-marino-300 truncate mt-0.5">{c.ultimo_mensaje}</p>
              </button>
            ))}
          </Card>
          <div className="lg:col-span-3">
            {seleccion && <HiloMensajes horarioId={seleccion.horario_id} alumnoId={seleccion.alumno_id} />}
          </div>
        </div>
      )}
    </div>
  );
}
