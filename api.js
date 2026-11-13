/**
 * api.js - satu pintu komunikasi ke Google Apps Script.
 * Mengirim POST bertipe text/plain (permintaan sederhana, tanpa preflight CORS).
 * Semua respons berbentuk { success, data, message, error }.
 */
class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const Api = {
  isConfigured() {
    const u = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || '';
    return /^https:\/\/script\.google(usercontent)?\.com\//.test(u);
  },

  /**
   * @param {string} action  contoh 'users.list'
   * @param {object} params
   * @param {{silent?: boolean, noAuth?: boolean}} opts  silent: tanpa overlay loading
   * @returns {Promise<any>} isi `data` dari respons
   */
  async call(action, params = {}, opts = {}) {
    if (!Api.isConfigured()) {
      throw new ApiError('CONFIG', 'URL backend belum diatur di js/config.js.');
    }
    const body = JSON.stringify({ action, params, token: opts.noAuth ? '' : Auth.getToken() });
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), APP_CONFIG.REQUEST_TIMEOUT_MS);
    if (!opts.silent) UI.loading(true);
    let res;
    try {
      res = await fetch(APP_CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
        signal: ctrl.signal
      });
    } catch (e) {
      throw new ApiError('NETWORK', e.name === 'AbortError'
        ? 'Server terlalu lama merespons. Coba lagi.'
        : 'Tidak dapat terhubung ke server. Periksa koneksi internet.');
    } finally {
      clearTimeout(timer);
      if (!opts.silent) UI.loading(false);
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      throw new ApiError('BAD_RESPONSE', 'Respons server tidak dapat dibaca. Pastikan Web App di-deploy dengan akses "Anyone".');
    }
    if (!json.success) {
      const err = json.error || { code: 'ERROR', message: json.message || 'Terjadi kesalahan.' };
      if (err.code === 'UNAUTHORIZED' && Auth.user) Auth.handleExpired();
      throw new ApiError(err.code, err.message);
    }
    return json.data;
  }
};
