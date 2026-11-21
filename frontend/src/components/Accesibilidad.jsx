import { useEffect, useState } from 'react';
import { Accessibility, Plus, Minus, RotateCcw, Contrast, Moon, X } from 'lucide-react';

const ESCALA_MIN = 100;
const ESCALA_MAX = 150;
const ESCALA_PASO = 10;

function leerEscala() {
  const guardado = Number(localStorage.getItem('lp_accesibilidad_escala'));
  return guardado >= ESCALA_MIN && guardado <= ESCALA_MAX ? guardado : 100;
}
function leerContraste() {
  return localStorage.getItem('lp_accesibilidad_contraste') === '1';
}
function leerModoOscuro() {
  return localStorage.getItem('lp_modo_oscuro') === '1';
}

export default function Accesibilidad() {
  const [abierto, setAbierto] = useState(false);
  const [escala, setEscala] = useState(leerEscala);
  const [contraste, setContraste] = useState(leerContraste);
  const [oscuro, setOscuro] = useState(leerModoOscuro);

  useEffect(() => {
    document.documentElement.style.fontSize = `${escala}%`;
    localStorage.setItem('lp_accesibilidad_escala', String(escala));
  }, [escala]);

  useEffect(() => {
    document.documentElement.classList.toggle('alto-contraste', contraste);
    localStorage.setItem('lp_accesibilidad_contraste', contraste ? '1' : '0');
  }, [contraste]);

  useEffect(() => {
    document.documentElement.classList.toggle('modo-oscuro', oscuro);
    localStorage.setItem('lp_modo_oscuro', oscuro ? '1' : '0');
  }, [oscuro]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label="Opciones de accesibilidad"
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-marino-800 hover:bg-marino-700 text-white shadow-glow flex items-center justify-center transition-colors"
      >
        <Accessibility className="w-6 h-6" aria-hidden="true" />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Opciones de accesibilidad"
          className="fixed bottom-20 right-5 z-50 w-72 rounded-2xl border border-marino-100 bg-white shadow-soft p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-sm font-semibold text-marino-800">Accesibilidad</p>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar opciones de accesibilidad"
              className="text-marino-400 hover:text-marino-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-xs font-medium text-marino-500 mb-2">Tamaño de texto ({escala}%)</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEscala((e) => Math.max(ESCALA_MIN, e - ESCALA_PASO))}
                disabled={escala <= ESCALA_MIN}
                aria-label="Disminuir tamaño de texto"
                className="flex-1 flex items-center justify-center rounded-lg border border-marino-200 py-2 text-marino-700 hover:bg-marino-50 disabled:opacity-40 transition-colors"
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setEscala(100)}
                aria-label="Restablecer tamaño de texto"
                className="flex-1 flex items-center justify-center rounded-lg border border-marino-200 py-2 text-marino-700 hover:bg-marino-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setEscala((e) => Math.min(ESCALA_MAX, e + ESCALA_PASO))}
                disabled={escala >= ESCALA_MAX}
                aria-label="Aumentar tamaño de texto"
                className="flex-1 flex items-center justify-center rounded-lg border border-marino-200 py-2 text-marino-700 hover:bg-marino-50 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setContraste((c) => !c)}
            aria-pressed={contraste}
            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              contraste
                ? 'bg-marino-800 text-white border-marino-800'
                : 'border-marino-200 text-marino-700 hover:bg-marino-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Contrast className="w-4 h-4" aria-hidden="true" /> Alto contraste
            </span>
            <span>{contraste ? 'Activado' : 'Desactivado'}</span>
          </button>

          <button
            type="button"
            onClick={() => setOscuro((v) => !v)}
            aria-pressed={oscuro}
            className={`w-full mt-2 flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              oscuro
                ? 'bg-marino-800 text-white border-marino-800'
                : 'border-marino-200 text-marino-700 hover:bg-marino-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-4 h-4" aria-hidden="true" /> Modo oscuro
            </span>
            <span>{oscuro ? 'Activado' : 'Desactivado'}</span>
          </button>
        </div>
      )}
    </>
  );
}
