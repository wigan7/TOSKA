// ===== LOGIC SISWA: UJIAN, TIMER, SUBMIT, SECURITY =====

// --- NAVIGASI PANEL ---
function openNavPanel() {
    const container = document.getElementById('nav-grid-container');
    const summary = document.getElementById('nav-summary-text');
    const panel = document.getElementById('layer-nav-panel');
    const panelContent = document.getElementById('nav-panel-content');

    const answeredCount = questions.filter((_, idx) => {
        const ans = studentAnswers[idx];
        if (Array.isArray(ans)) return ans.length > 0;
        if (typeof ans === 'object' && ans !== null) return Object.keys(ans).length > 0;
        return ans !== undefined && ans !== null;
    }).length;

    summary.innerText = `Terjawab: ${answeredCount} dari ${questions.length} soal.`;
    container.innerHTML = '';

    questions.forEach((_, index) => {
        const ans = studentAnswers[index];
        const isAnswered = (Array.isArray(ans) && ans.length > 0) || (typeof ans === 'object' && ans !== null && Object.keys(ans).length > 0) || (typeof ans === 'number');
        let stateClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
        if (isAnswered) stateClass = 'bg-white border-2 border-green-500 text-green-600 font-bold hover:bg-green-50';
        if (index === currentQuestionIndex) stateClass = 'bg-sd-primary text-white font-extrabold ring-2 ring-offset-2 ring-sd-dark';
        const btn = document.createElement('button');
        btn.className = `w-12 h-12 rounded-full flex items-center justify-center text-lg transition transform active:scale-90 ${stateClass}`;
        btn.innerText = index + 1;
        btn.onclick = () => jumpToQuestion(index);
        container.appendChild(btn);
    });

    panel.classList.remove('hidden');
    setTimeout(() => { panel.classList.add('panel-enter-active'); panelContent.classList.add('panel-content-enter-active'); }, 10);
}

function closeNavPanel() {
    const panel = document.getElementById('layer-nav-panel');
    const panelContent = document.getElementById('nav-panel-content');
    panel.classList.remove('panel-enter-active');
    panelContent.classList.remove('panel-content-enter-active');
    setTimeout(() => panel.classList.add('hidden'), 250);
}

function jumpToQuestion(index) {
    currentQuestionIndex = index;
    renderQuestion();
    closeNavPanel();
}

// --- UJIAN & TIMER ---
function isQuestion(item) { return item && ['pg', 'pgk', 'bs'].includes(item.tipe); }

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function isOptionEmpty(op) {
    const hasText = op.text && op.text.trim() !== '';
    let hasImg = false;
    if (op.img) {
        if (typeof op.img === 'string' && op.img.trim() !== '') hasImg = true;
        else if (typeof op.img === 'object' && op.img !== null && (op.img.src || op.img.url)) hasImg = true;
    }
    return !hasText && !hasImg;
}

function buildShuffleMap(questionsArr) {
    shuffledOptionsMap = {};
    questionsArr.forEach((q, qIdx) => {
        if (q.tipe === 'pg' || q.tipe === 'pgk') {
            const opsi = q.opsi || [];
            const validIndices = [];
            opsi.forEach((op, idx) => { if (!isOptionEmpty(op)) validIndices.push(idx); });
            shuffledOptionsMap[qIdx] = shuffleArray(validIndices);
        }
    });
}

