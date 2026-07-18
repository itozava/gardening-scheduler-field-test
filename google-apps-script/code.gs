function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Invoicing')
    .addItem('Create invoice + open PDF', 'createInvoiceAndOpenPdf')
    .addItem('Reprint selected invoice', 'reprintSelectedInvoicePdf')
    .addItem('Set up invoice sheet filter', 'setupInvoicesSheet')
    .addSeparator()
    .addItem('Check database headers', 'setupDatabaseHeaders')
    .addToUi();
}

const SHEETS = {
  CLIENTS: 'Clients',
  JOBS: 'Jobs',
  VISIT_HISTORY: 'VisitHistory',
  CLIENT_NOTES: 'ClientNotes',
  CLIENT_ALERTS: 'ClientAlerts',
  ONE_OFF_JOBS: 'OneOffJobs',
  RECURRING_JOBS: 'RecurringJobs',
  APP_SETTINGS: 'AppSettings'
};

const HEADERS = {
  Clients: ['Client ID', 'Nickname', 'Client Name (invoice)', 'Address', 'Phone', 'Email', 'Notes'],
  Jobs: ['TIMESTAMP', 'CLIENT ID', 'CLIENT NAME', 'DATE', 'TOTAL HOURS', 'MATERIAL COST', 'NOTES', 'Invoice #', 'Invoice Date'],
  VisitHistory: ['Visit ID', 'Client ID', 'Visit Date', 'Hours', 'Materials', 'Notes', 'Created At'],
  ClientNotes: ['Note ID', 'Client ID', 'Text', 'Photo URL', 'Status', 'Created At', 'Completed At'],
  ClientAlerts: ['Alert ID', 'Client ID', 'Text', 'Alert Date', 'Status', 'Created At', 'Completed At'],
  OneOffJobs: ['OneOff Job ID', 'Client ID', 'Date', 'Status', 'Created At'],
  RecurringJobs: ['Recurring Job ID', 'Client ID', 'Frequency', 'Schedule Day', 'Next Visit', 'Status', 'Created At'],
  AppSettings: ['Setting Key', 'Setting Value']
};

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'getDatabase').trim();
    if (action === 'getDatabase') return jsonOutput_(getDatabase_());
    if (action === 'getClients') return jsonOutput_(getDatabase_().clients);
    if (action === 'getClientHistory') return jsonOutput_(getClientHistory_(e.parameter && e.parameter.clientId));
    return jsonOutput_({ status: 'error', message: 'Unknown GET action: ' + action });
  } catch (error) {
    return jsonOutput_({ status: 'error', message: error.message });
  }
}

function doPost(e) {
  try {
    const data = parseIncomingPayload_(e);
    if (!data || typeof data !== 'object') throw new Error('Invalid or empty POST payload.');
    const action = String(data.action || '').trim();

    switch (action) {
      case 'saveClient': return jsonOutput_(saveClient_(data));
      case 'deleteClient': return jsonOutput_(deleteClient_(data));
      case 'saveRecurringJob': return jsonOutput_(saveRecurringJob_(data));
      case 'deleteRecurringJob': return jsonOutput_(deleteById_(SHEETS.RECURRING_JOBS, 1, data.recurringJobId));
      case 'saveOneOffJob': return jsonOutput_(saveOneOffJob_(data));
      case 'deleteOneOffJob': return jsonOutput_(deleteById_(SHEETS.ONE_OFF_JOBS, 1, data.oneOffJobId));
      case 'saveNote': return jsonOutput_(saveNote_(data));
      case 'updateNote': return jsonOutput_(saveNote_(data));
      case 'completeNote': return jsonOutput_(completeRecord_(SHEETS.CLIENT_NOTES, 1, data.noteId));
      case 'restoreNote': return jsonOutput_(restoreRecord_(SHEETS.CLIENT_NOTES, 1, data.noteId));
      case 'deleteNote': return jsonOutput_(deleteById_(SHEETS.CLIENT_NOTES, 1, data.noteId));
      case 'saveAlert': return jsonOutput_(saveAlert_(data));
      case 'updateAlert': return jsonOutput_(saveAlert_(data));
      case 'completeAlert': return jsonOutput_(completeRecord_(SHEETS.CLIENT_ALERTS, 1, data.alertId));
      case 'deleteAlert': return jsonOutput_(deleteById_(SHEETS.CLIENT_ALERTS, 1, data.alertId));
      case 'saveJob': return jsonOutput_(saveCompletedVisit_(data));
      case 'saveAppSettings': return jsonOutput_(saveAppSettings_(data));
      case 'uploadImage': return jsonOutput_(uploadImageAction_(data));
      default: return jsonOutput_({ status: 'error', message: 'Unknown POST action: ' + action });
    }
  } catch (error) {
    return jsonOutput_({ status: 'error', message: error.message });
  }
}

function setupDatabaseHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(HEADERS).forEach(sheetName => {
    let sh = ss.getSheetByName(sheetName);
    if (!sh) sh = ss.insertSheet(sheetName);
    sh.getRange(1, 1, 1, HEADERS[sheetName].length).setValues([HEADERS[sheetName]]);
    sh.getRange(1, 1, 1, HEADERS[sheetName].length).setFontWeight('bold');
  });
  SpreadsheetApp.getUi().alert('Database headers checked/created.');
}

function getDatabase_() {
  const activeStatus = row => String(row.status || 'active').trim().toLowerCase() === 'active';

  return {
    status: 'success',
    generatedAt: new Date().toISOString(),
    clients: readTable_(SHEETS.CLIENTS, ['clientId', 'nickname', 'invoiceName', 'address', 'phone', 'email', 'notes']),
    recurringJobs: readTable_(SHEETS.RECURRING_JOBS, ['recurringJobId', 'clientId', 'frequency', 'scheduleDay', 'nextVisit', 'status', 'createdAt']).filter(activeStatus),
    oneOffJobs: readTable_(SHEETS.ONE_OFF_JOBS, ['oneOffJobId', 'clientId', 'date', 'status', 'createdAt']).filter(activeStatus),
    clientNotes: readTable_(SHEETS.CLIENT_NOTES, ['noteId', 'clientId', 'text', 'photoUrl', 'status', 'createdAt', 'completedAt']).filter(activeStatus),
    clientAlerts: readTable_(SHEETS.CLIENT_ALERTS, ['alertId', 'clientId', 'text', 'alertDate', 'status', 'createdAt', 'completedAt']).filter(activeStatus),
    latestVisits: getLatestVisitsByClient_(),
    appSettings: readTable_(SHEETS.APP_SETTINGS, ['settingKey', 'settingValue'])
  };
}

function getClientHistory_(clientId) {
  clientId = String(clientId || '').trim();
  if (!clientId) throw new Error('Client ID is required.');

  const visits = readTable_(SHEETS.VISIT_HISTORY, ['visitId', 'clientId', 'visitDate', 'hours', 'materials', 'notes', 'createdAt'])
    .filter(row => String(row.clientId || '').trim() === clientId)
    .sort((a, b) => visitDateSortKey_(b.visitDate) - visitDateSortKey_(a.visitDate));

  const completedNotes = readTable_(SHEETS.CLIENT_NOTES, ['noteId', 'clientId', 'text', 'photoUrl', 'status', 'createdAt', 'completedAt'])
    .filter(row => String(row.clientId || '').trim() === clientId && String(row.status || '').trim().toLowerCase() === 'completed')
    .sort((a, b) => visitDateSortKey_(b.completedAt || b.createdAt) - visitDateSortKey_(a.completedAt || a.createdAt));

  return {
    status: 'success',
    clientId,
    visitHistory: visits,
    clientNotes: completedNotes
  };
}

