// Feriados nacionales del Perú, calculados automáticamente para cualquier año.
// Incluye los fijos (Ley 29762 y posteriores) y Jueves/Viernes Santo, que
// dependen de la fecha de Pascua. No incluye "días feriados puente" ni
// feriados extraordinarios que el Gobierno declare por decreto: esos los
// puede agregar el administrador manualmente en el calendario.

function pascua(anio) {
  // Algoritmo de Meeus/Jones/Butcher (calendario gregoriano).
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function iso(fecha) { return fecha.toISOString().slice(0, 10); }
function fija(anio, mes, dia) { return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`; }
function sumarDias(fecha, n) { const d = new Date(fecha); d.setUTCDate(d.getUTCDate() + n); return d; }

function feriadosPeru(anio) {
  const p = pascua(anio);
  const lista = [
    [fija(anio, 1, 1), 'Año Nuevo'],
    [iso(sumarDias(p, -3)), 'Jueves Santo'],
    [iso(sumarDias(p, -2)), 'Viernes Santo'],
    [fija(anio, 5, 1), 'Día del Trabajo'],
    [fija(anio, 6, 7), 'Batalla de Arica y Día de la Bandera'],
    [fija(anio, 6, 29), 'San Pedro y San Pablo'],
    [fija(anio, 7, 23), 'Día de la Fuerza Aérea del Perú'],
    [fija(anio, 7, 28), 'Fiestas Patrias'],
    [fija(anio, 7, 29), 'Fiestas Patrias'],
    [fija(anio, 8, 6), 'Batalla de Junín'],
    [fija(anio, 8, 30), 'Santa Rosa de Lima'],
    [fija(anio, 10, 8), 'Combate de Angamos'],
    [fija(anio, 11, 1), 'Día de Todos los Santos'],
    [fija(anio, 12, 8), 'Inmaculada Concepción'],
    [fija(anio, 12, 9), 'Batalla de Ayacucho'],
    [fija(anio, 12, 25), 'Navidad'],
  ];
  return lista.map(([fecha, titulo]) => ({
    id: `feriado-${fecha}`,
    titulo,
    tipo: 'feriado',
    fecha_inicio: fecha,
    fecha_fin: null,
    descripcion: 'Feriado nacional',
    anio_escolar: anio,
    automatico: true,
  }));
}

module.exports = { feriadosPeru };
