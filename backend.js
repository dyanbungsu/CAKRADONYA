/**
 * backend.js - Konfigurasi Backend (Administrator): status koneksi dan database.
 * Skrip Code.gs dikelola di editor Apps Script, bukan dari halaman ini.
 */
Router.register('backend', {
  title: 'Konfigurasi Backend',

  async render(el, key, token) {
    const t0 = performance.now();
    const [ping, st] = await Promise.all([
      Api.call('system.ping', {}, { silent: true, noAuth: true }),
      Api.call('system.status')
    ]);
    if (!Router.isCurrent(token)) return;
    const ms = Math.round(performance.now() - t0);

    el.innerHTML = `
      <div class="page-head">
        <div><h2>Konfigurasi Backend</h2><p>Status Google Apps Script dan Google Spreadsheet.</p></div>
        <div class="actions"><button class="btn" id="be-refresh"><i data-lucide="refresh-cw"></i> Periksa Ulang</button></div>
      </div>
      <div class="card">
        <h3>Koneksi</h3>
        <dl class="kv">
          <dt>Aplikasi</dt><dd>${UI.esc(ping.app)}</dd>
          <dt>Versi backend</dt><dd>${UI.esc(ping.version)}</dd>
          <dt>Waktu respons</dt><dd>${ms} ms</dd>
          <dt>Spreadsheet</dt><dd>${UI.esc(st.spreadsheetName)} ${/^https:\/\//.test(st.spreadsheetUrl) ? `<a href="${UI.esc(st.spreadsheetUrl)}" target="_blank" rel="noopener noreferrer">Buka</a>` : ''}</dd>
          <dt>Zona waktu</dt><dd>${UI.esc(st.timezone)}</dd>
          <dt>Waktu server</dt><dd>${UI.esc(UI.fmtDateTime(st.serverTime))}</dd>
          <dt>Status database</dt><dd>${st.databaseReady ? '<span class="badge badge-ok">Siap</span>' : '<span class="badge badge-warn">Belum lengkap</span>'}</dd>
        </dl>
      </div>
      <div class="card">
        <h3>Sheet database</h3>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Sheet</th><th>Status</th><th>Jumlah data</th><th>Kolom</th></tr></thead>
          <tbody>${st.sheets.map((s) => `<tr>
            <td>${UI.esc(s.name)}</td>
            <td>${!s.exists ? '<span class="badge badge-err">Tidak ada</span>' : s.missingColumns.length ? '<span class="badge badge-warn">Kolom kurang: ' + UI.esc(s.missingColumns.join(', ')) + '</span>' : '<span class="badge badge-ok">Siap</span>'}</td>
            <td>${s.rows}</td><td>${s.columns}</td></tr>`).join('')}</tbody></table></div>
        ${st.databaseReady ? '' : '<p class="alert alert-warn" style="margin:12px 0 0">Jalankan <code>setupDatabase()</code> di editor Apps Script untuk melengkapi sheet dan kolom (data tidak dihapus).</p>'}
      </div>`;
    el.querySelector('#be-refresh').addEventListener('click', () => Router.handle());
  }
});
