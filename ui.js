/**
 * ui.js - utilitas tampilan: escape HTML, toast, modal, konfirmasi, loading.
 * Semua data dari server WAJIB melewati UI.esc() sebelum masuk ke innerHTML.
 */
const UI = {
  esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  icons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  },

  toast(message, type = 'info', ms = 4000) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => el.remove(), ms);
  },

  loading(on) {
    document.getElementById('loading').hidden = !on;
  },

  /** Format 'yyyy-MM-dd HH:mm:ss' dari server menjadi 'dd/MM/yyyy HH.mm' tanpa konversi zona waktu. */
  fmtDateTime(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?/.exec(String(s || ''));
    if (!m) return s ? String(s) : '-';
    return m[3] + '/' + m[2] + '/' + m[1] + (m[4] ? ' ' + m[4] + '.' + m[5] : '');
  },

  async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      UI.toast('Disalin ke clipboard.', 'success', 2000);
    } catch (e) {
      UI.toast('Tidak dapat menyalin otomatis. Salin secara manual.', 'error');
    }
  },

  /**
   * Modal generik.
   * options: { title, body (HTML string), actions: [{label, kind, onClick(modal), keepOpen}], wide }
   * Mengembalikan { el, close, setBusy }.
   */
  modal(options) {
    const root = document.getElementById('modal-root');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const actions = options.actions || [];
    overlay.innerHTML = `
      <div class="modal ${options.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${UI.esc(options.title)}">
        <div class="modal-head">
          <h3>${UI.esc(options.title)}</h3>
          <button type="button" class="icon-btn" data-close aria-label="Tutup"><i data-lucide="x"></i></button>
        </div>
        <div class="modal-body">${options.body || ''}</div>
        ${actions.length ? '<div class="modal-foot"></div>' : ''}
      </div>`;
    root.appendChild(overlay);

    const previousFocus = document.activeElement;
    const api = {
      el: overlay,
      close() {
        document.removeEventListener('keydown', onKey);
        overlay.remove();
        if (previousFocus && previousFocus.focus) previousFocus.focus();
      },
      setBusy(busy) {
        overlay.querySelectorAll('.modal-foot button').forEach((b) => { b.disabled = busy; });
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') api.close(); };
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) api.close(); });
    overlay.querySelector('[data-close]').addEventListener('click', api.close);

    const foot = overlay.querySelector('.modal-foot');
    actions.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + (a.kind ? 'btn-' + a.kind : '');
      b.textContent = a.label;
      b.addEventListener('click', async () => {
        if (a.onClick) await a.onClick(api);
        if (!a.keepOpen) api.close();
      });
      foot.appendChild(b);
    });

    UI.icons();
    const first = overlay.querySelector('input:not([disabled]), select, textarea, .modal-foot button');
    if (first) first.focus();
    return api;
  },

  confirm({ title, message, confirmLabel = 'Ya, lanjutkan', danger = false }) {
    return new Promise((resolve) => {
      let answered = false;
      const m = UI.modal({
        title,
        body: `<p style="margin:0">${UI.esc(message)}</p>`,
        actions: [
          { label: 'Batal', onClick: () => { answered = true; resolve(false); } },
          { label: confirmLabel, kind: danger ? 'danger' : 'primary', onClick: () => { answered = true; resolve(true); } }
        ]
      });
      // Bila ditutup lewat Esc/klik latar, anggap batal.
      const obs = new MutationObserver(() => {
        if (!document.body.contains(m.el)) {
          obs.disconnect();
          if (!answered) resolve(false);
        }
      });
      obs.observe(document.getElementById('modal-root'), { childList: true });
    });
  },

  /** Tampilkan kode sementara (sekali tampil) dengan tombol salin. */
  showSecret(title, intro, secret) {
    UI.modal({
      title,
      body: `<p style="margin-top:0">${UI.esc(intro)}</p>
        <div class="secret"><span id="secret-value">${UI.esc(secret)}</span>
        <button type="button" class="btn btn-sm" id="secret-copy">Salin</button></div>
        <p class="muted" style="margin-bottom:0;font-size:13px">Kode ini hanya ditampilkan sekali. Sampaikan kepada pengguna secara langsung, dan minta segera diganti.</p>`,
      actions: [{ label: 'Selesai', kind: 'primary' }]
    }).el.querySelector('#secret-copy').addEventListener('click', () => UI.copy(secret));
  }
};
