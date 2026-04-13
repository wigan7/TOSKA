
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
  .setTitle('TOSKA Tes Online Sekolah Kaliwungu')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function doPost(e) {
  // CORS Handling is native to Web Apps when called via POST from another origin, 
  // but we must format the output properly as JSON.
  
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'No data received' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const args = payload.args || [];
    
    let result = null;

    switch (action) {
      case 'loginAdmin':
        result = loginAdmin(args[0]);
        break;
      case 'simpanSoal':
        result = simpanSoal(args[0], args[1]);
        break;
      case 'ambilSoal':
        result = ambilSoal(args[0]);
        break;
      case 'simpanNilai':
        result = simpanNilai(args[0]);
        break;
      case 'analisisHasil':
        result = analisisHasil(args[0], args[1]);
        break;
      case 'ambilSoalByKodeUjian':
        result = ambilSoalByKodeUjian(args[0], args[1]);
        break;
      case 'analisisHasilByKodeUjian':
        result = analisisHasilByKodeUjian(args[0], args[1]);
        break;
      default:
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Unknown action: ' + action }))
          .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


/* --- FUNGSI KEAMANAN --- */
function loginAdmin(inputPassword) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('admin_config');
  // Ambil password dari sel B1
  let savedPassword = 'admin'; // Default fallback
  try {
     savedPassword = sheet.getRange('B1').getValue().toString();
  } catch(e) {
     console.log("Config sheet not found or empty");
  }
  
  if (inputPassword === savedPassword) {
    return { status: 'sukses' };
  } else {
    return { status: 'gagal', message: 'Password Salah!' };
  }
}

function normalizeScoringConfig_(scoring) {
  const defaults = {
    pg: { maxPoints: 1, correctPoints: 1, wrongPoints: 0, blankPoints: 0, minPoints: 0 },
    pgk: {
      mode: 'manual',
      maxPoints: 3,
      basePoints: 0,
      pointsPerCorrectSelection: 1,
      pointsPerWrongSelection: -1,
      simpleAllCorrectPoints: 3,
      simplePartialPoints: 2,
      simpleAllWrongPoints: 0,
      simpleBlankPoints: 0,
      minPoints: 0
    },
    bs: {
      mode: 'manual',
      maxPoints: 3,
      basePoints: 0,
      pointsPerCorrectStatement: 1,
      pointsPerWrongStatement: 0,
      simpleAllCorrectPoints: 3,
      simplePartialPoints: 2,
      simpleAllWrongPoints: 0,
      simpleBlankPoints: 0,
      minPoints: 0
    }
  };

  const cfg = scoring || {};
  const num = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const normalized = {
    pg: {
      maxPoints: num(cfg.pg && cfg.pg.maxPoints, defaults.pg.maxPoints),
      correctPoints: num(cfg.pg && cfg.pg.correctPoints, defaults.pg.correctPoints),
      wrongPoints: num(cfg.pg && cfg.pg.wrongPoints, defaults.pg.wrongPoints),
      blankPoints: num(cfg.pg && cfg.pg.blankPoints, defaults.pg.blankPoints),
      minPoints: num(cfg.pg && cfg.pg.minPoints, defaults.pg.minPoints)
    },
    pgk: {
      mode: (cfg.pgk && cfg.pgk.mode === 'simple') ? 'simple' : 'manual',
      maxPoints: num(cfg.pgk && cfg.pgk.maxPoints, defaults.pgk.maxPoints),
      basePoints: num(cfg.pgk && cfg.pgk.basePoints, defaults.pgk.basePoints),
      pointsPerCorrectSelection: num(cfg.pgk && cfg.pgk.pointsPerCorrectSelection, defaults.pgk.pointsPerCorrectSelection),
      pointsPerWrongSelection: num(cfg.pgk && cfg.pgk.pointsPerWrongSelection, defaults.pgk.pointsPerWrongSelection),
      simpleAllCorrectPoints: num(cfg.pgk && cfg.pgk.simpleAllCorrectPoints, defaults.pgk.simpleAllCorrectPoints),
      simplePartialPoints: num(cfg.pgk && cfg.pgk.simplePartialPoints, defaults.pgk.simplePartialPoints),
      simpleAllWrongPoints: num(cfg.pgk && cfg.pgk.simpleAllWrongPoints, defaults.pgk.simpleAllWrongPoints),
      simpleBlankPoints: num(cfg.pgk && cfg.pgk.simpleBlankPoints, defaults.pgk.simpleBlankPoints),
      minPoints: num(cfg.pgk && cfg.pgk.minPoints, defaults.pgk.minPoints)
    },
    bs: {
      mode: (cfg.bs && cfg.bs.mode === 'simple') ? 'simple' : 'manual',
      maxPoints: num(cfg.bs && cfg.bs.maxPoints, defaults.bs.maxPoints),
      basePoints: num(cfg.bs && cfg.bs.basePoints, defaults.bs.basePoints),
      pointsPerCorrectStatement: num(cfg.bs && cfg.bs.pointsPerCorrectStatement, defaults.bs.pointsPerCorrectStatement),
      pointsPerWrongStatement: num(cfg.bs && cfg.bs.pointsPerWrongStatement, defaults.bs.pointsPerWrongStatement),
      simpleAllCorrectPoints: num(cfg.bs && cfg.bs.simpleAllCorrectPoints, defaults.bs.simpleAllCorrectPoints),
      simplePartialPoints: num(cfg.bs && cfg.bs.simplePartialPoints, defaults.bs.simplePartialPoints),
      simpleAllWrongPoints: num(cfg.bs && cfg.bs.simpleAllWrongPoints, defaults.bs.simpleAllWrongPoints),
      simpleBlankPoints: num(cfg.bs && cfg.bs.simpleBlankPoints, defaults.bs.simpleBlankPoints),
      minPoints: num(cfg.bs && cfg.bs.minPoints, defaults.bs.minPoints)
    }
  };

  if (normalized.pg.maxPoints < normalized.pg.minPoints) normalized.pg.maxPoints = normalized.pg.minPoints;
  if (normalized.pgk.maxPoints < normalized.pgk.minPoints) normalized.pgk.maxPoints = normalized.pgk.minPoints;
  if (normalized.bs.maxPoints < normalized.bs.minPoints) normalized.bs.maxPoints = normalized.bs.minPoints;

  return normalized;
}

function parseSoalPackage_(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (Array.isArray(parsed)) {
    return { konten: parsed, scoring: normalizeScoringConfig_(null) };
  }
  return {
    konten: parsed.konten || [],
    scoring: normalizeScoringConfig_(parsed.scoring)
  };
}

function getJsonStartColIndex_(row) {
  // Layout baru: E=kode_ujian, JSON mulai F (index 5)
  // Layout lama: JSON mulai E (index 4)
  const colE = String(row[4] || '').trim();
  const colF = String(row[5] || '').trim();

  // Jika E terlihat seperti awal JSON dan F kosong/tidak valid, kemungkinan baris lama.
  if ((colE.startsWith('{') || colE.startsWith('[')) && !colF.startsWith('{') && !colF.startsWith('[')) {
    return 4;
  }

  return 5;
}

function clampScore_(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeIndex_(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function dedupeNumberArray_(arr) {
  const seen = {};
  return (arr || []).filter(function(n) {
    const key = String(n);
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function hasMeaningfulText_(value) {
  return String(value || '').trim() !== '';
}

function isValidPgkOption_(option) {
  return !!(option && (hasMeaningfulText_(option.text) || hasMeaningfulText_(option.img)));
}

function isKeyedBsStatement_(statement) {
  if (!statement) return false;
  const key = String(statement.kunci || '').trim().toUpperCase();
  return key === 'B' || key === 'S';
}

function scoreQuestion_(q, ans, scoringCfg) {
  const cfg = normalizeScoringConfig_(scoringCfg);

  if (q.tipe === 'pg') {
    const keyIdx = normalizeIndex_(q.kunci);
    if (keyIdx === null) {
      return { score: 0, maxPoints: 0, isPerfect: false };
    }

    const maxPoints = Math.max(cfg.pg.maxPoints, cfg.pg.minPoints);
    const minPoints = cfg.pg.minPoints;
    let score = cfg.pg.blankPoints;
    const ansIdx = normalizeIndex_(ans);
    const isPerfect = ansIdx !== null && ansIdx === keyIdx;
    if (ansIdx !== null) {
      score = (ansIdx === keyIdx) ? cfg.pg.correctPoints : cfg.pg.wrongPoints;
    }
    return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints, isPerfect: isPerfect };
  }

  if (q.tipe === 'pgk') {
    const minPoints = cfg.pgk.minPoints;
    const validOptions = (q.opsi || []).map(function(op, idx) {
      return { idx: idx, op: op };
    }).filter(function(entry) {
      return isValidPgkOption_(entry.op);
    });

    const validOptionIndexSet = {};
    validOptions.forEach(function(entry) {
      validOptionIndexSet[entry.idx] = true;
    });

    const validCorrectCount = validOptions.filter(function(entry) {
      return !!entry.op.isTrue;
    }).length;

    const selections = Array.isArray(ans)
      ? dedupeNumberArray_(ans.map(normalizeIndex_).filter(function(i) { return i !== null && validOptionIndexSet[i]; }))
      : [];

    const maxPoints = Math.max(cfg.pgk.maxPoints, minPoints);

    if (validCorrectCount === 0) {
      return { score: 0, maxPoints: 0, isPerfect: false };
    }

    let correctSelected = 0;
    let wrongSelected = 0;
    selections.forEach(function(optIdx) {
      if ((q.opsi || [])[optIdx] && (q.opsi || [])[optIdx].isTrue) correctSelected++;
      else wrongSelected++;
    });
    const isAllCorrect = validCorrectCount > 0 && correctSelected === validCorrectCount && wrongSelected === 0 && selections.length === validCorrectCount;

    if (cfg.pgk.mode === 'simple') {
      let score = cfg.pgk.simpleBlankPoints;
      if (selections.length === 0) {
        score = cfg.pgk.simpleBlankPoints;
      } else {
        const isAllWrong = correctSelected === 0;
        if (isAllCorrect) score = cfg.pgk.simpleAllCorrectPoints;
        else if (isAllWrong) score = cfg.pgk.simpleAllWrongPoints;
        else score = cfg.pgk.simplePartialPoints;
      }

      return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints, isPerfect: isAllCorrect };
    }

    let score = cfg.pgk.basePoints;
    selections.forEach(optIdx => {
      if ((q.opsi || [])[optIdx] && (q.opsi || [])[optIdx].isTrue) score += cfg.pgk.pointsPerCorrectSelection;
      else score += cfg.pgk.pointsPerWrongSelection;
    });
    return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints, isPerfect: isAllCorrect };
  }

  if (q.tipe === 'bs') {
    const minPoints = cfg.bs.minPoints;
    const statements = (q.pernyataan || []).map(function(s, idx) {
      return { idx: idx, statement: s };
    }).filter(function(entry) {
      return isKeyedBsStatement_(entry.statement);
    });
    const keyedCount = statements.length;

    if (keyedCount === 0) {
      return { score: 0, maxPoints: 0, isPerfect: false };
    }

    const maxPoints = Math.max(cfg.bs.maxPoints, minPoints);
    const answers = (ans && typeof ans === 'object') ? ans : {};
    let correctCount = 0;
    statements.forEach((entry) => {
      if (answers[entry.idx] === entry.statement.kunci) correctCount++;
    });
    const isAllCorrect = keyedCount > 0 && correctCount === keyedCount;

    if (cfg.bs.mode === 'simple') {
      const answeredCount = statements.reduce(function(total, entry) {
        const v = answers[entry.idx];
        return total + ((v === 'B' || v === 'S') ? 1 : 0);
      }, 0);

      let score = cfg.bs.simpleBlankPoints;
      if (answeredCount === 0) {
        score = cfg.bs.simpleBlankPoints;
      } else {
        const isAllWrong = correctCount === 0;
        if (isAllCorrect) score = cfg.bs.simpleAllCorrectPoints;
        else if (isAllWrong) score = cfg.bs.simpleAllWrongPoints;
        else score = cfg.bs.simplePartialPoints;
      }

      return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints, isPerfect: isAllCorrect };
    }

    let score = cfg.bs.basePoints;
    statements.forEach((entry) => {
      if (ans && ans[entry.idx] === entry.statement.kunci) score += cfg.bs.pointsPerCorrectStatement;
      else score += cfg.bs.pointsPerWrongStatement;
    });
    return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints, isPerfect: isAllCorrect };
  }

  return { score: 0, maxPoints: 0, isPerfect: false };
}

/* --- FUNGSI DATABASE --- */
function simpanSoal(data, isEdit) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('bank_soal');
  const rows = sheet.getDataRange().getValues();
  const kodeSoalInput = String(data.kode_soal).trim().toUpperCase();

  // Memecah JSON menjadi array chunk maksimal 45.000 karakter per sel
  const jsonString = JSON.stringify({
    konten: data.konten,
    scoring: normalizeScoringConfig_(data.scoring)
  });
  const maxChunkLength = 45000;
  const maxChunks = 11; // Kolom F sampai P (setelah kode_ujian di kolom E)
  const chunks = [];
  
  for (let i = 0; i < jsonString.length; i += maxChunkLength) {
    chunks.push(jsonString.substring(i, i + maxChunkLength));
  }
  
  if (chunks.length > maxChunks) {
    return { status: 'error', message: `Ukuran soal terlalu besar (Maksimal ${maxChunks * maxChunkLength} karakter). Kurangi jumlah gambar.` };
  }

  if (isEdit) {
    // MODE EDIT: Cari kode soal yang cocok dan update
    let rowIndexToUpdate = -1;
    
    // Loop cari baris (mulai dari baris 2, index 1)
    for (let i = 1; i < rows.length; i++) {
      const kodeDiSheet = String(rows[i][1]).trim().toUpperCase();
      if (kodeDiSheet === kodeSoalInput) {
        rowIndexToUpdate = i + 1; // Konversi index array ke nomor baris sheet
        break;
      }
    }

    if (rowIndexToUpdate !== -1) {
      sheet.getRange(rowIndexToUpdate, 3).setValue(data.judul);          // Col C
      sheet.getRange(rowIndexToUpdate, 4).setValue(data.durasi);         // Col D
      sheet.getRange(rowIndexToUpdate, 5).setValue(data.kode_ujian || ''); // Col E (kode ujian)
      
      // Bersihkan sisa chunk lama (Kolom F sampai P)
      sheet.getRange(rowIndexToUpdate, 6, 1, maxChunks).clearContent();
      
      // Tulis chunk baru secara menyamping
      sheet.getRange(rowIndexToUpdate, 6, 1, chunks.length).setValues([chunks]);

      // Clear cache to prevent the user from getting old data
      try {
        const cache = CacheService.getScriptCache();
        cache.remove(kodeSoalInput + '_meta');
        for (let c = 0; c < maxChunks; c++) {
          cache.remove(kodeSoalInput + '_chunk_' + c);
        }
      } catch(e) {}

      return { status: 'sukses', message: 'Soal berhasil diperbarui.' };
    } else {
      return { status: 'error', message: 'Kode soal tidak ditemukan untuk diedit.' };
    }

  } else {
    // MODE BARU: Cek duplikasi dulu
    for (let i = 1; i < rows.length; i++) {
       const kodeDiSheet = String(rows[i][1]).trim().toUpperCase();
      if (kodeDiSheet === kodeSoalInput) {
        return { status: 'error', message: 'Kode Soal sudah dipakai! Gunakan kode lain.' };
      }
    }

    // APPEND ROW BARU
    const rowData = [
      new Date(),
      kodeSoalInput,          // Col B: kode soal
      data.judul,             // Col C: judul
      data.durasi,            // Col D: durasi
      data.kode_ujian || ''  // Col E: kode ujian (opsional)
    ];
    // Masukkan semua chunk berurutan ke dalam row
    chunks.forEach(chunk => rowData.push(chunk));
    
    sheet.appendRow(rowData);
    
    return { status: 'sukses', message: 'Soal baru berhasil disimpan.' };
  }
}

