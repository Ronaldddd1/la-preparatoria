import { useEffect, useState } from 'react';
import { FileCheck, Check, X as XIcon, Paperclip } from 'lucide-react';
import api from '../../api/axios';
import { Card, Badge, EmptyState, PageHeader } from '../../components/ui';

const ETIQUETA = { pendiente: 'En revisión', aprobado: 'Aprobada', rechazado: 'Rechazada' };

export default function Justificaciones() {
  const [filtro, setFiltro] = useState('pendiente');
  const [lista, setLista] = useState(null);
  const [procesando, setProcesando] = useState(null);

  useEffect(() => { cargar(); }, [filtro]);
  function cargar() { api.get('/justificaciones', { params: { estado: filtro || undefined } }).then((res) => setLista(res.data)); }

  async function resolver(id, estado) {
    setProcesando(id);
    try { await api.put(`/justificaciones/${id}`, { estado }); cargar(); }
    finally { setProcesando(null); }
  }

  return (
    <div>
      <PageHeader titulo="Justificaciones de faltas" subtitulo="Revisa y aprueba las solicitudes enviadas por los alumnos." />

      <div className="flex gap-2 mb-5">
        {[
          { valor: 'pendiente', etiqueta: 'En revisión' },
          { valor: 'aprobado', etiqueta: 'Aprobadas' },
          { valor: 'rechazado', etiqueta: 'Rechazadas' },
          { valor: '', etiqueta: 'Todas' },
        ].map((op) => (
          <button
            key={op.valor}
            onClick={() => setFiltro(op.valor)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filtro === op.valor ? 'bg-marino-800 text-white' : 'bg-white border border-marino-200 text-marino-600 hover:bg-papel'
            }`}
          >
            {op.etiqueta}
          </button>
        ))}
      </div>

      {!lista ? (
        <p className="text-marino-400">Cargando...</p>
      ) : lista.length === 0 ? (
        <EmptyState icono={FileCheck} titulo="Sin solicitudes" descripcion="No hay justificaciones en esta categoría." />
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-marino-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-3">Alumno</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Motivo</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-marino-50">
              {lista.map((j) => (
                <tr key={j.id}>
                  <td className="px-5 py-3 text-marino-800 font-medium">{j.apellidos}, {j.nombres}<p className="text-xs text-marino-400 font-normal">DNI {j.dni}</p></td>
                  <td className="px-5 py-3 text-marino-500">{new Date(j.fecha).toLocaleDateString('es-PE')}</td>
                  <td className="px-5 py-3 text-marino-500 max-w-xs">
                    {j.comentario || <span className="text-marino-300">Sin comentario</span>}
                    {j.archivo_url && (
                      <a href={j.archivo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-rojo-500 hover:underline mt-1">
                        <Paperclip className="w-3 h-3" /> {j.archivo_nombre || 'Ver adjunto'}
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge estado={j.estado === 'aprobado' ? 'activo' : j.estado === 'rechazado' ? 'falta' : 'tardanza'}>
                      {ETIQUETA[j.estado]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    {j.estado === 'pendiente' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resolver(j.id, 'aprobado')}
                          disabled={procesando === j.id}
                          className="flex items-center gap-1 text-xs font-medium text-esmeralda-600 hover:underline disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Aprobar
                        </button>
                        <button
                          onClick={() => resolver(j.id, 'rechazado')}
                          disabled={procesando === j.id}
                          className="flex items-center gap-1 text-xs font-medium text-rojo-500 hover:underline disabled:opacity-50"
                        >
                          <XIcon className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
