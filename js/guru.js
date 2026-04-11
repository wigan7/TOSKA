// ===== LOGIC GURU: LOGIN, BUAT SOAL, EDIT, ANALISIS =====

// Menandai apakah guru secara manual mengubah max points.
const scoringMaxTouched = { pgk: false, bs: false };

function bindScoringMaxTracking_() {
    const bindOne = (id, key) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.maxTrackBound === '1') return;
        el.addEventListener('input', () => { scoringMaxTouched[key] = true; });
        el.dataset.maxTrackBound = '1';
    };

    bindOne('score-pgk-max', 'pgk');
    bindOne('score-bs-max', 'bs');
}

// --- LOGIN ---
function openGuruLogin() { document.getElementById('layer-login-guru').classList.remove('hidden'); }
function closeGuruLogin() { document.getElementById('layer-login-guru').classList.add('hidden'); }

function prosesLoginGuru(event) {
    const pass = document.getElementById('input-pass-guru').value;
    const btn = event.currentTarget;
    toggleButtonLoading(btn, true);

    const handleResponse = (isSuccess, message = '') => {
        if (isSuccess) { closeGuruLogin(); navTo('layer-guru-menu'); }
        else { showToast(message || 'Login Gagal', 'error'); }
        toggleButtonLoading(btn, false);
        document.getElementById('input-pass-guru').value = '';
    };

    if (APPS_SCRIPT_URL === 'URL_WEB_APP_APPS_SCRIPT_DI_SINI') {
        setTimeout(() => {
            if (pass === 'admin123') handleResponse(true);
            else handleResponse(false, 'Password Salah! (Coba: admin123) [Mode Dev Lokal]');
        }, 1000);
    } else {
        fetchAppsScriptAPI('loginAdmin', pass)
            .then(response => handleResponse(response.status === 'sukses', response.message))
            .catch(error => { console.error('Login Error:', error); handleResponse(false, 'Terjadi kesalahan server.'); });
    }
}

// --- BUAT & EDIT SOAL ---
function setEditMode(active, kode = '') {
    isEditMode = active;
    const kodeInput = document.getElementById('kode-soal-buat');
    const statusText = document.getElementById('status-mode-text');
    const btnReset = document.getElementById('btn-reset-mode');
    const btnSimpanText = document.getElementById('btn-simpan-text');
    const btnSimpanBaru = document.getElementById('btn-simpan-baru');

    if (active) {
        kodeInput.value = kode;
        kodeInput.readOnly = true;
        kodeInput.classList.add('bg-gray-100');
        statusText.innerText = `Sedang mengedit soal: ${kode}`;
        statusText.classList.add('text-orange-600', 'font-bold');
        btnReset.classList.remove('hidden');
        btnSimpanText.innerText = "UPDATE SOAL INI";
        btnSimpanBaru.classList.remove('hidden');
    } else {
        kodeInput.value = '';
        kodeInput.readOnly = false;
        kodeInput.classList.remove('bg-gray-100');
        statusText.innerText = "Sedang membuat soal baru.";
        statusText.classList.remove('text-orange-600', 'font-bold');
        btnReset.classList.add('hidden');
        btnSimpanText.innerText = "SIMPAN KE DATABASE";
        btnSimpanBaru.classList.add('hidden');
        document.getElementById('judul-ujian').value = '';
        document.getElementById('kode-ujian-buat').value = '';
        document.getElementById('durasi-ujian').value = '60';
        document.getElementById('container-soal').innerHTML = '';
        setScoringInputs(DEFAULT_SCORING_CONFIG);
    }
}

function getNumInputValue(id, fallback) {
    const el = document.getElementById(id);
    const n = Number(el ? el.value : fallback);
    return Number.isFinite(n) ? n : fallback;
}

function getScoringConfigFromInputs() {
    bindScoringMaxTracking_();

    const pgkMode = document.getElementById('score-pgk-mode')?.value || DEFAULT_SCORING_CONFIG.pgk.mode;
    const bsMode = document.getElementById('score-bs-mode')?.value || DEFAULT_SCORING_CONFIG.bs.mode;

    const pgkMinPoints = getNumInputValue('score-pgk-min', DEFAULT_SCORING_CONFIG.pgk.minPoints);
    const bsMinPoints = getNumInputValue('score-bs-min', DEFAULT_SCORING_CONFIG.bs.minPoints);

    const pgkSimpleAllCorrect = getNumInputValue('score-pgk-simple-all-correct', DEFAULT_SCORING_CONFIG.pgk.simpleAllCorrectPoints);
    const pgkSimplePartial = getNumInputValue('score-pgk-simple-partial', DEFAULT_SCORING_CONFIG.pgk.simplePartialPoints);
    const pgkSimpleAllWrong = getNumInputValue('score-pgk-simple-all-wrong', DEFAULT_SCORING_CONFIG.pgk.simpleAllWrongPoints);
    const pgkSimpleBlank = getNumInputValue('score-pgk-simple-blank', DEFAULT_SCORING_CONFIG.pgk.simpleBlankPoints);

    const bsSimpleAllCorrect = getNumInputValue('score-bs-simple-all-correct', DEFAULT_SCORING_CONFIG.bs.simpleAllCorrectPoints);
    const bsSimplePartial = getNumInputValue('score-bs-simple-partial', DEFAULT_SCORING_CONFIG.bs.simplePartialPoints);
    const bsSimpleAllWrong = getNumInputValue('score-bs-simple-all-wrong', DEFAULT_SCORING_CONFIG.bs.simpleAllWrongPoints);
    const bsSimpleBlank = getNumInputValue('score-bs-simple-blank', DEFAULT_SCORING_CONFIG.bs.simpleBlankPoints);

    let pgkMaxPoints = getNumInputValue('score-pgk-max', DEFAULT_SCORING_CONFIG.pgk.maxPoints);
    let bsMaxPoints = getNumInputValue('score-bs-max', DEFAULT_SCORING_CONFIG.bs.maxPoints);

    // Auto-sync maxPoints saat mode simple jika guru belum menyentuh input max secara manual.
    if (pgkMode === 'simple' && !scoringMaxTouched.pgk) {
        pgkMaxPoints = Math.max(pgkSimpleAllCorrect, pgkSimplePartial, pgkSimpleAllWrong, pgkSimpleBlank, pgkMinPoints);
    }
    if (bsMode === 'simple' && !scoringMaxTouched.bs) {
        bsMaxPoints = Math.max(bsSimpleAllCorrect, bsSimplePartial, bsSimpleAllWrong, bsSimpleBlank, bsMinPoints);
    }

    return normalizeScoringConfig({
        pg: {
            correctPoints: getNumInputValue('score-pg-correct', DEFAULT_SCORING_CONFIG.pg.correctPoints),
            wrongPoints: getNumInputValue('score-pg-wrong', DEFAULT_SCORING_CONFIG.pg.wrongPoints),
            blankPoints: getNumInputValue('score-pg-blank', DEFAULT_SCORING_CONFIG.pg.blankPoints),
            maxPoints: getNumInputValue('score-pg-max', DEFAULT_SCORING_CONFIG.pg.maxPoints),
            minPoints: getNumInputValue('score-pg-min', DEFAULT_SCORING_CONFIG.pg.minPoints),
        },
        pgk: {
            mode: pgkMode,
            basePoints: getNumInputValue('score-pgk-base', DEFAULT_SCORING_CONFIG.pgk.basePoints),
            pointsPerCorrectSelection: getNumInputValue('score-pgk-correct', DEFAULT_SCORING_CONFIG.pgk.pointsPerCorrectSelection),
            pointsPerWrongSelection: getNumInputValue('score-pgk-wrong', DEFAULT_SCORING_CONFIG.pgk.pointsPerWrongSelection),
            maxPoints: pgkMaxPoints,
            simpleAllCorrectPoints: pgkSimpleAllCorrect,
            simplePartialPoints: pgkSimplePartial,
            simpleAllWrongPoints: pgkSimpleAllWrong,
            simpleBlankPoints: pgkSimpleBlank,
            minPoints: pgkMinPoints,
        },
        bs: {
            mode: bsMode,
            basePoints: getNumInputValue('score-bs-base', DEFAULT_SCORING_CONFIG.bs.basePoints),
            pointsPerCorrectStatement: getNumInputValue('score-bs-correct', DEFAULT_SCORING_CONFIG.bs.pointsPerCorrectStatement),
            pointsPerWrongStatement: getNumInputValue('score-bs-wrong', DEFAULT_SCORING_CONFIG.bs.pointsPerWrongStatement),
            maxPoints: bsMaxPoints,
            simpleAllCorrectPoints: bsSimpleAllCorrect,
            simplePartialPoints: bsSimplePartial,
            simpleAllWrongPoints: bsSimpleAllWrong,
            simpleBlankPoints: bsSimpleBlank,
            minPoints: bsMinPoints,
        }
    });
}