function saveClient_(data) {
  const sh = getSheet_(SHEETS.CLIENTS);
  const clientId = String(data.clientId || makeId_('CL')).trim();
  const nickname = String(data.nickname || '').trim();
  const invoiceName = String(data.invoiceName || nickname).trim();
  if (!nickname) throw new Error('Nickname is required.');
  if (!invoiceName) throw new Error('Invoice name is required.');

  const rowValues = [
    clientId,
    nickname,
    invoiceName,
    String(data.address || '').trim(),
    String(data.phone || '').trim(),
    String(data.email || '').trim(),
    String(data.notes || '').trim()
  ];
  upsertRowById_(sh, 1, clientId, rowValues);
  return { status: 'success', type: 'client', clientId, message: 'Client saved.' };
}

function deleteClient_(data) {
  const clientId = String(data.clientId || '').trim();
  if (!clientId) throw new Error('Client ID is required.');
  deleteById_(SHEETS.CLIENTS, 1, clientId);
  markByClientId_(SHEETS.RECURRING_JOBS, clientId, 6, 'deleted');
  markByClientId_(SHEETS.ONE_OFF_JOBS, clientId, 4, 'deleted');
  markByClientId_(SHEETS.CLIENT_NOTES, clientId, 5, 'deleted');
  markByClientId_(SHEETS.CLIENT_ALERTS, clientId, 5, 'deleted');
  return { status: 'success', type: 'client', clientId, message: 'Client deleted.' };
}

function saveRecurringJob_(data) {
  const sh = getSheet_(SHEETS.RECURRING_JOBS);
  const recurringJobId = String(data.recurringJobId || makeId_('RJ')).trim();
  const clientId = required_(data.clientId, 'Client ID');
  const rowValues = [
    recurringJobId,
    clientId,
    String(data.frequency || '').trim(),
    String(data.scheduleDay || '').trim(),
    String(data.nextVisit || '').trim(),
    String(data.status || 'active').trim(),
    data.createdAt || new Date()
  ];
  upsertRowById_(sh, 1, recurringJobId, rowValues);
  return { status: 'success', type: 'recurringJob', recurringJobId };
}

function saveOneOffJob_(data) {
  const sh = getSheet_(SHEETS.ONE_OFF_JOBS);
  const oneOffJobId = String(data.oneOffJobId || makeId_('OOJ')).trim();
  const clientId = required_(data.clientId, 'Client ID');
  const rowValues = [oneOffJobId, clientId, String(data.date || '').trim(), String(data.status || 'active').trim(), data.createdAt || new Date()];
  upsertRowById_(sh, 1, oneOffJobId, rowValues);
  return { status: 'success', type: 'oneOffJob', oneOffJobId };
}

function saveNote_(data) {
  const sh = getSheet_(SHEETS.CLIENT_NOTES);
  const noteId = String(data.noteId || makeId_('NOTE')).trim();
  const clientId = required_(data.clientId, 'Client ID');
  let photoUrl = String(data.photoUrl || '').trim();

  if (data.photoData) {
    photoUrl = uploadImageDataUrl_(data.photoData, 'Client Photos', noteId);
  }

  const rowValues = [
    noteId,
    clientId,
    String(data.text || '').trim(),
    photoUrl,
    String(data.status || 'active').trim(),
    data.createdAt || new Date(),
    data.completedAt || ''
  ];
  upsertRowById_(sh, 1, noteId, rowValues);
  return { status: 'success', type: 'note', noteId, photoUrl };
}

function saveAlert_(data) {
  const sh = getSheet_(SHEETS.CLIENT_ALERTS);
  const alertId = String(data.alertId || makeId_('ALERT')).trim();
  const clientId = required_(data.clientId, 'Client ID');
  const rowValues = [
    alertId,
    clientId,
    String(data.text || '').trim(),
    String(data.alertDate || '').trim(),
    String(data.status || 'active').trim(),
    data.createdAt || new Date(),
    data.completedAt || ''
  ];
  upsertRowById_(sh, 1, alertId, rowValues);
  return { status: 'success', type: 'alert', alertId };
}

