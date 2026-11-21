import { useEffect, useState } from 'react';
import { Check, CheckCircle2, ClipboardList, History, Save, TriangleAlert, TrendingUp, X } from 'lucide-react';
import api from '../../api/axios';
import { Card, PageHeader, Chip } from '../../components/ui';

const PERIODOS = ['I Bimestre', 'II Bimestre', 'III Bimestre', 'IV Bimestre'];
const ANIO = 2026;
const NOTA_MINIMA = 11;
const PESOS_DEFECTO = { pesoTareas: 20, pesoPracticas: 20, pesoExamen1: 30, pesoExamen2: 30 };
const CAMPOS = [
  { clave: 'promTareas', etiqueta: 'Prom. tareas', peso: 'pesoTareas' },
  { clave: 'promPracticas', etiqueta: 'Prom. prácticas', peso: 'pesoPracticas' },
  { clave: 'examen1', etiqueta: 'Examen 1', peso: 'pesoExamen1' },
  { clave: 'examen2', etiqueta: 'Examen 2', peso: 'pesoExamen2' },
];

const vacio = (v) => v === '' || v === null || v === undefined || Number.isNaN(Number(v));
function completo(a) { return CAMPOS.every((c) => !vacio(a[c.clave])); }
function firma(a) { return CAMPOS.map((c) => a[c.clave]).join('|'); }
// Misma fórmula que el servidor (un decimal); el servidor es quien manda al guardar.
function calcular(a, p) {
  if (!completo(a)) return null;
  const total = CAMPOS.reduce((t, c) => t + Number(a[c.clave]) * p[c.peso], 0);
  return Math.round(total) / 100;
}

function Avatar({ nombres, apellidos, rojo = false }) {
  return (
    <span className={`w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${rojo ? 'bg-rojo-400' : 'bg-marino-700'}`}>
      {`${(nombres || '?')[0]}${(apellidos || '')[0] || ''}`.toUpperCase()}
    </span>
  );
}