async function mulaiUjian() {
    const nama = document.getElementById('siswa-nama').value;
    const kelas = document.getElementById('siswa-kelas').value;
    const sekolah = document.getElementById('siswa-sekolah').value;
    const noPeserta = document.getElementById('siswa-no-peserta').value;
    const kodeUjian = (document.getElementById('siswa-kode-ujian')?.value || '').trim().toUpperCase();
    const kodeSoal = (document.getElementById('siswa-kode')?.value || '').trim().toUpperCase();

    if (!nama || !kelas || !sekolah || !noPeserta) return showToast("Lengkapi semua data diri!", 'error');
    if (!kodeUjian && !kodeSoal) return showToast("Isi Kode Ujian atau Kode Soal!", 'error');

    const btn = document.getElementById('btn-mulai-ujian');
    toggleButtonLoading(btn, true);

    function handleExamData(data, resolvedKode, kodeUjianAwal = '') {
        // Simpan kode soal yang sudah diresolved ke input siswa-kode agar
        // saveProgressToLocal() dan submitExam() dapat membacanya dengan benar.
        document.getElementById('siswa-kode').value = resolvedKode;

        // Reset submit state in case user starts a new exam session without full reload.
        isSubmitting = false;
        isExamSubmitted = false;
        const submitLayer = document.getElementById('layer-submit-loading');
        if (submitLayer) submitLayer.classList.add('hidden');
        const finishBtn = document.getElementById('btn-finish');
        if (finishBtn) finishBtn.disabled = false;

        examItems = data.soal;
        questions = examItems.map((item, index) => ({ ...item, originalIndex: index })).filter(isQuestion);
        currentScoringConfig = normalizeScoringConfig(data.scoring || DEFAULT_SCORING_CONFIG);
        currentExamData = data;
        buildShuffleMap(questions);
        currentQuestionIndex = 0;

        const saveKey = `tos_answers_${resolvedKode}_${noPeserta}`;
        let savedDataStr = localStorage.getItem(saveKey);
        
        // If using exam code (kodeUjianAwal), also check fallback key with exam code
        // untuk recovery jawaban saat soal acak berubah
        if (!savedDataStr && kodeUjianAwal && kodeUjianAwal !== resolvedKode) {
            const fallbackKey = `tos_answers_${kodeUjianAwal}_${noPeserta}`;
            savedDataStr = localStorage.getItem(fallbackKey);
        }
        
        if (savedDataStr) {
            try {
                const parsedData = JSON.parse(savedDataStr);
                studentAnswers = parsedData.answers || {};
                activityLogs = parsedData.logs || { pindahTab: 0, percobaanCurang: 0, waktuPerSoal: {} };
                showToast(`Selamat datang kembali! Memulihkan jawaban sebelumnya...`, 'info');
            } catch (e) {
                studentAnswers = {}; activityLogs = { pindahTab: 0, percobaanCurang: 0, waktuPerSoal: {} };
            }
        } else {
            studentAnswers = {}; activityLogs = { pindahTab: 0, percobaanCurang: 0, waktuPerSoal: {} };
        }

        document.getElementById('exam-title-display').innerText = data.judul;
        document.getElementById('student-name-display').innerText = nama;
        cleanupObsoleteTimerKeys(resolvedKode, noPeserta, nama);
        initTimer(data.durasi, resolvedKode, nama);
        navTo('layer-siswa-exam');
        renderQuestion();
    }

    if (APPS_SCRIPT_URL === 'URL_WEB_APP_APPS_SCRIPT_DI_SINI') {
        // Mode dev: prioritaskan kode_soal, fallback ke kode_ujian
        const kodeToTry = kodeSoal || kodeUjian;
        setTimeout(() => {
            const mockData = localStorage.getItem('tos_mock_db_' + kodeToTry);
            toggleButtonLoading(btn, false);
            if (mockData) { const parsed = JSON.parse(mockData); handleExamData({ judul: parsed.judul, durasi: parsed.durasi || 60, soal: parsed.konten, scoring: parsed.scoring }, kodeToTry, ''); }
            else { showToast("Kode tidak ditemukan.", 'error'); }
        }, 500);
    } else {
        try {
            if (kodeSoal) {
                // Siswa input kode soal → ambil soal spesifik
                const response = await fetchAppsScriptAPI('ambilSoalSiswa', kodeSoal);
                if (response.status === 'sukses') {
                    handleExamData({ judul: response.judul, durasi: response.durasi || 90, soal: response.konten, scoring: response.scoring }, kodeSoal, '');
                } else {
                    showToast(response.message || "Kode Soal Tidak Ditemukan!", 'error');
                }
            } else {
                // Siswa input kode ujian → ambil soal acak dalam kelompok ujian
                const response = await fetchAppsScriptAPI('ambilSoalByKodeUjian', kodeUjian, noPeserta);
                if (response.status === 'sukses') {
                    const resolvedKode = response.kode_soal_dipilih || kodeUjian;
                    handleExamData({ judul: response.judul, durasi: response.durasi || 90, soal: response.konten, scoring: response.scoring }, resolvedKode, kodeUjian);
                } else {
                    showToast(response.message || "Kode Ujian Tidak Ditemukan!", 'error');
                }
            }
        } catch (err) {
            const message = err && err.message ? err.message : 'Terjadi kesalahan server.';
            showToast(message, 'error');
            console.error(err);
        } finally {
            toggleButtonLoading(btn, false);
        }
    }
}

