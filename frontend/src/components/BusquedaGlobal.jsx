import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, GraduationCap, Megaphone, X, CornerDownLeft } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function BusquedaGlobal() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef(null);

  const esAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    function alPresionar(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAbierto((v) => !v);
      }
      if (e.key === 'Escape') setAbierto(false);
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, []);

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 30);
    else { setTermino(''); setResultados(null); }
  }, [abierto]);

  useEffect(() => {
    if (!esAdmin || termino.trim().length < 1) { setResultados(null); return; }
    setCargando(true);
    const t = setTimeout(() => {
      api.get('/busqueda', { params: { q: termino.trim() } })
        .then((res) => setResultados(res.data))
        .catch(() => setResultados({ alumnos: [], docentes: [], avisos: [] }))
        .finally(() => setCargando(false));
    }, 250);
    return () => clearTimeout(t);
  }, [termino, esAdmin]);

  if (!esAdmin) return null;

  function ir(ruta) {
    navigate(ruta);
    setAbierto(false);
  }

  const total = resultados ? resultados.alumnos.length + resultados.docentes.length + resultados.avisos.length : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2.5 text-sm text-marino-400 hover:text-marino-700 bg-white border border-marino-100 hover:border-marino-200 rounded-xl px-3.5 py-2.5 transition-colors w-full max-w-md shadow-[0_1px_2px_rgba(4,21,52,0.04)]"
      >
        <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left truncate">Buscar alumnos (DNI/nombre), docentes o avisos...</span>
        <kbd className="hidden sm:inline text-[10px] font-semibold bg-marino-50 text-marino-500 rounded px-1.5 py-0.5">Ctrl K</kbd>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 bg-marino-900/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div role="dialog" aria-label="Búsqueda global" className="w-full max-w-lg rounded-2xl bg-white shadow-soft overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-marino-100">
              <Search className="w-4 h-4 text-marino-400 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                placeholder="Busca un alumno, docente o aviso..."
                className="flex-1 outline-none text-sm text-marino-800 placeholder:text-marino-300"
              />
              <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar búsqueda" className="text-marino-300 hover:text-marino-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {termino.trim().length < 1 && (
                <p className="px-4 py-8 text-center text-sm text-marino-300">Escribe para buscar un alumno, docente o aviso.</p>
              )}
              {termino.trim().length >= 1 && cargando && (
                <p className="px-4 py-8 text-center text-sm text-marino-300">Buscando...</p>
              )}
              {termino.trim().length >= 1 && !cargando && resultados && total === 0 && (
                <p className="px-4 py-8 text-center text-sm text-marino-300">Sin resultados para "{termino}".</p>
              )}

              {resultados?.alumnos.length > 0 && (
                <Grupo titulo="Alumnos">
                  {resultados.alumnos.map((a) => (
                    <Resultado
                      key={`al-${a.id}`}
                      icono={User}
                      titulo={`${a.apellidos}, ${a.nombres}`}
                      subtitulo={`DNI ${a.dni}${a.grado_nombre ? ` · ${a.grado_nombre} "${a.seccion_nombre}"` : ''}`}
                      onClick={() => ir(`/admin/alumnos?abrir=${a.id}`)}
                    />
                  ))}
                </Grupo>
              )}

              {resultados?.docentes.length > 0 && (
                <Grupo titulo="Docentes">
                  {resultados.docentes.map((d) => (
                    <Resultado
                      key={`do-${d.id}`}
                      icono={GraduationCap}
                      titulo={`${d.apellidos}, ${d.nombres}`}
                      subtitulo={`DNI ${d.dni}${d.especialidad ? ` · ${d.especialidad}` : ''}`}
                      onClick={() => ir('/admin/docentes')}
                    />
                  ))}
                </Grupo>
              )}

              {resultados?.avisos.length > 0 && (
                <Grupo titulo="Avisos">
                  {resultados.avisos.map((av) => (
                    <Resultado
                      key={`av-${av.id}`}
                      icono={Megaphone}
                      titulo={av.titulo}
                      subtitulo={`Dirigido a ${av.dirigido_a}`}
                      onClick={() => ir('/admin/avisos')}
                    />
                  ))}
                </Grupo>
              )}
            </div>

            <div className="flex items-center gap-1.5 px-4 py-2.5 border-t border-marino-50 text-[11px] text-marino-300">
              <CornerDownLeft className="w-3 h-3" aria-hidden="true" /> Selecciona un resultado · Esc para cerrar
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Grupo({ titulo, children }) {
  return (
    <div className="py-2">
      <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-marino-300">{titulo}</p>
      {children}
    </div>
  );
}

function Resultado({ icono: Icono, titulo, subtitulo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-papel transition-colors"
    >
      <span className="w-8 h-8 rounded-lg bg-marino-50 flex items-center justify-center shrink-0">
        <Icono className="w-4 h-4 text-marino-600" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-marino-800 truncate">{titulo}</span>
        <span className="block text-xs text-marino-400 truncate">{subtitulo}</span>
      </span>
    </button>
  );
}
