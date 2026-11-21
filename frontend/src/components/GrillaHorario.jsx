const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const PALETA = [
  { bg: 'bg-rojo-50', border: 'border-rojo-200', text: 'text-rojo-500', dot: 'bg-rojo-400' },
  { bg: 'bg-marino-50', border: 'border-marino-200', text: 'text-marino-700', dot: 'bg-marino-500' },
  { bg: 'bg-esmeralda-50', border: 'border-esmeralda-100', text: 'text-esmeralda-600', dot: 'bg-esmeralda-400' },
  { bg: 'bg-ambar-50', border: 'border-ambar-100', text: 'text-ambar-500', dot: 'bg-ambar-400' },
];

function colorPorCurso(id) {
  return PALETA[id % PALETA.length];
}

function formatoHora(horaSql) {
  if (!horaSql) return '';
  const [h, m] = horaSql.split(':');
  const hora12 = ((parseInt(h, 10) + 11) % 12) + 1;
  const sufijo = parseInt(h, 10) < 12 ? 'a.m.' : 'p.m.';
  return `${hora12}:${m} ${sufijo}`;
}

function construirFranjas(clases) {
  const horasUnicas = new Set(clases.map((c) => c.hora_inicio));
  if (horasUnicas.size === 0) {
    return ['07:00:00', '08:00:00', '09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00'];
  }
  return Array.from(horasUnicas).sort();
}

export default function GrillaHorario({ clases = [], onClickClase, accionable = false }) {
  const franjas = construirFranjas(clases);
  const hoy = DIAS[new Date().getDay() - 1]; // undefined en fin de semana

  function buscarClase(dia, hora) {
    return clases.find((c) => c.dia_semana === dia && c.hora_inicio === hora);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-marino-100/60 bg-white shadow-[0_1px_2px_rgba(4,21,52,0.04),0_4px_16px_-8px_rgba(4,21,52,0.08)]">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white text-marino-400 px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold w-28 rounded-tl-2xl">Hora</th>
            {DIAS.map((dia, i) => (
              <th key={dia} className={`px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold min-w-[150px] ${i === DIAS.length - 1 ? 'rounded-tr-2xl' : ''} ${dia === hoy ? 'bg-marino-700 text-white' : 'bg-white text-marino-400'}`}>
                {dia}{dia === hoy && <span className="ml-2 rounded-full bg-rojo-400 text-white px-1.5 py-0.5 text-[9px] normal-case tracking-normal">Hoy</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {franjas.map((franja, i) => (
            <tr key={franja} className={'bg-white'}>
              <td className="sticky left-0 px-4 py-3 text-marino-400 font-medium border-t border-marino-50 bg-inherit text-xs">
                {formatoHora(franja)}
              </td>
              {DIAS.map((dia) => {
                const clase = buscarClase(dia, franja);
                const color = clase ? colorPorCurso(clase.curso_id) : null;
                return (
                  <td key={dia} className={`px-2 py-2 border-t border-marino-50 align-top ${dia === hoy ? 'bg-marino-50/40' : ''}`}>
                    {clase ? (
                      <button
                        type="button"
                        disabled={!accionable}
                        onClick={() => onClickClase?.(clase)}
                        className={`w-full text-left rounded-xl border ${color.border} ${color.bg} px-3 py-2 transition-all
                                    ${accionable ? 'hover:shadow-soft hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                          <p className={`font-semibold ${color.text} leading-snug text-[13px]`}>{clase.curso_nombre}</p>
                        </div>
                        <p className="text-[11px] text-marino-400 mt-1">
                          {formatoHora(clase.hora_inicio)} - {formatoHora(clase.hora_fin)}
                        </p>
                        {(clase.docente_apellidos || clase.aula) && (
                          <p className="text-[11px] text-marino-400 mt-0.5">
                            {clase.docente_apellidos ? `Prof. ${clase.docente_apellidos}` : ''}
                            {clase.docente_apellidos && clase.aula ? ' · ' : ''}
                            {clase.aula ? `Aula ${clase.aula}` : ''}
                          </p>
                        )}
                      </button>
                    ) : (
                      <div className="h-full min-h-[56px]" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
