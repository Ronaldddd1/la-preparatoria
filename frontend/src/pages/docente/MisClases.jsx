import { useEffect, useState } from 'react';
import { CalendarDays, ClipboardCheck, NotebookText, Megaphone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import GrillaHorario from '../../components/GrillaHorario';
import { Card, EmptyState, PageHeader } from '../../components/ui';

const ATAJOS = [
  { to: '/docente/asistencia', etiqueta: 'Tomar asistencia de hoy', icono: ClipboardCheck },
  { to: '/docente/notas', etiqueta: 'Registrar una nota', icono: NotebookText },
  { to: '/docente/avisos', etiqueta: 'Ver avisos', icono: Megaphone },
];

export default function MisClases() {
  const [clases, setClases] = useState(null);

  useEffect(() => { api.get('/docentes/mis-clases').then((res) => setClases(res.data)); }, []);

  if (!clases) return <p className="text-marino-400">Cargando...</p>;

  return (
    <div>
      <PageHeader titulo="Mis clases" subtitulo="Ve a Asistencia o Notas en el menú para registrar cada una." />

      {clases.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          {ATAJOS.map((a) => (
            <Link key={a.to} to={a.to}>
              <Card className="p-4 flex items-center gap-3" hover>
                <div className="w-9 h-9 rounded-xl bg-rojo-50 flex items-center justify-center shrink-0">
                  <a.icono className="w-4 h-4 text-rojo-400" />
                </div>
                <span className="text-sm font-medium text-marino-800 flex-1">{a.etiqueta}</span>
                <ArrowRight className="w-3.5 h-3.5 text-marino-300" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {clases.length === 0 ? (
        <EmptyState icono={CalendarDays} titulo="Aún no tienes clases asignadas" descripcion="Pide al administrador que te asigne en el horario de una sección." />
      ) : (
        <GrillaHorario clases={clases.map((c) => ({ ...c, docente_apellidos: `${c.grado_nombre} "${c.seccion_nombre}"` }))} />
      )}
    </div>
  );
}
