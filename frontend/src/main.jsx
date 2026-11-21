import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import LimiteDeError from './components/LimiteDeError.jsx';
import Accesibilidad from './components/Accesibilidad.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LimiteDeError>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Accesibilidad />
        </AuthProvider>
      </BrowserRouter>
    </LimiteDeError>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
