import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Percent, Save } from 'lucide-react';
import { Card, Chip, PageHeader } from '../../components/ui';

const PERIODOS = ['I Bimestre', 'II Bimestre', 'III Bimestre', 'IV Bimestre'];
const ANIO = 2026;

// Vista de boletín completo: en vez de elegir curso+periodo uno a la vez
// (como hace el docente, que solo dicta algunos cursos), el admin elige
// grado+sección y ve una matriz con TODOS los cursos y TODOS los bimestres
// de cada alumno, editable celda por celda (se guarda al salir del campo).
const CAMPOS_PESO = [
  { clave: 'pesoTareas', etiqueta: 'Promedio de tareas' },
  { clave: 'pesoPracticas', etiqueta: 'Promedio de prácticas' },
  { clave: 'pesoExamen1', etiqueta: 'Examen 1' },
  { clave: 'pesoExamen2', etiqueta: 'Examen 2' },
];

// Solo el administrador puede cambiar los porcentajes con que se calcula la
// nota del bimestre. Los docentes los ven (solo lectura) en su registro.
function PonderacionNotas() {
  const [pesos, setPesos] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { api.get('/notas/config').then((res) => setPesos(res.data)); }, []);
  if (!pesos) return null;

  const suma = CAMPOS_PESO.reduce((t, c) => t + Number(pesos[c.clave] || 0), 0);

  async function guardar() {
    setMensaje(''); setError(''); setGuardando(true);
    try {
      const { data } = await api.put('/notas/config', pesos);
      setMensaje(data.mensaje);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo guardar la ponderación.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-rojo-400" aria-hidden="true" />
          <h2 className="font-display text-lg font-semibold text-marino-900">Ponderación de la nota del bimestre</h2>
        </div>
        <Chip color={suma === 100 ? 'verde' : 'rojo'} punto>Suma: {suma}%</Chip>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CAMPOS_PESO.map((c) => (
          <div key={c.clave}>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-marino-400 mb-1.5">{c.etiqueta}</label>
            <div className="relative">
              <input type="number" min="0" max="100" value={pesos[c.clave]}
                onChange={(e) => setPesos({ ...pesos, [c.clave]: e.target.value })}
                className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-4 py-2.5 pr-9 font-semibold text-marino-900 outline-none focus:border-marino-400 focus:ring-2 focus:ring-marino-100" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-marino-400 text-sm">%</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-marino-400 mt-3">
        Nota del bimestre = tareas × % + prácticas × % + examen 1 × % + examen 2 × %. Los porcentajes deben sumar 100. Solo el administrador puede cambiarlos; se aplican a las notas que se guarden desde ahora.
      </p>
      <div className="flex items-center gap-4 mt-4">
        <button onClick={guardar} disabled={guardando || suma !== 100}
          className="flex items-center gap-2 rounded-xl bg-marino-700 hover:bg-marino-800 text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" /> {guardando ? 'Guardando...' : 'Guardar ponderación'}
        </button>
        {mensaje && <p className="text-sm text-esmeralda-600">{mensaje}</p>}
        {error && <p className="text-sm text-rojo-500" role="alert">{error}</p>}
      </div>
    </Card>
  );
}

export default function GestionNotas() {
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [gradoId, setGradoId] = useState('');
  const [seccionId, setSeccionId] = useState('');
  const [alumnos, setAlumnos] = useState(null);
  const [error, setError] = useState('');
  const [guardandoCelda, setGuardandoCelda] = useState(null); // `${alumnoId}-${cursoId}-${periodo}`
  const [errorCelda, setErrorCelda] = useState(null);

  useEffect(() => { api.get('/grados').then((res) => setGrados(res.data)); }, []);

  useEffect(() => {
    setSeccionId(''); setSecciones([]); setCursos([]); setAlumnos(null);
    if (!gradoId) return;
    api.get('/secciones', { params: { gradoId, anio: ANIO } }).then((res) => setSecciones(res.data));
    api.get('/cursos', { params: { gradoId } }).then((res) => setCursos(res.data));
  }, [gradoId]);

  useEffect(() => {
    if (seccionId) cargar(); else setAlumnos(null);
  }, [seccionId]);

  function cargar() {
    setError('');
    api.get('/notas/completo', { params: { seccionId, anioEscolar: ANIO } })
      .then((res) => setAlumnos(res.data))
      .catch((err) => setError(err.response?.data?.mensaje || 'No se pudo cargar el boletín.'));
  }

  function valorCelda(alumno, cursoId, periodo) {
    const v = alumno.notas[`${cursoId}-${periodo}`];
    return v === undefined || v === null ? '' : v;
  }

  function cambiarCelda(alumnoId, cursoId, periodo, valor) {
    setAlumnos((prev) => prev.map((a) => (
      a.alumno_id === alumnoId ? { ...a, notas: { ...a.notas, [`${cursoId}-${periodo}`]: valor } } : a
    )));
  }

  async function guardarCelda(alumno, cursoId, periodo, valorOriginal) {
    const valor = alumno.notas[`${cursoId}-${periodo}`];
    if (valor === '' || valor === undefined || valor === null || String(valor) === String(valorOriginal ?? '')) return;
    const clave = `${alumno.alumno_id}-${cursoId}-${periodo}`;
    setGuardandoCelda(clave); setErrorCelda(null);
    try {
      await api.post('/notas', { alumnoId: alumno.alumno_id, cursoId, anioEscolar: ANIO, periodo, nota: valor });
    } catch (err) {
      setErrorCelda({ clave, mensaje: err.response?.data?.mensaje || 'No se pudo guardar.' });
    } finally {
      setGuardandoCelda(null);
    }
  }

  function promedioGeneral(alumno) {
    const valores = cursos.flatMap((c) => PERIODOS.map((p) => alumno.notas[`${c.id}-${p}`]))
      .filter((v) => v !== undefined && v !== null && v !== '');
    if (valores.length === 0) return '—';
    return (valores.reduce((s, v) => s + Number(v), 0) / valores.length).toFixed(1);
  }

  return (
    <div>
      <PageHeader titulo="Notas" subtitulo="Boletín completo por sección: todos los cursos y los 4 bimestres." />

      <PonderacionNotas />

      <Card className="p-6 grid sm:grid-cols-2 gap-4 mb-6">
        <Selector etiqueta="Grado" valor={gradoId} onChange={setGradoId}>
          <option value="">Selecciona un grado</option>
          {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </Selector>
        <Selector etiqueta="Sección" valor={seccionId} onChange={setSeccionId} disabled={!gradoId}>
          <option value="">Selecciona una sección</option>
          {secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </Selector>
      </Card>

      {error && <p className="text-sm text-rojo-500 mb-4">{error}</p>}

      {alumnos && alumnos.length === 0 && (
        <p className="text-marino-400 text-sm">Esa sección no tiene alumnos matriculados este año.</p>
      )}

      {alumnos && alumnos.length > 0 && cursos.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-marino-400 text-[11px] uppercase tracking-wide">
                <th rowSpan={2} className="px-4 py-2 sticky left-0 bg-white align-bottom">Alumno</th>
                {cursos.map((c) => (
                  <th key={c.id} colSpan={4} className="px-2 py-2 text-center border-l border-marino-100">{c.nombre}</th>
                ))}
                <th rowSpan={2} className="px-3 py-2 text-center align-bottom border-l border-marino-100">Prom.<br />general</th>
              </tr>
              <tr className="text-left text-marino-300 text-[10px]">
                {cursos.map((c) => (
                  PERIODOS.map((p, i) => (
                    <th key={`${c.id}-${p}`} className={`px-1.5 py-1.5 text-center font-normal ${i === 0 ? 'border-l border-marino-100' : ''}`}>
                      {p.split(' ')[0]}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-marino-50">
              {alumnos.map((a) => (
                <tr key={a.alumno_id}>
                  <td className="px-4 py-2 text-marino-800 font-medium whitespace-nowrap sticky left-0 bg-white">{a.apellidos}, {a.nombres}</td>
                  {cursos.map((c) => (
                    PERIODOS.map((p, i) => {
                      const clave = `${a.alumno_id}-${c.id}-${p}`;
                      const original = valorCelda(a, c.id, p);
                      return (
                        <td key={clave} className={`px-1 py-1.5 ${i === 0 ? 'border-l border-marino-100' : ''}`}>
                          <input
                            type="number" min="0" max="20" step="0.5"
                            value={valorCelda(a, c.id, p)}
                            onChange={(e) => cambiarCelda(a.alumno_id, c.id, p, e.target.value)}
                            onBlur={() => guardarCelda(a, c.id, p, original)}
                            disabled={guardandoCelda === clave}
                            title={errorCelda?.clave === clave ? errorCelda.mensaje : undefined}
                            className={`w-12 rounded-md border px-1.5 py-1 text-center focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow ${
                              errorCelda?.clave === clave ? 'border-rojo-400 bg-rojo-50' : 'border-marino-200'
                            }`}
                          />
                        </td>
                      );
                    })
                  ))}
                  <td className="px-3 py-2 text-center font-semibold text-marino-700 border-l border-marino-100">{promedioGeneral(a)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {alumnos && alumnos.length > 0 && cursos.length === 0 && (
        <p className="text-marino-400 text-sm">Ese grado no tiene cursos registrados en el catálogo.</p>
      )}
    </div>
  );
}

function Selector({ etiqueta, valor, onChange, children, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <select value={valor} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full rounded-xl border border-marino-200 px-4 py-2.5 bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow disabled:opacity-50 disabled:bg-marino-50">
        {children}
      </select>
    </div>
  );
}