function setScoringInputs(scoringConfig) {
    bindScoringMaxTracking_();
    scoringMaxTouched.pgk = false;
    scoringMaxTouched.bs = false;

    const cfg = normalizeScoringConfig(scoringConfig);
    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    setVal('score-pg-correct', cfg.pg.correctPoints);
    setVal('score-pg-wrong', cfg.pg.wrongPoints);
    setVal('score-pg-blank', cfg.pg.blankPoints);
    setVal('score-pg-max', cfg.pg.maxPoints);
    setVal('score-pg-min', cfg.pg.minPoints);

    setVal('score-pgk-base', cfg.pgk.basePoints);
    setVal('score-pgk-correct', cfg.pgk.pointsPerCorrectSelection);
    setVal('score-pgk-wrong', cfg.pgk.pointsPerWrongSelection);
    setVal('score-pgk-max', cfg.pgk.maxPoints);
    setVal('score-pgk-mode', cfg.pgk.mode);
    setVal('score-pgk-simple-all-correct', cfg.pgk.simpleAllCorrectPoints);
    setVal('score-pgk-simple-partial', cfg.pgk.simplePartialPoints);
    setVal('score-pgk-simple-all-wrong', cfg.pgk.simpleAllWrongPoints);
    setVal('score-pgk-simple-blank', cfg.pgk.simpleBlankPoints);
    setVal('score-pgk-min', cfg.pgk.minPoints);

    setVal('score-bs-base', cfg.bs.basePoints);
    setVal('score-bs-correct', cfg.bs.pointsPerCorrectStatement);
    setVal('score-bs-wrong', cfg.bs.pointsPerWrongStatement);
    setVal('score-bs-max', cfg.bs.maxPoints);
    setVal('score-bs-mode', cfg.bs.mode);
    setVal('score-bs-simple-all-correct', cfg.bs.simpleAllCorrectPoints);
    setVal('score-bs-simple-partial', cfg.bs.simplePartialPoints);
    setVal('score-bs-simple-all-wrong', cfg.bs.simpleAllWrongPoints);
    setVal('score-bs-simple-blank', cfg.bs.simpleBlankPoints);
    setVal('score-bs-min', cfg.bs.minPoints);

    updateScoringModeUI();
    validateAndDisplayScoringConfig();
}

function validateAndDisplayScoringConfig() {
    const config = getScoringConfigFromInputs();
    let warnings = [];

    // Validasi PGK
    if (config.pgk.mode === 'simple') {
        const pgkMax = Math.max(
            config.pgk.simpleAllCorrectPoints,
            config.pgk.simplePartialPoints,
            config.pgk.simpleAllWrongPoints,
            config.pgk.simpleBlankPoints
        );
        if (config.pgk.maxPoints < pgkMax) {
            warnings.push(`⚠️ PGK: maxPoints (${config.pgk.maxPoints}) lebih kecil dari nilai tertinggi (${pgkMax}). Siswa tidak bisa dapat nilai penuh.`);
        }
    }

    // Validasi BS
    if (config.bs.mode === 'simple') {
        const bsMax = Math.max(
            config.bs.simpleAllCorrectPoints,
            config.bs.simplePartialPoints,
            config.bs.simpleAllWrongPoints,
            config.bs.simpleBlankPoints
        );
        if (config.bs.maxPoints < bsMax) {
            warnings.push(`⚠️ BS: maxPoints (${config.bs.maxPoints}) lebih kecil dari nilai tertinggi (${bsMax}). Siswa tidak bisa dapat nilai penuh.`);
        }
    }

    // Tampilkan warning jika ada
    const warningEl = document.getElementById('scoring-validation-warnings');
    if (warningEl) {
        if (warnings.length > 0) {
            warningEl.innerHTML = warnings.map(w => `<div class="p-2 text-orange-700 bg-orange-50 rounded mb-2">${w}</div>`).join('');
            warningEl.classList.remove('hidden');
        } else {
            warningEl.classList.add('hidden');
        }
    }
}

function updateScoringModeUI() {
    const toggle = (modeId, manualId, simpleId) => {
        const mode = document.getElementById(modeId)?.value || 'manual';
        const manualEl = document.getElementById(manualId);
        const simpleEl = document.getElementById(simpleId);
        if (manualEl) manualEl.classList.toggle('hidden', mode !== 'manual');
        if (simpleEl) simpleEl.classList.toggle('hidden', mode !== 'simple');
    };

    toggle('score-pgk-mode', 'score-pgk-manual-fields', 'score-pgk-simple-fields');
    toggle('score-bs-mode', 'score-bs-manual-fields', 'score-bs-simple-fields');
    
    // Revalidate saat mode berubah
    setTimeout(() => validateAndDisplayScoringConfig(), 100);
}

function handleEditLoad() {
    const kode = document.getElementById('input-kode-edit').value.toUpperCase();
    if (!kode) return showToast("Masukkan kode soal yang akan diedit!", 'info');

    const btn = document.getElementById('btn-muat-edit');
    toggleButtonLoading(btn, true);

    const processData = (data) => {
        setEditMode(true, kode);
        document.getElementById('judul-ujian').value = data.judul;
        document.getElementById('kode-ujian-buat').value = data.kode_ujian || '';
        document.getElementById('durasi-ujian').value = data.durasi;
        setScoringInputs(data.scoring || DEFAULT_SCORING_CONFIG);
        document.getElementById('container-soal').innerHTML = '';
        if (data.konten && Array.isArray(data.konten)) {
            data.konten.forEach(item => {
                if (item.tipe === 'bacaan') tambahBacaan(item); else tambahSoal(item.tipe, item);
            });
        }
        showToast('Soal berhasil dimuat!');
    };

    if (APPS_SCRIPT_URL === 'URL_WEB_APP_APPS_SCRIPT_DI_SINI') {
        setTimeout(() => {
            const mock = localStorage.getItem('tos_mock_db_' + kode);
            toggleButtonLoading(btn, false);
            if (mock) {
                const parsed = JSON.parse(mock);
                processData({ judul: parsed.judul, durasi: parsed.durasi, konten: parsed.konten });
            } else { showToast("Soal tidak ditemukan di LocalStorage [Mode Dev Lokal]", 'error'); }
        }, 500);
    } else {
        fetchAppsScriptAPI('ambilSoal', kode)
            .then(response => {
                toggleButtonLoading(btn, false);
                if (response.status === 'sukses') processData(response);
                else showToast(response.message, 'error');
            })
            .catch(err => {
                toggleButtonLoading(btn, false);
                showToast('Gagal memuat soal.', 'error');
                console.error(err);
            });
    }
}

// --- HELPER INPUT SOAL ---
function setInputValue(container, selector, value) {
    const el = container.querySelector(selector);
    if (el) el.value = value || '';
}

function setImgValue(container, prefixId, value) {
    if (!value) return;

    const imgContainer = container.matches('.image-input-container')
        ? container
        : container.querySelector('.image-input-container');

    if (!imgContainer) {
        console.warn("Could not find image container for:", prefixId, "in", container);
        return;
    }

    const hiddenInput = imgContainer.querySelector('.soal-img-data');
    const imgPreview = imgContainer.querySelector(`#img-prev-${prefixId}`);
    const urlInput = imgContainer.querySelector('.image-url-input');

    if (hiddenInput) hiddenInput.value = value;
    if (imgPreview) {
        imgPreview.src = value;
        imgPreview.classList.remove('hidden');
        imgPreview.onerror = () => {
            imgPreview.classList.add('hidden');
            if (hiddenInput) hiddenInput.value = '';
        };
    }

    // Skala gambar
    const scaleCheckbox = imgContainer.querySelector(`#scale-check-${prefixId}`);
    const scaleInput = imgContainer.querySelector(`#scale-val-${prefixId}`);
    const scaleDataInput = imgContainer.querySelector(`.soal-img-scale-data`);
    if (scaleCheckbox) scaleCheckbox.checked = false;
    if (scaleInput) scaleInput.value = "1.5";
    if (scaleDataInput) scaleDataInput.value = "1";

    let imgSrc = value;
    let imgScale = 1;

    if (typeof value === 'object' && value !== null) {
        imgSrc = value.url || value.src || '';
        imgScale = value.scale || 1;
        if (hiddenInput) hiddenInput.value = imgSrc;
        if (imgPreview && imgSrc) imgPreview.src = imgSrc;
    } else if (typeof value === 'string' && value.startsWith('{')) {
        try {
            const parsed = JSON.parse(value);
            if (parsed.src) {
                imgSrc = parsed.src;
                imgScale = parsed.scale || 1;
                if (hiddenInput) hiddenInput.value = imgSrc;
                if (imgPreview) imgPreview.src = imgSrc;
            }
        } catch (e) { }
    }

    if (imgScale > 1) {
        if (scaleCheckbox) scaleCheckbox.checked = true;
        if (scaleInput) scaleInput.value = imgScale;
        if (scaleDataInput) scaleDataInput.value = imgScale;
    }

    // Tab switching logic
    const allContents = [
        imgContainer.querySelector(`#upload-${prefixId}`),
        imgContainer.querySelector(`#url-${prefixId}`),
        imgContainer.querySelector(`#paste-${prefixId}`)
    ];
    const allBtns = [
        imgContainer.querySelector(`[data-tab-id="upload-${prefixId}"]`),
        imgContainer.querySelector(`[data-tab-id="url-${prefixId}"]`),
        imgContainer.querySelector(`[data-tab-id="paste-${prefixId}"]`)
    ];

    const activateTab = (activeContent, activeBtn) => {
        allContents.forEach(c => c && c.classList.add('hidden'));
        allBtns.forEach(b => b && b.classList.remove('active-tab'));
        if (activeContent) activeContent.classList.remove('hidden');
        if (activeBtn) activeBtn.classList.add('active-tab');
    };

    if (typeof imgSrc === 'string' && (imgSrc.startsWith('http') || imgSrc.startsWith('//'))) {
        if (urlInput) urlInput.value = imgSrc;
        activateTab(allContents[1], allBtns[1]);
    } else {
        activateTab(allContents[0], allBtns[0]);
    }
}

