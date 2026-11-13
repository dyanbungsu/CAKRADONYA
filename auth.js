/**
 * auth.js - sesi pengguna di sisi frontend.
 * Token sesi disimpan di sessionStorage (hilang saat tab ditutup). Token ini BUKAN
 * database; data tetap hanya di Google Spreadsheet. Hak akses sebenarnya dicek di backend.
 */
const Auth = {
  TOKEN_KEY: 'cakra_session_token',
  user: null,

  getToken() {
    try { return sessionStorage.getItem(Auth.TOKEN_KEY) || ''; } catch (e) { return ''; }
  },
  setToken(t) {
    try { sessionStorage.setItem(Auth.TOKEN_KEY, t); } catch (e) { /* mode privat */ }
  },
  clear() {
    try { sessionStorage.removeItem(Auth.TOKEN_KEY); } catch (e) { /* abaikan */ }
    Auth.user = null;
  },

  async login(username, password) {
    const data = await Api.call('auth.login', { username, password }, { noAuth: true });
    Auth.setToken(data.token);
    Auth.user = data.user;
    return data.user;
  },

  /** Pulihkan sesi dari token yang tersimpan; lempar galat bila sudah kedaluwarsa. */
  async restore() {
    if (!Auth.getToken()) throw new ApiError('UNAUTHORIZED', 'Belum login.');
    const data = await Api.call('auth.me', {});
    Auth.user = data.user;
    return data.user;
  },

  async logout() {
    try { await Api.call('auth.logout', {}, { silent: true }); } catch (e) { /* tetap keluar */ }
    Auth.clear();
  },

  handleExpired() {
    Auth.clear();
    UI.toast('Sesi berakhir. Silakan login kembali.', 'error');
    App.showLogin();
  },

  /** Untuk menyembunyikan menu saja; backend tetap memvalidasi setiap permintaan. */
  can(menuKey) {
    return !!(Auth.user && Auth.user.menus.indexOf(menuKey) >= 0);
  },

  isAdmin() {
    return !!(Auth.user && Auth.user.role === 'Administrator');
  }
};