function ambilSoal(kodeSoal) {
  const cache = CacheService.getScriptCache();
  const kodeSoalDicari = String(kodeSoal).trim().toUpperCase();
  
  // 1. Cek Metadata Cache
  const metaCache = cache.get(kodeSoalDicari + '_meta');
  if (metaCache) {
    try {
      const meta = JSON.parse(metaCache);
      let fullJsonString = '';
      let isCacheValid = true;
      
      // Kumpulkan semua chunk sesuai jumlah di metadata
      for (let i = 0; i < meta.chunks; i++) {
        const chunkData = cache.get(kodeSoalDicari + '_chunk_' + i);
        if (chunkData) {
          fullJsonString += chunkData;
        } else {
           // Jika ada chunk yang hilang, batalkan pakai cache
           isCacheValid = false;
           break;
        }
      }
      
      if (isCacheValid) {
         return JSON.parse(fullJsonString);
      }
    } catch(e) {
      console.log('Error reading split cache', e);
    }
  }

  // Jika tidak ada di cache (atau cache tidak lengkap), ambil dari Spreadsheet
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('bank_soal');
  const rows = sheet.getDataRange().getValues();
  
  // Mencari dari bawah ke atas agar mendapat versi terbaru
  for (let i = rows.length - 1; i >= 1; i--) { 
    const kodeDiSheet = String(rows[i][1]).trim().toUpperCase();
    if (kodeDiSheet == kodeSoalDicari) {
      try {
        // Gabungkan chunk JSON (kompatibel layout lama & baru)
        const startCol = getJsonStartColIndex_(rows[i]);
        const endCol = startCol + 10; // total 11 kolom chunk
        let jsonString = '';
        for (let col = startCol; col <= endCol; col++) {
          const chunk = rows[i][col];
          if (chunk !== undefined && chunk !== null && chunk !== '') {
             jsonString += String(chunk);
          } else {
             break; // Hentikan loop jika menemukan kolom kosong
          }
        }
        
        const paket = parseSoalPackage_(jsonString);
        const result = { 
          status: 'sukses', 
          judul: rows[i][2],
          durasi: rows[i][3],
          kode_ujian: String(rows[i][4] || '').trim().toUpperCase(),
          konten: paket.konten,
          scoring: paket.scoring
        };
        
        // 2. Simpan ke Cache dengan metode Chunking
        try {
          const resultString = JSON.stringify(result);
          const maxCacheChunkLength = 90000; // Aman di bawah 100KB (1 karakter = ~1 byte di UTF-8 basic)
          const totalChunks = Math.ceil(resultString.length / maxCacheChunkLength);
          
          // Simpan setiap potongan
          for (let c = 0; c < totalChunks; c++) {
             const start = c * maxCacheChunkLength;
             const chunkStr = resultString.substring(start, start + maxCacheChunkLength);
             cache.put(kodeSoalDicari + '_chunk_' + c, chunkStr, 900); // cache 15 menit
          }
          
          // Simpan metadata
          cache.put(kodeSoalDicari + '_meta', JSON.stringify({ chunks: totalChunks }), 900);
        } catch (cacheError) {
          console.warn('Gagal menyimpan ke cache, namun soal tetap akan dimuat:', cacheError);
          // Lanjut mereturn result tanpa throw error agar siswa tetap bisa ujian
        }
        
        return result;
      } catch (e) {
        continue;
      }
    }
  }
  return { status: 'error', message: 'Soal tidak ditemukan.' };
}


