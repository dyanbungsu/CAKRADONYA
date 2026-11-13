/**
 * router.js - routing berbasis hash (#/users). Aman untuk GitHub Pages (tanpa konfigurasi server).
 * Modul mendaftar dengan Router.register(key, { title, render(container) }).
 */
const Router = {
  pages: {},
  renderToken: 0,

  register(key, page) { Router.pages[key] = page; },

  currentKey() {
    return (location.hash.replace(/^#\/?/, '').split('?')[0] || 'dashboard');
  },

  go(key) { location.hash = '#/' + key; },

  async handle() {
    if (!Auth.user) return;
    let key = Router.currentKey();
    const open = key === 'account';
    if (!open && !MenuUtil.byKey(key)) key = 'dashboard';
    if (!open && !Auth.can(key)) {
      UI.toast('Menu tidak tersedia untuk akun Anda.', 'error');
      key = 'dashboard';
      history.replaceState(null, '', '#/dashboard');
    }

    const page = Router.pages[key] || Router.pages.__placeholder;
    const container = document.getElementById('page');
    const token = ++Router.renderToken;
    container.innerHTML = '';
    document.title = (page.title || MenuUtil.label(key)) + ' - SIM Paskibra Cakra Donya';
    App.markActive(key);
    App.closeSidebar();
    try {
      await page.render(container, key, token);
    } catch (e) {
      if (token !== Router.renderToken) return; // pengguna sudah pindah halaman
      container.innerHTML = `<div class="card"><div class="alert alert-error" style="margin:0">${UI.esc(e.message || 'Gagal memuat halaman.')}</div></div>`;
    }
    UI.icons();
    container.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  },

  /** Modul dapat memanggil ini untuk memastikan hasil async masih untuk halaman aktif. */
  isCurrent(token) { return token === Router.renderToken; }
};

window.addEventListener('hashchange', () => Router.handle());
