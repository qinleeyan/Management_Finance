/**
 * LedgerAI - Google Apps Script API
 * Full CRUD for: Transaksi_Kas, Piutang_Klien, Budget_Dept
 * Deploy as Web App: Execute as Me, Anyone can access
 */

function doGet(e) {
  try {
    var params = e.parameter;
    var action = params.action || "read";
    var sheet = params.sheet;

    if (!sheet) {
      return jsonResponse({ status: "error", message: "Parameter 'sheet' diperlukan" });
    }

    switch(action) {
      case "read":
        return handleRead(sheet);
      default:
        return jsonResponse({ status: "error", message: "Action tidak dikenal: " + action });
    }
  } catch(err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var sheetName = body.sheet;

    if (!sheetName) {
      return jsonResponse({ status: "error", message: "Parameter 'sheet' diperlukan" });
    }

    switch(action) {
      case "create":
        return handleCreate(sheetName, body.data);
      case "update":
        return handleUpdate(sheetName, body.rowIndex, body.data);
      case "delete":
        return handleDelete(sheetName, body.rowIndex);
      default:
        return jsonResponse({ status: "error", message: "Action tidak dikenal: " + action });
    }
  } catch(err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// ==================== READ ====================
function handleRead(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return jsonResponse({ status: "error", message: "Sheet '" + sheetName + "' tidak ditemukan" });
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse({ status: "success", data: [] });
  }

  var headers = data[0];
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Skip empty rows
    if (!row[0] && !row[1]) continue;
    
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j].toString().trim();
      var val = row[j];
      
      // Format dates to ISO string
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      obj[key] = val;
    }
    obj["_rowIndex"] = i + 1; // For update/delete operations (1-indexed in Sheets)
    result.push(obj);
  }

  return jsonResponse({ status: "success", data: result, count: result.length });
}

// ==================== CREATE ====================
function handleCreate(sheetName, data) {
  if (!data) {
    return jsonResponse({ status: "error", message: "Data diperlukan untuk create" });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return jsonResponse({ status: "error", message: "Sheet tidak ditemukan" });
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = [];

  for (var i = 0; i < headers.length; i++) {
    var key = headers[i].toString().trim();
    newRow.push(data[key] !== undefined ? data[key] : "");
  }

  sheet.appendRow(newRow);
  SpreadsheetApp.flush();

  return jsonResponse({
    status: "success",
    message: "Data berhasil ditambahkan ke " + sheetName,
    rowIndex: sheet.getLastRow()
  });
}

// ==================== UPDATE ====================
function handleUpdate(sheetName, rowIndex, data) {
  if (!rowIndex || !data) {
    return jsonResponse({ status: "error", message: "rowIndex dan data diperlukan" });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return jsonResponse({ status: "error", message: "Sheet tidak ditemukan" });
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var updatedRow = [];

  for (var i = 0; i < headers.length; i++) {
    var key = headers[i].toString().trim();
    updatedRow.push(data[key] !== undefined ? data[key] : "");
  }

  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([updatedRow]);
  SpreadsheetApp.flush();

  return jsonResponse({
    status: "success",
    message: "Baris " + rowIndex + " berhasil diperbarui"
  });
}

// ==================== DELETE ====================
function handleDelete(sheetName, rowIndex) {
  if (!rowIndex) {
    return jsonResponse({ status: "error", message: "rowIndex diperlukan" });
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return jsonResponse({ status: "error", message: "Sheet tidak ditemukan" });
  }

  sheet.deleteRow(rowIndex);
  SpreadsheetApp.flush();

  return jsonResponse({
    status: "success",
    message: "Baris " + rowIndex + " berhasil dihapus dari " + sheetName
  });
}

// ==================== HELPER ====================
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
