import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('lp_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  async function iniciarSesion(username, password, codigo) {
    const { data } = await api.post('/auth/login', { username, password, codigo });
    if (data.requiereDosFactor) return { requiereDosFactor: true };
    localStorage.setItem('lp_token', data.token);
    localStorage.setItem('lp_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data.usuario;
  }

  function cerrarSesion() {
    localStorage.removeItem('lp_token');
    localStorage.removeItem('lp_usuario');
    setUsuario(null);
  }

  function actualizarUsuario(parcial) {
    const nuevo = { ...usuario, ...parcial };
    localStorage.setItem('lp_usuario', JSON.stringify(nuevo));
    setUsuario(nuevo);
  }

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