export default function Notas() {
  const [clases, setClases] = useState([]);
  const [horarioId, setHorarioId] = useState('');
  const [periodo, setPeriodo] = useState(PERIODOS[0]);
  const [alumnos, setAlumnos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardandoId, setGuardandoId] = useState(null);
  const [guardandoTodas, setGuardandoTodas] = useState(false);
  const [historial, setHistorial] = useState(null);
  const [pesos, setPesos] = useState(PESOS_DEFECTO);

  useEffect(() => { api.get('/docentes/mis-clases').then((res) => setClases(res.data)); }, []);
  const clase = clases.find((c) => String(c.id) === String(horarioId));
  useEffect(() => { if (clase && periodo) cargar(); else setAlumnos([]); }, [horarioId, periodo]);

  function cargar() {
    setError('');
    api.get('/notas', { params: { seccionId: clase.seccion_id, cursoId: clase.curso_id, anioEscolar: ANIO, periodo } })
      .then((res) => {
        setPesos(res.data.pesos || PESOS_DEFECTO);
        setAlumnos(res.data.alumnos.map((a) => {
          const f = {
            ...a,
            promTareas: a.prom_tareas ?? '', promPracticas: a.prom_practicas ?? '',
            examen1: a.examen1 ?? '', examen2: a.examen2 ?? '',
          };
          return { ...f, notaGuardada: a.nota ?? null, original: a.prom_tareas === null || a.prom_tareas === undefined ? '' : firma(f) };
        }));
      })
      .catch((err) => setError(err.response?.data?.mensaje || 'No se pudo cargar la clase.'));
  }

  function cambiarCampo(alumnoId, clave, valor) {
    setAlumnos((prev) => prev.map((a) => (a.alumno_id === alumnoId ? { ...a, [clave]: valor } : a)));
  }

  async function enviarNota(alumno) {
    const { data } = await api.post('/notas', {
      alumnoId: alumno.alumno_id, cursoId: clase.curso_id, anioEscolar: ANIO, periodo,
      promTareas: alumno.promTareas, promPracticas: alumno.promPracticas, examen1: alumno.examen1, examen2: alumno.examen2,
    });
    setAlumnos((prev) => prev.map((a) => (a.alumno_id === alumno.alumno_id
      ? { ...a, original: firma(alumno), notaGuardada: data.nota } : a)));
  }

  async function guardarNota(alumno) {
    if (!completo(alumno)) { setError('Completa los 4 campos (tareas, prácticas y ambos exámenes) para calcular la nota.'); return; }
    setGuardandoId(alumno.alumno_id); setMensaje(''); setError('');
    try {
      await enviarNota(alumno);
      setMensaje(`Nota de ${alumno.nombres} guardada.`);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar la nota.');
    } finally {
      setGuardandoId(null);
    }
  }

  async function guardarTodas() {
    const pendientes = alumnos.filter((a) => completo(a) && firma(a) !== a.original);
    if (pendientes.length === 0) { setMensaje('No hay cambios por guardar.'); return; }
    setGuardandoTodas(true); setMensaje(''); setError('');
    let guardadas = 0;
    for (const a of pendientes) {
      try { await enviarNota(a); guardadas += 1; } catch (err) {
        setError(`${a.apellidos}, ${a.nombres}: ${err.response?.data?.mensaje || 'no se pudo guardar.'}`);
        break;
      }
    }
    if (guardadas > 0) setMensaje(`${guardadas} nota(s) guardada(s).`);
    setGuardandoTodas(false);
  }

  async function verHistorial(alumno) {
    const { data } = await api.get('/notas/historial', {
      params: { alumnoId: alumno.alumno_id, cursoId: clase.curso_id, anioEscolar: ANIO, periodo },
    });
    setHistorial({ alumno, cambios: data });
  }

  // Notas antiguas sin componentes (solo la nota final): se muestran tal cual.
  const notaDe = (a) => calcular(a, pesos) ?? (a.original === '' && a.notaGuardada !== null ? Number(a.notaGuardada) : null);
  const conNota = alumnos.filter((a) => notaDe(a) !== null);
  const aprobados = conNota.filter((a) => notaDe(a) >= NOTA_MINIMA).length;
  const desaprobados = conNota.length - aprobados;
  const promedio = conNota.length > 0 ? (conNota.reduce((t, a) => t + notaDe(a), 0) / conNota.length).toFixed(1) : '—';
  const pendientes = alumnos.length - conNota.length;
  const pct = (n) => (conNota.length > 0 ? ` (${Math.round((n / conNota.length) * 100)}%)` : '');

  return (
    <div>
      <PageHeader
        etiquetas={<>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-marino-400">Mi trabajo</span>
          <span className="text-marino-300">•</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-marino-400">Registro y evaluación</span>
          <Chip color="gris">Año {ANIO}</Chip>
        </>}
        titulo="Registro de Calificaciones"
        subtitulo="Ingresa el promedio de tareas, el promedio de prácticas y los dos exámenes: la nota del bimestre se calcula sola. Escala de 0 a 20, mínima aprobatoria 11."
        accion={clase && alumnos.length > 0 && (
          <button onClick={guardarTodas} disabled={guardandoTodas}
            className="inline-flex items-center gap-2 rounded-xl bg-rojo-400 px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-rojo-500 disabled:opacity-60 transition-colors">
            <Save className="w-4 h-4" aria-hidden="true" /> {guardandoTodas ? 'Guardando...' : 'Guardar todas las notas'}
          </button>
        )}
      />

      <Card className="p-5 mb-5">
        <div className="max-w-xl">
          <Selector etiqueta="Curso y sección" valor={horarioId} onChange={setHorarioId}>
            <option value="">Selecciona una clase</option>
            {clases.map((c) => <option key={c.id} value={c.id}>{c.curso_nombre} · {c.grado_nombre} "{c.seccion_nombre}"</option>)}
          </Selector>
        </div>
        <div role="tablist" className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-marino-50 p-1">
          {PERIODOS.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={periodo === p} onClick={() => setPeriodo(p)}
              className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${periodo === p ? 'bg-white text-marino-900 shadow-soft' : 'text-marino-500 hover:text-marino-800'}`}>
              {p}
            </button>
          ))}
        </div>
      </Card>

      {error && <p role="alert" className="text-sm text-rojo-500 mb-4">{error}</p>}
      {mensaje && <p className="text-sm text-esmeralda-600 mb-4">{mensaje}</p>}

      {alumnos.length > 0 && (
        <>
          <Card className="overflow-hidden mb-5">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-marino-50/60 text-left text-marino-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-3 w-14">N°</th>
                    <th className="px-3 py-3">Estudiante</th>
                    <th className="px-3 py-3">DNI</th>
                    {CAMPOS.map((c) => (
                      <th key={c.clave} className="px-2 py-3 text-center bg-marino-50">
                        {c.etiqueta}
                        <span className="block text-[10px] font-medium normal-case tracking-normal text-marino-400">Peso {pesos[c.peso]}%</span>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-center bg-marino-100/60">Nota del bimestre</th>
                    <th className="px-3 py-3 w-36">Estado</th>
                    <th className="px-5 py-3 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-marino-50">
                  {alumnos.map((a, i) => {
                    const nota = notaDe(a);
                    const hay = nota !== null;
                    const apr = hay && nota >= NOTA_MINIMA;
                    return (
                      <tr key={a.alumno_id} className={hay && !apr ? 'bg-rojo-50/40' : ''}>
                        <td className="px-5 py-3 text-marino-400">{String(i + 1).padStart(2, '0')}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar nombres={a.nombres} apellidos={a.apellidos} rojo={hay && !apr} />
                            <div>
                              <span className="font-semibold text-marino-900 block leading-tight">{a.apellidos}, {a.nombres}</span>
                              <span className="text-[11px] text-marino-400">DNI {a.dni}</span>
                            </div>
                          </div>
                        </td>
                        {CAMPOS.map((c) => (
                          <td key={c.clave} className="px-2 py-3 text-center">
                            <input type="number" min="0" max="20" step="0.1" value={a[c.clave]} onChange={(e) => cambiarCampo(a.alumno_id, c.clave, e.target.value)}
                              aria-label={`${c.etiqueta} de ${a.nombres} ${a.apellidos}`}
                              className="w-16 rounded-lg border border-marino-100 bg-marino-50/60 px-2 py-1.5 text-center font-semibold text-marino-900 outline-none transition-shadow focus:border-marino-400 focus:ring-2 focus:ring-marino-100" />
                          </td>
                        ))}
                        <td className="px-3 py-3 text-center bg-marino-50/40">
                          <span className={`font-display text-lg font-semibold ${hay ? (apr ? 'text-marino-900' : 'text-rojo-500') : 'text-marino-300'}`}>
                            {hay ? nota.toFixed(1) : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {hay ? (
                            <Chip color={apr ? 'verde' : 'rojo'} punto>{apr ? 'Aprobado' : 'Desaprobado'}</Chip>
                          ) : (
                            <span className="text-xs text-marino-300">Faltan datos</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 justify-end">
                            <button onClick={() => guardarNota(a)} disabled={guardandoId === a.alumno_id}
                              className="flex items-center gap-1 text-xs font-semibold text-marino-700 hover:text-rojo-500 disabled:opacity-50 transition-colors">
                              <Check className="w-3.5 h-3.5" /> {guardandoId === a.alumno_id ? 'Guardando...' : 'Guardar'}
                            </button>
                            {a.notaGuardada !== null && (
                              <button onClick={() => verHistorial(a)} title="Ver historial de cambios" aria-label="Ver historial de cambios"
                                className="text-marino-300 hover:text-marino-600 transition-colors">
                                <History className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Resumen icono={CheckCircle2} color="verde" valor={aprobados} nota={pct(aprobados)} etiqueta="Aprobados" />
            <Resumen icono={TriangleAlert} color="rojo" valor={desaprobados} nota={pct(desaprobados)} etiqueta="Desaprobados" />
            <Resumen icono={TrendingUp} color="gris" valor={promedio} etiqueta="Promedio del aula" />
            <Resumen icono={ClipboardList} color="gris" valor={pendientes} etiqueta="Pendientes de digitación" />
          </div>
        </>
      )}

      {historial && (
        <div className="fixed inset-0 z-50 bg-marino-900/50 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-sm p-6 relative">
            <button onClick={() => setHistorial(null)} aria-label="Cerrar" className="absolute top-4 right-4 text-marino-300 hover:text-marino-600">
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-display text-xl font-semibold text-marino-900 mb-1">Historial de la nota</h2>
            <p className="text-sm text-marino-400 mb-4">{historial.alumno.apellidos}, {historial.alumno.nombres} · {periodo}</p>
            {historial.cambios.length === 0 ? (
              <p className="text-sm text-marino-400">Esta nota no ha sido corregida.</p>
            ) : (
              <ul className="space-y-2">
                {historial.cambios.map((c, i) => (
                  <li key={i} className="text-sm text-marino-700 border-b border-marino-50 pb-2">
                    Valor anterior: <span className="font-semibold">{Number(c.nota_anterior).toFixed(1)}</span>
                    <p className="text-xs text-marino-400">{new Date(c.modificado_en).toLocaleString('es-PE')} · {c.modificado_por_username || '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function Resumen({ icono: Icono, color, valor, nota = '', etiqueta }) {
  const fondo = { verde: 'bg-esmeralda-50 text-esmeralda-600', rojo: 'bg-rojo-50 text-rojo-500', gris: 'bg-marino-50 text-marino-600' }[color];
  return (
    <Card className="p-4 flex items-center gap-4">
      <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${fondo}`}>
        <Icono className="w-5 h-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-2xl font-semibold text-marino-900 leading-none">
          <span className={color === 'rojo' ? 'text-rojo-500' : ''}>{valor}</span>
          <span className="text-xs font-sans font-normal text-marino-400">{nota}</span>
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-marino-500 mt-1">{etiqueta}</p>
      </div>
    </Card>
  );
}

function Selector({ etiqueta, valor, onChange, children }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-marino-800 mb-1.5">{etiqueta}</label>
      <select value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-100 px-4 py-2.5 bg-marino-50/60 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
        {children}
      </select>
    </div>
  );
}