function simpanNilai(data) {
  // 1) Validasi dan normalisasi payload (cepat, di luar lock)
  if (!data || typeof data !== 'object') {
    return { status: 'gagal', pesan: 'Payload tidak valid.' };
  }

  const timestamp = new Date();
  const nama = String(data.nama || '').trim();
  const kelas = String(data.kelas || '').trim();
  const kodeSoal = String(data.kode_soal || '').trim().toUpperCase();
  const sekolah = String(data.sekolah || '').trim();
  const noPeserta = String(data.noPeserta || '').trim();
  const submissionId = String(data.submissionId || '').trim();
  const nilaiNumber = Number(data.nilai);

  if (!nama || !kelas || !kodeSoal || !sekolah || !noPeserta || !Number.isFinite(nilaiNumber)) {
    return { status: 'gagal', pesan: 'Data siswa tidak lengkap atau tidak valid.' };
  }

  let jawabanStr = '';
  let logStr = '';
  try {
    jawabanStr = JSON.stringify(data.jawaban || {});
    logStr = JSON.stringify(data.logAktivitas || {});
  } catch (e) {
    return { status: 'gagal', pesan: 'Format jawaban tidak valid.' };
  }

  // Batas aman ukuran payload agar server tidak terbebani request abnormal.
  if (jawabanStr.length > 800000 || logStr.length > 120000) {
    return { status: 'gagal', pesan: 'Ukuran data jawaban terlalu besar.' };
  }

  let ss, sheet;
  try {
    ss = SpreadsheetApp.openById(SHEET_ID);
    sheet = ss.getSheetByName('hasil_siswa');
  } catch (e) {
    return { status: 'gagal', pesan: 'Gagal menemukan database Spreadsheet.' };
  }

  // 2) Idempotency key berbasis cache (ringan untuk lonjakan submit)
  const cache = CacheService.getScriptCache();
  const submissionCacheKey = submissionId ? ('submit_id_' + submissionId) : '';
  const legacyFingerprint = Utilities.base64EncodeWebSafe([nama, noPeserta, kodeSoal, String(nilaiNumber)].join('|')).slice(0, 80);
  const legacyCacheKey = 'submit_legacy_' + legacyFingerprint;

  if (submissionCacheKey && cache.get(submissionCacheKey)) {
    return {
      status: 'sukses',
      pesan: 'Data sudah disimpan sebelumnya.',
      submissionId: submissionId,
      isDuplicate: true
    };
  }

  if (!submissionCacheKey && cache.get(legacyCacheKey)) {
    return {
      status: 'sukses',
      pesan: 'Data sudah disimpan sebelumnya. (Fallback dedup)',
      isDuplicate: true
    };
  }

  const barisBaru = [timestamp, nama, kelas, kodeSoal, nilaiNumber, jawabanStr, logStr, sekolah, noPeserta, submissionId || ''];

  // 3) Lock singkat + double-check cache untuk mencegah race-condition
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(120000);
  } catch (e) {
    return { status: 'gagal', pesan: 'Server sibuk, mencoba antrean ulang...' };
  }

  try {
    if (submissionCacheKey && cache.get(submissionCacheKey)) {
      return {
        status: 'sukses',
        pesan: 'Data sudah disimpan sebelumnya.',
        submissionId: submissionId,
        isDuplicate: true
      };
    }
    if (!submissionCacheKey && cache.get(legacyCacheKey)) {
      return {
        status: 'sukses',
        pesan: 'Data sudah disimpan sebelumnya. (Fallback dedup)',
        isDuplicate: true
      };
    }

    sheet.appendRow(barisBaru);

    // Mark as processed (submissionId: 6 jam, legacy: 2 menit)
    if (submissionCacheKey) cache.put(submissionCacheKey, '1', 21600);
    else cache.put(legacyCacheKey, '1', 120);

    return { status: 'sukses', pesan: 'Data tersimpan', submissionId: submissionId };
  } catch (e) {
    return { status: 'gagal', pesan: e.message };
  } finally {
    lock.releaseLock();
  }
}

