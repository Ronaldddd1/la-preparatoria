import { useMemo, useState } from 'react';
import { Card, Chip } from './ui';
import CalendarioMes, { Leyenda } from './CalendarioMes';

const F = (v) => String(v).slice(0, 10);
export const ETIQUETA_TIPO = {
  feriado: 'Feriado / no laborable',
  examen: 'Examen',
  inicio_bimestre: 'Inicio de bimestre',
  fin_bimestre: 'Fin de bimestre',
  otro: 'Otro',
};
const TONO_TIPO = { feriado: 'feriado', examen: 'examen', inicio_bimestre: 'hito', fin_bimestre: 'hito', otro: 'otro' };
const CHIP_TIPO = { feriado: 'rojo', examen: 'ambar', inicio_bimestre: 'verde', fin_bimestre: 'verde', otro: 'azul' };

function enRango(e, iso) {
  const ini = F(e.fecha_inicio);
  const fin = e.fecha_fin ? F(e.fecha_fin) : ini;
  return ini <= iso && iso <= fin;
}
const fmt = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });

// Calendario mensual de fácil lectura: cada día muestra su evento principal con
// el color de su tipo, y a la derecha se lista lo que pasa en el mes.
export default function CalendarioAcademico({ eventos }) {
  const ahora = new Date();
  const [mes, setMes] = useState({ anio: ahora.getFullYear(), mes0: ahora.getMonth() });

  const delMes = useMemo(() => {
    const ini = `${mes.anio}-${String(mes.mes0 + 1).padStart(2, '0')}-01`;
    const fin = `${mes.anio}-${String(mes.mes0 + 1).padStart(2, '0')}-${new Date(mes.anio, mes.mes0 + 1, 0).getDate()}`;
    return eventos.filter((e) => F(e.fecha_inicio) <= fin && (e.fecha_fin ? F(e.fecha_fin) : F(e.fecha_inicio)) >= ini);
  }, [eventos, mes]);

  function celda(iso, d, finDeSemana) {
    const del = eventos.filter((e) => enRango(e, iso));
    if (del.length === 0) return { tono: finDeSemana ? 'libre' : 'neutro' };
    // Prioridad: feriado > examen > resto.
    const orden = ['feriado', 'examen', 'inicio_bimestre', 'fin_bimestre', 'otro'];
    del.sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo));
    return {
      tono: TONO_TIPO[del[0].tipo],
      titulo: del[0].titulo,
      sub: del.length > 1 ? `+${del.length - 1} más` : undefined,
    };
  }

  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-5">
      <Card className="p-5">
        <CalendarioMes mes={mes} setMes={setMes} celda={celda} />
        <Leyenda items={[['feriado', 'Feriado'], ['examen', 'Examen'], ['hito', 'Inicio / fin de bimestre'], ['otro', 'Otro evento']]} />
      </Card>

      <Card className="p-5 h-fit">
        <h2 className="font-display text-lg font-semibold text-marino-900 mb-3">Eventos del mes</h2>
        {delMes.length === 0 ? (
          <p className="text-sm text-marino-400">No hay eventos este mes.</p>
        ) : (
          <ul className="space-y-2.5">
            {delMes.map((e) => (
              <li key={e.id} className="rounded-xl bg-marino-50/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-marino-900 leading-snug">{e.titulo}</p>
                  <Chip color={CHIP_TIPO[e.tipo]}>{ETIQUETA_TIPO[e.tipo].split(' / ')[0]}</Chip>
                </div>
                <p className="text-xs text-marino-500 mt-1 capitalize">
                  {fmt(F(e.fecha_inicio))}{e.fecha_fin && F(e.fecha_fin) !== F(e.fecha_inicio) ? ` — ${fmt(F(e.fecha_fin))}` : ''}
                </p>
                {e.descripcion && <p className="text-xs text-marino-400 mt-0.5">{e.descripcion}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
