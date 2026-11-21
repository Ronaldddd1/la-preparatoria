const ExcelJS = require('exceljs');

// Genera un workbook de una sola hoja con encabezados en negrita, color de
// marca y columnas con ancho automático, y lo envía como respuesta .xlsx.
async function enviarXlsx(res, { nombreArchivo, hoja, columnas, filas }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'La Preparatoria';
  workbook.created = new Date();

  const ws = workbook.addWorksheet(hoja, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = columnas.map((c) => ({ header: c.titulo, key: c.clave, width: c.ancho || 20 }));

  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (const fila of filas) {
    ws.addRow(fila);
  }

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { enviarXlsx };
