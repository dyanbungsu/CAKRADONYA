/**
 * app.js - boot aplikasi: login, header, sidebar, jam, status koneksi.
 */
const App = {
  settings: {},
  clockTimer: null,
  pingTimer: null,

  async boot() {
    App.bindStatic();
    App.loadPublicSettings();
    if (Auth.getToken() && Api.isConfigured()) {
      try {
        await Auth.restore();
        App.showApp();
        return;
      } catch (e) {
        Auth.clear();
      }
    }
    App.showLogin();
  },

  /* ----------------------------- Pengaturan publik ----------------------------- */
  async loadPublicSettings() {
    if (!Api.isConfigured()) return;
    try {
      const s = await Api.call('settings.public', {}, { silent: true, noAuth: true });
      App.applySettings(s);
    } catch (e) { /* tampilan bawaan tetap dipakai */ }
  },

  applySettings(s) {
    App.settings = Object.assign(App.settings, s);
    const org = App.settings.nama_organisasi || 'PASUKAN CAKRA DONYA';
    const school = App.settings.nama_sekolah || 'SMA NEGERI 1 SEUNUDDON';
    document.getElementById('hdr-org').textContent = org;
    document.getElementById('hdr-school').textContent = school;
    document.getElementById('login-org').textContent = org;
    document.getElementById('login-school').textContent = school;
    [
      ['hdr-logo-sekolah', 'logo_sekolah_url'], ['hdr-logo-paskibra', 'logo_paskibra_url'],
      ['login-logo-sekolah', 'logo_sekolah_url'], ['login-logo-paskibra', 'logo_paskibra_url']
    ].forEach(([id, key]) => {
      const img = document.getElementById(id);
      const url = App.settings[key];
      if (url) {
        img.onerror = () => { img.hidden = true; };
        img.onload = () => { img.hidden = false; };
        img.src = url;
      } else {
        img.hidden = true;
        img.removeAttribute('src');
      }
    });
  },

  /* --------------------------------- Tampilan --------------------------------- */
  showLogin() {
    clearInterval(App.clockTimer);
    clearInterval(App.pingTimer);
    document.getElementById('app-view').hidden = true;
    document.getElementById('login-view').hidden = false;
    document.getElementById('login-config-warning').hidden = Api.isConfigured();
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').hidden = true;
    history.replaceState(null, '', location.pathname + location.search);
    UI.icons();
    document.getElementById('login-username').focus();
  },

  showApp() {
    document.getElementById('login-view').hidden = true;
    document.getElementById('app-view').hidden = false;
    const u = Auth.user;
    document.getElementById('profile-name').textContent = u.nama;
    document.getElementById('profile-role').textContent = u.role;
    document.getElementById('profile-avatar').textContent = (u.nama || '?').trim().charAt(0).toUpperCase();
    document.getElementById('app-version').textContent = '1.0.0-paket1';
    App.buildNav();
    App.startClock();
    App.startPing();
    UI.icons();
    if (!location.hash) history.replaceState(null, '', '#/dashboard');
    Router.handle();
  },

  buildNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = MENUS.filter((m) => Auth.can(m.key)).map((m) => `
      <a href="#/${UI.esc(m.key)}" data-key="${UI.esc(m.key)}">
        <i data-lucide="${UI.esc(m.icon)}"></i>
        <span>${UI.esc(m.label)}</span>
        ${m.ready ? '' : `<span class="soon">Paket ${m.paket}</span>`}
      </a>`).join('');
  },

  markActive(key) {
    document.querySelectorAll('#nav a').forEach((a) => {
      const on = a.dataset.key === key;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  },

  openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebar-scrim').hidden = false;
  },
  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-scrim').hidden = true;
  },

  /* ---------------------------- Jam & status koneksi ---------------------------- */
  startClock() {
    clearInterval(App.clockTimer);
    const tz = APP_CONFIG.TIMEZONE;
    const tf = new Intl.DateTimeFormat('id-ID', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const df = new Intl.DateTimeFormat('id-ID', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const tick = () => {
      const now = new Date();
      document.getElementById('clock-time').textContent = tf.format(now).replace(/:/g, '.') + ' WIB';
      document.getElementById('clock-date').textContent = df.format(now);
    };
    tick();
    App.clockTimer = setInterval(tick, 1000);
  },

  setChip(id, state, text, title) {
    const el = document.getElementById(id);
    el.className = 'chip chip-' + state + (id === 'chip-drive' ? ' hide-mobile' : '');
    el.querySelector('span').textContent = text;
    if (title) el.title = title;
  },

  startPing() {
    clearInterval(App.pingTimer);
    const run = async () => {
      const t0 = performance.now();
      try {
        await Api.call('system.ping', {}, { silent: true, noAuth: true });
        App.setChip('chip-cloud', 'ok', 'Cloud ' + Math.round(performance.now() - t0) + ' ms', 'Terhubung ke Google Apps Script');
      } catch (e) {
        App.setChip('chip-cloud', 'err', 'Offline', e.message);
      }
    };
    run();
    App.pingTimer = setInterval(run, APP_CONFIG.PING_INTERVAL_MS);
    // Integrasi Google Drive dibangun pada Paket 5; status jujur: belum aktif.
    App.setChip('chip-drive', 'off', 'Drive: belum aktif', 'Integrasi Google Drive dibangun pada Paket 5');
  },

  /* --------------------------------- Event dasar --------------------------------- */
  bindStatic() {
    const pw = document.getElementById('login-password');
    document.getElementById('login-toggle-pw').addEventListener('click', (e) => {
      const show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      e.currentTarget.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}"></i>`;
      UI.icons();
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('login-error');
      const btn = document.getElementById('login-submit');
      err.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Memeriksa...';
      try {
        await Auth.login(document.getElementById('login-username').value, pw.value);
        pw.value = '';
        history.replaceState(null, '', '#/dashboard');
        App.showApp();
      } catch (ex) {
        err.textContent = ex.message || 'Login gagal.';
        err.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Masuk';
      }
    });

    document.getElementById('btn-menu').addEventListener('click', App.openSidebar);
    document.getElementById('sidebar-scrim').addEventListener('click', App.closeSidebar);

    const menu = document.getElementById('profile-menu');
    const pbtn = document.getElementById('btn-profile');
    const closeMenu = () => { menu.hidden = true; pbtn.setAttribute('aria-expanded', 'false'); };
    pbtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      pbtn.setAttribute('aria-expanded', String(!menu.hidden));
    });
    menu.addEventListener('click', closeMenu);
    document.addEventListener('click', closeMenu);

    document.getElementById('btn-logout').addEventListener('click', async () => {
      UI.loading(true);
      await Auth.logout();
      UI.loading(false);
      App.showLogin();
    });

    document.getElementById('btn-scan').addEventListener('click', () => {
      if (Auth.can('attendance')) Router.go('attendance');
      else UI.toast('Scanner QR hanya tersedia untuk akun dengan akses Absensi.', 'error');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.boot());
