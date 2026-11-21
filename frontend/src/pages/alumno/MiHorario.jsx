import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import api from '../../api/axios';
import GrillaHorario from '../../components/GrillaHorario';
import { Chip, EmptyState, PageHeader } from '../../components/ui';

export default function MiHorario() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/horarios/mio')
      .then((res) => setDatos(res.data))
      .catch(() => setError('No se pudo cargar tu horario. Intenta nuevamente.'))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <PageHeader etiquetas={<Chip color="azul">MI PROGRESO • HORARIO SEMANAL</Chip>} titulo="Mi horario" subtitulo="Tus clases de la semana. Toca una clase para ver el detalle." />
      {cargando ? (
        <p className="text-marino-400">Cargando horario...</p>
      ) : error ? (
        <p className="text-rojo-500">{error}</p>
      ) : !datos?.matriculado ? (
        <EmptyState icono={CalendarDays} titulo="Sin matrícula activa" descripcion="Cuando el colegio registre tu matrícula, tu horario de clases va a aparecer aquí." />
      ) : (
        <GrillaHorario clases={datos.horario} />
      )}
    </div>
  );
}