function processImageBlob(file, targetImgId, targetInputHiddenId) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 400; let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            const targetImgEl = document.getElementById(targetImgId);
            const targetInputEl = document.getElementById(targetInputHiddenId);
            if (targetImgEl) { targetImgEl.src = dataUrl; targetImgEl.classList.remove('hidden'); }
            if (targetInputEl) targetInputEl.value = dataUrl;
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

function handleImageUpload(inputElement, targetImgId, targetInputHiddenId) {
    const file = inputElement.files[0];
    if (file) processImageBlob(file, targetImgId, targetInputHiddenId);
}

function updateNomorSoal() {
    const cards = document.querySelectorAll('#container-soal .card-soal');
    let questionCounter = 1;
    cards.forEach(card => {
        const nomorSoalSpan = card.querySelector('.nomor-soal');
        const tipe = card.dataset.type;
        if (['pg', 'pgk', 'bs'].includes(tipe)) {
            if (nomorSoalSpan) { nomorSoalSpan.innerText = `Soal #${questionCounter}`; nomorSoalSpan.classList.remove('hidden'); }
            questionCounter++;
        } else if (tipe === 'bacaan' && nomorSoalSpan) {
            nomorSoalSpan.classList.add('hidden');
        }
    });
}

function createImageInputHTML(targetId) {
    return `
        <div class="image-input-container mt-2 text-xs">
            <div class="flex border-b">
                <button type="button" class="image-tab-btn active-tab" data-tab-id="upload-${targetId}"><i class="fas fa-upload mr-1"></i> Upload</button>
                <button type="button" class="image-tab-btn" data-tab-id="url-${targetId}"><i class="fas fa-link mr-1"></i> URL</button>
                <button type="button" class="image-tab-btn" data-tab-id="paste-${targetId}"><i class="fas fa-paste mr-1"></i> Tempel</button>
            </div>
            <div class="border border-t-0 rounded-b-lg p-2 bg-white">
                <div class="image-tab-content" id="upload-${targetId}">
                    <label class="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg inline-flex items-center gap-2 transition text-gray-600 font-bold border">
                        <i class="fas fa-camera"></i> Pilih File
                        <input type="file" class="hidden" accept="image/*" onchange="handleImageUpload(this, 'img-prev-${targetId}', 'val-img-${targetId}')">
                    </label>
                </div>
                <div class="image-tab-content hidden" id="url-${targetId}">
                    <input type="text" class="image-url-input w-full p-2 border rounded-lg focus:border-sd-primary outline-none" placeholder="Tempel URL gambar di sini...">
                </div>
                <div class="image-tab-content hidden paste-area" id="paste-${targetId}" data-target-img="img-prev-${targetId}" data-target-input="val-img-${targetId}" tabindex="0">
                    <div class="p-3 border-2 border-dashed rounded-lg text-center text-gray-500 cursor-pointer">
                        <i class="fas fa-clipboard-list text-2xl mb-1"></i>
                        <p class="font-semibold">Klik di sini lalu <strong>Ctrl+V</strong></p>
                        <p>untuk menempel gambar dari clipboard.</p>
                    </div>
                </div>
            </div>
            <div class="mt-2 bg-gray-50 border p-2 rounded-lg flex items-center justify-between gap-2">
                <label class="flex items-center gap-2 cursor-pointer cursor-checkbox">
                    <input type="checkbox" id="scale-check-${targetId}" class="w-4 h-4 text-sd-primary rounded border-gray-300 focus:ring-sd-primary">
                    <span class="font-bold text-gray-600">Aktifkan Gambar Besar</span>
                </label>
                <div class="flex items-center gap-1">
                    <span class="text-gray-500">Skala:</span>
                    <input type="number" id="scale-val-${targetId}" step="0.1" min="1.1" max="5.0" value="1.5" class="w-16 p-1 border rounded text-center text-xs font-mono font-bold outline-none focus:border-sd-primary">
                    <span class="text-gray-500">x</span>
                </div>
            </div>
            <input type="hidden" id="val-img-${targetId}" class="soal-img-data">
            <input type="hidden" id="val-scale-${targetId}" class="soal-img-scale-data" value="1">
            <img id="img-prev-${targetId}" class="hidden mt-2 max-h-[150px] rounded-lg border-2 border-gray-200 shadow-sm" />
        </div>`;
}

function tambahBacaan(data = null) {
    const container = document.getElementById('container-soal');
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const html = `
    <div class="card-soal bg-blue-50 p-4 rounded-2xl shadow-sm border-2 border-dashed border-blue-300 relative animate-pop" data-type="bacaan">
        <button class="btn-hapus-item text-red-500 text-sm float-right font-bold hover:bg-red-50 px-2 rounded transition"><i class="fas fa-trash"></i> Hapus</button>
        <div class="flex items-center gap-2 mb-2"><span class="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold"><i class="fas fa-book-open"></i> BACAAN</span></div>
        <div class="quill-container mb-2 bg-white rounded-xl border overflow-hidden"><div class="quill-editor-${id} text-sm"></div></div>
        <textarea class="bacaan-text hidden w-full p-3 border rounded-xl mb-2 text-sm focus:border-blue-500 outline-none bg-white" rows="5"></textarea>
        ${createImageInputHTML(id)}
        <div class="mt-3 flex items-center gap-2 bg-blue-100 p-2 rounded-lg">
            <label for="bacaan-untuk-${id}" class="text-sm font-bold text-blue-800">Digunakan untuk</label>
            <input type="number" id="bacaan-untuk-${id}" class="bacaan-untuk w-20 p-2 border rounded-lg text-sm text-center font-bold" value="1" min="1">
            <label for="bacaan-untuk-${id}" class="text-sm font-bold text-blue-800">soal berikutnya.</label>
        </div>
    </div>`;
    container.insertAdjacentHTML('beforeend', html);

    const card = container.lastElementChild;
    const quill = new Quill(card.querySelector(`.quill-editor-${id}`), {
        theme: 'snow',
        placeholder: 'Tulis atau salin teks bacaan di sini...',
        modules: { toolbar: [['bold', 'italic', 'underline', 'strike'], ['formula'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], [{ 'script': 'sub' }, { 'script': 'super' }], ['clean']] }
    });
    quill.on('text-change', () => { card.querySelector('.bacaan-text').value = quill.root.innerHTML; });
    card.quillInstance = quill;

    if (data) {
        setInputValue(card, '.bacaan-text', data.text);
        if (card.quillInstance && data.text) card.quillInstance.clipboard.dangerouslyPasteHTML(data.text);
        setInputValue(card, '.bacaan-untuk', data.untuk);
        setImgValue(card, id, data.img);
    }
    updateNomorSoal();
}

