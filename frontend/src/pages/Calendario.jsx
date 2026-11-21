import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../api/axios';
import { Chip, PageHeader } from '../components/ui';
import CalendarioAcademico from '../components/CalendarioAcademico';
import { descargarArchivo } from '../utils/descargas';

export default function Calendario() {
  const [eventos, setEventos] = useState(null);
  const anio = new Date().getFullYear();

  useEffect(() => { api.get('/calendario', { params: { anioEscolar: anio } }).then((res) => setEventos(res.data)); }, [anio]);

  return (
    <div>
      <PageHeader
        etiquetas={<Chip color="azul">CALENDARIO ACADÉMICO {anio}</Chip>}
        titulo="Calendario académico"
        subtitulo="Feriados nacionales del Perú (automáticos), exámenes e hitos del año escolar."
        accion={eventos?.length > 0 && (
          <button
            onClick={() => descargarArchivo('/calendario/exportar.ics', 'calendario-la-preparatoria.ics')}
            className="flex items-center gap-2 rounded-xl border border-marino-200 bg-white text-marino-700 text-sm font-semibold px-4 py-2.5 hover:bg-marino-50 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" /> Exportar (.ics)
          </button>
        )}
      />
      {!eventos ? <p className="text-marino-400">Cargando...</p> : <CalendarioAcademico eventos={eventos} />}
    </div>
  );
}