function initTimer(durationMinutes, kode, nama) {
    const noPeserta = String(document.getElementById('siswa-no-peserta')?.value || '').trim().toUpperCase();
    const namaNormalized = String(nama || '').trim().toUpperCase();
    const kodeNormalized = String(kode || '').trim().toUpperCase();
    const durationSec = Math.max(1, Math.floor(Number(durationMinutes) * 60) || 0);
    const sessionKey = `tos_timer_${kodeNormalized}_${noPeserta}`;
    const legacyKey = `tos_timer_${kodeNormalized}_${namaNormalized}`;

    clearInterval(timerInterval);

    const now = Math.floor(Date.now() / 1000);
    let timerState = null;

    try {
        const raw = localStorage.getItem(sessionKey);
        if (raw) timerState = JSON.parse(raw);
    } catch (e) {
        timerState = null;
    }

    if (!timerState) {
        const legacyRaw = localStorage.getItem(legacyKey);
        const legacyEnd = Number(legacyRaw);
        if (Number.isFinite(legacyEnd) && legacyEnd > now) {
            timerState = {
                endTime: legacyEnd,
                startedAt: now,
                durationSec: durationSec,
                kode: kodeNormalized,
                noPeserta: noPeserta
            };
        }
    }

    if (!timerState || typeof timerState !== 'object') {
        timerState = {
            endTime: now + durationSec,
            startedAt: now,
            durationSec: durationSec,
            kode: kodeNormalized,
            noPeserta: noPeserta
        };
    }

    const parsedEndTime = Number(timerState.endTime);
    const isIdentityMismatch = String(timerState.kode || '') !== kodeNormalized || String(timerState.noPeserta || '') !== noPeserta;
    if (!Number.isFinite(parsedEndTime) || parsedEndTime <= now || isIdentityMismatch) {
        timerState = {
            endTime: now + durationSec,
            startedAt: now,
            durationSec: durationSec,
            kode: kodeNormalized,
            noPeserta: noPeserta
        };
    }

    localStorage.setItem(sessionKey, JSON.stringify(timerState));
    localStorage.removeItem(legacyKey);

    const verifyExpiryAndSubmit = () => {
        if (isSubmitting || isExamSubmitted) return;
        setTimeout(() => {
            if (isSubmitting || isExamSubmitted) return;
            const currentNow = Math.floor(Date.now() / 1000);
            const recheckRemaining = Number(timerState.endTime) - currentNow;
            if (recheckRemaining <= 0) {
                clearInterval(timerInterval);
                document.getElementById('timer').innerText = "00:00";
                timeRemainingSeconds = 0;
                localStorage.removeItem(sessionKey);
                showToast("Waktu Habis! Jawaban dikirim otomatis.", 'info');
                submitExam(true);
            }
        }, 1500);
    };

    const update = () => {
        const remaining = Number(timerState.endTime) - Math.floor(Date.now() / 1000);
        timeRemainingSeconds = Math.max(0, remaining);
        if (remaining <= 0) {
            verifyExpiryAndSubmit();
        } else {
            updateTimerDisplay(remaining);
            const container = document.getElementById('timer-container');
            if (remaining < 300 && !container.classList.contains('bg-red-100')) {
                container.classList.add('bg-red-100', 'text-red-600', 'animate-pulse-fast', 'border-red-500');
                container.classList.remove('bg-sd-light', 'text-sd-dark');
            }
        }
    };
    update();
    timerInterval = setInterval(update, 1000);
}

function cleanupObsoleteTimerKeys(kode, noPeserta, nama) {
    const kodeNormalized = String(kode || '').trim().toUpperCase();
    const noPesertaNormalized = String(noPeserta || '').trim().toUpperCase();
    const namaNormalized = String(nama || '').trim().toUpperCase();
    if (!noPesertaNormalized) return;

    const currentKey = `tos_timer_${kodeNormalized}_${noPesertaNormalized}`;
    const currentLegacyKey = `tos_timer_${kodeNormalized}_${namaNormalized}`;

    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith('tos_timer_')) continue;
        if (key === currentKey || key === currentLegacyKey) continue;

        // Housekeeping: hapus timer milik peserta yang sama pada kode soal lain.
        if (key.endsWith(`_${noPesertaNormalized}`)) {
            localStorage.removeItem(key);
            continue;
        }

        // Hapus juga key legacy berbasis nama agar collision lama tidak muncul lagi.
        if (namaNormalized && key.endsWith(`_${namaNormalized}`)) {
            localStorage.removeItem(key);
        }
    }
}

function updateTimerDisplay(seconds) {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    document.getElementById('timer').innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function recordTimeSpent() {
    if (questionStartTime > 0 && currentQuestionIndex >= 0) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        activityLogs.waktuPerSoal[currentQuestionIndex] = (activityLogs.waktuPerSoal[currentQuestionIndex] || 0) + timeSpent;
    }
}

function renderStudentImg(imgData, defaultMaxH = 256) {
    if (!imgData) return '';
    let src = imgData, scale = 1;
    if (typeof imgData === 'object' && imgData !== null) { src = imgData.src || imgData.url || ''; scale = imgData.scale || 1; }
    else if (typeof imgData === 'string' && imgData.startsWith('{')) {
        try { const parsed = JSON.parse(imgData); src = parsed.src || parsed.url || ''; scale = parsed.scale || 1; } catch (e) { }
    }
    if (!src) return '';
    return `<div class="overflow-x-auto w-full my-4 hide-scrollbar"><img src="${src}" class="rounded-xl mx-auto shadow-md border block" style="height: ${defaultMaxH * scale}px; width: auto; max-width: none;" /></div>`;
}

