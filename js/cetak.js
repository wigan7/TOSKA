// ===== CETAK BERKAS & EXPORT EXCEL =====

function cetakBerkas(tipeCetak) {
    const kode = document.getElementById('kode-soal-cetak').value.trim().toUpperCase();
    if (!kode) return showToast("Masukkan kode soal untuk dicetak!", "error");

    const btnDiv = document.getElementById('action-cetak-container');
    const loadingDiv = document.getElementById('cetak-loading');
    btnDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    const handleSuccess = (response) => {
        loadingDiv.classList.add('hidden'); btnDiv.classList.remove('hidden');
        if (response.status === 'sukses') {
            try { applyPrintOptions(); if (tipeCetak === 'soal') prosesCetakSoal(response); else if (tipeCetak === 'kunci') prosesCetakKunci(response); else if (tipeCetak === 'ljk') prosesCetakLJK(response); }
            catch (e) { showToast(`Error cetak: ${e.message}`, 'error'); console.error("DOM Print Error:", e); }
        } else { showToast(response.message || 'Gagal memuat soal.', 'error'); }
    };

    const handleFail = (err) => {
        loadingDiv.classList.add('hidden'); btnDiv.classList.remove('hidden');
        showToast(`Fetch Error: ${err.message}`, 'error'); console.error("Fetch Error Detail:", err);
    };

    if (APPS_SCRIPT_URL === 'URL_WEB_APP_APPS_SCRIPT_DI_SINI') {
        setTimeout(() => {
            const mock = localStorage.getItem('tos_mock_db_' + kode);
            if (mock) { const parsed = JSON.parse(mock); handleSuccess({ status: 'sukses', judul: parsed.judul, konten: parsed.konten, kode }); }
            else { handleFail(new Error("Tidak ditemukan (Mock)")); }
        }, 800);
    } else {
        fetchAppsScriptAPI('ambilSoal', kode)
            .then(res => { res.kode = kode; handleSuccess(res); })
            .catch(handleFail);
    }
}

function getPrintHeader(title, type, code) {
    return `<div class="print-header"><h2 style="margin: 0; font-size: 16pt;">TOSKA TES ONLINE SEKOLAH KALIWUNGU</h2><h3 style="margin: 4px 0 0 0; font-size: 12pt;">${title} (${type})</h3><p style="margin: 4px 0 0 0; font-size: 11pt;">Kode Soal: <strong>${code || '-'}</strong></p></div>`;
}

function getPrintOptions() {
    return {
        kertas: document.getElementById('opsi-kertas').value,
        mode: document.getElementById('opsi-mode').value,
        layout: document.getElementById('opsi-layout').value
    };
}

function applyPrintOptions() {
    const pa = document.getElementById('print-area');
    const { kertas, mode, layout } = getPrintOptions();
    pa.className = '';
    if (mode === 'efisien') pa.classList.add('print-mode-efisien');
    else if (mode === 'sangat-efisien') pa.classList.add('print-mode-sangat-efisien');
    if (layout === 'landscape') pa.classList.add('print-layout-landscape');

    let dynamicStyle = document.getElementById('dynamic-print-style');
    if (!dynamicStyle) { dynamicStyle = document.createElement('style'); dynamicStyle.id = 'dynamic-print-style'; document.head.appendChild(dynamicStyle); }

    let sizeMarginStr = '';
    if (kertas === 'A4') sizeMarginStr = layout === 'landscape' ? 'A4 landscape' : 'A4 portrait';
    else if (kertas === 'F4') sizeMarginStr = layout === 'landscape' ? '330mm 215mm' : '215mm 330mm';

    let marginStr = '1.5cm';
    if (mode === 'efisien') marginStr = '1cm';
    else if (mode === 'sangat-efisien') marginStr = '0.7cm';

    dynamicStyle.innerHTML = `@media print { @page { size: ${sizeMarginStr}; margin: ${marginStr}; } }`;
}