/* --- FUNGSI ANALISIS --- */
function analisisHasil(kodeSoal, selectedSchools = null) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const bankSoalSheet = ss.getSheetByName('bank_soal');
    const hasilSiswaSheet = ss.getSheetByName('hasil_siswa');

    // 1. Ambil Kunci Jawaban
    const bankSoalData = bankSoalSheet.getDataRange().getValues();
    const kodeSoalNormal = String(kodeSoal).trim().toUpperCase();
    let soalData = null;

    for (let i = bankSoalData.length - 1; i >= 1; i--) {
      if (String(bankSoalData[i][1]).trim().toUpperCase() === kodeSoalNormal) {
        // Gabungkan chunk JSON (kompatibel layout lama & baru)
        const startCol = getJsonStartColIndex_(bankSoalData[i]);
        const endCol = startCol + 10; // total 11 kolom chunk
        let jsonString = '';
        for (let col = startCol; col <= endCol; col++) {
          const chunk = bankSoalData[i][col];
          if (chunk !== undefined && chunk !== null && chunk !== '') {
             jsonString += String(chunk);
          } else {
             break;
          }
        }
        
        const paket = parseSoalPackage_(jsonString);
        soalData = {
          judul: bankSoalData[i][2],
          konten: paket.konten,
          scoring: paket.scoring
        };
        break;
      }
    }

    if (!soalData) {
      return { status: 'error', message: 'Paket soal tidak ditemukan.' };
    }

    const questionsOnly = soalData.konten.filter(item => ['pg', 'pgk', 'bs'].includes(item.tipe));
    const scoringConfig = normalizeScoringConfig_(soalData.scoring);

    // 2. Ambil Hasil Jawaban Siswa
    const hasilSiswaData = hasilSiswaSheet.getDataRange().getValues();
    let submissions = hasilSiswaData.filter(row => String(row[3]).trim().toUpperCase() === kodeSoalNormal);

    if (submissions.length === 0) {
      return { status: 'error', message: 'Belum ada siswa yang mengerjakan soal ini.' };
    }

    // Ekstrak semua asal sekolah yang unik untuk filter di frontend
    const availableSchools = [...new Set(submissions.map(sub => sub[7] || "Sekolah Tidak Diketahui"))].sort();

    // Terapkan filter sekolah jika selectedSchools diberikan dan tidak kosong
    if (selectedSchools && Array.isArray(selectedSchools) && selectedSchools.length > 0) {
      submissions = submissions.filter(sub => {
        const schoolName = sub[7] || "Sekolah Tidak Diketahui";
        return selectedSchools.includes(schoolName);
      });

      if (submissions.length === 0) {
        return { status: 'error', message: 'Belum ada hasil untuk sekolah yang dipilih.' };
      }
    }

    // 3. Ambil nilai siswa (Tidak di-group lagi berdasarkan sekolah)
    let totalScore = 0;
    const studentScoresList = [];
    
    submissions.forEach(sub => {
      const rawScore = Number(sub[4]);
      const score = Number.isFinite(rawScore) ? rawScore : 0;
      totalScore += score;
      
      let logData = null;
      try {
        if (sub[6]) logData = JSON.parse(sub[6]);
      } catch(e) {}

      const schoolName = sub[7] || "Sekolah Tidak Diketahui";
      const noPeserta = sub[8] || "-";

      studentScoresList.push({
        noPeserta: noPeserta,
        name: sub[1], 
        score: score,
        school: schoolName,
        logAktivitas: logData
      });
    });
    const averageScore = submissions.length > 0 ? (totalScore / submissions.length).toFixed(1) : 0;

    // 4. Inisialisasi struktur analisis butir soal
    let analysis = questionsOnly.map(q => ({
      text: q.text,
      tipe: q.tipe,
      incorrectCount: 0,
      correctCount: 0,
      incorrectStudentNames: [],
      correctStudentNames: []
    }));

    // 5. Proses setiap jawaban siswa untuk analisis butir soal
    submissions.forEach(submission => {
      const studentName = submission[1];
      let studentAnswers;
      try {
        studentAnswers = JSON.parse(submission[5]);
      } catch (e) {
        return; // Skip jika data jawaban rusak
      }

      questionsOnly.forEach((q, index) => {
        const studentAnswer = studentAnswers[index];
        const scored = scoreQuestion_(q, studentAnswer, scoringConfig);
        if (scored.maxPoints <= 0) return;
        const isCorrect = (typeof scored.isPerfect === 'boolean')
          ? scored.isPerfect
          : (scored.score >= scored.maxPoints);

        if (isCorrect) {
          analysis[index].correctCount++;
          analysis[index].correctStudentNames.push(studentName);
        } else {
          analysis[index].incorrectCount++;
          analysis[index].incorrectStudentNames.push(studentName);
        }
      });
    });

    return {
      status: 'sukses',
      judul: soalData.judul,
      totalSubmissions: submissions.length,
      averageScore: averageScore,
      studentScores: studentScoresList,
      detail: analysis,
      availableSchools: availableSchools
    };

  } catch (e) {
    return { status: 'error', message: 'Terjadi kesalahan: ' + e.toString() };
  }
}

