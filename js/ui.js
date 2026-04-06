// ===== UI & FEEDBACK UTILITIES =====

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (type === 'error') {
        const existingErrors = container.querySelectorAll('.toast-error-item');
        if (existingErrors.length >= 3) {
            existingErrors[0].classList.add('toast-exit', 'toast-exit-active');
            existingErrors[0].addEventListener('transitionend', () => existingErrors[0].remove());
        }
    }

    const id = Date.now();
    const colors = {
        success: { bg: 'bg-green-500', icon: 'fa-check-circle' },
        error: { bg: 'bg-red-500', icon: 'fa-times-circle' },
        info: { bg: 'bg-blue-500', icon: 'fa-info-circle' },
        warning: { bg: 'bg-yellow-500', icon: 'fa-exclamation-triangle' }
    };
    const errorClass = type === 'error' ? 'toast-error-item' : '';
    const toastHTML = `
        <div id="toast-${id}" class="toast-enter ${errorClass} flex items-center w-full p-4 text-white ${colors[type]?.bg || 'bg-gray-500'} rounded-lg shadow-lg" role="alert">
            <div class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8">
                <i class="fas ${colors[type]?.icon || 'fa-bell'} text-xl"></i>
            </div>
            <div class="ms-3 text-sm font-semibold">${message}</div>
        </div>`;
    container.insertAdjacentHTML('beforeend', toastHTML);

    const toastEl = document.getElementById(`toast-${id}`);
    setTimeout(() => toastEl.classList.add('toast-enter-active'), 10);
    setTimeout(() => {
        toastEl.classList.remove('toast-enter-active');
        toastEl.classList.add('toast-exit', 'toast-exit-active');
        toastEl.addEventListener('transitionend', () => toastEl.remove());
    }, 4000);
}

function toggleButtonLoading(button, isLoading) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.btn-spinner');
    if (isLoading) {
        button.disabled = true;
        if (text) text.classList.add('hidden');
        if (spinner) spinner.classList.remove('hidden');
    } else {
        button.disabled = false;
        if (text) text.classList.remove('hidden');
        if (spinner) spinner.classList.add('hidden');
    }
}

function showSafeConfirm(message, options = {}) {
    const modal = document.getElementById('layer-confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('btn-confirm-ok');
    const cancelBtn = document.getElementById('btn-confirm-cancel');

    if (!modal || !okBtn || !cancelBtn || !msgEl) {
        return Promise.resolve(window.confirm(message));
    }

    const {
        title = 'Konfirmasi',
        okText = 'Ya',
        cancelText = 'Batal'
    } = options;

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;

    return new Promise((resolve) => {
        const cleanup = () => {
            modal.classList.add('hidden');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdrop);
            document.removeEventListener('keydown', handleEsc);
        };

        const handleOk = () => { cleanup(); resolve(true); };
        const handleCancel = () => { cleanup(); resolve(false); };
        const handleBackdrop = (event) => {
            if (event.target === modal) {
                cleanup();
                resolve(false);
            }
        };
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                cleanup();
                resolve(false);
            }
        };

        modal.classList.remove('hidden');
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdrop);
        document.addEventListener('keydown', handleEsc);
    });
}

// ===== NAVIGASI =====

function navTo(layerId) {
    document.querySelectorAll('[id^="layer-"]').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(layerId);
    if (target) target.classList.remove('hidden');
    if (layerId !== 'layer-siswa-exam') window.scrollTo(0, 0);
}
