/**
 * KARTU TURİZM - Google Sheets Integration
 * 
 * Setup Instructions:
 * 1. Paste this code in Google Apps Script (script.google.com)
 * 2. Save the project
 * 3. Deploy as Web App:
 *    - Execute as: Me (your_email@gmail.com)
 *    - Who has access: Anyone
 * 4. Copy the Web App URL
 * 5. Make sure your Google Sheet is accessible
 */

function doPost(e) {
  try {
    console.log('doPost function called');
    console.log('Request body:', e.postData.contents);
    
    // Check if request has data
    if (!e.postData || !e.postData.contents) {
      throw new Error('No data received');
    }
    
    // Parse JSON data
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed data:', data);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Check if sheet is accessible
    if (!sheet) {
      throw new Error('Unable to access spreadsheet');
    }
    
    // Prepare the row data
    const row = [
      new Date().toLocaleString('tr-TR'), // Tarih
      data.studentName || '',              // Öğrenci Adı
      data.studentGrade || '',             // Sınıf
      data.studentBranch || '',            // Şube
      data.schoolAddress || '',            // Okul
      data.mainAddress || '',              // Ana Adres
      data.buildingName || '',             // Apartman/Site
      data.apartmentNumber || '',          // Daire No
      data.addressNotes || '',             // Adres Notları
      data.fullAddress || '',              // Tam Adres
      data.coordinates ? `${data.coordinates.lat}, ${data.coordinates.lng}` : '', // Koordinatlar
      data.motherName || '',               // Anne Adı
      data.motherPhone || '',              // Anne Telefon
      data.motherEmail || '',              // Anne Email
      data.fatherName || '',               // Baba Adı
      data.fatherPhone || '',              // Baba Telefon
      data.fatherEmail || '',              // Baba Email
      data.additionalMessage || '',        // Ek Mesaj
      data.estimatedPrice || ''            // Tahmini Ücret
    ];
    
    console.log('Row data prepared:', row);
    
    // Add the row to the sheet
    sheet.appendRow(row);
    
    console.log('Row added successfully');
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Kayıt başarıyla eklendi',
        timestamp: new Date().toISOString(),
        rowData: row
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests for testing
function doGet(e) {
  try {
    console.log('doGet function called');
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Google Apps Script is working',
        timestamp: new Date().toISOString(),
        method: 'GET'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify sheet access
function testSheetAccess() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const sheetName = sheet.getName();
    const spreadsheetName = SpreadsheetApp.getActiveSpreadsheet().getName();
    
    console.log('Sheet access test successful');
    console.log('Spreadsheet name:', spreadsheetName);
    console.log('Sheet name:', sheetName);
    
    return {
      success: true,
      spreadsheetName: spreadsheetName,
      sheetName: sheetName
    };
    
  } catch (error) {
    console.error('Sheet access test failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

// Initialize sheet with headers (run this once manually)
function initializeSheet() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Check if headers already exist
    const firstRow = sheet.getRange(1, 1, 1, 19).getValues()[0];
    if (firstRow[0] && firstRow[0] !== '') {
      console.log('Headers already exist');
      return { success: true, message: 'Headers already exist' };
    }
    
    // Set headers
    const headers = [
      'Tarih',
      'Öğrenci Adı',
      'Sınıf',
      'Şube', 
      'Okul',
      'Ana Adres',
      'Apartman/Site',
      'Daire No',
      'Adres Notları',
      'Tam Adres',
      'Koordinatlar',
      'Anne Adı',
      'Anne Telefon',
      'Anne Email',
      'Baba Adı',
      'Baba Telefon',
      'Baba Email',
      'Ek Mesaj',
      'Tahmini Ücret'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('white');
    
    console.log('Sheet initialized with headers');
    
    return { success: true, message: 'Sheet initialized successfully' };
    
  } catch (error) {
    console.error('Sheet initialization failed:', error);
    return { success: false, error: error.toString() };
  }
} 