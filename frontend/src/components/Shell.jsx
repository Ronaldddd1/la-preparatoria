import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import Notificaciones from './Notificaciones';
import BusquedaGlobal from './BusquedaGlobal';

const ROL_ETIQUETA = { admin: 'Administración', docente: 'Docente', alumno: 'Estudiante' };

// Un grupo sin título (titulo: null) siempre se muestra, sin encabezado (se
// usa para el enlace principal de "Inicio"/"Mis clases"). Un grupo con título
// se muestra abierto, con un encabezado pequeño en mayúsculas que se puede
// plegar; empieza plegado solo en pantallas móviles si no contiene la ruta activa.
function GrupoNav({ grupo, onNavegar }) {
  const location = useLocation();
  const contieneActivo = grupo.enlaces.some((e) => location.pathname.startsWith(e.to));
  const [abierto, setAbierto] = useState(true);

  const estiloEnlace = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition-colors ${
      isActive
        ? 'bg-marino-700 text-white font-semibold shadow-soft'
        : 'text-marino-600 font-medium hover:bg-marino-50 hover:text-marino-900'
    }`;

  const enlaces = grupo.enlaces.map((enlace) => (
    <NavLink key={enlace.to} to={enlace.to} end={enlace.end} onClick={onNavegar} className={estiloEnlace}>
      <enlace.icono className="w-[17px] h-[17px] shrink-0" strokeWidth={2} />
      <span className="truncate">{enlace.etiqueta}</span>
    </NavLink>
  ));

  if (!grupo.titulo) return <div className="space-y-0.5">{enlaces}</div>;

  return (
    <div>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className={`w-full flex items-center justify-between px-3 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors ${
          contieneActivo ? 'text-marino-600' : 'text-marino-400 hover:text-marino-600'
        }`}
      >
        {grupo.titulo}
        <ChevronDown className={`w-3 h-3 transition-transform ${abierto ? '' : '-rotate-90'}`} />
      </button>
      {abierto && <div className="space-y-0.5">{enlaces}</div>}
    </div>
  );
}

function Iniciales({ nombre }) {
  const texto = (nombre || '?').replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]/g, '').trim();
  return (
    <span className="w-9 h-9 rounded-full bg-marino-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
      {texto.slice(0, 2).toUpperCase() || '?'}
    </span>
  );
}

export default function Shell({ enlaces, children }) {
  const { usuario, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  function manejarSalir() {
    cerrarSesion();
    navigate('/login');
  }

  const rol = ROL_ETIQUETA[usuario?.rol] || '';

  return (
    <div className="min-h-screen bg-papel flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col sticky top-0 h-screen p-3">
        <div className="flex-1 flex flex-col rounded-2xl bg-white border border-marino-100/60 shadow-[0_1px_2px_rgba(4,21,52,0.04),0_4px_16px_-8px_rgba(4,21,52,0.08)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <Logo className="w-10 h-10" />
            <div className="flex-1 min-w-0">
              <p className="font-display text-[17px] font-semibold leading-tight text-marino-900">La Preparatoria</p>
              <p className="text-[11px] text-marino-400">SMP • Lima, Perú</p>
            </div>
          </div>

          <nav className="flex-1 px-3 pb-3 space-y-4 overflow-y-auto">
            {enlaces.map((grupo, i) => <GrupoNav key={grupo.titulo || i} grupo={grupo} />)}
          </nav>

          <div className="m-3 rounded-xl bg-marino-50/70 px-3 py-2 flex items-center justify-between text-[11px] text-marino-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rojo-400" aria-hidden="true" /> UGEL 02 • SMP
            </span>
            <span>{rol}</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior (escritorio) */}
        <header className="hidden md:flex items-center gap-3 px-6 pt-3 sticky top-0 z-20">
          <div className="flex-1 flex items-center gap-3 rounded-2xl bg-papel/90 backdrop-blur py-1">
            <BusquedaGlobal />
            <div className="flex-1" />
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-marino-100 px-3 py-1.5 text-xs font-semibold text-marino-800">
              Año 2026
              <span className="inline-flex items-center gap-1 rounded-full bg-rojo-50 text-rojo-500 px-1.5 py-0.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-rojo-400" aria-hidden="true" /> En curso
              </span>
            </span>
            <Notificaciones className="w-10 h-10 rounded-xl text-marino-600 hover:bg-white" />
            <span className="h-8 w-px bg-marino-100" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <Iniciales nombre={usuario?.username} />
              <div className="leading-tight">
                <p className="text-[13px] font-semibold text-marino-900">{usuario?.username}</p>
                <p className="text-[11px] text-marino-400">{rol}</p>
              </div>
            </div>
            <button
              onClick={manejarSalir}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-marino-500 hover:text-rojo-500 hover:bg-white transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </header>

        {/* Barra superior (móvil) */}
        <header className="md:hidden flex items-center justify-between bg-white border-b border-marino-100 px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-display text-base font-semibold text-marino-900">La Preparatoria</span>
          </div>
          <div className="flex items-center gap-1">
            <Notificaciones className="w-9 h-9 rounded-lg text-marino-600 hover:bg-marino-50" />
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              className="text-marino-700 p-1"
            >
              {menuAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {menuAbierto && (
          <nav className="md:hidden bg-white border-b border-marino-100 px-4 py-3 space-y-3 sticky top-[57px] z-20 max-h-[calc(100vh-57px)] overflow-y-auto">
            {enlaces.map((grupo, i) => (
              <GrupoNav key={grupo.titulo || i} grupo={grupo} onNavegar={() => setMenuAbierto(false)} />
            ))}
            <button onClick={manejarSalir} className="flex items-center gap-1.5 text-rojo-500 font-medium text-sm px-3 py-2">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </nav>
        )}

        <main className="flex-1 px-5 sm:px-8 py-6 max-w-[1240px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
