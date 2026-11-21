import { ChevronLeft, ChevronRight } from 'lucide-react';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Clases por "tono" de celda; las usan la asistencia y el calendario académico.
export const TONOS = {
  neutro: { caja: 'bg-marino-50/70', num: 'text-marino-800', txt: 'text-marino-500', punto: 'bg-marino-700' },
  ok: { caja: 'bg-marino-50/70', num: 'text-marino-800', txt: 'text-marino-500', punto: 'bg-marino-700' },
  tardanza: { caja: 'bg-ambar-50 ring-1 ring-ambar-100', num: 'text-marino-800', txt: 'text-ambar-500', punto: 'bg-ambar-400' },
  falta: { caja: 'bg-rojo-50 ring-1 ring-rojo-100', num: 'text-marino-800', txt: 'text-rojo-500', punto: 'bg-rojo-400' },
  justificado: { caja: 'bg-[#eaf0fd] ring-1 ring-marino-100', num: 'text-marino-800', txt: 'text-marino-600', punto: 'bg-marino-300' },
  feriado: { caja: 'bg-rojo-50/60', num: 'text-rojo-500', txt: 'text-rojo-500', punto: 'bg-rojo-400' },
  examen: { caja: 'bg-ambar-50 ring-1 ring-ambar-100', num: 'text-marino-800', txt: 'text-ambar-500', punto: 'bg-ambar-400' },
  hito: { caja: 'bg-esmeralda-50 ring-1 ring-esmeralda-100', num: 'text-marino-800', txt: 'text-esmeralda-600', punto: 'bg-esmeralda-500' },
  otro: { caja: 'bg-[#eaf0fd] ring-1 ring-marino-100', num: 'text-marino-800', txt: 'text-marino-600', punto: 'bg-marino-300' },
  futuro: { caja: 'bg-marino-50/30', num: 'text-marino-300', txt: 'text-marino-300', punto: '' },
  libre: { caja: 'bg-marino-50/40', num: 'text-marino-400', txt: 'text-marino-300', punto: '' },
};

export function aISO(anio, mes0, dia) {
  return `${anio}-${String(mes0 + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function hoyLocalISO() {
  const d = new Date();
  return aISO(d.getFullYear(), d.getMonth(), d.getDate());
}

// celda(iso, dia, esFinDeSemana) => { tono, titulo, sub, onClick } | null
export default function CalendarioMes({ mes, setMes, celda, soloLectiva = false, cabecera }) {
  const { anio, mes0 } = mes;
  const columnas = soloLectiva ? DIAS.slice(0, 5) : DIAS;
  const nCol = columnas.length;
  const diasMes = new Date(anio, mes0 + 1, 0).getDate();
  const offset = (new Date(anio, mes0, 1).getDay() + 6) % 7; // lunes = 0
  const hoy = hoyLocalISO();

  const celdas = [];
  for (let d = 1; d <= diasMes; d += 1) {
    const dow = (new Date(anio, mes0, d).getDay() + 6) % 7;
    if (soloLectiva && dow > 4) continue;
    celdas.push({ d, dow });
  }
  const huecos = soloLectiva ? Math.min(offset, 5) % nCol : offset;
  const primeraColumna = soloLectiva && offset > 4 ? 0 : huecos;

  function mover(delta) {
    const f = new Date(anio, mes0 + delta, 1);
    setMes({ anio: f.getFullYear(), mes0: f.getMonth() });
  }
  function irHoy() {
    const f = new Date();
    setMes({ anio: f.getFullYear(), mes0: f.getMonth() });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-marino-900 leading-tight">{MESES[mes0]} {anio}</h2>
          {cabecera && <p className="text-xs text-marino-400 mt-0.5">{cabecera}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => mover(-1)} aria-label="Mes anterior" className="w-9 h-9 rounded-xl bg-marino-50 hover:bg-marino-100 text-marino-600 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-[88px] text-center text-sm font-semibold text-marino-800 bg-marino-50 rounded-xl px-3 py-2">{MESES[mes0]}</span>
          <button onClick={() => mover(1)} aria-label="Mes siguiente" className="w-9 h-9 rounded-xl bg-marino-50 hover:bg-marino-100 text-marino-600 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={irHoy} className="text-xs font-semibold text-marino-600 bg-marino-50 hover:bg-marino-100 rounded-xl px-3 py-2.5 transition-colors">Hoy</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `repeat(${nCol}, minmax(0, 1fr))` }}>
            {columnas.map((c) => (
              <div key={c} className="rounded-lg bg-marino-50 text-center text-[10.5px] font-semibold uppercase tracking-wider text-marino-500 py-1.5">{c}</div>
            ))}
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${nCol}, minmax(0, 1fr))` }}>
            {Array.from({ length: primeraColumna }).map((_, i) => <div key={`h${i}`} />)}
            {celdas.map(({ d, dow }) => {
              const iso = aISO(anio, mes0, d);
              const info = celda(iso, d, dow > 4) || { tono: dow > 4 ? 'libre' : 'neutro' };
              const t = TONOS[info.tono] || TONOS.neutro;
              const esHoy = iso === hoy;
              const Etq = info.onClick ? 'button' : 'div';
              return (
                <Etq key={iso} type={info.onClick ? 'button' : undefined} onClick={info.onClick}
                  className={`text-left rounded-xl px-2.5 py-2 min-h-[72px] flex flex-col ${t.caja} ${esHoy ? 'outline outline-2 outline-marino-700' : ''} ${info.onClick ? 'cursor-pointer hover:shadow-soft transition-shadow' : ''}`}>
                  <span className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${t.num}`}>{String(d).padStart(2, '0')}</span>
                    {t.punto && <span className={`w-1.5 h-1.5 rounded-full ${t.punto}`} aria-hidden="true" />}
                  </span>
                  {info.titulo && <span className={`mt-1.5 text-[11px] font-semibold leading-tight ${t.txt}`}>{info.titulo}</span>}
                  {info.sub && <span className="text-[10.5px] leading-tight text-marino-400 mt-0.5">{info.sub}</span>}
                </Etq>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Leyenda({ items }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-marino-50/60 px-4 py-3 mt-4">
      {items.map(([tono, texto]) => (
        <span key={texto} className="flex items-center gap-1.5 text-xs text-marino-600">
          <span className={`w-2 h-2 rounded-full ${TONOS[tono].punto || 'bg-marino-200'}`} aria-hidden="true" />{texto}
        </span>
      ))}
    </div>
  );
}