/* --- FUNGSI KODE UJIAN --- */
function ambilSoalByKodeUjian(kodeUjian, noPeserta) {
  const kodeNormal = String(kodeUjian).trim().toUpperCase();
  const noPesertaNormal = String(noPeserta || '').trim().toUpperCase();
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('bank_soal');
  const rows = sheet.getDataRange().getValues();

  // Kumpulkan semua kode_soal yang tergabung dalam kode_ujian ini (Col E = index 4)
  const daftarKodeSoal = [];
  for (let i = 1; i < rows.length; i++) {
    const kodeUjianDiSheet = String(rows[i][4] || '').trim().toUpperCase();
    if (kodeUjianDiSheet === kodeNormal) {
      daftarKodeSoal.push(String(rows[i][1]).trim().toUpperCase());
    }
  }

  if (daftarKodeSoal.length === 0) {
    return { status: 'error', message: 'Kode ujian tidak ditemukan atau belum ada soal yang terdaftar.' };
  }

  // Kunci varian per peserta agar recovery konsisten lintas sesi.
  let mappedKode = '';
  if (noPesertaNormal) {
    try {
      const props = PropertiesService.getScriptProperties();
      const mapKey = 'ujian_map_' + kodeNormal + '_' + noPesertaNormal;
      const existingMap = props.getProperty(mapKey);
      if (existingMap && daftarKodeSoal.includes(existingMap)) {
        mappedKode = existingMap;
      }
    } catch (e) {
      console.log('Gagal membaca mapping varian ujian:', e);
    }
  }

  // Pilih satu kode_soal secara acak dari daftar
  const randomKode = mappedKode || daftarKodeSoal[Math.floor(Math.random() * daftarKodeSoal.length)];

  // Simpan mapping jika belum ada agar percobaan berikutnya konsisten.
  if (!mappedKode && noPesertaNormal) {
    try {
      const props = PropertiesService.getScriptProperties();
      const mapKey = 'ujian_map_' + kodeNormal + '_' + noPesertaNormal;
      props.setProperty(mapKey, randomKode);
    } catch (e) {
      console.log('Gagal menyimpan mapping varian ujian:', e);
    }
  }

  const result = ambilSoal(randomKode);
  if (result && result.status === 'sukses') {
    result.kode_soal_dipilih = randomKode;
    result.isMappedByNoPeserta = !!noPesertaNormal;
  }
  return result;
}