function renderQuestion() {
    const area = document.getElementById('question-display-area');
    if (questions.length === 0) { area.innerHTML = `<div class="text-center p-8 bg-white rounded-lg shadow">Ujian ini tidak memiliki soal.</div>`; return; }
    const q = questions[currentQuestionIndex];
    document.getElementById('btn-prev').disabled = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    document.getElementById('btn-next').classList.toggle('hidden', isLastQuestion);
    const btnFinish = document.getElementById('btn-finish');
    btnFinish.classList.toggle('hidden', !isLastQuestion);
    // Reset isSubmitting jika bukan sedang submit, agar tombol bisa aktif di soal terakhir
    if (!isLastQuestion) {
        isSubmitting = false;
    }
    btnFinish.disabled = !isLastQuestion || isSubmitting;
    document.getElementById('question-indicator').innerText = `${currentQuestionIndex + 1} / ${questions.length}`;
    document.getElementById('scrollable-content').scrollTo(0, 0);
    questionStartTime = Date.now();

    let activePassageData = null;
    if (q.originalIndex > 0) {
        for (let i = q.originalIndex - 1; i >= 0; i--) {
            const item = examItems[i];
            if (item.tipe === 'bacaan') {
                const questionsInRange = examItems.slice(i + 1, q.originalIndex + 1).filter(isQuestion).length;
                if (questionsInRange <= item.untuk) { activePassageData = item; break; }
            }
        }
    }

    let passageHtml = activePassageData ? `<div class="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 max-h-72 overflow-y-auto"> <h4 class="font-bold text-sm text-gray-500 mb-2 uppercase tracking-wider"><i class="fas fa-book-open mr-2"></i>Teks Bacaan</h4> ${activePassageData.img ? `<div class="mb-4">${renderStudentImg(activePassageData.img, 192)}</div>` : ''} <div class="prose prose-sm max-w-none whitespace-pre-wrap">${activePassageData.text}</div> </div>` : '';

    let questionHtml = `<div class="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-100 question-card animate-pop min-h-[50vh]"> <div class="flex justify-between items-start mb-4"> <span class="inline-block bg-sd-light text-sd-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-sd-primary"> Soal ${currentQuestionIndex + 1}: ${q.tipe === 'pg' ? 'Pilihan Ganda' : q.tipe === 'pgk' ? 'Pilihan Kompleks' : 'Benar / Salah'} </span> </div> <h3 class="text-lg md:text-xl font-bold text-gray-800 mb-6 whitespace-pre-wrap leading-relaxed">${q.text}</h3> ${q.img ? `<div class="mb-6">${renderStudentImg(q.img, 256)}</div>` : ''} <div class="space-y-3">`;

    if (q.tipe === 'pg') {
        const savedAns = studentAnswers[currentQuestionIndex];
        const displayOrder = shuffledOptionsMap[currentQuestionIndex] || (q.opsi || []).map((_, i) => i);
        questionHtml += displayOrder.map(origIdx => {
            const op = q.opsi[origIdx], isChecked = savedAns === origIdx;
            const borderClass = isChecked ? 'border-sd-primary bg-sd-light ring-2 ring-sd-primary ring-opacity-50' : 'border-gray-200 hover:bg-gray-50';
            return `<label class="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${borderClass} group no-select" onclick="saveAnswer(${origIdx})"> <div class="mt-1 w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center group-hover:border-sd-primary shrink-0 bg-white"> <div class="w-3 h-3 bg-sd-primary rounded-full transform scale-0 transition ${isChecked ? 'scale-100' : ''}"></div> </div> <div class="flex-1"> ${op.img ? `<div class="mb-2">${renderStudentImg(op.img, 128)}</div>` : ''} <span class="text-gray-700 font-medium text-base">${op.text}</span> </div> <input type="radio" name="ans" class="hidden" ${isChecked ? 'checked' : ''}> </label>`;
        }).join('');
    } else if (q.tipe === 'pgk') {
        const savedAns = studentAnswers[currentQuestionIndex] || [];
        const displayOrder = shuffledOptionsMap[currentQuestionIndex] || (q.opsi || []).map((_, i) => i);
        questionHtml += displayOrder.map(origIdx => {
            const op = q.opsi[origIdx], isChecked = savedAns.includes(origIdx);
            const borderClass = isChecked ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50';
            return `<label class="flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${borderClass} no-select"> <input type="checkbox" class="w-6 h-6 text-purple-600 rounded focus:ring-purple-500 shrink-0 mt-1" onchange="saveAnswerPGK(this, ${origIdx})" ${isChecked ? 'checked' : ''}> <div class="flex-1"> ${op.img ? `<div class="mb-2">${renderStudentImg(op.img, 128)}</div>` : ''} <span class="text-gray-700 font-medium">${op.text}</span> </div> </label>`;
        }).join('');
    } else if (q.tipe === 'bs') {
        const savedAns = studentAnswers[currentQuestionIndex] || {};
        questionHtml += `<div class="bg-gray-50 rounded-xl overflow-hidden border shadow-inner"> <table class="w-full text-sm md:text-base"> <thead class="bg-gray-200 text-gray-700"> <tr><th class="p-3 text-left">Pernyataan</th><th class="p-3 w-14 text-center bg-green-200">B</th><th class="p-3 w-14 text-center bg-red-200">S</th></tr> </thead> <tbody>${(q.pernyataan || []).map((p, idx) => ` <tr class="border-b last:border-0 hover:bg-white transition"> <td class="p-3 font-medium text-gray-700">${p.img ? `<div class="mb-2">${renderStudentImg(p.img, 96)}</div>` : ''}${p.text}</td> <td class="text-center bg-green-50 p-0 align-middle"><label class="block w-full h-full py-3 cursor-pointer flex justify-center items-center"><input type="radio" name="bs_row_${idx}" value="B" class="w-5 h-5 accent-green-600" ${savedAns[idx] === 'B' ? 'checked' : ''} onclick="saveAnswerBS(${idx}, 'B')"></label></td> <td class="text-center bg-red-50 p-0 align-middle"><label class="block w-full h-full py-3 cursor-pointer flex justify-center items-center"><input type="radio" name="bs_row_${idx}" value="S" class="w-5 h-5 accent-red-500" ${savedAns[idx] === 'S' ? 'checked' : ''} onclick="saveAnswerBS(${idx}, 'S')"></label></td> </tr>`).join('')}</tbody> </table></div>`;
    }
    questionHtml += `</div></div>`;
    area.innerHTML = passageHtml + questionHtml;

    if (window.renderMathInElement) {
        renderMathInElement(area, {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }],
            throwOnError: false
        });
    }
}

