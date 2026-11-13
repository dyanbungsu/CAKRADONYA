/**
 * account.js - Akun Saya: profil + ganti password (semua peran).
 */
Router.register('account', {
  title: 'Akun Saya',

  render(el) {
    const u = Auth.user;
    el.innerHTML = `
      <div class="page-head"><div><h2>Akun Saya</h2></div></div>
      <div class="card">
        <h3>Profil</h3>
        <dl class="kv">
          <dt>Nama</dt><dd>${UI.esc(u.nama)}</dd>
          <dt>Username</dt><dd>${UI.esc(u.username)}</dd>
          <dt>Peran</dt><dd>${UI.esc(u.role)}</dd>
        </dl>
      </div>
      <form class="card" id="pw-form" style="max-width:520px" novalidate>
        <h3>Ganti Password</h3>
        <label class="field"><span>Password lama</span><input name="old" type="password" autocomplete="current-password" required></label>
        <label class="field"><span>Password baru</span><input name="new" type="password" autocomplete="new-password" minlength="8" required><small>Minimal 8 karakter. Sesi di perangkat lain akan dikeluarkan.</small></label>
        <label class="field"><span>Ulangi password baru</span><input name="again" type="password" autocomplete="new-password" required></label>
        <button class="btn btn-primary" type="submit">Simpan Password</button>
      </form>`;

    const f = el.querySelector('#pw-form');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (f.new.value !== f.again.value) { UI.toast('Konfirmasi password baru tidak sama.', 'error'); return; }
      if (f.new.value.length < 8) { UI.toast('Password baru minimal 8 karakter.', 'error'); return; }
      try {
        await Api.call('auth.changePassword', { oldPassword: f.old.value, newPassword: f.new.value });
        f.reset();
        UI.toast('Password berhasil diubah.', 'success');
      } catch (ex) {
        UI.toast(ex.message, 'error', 6000);
      }
    });
  }
});