function saveCompletedVisit_(data) {
  const clientId = required_(data.clientId, 'Client ID');
  const clientName = required_(data.client, 'Client name');
  const date = required_(data.date, 'Date');
  const totalHours = Number(data.totalHours || 0);
  const totalMaterials = Number(data.totalMaterials || 0);
  const notesMaterials = String(data.notesMaterials || '').trim();
  const visitId = String(data.visitId || makeId_('VISIT')).trim();

  const shHistory = getSheet_(SHEETS.VISIT_HISTORY);
  const existingVisit = findVisitByClientAndDate_(shHistory, clientId, date);
  if (existingVisit) {
    return { status: 'duplicate', type: 'visit', visitId: existingVisit.visitId, message: 'Visit already exists for this client/date.' };
  }

  shHistory.appendRow([visitId, clientId, date, totalHours, totalMaterials, notesMaterials, new Date()]);

  const shJobs = getSheet_(SHEETS.JOBS);
  // Jobs layout: A Timestamp, B Client ID, C Client Name, D Date, E Hours, F Materials, G Notes, H Invoice #, I Invoice Date
  shJobs.appendRow([new Date(), clientId, clientName, date, totalHours, totalMaterials, notesMaterials, '', '']);

  return { status: 'success', type: 'job', visitId, message: 'Visit saved to VisitHistory and Jobs.' };
}

function completeRecord_(sheetName, idCol, id) {
  id = String(id || '').trim();
  if (!id) throw new Error('ID is required.');
  const sh = getSheet_(sheetName);
  const row = findRowByValue_(sh, idCol, id);
  if (!row) throw new Error('Record not found: ' + id);
  // Status col is E for Notes/Alerts, Completed At is G.
  sh.getRange(row, 5).setValue('completed');
  sh.getRange(row, 7).setValue(new Date());
  return { status: 'success', id, message: 'Record completed.' };
}

function restoreRecord_(sheetName, idCol, id) {
  id = String(id || '').trim();
  if (!id) throw new Error('ID is required.');
  const sh = getSheet_(sheetName);
  const row = findRowByValue_(sh, idCol, id);
  if (!row) throw new Error('Record not found: ' + id);
  sh.getRange(row, 5).setValue('active');
  sh.getRange(row, 7).setValue('');
  return { status: 'success', id, message: 'Record restored.' };
}


function saveAppSettings_(data) {
  const settings = data.settings || {};
  const sh = getSheet_(SHEETS.APP_SETTINGS);

  if (data.logoData) {
    const logoUrl = uploadImageDataUrl_(data.logoData, 'Logos', 'business-logo');
    settings.businessLogoUrl = logoUrl;
    settings.logoUrl = logoUrl;
  }

  if (settings.businessLogoUrl && !settings.logoUrl) {
    settings.logoUrl = settings.businessLogoUrl;
  }
  if (settings.logoUrl && !settings.businessLogoUrl) {
    settings.businessLogoUrl = settings.logoUrl;
  }

  Object.keys(settings).forEach(key => {
    const settingKey = String(key || '').trim();
    if (!settingKey) return;
    const settingValue = String(settings[key] == null ? '' : settings[key]).trim();
    upsertSetting_(sh, settingKey, settingValue);
  });

  return { status: 'success', type: 'appSettings', settings };
}

function uploadImageAction_(data) {
  const folderName = String(data.folderName || 'Client Photos').trim();
  const recordId = String(data.recordId || makeId_('IMG')).trim();
  const url = uploadImageDataUrl_(data.imageData, folderName, recordId);
  return { status: 'success', type: 'image', url };
}

function uploadImageDataUrl_(dataUrl, subFolderName, recordId) {
  const value = String(dataUrl || '');
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data.');

  const mimeType = match[1];
  const base64 = match[2];
  const extension = mimeType.indexOf('png') !== -1 ? 'png' : 'jpg';
  const bytes = Utilities.base64Decode(base64);
  const safeRecordId = String(recordId || makeId_('IMG')).replace(/[^a-zA-Z0-9_-]/g, '-');
  const fileName = safeRecordId + '-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '.' + extension;

  const folder = getOrCreateImageFolder_(subFolderName);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600';
}

