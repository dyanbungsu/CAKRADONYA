/**
 * dashboard.js - Paket 1: ringkasan akun + status sistem (data nyata).
 * Statistik anggota/absensi/grafik ditambahkan pada Paket 2-3 setelah modul datanya ada.
 */
Router.register('dashboard', {
  title: 'Dashboard',
  async render(el, key, token) {
    const u = Auth.user;
    const visible = MENUS.filter((m) => Auth.can(m.key) && m.key !== 'dashboard');

    el.innerHTML = `
      <div class="card welcome">
        <h3>Selamat datang, ${UI.esc(u.nama)}</h3>
        <p>Anda masuk sebagai <strong>${UI.esc(u.role)}</strong>.</p>
      </div>
      <div id="dash-status"></div>
      <div class="card" style="margin-top:16px">
        <h3>Menu yang dapat Anda akses</h3>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Menu</th><th>Status</th></tr></thead>
          <tbody>${visible.map((m) => `
            <tr>
              <td><a href="#/${UI.esc(m.key)}">${UI.esc(m.label)}</a></td>
              <td>${m.ready ? '<span class="badge badge-ok">Tersedia</span>' : `<span class="badge">Paket ${UI.esc(m.paket)}</span>`}</td>
            </tr>`).join('')}
          </tbody></table></div>
        <p class="muted" style="font-size:13px;margin-bottom:0">Grafik dan statistik anggota/absensi muncul setelah modul datanya dibangun (Paket 2 dan 3).</p>
      </div>`;

    if (!Auth.isAdmin()) return;
    const box = el.querySelector('#dash-status');
    box.innerHTML = '<div class="card" style="margin-top:16px"><span class="muted">Memuat status sistem...</span></div>';
    try {
      const st = await Api.call('system.status', {}, { silent: true });
      if (!Router.isCurrent(token)) return;
      const ready = st.sheets.filter((s) => s.exists && s.missingColumns.length === 0).length;
      const users = (st.sheets.find((s) => s.name === 'Users') || {}).rows || 0;
      box.innerHTML = `
        <div class="stat-grid" style="margin-top:16px">
          <div class="stat"><small>Database</small><strong>${st.databaseReady ? 'Siap' : 'Belum lengkap'}</strong><span>${UI.esc(st.spreadsheetName)}</span></div>
          <div class="stat"><small>Sheet siap</small><strong>${ready} / ${st.sheets.length}</strong><span>Sheet dan kolom lengkap</span></div>
          <div class="stat"><small>Pengguna</small><strong>${users}</strong><span>Akun terdaftar</span></div>
          <div class="stat"><small>Waktu server</small><strong style="font-size:18px">${UI.esc(UI.fmtDateTime(st.serverTime))}</strong><span>${UI.esc(st.timezone)}</span></div>
        </div>
        ${st.databaseReady ? '' : '<div class="alert alert-warn">Database belum lengkap. Jalankan <code>setupDatabase()</code> dari editor Apps Script.</div>'}`;
    } catch (e) {
      box.innerHTML = `<div class="alert alert-error" style="margin-top:16px">${UI.esc(e.message)}</div>`;
    }
  }
});