function openPrintWindow(htmlContent) {
    const { kertas, mode, layout } = getPrintOptions();
    let sizeMarginStr = '';
    if (kertas === 'A4') sizeMarginStr = layout === 'landscape' ? 'A4 landscape' : 'A4 portrait';
    else if (kertas === 'F4') sizeMarginStr = layout === 'landscape' ? '330mm 215mm' : '215mm 330mm';
    let marginStr = '1.5cm';
    if (mode === 'efisien') marginStr = '1cm';
    else if (mode === 'sangat-efisien') marginStr = '0.7cm';

    let printAreaClasses = '';
    if (mode === 'efisien') printAreaClasses += ' print-mode-efisien';
    else if (mode === 'sangat-efisien') printAreaClasses += ' print-mode-sangat-efisien';
    if (layout === 'landscape') printAreaClasses += ' print-layout-landscape';

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Cetak - TOSKA Tes Online Sekolah Kaliwungu</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: serif; background: white; color: black; }
        @page { size: ${sizeMarginStr}; margin: ${marginStr}; }
        * { box-shadow: none !important; -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
        .print-page-break { page-break-before: always; }
        .print-avoid-break { page-break-inside: avoid; }
        .print-soal-text { font-size: 11pt; line-height: 1.4; margin-bottom: 8px; }
        .print-img { max-width: 60%; max-height: 250px; display: block; margin: 8px 0; object-fit: contain; }
        .print-opsi-list { margin-top: 4px; margin-bottom: 12px; font-size: 10.5pt; }
        .print-opsi-item { display: flex; margin-bottom: 4px; align-items: flex-start; gap: 8px; }
        .print-header { text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 15px; }
        .lj-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        .lj-table th, .lj-table td { border: 1px solid black; padding: 6px; text-align: center; }
        .print-mode-efisien .print-soal-text { font-size: 10.5pt; line-height: 1.3; margin-bottom: 6px; }
        .print-mode-efisien .print-img { max-height: 180px; margin: 6px 0; }
        .print-mode-efisien .print-opsi-list { font-size: 10pt; margin-bottom: 8px; }
        .print-mode-efisien .mb-4 { margin-bottom: 0.5rem !important; }
        .print-mode-sangat-efisien .print-soal-text { font-size: 9.5pt; line-height: 1.25; margin-bottom: 4px; }
        .print-mode-sangat-efisien .print-img { max-height: 140px; margin: 4px 0; max-width: 50%; }
        .print-mode-sangat-efisien .print-opsi-list { font-size: 9pt; margin-bottom: 6px; }
        .print-mode-sangat-efisien .print-opsi-item { margin-bottom: 2px; }
        .print-mode-sangat-efisien .mb-4 { margin-bottom: 0.25rem !important; }
        .print-mode-sangat-efisien .print-avoid-break { break-inside: auto; page-break-inside: auto; }
        .print-layout-landscape .print-content-columns { column-count: 2; column-gap: 30px; column-rule: 1px solid #ddd; }
        .lj-opsi-box { display: inline-block; width: 20px; height: 20px; line-height: 20px; border: 1px solid #000; border-radius: 50%; text-align: center; font-weight: normal; margin: 0 4px; font-size: 9pt; }
        .lj-pgk-box { border-radius: 3px; }
        .whitespace-pre-wrap { white-space: pre-wrap; }
        .break-words { word-wrap: break-word; overflow-wrap: break-word; }
        .mb-4 { margin-bottom: 1rem; }
        .no-print-btn { position: fixed; top: 10px; right: 10px; z-index: 9999; background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; }
        @media print { .no-print-btn { display: none; } }
    </style>
</head>
<body>
    <button class="no-print-btn" onclick="window.close()">✕ Tutup</button>
    <div id="print-area" class="${printAreaClasses.trim()}">${htmlContent}</div>
    <script>
        const images = document.querySelectorAll('img');
        let loaded = 0; const total = images.length;
        if (total === 0) { setTimeout(() => window.print(), 300); }
        else {
            images.forEach(img => {
                if (img.complete) { loaded++; if (loaded >= total) setTimeout(() => window.print(), 300); }
                else { img.onload = img.onerror = () => { loaded++; if (loaded >= total) setTimeout(() => window.print(), 300); }; }
            });
            setTimeout(() => window.print(), 5000);
        }
    <\/script>
</body>
</html>`;

    try {
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const printWin = window.open(url, '_blank');
        if (!printWin) { showToast('Pop-up diblokir! Izinkan pop-up untuk situs ini, lalu coba lagi.', 'error'); URL.revokeObjectURL(url); return; }
        const checkClosed = setInterval(() => { if (printWin.closed) { clearInterval(checkClosed); URL.revokeObjectURL(url); } }, 1000);
    } catch (e) {
        console.warn('Blob URL gagal, fallback ke window.print():', e);
        const pa = document.getElementById('print-area');
        pa.innerHTML = htmlContent; pa.style.display = 'block';
        setTimeout(() => { window.print(); pa.style.display = 'none'; }, 500);
    }
}

function createPrintImg(imgData) {
    if (!imgData) return '';
    let src = imgData, scale = 1;
    if (typeof imgData === 'object' && imgData !== null) { src = imgData.src || imgData.url || ''; scale = imgData.scale || 1; }
    else if (typeof imgData === 'string' && imgData.startsWith('{')) {
        try { const parsed = JSON.parse(imgData); src = parsed.src || parsed.url || ''; scale = parsed.scale || 1; } catch (e) { }
    }
    if (!src) return '';
    const styleOpt = scale > 1 ? ` style="max-height: ${250 * scale}px !important; max-width: ${100 * scale}% !important; width: auto;"` : '';
    return `<img src="${src}" class="print-img"${styleOpt} />`;
}

function prosesCetakSoal(data) {
    let content = getPrintHeader(data.judul, 'NASKAH SOAL', data.kode);
    let qNum = 1;
    content += `<div class="print-content-columns">`;
    if (data.konten && Array.isArray(data.konten)) {
        data.konten.forEach(item => {
            content += `<div class="print-avoid-break mb-4">`;
            if (item.tipe === 'bacaan') {
                content += `<div style="border: 1px dashed #000; padding: 10px; margin-bottom: 10px; background: #fafafa;"><strong style="font-size:10pt;">Bacaan untuk soal nomor berikutnya:</strong><br/>${createPrintImg(item.img)}<div style="font-size:11pt; margin-top:5px; white-space:pre-wrap;">${item.text}</div></div>`;
            } else if (item.tipe === 'pg') {
                content += `<div style="display: flex; gap: 8px;"><div style="font-weight: bold; width: 25px;">${qNum}.</div><div style="flex: 1;"><div class="print-soal-text whitespace-pre-wrap">${item.text}</div>${createPrintImg(item.img)}<div class="print-opsi-list">${(item.opsi || []).map((op, oIdx) => `<div class="print-opsi-item"><span style="font-weight:bold;">${String.fromCharCode(65 + oIdx)}.</span><div>${createPrintImg(op.img)}<span class="whitespace-pre-wrap">${op.text}</span></div></div>`).join('')}</div></div></div>`;
                qNum++;
            } else if (item.tipe === 'pgk') {
                content += `<div style="display: flex; gap: 8px;"><div style="font-weight: bold; width: 25px;">${qNum}.</div><div style="flex: 1;"><div class="print-soal-text whitespace-pre-wrap">${item.text} <br/><em>(Pilih jawaban yang benar, bisa lebih dari satu)</em></div>${createPrintImg(item.img)}<div class="print-opsi-list">${(item.opsi || []).map(op => `<div class="print-opsi-item"><span style="display:inline-block; width:12px; height:12px; border:1px solid black; margin-top:2px;"></span><div>${createPrintImg(op.img)}<span class="whitespace-pre-wrap">${op.text}</span></div></div>`).join('')}</div></div></div>`;
                qNum++;
            } else if (item.tipe === 'bs') {
                content += `<div style="display: flex; gap: 8px;"><div style="font-weight: bold; width: 25px;">${qNum}.</div><div style="flex: 1;"><div class="print-soal-text whitespace-pre-wrap">${item.text}</div>${createPrintImg(item.img)}<div style="margin-top: 8px; margin-bottom: 15px;"><table style="width:100%; border-collapse: collapse; font-size:10.5pt;"><tr><th style="border:1px solid #000; padding:4px; text-align:left;">Pernyataan</th><th style="border:1px solid #000; padding:4px; width:40px; text-align:center;">B</th><th style="border:1px solid #000; padding:4px; width:40px; text-align:center;">S</th></tr>${(item.pernyataan || []).map(p => `<tr><td style="border:1px solid #000; padding:4px;">${createPrintImg(p.img)} <span class="whitespace-pre-wrap">${p.text}</span></td><td style="border:1px solid #000; text-align:center; vertical-align:middle;"><span style="display:inline-block; width:12px; height:12px; border:1px solid black; border-radius:50%;"></span></td><td style="border:1px solid #000; text-align:center; vertical-align:middle;"><span style="display:inline-block; width:12px; height:12px; border:1px solid black; border-radius:50%;"></span></td></tr>`).join('')}</table></div></div></div>`;
                qNum++;
            }
            content += `</div>`;
        });
    }
    content += `</div>`;
    openPrintWindow(content);
}

function prosesCetakKunci(data) {
    let content = getPrintHeader(data.judul, 'KUNCI JAWABAN', data.kode);
    const layout = document.getElementById('opsi-layout').value;
    const numColumns = layout === 'landscape' ? 4 : 2;
    content += `<div style="columns: ${numColumns}; column-gap: 30px;">`;
    let qNum = 1, maxPoints = 0;
    
    // Normalize scoring config (sama seperti di Code.gs)
    const cfg = data.scoring || {};
    const defaults = {
        pg: { maxPoints: 1 },
        pgk: { maxPoints: 3 },
        bs: { maxPoints: 3 }
    };
    
    const num = (value, fallback) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    };
    
    const normalizedCfg = {
        pg: { maxPoints: num(cfg.pg && cfg.pg.maxPoints, defaults.pg.maxPoints) },
        pgk: { maxPoints: num(cfg.pgk && cfg.pgk.maxPoints, defaults.pgk.maxPoints) },
        bs: { maxPoints: num(cfg.bs && cfg.bs.maxPoints, defaults.bs.maxPoints) }
    };
    
    if (data.konten && Array.isArray(data.konten)) {
        data.konten.forEach(item => {
            let answerHtml = '';
            if (item.tipe === 'pg') {
                const hasValidKey = item.kunci !== null && item.kunci !== undefined && item.kunci !== '';
                if (hasValidKey) maxPoints += normalizedCfg.pg.maxPoints;
                let k = item.kunci !== null && item.kunci !== undefined ? String.fromCharCode(65 + parseInt(item.kunci)) : '-';
                answerHtml = `<span style="font-weight:bold;">${k}</span>`;
            } else if (item.tipe === 'pgk') {
                let keys = []; (item.opsi || []).forEach((op, idx) => { if (op.isTrue) keys.push(String.fromCharCode(65 + idx)); });
                maxPoints += normalizedCfg.pgk.maxPoints;
                answerHtml = `<span style="font-weight:bold; font-size: 9pt;">Ctk: ${keys.length > 0 ? keys.join(', ') : '-'}</span>`;
            } else if (item.tipe === 'bs') {
                let keyedCount = 0;
                (item.pernyataan || []).forEach((p) => {
                    const key = String(p?.kunci || '').trim().toUpperCase();
                    if (key === 'B' || key === 'S') keyedCount++;
                });
                maxPoints += normalizedCfg.bs.maxPoints;
                let keysHtml = (item.pernyataan || []).map((p, idx) => `p${idx + 1}:<strong>${p.kunci || '-'}</strong>`).join(' | ');
                answerHtml = `<span style="font-size: 9pt;">${keysHtml || '-'}</span>`;
            }
            if (['pg', 'pgk', 'bs'].includes(item.tipe)) {
                content += `<div style="break-inside: avoid; page-break-inside: avoid; margin-bottom: 8px; font-size: 11pt; display: flex; align-items: flex-start; border-bottom: 1px dashed #ccc; padding-bottom: 4px;"><div style="width: 35px; font-weight: bold;">${qNum}.</div><div style="flex: 1;">${answerHtml}</div></div>`;
                qNum++;
            }
        });
    }
    content += `</div>`;
    content += `<div style="max-width: 600px; margin: 30px auto 0; padding: 15px; border: 1px dashed #000; background-color: #fdfdfd; break-inside: avoid; page-break-inside: avoid;"><h4 style="margin-top: 5px; margin-bottom: 10px; font-size: 11pt; text-align: center;">📋 Panduan Penilaian</h4><table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px;"><thead><tr style="background: #f0f0f0;"><th style="border:1px solid #999; padding:4px;">Tipe</th><th style="border:1px solid #999; padding:4px;">Maks Poin</th><th style="border:1px solid #999; padding:4px;">Aturan Skor</th></tr></thead><tbody><tr><td style="border:1px solid #ccc; padding:4px; text-align:center;">PG</td><td style="border:1px solid #ccc; padding:4px; text-align:center;">${normalizedCfg.pg.maxPoints} / soal valid</td><td style="border:1px solid #ccc; padding:4px;">Benar = ${normalizedCfg.pg.maxPoints}, Salah = 0</td></tr><tr><td style="border:1px solid #ccc; padding:4px; text-align:center;">PGK</td><td style="border:1px solid #ccc; padding:4px; text-align:center;">${normalizedCfg.pgk.maxPoints} / soal</td><td style="border:1px solid #ccc; padding:4px;">Nilai tetap per soal (sesuai konfigurasi)</td></tr><tr><td style="border:1px solid #ccc; padding:4px; text-align:center;">BS</td><td style="border:1px solid #ccc; padding:4px; text-align:center;">${normalizedCfg.bs.maxPoints} / soal</td><td style="border:1px solid #ccc; padding:4px;">Nilai tetap per soal (sesuai konfigurasi)</td></tr></tbody></table><p style="margin: 3px 0; font-size: 10pt; text-align: center;">Potensi Poin Maksimal: <strong>${maxPoints}</strong> poin</p><div style="margin-top: 10px; display: flex; justify-content: center; align-items: center; gap: 8px; font-weight: bold; font-size: 11pt; padding: 5px 15px; border: 1px dashed #ccc; background: white;"><span>Nilai Siswa =</span><span style="display:inline-flex; flex-direction:column; text-align:center;"><span style="border-bottom:1px solid #000; padding:0 8px; font-weight:normal; font-size: 9pt;">(Poin Diperoleh)</span><span>${maxPoints}</span></span><span>x 100</span></div></div>`;
    openPrintWindow(content);
}

function prosesCetakLJK(data) {
    let content = `<div class="print-header" style="display:flex; justify-content:space-between; text-align:left;"><div style="flex:1;"><h2 style="margin: 0; font-size: 16pt;">LEMBAR JAWABAN</h2><h3 style="margin: 5px 0 0 0; font-size: 12pt;">${data.judul}</h3><p style="margin: 5px 0 0 0; font-size: 11pt;">Kode: <strong>${data.kode || '-'}</strong></p></div><div style="flex:1; border: 1px solid #000; padding:10px; font-size:11pt;"><div style="margin-bottom:8px;">Nama  : ............................................</div><div style="margin-bottom:8px;">Kelas : ............................................</div><div>Tgl   : ............................................</div></div></div><div style="columns: 2; column-gap: 40px; margin-top:20px;">`;
    let qNum = 1;
    if (data.konten && Array.isArray(data.konten)) {
        data.konten.forEach(item => {
            if (item.tipe === 'pg') {
                let opsiLen = (item.opsi && item.opsi.length > 0) ? item.opsi.length : 4;
                let boxes = ''; for (let i = 0; i < opsiLen; i++) boxes += `<span class="lj-opsi-box">${String.fromCharCode(65 + i)}</span>`;
                content += `<div style="avoid-break-inside: avoid; margin-bottom: 12px; display:flex; align-items:center;"><div style="width: 30px; font-weight:bold; text-align:right; margin-right:8px;">${qNum}.</div><div>${boxes}</div></div>`;
                qNum++;
            } else if (item.tipe === 'pgk') {
                let opsiLen = (item.opsi && item.opsi.length > 0) ? item.opsi.length : 4;
                let boxes = ''; for (let i = 0; i < opsiLen; i++) boxes += `<span class="lj-opsi-box lj-pgk-box">${String.fromCharCode(65 + i)}</span>`;
                content += `<div style="avoid-break-inside: avoid; margin-bottom: 12px; display:flex; align-items:center;"><div style="width: 30px; font-weight:bold; text-align:right; margin-right:8px;">${qNum}.</div><div><span style="font-size:8pt; margin-right:4px;">(Centang)</span> ${boxes}</div></div>`;
                qNum++;
            } else if (item.tipe === 'bs') {
                let stmtLen = (item.pernyataan && item.pernyataan.length > 0) ? item.pernyataan.length : 1;
                let boxes = ''; for (let i = 0; i < stmtLen; i++) boxes += `<div style="margin-bottom:4px; display:flex; align-items:center;"><span style="font-size:8pt; width:15px;">p${i + 1}</span><span class="lj-opsi-box">B</span><span class="lj-opsi-box">S</span></div>`;
                content += `<div style="avoid-break-inside: avoid; margin-bottom: 12px; display:flex; align-items:flex-start;"><div style="width: 30px; font-weight:bold; text-align:right; margin-right:8px; padding-top:2px;">${qNum}.</div><div>${boxes}</div></div>`;
                qNum++;
            }
        });
    }
    content += `</div>`;
    openPrintWindow(content);
}

// --- EXPORT EXCEL ---
function exportNilaiXLS() {
    if (!currentAnalysisData || !currentAnalysisData.studentScores || currentAnalysisData.studentScores.length === 0) {
        return showToast("Tidak ada data nilai untuk diekspor", "error");
    }

    let tableHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Nilai Siswa</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
            table { border-collapse: collapse; width: 100%; }
            th { font-weight: bold; background-color: #f3f4f6; text-align: center; border: 1px solid #000; padding: 5px; }
            td { border: 1px solid #000; padding: 5px; }
            .center { text-align: center; }
            .text { mso-number-format: "\\@"; }
        </style>
        </head>
        <body>
            <table>
                <thead><tr><th>No</th><th>Nomor Peserta</th><th>Nama Siswa</th><th>Asal Sekolah</th><th>Nilai</th></tr></thead>
                <tbody>`;

    currentAnalysisData.studentScores.forEach((student, index) => {
        const no = index + 1;
        const esc = str => String(str || '-').replace(/</g, "&lt;").replace(/>/g, "&gt;");
        tableHtml += `<tr><td class="center">${no}</td><td class="text">${esc(student.noPeserta)}</td><td>${esc(student.name)}</td><td>${esc(student.school)}</td><td class="center">${student.score || 0}</td></tr>`;
    });

    tableHtml += `</tbody></table></body></html>`;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const judul = currentAnalysisData.judul ? currentAnalysisData.judul.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Nilai_Siswa';
    link.setAttribute("download", `Nilai_${judul}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Berhasil mengekspor data ke Excel!", "success");
}