function tambahSoal(tipe, data = null) {
    const container = document.getElementById('container-soal');
    const id = Date.now() + Math.floor(Math.random() * 1000);
    let html = '';
    const btnHapus = `<button class="btn-hapus-item text-red-500 text-sm float-right font-bold hover:bg-red-50 px-2 rounded transition"><i class="fas fa-trash"></i> Hapus</button>`;

    if (tipe === 'pg') {
        html = `<div class="card-soal bg-white p-4 rounded-2xl shadow-sm border border-gray-200 relative animate-pop" data-type="pg"> ${btnHapus} <div class="flex items-center gap-3 mb-2"> <span class="nomor-soal bg-gray-200 text-gray-600 font-bold px-2 py-1 text-sm rounded-md"></span> <span class="bg-sd-primary text-white text-xs px-2 py-1 rounded font-bold">PG</span> <span class="text-gray-500 text-sm font-bold">Pilihan Ganda</span> </div> <div class="quill-container mb-2 bg-white rounded-xl border overflow-hidden"><div class="quill-editor-${id} text-sm"></div></div> <textarea class="soal-text hidden w-full p-3 border rounded-xl mb-2 text-sm focus:border-sd-primary outline-none bg-gray-50" rows="2"></textarea> ${createImageInputHTML(id + '-q')} <div class="space-y-3 mt-4"> ${[1, 2, 3, 4].map((i) => `<div class="flex items-start gap-2"> <div class="pt-2"><input type="radio" name="kunci-${id}" value="${i - 1}" class="soal-kunci w-5 h-5 cursor-pointer accent-sd-primary"></div> <div class="flex-1"> <input type="text" class="soal-opsi w-full p-2 border rounded-lg text-sm focus:border-sd-primary outline-none" placeholder="Opsi ${i}"> ${createImageInputHTML(id + '-o' + i)} </div> </div>`).join('')} </div> </div>`;
    } else if (tipe === 'pgk') {
        html = `<div class="card-soal bg-white p-4 rounded-2xl shadow-sm border border-purple-200 relative animate-pop" data-type="pgk"> ${btnHapus} <div class="flex items-center gap-3 mb-2"> <span class="nomor-soal bg-gray-200 text-gray-600 font-bold px-2 py-1 text-sm rounded-md"></span> <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded font-bold">PGK</span> <span class="text-gray-500 text-sm font-bold">Pilihan Ganda Kompleks</span> </div> <div class="quill-container mb-2 bg-white rounded-xl border overflow-hidden"><div class="quill-editor-${id} text-sm"></div></div> <textarea class="soal-text hidden w-full p-3 border rounded-xl mb-2 text-sm focus:border-purple-500 outline-none bg-gray-50" rows="2"></textarea> ${createImageInputHTML(id + '-q')} <div class="space-y-3 mt-4"> ${[1, 2, 3, 4].map((i) => `<div class="flex items-start gap-3"> <div class="pt-2"><input type="checkbox" class="soal-kunci w-5 h-5 cursor-pointer accent-purple-600"></div> <div class="flex-1"> <input type="text" class="soal-opsi w-full p-2 border rounded-lg text-sm focus:border-purple-500 outline-none" placeholder="Pernyataan ${i}"> ${createImageInputHTML(id + '-o' + i)} </div> </div>`).join('')} </div> </div>`;
    } else if (tipe === 'bs') {
        html = `<div class="card-soal bg-white p-4 rounded-2xl shadow-sm border border-green-200 relative animate-pop" data-type="bs"> ${btnHapus} <div class="flex items-center gap-3 mb-2"> <span class="nomor-soal bg-gray-200 text-gray-600 font-bold px-2 py-1 text-sm rounded-md"></span> <span class="bg-green-600 text-white text-xs px-2 py-1 rounded font-bold">B/S</span> <span class="text-gray-500 text-sm font-bold">Benar Salah</span> </div> <div class="quill-container mb-2 bg-white rounded-xl border overflow-hidden"><div class="quill-editor-${id} text-sm"></div></div> <textarea class="soal-text hidden w-full p-3 border rounded-xl mb-2 text-sm focus:border-green-600 outline-none bg-gray-50" rows="2"></textarea> ${createImageInputHTML(id + '-q')} <div class="mt-4 bg-gray-50 p-3 rounded-xl border"> <div class="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 mb-2"> <div class="col-span-8">Pernyataan</div> <div class="col-span-2 text-center">B</div> <div class="col-span-2 text-center">S</div> </div> ${[1, 2, 3].map((i) => `<div class="grid grid-cols-12 gap-2 items-center mb-3 opsi-row border-b pb-2 last:border-0 last:pb-0"> <div class="col-span-8"> <input type="text" class="soal-opsi w-full p-2 border rounded-lg text-sm bg-white" placeholder="Pernyataan ${i}"> ${createImageInputHTML(id + '-o' + i)} </div> <div class="col-span-4 flex justify-around items-center"> <input type="radio" name="bs-${id}-${i}" value="B" class="soal-kunci-b w-5 h-5 accent-green-600"> <input type="radio" name="bs-${id}-${i}" value="S" class="soal-kunci-s w-5 h-5 accent-red-500"> </div> </div>`).join('')} </div> </div>`;
    }
    container.insertAdjacentHTML('beforeend', html);

    const card = container.lastElementChild;
    const quill = new Quill(card.querySelector(`.quill-editor-${id}`), {
        theme: 'snow',
        placeholder: tipe === 'bs' ? 'Tulis stimulus / teks bacaan...' : 'Tulis pertanyaan...',
        modules: { toolbar: [['bold', 'italic', 'underline', 'strike'], ['formula'], [{ 'list': 'ordered' }, { 'list': 'bullet' }], [{ 'script': 'sub' }, { 'script': 'super' }], ['clean']] }
    });
    quill.on('text-change', () => { card.querySelector('.soal-text').value = quill.root.innerHTML; });
    card.quillInstance = quill;

    if (data) {
        setInputValue(card, '.soal-text', data.text);
        if (card.quillInstance && data.text) card.quillInstance.clipboard.dangerouslyPasteHTML(data.text);
        setImgValue(card, id + '-q', data.img);

        const opsiInputs = card.querySelectorAll('.soal-opsi');
        const kunciInputs = card.querySelectorAll('.soal-kunci');
        const opsiRows = card.querySelectorAll('.opsi-row');

        if (tipe === 'pg') {
            if (data.opsi) data.opsi.forEach((op, idx) => { if (opsiInputs[idx]) { opsiInputs[idx].value = op.text; setImgValue(opsiInputs[idx].parentElement, id + '-o' + (idx + 1), op.img); } });
            if (data.kunci !== null && data.kunci !== undefined) { card.querySelectorAll(`input[type=radio].soal-kunci`).forEach(r => { if (parseInt(r.value) === data.kunci) r.checked = true; }); }
        } else if (tipe === 'pgk') {
            if (data.opsi) data.opsi.forEach((op, idx) => { if (opsiInputs[idx]) { opsiInputs[idx].value = op.text; setImgValue(opsiInputs[idx].parentElement, id + '-o' + (idx + 1), op.img); } if (kunciInputs[idx] && op.isTrue) kunciInputs[idx].checked = true; });
        } else if (tipe === 'bs') {
            if (data.pernyataan) data.pernyataan.forEach((p, idx) => { if (opsiRows[idx]) { const textInput = opsiRows[idx].querySelector('.soal-opsi'); if (textInput) { textInput.value = p.text; setImgValue(opsiRows[idx], id + '-o' + (idx + 1), p.img); } if (p.kunci === 'B') opsiRows[idx].querySelector('.soal-kunci-b').checked = true; if (p.kunci === 'S') opsiRows[idx].querySelector('.soal-kunci-s').checked = true; } });
        }
    }
    updateNomorSoal();
}

function getSoalDataFromForm() {
    const judul = document.getElementById('judul-ujian').value;
    const kode = document.getElementById('kode-soal-buat').value.toUpperCase();
    const durasi = document.getElementById('durasi-ujian').value;
    if (!judul || !kode || !durasi) { showToast('Judul, Kode Soal, dan Durasi harus diisi!', 'error'); return null; }
    const soalCards = document.querySelectorAll('.card-soal');
    if (soalCards.length === 0) { showToast('Belum ada soal dibuat!', 'error'); return null; }

    const dataSoal = Array.from(soalCards).map(card => {
        const tipe = card.dataset.type; let item = { tipe };
        const getImgData = (container) => {
            const src = container?.querySelector('.soal-img-data')?.value || "";
            if (!src) return "";
            let scale = 1;
            const scaleCheck = container?.querySelector('input[type="checkbox"][id^="scale-check-"]');
            const scaleInput = container?.querySelector('input[type="number"][id^="scale-val-"]');
            if (scaleCheck && scaleCheck.checked && scaleInput) scale = parseFloat(scaleInput.value) || 1;
            if (scale > 1) return { src, scale };
            return src;
        };

        if (tipe === 'bacaan') {
            item.text = card.querySelector('.bacaan-text').value;
            item.untuk = parseInt(card.querySelector('.bacaan-untuk').value) || 1;
            item.img = getImgData(card.querySelector('.image-input-container'));
        } else if (['pg', 'pgk', 'bs'].includes(tipe)) {
            item.text = card.querySelector('.soal-text').value;
            item.img = getImgData(card.querySelector('.image-input-container'));
            if (tipe === 'pg') {
                item.opsi = Array.from(card.querySelectorAll('.soal-opsi')).map(op => ({ text: op.value, img: getImgData(op.parentElement) }));
                const checkedKunci = card.querySelector('input[type=radio].soal-kunci:checked'); item.kunci = checkedKunci ? parseInt(checkedKunci.value) : null;
            } else if (tipe === 'pgk') {
                item.opsi = Array.from(card.querySelectorAll('.soal-opsi')).map((op, idx) => ({ text: op.value, isTrue: card.querySelectorAll('.soal-kunci')[idx].checked, img: getImgData(op.parentElement) }));
            } else if (tipe === 'bs') {
                item.pernyataan = Array.from(card.querySelectorAll('.opsi-row')).map(row => ({ text: row.querySelector('.soal-opsi').value, kunci: row.querySelector('input[type=radio]:checked')?.value || null, img: getImgData(row.querySelector('.soal-opsi').parentElement) }));
            }
        } return item;
    });

    return {
        judul,
        kode_soal: kode,
        kode_ujian: (document.getElementById('kode-ujian-buat')?.value || '').trim().toUpperCase(),
        durasi: parseInt(durasi),
        scoring: getScoringConfigFromInputs(),
        konten: dataSoal
    };
}