// --- AUTO-SAVE ---
function saveProgressToLocal() {
    const kode = document.getElementById('siswa-kode').value.toUpperCase();
    const noPeserta = document.getElementById('siswa-no-peserta').value;
    const kodeUjianAwal = document.getElementById('siswa-kode-ujian')?.value?.trim?.().toUpperCase() || '';
    if (!kode || !noPeserta) return;
    
    const mainKey = `tos_answers_${kode}_${noPeserta}`;
    const data = JSON.stringify({ answers: studentAnswers, logs: activityLogs });
    localStorage.setItem(mainKey, data);
    
    // Jika siswa pakai kode ujian, simpan juga ke key kode ujian agar tetap accessible
    // saat soal acak berubah di kunjungan berikutnya
    if (kodeUjianAwal && kodeUjianAwal !== kode) {
        const fallbackKey = `tos_answers_${kodeUjianAwal}_${noPeserta}`;
        localStorage.setItem(fallbackKey, data);
    }
}

function saveAnswer(val) { studentAnswers[currentQuestionIndex] = val; saveProgressToLocal(); renderQuestion(); }
function saveAnswerPGK(el, idx) {
    let ans = studentAnswers[currentQuestionIndex] || [];
    if (el.checked) { if (!ans.includes(idx)) ans.push(idx); } else { ans = ans.filter(i => i !== idx); }
    studentAnswers[currentQuestionIndex] = ans; saveProgressToLocal();
}
function saveAnswerBS(rowIdx, val) {
    let ans = studentAnswers[currentQuestionIndex] || {};
    ans[rowIdx] = val; studentAnswers[currentQuestionIndex] = ans; saveProgressToLocal();
}
function nextQuestion() { if (currentQuestionIndex < questions.length - 1) { recordTimeSpent(); currentQuestionIndex++; renderQuestion(); } }
function prevQuestion() { if (currentQuestionIndex > 0) { recordTimeSpent(); currentQuestionIndex--; renderQuestion(); } }
async function selesaiUjian() {
    const isConfirmed = await showSafeConfirm('Yakin ingin mengumpulkan jawaban?', {
        title: 'Kirim Jawaban',
        okText: 'Ya, Kirim',
        cancelText: 'Periksa Lagi'
    });
    if (isConfirmed) submitExam(false);
}

