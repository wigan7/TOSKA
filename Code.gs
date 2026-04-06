
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
        result = ambilSoalByKodeUjian(args[0]);
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

function scoreQuestion_(q, ans, scoringCfg) {
  const cfg = normalizeScoringConfig_(scoringCfg);

  if (q.tipe === 'pg') {
    const maxPoints = cfg.pg.maxPoints;
    const minPoints = cfg.pg.minPoints;
    let score = cfg.pg.blankPoints;
    if (ans !== undefined && ans !== null) {
      score = ans === q.kunci ? cfg.pg.correctPoints : cfg.pg.wrongPoints;
    }
    return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints };
  }

  if (q.tipe === 'pgk') {
    const minPoints = cfg.pgk.minPoints;
    const selections = Array.isArray(ans) ? ans : [];

    if (cfg.pgk.mode === 'simple') {
      const totalTrue = (q.opsi || []).filter(op => op && op.isTrue).length;
      let correctSelected = 0;
      let wrongSelected = 0;
      selections.forEach(optIdx => {
        if ((q.opsi || [])[optIdx] && (q.opsi || [])[optIdx].isTrue) correctSelected++;
        else wrongSelected++;
      });

      let score = cfg.pgk.simpleBlankPoints;
      if (selections.length === 0) {
        score = cfg.pgk.simpleBlankPoints;
      } else {
        const isAllCorrect = totalTrue > 0 && correctSelected === totalTrue && wrongSelected === 0 && selections.length === totalTrue;
        const isAllWrong = correctSelected === 0;
        if (isAllCorrect) score = cfg.pgk.simpleAllCorrectPoints;
        else if (isAllWrong) score = cfg.pgk.simpleAllWrongPoints;
        else score = cfg.pgk.simplePartialPoints;
      }

      const maxPoints = Math.max(cfg.pgk.simpleAllCorrectPoints, cfg.pgk.simplePartialPoints, cfg.pgk.simpleAllWrongPoints, cfg.pgk.simpleBlankPoints, minPoints);
      return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints };
    }

    const maxPoints = cfg.pgk.maxPoints;
    let score = cfg.pgk.basePoints;
    selections.forEach(optIdx => {
      if ((q.opsi || [])[optIdx] && (q.opsi || [])[optIdx].isTrue) score += cfg.pgk.pointsPerCorrectSelection;
      else score += cfg.pgk.pointsPerWrongSelection;
    });
    return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints };
  }

  if (q.tipe === 'bs') {
    const minPoints = cfg.bs.minPoints;
    const statements = q.pernyataan || [];

    if (cfg.bs.mode === 'simple') {
      const answers = (ans && typeof ans === 'object') ? ans : {};
      const answeredCount = Object.keys(answers).length;
      const totalStatements = statements.length;
      let correctCount = 0;
      statements.forEach((s, sIdx) => {
        if (s.kunci && answers[sIdx] === s.kunci) correctCount++;
      });

      let score = cfg.bs.simpleBlankPoints;
      if (answeredCount === 0) {
        score = cfg.bs.simpleBlankPoints;
      } else {
        const isAllCorrect = totalStatements > 0 && correctCount === totalStatements;
        const isAllWrong = correctCount === 0;
        if (isAllCorrect) score = cfg.bs.simpleAllCorrectPoints;
        else if (isAllWrong) score = cfg.bs.simpleAllWrongPoints;
        else score = cfg.bs.simplePartialPoints;
      }

      const maxPoints = Math.max(cfg.bs.simpleAllCorrectPoints, cfg.bs.simplePartialPoints, cfg.bs.simpleAllWrongPoints, cfg.bs.simpleBlankPoints, minPoints);
      return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints };
    }

    const maxPoints = cfg.bs.maxPoints;
    let score = cfg.bs.basePoints;
    statements.forEach((s, sIdx) => {
      if (s.kunci && ans && ans[sIdx] === s.kunci) score += cfg.bs.pointsPerCorrectStatement;
      else score += cfg.bs.pointsPerWrongStatement;
    });
    return { score: clampScore_(score, minPoints, maxPoints), maxPoints: maxPoints };
  }

  return { score: 0, maxPoints: 0 };
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
  // 1. FASE PERSIAPAN (DI LUAR LOCK) - PARALEL MASAL 
  const timestamp = new Date();
  const jawabanStr = JSON.stringify(data.jawaban);
  const logStr = JSON.stringify(data.logAktivitas || {});
  
  let ss, sheet;
  try {
    ss = SpreadsheetApp.openById(SHEET_ID);
    sheet = ss.getSheetByName('hasil_siswa');
  } catch (e) {
    return { status: 'gagal', pesan: "Gagal menemukan database Spreadsheet." };
  }

  const barisBaru = [timestamp, data.nama, data.kelas, data.kode_soal, data.nilai, jawabanStr, logStr, data.sekolah, data.noPeserta];

  // 2. FASE PENULISAN (DI DALAM LOCK) - EKSEKUSI SINGKAT
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
  } catch (e) {
    return { status: 'gagal', pesan: "Server sibuk, mencoba antrean ulang..." };
  }

  try {
    sheet.appendRow(barisBaru);
    return { status: 'sukses', pesan: 'Data tersimpan' };
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
      const score = parseInt(sub[4]) || 0;
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
        const isCorrect = scored.score >= scored.maxPoints;

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
function ambilSoalByKodeUjian(kodeUjian) {
  const kodeNormal = String(kodeUjian).trim().toUpperCase();
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

  // Pilih satu kode_soal secara acak dari daftar
  const randomKode = daftarKodeSoal[Math.floor(Math.random() * daftarKodeSoal.length)];
  const result = ambilSoal(randomKode);
  if (result && result.status === 'sukses') {
    result.kode_soal_dipilih = randomKode;
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

    return {
      status: 'sukses',
      kode_ujian: kodeNormal,
      jumlahVarian: daftarKodeSoal.length,
      totalSubmissions,
      averageScore,
      hasilPerSoal,
      availableSchools: [...allSchools].sort()
    };
  } catch (e) {
    return { status: 'error', message: 'Terjadi kesalahan: ' + e.toString() };
  }
}