function prosesSimpanSoal(payload, isEditFlag) {
    if (!payload) return;
    try {
        document.getElementById('dashboard-loading-overlay').classList.remove('hidden');
        const handleSuccess = (response) => {
            document.getElementById('dashboard-loading-overlay').classList.add('hidden');
            if (response.status === 'sukses') {
                const baseUrl = window.location.href.split('?')[0];
                const shareLink = `${baseUrl}?kode=${payload.kode_soal}`;
                const embedCode = `<iframe src="${shareLink}" style="width: 100%; height: 80vh; border: none;" allowfullscreen></iframe>`;
                document.getElementById('share-link-input').value = shareLink;
                document.getElementById('embed-code-input').value = embedCode;
                navTo('layer-share-link');
            } else {
                showToast(response.message || 'Gagal menyimpan soal.', 'error');
            }
        };

        if (APPS_SCRIPT_URL === 'URL_WEB_APP_APPS_SCRIPT_DI_SINI') {
            setTimeout(() => {
                localStorage.setItem('tos_mock_db_' + payload.kode_soal, JSON.stringify(payload));
                handleSuccess({ status: 'sukses', message: 'Tersimpan lokal [Mode Dev]' });
            }, 1000);
        } else {
            fetchAppsScriptAPI('simpanSoal', payload, isEditFlag)
                .then(handleSuccess)
                .catch(err => {
                    document.getElementById('dashboard-loading-overlay').classList.add('hidden');
                    showToast(err.message, 'error');
                });
        }
    } catch (error) {
        console.error("Error during save:", error);
        document.getElementById('dashboard-loading-overlay').classList.add('hidden');
        showToast("Terjadi kesalahan. Periksa konsol.", 'error');
    }
}

function simpanSebagaiBaru() {
    const newCode = prompt("Masukkan KODE SOAL BARU untuk paket soal ini:", "");
    if (!newCode || newCode.trim() === "") { showToast("Pembuatan soal baru dibatalkan.", "info"); return; }
    const payload = getSoalDataFromForm();
    if (payload) {
        payload.kode_soal = newCode.toUpperCase();
        prosesSimpanSoal(payload, false);
    }
}

// --- ANALISIS ---
function handleMulaiAnalisis(selectedSchools = null) {
    const isFilterMode = Array.isArray(selectedSchools);
    const kodeUjian = (document.getElementById('kode-ujian-analisis')?.value || '').trim().toUpperCase();
    const kodeSoal  = (document.getElementById('kode-soal-analisis')?.value  || '').trim().toUpperCase();

    if (!kodeUjian && !kodeSoal) return showToast("Masukkan Kode Ujian atau Kode Soal!", 'error');

    const isUjianMode = !!kodeUjian; // prioritas kode ujian jika keduanya diisi
    const kode = isUjianMode ? kodeUjian : kodeSoal;

    if (!isFilterMode) {
        document.getElementById('analisis-results-container').classList.add('hidden');
        document.getElementById('analisis-loading').classList.remove('hidden');
        document.getElementById('filter-sekolah-container').classList.add('hidden');
    } else {
        document.getElementById('filter-loading').classList.remove('hidden');
    }

    const btn = document.getElementById('btn-mulai-analisis');
    const btnTerapkan = document.getElementById('btn-apply-filter');
    toggleButtonLoading(btn, true);
    if (btnTerapkan) btnTerapkan.disabled = true;

    const handleSuccess = (response) => {
        document.getElementById('analisis-loading').classList.add('hidden');
        document.getElementById('filter-loading').classList.add('hidden');
        toggleButtonLoading(btn, false);
        if (btnTerapkan) btnTerapkan.disabled = false;

        if (response.status === 'sukses') {
            if (isUjianMode) renderAnalisisUjian(response);
            else renderAnalisis(response);
            document.getElementById('analisis-results-container').classList.remove('hidden');
            if (!isFilterMode && response.availableSchools) renderFilterSekolah(response.availableSchools);
        } else {
            showToast(response.message, 'error');
        }
    };

    if (APPS_SCRIPT_URL === 'URL_WEB_APP_APPS_SCRIPT_DI_SINI') {
        setTimeout(() => {
            if (isUjianMode) {
                handleSuccess({
                    status: 'sukses',
                    kode_ujian: kode,
                    jumlahVarian: 2,
                    totalSubmissions: 5,
                    averageScore: 81.2,
                    availableSchools: ["Sekolah A", "Sekolah B"],
                    allStudentScores: [
                        { name: 'Budi', score: 90, school: "Sekolah A", noPeserta: "001", kode_soal: "DEV01" },
                        { name: 'Ani',  score: 75, school: "Sekolah A", noPeserta: "002", kode_soal: "DEV01" },
                        { name: 'Cici', score: 89, school: "Sekolah B", noPeserta: "003", kode_soal: "DEV01" },
                        { name: 'Dodi', score: 70, school: "Sekolah A", noPeserta: "004", kode_soal: "DEV02" },
                        { name: 'Evi',  score: 82, school: "Sekolah B", noPeserta: "005", kode_soal: "DEV02" }
                    ],
                    hasilPerSoal: [
                        {
                            status: 'sukses',
                            kode_soal: 'DEV01',
                            judul: 'Varian 1 (Mock)',
                            totalSubmissions: 3,
                            averageScore: 84.7,
                            studentScores: [
                                { name: 'Budi', score: 90, school: "Sekolah A", noPeserta: "001" },
                                { name: 'Ani', score: 75, school: "Sekolah A", noPeserta: "002" },
                                { name: 'Cici', score: 89, school: "Sekolah B", noPeserta: "003" }
                            ],
                            detail: [
                                { text: 'Soal 1', incorrectCount: 1, correctCount: 2, incorrectStudentNames: ['Ani'], correctStudentNames: ['Budi', 'Cici'] },
                                { text: 'Soal 2', incorrectCount: 2, correctCount: 1, incorrectStudentNames: ['Budi', 'Cici'], correctStudentNames: ['Ani'] }
                            ]
                        },
                        {
                            status: 'sukses',
                            kode_soal: 'DEV02',
                            judul: 'Varian 2 (Mock)',
                            totalSubmissions: 2,
                            averageScore: 76.0,
                            studentScores: [
                                { name: 'Dodi', score: 70, school: "Sekolah A", noPeserta: "004" },
                                { name: 'Evi', score: 82, school: "Sekolah B", noPeserta: "005" }
                            ],
                            detail: [
                                { text: 'Soal 1', incorrectCount: 1, correctCount: 1, incorrectStudentNames: ['Dodi'], correctStudentNames: ['Evi'] },
                                { text: 'Soal 2', incorrectCount: 1, correctCount: 1, incorrectStudentNames: ['Evi'], correctStudentNames: ['Dodi'] }
                            ]
                        }
                    ]
                });
            } else {
                handleSuccess({
                    status: 'sukses', judul: 'Ujian Mockup (Mode Dev)', totalSubmissions: 3, averageScore: 85.3,
                    studentScores: [
                        { name: 'Budi', score: 90, school: "Sekolah A", noPeserta: "001" },
                        { name: 'Ani', score: 75, school: "Sekolah A", noPeserta: "002" },
                        { name: 'Cici', score: 65, school: "Sekolah B", noPeserta: "003" }
                    ],
                    detail: [
                        { text: 'Soal 1', incorrectCount: 1, correctCount: 2, incorrectStudentNames: ['Ani'], correctStudentNames: ['Budi', 'Cici'], originalIndex: 0 },
                        { text: 'Soal 2', incorrectCount: 2, correctCount: 1, incorrectStudentNames: ['Budi', 'Cici'], correctStudentNames: ['Ani'], originalIndex: 1 }
                    ],
                    availableSchools: ["Sekolah A", "Sekolah B"]
                });
            }
        }, 1000);
    } else {
        const apiName = isUjianMode ? 'analisisHasilByKodeUjian' : 'analisisHasil';
        fetchAppsScriptAPI(apiName, kode, isFilterMode ? selectedSchools : null)
            .then(handleSuccess)
            .catch(err => {
                document.getElementById('analisis-loading').classList.add('hidden');
                document.getElementById('filter-loading').classList.add('hidden');
                toggleButtonLoading(btn, false);
                if (btnTerapkan) btnTerapkan.disabled = false;
                showToast('Terjadi kesalahan server.', 'error');
                console.error(err);
            });
    }
}

