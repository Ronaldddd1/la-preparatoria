import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RutaProtegida({ rolRequerido, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (rolRequerido && usuario.rol !== rolRequerido) {
    const destino = { admin: '/admin', docente: '/docente', alumno: '/alumno' }[usuario.rol];
    return <Navigate to={destino} replace />;
  }
  return children;
}
