import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck, ArrowLeft, Eye, EyeOff, AlertCircle, X, BadgeCheck, LifeBuoy, IdCard, Users, BookOpen, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pideCodigo, setPideCodigo] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [rol, setRol] = useState('alumno');
  const [verClave, setVerClave] = useState(false);
  const [avisoAbierto, setAvisoAbierto] = useState(true);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  async function manejarEnvio(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const resultado = await iniciarSesion(username.trim(), password, pideCodigo ? codigo.trim() : undefined);
      if (resultado.requiereDosFactor) {
        setPideCodigo(true);
        return;
      }
      const destino = { admin: '/admin', docente: '/docente', alumno: '/alumno' }[resultado.rol];
      navigate(destino);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  function volver() {
    setPideCodigo(false);
    setCodigo('');
    setError('');
  }

  const ROLES = [
    { id: 'alumno', etiqueta: 'Estudiante / Familia', icono: Users, placeholder: 'Ej. 72345678 (tu DNI)' },
    { id: 'docente', etiqueta: 'Docente', icono: BookOpen, placeholder: 'Tu usuario asignado' },
    { id: 'admin', etiqueta: 'Directivo / Admin', icono: Shield, placeholder: 'Tu usuario asignado' },
  ];
  const rolActual = ROLES.find((r) => r.id === rol);

  const campo = `w-full rounded-xl border border-marino-200 bg-white pl-11 pr-4 py-3 text-[15px] text-marino-800
                 placeholder:text-marino-300 focus:border-rojo-400 focus:ring-2 focus:ring-rojo-100 outline-none transition-shadow`;

  return (
    <div className="min-h-screen bg-papel flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[1216px] grid lg:grid-cols-[5fr_7fr] rounded-[28px] overflow-hidden bg-white shadow-[0_24px_60px_-24px_rgba(4,21,52,0.35)]">
        {/* Panel izquierdo: identidad institucional */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-marino-800 px-12 py-12 text-papel min-h-[780px]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#4a2c55]/80 via-marino-800 to-marino-900" />
          <div className="absolute inset-0 bg-mesh-hero opacity-40" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          />

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="relative flex items-center gap-4">
            <Logo className="w-16 h-16 rounded-2xl" />
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-marino-200 uppercase">I.E.P. La Preparatoria</p>
              <p className="text-sm font-medium">Lima Norte • San Martín de Porres</p>
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="relative font-display text-[40px] font-semibold leading-[1.15] max-w-sm">
            Formando líderes con rigor científico, valores y fraternidad.
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="relative flex items-start justify-between gap-6 text-[11px] text-marino-200">
            <div className="flex items-start gap-2.5">
              <BadgeCheck className="w-5 h-5 shrink-0 text-marino-200" strokeWidth={1.8} />
              <div>
                <p className="font-semibold text-white">UGEL 02 • MINEDU</p>
                <p>Cod. Modular: 0884882</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 shrink-0 text-marino-200" strokeWidth={1.8} />
              <div>
                <p className="font-semibold text-white">Acceso por roles</p>
                <p>Conexión segura (HTTPS)</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Panel derecho: formulario */}
        <div className="flex flex-col">
          <div className="flex-1 px-6 sm:px-14 py-12 flex flex-col justify-center">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <Logo className="w-10 h-10" />
              <p className="font-display text-lg font-semibold text-marino-900">La Preparatoria</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              className="w-full max-w-[600px] mx-auto lg:mx-0">
              <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase text-rojo-500 mb-4">
                <span className="w-2 h-2 rounded-full bg-rojo-500" aria-hidden="true" /> Acceso centralizado
              </p>
              <h2 className="font-display text-[28px] font-semibold text-marino-900 leading-tight mb-2">
                Sistema Integral de Gestión Académica
              </h2>
              <p className="text-[15px] text-marino-500 mb-7">
                Accede con tus credenciales institucionales o con tu número de DNI registrado.
              </p>

              {!pideCodigo && (
                <div className="mb-5">
                  <p className="text-[13px] font-semibold text-marino-800 mb-2">Selecciona tu rol de usuario:</p>
                  <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-marino-50 p-1">
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        role="tab"
                        aria-selected={rol === r.id}
                        onClick={() => setRol(r.id)}
                        className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[13px] font-semibold transition-all ${
                          rol === r.id ? 'bg-white text-marino-900 shadow-soft' : 'text-marino-500 hover:text-marino-800'
                        }`}
                      >
                        <r.icono className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{r.etiqueta}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!pideCodigo && avisoAbierto && (
                <div className="mb-5 flex items-start gap-3 rounded-xl bg-rojo-100/70 px-4 py-3 text-rojo-500">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 text-[12.5px] leading-snug">
                    <p className="font-bold text-sm text-rojo-600 mb-0.5">Aviso de seguridad del portal</p>
                    Para el ciclo 2026, los estudiantes deben usar su número de DNI de 8 dígitos como usuario. Su contraseña
                    inicial es el mismo DNI y el sistema le pedirá cambiarla al entrar.
                  </div>
                  <button type="button" onClick={() => setAvisoAbierto(false)} aria-label="Cerrar aviso" className="text-rojo-500 hover:text-rojo-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={manejarEnvio} className="space-y-4">
                {!pideCodigo ? (
                  <>
                    <div>
                      <label htmlFor="username" className="block text-[13px] font-semibold text-marino-800 mb-1.5">
                        Usuario institucional o N.° de DNI <span className="text-rojo-500">*</span>
                      </label>
                      <div className="relative">
                        <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-marino-400" aria-hidden="true" />
                        <input id="username" type="text" required autoComplete="username" value={username}
                          onChange={(e) => setUsername(e.target.value)} placeholder={rolActual.placeholder} className={campo} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-[13px] font-semibold text-marino-800 mb-1.5">
                        Contraseña institucional <span className="text-rojo-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-marino-400" aria-hidden="true" />
                        <input id="password" type={verClave ? 'text' : 'password'} required autoComplete="current-password"
                          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${campo} pr-12`} />
                        <button type="button" onClick={() => setVerClave((v) => !v)}
                          aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-marino-400 hover:text-marino-700">
                          {verClave ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <button type="button" onClick={volver}
                      className="flex items-center gap-1 text-xs font-medium text-marino-400 hover:text-marino-700 mb-3 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" /> Volver
                    </button>
                    <label htmlFor="codigo" className="block text-[13px] font-semibold text-marino-800 mb-1.5">Código de verificación</label>
                    <p className="text-xs text-marino-400 mb-2">Ingresa el código de 6 dígitos de tu app de autenticación.</p>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-marino-400" aria-hidden="true" />
                      <input id="codigo" type="text" inputMode="numeric" autoFocus required value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456"
                        className={`${campo} tracking-[0.3em] placeholder:tracking-normal`} />
                    </div>
                  </div>
                )}

                {error && (
                  <div role="alert" className="rounded-xl bg-rojo-50 border border-rojo-200 px-4 py-2.5 text-sm text-rojo-500">{error}</div>
                )}

                <button type="submit" disabled={cargando || (pideCodigo && codigo.length !== 6)}
                  className="group w-full flex items-center justify-center gap-2 rounded-xl bg-rojo-400 hover:bg-rojo-500 disabled:opacity-60
                             text-white font-semibold py-3.5 transition-all shadow-glow">
                  {cargando ? 'Ingresando...' : pideCodigo ? 'Verificar y continuar' : 'Ingresar al Portal Institucional'}
                  {!cargando && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>
            </motion.div>
          </div>

          <div className="bg-marino-50/60 px-6 sm:px-14 py-5 flex items-center gap-4">
            <span className="w-10 h-10 rounded-full bg-marino-700 text-white flex items-center justify-center shrink-0">
              <LifeBuoy className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="text-[12.5px] text-marino-500 leading-snug">
              <p className="text-sm font-semibold text-marino-900">¿Inconvenientes para ingresar?</p>
              Comunícate con la secretaría del colegio para recuperar o restablecer tu acceso.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