function renderAnalisisUjian(data) {
    const container = document.getElementById('analisis-results-container');
    const { kode_ujian, jumlahVarian, totalSubmissions, averageScore, hasilPerSoal, allStudentScores } = data;
    const hasilList = Array.isArray(hasilPerSoal) ? hasilPerSoal : [];

    // Bangun daftar terpadu dari backend (allStudentScores) atau fallback dari hasilPerSoal
    const unified = Array.isArray(allStudentScores) && allStudentScores.length > 0
        ? allStudentScores
        : hasilList.filter(h => h.status === 'sukses').flatMap(h =>
            (h.studentScores || []).map(s => ({ ...s, kode_soal: h.kode_soal }))
          );

    // Distribusi nilai
    const dist = { a: 0, b: 0, c: 0, d: 0 };
    unified.forEach(s => {
        if (s.score >= 90) dist.a++;
        else if (s.score >= 75) dist.b++;
        else if (s.score >= 60) dist.c++;
        else dist.d++;
    });
    const total = unified.length || 1;
    const passingCount = dist.a + dist.b + dist.c;
    const passingRate = total > 0 ? Math.round((passingCount / total) * 100) : 0;

    const distRows = [
        { label: '≥ 90 (Sangat Baik)', count: dist.a, color: 'bg-emerald-500' },
        { label: '75 – 89 (Baik)', count: dist.b, color: 'bg-blue-400' },
        { label: '60 – 74 (Cukup)', count: dist.c, color: 'bg-yellow-400' },
        { label: '< 60 (Perlu Perhatian)', count: dist.d, color: 'bg-red-400' },
    ].map(r => {
        const pct = total > 0 ? ((r.count / total) * 100).toFixed(0) : 0;
        return `<div class="flex items-center gap-3 text-sm">
            <span class="w-44 text-xs text-gray-600 shrink-0">${r.label}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div class="${r.color} h-5 rounded-full flex items-center justify-end pr-2 transition-all" style="width:${pct}%">
                    ${pct > 12 ? `<span class="text-white text-xs font-bold">${r.count}</span>` : ''}
                </div>
            </div>
            <span class="text-xs font-bold text-gray-500 w-16 text-right shrink-0">${pct}%${pct <= 12 && r.count > 0 ? ` (${r.count})` : ''}</span>
        </div>`;
    }).join('');

    let html = `
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-2">
            <h2 class="text-xl font-bold text-gray-800">Analisis Ujian: <span class="text-blue-600 font-mono">${kode_ujian}</span></h2>
            <button onclick="exportNilaiUjianXLS()" class="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition shadow-sm">
                <i class="fas fa-file-excel"></i> Export Semua Nilai
            </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-3">
                <div class="bg-blue-100 text-blue-600 p-2.5 rounded-full shrink-0"><i class="fas fa-users"></i></div>
                <div><p class="text-xs font-bold text-gray-500">Total Peserta</p><p class="text-2xl font-extrabold text-gray-800">${totalSubmissions}</p></div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-200 flex items-center gap-3">
                <div class="bg-yellow-100 text-yellow-600 p-2.5 rounded-full shrink-0"><i class="fas fa-chart-bar"></i></div>
                <div><p class="text-xs font-bold text-yellow-700">Rata-Rata</p><p class="text-2xl font-extrabold text-yellow-700">${averageScore}</p></div>
            </div>
            <div class="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200 flex items-center gap-3">
                <div class="bg-green-100 text-green-600 p-2.5 rounded-full shrink-0"><i class="fas fa-check-circle"></i></div>
                <div><p class="text-xs font-bold text-green-700">Kelulusan (≥60)</p><p class="text-2xl font-extrabold text-green-700">${passingRate}%</p></div>
            </div>
            <div class="bg-purple-50 p-4 rounded-xl shadow-sm border border-purple-200 flex items-center gap-3">
                <div class="bg-purple-100 text-purple-600 p-2.5 rounded-full shrink-0"><i class="fas fa-layer-group"></i></div>
                <div><p class="text-xs font-bold text-purple-700">Varian Soal</p><p class="text-2xl font-extrabold text-purple-700">${jumlahVarian}</p></div>
            </div>
        </div>

        <!-- Score Distribution -->
        <div class="bg-white p-4 rounded-xl shadow-sm border">
            <h3 class="font-bold text-gray-700 mb-3 text-sm">Distribusi Nilai</h3>
            <div class="space-y-2">${distRows}</div>
        </div>

        <!-- Unified Student Table -->
        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div class="flex flex-wrap items-center justify-between gap-2 p-4 border-b bg-gray-50">
                <h3 class="font-bold text-gray-700">Daftar Nilai Seluruh Peserta</h3>
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs text-gray-500 font-bold">Urutkan:</span>
                    <button data-ujian-sort="name"       class="sort-btn-ujian bg-blue-600 text-white    text-xs font-bold px-3 py-1.5 rounded-full">Nama</button>
                    <button data-ujian-sort="score_desc" class="sort-btn-ujian bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">Nilai ↓</button>
                    <button data-ujian-sort="score_asc"  class="sort-btn-ujian bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">Nilai ↑</button>
                    <button data-ujian-sort="school"     class="sort-btn-ujian bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">Sekolah</button>
                </div>
            </div>
            <div class="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table class="w-full text-sm">
                    <thead class="sticky top-0 bg-gray-100 z-10">
                        <tr class="text-left font-bold text-gray-600">
                            <th class="p-2 text-center w-10">No.</th>
                            <th class="p-2 border-l w-28">No. Peserta</th>
                            <th class="p-2 border-l">Nama Siswa</th>
                            <th class="p-2 border-l w-44">Asal Sekolah</th>
                            <th class="p-2 border-l w-24 text-center">Kode Soal</th>
                            <th class="p-2 border-l w-16 text-center">Nilai</th>
                        </tr>
                    </thead>
                    <tbody id="ujian-scores-tbody">${renderUjianStudentRows(unified)}</tbody>
                </table>
            </div>
        </div>

        <!-- Per-Varian Accordion (Detail Sekunder) -->
        <div>
            <h3 class="text-base font-bold text-gray-700 border-b pb-2 mb-3">Detail Per Varian Soal</h3>
            <div class="space-y-2">`;

    hasilList.forEach((h, idx) => {
        if (h.status !== 'sukses') {
            html += `<div class="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-exclamation-triangle"></i>
                <span class="font-mono">${h.kode_soal}</span>: ${h.message || 'Belum ada siswa yang mengerjakan.'}
            </div>`;
            return;
        }

        const panelId = `ujian-panel-${idx}`;
        const avgColor = parseFloat(h.averageScore) >= 70 ? 'text-green-600' : 'text-red-500';
        let hardest = { text: 'N/A', incorrectCount: -1 };
        (h.detail || []).forEach((item, i) => {
            if (item.incorrectCount > hardest.incorrectCount) hardest = { text: `#${i + 1}`, incorrectCount: item.incorrectCount };
        });

        html += `
        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
            <button onclick="toggleUjianPanel('${panelId}')" class="w-full p-3 text-left flex flex-wrap items-center justify-between gap-2 hover:bg-gray-50 transition text-sm">
                <div class="flex items-center gap-2">
                    <span class="bg-blue-100 text-blue-700 font-mono font-bold text-xs px-2 py-1 rounded">${h.kode_soal}</span>
                    <span class="font-semibold text-gray-700">${h.judul}</span>
                </div>
                <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span><i class="fas fa-users mr-1"></i>${h.totalSubmissions} peserta</span>
                    <span class="font-bold ${avgColor}">Rata-rata: ${h.averageScore}</span>
                    ${hardest.incorrectCount > 0 ? `<span class="text-red-500"><i class="fas fa-exclamation-circle mr-1"></i>Sulit: ${hardest.text}</span>` : ''}
                    <i class="fas fa-chevron-down text-gray-400 transition-transform duration-200" id="icon-${panelId}"></i>
                </div>
            </button>
            <div id="${panelId}" class="hidden border-t">
                <div class="p-4 space-y-2">
                    <h4 class="font-bold text-gray-500 text-xs uppercase tracking-wide mb-3">Rincian Per Butir Soal</h4>
                    ${(h.detail || []).map((item, i) => {
                        const tot = h.totalSubmissions || 1;
                        const incorrectPct = ((item.incorrectCount / tot) * 100).toFixed(0);
                        const correctPct   = ((item.correctCount   / tot) * 100).toFixed(0);
                        return `<div class="bg-gray-50 border rounded-lg p-3">
                            <div class="flex gap-2 items-start">
                                <span class="font-bold text-gray-400 text-sm shrink-0 w-6">#${i + 1}</span>
                                <div class="flex-1">
                                    <p class="text-sm text-gray-700 mb-2">${item.text || '<i>—</i>'}</p>
                                    <div class="flex justify-between text-xs font-bold mb-1"><span class="text-red-600">Salah: ${item.incorrectCount}</span><span class="text-green-600">Benar: ${item.correctCount}</span></div>
                                    <div class="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden"><div class="bg-red-400 h-3" style="width:${incorrectPct}%"></div><div class="bg-green-400 h-3" style="width:${correctPct}%"></div></div>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;

    // Simpan state global untuk sort & export
    window._ujianAnalisisData = hasilList;
    window._ujianAllStudents = unified;

    // Event listener untuk tombol sort tabel terpadu
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('.sort-btn-ujian');
        if (!btn || !window._ujianAllStudents) return;
        container.querySelectorAll('.sort-btn-ujian').forEach(b => {
            b.classList.remove('bg-blue-600', 'text-white');
            b.classList.add('bg-gray-200', 'text-gray-700');
        });
        btn.classList.add('bg-blue-600', 'text-white');
        btn.classList.remove('bg-gray-200', 'text-gray-700');
        let sorted = [...window._ujianAllStudents];
        const s = btn.dataset.ujianSort;
        if (s === 'name')       sorted.sort((a, b) => a.name.localeCompare(b.name));
        else if (s === 'score_desc') sorted.sort((a, b) => b.score - a.score);
        else if (s === 'score_asc')  sorted.sort((a, b) => a.score - b.score);
        else if (s === 'school')     sorted.sort((a, b) => (a.school || '').localeCompare(b.school || ''));
        const tbody = document.getElementById('ujian-scores-tbody');
        if (tbody) tbody.innerHTML = renderUjianStudentRows(sorted);
    });
}

