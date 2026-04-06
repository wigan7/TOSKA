// ===== INISIALISASI APLIKASI =====

function initializeApp() {
    try {
        checkGhostRecovery();
    } catch (error) {
        console.error('Gagal menjalankan ghost recovery saat startup:', error);
    }
    const logout = () => { setEditMode(false); navTo('layer-home'); }
    const bindClick = (id, handler) => {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`Elemen tidak ditemukan saat bind klik: #${id}`);
            return null;
        }
        if (el.getAttribute('onclick')) return el;
        el.addEventListener('click', handler);
        return el;
    };

    // Home
    bindClick('btn-goto-siswa-login', () => navTo('layer-siswa-login'));
    bindClick('btn-open-guru-login', openGuruLogin);
    bindClick('btn-close-guru-login', closeGuruLogin);
    bindClick('btn-proses-guru-login', prosesLoginGuru);

    // Guru Menu
    bindClick('btn-goto-buat-soal', () => navTo('layer-dashboard-guru'));
    bindClick('btn-goto-analisis', () => navTo('layer-analisis-wrapper'));
    bindClick('btn-goto-cetak', () => navTo('layer-cetak-wrapper'));
    bindClick('btn-guru-menu-logout', logout);
    bindClick('btn-back-to-guru-menu-1', () => { setEditMode(false); navTo('layer-guru-menu'); });
    bindClick('btn-back-to-guru-menu-2', () => navTo('layer-guru-menu'));
    bindClick('btn-back-to-guru-menu-3', () => navTo('layer-guru-menu'));

    // Cetak Berkas
    bindClick('btn-cetak-soal', () => cetakBerkas('soal'));
    bindClick('btn-cetak-kunci', () => cetakBerkas('kunci'));
    bindClick('btn-cetak-ljk', () => cetakBerkas('ljk'));

    // Pembuat Soal
    bindClick('btn-guru-logout', logout);
    bindClick('btn-tambah-bacaan', () => tambahBacaan());
    bindClick('btn-tambah-pg', () => tambahSoal('pg'));
    bindClick('btn-tambah-pgk', () => tambahSoal('pgk'));
    bindClick('btn-tambah-bs', () => tambahSoal('bs'));
    bindClick('btn-simpan-db', () => prosesSimpanSoal(getSoalDataFromForm(), isEditMode));
    bindClick('btn-simpan-baru', simpanSebagaiBaru);
    bindClick('btn-muat-edit', handleEditLoad);
    bindClick('btn-reset-mode', () => setEditMode(false));

    // Delegated events for container-soal
    const soalContainer = document.getElementById('container-soal');
    if (soalContainer) {
        soalContainer.addEventListener('click', (event) => {
            const deleteButton = event.target.closest('.btn-hapus-item');
            if (deleteButton) { deleteButton.closest('.card-soal').remove(); updateNomorSoal(); return; }

            const tabButton = event.target.closest('.image-tab-btn');
            if (tabButton) {
                const container = tabButton.closest('.image-input-container');
                if (!container) return;
                const tabId = tabButton.dataset.tabId;
                container.querySelectorAll('.image-tab-btn').forEach(btn => btn.classList.remove('active-tab'));
                container.querySelectorAll('.image-tab-content').forEach(content => content.classList.add('hidden'));
                tabButton.classList.add('active-tab');
                const contentToShow = container.querySelector(`#${tabId}`);
                if (contentToShow) contentToShow.classList.remove('hidden');
            }
        });

        soalContainer.addEventListener('input', (event) => {
            const urlInput = event.target.closest('.image-url-input');
            if (urlInput) {
                const container = urlInput.closest('.image-input-container');
                const imgPreview = container.querySelector('img[id^="img-prev-"]');
                const hiddenInput = container.querySelector('.soal-img-data');
                const url = urlInput.value.trim();
                hiddenInput.value = url;
                if (url) {
                    imgPreview.src = url; imgPreview.classList.remove('hidden');
                    imgPreview.onerror = () => {
                        imgPreview.classList.add('hidden'); imgPreview.src = ''; hiddenInput.value = ''; urlInput.value = '';
                        const now = Date.now();
                        if (now - lastErrorToastTime > 5000) { lastErrorToastTime = now; showToast('URL gambar tidak valid.', 'error'); }
                    };
                } else { imgPreview.classList.add('hidden'); imgPreview.src = ''; }
            }
        });

        soalContainer.addEventListener('paste', (event) => {
            const pasteArea = event.target.closest('.paste-area');
            if (!pasteArea) return;
            event.preventDefault();
            const items = (event.clipboardData || window.clipboardData).items;
            let file = null;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) { file = items[i].getAsFile(); break; }
            }
            if (file) {
                processImageBlob(file, pasteArea.dataset.targetImg, pasteArea.dataset.targetInput);
                showToast('Gambar berhasil ditempel!', 'success');
            } else { showToast('Tidak ada gambar yang ditemukan di clipboard.', 'info'); }
        });
    }

    // Analisis
    bindClick('btn-mulai-analisis', () => handleMulaiAnalisis(null));
    bindClick('btn-apply-filter', () => handleMulaiAnalisis(getSelectedSchools()));
    bindClick('btn-check-all-schools', () => setAllSchoolFilters(true));
    bindClick('btn-uncheck-all-schools', () => setAllSchoolFilters(false));
    bindClick('btn-guru-analisis-logout', logout);

    // Siswa
    bindClick('btn-siswa-back-home', () => navTo('layer-home'));
    bindClick('btn-mulai-ujian', mulaiUjian);
    bindClick('btn-prev', prevQuestion);
    bindClick('btn-next', nextQuestion);
    bindClick('btn-finish', selesaiUjian);
    bindClick('btn-open-nav-panel', openNavPanel);
    bindClick('btn-close-nav-panel', closeNavPanel);
    bindClick('btn-back-to-menu', () => {
        if (isSubmitting) { showToast('Harap tunggu! Jawaban Anda sedang dikirimkan ke server.', 'warning'); return; }
        try { window.top.location.href = window.top.location.href; } catch (e) { window.location.reload(); }
    });

    // Share/Embed
    bindClick('btn-copy-link', () => {
        const input = document.getElementById('share-link-input');
        if (!input) return;
        navigator.clipboard.writeText(input.value);
        showToast('Link berhasil disalin!');
    });
    bindClick('btn-copy-embed', () => {
        const input = document.getElementById('embed-code-input');
        if (!input) return;
        navigator.clipboard.writeText(input.value);
        showToast('Kode semat berhasil disalin!');
    });
    bindClick('btn-share-done', () => { setEditMode(false); navTo('layer-guru-menu'); });

    if (typeof setScoringInputs === 'function') {
        setScoringInputs(DEFAULT_SCORING_CONFIG);
    }
    const pgkMode = document.getElementById('score-pgk-mode');
    const bsMode = document.getElementById('score-bs-mode');
    if (pgkMode && typeof updateScoringModeUI === 'function') pgkMode.addEventListener('change', updateScoringModeUI);
    if (bsMode && typeof updateScoringModeUI === 'function') bsMode.addEventListener('change', updateScoringModeUI);

    // URL Parameter Check
    const urlParams = new URLSearchParams(window.location.search);
    const kodeFromUrl = urlParams.get('kode');
    if (kodeFromUrl) {
        navTo('layer-siswa-login');
        const siswaKodeInput = document.getElementById('siswa-kode');
        if (siswaKodeInput) siswaKodeInput.value = kodeFromUrl.toUpperCase();
        showToast(`Kode soal ${kodeFromUrl.toUpperCase()} siap digunakan.`, 'info');
    } else {
        navTo('layer-home');
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
}

document.addEventListener('DOMContentLoaded', initializeApp);
