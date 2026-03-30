/**
 * CONFIGURACIÓN GLOBAL
 * El ID corresponde a la hoja "Base de datos" que compartiste.
 */
const SPREADSHEET_ID = '1HWd3oUPHwgGzcCMFgi5OWma9c5OJNWAcE9gxHPOOjBU';
const SHEET_NAME = 'Reservas';

// Estructura de columnas para la base de datos
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

/**
 * Función principal para servir la interfaz web.
 * Se ejecuta al abrir la URL de la aplicación.
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Inka Adventure Agency | Panel de Reservas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Registra una nueva reserva en la hoja de Google Sheets.
 * @param {Object} data - Datos enviados desde el formulario HTML.
 */
function registrarReserva(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Si la hoja no existe, la crea con encabezados y formato
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

    // Generar un ID de reserva aleatorio (Ej: CJ-123456)
    const reservationId = 'CJ-' + Math.floor(100000 + Math.random() * 900000);

    // Preparar la fila con los datos recibidos
    const nuevaFila = [
      new Date(), // Fecha y hora del registro
      reservationId,
      data.tour,
      data.fecha,
      data.nombre,
      data.email,
      data.telefono,
      data.salud || 'Ninguna'
    ];

    // Insertar los datos
    sheet.appendRow(nuevaFila);
    
    // Autoajustar el ancho de las columnas
    sheet.autoResizeColumns(1, COLUMNS.length);

    // (Opcional) Enviar correo al administrador/guía
    // Para activarlo, cambia el correo en la función notificarGuia y quita las "//" abajo:
    // notificarGuia(data, reservationId);

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

/**
 * Obtiene la lista de pasajeros desde la hoja para el panel del guía.
 * @param {string} tourFilter - Nombre del tour para filtrar.
 * @param {string} dateFilter - Fecha para filtrar (formato YYYY-MM-DD).
 */
function obtenerPasajeros(tourFilter, dateFilter) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    // Si la hoja está vacía o no tiene datos
    if (!sheet || sheet.getLastRow() <= 1) {
      return [];
    }

    // Obtener todos los valores ignorando la fila de encabezados
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, COLUMNS.length).getValues();
    const passengers = [];

    values.forEach(row => {
      // Normalizar la fecha de la celda para poder compararla con el filtro
      let fechaCelda = row[3]; 
      if (fechaCelda instanceof Date) {
        fechaCelda = Utilities.formatDate(fechaCelda, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }

      const passenger = {
        timestamp: row[0],
        id:        row[1],
        tour:      row[2],
        fecha:     fechaCelda,
        nombre:    row[4],
        email:     row[5],
        telefono:  row[6],
        salud:     row[7]
      };

      // Lógica de filtros
      let matchTour = (!tourFilter || tourFilter === 'Todos los Tours' || passenger.tour === tourFilter);
      let matchDate = (!dateFilter || dateFilter === '' || passenger.fecha === dateFilter);

      if (matchTour && matchDate && passenger.nombre) {
        passengers.push(passenger);
      }
    });

    return passengers;

  } catch (err) {
    console.error('Error en obtenerPasajeros:', err.toString());
    throw new Error('No se pudo acceder a la lista de pasajeros.');
  }
}

/**
 * Envía una notificación por correo electrónico.
 */
function notificarGuia(data, reservationId) {
  const EMAIL_DESTINO = 'tu-correo@ejemplo.com'; // <--- CAMBIA ESTO POR TU EMAIL
  const asunto = `Nueva Reserva: ${reservationId} [${data.tour}]`;
  
  const cuerpo = `
    Se ha registrado una nueva aventura:
    -----------------------------------
    ID Reserva: ${reservationId}
    Tour: ${data.tour}
    Fecha de Viaje: ${data.fecha}
    
    DATOS DEL PASAJERO:
    Nombre: ${data.nombre}
    Email: ${data.email}
    Teléfono: ${data.telefono}
    Condiciones de Salud: ${data.salud}
    -----------------------------------
    Registro automático de Inka Adventure Agency.
  `;

  try {
    MailApp.sendEmail(EMAIL_DESTINO, asunto, cuerpo);
  } catch (e) {
    console.warn('No se pudo enviar el correo: ' + e.message);
  }
}