function renderUjianStudentRows(list) {
    if (!list || list.length === 0) return '<tr><td colspan="6" class="text-center p-4 text-gray-400">Belum ada data nilai</td></tr>';
    return list.map((s, i) => {
        const c = s.score >= 90 ? 'text-emerald-600' : s.score >= 75 ? 'text-green-600' : s.score >= 60 ? 'text-yellow-600' : 'text-red-600';
        return `<tr class="border-b last:border-0 hover:bg-gray-50">
            <td class="p-2 text-center text-gray-400">${i + 1}</td>
            <td class="p-2 font-mono text-xs text-center border-l">${s.noPeserta || '-'}</td>
            <td class="p-2 font-semibold border-l">${s.name}</td>
            <td class="p-2 text-xs text-gray-500 border-l">${s.school || '-'}</td>
            <td class="p-2 text-center border-l"><span class="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">${s.kode_soal || '-'}</span></td>
            <td class="p-2 text-center font-bold text-lg border-l ${c}">${s.score}</td>
        </tr>`;
    }).join('');
}

function exportNilaiUjianXLS() {
    const list = window._ujianAllStudents;
    if (!list || list.length === 0) return showToast("Tidak ada data untuk diekspor", "error");

    const esc = str => String(str || '-').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>table{border-collapse:collapse}th{font-weight:bold;background:#f3f4f6;border:1px solid #000;padding:5px}td{border:1px solid #000;padding:5px}.center{text-align:center}.text{mso-number-format:"\\@"}</style></head><body><table><thead><tr><th>No</th><th>No Peserta</th><th>Nama Siswa</th><th>Asal Sekolah</th><th>Kode Soal</th><th>Nilai</th></tr></thead><tbody>`;
    list.forEach((s, i) => {
        tableHtml += `<tr><td class="center">${i + 1}</td><td class="text">${esc(s.noPeserta)}</td><td>${esc(s.name)}</td><td>${esc(s.school)}</td><td>${esc(s.kode_soal)}</td><td class="center">${s.score || 0}</td></tr>`;
    });
    tableHtml += `</tbody></table></body></html>`;

    const kodeUjian = (document.getElementById('kode-ujian-analisis')?.value || 'UJIAN').trim().toUpperCase();
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Nilai_${kodeUjian}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Berhasil mengekspor data ke Excel!", "success");
}

function toggleUjianPanel(panelId) {
    const panel = document.getElementById(panelId);
    const icon  = document.getElementById('icon-' + panelId);
    if (!panel) return;
    panel.classList.toggle('hidden');
    if (icon) icon.classList.toggle('rotate-180');
}

function renderFilterSekolah(schools) {
    const container = document.getElementById('filter-sekolah-container');
    const checkboxContainer = document.getElementById('school-checkboxes');
    if (!schools || schools.length === 0) return;
    container.classList.remove('hidden');
    let html = '';
    schools.forEach(school => {
        html += `<label class="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition"><input type="checkbox" value="${school}" class="school-filter-checkbox w-4 h-4 text-blue-600 rounded bg-white focus:ring-blue-500" checked><span class="text-gray-700 font-medium">${school}</span></label>`;
    });
    checkboxContainer.innerHTML = html;
}

function setAllSchoolFilters(checked) {
    document.querySelectorAll('.school-filter-checkbox').forEach(cb => {
        cb.checked = checked;
    });
}

function getSelectedSchools() {
    return Array.from(document.querySelectorAll('.school-filter-checkbox:checked')).map(cb => cb.value);
}

function renderAnalisis(data) {
    currentAnalysisData = { ...data, detail: data.detail.map((item, index) => ({ ...item, originalIndex: index })) };
    const container = document.getElementById('analisis-results-container');
    const { judul, totalSubmissions, detail, averageScore, studentScores } = currentAnalysisData;

    let hardestQuestion = { text: 'N/A', incorrectCount: -1 };
    let easiestQuestion = { text: 'N/A', correctCount: -1 };
    detail.forEach((item) => {
        if (item.incorrectCount > hardestQuestion.incorrectCount) hardestQuestion = { text: `Soal #${item.originalIndex + 1}`, incorrectCount: item.incorrectCount };
        if (item.correctCount >= easiestQuestion.correctCount) easiestQuestion = { text: `Soal #${item.originalIndex + 1}`, correctCount: item.correctCount };
    });

    let html = `
        <h2 class="text-xl font-bold text-gray-800">Hasil Analisis: <span class="text-blue-600">${judul}</span></h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4"><div class="bg-blue-100 text-blue-600 p-3 rounded-full"><i class="fas fa-users text-xl"></i></div><div><p class="text-sm font-bold text-gray-500">Total Pengerjaan</p><p class="text-2xl font-extrabold text-gray-800">${totalSubmissions}</p></div></div>
             <div class="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-200 flex items-center gap-4"><div class="bg-yellow-100 text-yellow-600 p-3 rounded-full"><i class="fas fa-star-half-alt text-xl"></i></div><div><p class="text-sm font-bold text-yellow-800">Rata-Rata Kelas</p><p class="text-2xl font-extrabold text-yellow-700">${averageScore}</p></div></div>
            <div class="bg-red-50 p-4 rounded-xl shadow-sm border border-red-200 flex items-center gap-4"><div class="bg-red-100 text-red-600 p-3 rounded-full"><i class="fas fa-exclamation-triangle text-xl"></i></div><div><p class="text-sm font-bold text-red-800">Soal Paling Sulit</p><p class="text-xl font-extrabold text-red-700">${hardestQuestion.text}</p><p class="text-xs text-red-600">${hardestQuestion.incorrectCount} siswa salah</p></div></div>
            <div class="bg-green-50 p-4 rounded-xl shadow-sm border border-green-200 flex items-center gap-4"><div class="bg-green-100 text-green-600 p-3 rounded-full"><i class="fas fa-check-circle text-xl"></i></div><div><p class="text-sm font-bold text-green-800">Soal Paling Mudah</p><p class="text-xl font-extrabold text-green-700">${easiestQuestion.text}</p><p class="text-xs text-green-600">${easiestQuestion.correctCount} siswa benar</p></div></div>
        </div>

        <div class="mt-8">
             <div class="flex items-center justify-between border-b pb-2">
                 <h3 class="text-lg font-bold text-gray-700">Daftar Nilai Siswa</h3>
                 <div class="flex items-center gap-2">
                     <button id="btn-export-xls" class="bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition shadow-sm" onclick="exportNilaiXLS()"><i class="fas fa-file-excel"></i> <span class="hidden sm:inline">Export Excel</span></button>
                     <button id="btn-toggle-scores" class="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"><span>Tampilkan</span> <i class="fas fa-chevron-down transform transition-transform"></i></button>
                 </div>
            </div>
            <div id="student-scores-container" class="hidden mt-4 bg-white p-4 rounded-lg shadow-sm border max-h-96 overflow-y-auto">
                <div id="sort-controls-nilai" class="flex items-center gap-2 text-xs font-bold mb-4 pb-3 border-b"><span class="text-gray-500">Urutkan:</span>
                    <button data-sort="name" class="sort-btn-nilai bg-blue-600 text-white px-3 py-1 rounded-full">Nama (A-Z)</button>
                    <button data-sort="score_desc" class="sort-btn-nilai bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Nilai Tertinggi</button>
                    <button data-sort="score_asc" class="sort-btn-nilai bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Nilai Terendah</button>
                </div>
                <table class="w-full text-sm">
                    <thead>
                       <tr class="text-left font-bold text-gray-600 bg-gray-50">
                            <th class="p-2 w-12 text-center">No.</th>
                            <th class="p-2 w-32 border-l">No. Peserta</th>
                            <th class="p-2 border-l">Nama Siswa</th>
                            <th class="p-2 w-48 border-l">Asal Sekolah</th>
                            <th class="p-2 w-20 text-center border-l">Nilai</th>
                            <th class="p-2 w-16 text-center border-l"><i class="fas fa-shield-alt text-gray-400" title="Keamanan & Aktivitas"></i></th>
                       </tr>
                    </thead>
                    <tbody id="student-scores-tbody">${renderStudentScores(studentScores)}</tbody>
                </table>
            </div>
        </div>

        <div class="mt-8">
            <div class="flex items-center justify-between border-b pb-2">
                 <h3 class="text-lg font-bold text-gray-700">Rincian Per Butir Soal</h3>
                 <div id="sort-controls-butir" class="flex items-center gap-2 text-xs font-bold"><span class="text-gray-500">Urutkan:</span>
                    <button data-sort="default" class="sort-btn-butir bg-blue-600 text-white px-3 py-1 rounded-full">Nomor Soal</button>
                    <button data-sort="sulit" class="sort-btn-butir bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Paling Sulit</button>
                    <button data-sort="mudah" class="sort-btn-butir bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Paling Mudah</button>
                 </div>
            </div>
            <div id="analisis-detail-list" class="space-y-4 mt-4">${renderAnalisisDetailList(detail)}</div>
        </div>`;

    container.innerHTML = html;
    addAnalysisEventListeners();
}

function renderAnalisisDetailList(detailList) {
    const totalSubmissions = currentAnalysisData ? currentAnalysisData.totalSubmissions : 1;
    return detailList.map(item => {
        const incorrectPct = totalSubmissions > 0 ? (item.incorrectCount / totalSubmissions) * 100 : 0;
        const correctPct = totalSubmissions > 0 ? (item.correctCount / totalSubmissions) * 100 : 0;
        return `
            <div class="bg-white p-4 rounded-lg shadow-sm border">
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="font-bold text-gray-500 text-lg">#${item.originalIndex + 1}</div>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800 mb-3">${item.text || '<i>Teks soal tidak tersedia.</i>'}</p>
                        <div class="mb-1 flex justify-between text-xs font-bold"><span class="text-red-600">Salah: ${item.incorrectCount} siswa</span><span class="text-green-600">Benar: ${item.correctCount} siswa</span></div>
                        <div class="w-full bg-gray-200 rounded-full h-4 flex overflow-hidden"><div class="bg-red-500 h-4" style="width: ${incorrectPct}%"></div><div class="bg-green-500 h-4" style="width: ${correctPct}%"></div></div>
                    </div>
                    <div class="shrink-0 self-center flex flex-col md:flex-row gap-2">
                        <button ${!item.incorrectCount ? 'disabled' : ''} onclick="toggleSiswaList(this, 'salah')" class="text-xs font-bold py-2 px-3 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center">Lihat Salah (${item.incorrectCount}) <i class="fas fa-chevron-down ml-1 text-red-500 transition-transform"></i></button>
                        <button ${!item.correctCount ? 'disabled' : ''} onclick="toggleSiswaList(this, 'benar')" class="text-xs font-bold py-2 px-3 rounded-lg bg-green-100 hover:bg-green-200 text-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center">Lihat Benar (${item.correctCount}) <i class="fas fa-chevron-down ml-1 text-green-500 transition-transform"></i></button>
                    </div>
                </div>
                <div class="hidden siswa-list siswa-list-salah mt-3 pt-3 border-t bg-red-50 p-3 rounded-lg max-h-48 overflow-y-auto">${item.incorrectCount ? `<ul class="list-disc list-inside text-sm text-gray-600 space-y-1">${item.incorrectStudentNames.map(n => `<li>${n}</li>`).join('')}</ul>` : '<p class="text-sm text-gray-500">--</p>'}</div>
                <div class="hidden siswa-list siswa-list-benar mt-3 pt-3 border-t bg-green-50 p-3 rounded-lg max-h-48 overflow-y-auto">${item.correctCount ? `<ul class="list-disc list-inside text-sm text-gray-600 space-y-1">${item.correctStudentNames.map(n => `<li>${n}</li>`).join('')}</ul>` : '<p class="text-sm text-gray-500">--</p>'}</div>
            </div>`;
    }).join('');
}

function renderStudentScores(scoresList) {
    if (!scoresList || scoresList.length === 0) return '<tr><td colspan="6" class="text-center p-4 text-gray-400">Belum ada data nilai</td></tr>';
    return scoresList.map((student, index) => {
        const score = student.score;
        let scoreColorClass = score < 70 ? 'text-red-600' : score <= 79 ? 'text-yellow-600' : 'text-green-600';
        const logDataStr = encodeURIComponent(JSON.stringify(student.logAktivitas || {}));
        const logWarningIcon = (student.logAktivitas && (student.logAktivitas.percobaanCurang > 0 || student.logAktivitas.pindahTab > 0)) ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>` : '';
        return `
        <tr class="border-b last:border-0 hover:bg-gray-50 border-gray-200">
            <td class="p-2 text-center text-gray-500">${index + 1}</td>
            <td class="p-2 font-mono text-gray-600 text-xs text-center border-l bg-gray-50/50">${student.noPeserta || '-'}</td>
            <td class="p-2 font-semibold text-gray-800 border-l">${student.name}</td>
            <td class="p-2 text-gray-600 text-xs border-l break-words"><i class="fas fa-school text-sd-primary opacity-50 mr-1"></i> ${student.school}</td>
            <td class="p-2 text-center font-bold text-lg border-l bg-gray-50/50 ${scoreColorClass}">${score}</td>
            <td class="p-2 text-center relative border-l"><button onclick="showSiswaActivityLog('${student.name}', '${logDataStr}')" class="bg-white hover:bg-blue-50 text-blue-600 text-xs px-2 py-1.5 rounded-lg border border-blue-200 shadow-sm transition relative">Log ${logWarningIcon}</button></td>
        </tr>`;
    }).join('');
}

function showSiswaActivityLog(studentName, encodedLogData) {
    const modal = document.getElementById('layer-activity-log');
    if (!modal) return;
    document.getElementById('log-siswa-name').innerText = studentName;
    let logData = { pindahTab: 0, percobaanCurang: 0, waktuPerSoal: {} };
    try { logData = JSON.parse(decodeURIComponent(encodedLogData)); } catch (e) { }

    document.getElementById('log-blur-count').innerText = logData.pindahTab || 0;
    document.getElementById('log-cheat-count').innerText = logData.percobaanCurang || 0;

    const times = logData.waktuPerSoal || {};
    let listHtml = '', totalSeconds = 0;
    const keys = Object.keys(times).map(k => parseInt(k)).sort((a, b) => a - b);
    if (keys.length === 0) {
        listHtml = '<li class="text-gray-500 text-sm italic">Belum ada rekaman waktu tersimpan.</li>';
    } else {
        keys.forEach(k => {
            const sec = times[k]; totalSeconds += sec;
            const m = Math.floor(sec / 60), s = sec % 60;
            listHtml += `<li class="flex justify-between py-1 border-b last:border-0 text-gray-600 text-sm"><span>Soal #${k + 1}</span> <span class="font-bold text-gray-800">${m > 0 ? `${m}m ${s}s` : `${s} detik`}</span></li>`;
        });
        const totalM = Math.floor(totalSeconds / 60), totalS = totalSeconds % 60;
        listHtml += `<li class="flex justify-between py-2 mt-2 border-t border-gray-300 text-gray-800 text-sm font-extrabold"><span>Total Terukur</span> <span>${totalM > 0 ? totalM + 'm ' : ''}${totalS} detik</span></li>`;
    }
    document.getElementById('log-time-list').innerHTML = listHtml;
    modal.classList.remove('hidden');
}