function getOrCreateImageFolder_(subFolderName) {
  const rootName = 'Gardening Scheduler Photos';
  const root = getOrCreateFolderByName_(rootName, DriveApp.getRootFolder());
  return getOrCreateFolderByName_(subFolderName || 'Client Photos', root);
}

function getOrCreateFolderByName_(name, parent) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function upsertSetting_(sheet, settingKey, settingValue) {
  const row = findRowByValue_(sheet, 1, settingKey);
  if (row) sheet.getRange(row, 2).setValue(settingValue);
  else sheet.appendRow([settingKey, settingValue]);
}

function parseIncomingPayload_(e) {
  if (!e) throw new Error('No event object received.');
  if (e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  if (e.postData && e.postData.contents) {
    const contents = e.postData.contents;
    try { return JSON.parse(contents); } catch (jsonError) {
      const params = {};
      contents.split('&').forEach(part => {
        const pieces = part.split('=');
        const key = decodeURIComponent(pieces[0] || '');
        const value = decodeURIComponent((pieces[1] || '').replace(/\+/g, ' '));
        if (key) params[key] = value;
      });
      if (params.payload) return JSON.parse(params.payload);
      return params;
    }
  }
  throw new Error('No POST data received.');
}

function readTable_(sheetName, keys) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const values = sh.getRange(2, 1, lastRow - 1, keys.length).getValues();
  return values
    .filter(row => row.some(cell => String(cell || '').trim() !== ''))
    .map(row => {
      const obj = {};
      keys.forEach((key, i) => obj[key] = normaliseValue_(row[i]));
      return obj;
    });
}

function getLatestVisitsByClient_() {
  const latestByClient = {};
  const visits = readTable_(SHEETS.VISIT_HISTORY, ['visitId', 'clientId', 'visitDate', 'hours', 'materials', 'notes', 'createdAt']);

  visits.forEach(visit => {
    const clientId = String(visit.clientId || '').trim();
    if (!clientId) return;

    const currentLatest = latestByClient[clientId];
    if (!currentLatest || visitDateSortKey_(visit.visitDate) > visitDateSortKey_(currentLatest.visitDate)) {
      latestByClient[clientId] = {
        visitId: visit.visitId,
        clientId,
        visitDate: visit.visitDate
      };
    }
  });

  return Object.keys(latestByClient).map(clientId => latestByClient[clientId]);
}

function visitDateSortKey_(value) {
  if (value instanceof Date) return value.getTime();

  const text = String(value || '').trim();
  if (!text) return 0;

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])).getTime();
  }

  const displayMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (displayMatch) {
    return new Date(Number(displayMatch[3]), Number(displayMatch[2]) - 1, Number(displayMatch[1])).getTime();
  }

  const parsed = new Date(text).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function normaliseValue_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return value == null ? '' : value;
}

function getSheet_(sheetName) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) throw new Error(sheetName + ' sheet not found.');
  return sh;
}

function required_(value, label) {
  const s = String(value || '').trim();
  if (!s) throw new Error(label + ' is required.');
  return s;
}

function makeId_(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function findRowByValue_(sheet, columnNumber, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, columnNumber, lastRow - 1, 1).getValues().flat();
  const target = String(value || '').trim().toLowerCase();
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i] || '').trim().toLowerCase() === target) return i + 2;
  }
  return null;
}

function upsertRowById_(sheet, idColumn, id, rowValues) {
  const row = findRowByValue_(sheet, idColumn, id);
  if (row) sheet.getRange(row, 1, 1, rowValues.length).setValues([rowValues]);
  else sheet.appendRow(rowValues);
}

function deleteById_(sheetName, idCol, id) {
  id = String(id || '').trim();
  if (!id) throw new Error('ID is required.');
  const sh = getSheet_(sheetName);
  const row = findRowByValue_(sh, idCol, id);
  if (row) sh.deleteRow(row);
  return { status: 'success', id, message: 'Record deleted.' };
}

