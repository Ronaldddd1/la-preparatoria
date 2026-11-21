import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, KeyRound, Download, RefreshCw, Users, QrCode, X, Camera } from 'lucide-react';
import api from '../../api/axios';
import { descargarArchivo } from '../../utils/descargas';
import { Card, Chip, EmptyState, PageHeader } from '../../components/ui';

export default function GestionAlumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [gradoId, setGradoId] = useState('');
  const [seccionId, setSeccionId] = useState('');
  const [anioEscolar, setAnioEscolar] = useState('');
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [credenciales, setCredenciales] = useState(null);
  const [mostrarRenovar, setMostrarRenovar] = useState(false);
  const [qr, setQr] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const inputFotoRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => { buscarAlumnos(); api.get('/grados').then((res) => setGrados(res.data)); }, []);
  useEffect(() => {
    setSeccionId('');
    if (!gradoId) { setSecciones([]); return; }
    api.get('/secciones', { params: { gradoId } }).then((res) => setSecciones(res.data));
  }, [gradoId]);
  useEffect(() => { buscarAlumnos(); }, [gradoId, seccionId, anioEscolar]);

  // Si llegamos desde la búsqueda global (?abrir=<id>), abre ese alumno directamente.
  useEffect(() => {
    const abrirId = searchParams.get('abrir');
    if (abrirId) {
      abrirAlumno(Number(abrirId));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  function buscarAlumnos(e) {
    e?.preventDefault();
    api.get('/alumnos', { params: { buscar, gradoId: gradoId || undefined, seccionId: seccionId || undefined, anioEscolar: anioEscolar || undefined } })
      .then((res) => setAlumnos(res.data));
  }

  function abrirAlumno(id) {
    api.get(`/alumnos/${id}`).then((res) => {
      setSeleccionado(res.data);
      setForm({
        nombres: res.data.nombres, apellidos: res.data.apellidos,
        fechaNacimiento: res.data.fecha_nacimiento?.slice(0, 10) || '', sexo: res.data.sexo || '',
        direccion: res.data.direccion || '', telefono: res.data.telefono || '', email: res.data.email || '',
        apoderadoNombre: res.data.apoderado_nombre || '', apoderadoTelefono: res.data.apoderado_telefono || '',
        estado: res.data.estado,
      });
      setMensaje(''); setCredenciales(null); setMostrarRenovar(false);
    });
  }

  async function guardar(e) {
    e.preventDefault();
    await api.put(`/alumnos/${seleccionado.id}`, form);
    setMensaje('Datos guardados.');
    buscarAlumnos();
  }

  async function resetearPassword() {
    if (!confirm(`¿Reiniciar la contraseña de ${seleccionado.nombres} a su DNI (${seleccionado.dni})?`)) return;
    const { data } = await api.put(`/alumnos/${seleccionado.id}/resetear-password`);
    setCredenciales({ username: seleccionado.dni, password: data.credenciales.password });
  }

  async function descargarConstancia() {
    try { await descargarArchivo(`/reportes/constancia/${seleccionado.id}`, `constancia-${seleccionado.dni}.pdf`, true); }
    catch { setMensaje('No se pudo generar la constancia (¿tiene matrícula activa?).'); }
  }

  async function descargarBoleta() {
    try { await descargarArchivo(`/reportes/boleta/${seleccionado.id}`, `boleta-${seleccionado.dni}.pdf`, true); }
    catch { setMensaje('No se pudo generar la boleta (¿tiene notas registradas este año?).'); }
  }

  async function descargarAsistencia() {
    try { await descargarArchivo(`/reportes/asistencia-pdf/${seleccionado.id}`, `asistencia-${seleccionado.dni}.pdf`, true); }
    catch { setMensaje('No se pudo generar el reporte (¿tiene asistencia registrada este año?).'); }
  }

  async function verQr() {
    const { data } = await api.get(`/alumnos/${seleccionado.id}/qr`);
    setQr(data);
  }

  async function subirFoto(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setSubiendoFoto(true);
    try {
      const form2 = new FormData();
      form2.append('foto', archivo);
      const { data } = await api.post(`/alumnos/${seleccionado.id}/foto`, form2);
      setSeleccionado((s) => ({ ...s, foto_url: data.fotoUrl }));
    } catch (err) {
      setMensaje(err.response?.data?.mensaje || 'No se pudo subir la foto.');
    } finally {
      setSubiendoFoto(false);
      if (inputFotoRef.current) inputFotoRef.current.value = '';
    }
  }

  return (
    <div>
      <PageHeader etiquetas={<Chip color="azul">ACADÉMICO • DIRECTORIO DE ESTUDIANTES</Chip>} titulo="Alumnos" subtitulo="Busca, edita y gestiona las cuentas de tus alumnos." />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={buscarAlumnos} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marino-300" />
              <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar por DNI o nombre..."
                className="w-full rounded-xl border border-marino-200 pl-10 pr-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
            </div>
            <button className="rounded-xl bg-marino-700 hover:bg-marino-800 text-white px-4 font-medium transition-colors">Buscar</button>
          </form>

          <div className="grid grid-cols-3 gap-2">
            <select value={gradoId} onChange={(e) => setGradoId(e.target.value)}
              className="rounded-xl border border-marino-200 px-2 py-2 text-xs bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
              <option value="">Todos los grados</option>
              {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
            <select value={seccionId} onChange={(e) => setSeccionId(e.target.value)} disabled={!gradoId}
              className="rounded-xl border border-marino-200 px-2 py-2 text-xs bg-white disabled:opacity-50 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
              <option value="">Todas las secciones</option>
              {secciones.map((s) => <option key={s.id} value={s.id}>Sección {s.nombre}</option>)}
            </select>
            <input type="number" placeholder="Año" value={anioEscolar} onChange={(e) => setAnioEscolar(e.target.value)}
              className="rounded-xl border border-marino-200 px-2 py-2 text-xs focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
          </div>

          <div className="flex gap-4">
            <button onClick={() => descargarArchivo('/reportes/alumnos.csv', 'alumnos.csv')} className="text-xs font-medium text-marino-500 hover:text-rojo-500 transition-colors">
              Exportar lista completa a CSV
            </button>
            <button onClick={() => descargarArchivo('/reportes/alumnos.xlsx', 'alumnos.xlsx')} className="text-xs font-medium text-marino-500 hover:text-rojo-500 transition-colors">
              Exportar a Excel
            </button>
          </div>

          <Card className="divide-y divide-marino-50 max-h-[65vh] overflow-y-auto">
            {alumnos.map((a) => (
              <button key={a.id} onClick={() => abrirAlumno(a.id)}
                className={`w-full text-left px-4 py-3 hover:bg-papel transition-colors ${seleccionado?.id === a.id ? 'bg-rojo-50' : ''}`}>
                <p className="font-medium text-marino-800">{a.apellidos}, {a.nombres}</p>
                <p className="text-xs text-marino-400">DNI {a.dni} · {a.estado}</p>
              </button>
            ))}
            {alumnos.length === 0 && <p className="px-4 py-8 text-sm text-marino-400 text-center">No se encontraron alumnos.</p>}
          </Card>
        </div>

        <div className="lg:col-span-3">
          {!form ? (
            <EmptyState icono={Users} titulo="Selecciona un alumno" descripcion="Elige un alumno de la lista para ver y editar su ficha." />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Accion onClick={resetearPassword} icono={KeyRound} texto="Reiniciar contraseña" />
                <Accion onClick={descargarConstancia} icono={Download} texto="Descargar constancia" />
                <Accion onClick={descargarBoleta} icono={Download} texto="Descargar boleta" />
                <Accion onClick={descargarAsistencia} icono={Download} texto="Reporte de asistencia" />
                <Accion onClick={verQr} icono={QrCode} texto="Ver código QR" />
                <Accion onClick={() => setMostrarRenovar((v) => !v)} icono={RefreshCw} texto="Renovar matrícula" />
              </div>

              {credenciales && (
                <Card className="p-4 border-esmeralda-100 bg-esmeralda-50/60 text-sm text-marino-700">
                  Nueva contraseña de <span className="font-mono font-semibold">{credenciales.username}</span>: <span className="font-mono font-semibold">{credenciales.password}</span>
                </Card>
              )}

              {mostrarRenovar && (
                <RenovarMatricula alumno={seleccionado} onExito={() => { setMostrarRenovar(false); abrirAlumno(seleccionado.id); }} />
              )}

              <Card className="p-6">
                <form onSubmit={guardar} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => inputFotoRef.current?.click()}
                      disabled={subiendoFoto}
                      aria-label="Cambiar foto de perfil"
                      className="relative w-11 h-11 rounded-xl bg-marino-50 flex items-center justify-center overflow-hidden shrink-0 group"
                    >
                      {seleccionado.foto_url ? (
                        <img src={seleccionado.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-marino-700" />
                      )}
                      <span className="absolute inset-0 bg-marino-900/0 group-hover:bg-marino-900/40 flex items-center justify-center transition-colors">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                      </span>
                    </button>
                    <input ref={inputFotoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={subirFoto} className="hidden" />
                    <h2 className="font-display text-lg font-semibold text-marino-800">{seleccionado.nombres} {seleccionado.apellidos} · DNI {seleccionado.dni}</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Campo etiqueta="Nombres" valor={form.nombres} onChange={(v) => setForm({ ...form, nombres: v })} />
                    <Campo etiqueta="Apellidos" valor={form.apellidos} onChange={(v) => setForm({ ...form, apellidos: v })} />
                    <Campo etiqueta="Fecha de nacimiento" tipo="date" valor={form.fechaNacimiento} onChange={(v) => setForm({ ...form, fechaNacimiento: v })} />
                    <Selector etiqueta="Sexo" valor={form.sexo} onChange={(v) => setForm({ ...form, sexo: v })}>
                      <option value="">-</option><option value="M">Masculino</option><option value="F">Femenino</option>
                    </Selector>
                    <Campo etiqueta="Dirección" valor={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} className="sm:col-span-2" />
                    <Campo etiqueta="Teléfono" valor={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
                    <Campo etiqueta="Correo" tipo="email" valor={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                    <Campo etiqueta="Apoderado" valor={form.apoderadoNombre} onChange={(v) => setForm({ ...form, apoderadoNombre: v })} />
                    <Campo etiqueta="Teléfono del apoderado" valor={form.apoderadoTelefono} onChange={(v) => setForm({ ...form, apoderadoTelefono: v })} />
                    <Selector etiqueta="Estado" valor={form.estado} onChange={(v) => setForm({ ...form, estado: v })}>
                      <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
                    </Selector>
                  </div>

                  {seleccionado.matriculas?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-marino-700 mb-2">Historial de matrículas</h3>
                      <ul className="text-sm text-marino-500 space-y-1">
                        {seleccionado.matriculas.map((m) => <li key={m.id}>{m.anio_escolar} · {m.grado_nombre} "{m.seccion_nombre}" · {m.estado}</li>)}
                      </ul>
                    </div>
                  )}

                  {mensaje && <p className="text-sm text-esmeralda-600">{mensaje}</p>}
                  <button type="submit" className="rounded-xl bg-marino-700 hover:bg-marino-800 text-white font-medium px-5 py-2.5 transition-colors">Guardar cambios</button>
                </form>
              </Card>
            </div>
          )}
        </div>
      </div>

      {qr && (
        <div className="fixed inset-0 z-50 bg-marino-900/50 backdrop-blur-sm flex items-center justify-center px-4">
          <Card className="w-full max-w-xs p-6 relative text-center">
            <button onClick={() => setQr(null)} aria-label="Cerrar" className="absolute top-4 right-4 text-marino-300 hover:text-marino-600">
              <X className="w-4 h-4" />
            </button>
            <h2 className="font-display text-lg font-semibold text-marino-800 mb-1">Código QR</h2>
            <p className="text-sm text-marino-400 mb-4">{qr.nombres} {qr.apellidos} · DNI {qr.dni}</p>
            <img src={qr.qr} alt={`Código QR de ${qr.nombres}`} className="mx-auto rounded-lg border border-marino-100" />
            <a href={qr.qr} download={`qr-${qr.dni}.png`} className="inline-block mt-4 text-sm font-medium text-rojo-500 hover:underline">
              Descargar imagen
            </a>
          </Card>
        </div>
      )}
    </div>
  );
}

function RenovarMatricula({ alumno, onExito }) {
  const ANIO = 2027;
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [gradoId, setGradoId] = useState('');
  const [seccionId, setSeccionId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.get('/grados').then((res) => setGrados(res.data)); }, []);
  useEffect(() => {
    if (!gradoId) { setSecciones([]); return; }
    api.get('/secciones', { params: { gradoId, anio: ANIO } }).then((res) => setSecciones(res.data));
  }, [gradoId]);

  async function enviar(e) {
    e.preventDefault(); setError('');
    try {
      await api.post(`/matriculas/renovar/${alumno.id}`, { gradoId, seccionId, anioEscolar: ANIO });
      onExito();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo renovar la matrícula.');
    }
  }

  return (
    <Card className="p-5 border-ambar-100 bg-ambar-50/50">
      <form onSubmit={enviar} className="space-y-3">
        <p className="text-sm font-medium text-marino-700">Renovar matrícula {ANIO} para {alumno.nombres} {alumno.apellidos}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <select required value={gradoId} onChange={(e) => setGradoId(e.target.value)}
            className="rounded-xl border border-marino-200 px-3 py-2 bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
            <option value="">Selecciona el nuevo grado</option>
            {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre} - {g.nivel}</option>)}
          </select>
          <select required disabled={!gradoId} value={seccionId} onChange={(e) => setSeccionId(e.target.value)}
            className="rounded-xl border border-marino-200 px-3 py-2 bg-white disabled:opacity-50 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
            <option value="">Selecciona la sección</option>
            {secciones.map((s) => <option key={s.id} value={s.id} disabled={s.cupos_disponibles <= 0}>Sección {s.nombre} — {s.cupos_disponibles > 0 ? `${s.cupos_disponibles} vacantes` : 'sin vacantes'}</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-rojo-500">{error}</p>}
        <button className="rounded-xl bg-marino-700 hover:bg-marino-800 text-white text-sm font-medium px-4 py-2 transition-colors">Confirmar renovación</button>
      </form>
    </Card>
  );
}

function Accion({ onClick, icono: Icono, texto }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs font-medium rounded-xl border border-marino-200 px-3 py-2 text-marino-700 hover:bg-white hover:border-marino-300 transition-colors">
      <Icono className="w-3.5 h-3.5" /> {texto}
    </button>
  );
}
function Campo({ etiqueta, valor, onChange, tipo = 'text', className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
    </div>
  );
}
function Selector({ etiqueta, valor, onChange, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <select value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-4 py-2.5 bg-white focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
        {children}
      </select>
    </div>
  );
}
