function celda(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor);
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

function aCsv(filas, columnas) {
  const encabezado = columnas.map((c) => celda(c.titulo)).join(',');
  const cuerpo = filas.map((fila) => columnas.map((c) => celda(c.valor(fila))).join(',')).join('\n');
  return '\uFEFF' + encabezado + '\n' + cuerpo + '\n';
}

module.exports = { aCsv };
