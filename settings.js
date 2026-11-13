/**
 * settings.js - Pengaturan Identitas (Administrator).
 * Logo: isi dengan alamat https:// atau path assets/ di repo GitHub.
 * (Unggah logo ke Google Drive menyusul di Paket 5.)
 */
Router.register('settings', {
  title: 'Pengaturan Identitas',

  async render(el, key, token) {
    const s = await Api.call('settings.get');
    if (!Router.isCurrent(token)) return;
    const v = (k) => UI.esc(s[k] || '');

    el.innerHTML = `
      <div class="page-head"><div><h2>Pengaturan Identitas</h2><p>Nama organisasi, sekolah, pengurus, dan kop surat untuk laporan.</p></div></div>
      <form id="set-form" class="card" novalidate>
        <div class="form-grid">
          <label class="field"><span>Nama organisasi</span><input name="nama_organisasi" maxlength="100" value="${v('nama_organisasi')}"></label>
          <label class="field"><span>Nama sekolah</span><input name="nama_sekolah" maxlength="100" value="${v('nama_sekolah')}"></label>
          <label class="field"><span>Nama pembina</span><input name="nama_pembina" maxlength="100" value="${v('nama_pembina')}"></label>
          <label class="field"><span>Nama pelatih</span><input name="nama_pelatih" maxlength="100" value="${v('nama_pelatih')}"></label>
          <label class="field"><span>Nama komandan</span><input name="nama_komandan" maxlength="100" value="${v('nama_komandan')}"></label>
          <label class="field"><span>Tahun kepengurusan</span><input name="tahun_kepengurusan" maxlength="20" placeholder="2026/2027" value="${v('tahun_kepengurusan')}"></label>
          <label class="field"><span>Nomor kontak</span><input name="nomor_kontak" maxlength="50" value="${v('nomor_kontak')}"></label>
          <label class="field"><span>Zona waktu</span><input value="${v('zona_waktu')}" readonly><small>Tetap Asia/Jakarta (diatur di backend).</small></label>
          <label class="field full"><span>Alamat sekolah</span><input name="alamat_sekolah" maxlength="300" value="${v('alamat_sekolah')}"></label>
          <label class="field full"><span>Kop surat</span><textarea name="kop_surat" maxlength="1000" placeholder="Teks kop yang dicetak di laporan">${v('kop_surat')}</textarea></label>
          <label class="field"><span>Alamat logo sekolah</span><input name="logo_sekolah_url" maxlength="500" placeholder="assets/logo-sekolah.png atau https://..." value="${v('logo_sekolah_url')}"><img class="logo-preview" id="pv-sekolah" alt="" hidden></label>
          <label class="field"><span>Alamat logo Paskibra</span><input name="logo_paskibra_url" maxlength="500" placeholder="assets/logo-paskibra.png atau https://..." value="${v('logo_paskibra_url')}"><img class="logo-preview" id="pv-paskibra" alt="" hidden></label>
          <label class="field full"><span>ID folder Google Drive utama</span><input name="drive_root_folder_id" maxlength="100" value="${v('drive_root_folder_id')}"><small>Dipakai mulai Paket 5. Boleh dikosongkan sekarang.</small></label>
        </div>
        <button class="btn btn-primary" type="submit">Simpan Pengaturan</button>
      </form>`;

    const f = el.querySelector('#set-form');
    const preview = (input, imgId) => {
      const img = el.querySelector(imgId);
      const val = input.value.trim();
      if (!val) { img.hidden = true; return; }
      img.onerror = () => { img.hidden = true; };
      img.onload = () => { img.hidden = false; };
      img.src = val;
    };
    f.logo_sekolah_url.addEventListener('change', () => preview(f.logo_sekolah_url, '#pv-sekolah'));
    f.logo_paskibra_url.addEventListener('change', () => preview(f.logo_paskibra_url, '#pv-paskibra'));
    preview(f.logo_sekolah_url, '#pv-sekolah');
    preview(f.logo_paskibra_url, '#pv-paskibra');

    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const values = {};
      [...f.elements].forEach((x) => { if (x.name) values[x.name] = x.value; });
      try {
        await Api.call('settings.save', { values });
        App.applySettings(values);
        UI.toast('Pengaturan disimpan.', 'success');
      } catch (ex) {
        UI.toast(ex.message, 'error', 6000);
      }
    });
  }
});
