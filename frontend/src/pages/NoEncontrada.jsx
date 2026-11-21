import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

const INICIO = { admin: '/admin', docente: '/docente', alumno: '/alumno' };

export default function NoEncontrada() {
  const { usuario } = useAuth();
  const destino = usuario ? INICIO[usuario.rol] : '/login';
  return (
    <div className="min-h-screen bg-papel flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <Logo className="w-14 h-14 mx-auto mb-6" />
        <div className="w-14 h-14 rounded-2xl bg-marino-50 flex items-center justify-center mx-auto mb-4">
          <Compass className="w-7 h-7 text-marino-500" aria-hidden="true" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-rojo-400 mb-2">Error 404</p>
        <h1 className="font-display text-3xl font-semibold text-marino-900 mb-2">Esta página no existe</h1>
        <p className="text-sm text-marino-500 mb-6">El enlace puede estar mal escrito o la página ya no está disponible.</p>
        <Link to={destino} className="inline-flex rounded-xl bg-marino-700 hover:bg-marino-800 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
          {usuario ? 'Volver al inicio' : 'Ir a iniciar sesión'}
        </Link>
      </div>
    </div>
  );
}
