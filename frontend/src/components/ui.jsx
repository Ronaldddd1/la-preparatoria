export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`rounded-2xl border border-marino-100/60 bg-white shadow-[0_1px_2px_rgba(4,21,52,0.04),0_4px_16px_-8px_rgba(4,21,52,0.08)] ${
        hover ? 'transition-all duration-200 hover:shadow-soft hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

const COLORES_BADGE = {
  activo: 'bg-esmeralda-100 text-esmeralda-600',
  presente: 'bg-esmeralda-100 text-esmeralda-600',
  retirado: 'bg-marino-100 text-marino-600',
  inactivo: 'bg-marino-100 text-marino-600',
  trasladado: 'bg-ambar-100 text-ambar-500',
  tardanza: 'bg-ambar-100 text-ambar-500',
  falta: 'bg-rojo-100 text-rojo-500',
  justificado: 'bg-marino-100 text-marino-500',
  default: 'bg-marino-100 text-marino-600',
};

export function Badge({ children, estado }) {
  const clase = COLORES_BADGE[estado] || COLORES_BADGE.default;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${clase}`}>
      {children}
    </span>
  );
}

// Etiqueta pequeña tipo "pastilla" (UGEL 02 • Sede..., Bimestre I en curso).
const COLORES_CHIP = {
  azul: 'bg-[#dfe6fb] text-marino-700',
  rojo: 'bg-rojo-100 text-rojo-500',
  verde: 'bg-esmeralda-100 text-esmeralda-600',
  ambar: 'bg-ambar-100 text-ambar-500',
  gris: 'bg-marino-50 text-marino-500',
};

export function Chip({ children, color = 'azul', punto = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${COLORES_CHIP[color]}`}>
      {punto && <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Barra({ valor, max = 100, color = 'marino', className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  const relleno = { marino: 'bg-marino-700', rojo: 'bg-rojo-400', verde: 'bg-esmeralda-500' }[color];
  return (
    <div className={`h-1.5 rounded-full bg-marino-100/70 overflow-hidden ${className}`} role="presentation">
      <div className={`h-full rounded-full ${relleno}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const COLORES_STAT = {
  navy: { bg: 'bg-marino-700', text: 'text-white', soft: 'bg-marino-700' },
  rojo: { bg: 'bg-rojo-400', text: 'text-rojo-500', soft: 'bg-rojo-50' },
  esmeralda: { bg: 'bg-esmeralda-500', text: 'text-esmeralda-500', soft: 'bg-esmeralda-50' },
  ambar: { bg: 'bg-ambar-400', text: 'text-ambar-500', soft: 'bg-ambar-50' },
  azul: { bg: 'bg-marino-300', text: 'text-marino-500', soft: 'bg-[#dfe6fb]' },
};

// Tarjeta de indicador: etiqueta en mayúsculas, ícono en cuadro a la derecha
// y cifra grande en tipografía serif (como en los prototipos de Figma).
export function StatCard({ icono: Icono, etiqueta, valor, color = 'navy', detalle, children }) {
  const c = COLORES_STAT[color];
  return (
    <Card className="p-5" hover>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-marino-400 leading-snug">{etiqueta}</p>
        <div className={`w-9 h-9 rounded-xl ${c.soft} flex items-center justify-center shrink-0`}>
          <Icono className={`w-[18px] h-[18px] ${color === 'navy' ? 'text-white' : c.text}`} strokeWidth={2.1} />
        </div>
      </div>
      <p className="font-display text-[32px] font-semibold text-marino-900 leading-none mt-2">{valor}</p>
      {detalle && <p className="text-xs text-marino-400 mt-1.5">{detalle}</p>}
      {children}
    </Card>
  );
}

export function EmptyState({ icono: Icono, titulo, descripcion }) {
  return (
    <Card className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icono && (
        <div className="w-14 h-14 rounded-2xl bg-marino-50 flex items-center justify-center mb-4">
          <Icono className="w-7 h-7 text-marino-300" strokeWidth={1.8} />
        </div>
      )}
      <p className="font-display text-lg font-semibold text-marino-700 mb-1">{titulo}</p>
      {descripcion && <p className="text-sm text-marino-400 max-w-sm">{descripcion}</p>}
    </Card>
  );
}

// `etiquetas` son las pastillas que van sobre el título (ej. migas de pan).
export function PageHeader({ titulo, subtitulo, accion, etiquetas }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {etiquetas && <div className="flex flex-wrap items-center gap-2 mb-2">{etiquetas}</div>}
        <h1 className="font-display text-3xl sm:text-[34px] font-semibold text-marino-900 leading-tight">{titulo}</h1>
        {subtitulo && <p className="text-marino-500 text-sm mt-1.5 max-w-2xl">{subtitulo}</p>}
      </div>
      {accion && <div className="flex flex-wrap items-center gap-2">{accion}</div>}
    </div>
  );
}