function clampScore(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeIndex(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function dedupeNumberArray(arr) {
    const seen = {};
    return (arr || []).filter(n => {
        const key = String(n);
        if (seen[key]) return false;
        seen[key] = true;
        return true;
    });
}

function hasMeaningfulText(value) {
    return String(value || '').trim() !== '';
}

function isValidPgkOption(option) {
    return !!(option && (hasMeaningfulText(option.text) || hasMeaningfulText(option.img)));
}

function isKeyedBsStatement(statement) {
    if (!statement) return false;
    const key = String(statement.kunci || '').trim().toUpperCase();
    return key === 'B' || key === 'S';
}

function scoreQuestion(q, ans, scoringConfig) {
    const cfg = normalizeScoringConfig(scoringConfig || DEFAULT_SCORING_CONFIG);

    if (q.tipe === 'pg') {
        const keyIdx = normalizeIndex(q.kunci);
        if (keyIdx === null) {
            return { score: 0, maxPoints: 0 };
        }

        const maxPoints = Math.max(cfg.pg.maxPoints, cfg.pg.minPoints);
        const minPoints = cfg.pg.minPoints;
        let score = cfg.pg.blankPoints;
        const ansIdx = normalizeIndex(ans);
        if (ansIdx !== null) {
            score = (ansIdx === keyIdx) ? cfg.pg.correctPoints : cfg.pg.wrongPoints;
        }
        return { score: clampScore(score, minPoints, maxPoints), maxPoints };
    }

    if (q.tipe === 'pgk') {
        const minPoints = cfg.pgk.minPoints;
        const validOptions = (q.opsi || []).map((op, idx) => ({ idx, op })).filter(entry => isValidPgkOption(entry.op));
        const validOptionIndexSet = {};
        validOptions.forEach(entry => {
            validOptionIndexSet[entry.idx] = true;
        });

        const validCorrectCount = validOptions.filter(entry => !!entry.op.isTrue).length;
        const studentSelections = Array.isArray(ans)
            ? dedupeNumberArray(ans.map(normalizeIndex).filter(i => i !== null && validOptionIndexSet[i]))
            : [];

        const maxPoints = Math.max(cfg.pgk.maxPoints, minPoints);

        if (validCorrectCount === 0) {
            return { score: 0, maxPoints: 0 };
        }

        if (cfg.pgk.mode === 'simple') {
            let correctSelected = 0;
            let wrongSelected = 0;
            studentSelections.forEach(optIdx => {
                if ((q.opsi || [])[optIdx] && (q.opsi || [])[optIdx].isTrue) correctSelected++;
                else wrongSelected++;
            });

            let score = cfg.pgk.simpleBlankPoints;
            if (studentSelections.length === 0) {
                score = cfg.pgk.simpleBlankPoints;
            } else {
                const isAllCorrect = validCorrectCount > 0 && correctSelected === validCorrectCount && wrongSelected === 0 && studentSelections.length === validCorrectCount;
                const isAllWrong = correctSelected === 0;
                if (isAllCorrect) score = cfg.pgk.simpleAllCorrectPoints;
                else if (isAllWrong) score = cfg.pgk.simpleAllWrongPoints;
                else score = cfg.pgk.simplePartialPoints;
            }

            return { score: clampScore(score, minPoints, maxPoints), maxPoints };
        }

        let score = cfg.pgk.basePoints;
        studentSelections.forEach(optIdx => {
            if ((q.opsi || [])[optIdx] && (q.opsi || [])[optIdx].isTrue) score += cfg.pgk.pointsPerCorrectSelection;
            else score += cfg.pgk.pointsPerWrongSelection;
        });
        return { score: clampScore(score, minPoints, maxPoints), maxPoints };
    }

    if (q.tipe === 'bs') {
        const minPoints = cfg.bs.minPoints;
        const statements = (q.pernyataan || []).map((statement, idx) => ({ idx, statement })).filter(entry => isKeyedBsStatement(entry.statement));
        const keyedCount = statements.length;

        if (keyedCount === 0) {
            return { score: 0, maxPoints: 0 };
        }

        const maxPoints = Math.max(cfg.bs.maxPoints, minPoints);

        if (cfg.bs.mode === 'simple') {
            const answers = (ans && typeof ans === 'object') ? ans : {};
            const answeredCount = statements.reduce((total, entry) => {
                const v = answers[entry.idx];
                return total + ((v === 'B' || v === 'S') ? 1 : 0);
            }, 0);
            let correctCount = 0;
            statements.forEach(entry => {
                if (answers[entry.idx] === entry.statement.kunci) correctCount++;
            });

            let score = cfg.bs.simpleBlankPoints;
            if (answeredCount === 0) {
                score = cfg.bs.simpleBlankPoints;
            } else {
                const isAllCorrect = keyedCount > 0 && correctCount === keyedCount;
                const isAllWrong = correctCount === 0;
                if (isAllCorrect) score = cfg.bs.simpleAllCorrectPoints;
                else if (isAllWrong) score = cfg.bs.simpleAllWrongPoints;
                else score = cfg.bs.simplePartialPoints;
            }

            return { score: clampScore(score, minPoints, maxPoints), maxPoints };
        }

        const answers = (ans && typeof ans === 'object') ? ans : {};
        let score = cfg.bs.basePoints;
        statements.forEach(entry => {
            if (answers[entry.idx] === entry.statement.kunci) score += cfg.bs.pointsPerCorrectStatement;
            else score += cfg.bs.pointsPerWrongStatement;
        });
        return { score: clampScore(score, minPoints, maxPoints), maxPoints };
    }

    return { score: 0, maxPoints: 0 };
}

// --- SUBMIT ---
function submitExam(isAutoSubmit) {
    if (isSubmitting || isExamSubmitted) return;
    isExamSubmitted = true;

    recordTimeSpent();
    const kode = document.getElementById('siswa-kode').value.toUpperCase(), nama = document.getElementById('siswa-nama').value, noPeserta = document.getElementById('siswa-no-peserta').value;
    localStorage.removeItem(`tos_timer_${kode}_${String(noPeserta || '').trim().toUpperCase()}`);
    localStorage.removeItem(`tos_timer_${kode}_${String(nama || '').trim().toUpperCase()}`);
    let totalStudentPoints = 0, maxPossiblePoints = 0;
    questions.forEach((q, idx) => {
        const ans = studentAnswers[idx];
        const result = scoreQuestion(q, ans, currentScoringConfig);
        maxPossiblePoints += result.maxPoints;
        totalStudentPoints += result.score;
    });
    const finalScore = maxPossiblePoints > 0
        ? Math.max(0, Math.min(100, Number(((totalStudentPoints / maxPossiblePoints) * 100).toFixed(2))))
        : 0;
    document.getElementById('score-display').innerText = finalScore;
    document.getElementById('pesan-hasil').innerText = isAutoSubmit ? "Waktu Habis! Jawaban tersimpan." : "Kamu telah menyelesaikan ujian.";
    navTo('layer-result');
    
    // ✅ BARU: Generate unique submission ID yang sama untuk semua retry
    const submissionTimestamp = Date.now();
    const submissionId = `SUB_${kode}_${noPeserta}_${submissionTimestamp}`;
    
    const payload = { 
        nama, 
        kelas: document.getElementById('siswa-kelas').value, 
        sekolah: document.getElementById('siswa-sekolah').value, 
        noPeserta: document.getElementById('siswa-no-peserta').value, 
        kode_soal: kode, 
        nilai: finalScore, 
        jawaban: studentAnswers, 
        logAktivitas: activityLogs,
        submissionId: submissionId,
        submissionTimestamp: submissionTimestamp
    };
    
    const statusEl = document.getElementById('save-status');
    const autoSaveKey = `tos_answers_${kode}_${noPeserta}`;
    const btnFinish = document.getElementById('btn-finish');
    if (btnFinish) btnFinish.disabled = true;
    if (statusEl) statusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sedang Mengirim...`;

    isSubmitting = true;
    document.getElementById('layer-submit-loading').classList.remove('hidden');

    const pendingKey = `jawaban_pending_${kode}_${noPeserta}`;
    // ✅ Simpan submission ID bersama data
    localStorage.setItem(pendingKey, JSON.stringify({ ...payload, isPending: true }));

    let retryCount = 0;

    async function kirimDataDenganRetry(dataToSubmit) {
        retryCount++;
        document.getElementById('submit-retry-text').innerText = retryCount > 1 ? `Percobaan ke-${retryCount}... Mohon ditunggu.` : 'Sedang menghubungi server...';

        if (APPS_SCRIPT_URL === 'URL_WEB_APP_APPS_SCRIPT_DI_SINI') {
            setTimeout(() => {
                if (statusEl) statusEl.innerHTML = `<i class="fas fa-check-circle text-green-500"></i> Nilai berhasil disimpan (Mode Dev).`;
                localStorage.removeItem(pendingKey); localStorage.removeItem(autoSaveKey);
                isSubmitting = false; document.getElementById('layer-submit-loading').classList.add('hidden');
            }, 2000);
            return;
        }

        try {
            const res = await fetchAppsScriptAPI('simpanNilai', dataToSubmit);
            if (res && res.status === 'sukses') {
                // ✅ Hanya clear jika submission ID cocok
                if (res.submissionId === dataToSubmit.submissionId) {
                    if (statusEl) statusEl.innerHTML = `<i class="fas fa-check-circle text-green-500"></i> Nilai berhasil disimpan.`;
                    localStorage.removeItem(pendingKey); localStorage.removeItem(autoSaveKey);
                    isSubmitting = false; document.getElementById('layer-submit-loading').classList.add('hidden');
                }
            } else {
                console.warn("Server Gagal, Retry...", res.message || res.pesan);
                handleRetry(dataToSubmit);
            }
        } catch (err) {
            console.error('Kirim Gagal:', err);
            handleRetry(dataToSubmit);
        }
    }

    function handleRetry(dataToSubmit) {
        if (retryCount >= 10) {
            document.getElementById('submit-retry-text').innerHTML = `<span class="text-red-300">Gagal terhubung ke server setelah 10 kali coba.</span><br><span class="text-sm">Jawaban aman tersimpan. Kami akan mencoba mengirim ulang otomatis.</span>`;
            isSubmitting = false;
            setTimeout(() => { document.getElementById('layer-submit-loading').classList.add('hidden'); }, 5000);
        } else {
            // ✅ Exponential backoff: 2s, 4s, 8s, 16s...
            const backoffDelay = 2000 * Math.pow(2, retryCount - 1);
            const jitter = 0.85 + (Math.random() * 0.3); // 0.85x - 1.15x
            const finalDelay = Math.min(Math.floor(backoffDelay * jitter), 30000);
            setTimeout(() => kirimDataDenganRetry(dataToSubmit), finalDelay);
        }
    }

    kirimDataDenganRetry(payload);
}

// --- SECURITY ---
function handleBeforeUnload(event) {
    if (isSubmitting) { event.preventDefault(); event.returnValue = 'Data nilai Anda sedang dikirim, dilarang menutup halaman!'; return event.returnValue; }
    const isGuruDashboardVisible = !document.getElementById('layer-dashboard-guru').classList.contains('hidden');
    const hasGuruProgress = document.querySelector('#container-soal .card-soal') !== null;
    if (isGuruDashboardVisible && hasGuruProgress) { event.preventDefault(); event.returnValue = ''; return ''; }
    const isSiswaExamVisible = !document.getElementById('layer-siswa-exam').classList.contains('hidden');
    if (isSiswaExamVisible) { event.preventDefault(); event.returnValue = ''; return ''; }
}

function checkAndBlockSecurityAction(event, actionName) {
    const isExamActive = !document.getElementById('layer-siswa-exam').classList.contains('hidden');
    if (isExamActive) {
        event.preventDefault();
        activityLogs.percobaanCurang++;
        saveProgressToLocal();
        showToast(`Peringatan Keamanan! Tindakan ${actionName} dilarang selama ujian.`, 'error');
        return true;
    }
    return false;
}

document.addEventListener('contextmenu', (e) => checkAndBlockSecurityAction(e, 'Klik Kanan (Context Menu)'));
document.addEventListener('copy', (e) => checkAndBlockSecurityAction(e, 'Copy'));
document.addEventListener('cut', (e) => checkAndBlockSecurityAction(e, 'Cut'));
document.addEventListener('paste', (e) => checkAndBlockSecurityAction(e, 'Paste'));

document.addEventListener('keydown', (e) => {
    const isExamActive = !document.getElementById('layer-siswa-exam').classList.contains('hidden');
    if (isExamActive) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'c' || e.key === 'C') checkAndBlockSecurityAction(e, 'Copy (Ctrl+C)');
            if (e.key === 'p' || e.key === 'P') checkAndBlockSecurityAction(e, 'Print (Ctrl+P)');
        }
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
            e.preventDefault(); activityLogs.percobaanCurang++;
            navigator.clipboard.writeText('').catch(() => { });
            showToast('Peringatan Keamanan! Dilarang Screenshot layar pengerjaan ujian.', 'error');
        }
    }
});

window.addEventListener('blur', () => {
    const isExamActive = !document.getElementById('layer-siswa-exam').classList.contains('hidden');
    if (isExamActive) {
        activityLogs.pindahTab++;
        saveProgressToLocal();
        showToast('Peringatan! Menutup atau memindahkan tab saat ujian terdeteksi sistem.', 'error');
    }
});

// --- GHOST RECOVERY ---
function checkGhostRecovery() {
    const pendingKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('jawaban_pending_')) pendingKeys.push(key);
    }
    if (pendingKeys.length === 0) return;

    const banner = document.createElement('div');
    banner.id = 'ghost-recovery-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#1d4ed8;color:white;padding:14px 16px;text-align:center;font-weight:bold;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    banner.innerHTML = `<i class="fas fa-sync fa-spin" style="margin-right:8px;"></i> Mengirim ulang jawaban Anda yang tertunda... Mohon tunggu dan jangan tutup halaman ini.`;
    document.body.prepend(banner);

    let processedCount = 0;
    let successCount = 0;

    pendingKeys.forEach((key, index) => {
        try {
            const payload = JSON.parse(localStorage.getItem(key));
            console.log("Memulai Ghost Recovery untuk:", key, "Submission ID:", payload.submissionId);
            const autoSaveKey = `tos_answers_${payload.kode_soal}_${payload.noPeserta}`;

            if (APPS_SCRIPT_URL === 'URL_WEB_APP_APPS_SCRIPT_DI_SINI') {
                setTimeout(() => {
                    console.log("Ghost Recovery Berhasil (Dev Mode):", key);
                    localStorage.removeItem(key);
                    localStorage.removeItem(autoSaveKey);
                    processedCount++;
                    successCount++;
                    
                    if (processedCount === pendingKeys.length) {
                        const b = document.getElementById('ghost-recovery-banner');
                        if (b) { 
                            b.style.background = '#16a34a'; 
                            b.innerHTML = `<i class="fas fa-check-circle" style="margin-right:8px;"></i> ${successCount}/${pendingKeys.length} jawaban berhasil terkirim!`; 
                            setTimeout(() => b.remove(), 4000); 
                        }
                    }
                }, 1000 * (index + 1));
                return;
            }

            const ghostSync = async () => {
                try {
                    const res = await fetchAppsScriptAPI('simpanNilai', payload);
                    
                    // ✅ Check submissionId confirmation
                    if (res && res.status === 'sukses' && 
                        (res.submissionId === payload.submissionId || res.isDuplicate)) {
                        console.log("Ghost Recovery Berhasil:", key);
                        localStorage.removeItem(key);
                        localStorage.removeItem(autoSaveKey);
                        successCount++;
                    } else {
                        console.warn("Ghost Recovery tidak berhasil:", res);
                    }
                } catch (err) {
                    console.error("Ghost Recovery Error:", err);
                } finally {
                    processedCount++;
                    
                    // Update banner ketika semua selesai
                    if (processedCount === pendingKeys.length) {
                        const b = document.getElementById('ghost-recovery-banner');
                        if (b) {
                            if (successCount === pendingKeys.length) {
                                b.style.background = '#16a34a';
                                b.innerHTML = `<i class="fas fa-check-circle" style="margin-right:8px;"></i> Semua jawaban berhasil terkirim!`;
                            } else {
                                b.style.background = '#f59e0b';
                                b.innerHTML = `<i class="fas fa-check-circle" style="margin-right:8px;"></i> ${successCount}/${pendingKeys.length} jawaban terkirim. Sisanya tersimpan aman.`;
                            }
                            setTimeout(() => b.remove(), 4000);
                        }
                    }
                }
            };

            // ✅ Stagger requests dengan delay
            setTimeout(ghostSync, 1000 * (index + 1));

        } catch (error) {
            console.error('Error parsing pending data:', error);
            processedCount++;
        }
    });
}
