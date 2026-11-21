import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  CalendarDays, NotebookText, ClipboardCheck, Megaphone, IdCard, KeyRound,
  LayoutDashboard, ClipboardList, UserPlus, Users, GraduationCap, CalendarClock,
  Layers, ShieldAlert, ShieldCheck, MessageCircle, FileCheck, CalendarRange, AlertTriangle, QrCode,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import Shell from './components/Shell';

// Cada página se carga bajo demanda (code-splitting): reduce el peso inicial
// que descarga el navegador, sobre todo importante en conexiones móviles lentas.
const Login = lazy(() => import('./pages/Login'));
const CambiarPassword = lazy(() => import('./pages/CambiarPassword'));
const TerminosCondiciones = lazy(() => import('./pages/TerminosCondiciones'));
const Avisos = lazy(() => import('./pages/Avisos'));
const Calendario = lazy(() => import('./pages/Calendario'));
const Quiosco = lazy(() => import('./pages/Quiosco'));
const NoEncontrada = lazy(() => import('./pages/NoEncontrada'));

const MiHorario = lazy(() => import('./pages/alumno/MiHorario'));
const MisDatos = lazy(() => import('./pages/alumno/MisDatos'));
const MisNotas = lazy(() => import('./pages/alumno/MisNotas'));
const MiAsistencia = lazy(() => import('./pages/alumno/MiAsistencia'));
const MensajesAlumno = lazy(() => import('./pages/alumno/Mensajes'));
const MisIncidencias = lazy(() => import('./pages/alumno/MisIncidencias'));

const MisClases = lazy(() => import('./pages/docente/MisClases'));
const AsistenciaDocente = lazy(() => import('./pages/docente/Asistencia'));
const NotasDocente = lazy(() => import('./pages/docente/Notas'));
const MensajesDocente = lazy(() => import('./pages/docente/Mensajes'));
const IncidenciasDocente = lazy(() => import('./pages/docente/Incidencias'));

const AdminInicio = lazy(() => import('./pages/admin/AdminInicio'));
const GestionHorarios = lazy(() => import('./pages/admin/GestionHorarios'));
const GestionAlumnos = lazy(() => import('./pages/admin/GestionAlumnos'));
const GestionMatriculas = lazy(() => import('./pages/admin/GestionMatriculas'));
const NuevaMatricula = lazy(() => import('./pages/admin/NuevaMatricula'));
const GestionCatalogo = lazy(() => import('./pages/admin/GestionCatalogo'));
const GestionDocentes = lazy(() => import('./pages/admin/GestionDocentes'));
const GestionNotas = lazy(() => import('./pages/admin/GestionNotas'));
const GestionAvisos = lazy(() => import('./pages/admin/GestionAvisos'));
const GestionCalendario = lazy(() => import('./pages/admin/GestionCalendario'));
const Auditoria = lazy(() => import('./pages/admin/Auditoria'));
const Seguridad = lazy(() => import('./pages/admin/Seguridad'));
const Justificaciones = lazy(() => import('./pages/admin/Justificaciones'));
const IncidenciasAdmin = lazy(() => import('./pages/admin/Incidencias'));

function CargandoPagina() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-papel">
      <div className="w-8 h-8 rounded-full border-2 border-marino-200 border-t-rojo-400 animate-spin" />
    </div>
  );
}

