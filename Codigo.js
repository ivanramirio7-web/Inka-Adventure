/**
 * CONFIGURACIÓN GLOBAL
 */
const SPREADSHEET_ID = '1MthALuT9n2HiFm-UhxE9V420GvztS7MF9Ao2Z9is2h0';
const SHEET_NAME = 'Reservas';

const COLUMNS = [
  'Timestamp', 
  'ID Reserva', 
  'Tour', 
  'Fecha Viaje', 
  'Nombre', 
  'Email', 
  'Teléfono', 
  'Condiciones de Salud'
];

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Inka Adventure Agency | Panel de Reservas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function registrarReserva(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(COLUMNS);
      
      const headerRange = sheet.getRange(1, 1, 1, COLUMNS.length);
      headerRange.setFontWeight('bold')
                 .setBackground('#904816')
                 .setFontColor('#ffffff')
                 .setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    const reservationId = 'CJ-' + Math.floor(100000 + Math.random() * 900000);

    const nuevaFila = [
      new Date(), 
      reservationId,
      data.tour,
      data.fecha,
      data.nombre,
      data.email,
      data.telefono,
      data.salud || 'Ninguna'
    ];

    sheet.appendRow(nuevaFila);
    sheet.autoResizeColumns(1, COLUMNS.length);

    return {
      success: true,
      reservationId: reservationId,
      message: '¡Reserva guardada con éxito!'
    };

  } catch (err) {
    console.error('Error en registrarReserva:', err.toString());
    return {
      success: false,
      message: 'Error en el servidor: ' + err.toString()
    };
  }
}

function obtenerPasajeros() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) return [];

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];

    // Forzamos la lectura de exactamente 8 columnas (de la A a la H) para evitar desajustes por celdas vacías
    const values = sheet.getRange(2, 1, lastRow - 1, 8).getValues();
    const passengers = [];

    values.forEach(row => {
      // Manejo seguro de la fecha
      let fechaCelda = row[3] !== undefined ? row[3] : ''; 
      if (fechaCelda instanceof Date) {
        fechaCelda = Utilities.formatDate(fechaCelda, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
        fechaCelda = String(fechaCelda).trim();
      }

      const passenger = {
        id:        String(row[1] || '').trim(),
        tour:      String(row[2] || '').trim(),
        fecha:     fechaCelda,
        nombre:    String(row[4] || '').trim(),
        salud:     String(row[7] || 'Ninguna').trim()
      };

      // Si hay un ID de reserva válido, agregamos al pasajero a la lista
      if (passenger.id !== '') {
        passengers.push(passenger);
      }
    });

    return passengers;

  } catch (err) {
    console.error('Error en obtenerPasajeros:', err.toString());
    throw new Error('No se pudo acceder a la lista: ' + err.message);
  }
}