function markByClientId_(sheetName, clientId, statusCol, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return;
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;
  const values = sh.getRange(2, 2, lastRow - 1, 1).getValues().flat();
  values.forEach((v, i) => {
    if (String(v || '').trim() === clientId) sh.getRange(i + 2, statusCol).setValue(status);
  });
}

function findVisitByClientAndDate_(sheet, clientId, date) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][1] || '').trim() === clientId && String(values[i][2] || '').trim() === String(date || '').trim()) {
      return { row: i + 2, visitId: String(values[i][0] || '') };
    }
  }
  return null;
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/***********************
 * INVOICE SYSTEM
 ***********************/
function createInvoiceAndOpenPdf() {
  const ss = SpreadsheetApp.getActive();
  const shTo = ss.getSheetByName('To Invoice');
  const shJobs = ss.getSheetByName('Jobs');
  const shInv = ss.getSheetByName('Invoices');
  const shTemplate = ss.getSheetByName('Invoice Template');
  const shSettings = ss.getSheetByName('Settings');

  if (!shTo || !shJobs || !shInv || !shTemplate || !shSettings) {
    SpreadsheetApp.getUi().alert('Missing a required sheet. Make sure these exist:\n- To Invoice\n- Jobs\n- Invoices\n- Invoice Template\n- Settings');
    return;
  }

  const labourRate = Number(shSettings.getRange('B1').getValue()) || 0;
  const gstRate = Number(shSettings.getRange('B2').getValue()) || 0;
  const materialMarkupPct = Number(shSettings.getRange('B3').getValue()) || 0;
  const materialMultiplier = 1 + materialMarkupPct;
  const maxVisitsPerInvoice = 10;

  const client = String(shTo.getRange('B1').getValue() || '').trim();
  if (!client || client === 'Select client' || client === '— Select Client —') {
    SpreadsheetApp.getUi().alert('Please select a client before creating an invoice.');
    return;
  }

  const lastRow = shJobs.getLastRow();
  if (lastRow < 3) {
    SpreadsheetApp.getUi().alert('No jobs found in Jobs sheet.');
    return;
  }

  // Jobs layout: A Timestamp, B Client ID, C Client Name, D Date, E Hours, F Materials, G Notes, H Invoice #, I Invoice Date
  const data = shJobs.getRange(3, 1, lastRow - 2, 9).getValues();
  const candidateRows = [];
  data.forEach((r, i) => {
    const rowClient = String(r[2] || '').trim(); // C Client Name
    const invNo = String(r[7] || '').trim();     // H Invoice #
    if (rowClient === client && invNo === '') {
      candidateRows.push({ sheetRow: i + 3, hours: Number(r[4]) || 0, mats: Number(r[5]) || 0 });
    }
  });

  if (candidateRows.length === 0) {
    SpreadsheetApp.getUi().alert('No uninvoiced jobs found for this client.');
    return;
  }

  const rowsToInvoice = candidateRows.slice(0, maxVisitsPerInvoice);
  const invoiceNo = getNextInvoiceNumber_(shInv);
  const invoiceDate = new Date();

  let totalHours = 0;
  let totalMaterialsCharged = 0;
  rowsToInvoice.forEach(item => {
    totalHours += item.hours;
    totalMaterialsCharged += item.mats * materialMultiplier;
  });

  totalMaterialsCharged = round2_(totalMaterialsCharged);
  const subtotal = round2_(totalHours * labourRate + totalMaterialsCharged);
  const gstAmount = round2_(subtotal * gstRate);
  const totalDue = round2_(subtotal + gstAmount);

  rowsToInvoice.forEach(item => {
    shJobs.getRange(item.sheetRow, 8, 1, 2).setValues([[invoiceNo, invoiceDate]]); // H:I
  });

  insertInvoiceAtTop_(shInv, [invoiceNo, client, invoiceDate, totalHours, totalMaterialsCharged, subtotal, gstAmount, totalDue]);
  shTemplate.getRange('D5').setValue(invoiceNo);
  shTemplate.getRange('B2').clearContent();

  setNotesSectionVisibility_(shTemplate);
  SpreadsheetApp.flush();
  const pdfFile = exportSheetToPdf_(ss, shTemplate, invoiceNo);

  const remainingVisits = candidateRows.length - rowsToInvoice.length;
  const message = `Created ${invoiceNo} for ${client}\nVisits invoiced: ${rowsToInvoice.length}\nRemaining uninvoiced visits: ${remainingVisits}\nAmount Due: $${totalDue.toFixed(2)}`;

  const html = HtmlService.createHtmlOutput(`<script>window.open("${pdfFile.getUrl()}","_blank");google.script.host.close();</script>`);
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening Invoice PDF...');
  SpreadsheetApp.getUi().alert(message);
  shTo.getRange('B1').clearContent();
  shTemplate.showRows(16);
  shTemplate.showRows(17);
}

