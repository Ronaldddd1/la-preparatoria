import { useEffect, useRef, useState } from 'react';
import { UserPlus, KeyRound, ShieldCheck, Camera, GraduationCap } from 'lucide-react';
import api from '../../api/axios';
import { Card, PageHeader } from '../../components/ui';

const formVacio = { dni: '', nombres: '', apellidos: '', especialidad: '' };

export default function GestionDocentes() {
  const [docentes, setDocentes] = useState([]);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState('');
  const [credenciales, setCredenciales] = useState(null);

  useEffect(() => { cargar(); }, []);
  function cargar() { api.get('/docentes').then((res) => setDocentes(res.data)); }

  async function crear(e) {
    e.preventDefault(); setError('');
    try { await api.post('/docentes', form); setForm(formVacio); cargar(); }
    catch (err) { setError(err.response?.data?.mensaje || 'No se pudo registrar al docente.'); }
  }

  async function crearCuenta(docente) {
    setError(''); setCredenciales(null);
    try {
      const { data } = await api.post(`/docentes/${docente.id}/cuenta`);
      setCredenciales({ nombre: `${docente.nombres} ${docente.apellidos}`, ...data.credenciales });
      cargar();
    } catch (err) { setError(err.response?.data?.mensaje || 'No se pudo crear la cuenta de acceso.'); }
  }

  async function resetearPassword(docente) {
    if (!confirm(`¿Reiniciar la contraseña de ${docente.nombres} ${docente.apellidos} a su DNI?`)) return;
    setError('');
    try {
      const { data } = await api.put(`/docentes/${docente.id}/resetear-password`);
      setCredenciales({ nombre: `${docente.nombres} ${docente.apellidos}`, ...data.credenciales, username: docente.dni });
    } catch (err) { setError(err.response?.data?.mensaje || 'No se pudo reiniciar la contraseña.'); }
  }

  async function subirFoto(docenteId, archivo) {
    if (!archivo) return;
    setError('');
    try {
      const form2 = new FormData();
      form2.append('foto', archivo);
      await api.post(`/docentes/${docenteId}/foto`, form2);
      cargar();
    } catch (err) { setError(err.response?.data?.mensaje || 'No se pudo subir la foto.'); }
  }

  return (
    <div>
      <PageHeader titulo="Docentes" subtitulo="Registra profesores y administra sus cuentas de acceso." />

      {credenciales && (
        <Card className="mb-6 p-5 border-esmeralda-100 bg-esmeralda-50/60">
          <p className="font-semibold text-esmeralda-600 mb-1">Listo, {credenciales.nombre}</p>
          <p className="text-sm text-marino-700">
            {credenciales.username && <>Usuario: <span className="font-mono font-semibold">{credenciales.username}</span> · </>}
            Contraseña: <span className="font-mono font-semibold">{credenciales.password}</span>
          </p>
        </Card>
      )}

      <form onSubmit={crear} className="mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-rojo-400" />
            <h2 className="font-display text-lg font-semibold text-marino-800">Registrar docente</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Campo etiqueta="DNI" valor={form.dni} onChange={(v) => setForm({ ...form, dni: v })} maxLength={8} />
            <Campo etiqueta="Nombres" valor={form.nombres} onChange={(v) => setForm({ ...form, nombres: v })} requerido />
            <Campo etiqueta="Apellidos" valor={form.apellidos} onChange={(v) => setForm({ ...form, apellidos: v })} requerido />
            <Campo etiqueta="Especialidad" valor={form.especialidad} onChange={(v) => setForm({ ...form, especialidad: v })} />
          </div>
          {error && <p className="text-sm text-rojo-500 mt-3">{error}</p>}
          <button className="mt-4 rounded-xl bg-rojo-400 hover:bg-rojo-500 text-white font-semibold px-5 py-2.5 shadow-glow transition-all">Registrar</button>
        </Card>
      </form>

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-marino-800 text-white text-left">
              <th className="px-4 py-3 font-medium">Docente</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Especialidad</th>
              <th className="px-4 py-3 font-medium">Cuenta</th>
              <th className="px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-marino-50">
            {docentes.map((d) => (
              <tr key={d.id} className="hover:bg-papel/60 transition-colors">
                <td className="px-4 py-3 text-marino-800 font-medium">
                  <div className="flex items-center gap-2.5">
                    <FotoDocente docente={d} onSubir={subirFoto} />
                    {d.apellidos}, {d.nombres}
                  </div>
                </td>
                <td className="px-4 py-3 text-marino-500">{d.dni || '—'}</td>
                <td className="px-4 py-3 text-marino-500">{d.especialidad || '—'}</td>
                <td className="px-4 py-3 text-marino-500">{d.username ? `@${d.username}` : 'Sin cuenta'}</td>
                <td className="px-4 py-3">
                  {!d.usuario_id ? (
                    <button onClick={() => crearCuenta(d)} disabled={!d.dni}
                      className="flex items-center gap-1 text-xs font-medium text-marino-700 hover:text-rojo-500 disabled:opacity-40 transition-colors"
                      title={!d.dni ? 'Registra su DNI primero' : ''}>
                      <ShieldCheck className="w-3.5 h-3.5" /> Crear cuenta
                    </button>
                  ) : (
                    <button onClick={() => resetearPassword(d)} className="flex items-center gap-1 text-xs font-medium text-marino-700 hover:text-rojo-500 transition-colors">
                      <KeyRound className="w-3.5 h-3.5" /> Reiniciar contraseña
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function FotoDocente({ docente, onSubir }) {
  const inputRef = useRef(null);
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      aria-label="Cambiar foto de perfil"
      className="relative w-8 h-8 rounded-lg bg-marino-50 flex items-center justify-center overflow-hidden shrink-0 group"
    >
      {docente.foto_url ? (
        <img src={docente.foto_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <GraduationCap className="w-3.5 h-3.5 text-marino-700" />
      )}
      <span className="absolute inset-0 bg-marino-900/0 group-hover:bg-marino-900/40 flex items-center justify-center transition-colors">
        <Camera className="w-3 h-3 text-white opacity-0 group-hover:opacity-100" />
      </span>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onSubir(docente.id, e.target.files[0])} className="hidden" />
    </button>
  );
}

function Campo({ etiqueta, valor, onChange, requerido, maxLength }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <input type="text" required={requerido} maxLength={maxLength} value={valor} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-marino-200 px-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow" />
    </div>
  );
}
