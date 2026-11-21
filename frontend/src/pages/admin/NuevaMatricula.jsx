import { useEffect, useState } from 'react';
import { UserPlus, MessageCircle } from 'lucide-react';
import api from '../../api/axios';
import { Card, Chip, PageHeader } from '../../components/ui';

const ANIO = 2026;
const formVacio = {
  dni: '', nombres: '', apellidos: '', fechaNacimiento: '', sexo: '',
  direccion: '', telefono: '', email: '', apoderadoNombre: '', apoderadoTelefono: '',
  gradoId: '', seccionId: '', montoPago: '', observaciones: '',
};

function enlaceWhatsapp(c) {
  const numero = (c.telefonoApoderado || '').replace(/\D/g, '');
  const numeroConPais = numero.startsWith('51') ? numero : `51${numero}`;
  const texto = encodeURIComponent(
    `Hola, se registró la matrícula de ${c.nombreAlumno} en La Preparatoria. ` +
    `Datos de acceso al sistema — Usuario: ${c.username} / Contraseña: ${c.password}. Se le pedirá cambiarla en el primer ingreso.`
  );
  return `https://wa.me/${numeroConPais}?text=${texto}`;
}

export default function NuevaMatricula() {
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState('');
  const [credenciales, setCredenciales] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { api.get('/grados').then((res) => setGrados(res.data)); }, []);
  useEffect(() => {
    if (!form.gradoId) { setSecciones([]); return; }
    api.get('/secciones', { params: { gradoId: form.gradoId, anio: ANIO } }).then((res) => setSecciones(res.data));
  }, [form.gradoId]);

  function actualizar(campo, valor) { setForm((f) => ({ ...f, [campo]: valor })); }

  async function registrar(e) {
    e.preventDefault();
    setError(''); setCredenciales(null); setGuardando(true);
    try {
      const { data } = await api.post('/matriculas', { ...form, anioEscolar: ANIO });
      setCredenciales(data.credencialesIniciales ? { ...data.credencialesIniciales, nombreAlumno: `${form.nombres} ${form.apellidos}`, telefonoApoderado: form.apoderadoTelefono } : null);
      setForm(formVacio);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo registrar la matrícula.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <PageHeader etiquetas={<Chip color="azul">ACADÉMICO • NUEVA MATRÍCULA</Chip>} titulo="Nueva matrícula" subtitulo={`Registra un alumno para el año escolar ${ANIO}.`} />

      {credenciales && (
        <Card className="max-w-3xl mb-6 p-5 border-esmeralda-100 bg-esmeralda-50/60">
          <p className="font-semibold text-esmeralda-600 mb-1">Matrícula registrada correctamente</p>
          <p className="text-sm text-marino-700">
            Usuario: <span className="font-mono font-semibold">{credenciales.username}</span>
            {' '}· Contraseña inicial: <span className="font-mono font-semibold">{credenciales.password}</span>
          </p>
          <p className="text-xs text-marino-400 mt-1">Se le pedirá cambiarla en su primer ingreso.</p>
          {credenciales.telefonoApoderado && (
            <a href={enlaceWhatsapp(credenciales)} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 rounded-xl bg-esmeralda-500 hover:bg-esmeralda-600 text-white text-sm font-medium px-4 py-2 transition-colors">
              <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
            </a>
          )}
        </Card>
      )}

      <form onSubmit={registrar} className="max-w-3xl space-y-6">
        <Card className="p-6">
          <SeccionTitulo icono={UserPlus} texto="Datos del alumno" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Campo etiqueta="DNI (8 dígitos)" valor={form.dni} onChange={(v) => actualizar('dni', v)} requerido maxLength={8} />
            <Campo etiqueta="Nombres" valor={form.nombres} onChange={(v) => actualizar('nombres', v)} requerido />
            <Campo etiqueta="Apellidos" valor={form.apellidos} onChange={(v) => actualizar('apellidos', v)} requerido />
            <Campo etiqueta="Fecha de nacimiento" tipo="date" valor={form.fechaNacimiento} onChange={(v) => actualizar('fechaNacimiento', v)} />
            <Selector etiqueta="Sexo" valor={form.sexo} onChange={(v) => actualizar('sexo', v)}>
              <option value="">-</option><option value="M">Masculino</option><option value="F">Femenino</option>
            </Selector>
            <Campo etiqueta="Dirección" valor={form.direccion} onChange={(v) => actualizar('direccion', v)} />
            <Campo etiqueta="Teléfono" valor={form.telefono} onChange={(v) => actualizar('telefono', v)} />
            <Campo etiqueta="Correo" tipo="email" valor={form.email} onChange={(v) => actualizar('email', v)} />
            <Campo etiqueta="Apoderado" valor={form.apoderadoNombre} onChange={(v) => actualizar('apoderadoNombre', v)} />
            <Campo etiqueta="Teléfono del apoderado" valor={form.apoderadoTelefono} onChange={(v) => actualizar('apoderadoTelefono', v)} />
          </div>
        </Card>

        <Card className="p-6">
          <SeccionTitulo icono={UserPlus} texto={`Matrícula ${ANIO}`} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Selector etiqueta="Grado" valor={form.gradoId} onChange={(v) => actualizar('gradoId', v)} requerido>
              <option value="">Selecciona un grado</option>
              {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre} - {g.nivel}</option>)}
            </Selector>
            <Selector etiqueta="Sección" valor={form.seccionId} onChange={(v) => actualizar('seccionId', v)} disabled={!form.gradoId} requerido>
              <option value="">Selecciona una sección</option>
              {secciones.map((s) => (
                <option key={s.id} value={s.id} disabled={s.cupos_disponibles <= 0}>
                  Sección {s.nombre} — {s.cupos_disponibles > 0 ? `${s.cupos_disponibles} vacantes` : 'sin vacantes'}
                </option>
              ))}
            </Selector>
            <Campo etiqueta="Monto de pago (S/)" tipo="number" valor={form.montoPago} onChange={(v) => actualizar('montoPago', v)} />
            <Campo etiqueta="Observaciones" valor={form.observaciones} onChange={(v) => actualizar('observaciones', v)} />
          </div>
        </Card>

        {error && <p className="text-sm text-rojo-500">{error}</p>}

        <button type="submit" disabled={guardando}
          className="rounded-xl bg-rojo-400 hover:bg-rojo-500 text-white font-semibold px-6 py-3 shadow-glow disabled:opacity-60 transition-all">
          {guardando ? 'Registrando...' : 'Registrar matrícula'}
        </button>
      </form>
    </div>
  );
}

function SeccionTitulo({ icono: Icono, texto }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icono className="w-4 h-4 text-rojo-400" />
      <h2 className="font-display text-lg font-semibold text-marino-800">{texto}</h2>
    </div>
  );
}
function Campo({ etiqueta, valor, onChange, tipo = 'text', requerido, maxLength }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <input type={tipo} required={requerido} maxLength={maxLength} value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
    </div>
  );
}
function Selector({ etiqueta, valor, onChange, children, disabled, requerido }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <select value={valor} required={requerido} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-100 bg-marino-50/60 px-4 py-2.5 bg-white disabled:opacity-50 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow">
        {children}
      </select>
    </div>
  );
}
