import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import { Card, EmptyState, PageHeader } from '../../components/ui';

const ETIQUETAS = {
  crear_matricula: 'Matrícula registrada', renovar_matricula: 'Matrícula renovada', actualizar_matricula: 'Matrícula actualizada',
  crear_horario: 'Clase agregada al horario', eliminar_horario: 'Clase quitada del horario',
  crear_cuenta_docente: 'Cuenta de docente creada', resetear_password_docente: 'Contraseña de docente reiniciada',
  resetear_password_alumno: 'Contraseña de alumno reiniciada', crear_aviso: 'Aviso publicado',
};

export default function Auditoria() {
  const [registros, setRegistros] = useState(null);
  useEffect(() => { api.get('/auditoria').then((res) => setRegistros(res.data)); }, []);

  if (!registros) return <p className="text-marino-400">Cargando...</p>;

  return (
    <div>
      <PageHeader titulo="Auditoría" subtitulo="Registro de acciones administrativas sensibles." />
      {registros.length === 0 ? (
        <EmptyState icono={ShieldAlert} titulo="Sin registros todavía" descripcion="Las acciones administrativas relevantes van a aparecer aquí." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-marino-800 text-white text-left">
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-marino-50">
              {registros.map((r) => (
                <tr key={r.id} className="hover:bg-papel/60 transition-colors">
                  <td className="px-4 py-3 text-marino-500 whitespace-nowrap">{new Date(r.creado_en).toLocaleString('es-PE')}</td>
                  <td className="px-4 py-3 text-marino-800 font-medium">{r.username || '—'}</td>
                  <td className="px-4 py-3 text-marino-600">{ETIQUETAS[r.accion] || r.accion}</td>
                  <td className="px-4 py-3 text-marino-400 text-xs max-w-xs truncate" title={r.detalle}>{r.detalle || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