function analisisHasilByKodeUjian(kodeUjian, selectedSchools) {
  try {
    const kodeNormal = String(kodeUjian).trim().toUpperCase();
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('bank_soal');
    const rows = sheet.getDataRange().getValues();

    // Kumpulkan kode_soal unik dalam kode_ujian ini (Col E = index 4)
    const daftarKodeSoal = [];
    for (let i = 1; i < rows.length; i++) {
      const kodeUjianDiSheet = String(rows[i][4] || '').trim().toUpperCase();
      if (kodeUjianDiSheet === kodeNormal) {
        const ks = String(rows[i][1]).trim().toUpperCase();
        if (!daftarKodeSoal.includes(ks)) daftarKodeSoal.push(ks);
      }
    }

    if (daftarKodeSoal.length === 0) {
      return { status: 'error', message: 'Kode ujian tidak ditemukan atau belum ada soal yang terdaftar.' };
    }

    // Jalankan analisis per kode_soal
    const hasilPerSoal = daftarKodeSoal.map(ks => {
      const r = analisisHasil(ks, selectedSchools || null);
      return { kode_soal: ks, ...r };
    });

    // Hitung statistik agregat
    let totalSubmissions = 0;
    let totalScore = 0;
    let submissionCount = 0;
    const allSchools = new Set();
    hasilPerSoal.forEach(h => {
      if (h.status === 'sukses') {
        totalSubmissions += h.totalSubmissions;
        (h.studentScores || []).forEach(s => {
          totalScore += s.score;
          submissionCount++;
          allSchools.add(s.school);
        });
      }
    });

    const averageScore = submissionCount > 0 ? (totalScore / submissionCount).toFixed(1) : '0.0';

    // Gabungkan semua daftar nilai siswa dari tiap varian ke dalam satu array
    const allStudentScores = [];
    hasilPerSoal.forEach(function(h) {
      if (h.status === 'sukses') {
        (h.studentScores || []).forEach(function(s) {
          allStudentScores.push(Object.assign({}, s, { kode_soal: h.kode_soal }));
        });
      }
    });

    return {
      status: 'sukses',
      kode_ujian: kodeNormal,
      jumlahVarian: daftarKodeSoal.length,
      totalSubmissions,
      averageScore,
      hasilPerSoal,
      allStudentScores,
      availableSchools: [...allSchools].sort()
    };
  } catch (e) {
    return { status: 'error', message: 'Terjadi kesalahan: ' + e.toString() };
  }
}