function insertInvoiceAtTop_(shInv, invoiceValues) {
  const hadExistingInvoices = shInv.getLastRow() >= 2;
  shInv.insertRowAfter(1);

  if (hadExistingInvoices) {
    shInv.getRange(3, 1, 1, invoiceValues.length).copyTo(
      shInv.getRange(2, 1, 1, invoiceValues.length),
      SpreadsheetApp.CopyPasteType.PASTE_FORMAT,
      false
    );
  }

  shInv.getRange(2, 1, 1, invoiceValues.length).setValues([invoiceValues]);
  ensureInvoicesSheetUsability_(shInv);
}

function setupInvoicesSheet() {
  const shInv = SpreadsheetApp.getActive().getSheetByName('Invoices');
  if (!shInv) {
    SpreadsheetApp.getUi().alert('Invoices sheet not found.');
    return;
  }

  ensureInvoicesSheetUsability_(shInv);
  SpreadsheetApp.getUi().alert('Invoices header frozen and filter checked.');
}

function ensureInvoicesSheetUsability_(shInv) {
  shInv.setFrozenRows(1);
  if (shInv.getFilter()) return;

  const tableRows = Math.max(shInv.getLastRow(), 2);
  const tableColumns = Math.max(shInv.getLastColumn(), 8);
  shInv.getRange(1, 1, tableRows, tableColumns).createFilter();
}

function setNotesSectionVisibility_(shTemplate) {
  const NOTES_TITLE_ROW = 16;
  const NOTES_BODY_ROW = 17;
  const titleValue = String(shTemplate.getRange(`A${NOTES_TITLE_ROW}`).getDisplayValue() || '').trim();
  if (titleValue !== '') {
    shTemplate.showRows(NOTES_TITLE_ROW);
    shTemplate.showRows(NOTES_BODY_ROW);
  } else {
    shTemplate.hideRows(NOTES_TITLE_ROW);
    shTemplate.hideRows(NOTES_BODY_ROW);
  }
}

