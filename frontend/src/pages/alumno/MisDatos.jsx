import { useEffect, useRef, useState } from 'react';
import { Download, IdCard, Phone, Mail, MapPin, QrCode, Camera } from 'lucide-react';
import api from '../../api/axios';
import { descargarArchivo } from '../../utils/descargas';
import { Card, Badge, PageHeader } from '../../components/ui';

export default function MisDatos() {
  const [perfil, setPerfil] = useState(null);
  const [matricula, setMatricula] = useState(null);
  const [form, setForm] = useState({ direccion: '', telefono: '', email: '' });
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [qr, setQr] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const inputFotoRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/alumnos/mi-perfil'), api.get('/matriculas/mia')]).then(([p, m]) => {
      setPerfil(p.data);
      setMatricula(m.data);
      setForm({ direccion: p.data.direccion || '', telefono: p.data.telefono || '', email: p.data.email || '' });
    });
    api.get('/alumnos/mi-perfil/qr').then((res) => setQr(res.data));
  }, []);

  async function guardarContacto(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');
    try {
      await api.put('/alumnos/mi-perfil', form);
      setMensaje('Tus datos de contacto se actualizaron.');
    } catch {
      setMensaje('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function subirFoto(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setSubiendoFoto(true); setMensaje('');
    try {
      const form2 = new FormData();
      form2.append('foto', archivo);
      const { data } = await api.post('/alumnos/mi-perfil/foto', form2);
      setPerfil((p) => ({ ...p, foto_url: data.fotoUrl }));
    } catch (err) {
      setMensaje(err.response?.data?.mensaje || 'No se pudo subir la foto.');
    } finally {
      setSubiendoFoto(false);
      if (inputFotoRef.current) inputFotoRef.current.value = '';
    }
  }

  async function descargarConstancia() {
    setDescargando(true);
    try {
      await descargarArchivo(`/reportes/constancia/${perfil.id}`, `constancia-${perfil.dni}.pdf`, true);
    } catch {
      setMensaje('No se pudo generar la constancia (¿tienes matrícula activa?).');
    } finally {
      setDescargando(false);
    }
  }

  if (!perfil) return <p className="text-marino-400">Cargando...</p>;

  return (
    <div>
      <PageHeader titulo="Mis datos" subtitulo="Tu información de matrícula y contacto." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={subiendoFoto}
              aria-label="Cambiar foto de perfil"
              className="relative w-11 h-11 rounded-xl bg-marino-50 flex items-center justify-center overflow-hidden shrink-0 group"
            >
              {perfil.foto_url ? (
                <img src={perfil.foto_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <IdCard className="w-5 h-5 text-marino-700" />
              )}
              <span className="absolute inset-0 bg-marino-900/0 group-hover:bg-marino-900/40 flex items-center justify-center transition-colors">
                <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
              </span>
            </button>
            <input ref={inputFotoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={subirFoto} className="hidden" />
            <div>
              <p className="font-display text-lg font-semibold text-marino-800">{perfil.nombres} {perfil.apellidos}</p>
              <p className="text-xs text-marino-400">DNI {perfil.dni}</p>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <Dato etiqueta="Grado y sección" valor={matricula ? `${matricula.grado_nombre} "${matricula.seccion_nombre}"` : 'Sin matrícula activa'} />
            <Dato etiqueta="Año escolar" valor={matricula?.anio_escolar || '-'} />
            <div className="flex justify-between items-center border-b border-marino-50 pb-2">
              <dt className="text-marino-400">Estado de matrícula</dt>
              <dd>{matricula ? <Badge estado={matricula.estado}>{matricula.estado}</Badge> : '-'}</dd>
            </div>
          </dl>
          {matricula?.estado === 'activo' && (
            <button
              onClick={descargarConstancia}
              disabled={descargando}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl border border-marino-200 text-marino-700 font-medium px-4 py-2.5 hover:bg-papel transition-colors disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {descargando ? 'Generando...' : 'Descargar constancia de matrícula'}
            </button>
          )}
        </Card>

        {qr && (
          <Card className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-marino-500" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-marino-800">Mi código QR</h2>
            </div>
            <p className="text-xs text-marino-400 mb-4">Tu docente puede escanear este código para marcar tu asistencia.</p>
            <img src={qr.qr} alt="Tu código QR de asistencia" className="mx-auto rounded-lg border border-marino-100 w-48" />
            <a href={qr.qr} download={`qr-${qr.dni}.png`} className="inline-block mt-3 text-sm font-medium text-rojo-500 hover:underline">
              Descargar imagen
            </a>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-marino-800 mb-4">Datos de contacto</h2>
          <form onSubmit={guardarContacto} className="space-y-4">
            <CampoIcono icono={MapPin} etiqueta="Dirección" valor={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} />
            <CampoIcono icono={Phone} etiqueta="Teléfono" valor={form.telefono} onChange={(v) => setForm({ ...form, telefono: v })} />
            <CampoIcono icono={Mail} etiqueta="Correo electrónico" tipo="email" valor={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            {mensaje && <p className="text-sm text-esmeralda-600">{mensaje}</p>}
            <button type="submit" disabled={guardando} className="rounded-xl bg-marino-800 hover:bg-marino-700 text-white font-medium px-5 py-2.5 disabled:opacity-60 transition-colors">
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="flex justify-between border-b border-marino-50 pb-2">
      <dt className="text-marino-400">{etiqueta}</dt>
      <dd className="text-marino-800 font-medium">{valor}</dd>
    </div>
  );
}

function CampoIcono({ icono: Icono, etiqueta, valor, onChange, tipo = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-marino-700 mb-1.5">{etiqueta}</label>
      <div className="relative">
        <Icono className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-marino-300" />
        <input
          type={tipo} value={valor} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-marino-200 pl-10 pr-4 py-2.5 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow"
        />
      </div>
    </div>
  );
}
