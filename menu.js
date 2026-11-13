/**
 * menu.js - daftar menu. `key` harus sama dengan MENU_KEYS di Config.gs.
 * ready: halaman sudah berfungsi di paket ini. paket: nomor paket pengerjaan yang akan membangunnya.
 */
const MENUS = [
  { key: 'dashboard',   label: 'Dashboard Statistik',          icon: 'layout-dashboard', ready: true },
  { key: 'students',    label: 'Data Siswa (CRUD & Import)',   icon: 'users',            paket: 2 },
  { key: 'schedules',   label: 'Jadwal Latihan',               icon: 'calendar-days',    paket: 3 },
  { key: 'attendance',  label: 'Absensi & Kehadiran Siswa',    icon: 'clipboard-check',  paket: 3 },
  { key: 'assignments', label: 'Input Penugasan',              icon: 'list-checks',      paket: 4 },
  { key: 'journals',    label: 'Jurnal / Agenda Latihan',      icon: 'book-open',        paket: 4 },
  { key: 'rewards',     label: 'Penghargaan & Poin',           icon: 'award',            paket: 4 },
  { key: 'inventory',   label: 'Inventaris & Perlengkapan',    icon: 'package',          paket: 4 },
  { key: 'coaching',    label: 'Bimbingan Pembina (BPP)',      icon: 'heart-handshake',  paket: 4 },
  { key: 'reports',     label: 'Pusat Cetak Laporan PDF',      icon: 'file-text',        paket: 5 },
  { key: 'cards',       label: 'Cetak Kartu Pelajar A4',       icon: 'contact',          paket: 5 },
  { key: 'settings',    label: 'Pengaturan Identitas',         icon: 'settings',         ready: true },
  { key: 'users',       label: 'User Management',              icon: 'user-cog',         ready: true },
  { key: 'sync',        label: 'Sinkronisasi Spreadsheet',     icon: 'refresh-cw',       paket: 5 },
  { key: 'drive',       label: 'Google Drive Sync',            icon: 'cloud',            paket: 5 },
  { key: 'backend',     label: 'Konfigurasi Backend',          icon: 'server',           ready: true }
];

const MenuUtil = {
  byKey(key) { return MENUS.find((m) => m.key === key) || null; },
  label(key) { const m = MenuUtil.byKey(key); return m ? m.label : key; }
};