function exportSheetToPdf_(ss, sheet, invoiceNo) {
  sheet.showSheet();
  const spreadsheetId = ss.getId();
  const gid = sheet.getSheetId();
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf&gid=${gid}&size=A4&portrait=true&scale=4&top_margin=0.50&bottom_margin=0.50&left_margin=0.50&right_margin=0.50&horizontal_alignment=CENTER&vertical_alignment=TOP&gridlines=false&printtitle=false&sheetnames=false&pagenumbers=false&fzr=false`;
  SpreadsheetApp.flush();
  Utilities.sleep(2500);
  const response = UrlFetchApp.fetch(exportUrl, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
  sheet.hideSheet();
  if (response.getResponseCode() !== 200) throw new Error('PDF export failed. Response code: ' + response.getResponseCode() + '\n\nResponse:\n' + response.getContentText().slice(0, 800));
  return DriveApp.createFile(response.getBlob().setName(`${invoiceNo}.pdf`));
}

function getNextInvoiceNumber_(shInv) {
  const lastRow = shInv.getLastRow();
  if (lastRow < 2) return 'INV-0001';
  const values = shInv.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  let maxNum = 0;
  values.forEach(v => {
    const m = String(v || '').match(/\d+/);
    if (m) maxNum = Math.max(maxNum, parseInt(m[0], 10));
  });
  return 'INV-' + String(maxNum + 1).padStart(4, '0');
}

function round2_(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function reprintSelectedInvoicePdf() {
  const ss = SpreadsheetApp.getActive();
  const shInv = ss.getSheetByName('Invoices');
  const shTemplate = ss.getSheetByName('Invoice Template');
  const activeSheet = ss.getActiveSheet();
  if (activeSheet.getName() !== 'Invoices') {
    SpreadsheetApp.getUi().alert('Go to the Invoices sheet and select an invoice row first.');
    return;
  }
  const row = activeSheet.getActiveCell().getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert('Select an invoice row, not the header.');
    return;
  }
  const invoiceNo = shInv.getRange(row, 1).getValue();
  if (!invoiceNo) {
    SpreadsheetApp.getUi().alert('No invoice number found in column A of the selected row.');
    return;
  }
  shTemplate.getRange('D5').setValue(invoiceNo);
  SpreadsheetApp.flush();
  const pdfFile = exportSheetToPdf_(ss, shTemplate, invoiceNo);
  const html = HtmlService.createHtmlOutput(`<script>window.open("${pdfFile.getUrl()}","_blank");google.script.host.close();</script>`);
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening Invoice PDF...');
}

/***********************
 * CLIENT DROPDOWN SYNC - legacy Google Form support
 ***********************/
const CLIENT_SYNC_CONFIG = {
  FORM_ID: '12d20ccSnNc7BNVYe260Im76tdrO0DhB2yhaax1E6ofw',
  CLIENTS_SHEET_NAME: 'Clients',
  CLIENT_NICKNAME_COLUMN: 2,
  CLIENT_QUESTION_TITLE: 'Client Name'
};

function updateClientDropdown() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(CLIENT_SYNC_CONFIG.CLIENTS_SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Clients sheet not found.');
    return;
  }
  const form = FormApp.openById(CLIENT_SYNC_CONFIG.FORM_ID);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No clients found in Clients sheet.');
    return;
  }
  const clients = sheet.getRange(2, CLIENT_SYNC_CONFIG.CLIENT_NICKNAME_COLUMN, lastRow - 1, 1).getValues().flat().map(v => String(v).trim()).filter(v => v !== '');
  const uniqueClients = [...new Set(clients)];
  if (uniqueClients.length === 0) {
    SpreadsheetApp.getUi().alert('No valid client nicknames found.');
    return;
  }
  findClientDropdownQuestion_(form).setChoiceValues(uniqueClients);
  SpreadsheetApp.getUi().alert(`Client dropdown updated.\n\n${uniqueClients.length} clients added to the form.`);
}

function autoUpdateClientDropdownOnEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== CLIENT_SYNC_CONFIG.CLIENTS_SHEET_NAME) return;
  if (e.range.getColumn() !== CLIENT_SYNC_CONFIG.CLIENT_NICKNAME_COLUMN) return;
  if (e.range.getRow() < 2) return;
  updateClientDropdown();
}

function setupClientDropdownAutoSync() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'autoUpdateClientDropdownOnEdit') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('autoUpdateClientDropdownOnEdit').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  SpreadsheetApp.getUi().alert('Auto-sync is now active.');
}

function findClientDropdownQuestion_(form) {
  const items = form.getItems();
  for (const item of items) {
    if (item.getTitle().trim() === CLIENT_SYNC_CONFIG.CLIENT_QUESTION_TITLE && item.getType() === FormApp.ItemType.LIST) return item.asListItem();
  }
  throw new Error(`Could not find a dropdown question titled "${CLIENT_SYNC_CONFIG.CLIENT_QUESTION_TITLE}".`);
}
