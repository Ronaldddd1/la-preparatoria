import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import { Card, EmptyState, PageHeader } from '../../components/ui';

const ETIQUETA_TIPO = { positiva: 'Positiva', leve: 'Leve', moderada: 'Moderada', grave: 'Grave' };
const COLOR_TIPO = {
  positiva: 'bg-esmeralda-50 text-esmeralda-600',
  leve: 'bg-ambar-50 text-ambar-600',
  moderada: 'bg-rojo-50 text-rojo-500',
  grave: 'bg-rojo-100 text-rojo-600',
};

export default function MisIncidencias() {
  const [incidencias, setIncidencias] = useState(null);

  useEffect(() => { api.get('/incidencias/mias').then((res) => setIncidencias(res.data)); }, []);

  return (
    <div>
      <PageHeader titulo="Mis incidencias" subtitulo="Registros de conducta anotados por tus docentes." />
      {!incidencias ? (
        <p className="text-marino-400">Cargando...</p>
      ) : incidencias.length === 0 ? (
        <EmptyState icono={AlertTriangle} titulo="Sin incidencias registradas" descripcion="Cuando un docente registre una observación de conducta, aparecerá aquí." />
      ) : (
        <div className="space-y-3 max-w-2xl">
          {incidencias.map((i) => (
            <Card key={i.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${COLOR_TIPO[i.tipo]}`}>{ETIQUETA_TIPO[i.tipo]}</span>
                <span className="text-xs text-marino-400">{new Date(i.creado_en).toLocaleDateString('es-PE')}</span>
              </div>
              <p className="text-sm text-marino-700 mt-2">{i.descripcion}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
