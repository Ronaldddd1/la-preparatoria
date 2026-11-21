import { useEffect, useMemo, useState } from 'react';
import { NotebookText, Download, TrendingUp, BookOpen, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { descargarArchivo } from '../../utils/descargas';
import { Card, Chip, EmptyState, PageHeader, StatCard } from '../../components/ui';

const NOTA_MINIMA = 11;

function nivel(n) {
  if (n >= 18) return { t: 'Logro destacado', c: 'verde' };
  if (n >= 14) return { t: 'Logro esperado', c: 'azul' };
  if (n >= NOTA_MINIMA) return { t: 'En proceso', c: 'ambar' };
  return { t: 'En inicio', c: 'rojo' };
}

export default function MisNotas() {
  const [notas, setNotas] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [periodo, setPeriodo] = useState('todos');
  const { usuario } = useAuth();

  useEffect(() => { api.get('/notas/mias').then((res) => setNotas(res.data)); }, []);

  const periodos = useMemo(() => [...new Set((notas || []).map((n) => n.periodo))], [notas]);
  const filtradas = useMemo(
    () => (notas || []).filter((n) => periodo === 'todos' || n.periodo === periodo),
    [notas, periodo],
  );

  if (!notas) return <p className="text-marino-400">Cargando notas...</p>;

  const porCurso = filtradas.reduce((acc, n) => { (acc[n.curso_nombre] ||= []).push(n); return acc; }, {});
  const valores = filtradas.map((n) => Number(n.nota));
  const promedio = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
  const aprobadas = valores.filter((v) => v >= NOTA_MINIMA).length;
  const desaprobadas = valores.length - aprobadas;

  async function descargarBoleta() {
    setDescargando(true);
    try {
      await descargarArchivo(`/reportes/boleta/${usuario.alumno.id}`, `boleta-${usuario.alumno.dni || usuario.username}.pdf`, true);
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div>
      <PageHeader
        etiquetas={<Chip color="azul">MI PROGRESO • LIBRETA DE NOTAS</Chip>}
        titulo="Mis notas"
        subtitulo="Tus calificaciones por curso y período."
        accion={
          notas.length > 0 && (
            <button
              onClick={descargarBoleta}
              disabled={descargando}
              className="flex items-center gap-2 rounded-xl bg-marino-700 hover:bg-marino-800 text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-60 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" /> {descargando ? 'Generando...' : 'Descargar boleta'}
            </button>
          )
        }
      />
      {notas.length === 0 ? (
        <EmptyState icono={NotebookText} titulo="Todavía no tienes notas" descripcion="Cuando tu docente registre una calificación, aparecerá aquí." />
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatCard icono={TrendingUp} etiqueta="Promedio" valor={promedio.toFixed(1)} color="navy" detalle={`${valores.length} calificaciones`} />
            <StatCard icono={BookOpen} etiqueta="Aprobadas" valor={aprobadas} color="esmeralda" detalle={`Nota mínima ${NOTA_MINIMA}`} />
            <StatCard icono={AlertTriangle} etiqueta="Por mejorar" valor={desaprobadas} color="rojo" detalle="Debajo de la nota mínima" />
          </div>

          {periodos.length > 1 && (
            <div className="inline-flex rounded-xl bg-white border border-marino-100 p-1 mb-5 flex-wrap gap-0.5">
              {['todos', ...periodos].map((p) => (
                <button key={p} onClick={() => setPeriodo(p)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    periodo === p ? 'bg-marino-700 text-white' : 'text-marino-500 hover:bg-marino-50'
                  }`}>
                  {p === 'todos' ? 'Todos' : p}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {Object.entries(porCurso).map(([curso, filas]) => {
              const prom = filas.reduce((a, f) => a + Number(f.nota), 0) / filas.length;
              const nv = nivel(prom);
              return (
                <Card key={curso} className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-marino-50">
                    <h2 className="font-display text-lg font-semibold text-marino-900">{curso}</h2>
                    <div className="flex items-center gap-2">
                      <Chip color={nv.c} punto>{nv.t}</Chip>
                      <span className="font-display text-xl font-semibold text-marino-900">{prom.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-marino-400 text-[11px] uppercase tracking-wider">
                          <th className="px-5 py-2.5">Período</th>
                          <th className="px-3 py-2.5">Tareas</th>
                          <th className="px-3 py-2.5">Prácticas</th>
                          <th className="px-3 py-2.5">Ex. 1</th>
                          <th className="px-3 py-2.5">Ex. 2</th>
                          <th className="px-5 py-2.5">Nota</th>
                          <th className="px-5 py-2.5">Observación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-marino-50">
                        {filas.map((f, i) => (
                          <tr key={i}>
                            <td className="px-5 py-2.5 text-marino-500">{f.periodo} · {f.anio_escolar}</td>
                            {[f.prom_tareas, f.prom_practicas, f.examen1, f.examen2].map((v, k) => (
                              <td key={k} className="px-3 py-2.5 text-marino-500">{v === null || v === undefined ? '—' : Number(v).toFixed(1)}</td>
                            ))}
                            <td className="px-5 py-2.5">
                              <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-1.5 h-8 rounded-lg font-bold text-sm ${
                                Number(f.nota) < NOTA_MINIMA ? 'bg-rojo-50 text-rojo-500' : 'bg-esmeralda-50 text-esmeralda-600'
                              }`}>
                                {Number(f.nota).toFixed(1).replace('.0', '')}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-marino-400">{f.observacion || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