// Los enlaces se agrupan (grupo con titulo null = sin encabezado, siempre
// visible) para que la barra lateral no se vea como una lista plana de
// muchos íconos; Shell.jsx pliega/despliega cada grupo con encabezado.
const enlacesAlumno = [
  { titulo: null, enlaces: [
    { to: '/alumno', etiqueta: 'Mi horario', end: true, icono: CalendarDays },
  ] },
  { titulo: 'Mi progreso', enlaces: [
    { to: '/alumno/notas', etiqueta: 'Mis notas', icono: NotebookText },
    { to: '/alumno/asistencia', etiqueta: 'Mi asistencia', icono: ClipboardCheck },
    { to: '/alumno/incidencias', etiqueta: 'Mis incidencias', icono: AlertTriangle },
  ] },
  { titulo: 'Comunicación', enlaces: [
    { to: '/alumno/mensajes', etiqueta: 'Mensajes', icono: MessageCircle },
    { to: '/alumno/avisos', etiqueta: 'Avisos', icono: Megaphone },
    { to: '/alumno/calendario', etiqueta: 'Calendario', icono: CalendarRange },
  ] },
  { titulo: 'Mi cuenta', enlaces: [
    { to: '/alumno/mis-datos', etiqueta: 'Mis datos', icono: IdCard },
    { to: '/alumno/contrasena', etiqueta: 'Cambiar contraseña', icono: KeyRound },
  ] },
];

const enlacesDocente = [
  { titulo: null, enlaces: [
    { to: '/docente', etiqueta: 'Mis clases', end: true, icono: CalendarDays },
  ] },
  { titulo: 'Mi trabajo', enlaces: [
    { to: '/docente/asistencia', etiqueta: 'Asistencia', icono: ClipboardCheck },
    { to: '/docente/notas', etiqueta: 'Notas', icono: NotebookText },
    { to: '/docente/incidencias', etiqueta: 'Incidencias', icono: AlertTriangle },
    { to: '/kiosko', etiqueta: 'Modo quiosco', icono: QrCode },
  ] },
  { titulo: 'Comunicación', enlaces: [
    { to: '/docente/mensajes', etiqueta: 'Mensajes', icono: MessageCircle },
    { to: '/docente/avisos', etiqueta: 'Avisos', icono: Megaphone },
    { to: '/docente/calendario', etiqueta: 'Calendario', icono: CalendarRange },
  ] },
  { titulo: 'Mi cuenta', enlaces: [
    { to: '/docente/contrasena', etiqueta: 'Mi contraseña', icono: KeyRound },
  ] },
];

const enlacesAdmin = [
  { titulo: null, enlaces: [
    { to: '/admin', etiqueta: 'Inicio', end: true, icono: LayoutDashboard },
  ] },
  { titulo: 'Académico', enlaces: [
    { to: '/admin/matriculas', etiqueta: 'Matrículas', end: true, icono: ClipboardList },
    { to: '/admin/matriculas/nueva', etiqueta: 'Nueva matrícula', icono: UserPlus },
    { to: '/admin/alumnos', etiqueta: 'Alumnos', icono: Users },
    { to: '/admin/docentes', etiqueta: 'Docentes', icono: GraduationCap },
    { to: '/admin/notas', etiqueta: 'Notas', icono: NotebookText },
    { to: '/admin/horarios', etiqueta: 'Horarios', icono: CalendarClock },
    { to: '/admin/catalogo', etiqueta: 'Cursos y secciones', icono: Layers },
  ] },
  { titulo: 'Comunicación', enlaces: [
    { to: '/admin/avisos', etiqueta: 'Avisos', icono: Megaphone },
    { to: '/admin/calendario', etiqueta: 'Calendario', icono: CalendarRange },
  ] },
  { titulo: 'Convivencia', enlaces: [
    { to: '/admin/justificaciones', etiqueta: 'Justificaciones', icono: FileCheck },
    { to: '/admin/incidencias', etiqueta: 'Incidencias', icono: AlertTriangle },
  ] },
  { titulo: 'Sistema', enlaces: [
    { to: '/admin/auditoria', etiqueta: 'Auditoría', icono: ShieldAlert },
    { to: '/admin/seguridad', etiqueta: 'Seguridad', icono: ShieldCheck },
    { to: '/kiosko', etiqueta: 'Modo quiosco', icono: QrCode },
  ] },
  { titulo: 'Mi cuenta', enlaces: [
    { to: '/admin/contrasena', etiqueta: 'Mi contraseña', icono: KeyRound },
  ] },
];

const RUTA_INICIO = { admin: '/admin', docente: '/docente', alumno: '/alumno' };