function closeSiswaActivityLog() { document.getElementById('layer-activity-log').classList.add('hidden'); }

function addAnalysisEventListeners() {
    const sortButirContainer = document.getElementById('sort-controls-butir');
    if (sortButirContainer) {
        sortButirContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.sort-btn-butir');
            if (!button || !currentAnalysisData) return;
            sortButirContainer.querySelectorAll('.sort-btn-butir').forEach(btn => { btn.classList.remove('bg-blue-600', 'text-white'); btn.classList.add('bg-gray-200', 'text-gray-700'); });
            button.classList.add('bg-blue-600', 'text-white'); button.classList.remove('bg-gray-200', 'text-gray-700');
            let sortedDetail = [...currentAnalysisData.detail];
            const sortType = button.dataset.sort;
            if (sortType === 'sulit') sortedDetail.sort((a, b) => b.incorrectCount - a.incorrectCount);
            else if (sortType === 'mudah') sortedDetail.sort((a, b) => b.correctCount - a.correctCount);
            else sortedDetail.sort((a, b) => a.originalIndex - b.originalIndex);
            document.getElementById('analisis-detail-list').innerHTML = renderAnalisisDetailList(sortedDetail);
        });
    }

    const toggleScoresBtn = document.getElementById('btn-toggle-scores');
    if (toggleScoresBtn) {
        toggleScoresBtn.addEventListener('click', () => {
            const container = document.getElementById('student-scores-container');
            const icon = toggleScoresBtn.querySelector('i');
            container.classList.toggle('hidden'); icon.classList.toggle('rotate-180');
            const textSpan = toggleScoresBtn.querySelector('span');
            if (textSpan) textSpan.innerText = container.classList.contains('hidden') ? 'Tampilkan' : 'Sembunyikan';
        });
    }

    const sortNilaiContainer = document.getElementById('sort-controls-nilai');
    if (sortNilaiContainer) {
        sortNilaiContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.sort-btn-nilai');
            if (!button || !currentAnalysisData) return;
            sortNilaiContainer.querySelectorAll('.sort-btn-nilai').forEach(btn => { btn.classList.remove('bg-blue-600', 'text-white'); btn.classList.add('bg-gray-200', 'text-gray-700'); });
            button.classList.add('bg-blue-600', 'text-white');
            let sortedScoresObj = [...currentAnalysisData.studentScores];
            const sortType = button.dataset.sort;
            if (sortType === 'name') sortedScoresObj.sort((a, b) => a.name.localeCompare(b.name));
            else if (sortType === 'score_desc') sortedScoresObj.sort((a, b) => b.score - a.score);
            else if (sortType === 'score_asc') sortedScoresObj.sort((a, b) => a.score - b.score);
            document.getElementById('student-scores-tbody').innerHTML = renderStudentScores(sortedScoresObj);
        });
    }
}

function toggleSiswaList(button, type) {
    const itemContainer = button.closest('.border');
    const listContainer = itemContainer.querySelector(`.siswa-list-${type}`);
    const icon = button.querySelector('i');
    if (listContainer) { listContainer.classList.toggle('hidden'); icon.classList.toggle('rotate-180'); }
}
