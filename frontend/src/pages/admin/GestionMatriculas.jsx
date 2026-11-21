import { Fragment, useEffect, useState } from 'react';
import { Download, History, UserMinus, UserCheck, ArrowRightLeft, ClipboardList, Users } from 'lucide-react';
import api from '../../api/axios';
import { descargarArchivo } from '../../utils/descargas';
import { Card, Chip, PageHeader, StatCard } from '../../components/ui';

export default function GestionMatriculas() {
  const [matriculas, setMatriculas] = useState([]);
  const [grados, setGrados] = useState([]);
  const [filtros, setFiltros] = useState({ anio: '2026', estado: '', gradoId: '' });
  const [historialAbierto, setHistorialAbierto] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/grados').then((res) => setGrados(res.data)); }, []);
  useEffect(() => { cargar(); }, [filtros]);

  function cargar() {
    const params = {};
    if (filtros.anio) params.anio = filtros.anio;
    if (filtros.estado) params.estado = filtros.estado;
    if (filtros.gradoId) params.gradoId = filtros.gradoId;
    api.get('/matriculas', { params }).then((res) => setMatriculas(res.data));
  }

  async function cambiarEstado(m, estado) {
    setError('');
    let motivo = null;
    if (estado === 'retirado' || estado === 'trasladado') {
      motivo = window.prompt(`Motivo del ${estado === 'retirado' ? 'retiro' : 'traslado'} de ${m.nombres} ${m.apellidos}:`);
      if (!motivo) return;
    }
    try {
      await api.put(`/matriculas/${m.id}`, { estado, motivo });
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo actualizar la matrícula.');
    }
  }

  async function verHistorial(m) {
    setHistorialAbierto(m.id);
    const { data } = await api.get(`/matriculas/${m.id}/historial`);
    setHistorial(data);
  }

  function construirParams() {
    const params = new URLSearchParams();
    if (filtros.anio) params.set('anio', filtros.anio);
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.gradoId) params.set('gradoId', filtros.gradoId);
    return params;
  }

  function exportarCsv() {
    descargarArchivo(`/reportes/matriculas.csv?${construirParams().toString()}`, 'matriculas.csv');
  }

  function exportarXlsx() {
    descargarArchivo(`/reportes/matriculas.xlsx?${construirParams().toString()}`, 'matriculas.xlsx');
  }

  return (
    <div>
      <PageHeader
        etiquetas={<Chip color="azul">ACADÉMICO • CONTROL DE MATRÍCULAS</Chip>}
        titulo="Control de Matrículas"
        subtitulo="Consulta, filtra y da de baja o reactiva matrículas."
        accion={
          <div className="flex gap-2">
            <button onClick={exportarCsv} className="flex items-center gap-2 rounded-xl border border-marino-200 bg-white text-marino-700 text-sm font-semibold px-4 py-2.5 hover:bg-marino-50 transition-colors">
              <Download className="w-4 h-4" aria-hidden="true" /> CSV
            </button>
            <button onClick={exportarXlsx} className="flex items-center gap-2 rounded-xl border border-marino-200 bg-white text-marino-700 text-sm font-semibold px-4 py-2.5 hover:bg-marino-50 transition-colors">
              <Download className="w-4 h-4" aria-hidden="true" /> Excel
            </button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-4 gap-4 mb-5">
        <StatCard icono={ClipboardList} etiqueta="Total" valor={matriculas.length} color="navy" detalle="Según filtros" />
        <StatCard icono={UserCheck} etiqueta="Activas" valor={matriculas.filter((m) => m.estado === 'activo').length} color="esmeralda" />
        <StatCard icono={UserMinus} etiqueta="Retiradas" valor={matriculas.filter((m) => m.estado === 'retirado').length} color="rojo" />
        <StatCard icono={ArrowRightLeft} etiqueta="Trasladadas" valor={matriculas.filter((m) => m.estado === 'trasladado').length} color="ambar" />
      </div>

      <Card className="p-4 grid sm:grid-cols-3 gap-4 mb-5">
        <Campo etiqueta="Año escolar" valor={filtros.anio} onChange={(v) => setFiltros({ ...filtros, anio: v })} />
        <Selector etiqueta="Grado" valor={filtros.gradoId} onChange={(v) => setFiltros({ ...filtros, gradoId: v })}>
          <option value="">Todos</option>
          {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre} - {g.nivel}</option>)}
        </Selector>
        <Selector etiqueta="Estado" valor={filtros.estado} onChange={(v) => setFiltros({ ...filtros, estado: v })}>
          <option value="">Todos</option><option value="activo">Activo</option><option value="retirado">Retirado</option><option value="trasladado">Trasladado</option>
        </Selector>
      </Card>

      {error && <p className="text-sm text-rojo-500 mb-4">{error}</p>}

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-marino-50/60 text-marino-400 text-left text-[11px] uppercase tracking-wider">
              <th className="px-4 py-3 font-semibold">Alumno</th>
              <th className="px-4 py-3 font-semibold">DNI</th>
              <th className="px-4 py-3 font-semibold">Grado / Sección</th>
              <th className="px-4 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marino-50">
            {matriculas.map((m) => (
              <Fragment key={m.id}>
                <tr className="hover:bg-marino-50/40 transition-colors">
                  <td className="px-4 py-3 text-marino-800 font-medium">{m.apellidos}, {m.nombres}</td>
                  <td className="px-4 py-3 text-marino-500">{m.dni}</td>
                  <td className="px-4 py-3 text-marino-500">{m.grado_nombre} "{m.seccion_nombre}"</td>
                  <td className="px-4 py-3 text-marino-500">{new Date(m.fecha_matricula).toLocaleDateString('es-PE')}</td>
                  <td className="px-4 py-3"><Chip color={{ activo: 'verde', retirado: 'rojo', trasladado: 'ambar' }[m.estado] || 'gris'} punto>{m.estado}</Chip></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.estado === 'activo' ? (
                        <>
                          <IconBtn onClick={() => cambiarEstado(m, 'retirado')} icono={UserMinus} texto="Retirar" color="text-rojo-500" />
                          <IconBtn onClick={() => cambiarEstado(m, 'trasladado')} icono={ArrowRightLeft} texto="Trasladar" color="text-ambar-500" />
                        </>
                      ) : (
                        <IconBtn onClick={() => cambiarEstado(m, 'activo')} icono={UserCheck} texto="Reactivar" color="text-esmeralda-500" />
                      )}
                      <IconBtn onClick={() => verHistorial(m)} icono={History} texto="Historial" color="text-marino-500" />
                    </div>
                  </td>
                </tr>
                {historialAbierto === m.id && (
                  <tr>
                    <td colSpan={6} className="bg-papel px-4 py-3">
                      {historial.length === 0 ? (
                        <p className="text-xs text-marino-400">Sin cambios de estado registrados.</p>
                      ) : (
                        <ul className="text-xs text-marino-500 space-y-1">
                          {historial.map((h) => (
                            <li key={h.id}>{new Date(h.fecha).toLocaleDateString('es-PE')} — {h.estado_anterior} → {h.estado_nuevo}{h.motivo ? ` (${h.motivo})` : ''} · {h.registrado_por}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {matriculas.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-marino-400">Sin resultados.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function IconBtn({ onClick, icono: Icono, texto, color }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 text-xs font-medium ${color} hover:underline`}>
      <Icono className="w-3.5 h-3.5" /> {texto}
    </button>
  );
}
function Campo({ etiqueta, valor, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-marino-500 mb-1">{etiqueta}</label>
      <input value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-3 py-2 text-sm focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
    </div>
  );
}
function Selector({ etiqueta, valor, onChange, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-marino-500 mb-1">{etiqueta}</label>
      <select value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-3 py-2 text-sm focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
        {children}
      </select>
    </div>
  );
}