export default function App() {
  const { usuario } = useAuth();
  const location = useLocation();

  if (usuario?.debeCambiarPassword && !location.pathname.endsWith('/contrasena')) {
    return <Navigate to={`${RUTA_INICIO[usuario.rol]}/contrasena`} replace />;
  }
  if (
    usuario &&
    !usuario.debeCambiarPassword &&
    !usuario.aceptoTerminos &&
    !location.pathname.endsWith('/terminos')
  ) {
    return <Navigate to={`${RUTA_INICIO[usuario.rol]}/terminos`} replace />;
  }

  return (
    <Suspense fallback={<CargandoPagina />}>
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to={RUTA_INICIO[usuario.rol]} replace /> : <Login />} />
      <Route path="/" element={<Navigate to={usuario ? RUTA_INICIO[usuario.rol] : '/login'} replace />} />
      <Route path="/kiosko" element={<Quiosco />} />

      <Route
        path="/alumno/*"
        element={
          <RutaProtegida rolRequerido="alumno">
            <Shell enlaces={enlacesAlumno}>
              <Routes>
                <Route index element={<MiHorario />} />
                <Route path="notas" element={<MisNotas />} />
                <Route path="asistencia" element={<MiAsistencia />} />
                <Route path="mensajes" element={<MensajesAlumno />} />
                <Route path="incidencias" element={<MisIncidencias />} />
                <Route path="avisos" element={<Avisos />} />
                <Route path="calendario" element={<Calendario />} />
                <Route path="mis-datos" element={<MisDatos />} />
                <Route path="contrasena" element={<CambiarPassword />} />
                <Route path="terminos" element={<TerminosCondiciones />} />
                <Route path="*" element={<NoEncontrada />} />
              </Routes>
            </Shell>
          </RutaProtegida>
        }
      />

      <Route
        path="/docente/*"
        element={
          <RutaProtegida rolRequerido="docente">
            <Shell enlaces={enlacesDocente}>
              <Routes>
                <Route index element={<MisClases />} />
                <Route path="asistencia" element={<AsistenciaDocente />} />
                <Route path="notas" element={<NotasDocente />} />
                <Route path="mensajes" element={<MensajesDocente />} />
                <Route path="incidencias" element={<IncidenciasDocente />} />
                <Route path="avisos" element={<Avisos />} />
                <Route path="calendario" element={<Calendario />} />
                <Route path="contrasena" element={<CambiarPassword />} />
                <Route path="terminos" element={<TerminosCondiciones />} />
                <Route path="*" element={<NoEncontrada />} />
              </Routes>
            </Shell>
          </RutaProtegida>
        }
      />

      <Route
        path="/admin/*"
        element={
          <RutaProtegida rolRequerido="admin">
            <Shell enlaces={enlacesAdmin}>
              <Routes>
                <Route index element={<AdminInicio />} />
                <Route path="matriculas" element={<GestionMatriculas />} />
                <Route path="matriculas/nueva" element={<NuevaMatricula />} />
                <Route path="alumnos" element={<GestionAlumnos />} />
                <Route path="docentes" element={<GestionDocentes />} />
                <Route path="notas" element={<GestionNotas />} />
                <Route path="horarios" element={<GestionHorarios />} />
                <Route path="catalogo" element={<GestionCatalogo />} />
                <Route path="avisos" element={<GestionAvisos />} />
                <Route path="justificaciones" element={<Justificaciones />} />
                <Route path="incidencias" element={<IncidenciasAdmin />} />
                <Route path="calendario" element={<GestionCalendario />} />
                <Route path="auditoria" element={<Auditoria />} />
                <Route path="seguridad" element={<Seguridad />} />
                <Route path="contrasena" element={<CambiarPassword />} />
                <Route path="terminos" element={<TerminosCondiciones />} />
                <Route path="*" element={<NoEncontrada />} />
              </Routes>
            </Shell>
          </RutaProtegida>
        }
      />

      <Route path="*" element={<NoEncontrada />} />
    </Routes>
    </Suspense>
  );
}
