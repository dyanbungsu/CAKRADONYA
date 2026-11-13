/**
 * users.js - User Management (Administrator).
 * Tambah, ubah peran/menu, aktif-nonaktif, reset password, riwayat aktivitas.
 */
Router.register('users', {
  title: 'User Management',

  async render(el, key, token) {
    const S = { users: [], roles: [], roleMenus: {}, filter: '' };

    el.innerHTML = `
      <div class="page-head">
        <div><h2>User Management</h2><p>Kelola akun, peran, dan hak akses menu.</p></div>
        <div class="actions">
          <button class="btn btn-primary" id="u-add"><i data-lucide="plus"></i> Tambah Pengguna</button>
        </div>
      </div>
      <div class="toolbar"><input class="search" id="u-search" type="search" placeholder="Cari nama atau username" aria-label="Cari pengguna"></div>
      <div class="table-wrap" id="u-table"></div>`;

    const load = async () => {
      const d = await Api.call('users.list');
      if (!Router.isCurrent(token)) return;
      S.users = d.users; S.roles = d.roles; S.roleMenus = d.roleMenus;
      draw();
    };

    const draw = () => {
      const q = S.filter.toLowerCase();
      const rows = S.users.filter((u) => !q || u.Nama.toLowerCase().includes(q) || u.Username.toLowerCase().includes(q));
      const box = el.querySelector('#u-table');
      if (!rows.length) { box.innerHTML = '<div class="empty">Tidak ada pengguna.</div>'; return; }
      box.innerHTML = `<table class="table">
        <thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th>Status</th><th>Login terakhir</th><th>Aksi</th></tr></thead>
        <tbody>${rows.map((u) => {
          const self = u.UserID === Auth.user.userId;
          const custom = u.MenuAccess && u.MenuAccess.length;
          return `<tr>
            <td><strong>${UI.esc(u.Nama)}</strong>${self ? ' <span class="badge badge-gold">Anda</span>' : ''}</td>
            <td>${UI.esc(u.Username)}</td>
            <td>${UI.esc(u.Role)}${custom ? ' <span class="badge" title="Menu disesuaikan">menu kustom</span>' : ''}</td>
            <td><span class="badge ${u.Status === 'Aktif' ? 'badge-ok' : 'badge-err'}">${UI.esc(u.Status)}</span></td>
            <td>${UI.esc(UI.fmtDateTime(u.LastLogin))}</td>
            <td><div class="actions">
              <button class="row-btn" data-act="edit" data-id="${UI.esc(u.UserID)}"><i data-lucide="pencil"></i> Ubah</button>
              ${self ? '' : `<button class="row-btn" data-act="reset" data-id="${UI.esc(u.UserID)}"><i data-lucide="key"></i> Reset</button>
              <button class="row-btn ${u.Status === 'Aktif' ? 'danger' : ''}" data-act="status" data-id="${UI.esc(u.UserID)}"><i data-lucide="power"></i> ${u.Status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>`}
              <button class="row-btn" data-act="log" data-id="${UI.esc(u.UserID)}"><i data-lucide="history"></i> Riwayat</button>
            </div></td></tr>`;
        }).join('')}</tbody></table>`;
      UI.icons();
    };

    /* ---------- Formulir tambah/ubah ---------- */
    const menuChecks = (role, selected) => {
      if (role === 'Administrator') return '<p class="muted" style="margin:0">Administrator selalu memiliki akses ke semua menu.</p>';
      const allowed = S.roleMenus[role] || [];
      const sel = selected && selected.length ? selected : allowed;
      return `<div class="check-grid">${allowed.map((k) => `
        <label class="check"><input type="checkbox" name="menu" value="${UI.esc(k)}" ${sel.includes(k) ? 'checked' : ''} ${k === 'dashboard' ? 'disabled checked' : ''}> ${UI.esc(MenuUtil.label(k))}</label>`).join('')}</div>`;
    };

    const openForm = (user) => {
      const edit = !!user;
      const m = UI.modal({
        title: edit ? 'Ubah Pengguna' : 'Tambah Pengguna',
        wide: true,
        body: `<form id="u-form" novalidate>
          <div class="form-grid">
            <label class="field"><span>Nama lengkap</span><input name="nama" maxlength="80" required value="${UI.esc(edit ? user.Nama : '')}"></label>
            <label class="field"><span>Username</span><input name="username" maxlength="30" autocapitalize="none" ${edit ? 'disabled' : 'required'} value="${UI.esc(edit ? user.Username : '')}"><small>Huruf kecil, angka, titik, _ atau -</small></label>
            <label class="field"><span>Peran</span><select name="role" ${edit && user.UserID === Auth.user.userId ? 'disabled' : ''}>
              ${S.roles.map((r) => `<option ${edit && user.Role === r ? 'selected' : ''}>${UI.esc(r)}</option>`).join('')}</select></label>
            ${edit ? '' : `<label class="field"><span>Password awal</span><input name="password" type="text" autocomplete="off" placeholder="Kosongkan untuk dibuat otomatis"><small>Minimal 8 karakter.</small></label>`}
            <div class="field full"><span>Hak akses menu</span><div id="u-menus"></div><small>Hanya dapat mempersempit menu bawaan peran.</small></div>
          </div></form>`,
        actions: [
          { label: 'Batal' },
          {
            label: 'Simpan', kind: 'primary', keepOpen: true,
            async onClick(api) {
              const f = api.el.querySelector('#u-form');
              const role = f.role.value;
              const menus = [...f.querySelectorAll('input[name=menu]:checked')].map((c) => c.value);
              api.setBusy(true);
              try {
                if (edit) {
                  await Api.call('users.update', { userId: user.UserID, nama: f.nama.value, role: user.UserID === Auth.user.userId ? user.Role : role, menuAccess: menus });
                  UI.toast('Pengguna diperbarui.', 'success');
                  api.close();
                } else {
                  const r = await Api.call('users.create', { nama: f.nama.value, username: f.username.value, role, password: f.password.value, menuAccess: menus });
                  UI.toast('Pengguna ditambahkan.', 'success');
                  api.close();
                  if (r.tempPassword) UI.showSecret('Password Awal', 'Password awal untuk ' + f.username.value + ':', r.tempPassword);
                }
                await load();
              } catch (e) {
                UI.toast(e.message, 'error', 6000);
                api.setBusy(false);
              }
            }
          }
        ]
      });
      const f = m.el.querySelector('#u-form');
      const box = m.el.querySelector('#u-menus');
      const paint = () => { box.innerHTML = menuChecks(f.role.value, edit && f.role.value === user.Role ? user.MenuAccess : []); };
      f.role.addEventListener('change', paint);
      paint();
    };

    /* ---------- Aksi baris ---------- */
    const find = (id) => S.users.find((u) => u.UserID === id);

    // Pasang pada elemen anak (dibuat ulang tiap render), bukan pada #page yang dipakai bersama.
    el.querySelector('#u-table').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const u = find(btn.dataset.id);
      if (!u) return;
      try {
        if (btn.dataset.act === 'edit') openForm(u);
        else if (btn.dataset.act === 'status') {
          const to = u.Status === 'Aktif' ? 'Nonaktif' : 'Aktif';
          const okc = await UI.confirm({
            title: to === 'Nonaktif' ? 'Nonaktifkan pengguna?' : 'Aktifkan pengguna?',
            message: to === 'Nonaktif' ? u.Nama + ' tidak akan bisa login dan sesinya langsung dicabut.' : u.Nama + ' akan dapat login kembali.',
            confirmLabel: to === 'Nonaktif' ? 'Nonaktifkan' : 'Aktifkan', danger: to === 'Nonaktif'
          });
          if (!okc) return;
          await Api.call('users.setStatus', { userId: u.UserID, status: to });
          UI.toast('Status diperbarui.', 'success');
          await load();
        } else if (btn.dataset.act === 'reset') {
          const okc = await UI.confirm({ title: 'Reset password?', message: 'Password ' + u.Nama + ' akan diganti dengan kode sementara dan semua sesinya dicabut.', confirmLabel: 'Reset', danger: true });
          if (!okc) return;
          const r = await Api.call('users.resetPassword', { userId: u.UserID });
          UI.showSecret('Password Sementara', 'Password baru untuk ' + u.Username + ':', r.tempPassword);
        } else if (btn.dataset.act === 'log') {
          const r = await Api.call('users.activity', { userId: u.UserID });
          UI.modal({
            title: 'Riwayat Aktivitas - ' + u.Nama, wide: true,
            body: r.activity.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Waktu</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>
              ${r.activity.map((a) => `<tr><td>${UI.esc(UI.fmtDateTime(a.Timestamp))}</td><td>${UI.esc(a.Aksi)}</td><td>${UI.esc(a.Detail)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Belum ada aktivitas tercatat.</div>',
            actions: [{ label: 'Tutup' }]
          });
        }
      } catch (ex) {
        UI.toast(ex.message, 'error', 6000);
      }
    });

    el.querySelector('#u-add').addEventListener('click', () => openForm(null));
    el.querySelector('#u-search').addEventListener('input', (e) => { S.filter = e.target.value; draw(); });
    UI.icons();
    await load();
  }
});
