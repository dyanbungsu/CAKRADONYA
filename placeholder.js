/**
 * placeholder.js - halaman untuk menu yang dibangun pada paket berikutnya.
 * Sengaja jujur: tidak menampilkan data palsu.
 */
Router.register('__placeholder', {
  render(el, key) {
    const m = MenuUtil.byKey(key) || { label: key, icon: 'construction', paket: '?' };
    el.innerHTML = `
      <div class="page-head"><div><h2>${UI.esc(m.label)}</h2></div></div>
      <div class="card">
        <div class="alert alert-info" style="margin:0">
          Modul ini belum dibangun. Dijadwalkan pada <strong>Paket ${UI.esc(m.paket)}</strong>.
          Sheet database-nya sudah disiapkan oleh <code>setupDatabase()</code>.
        </div>
      </div>`;
  }
});
