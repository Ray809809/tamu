/**
 * Sistem Informasi Manajemen Identitas & Pengguna
 * PU (Pekerjaan Umum) (PUPR)
 * Tahap 2: Manajemen Peran (Super Admin, Admin Unit, PIC)
 */

// Tingkatan 3 Peran Resmi Admin & Pengguna PUPR:
// 1. Super Admin (Wewenang Penuh, Kelola Pegawai, Disposisi Surat Laporan, Hapus Log)
// 2. Bidang (Ditjen / Unit Kerja Teknis yang Dituju, Menerima Disposisi & Memproses Laporan)
// 3. Sakres (Sekretariat / Petugas Khusus yang Menerbitkan Surat Balasan Resmi + Barcode PDF)
const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  BIDANG: 'Bidang',
  SAKRES: 'Sakres'
};

// Fungsi Sanitasi String (mencegah XSS dan error runtime undefined)
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fungsi Format Nomor HP ke Format Internasional WhatsApp (08xxx -> 628xxx)
function cleanPhoneForWa(phone) {
  if (!phone) return '';
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return clean;
}

// Format Tanggal & Waktu Kedinasan Resmi (Format Lokal Indonesia YYYY-MM-DD HH:mm:ss atau HH:mm)
function formatCurrentDateTime(includeSeconds = false) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}${includeSeconds ? `:${pad(d.getSeconds())}` : ''}`;
  return `${datePart} ${timePart}`;
}

// Normalisasi struktur data objek laporan agar seragam
function normalizeReport(r) {
  if (!r || typeof r !== 'object') return null;
  const unit = r.targetUnit || r.unit || 'Belum Didisposisi';
  return {
    ticket: r.ticket || 'PUPR-PUB-' + Math.floor(1000 + Math.random() * 9000),
    date: r.date || formatCurrentDateTime(false),
    reporterName: r.reporterName || r.nama || r.name || 'Pemohon Tanpa Nama',
    contact: r.contact || r.phone || r.telepon || '-',
    gender: r.gender || r.jenisKelamin || 'Laki-laki',
    email: r.email || '-',
    originAgency: r.originAgency || r.instansi || '-',
    applicantCategory: r.applicantCategory || r.kategori || 'Masyarakat / Tamu Pemohon',
    serviceType: r.serviceType || r.jenisLayanan || 'Layanan Pengaduan & Tamu',
    targetUnit: unit,
    unit: unit,
    subject: r.subject || r.perihal || '-',
    location: r.location || r.lokasi || '-',
    description: r.description || r.deskripsi || r.uraian || '-',
    surveyConsent: typeof r.surveyConsent === 'boolean' ? r.surveyConsent : true,
    status: r.status || 'Menunggu Verifikasi Dinas',
    // Data Surat Balasan Resmi dari Sakres
    replyLetter: r.replyLetter || null
    // Contoh struktur replyLetter:
    // {
    //   letterNo: '800/PUPR-SRT/2026',
    //   date: '2026-11-03 11:30',
    //   officialName: 'Hj. Ratna Sari, S.Kom., M.M.',
    //   officialRole: 'Sekretariat / Petugas Sakres PUPR',
    //   subject: 'Tindak Lanjut Laporan No. PUPR-LAP-1234',
    //   content: 'Dengan hormat, sehubungan dengan laporan kerusakan infrastruktur yang Saudara ajukan...',
    //   pdfUrl: 'data:... / blob:...',
    //   barcodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=...'
    // }
  };
}

// Daftar Unit Kerja Resmi di Lingkungan PU Pekerjaan Umum
const DAFTAR_UNIT_PUPR = [
  'Ditjen Bina Marga',
  'Ditjen Sumber Daya Air',
  'Ditjen Cipta Karya',
  'Ditjen Perumahan',
  'Ditjen Bina Konstruksi',
  'Ditjen Pembiayaan Infrastruktur',
  'Sekretariat Jenderal',
  'Inspektorat Jenderal',
  'Badan Pengembangan SDM (BPSDM)',
  'Balai Besar Pelaksanaan Jalan Nasional (BBPJN)',
  'Balai Wilayah Sungai (BWS)'
];

// Data Awal Pegawai PUPR (3 Peran: Super Admin, Bidang, Sakres)
const SEED_PEGAWAI_V2 = [
  {
    id: 'admin123',
    nama: 'Drs. Bambang Sudiro, M.Si.',
    pw: 'admin123',
    unit: 'Sekretariat Jenderal',
    role: ROLES.SUPER_ADMIN,
    createdAt: '2026-10-01 08:00'
  },
  {
    id: 'PUPR-SUP01',
    nama: 'Drs. Bambang Sudiro, M.Si. (Alternatif)',
    pw: 'admin123',
    unit: 'Sekretariat Jenderal',
    role: ROLES.SUPER_ADMIN,
    createdAt: '2026-10-01 08:00'
  },
  {
    id: 'PUPR-SAKRES01',
    nama: 'Hj. Ratna Sari, S.Kom., M.M.',
    pw: 'admin123',
    unit: 'Sekretariat / Sakres',
    role: ROLES.SAKRES,
    createdAt: '2026-10-05 08:30'
  },
  {
    id: 'PUPR-BDG-BM',
    nama: 'Ir. Hendra Gunawan, S.T., M.T.',
    pw: 'admin123',
    unit: 'Ditjen Bina Marga',
    role: ROLES.BIDANG,
    createdAt: '2026-10-15 08:30'
  },
  {
    id: 'PUPR-BDG-SDA',
    nama: 'Dewi Lestari, S.T.',
    pw: 'admin123',
    unit: 'Ditjen Sumber Daya Air',
    role: ROLES.BIDANG,
    createdAt: '2026-10-18 09:15'
  },
  {
    id: 'PUPR-BDG-CK',
    nama: 'Agus Setiawan, S.E., M.T.',
    pw: 'admin123',
    unit: 'Ditjen Cipta Karya',
    role: ROLES.BIDANG,
    createdAt: '2026-10-22 13:45'
  },
  {
    id: 'PUPR-BDG-PR',
    nama: 'Budi Santoso, S.T.',
    pw: 'admin123',
    unit: 'Ditjen Perumahan',
    role: ROLES.BIDANG,
    createdAt: '2026-10-25 10:20'
  }
];

// Data Awal Log Aktivitas Kedinasan (Audit Trail)
const SEED_AUDIT_LOGS = [
  {
    id: 'LOG-001',
    time: '2026-11-02 08:30:15',
    actorId: 'PUPR-SUP01',
    actorName: 'Drs. Bambang Sudiro, M.Si.',
    role: 'Super Admin',
    action: 'Autentikasi Masuk',
    details: 'Berhasil login ke portal pusat PU Pekerjaan Umum',
    unit: 'Sekretariat Jenderal',
    status: 'Sukses'
  },
  {
    id: 'LOG-002',
    time: '2026-11-02 08:45:22',
    actorId: 'PUPR-ADM-BM',
    actorName: 'Ir. Hendra Gunawan',
    role: 'Admin Unit',
    action: 'Verifikasi Pegawai',
    details: 'Memeriksa berkas penugasan staf PIC Ditjen Bina Marga',
    unit: 'Ditjen Bina Marga',
    status: 'Sukses'
  },
  {
    id: 'LOG-003',
    time: '2026-11-02 09:12:00',
    actorId: 'PUPR-ADM-SDA',
    actorName: 'Dewi Lestari, S.T.',
    role: 'Admin Unit',
    action: 'Pembaruan Data',
    details: 'Memperbarui data akun PIC Ditjen Sumber Daya Air',
    unit: 'Ditjen Sumber Daya Air',
    status: 'Sukses'
  },
  {
    id: 'LOG-004',
    time: '2026-11-02 09:50:41',
    actorId: 'PUPR-SUP01',
    actorName: 'Drs. Bambang Sudiro, M.Si.',
    role: 'Super Admin',
    action: 'Sinkronisasi Sistem',
    details: 'Pemeriksaan integritas basis data 11 Unit Organisasi PUPR',
    unit: 'Sekretariat Jenderal',
    status: 'Sukses'
  }
];

// Penyimpanan Lokal (LocalStorage) dengan Auto-Migration
const Storage = {
  getUsers() {
    const data = localStorage.getItem('pupr_users_v2');
    if (!data) {
      localStorage.setItem('pupr_users_v2', JSON.stringify(SEED_PEGAWAI_V2));
      return SEED_PEGAWAI_V2;
    }
    try {
      let users = JSON.parse(data);
      if (!Array.isArray(users) || users.length === 0) {
        localStorage.setItem('pupr_users_v2', JSON.stringify(SEED_PEGAWAI_V2));
        return SEED_PEGAWAI_V2;
      }
      // Pastikan ada akun admin123 dan seluruh password disinkronkan ke admin123
      let needsResave = false;
      const hasAdmin123 = users.some(u => u.id.toLowerCase() === 'admin123');
      if (!hasAdmin123) {
        users.unshift({
          id: 'admin123',
          nama: 'Drs. Bambang Sudiro, M.Si.',
          pw: 'admin123',
          unit: 'Sekretariat Jenderal',
          role: ROLES.SUPER_ADMIN,
          createdAt: '2026-10-01 08:00'
        });
        needsResave = true;
      }

      users = users.map((u) => {
        if (!u.role) {
          needsResave = true;
          if (u.id.includes('SUP') || u.id === 'admin123') u.role = ROLES.SUPER_ADMIN;
          else if (u.id.includes('ADM')) u.role = ROLES.ADMIN_UNIT;
          else u.role = ROLES.PIC;
        }
        if (u.id === 'admin123' || u.id === 'PUPR-SUP01' || u.pw === 'pupr123' || u.pw === 'admin12') {
          u.pw = 'admin123';
          needsResave = true;
        }
        return u;
      });
      if (needsResave) {
        localStorage.setItem('pupr_users_v2', JSON.stringify(users));
      }
      return users;
    } catch (e) {
      return SEED_PEGAWAI_V2;
    }
  },

  saveUsers(users) {
    localStorage.setItem('pupr_users_v2', JSON.stringify(users));
  },

  getSession() {
    const session = localStorage.getItem('pupr_session_v2');
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch (e) {
      return null;
    }
  },

  setSession(user) {
    localStorage.setItem('pupr_session_v2', JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem('pupr_session_v2');
  },

  getAuditLogs() {
    const data = localStorage.getItem('pupr_audit_logs');
    if (!data) {
      localStorage.setItem('pupr_audit_logs', JSON.stringify(SEED_AUDIT_LOGS));
      return SEED_AUDIT_LOGS;
    }
    try {
      const logs = JSON.parse(data);
      return Array.isArray(logs) ? logs : SEED_AUDIT_LOGS;
    } catch (e) {
      return SEED_AUDIT_LOGS;
    }
  },

  addAuditLog(actorId, actorName, role, action, details, unit) {
    const logs = this.getAuditLogs();
    const now = new Date();
    const dateStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');

    const newLog = {
      id: 'LOG-' + Date.now().toString().slice(-5),
      time: dateStr,
      actorId: actorId || '-',
      actorName: actorName || 'Sistem',
      role: role || '-',
      action: action,
      details: details,
      unit: unit || '-',
      status: 'Sukses'
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.length = 100;
    localStorage.setItem('pupr_audit_logs', JSON.stringify(logs));
  },

  clearAuditLogs() {
    localStorage.setItem('pupr_audit_logs', JSON.stringify([]));
  },

  getPublicReports() {
    const data = localStorage.getItem('pupr_public_reports');
    if (!data) {
      localStorage.setItem('pupr_public_reports', JSON.stringify([]));
      return [];
    }
    try {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        localStorage.setItem('pupr_public_reports', JSON.stringify([]));
        return [];
      }
      return parsed.map(normalizeReport).filter(Boolean);
    } catch (e) {
      localStorage.setItem('pupr_public_reports', JSON.stringify([]));
      return [];
    }
  },

  addPublicReport(report) {
    const validReport = normalizeReport(report);
    if (!validReport) return;
    const list = this.getPublicReports();
    list.unshift(validReport);
    localStorage.setItem('pupr_public_reports', JSON.stringify(list));
  },

  getResetRequests() {
    const data = localStorage.getItem('pupr_reset_requests');
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  addResetRequest(req) {
    const list = this.getResetRequests();
    list.unshift(req);
    localStorage.setItem('pupr_reset_requests', JSON.stringify(list));
  },

  saveResetRequests(list) {
    localStorage.setItem('pupr_reset_requests', JSON.stringify(list));
  },

  resetAll() {
    localStorage.removeItem('pupr_users_v2');
    localStorage.removeItem('pupr_session_v2');
    localStorage.removeItem('pupr_audit_logs');
    localStorage.removeItem('pupr_public_reports');
    localStorage.setItem('pupr_users_v2', JSON.stringify(SEED_PEGAWAI_V2));
    localStorage.setItem('pupr_audit_logs', JSON.stringify(SEED_AUDIT_LOGS));
  }
};

// State Aplikasi
let currentUser = null;
let editingUserId = null;

// Elemen Antarmuka (DOM)
const elements = {
  // Tampilan Utama (Gerbang, Publik, Auth Pegawai, Dashboard)
  gatewaySection: document.getElementById('gatewaySection'),
  publicPortalSection: document.getElementById('publicPortalSection'),
  authSection: document.getElementById('authSection'),
  dashboardSection: document.getElementById('dashboardSection'),

  // Tombol Gerbang
  btnGatewayEmployee: document.getElementById('btnGatewayEmployee'),
  btnGatewayPublic: document.getElementById('btnGatewayPublic'),
  btnBackFromEmployee: document.getElementById('btnBackFromEmployee'),
  btnBackFromPublic: document.getElementById('btnBackFromPublic'),

  // Portal Publik
  publicReportForm: document.getElementById('publicReportForm'),
  publicReportTotalCount: document.getElementById('publicReportTotalCount'),
  publicReportTableBody: document.getElementById('publicReportTableBody'),
  tabPublicCreate: document.getElementById('tabPublicCreate'),
  tabPublicTrack: document.getElementById('tabPublicTrack'),
  tabPublicList: document.getElementById('tabPublicList'),
  publicCreateContent: document.getElementById('publicCreateContent'),
  publicTrackContent: document.getElementById('publicTrackContent'),
  publicListContent: document.getElementById('publicListContent'),
  btnTrackTicket: document.getElementById('btnTrackTicket'),
  trackTicketInput: document.getElementById('trackTicketInput'),
  trackResultArea: document.getElementById('trackResultArea'),

  // Kotak Masuk Permohonan Publik (Admin & Staf)
  menuCountInboxPublic: document.getElementById('menuCountInboxPublic'),
  inboxSearchInput: document.getElementById('inboxSearchInput'),
  inboxFilterStatus: document.getElementById('inboxFilterStatus'),
  inboxTableBody: document.getElementById('inboxTableBody'),
  checkAllInbox: document.getElementById('checkAllInbox'),
  btnBatchApproveInbox: document.getElementById('btnBatchApproveInbox'),
  btnExportInboxPublic: document.getElementById('btnExportInboxPublic'),

  // Tab Login / Registrasi / Barcode
  tabLogin: document.getElementById('tabLogin'),
  tabBarcode: document.getElementById('tabBarcode'),
  tabRegister: document.getElementById('tabRegister'),
  loginFormContainer: document.getElementById('loginFormContainer'),
  barcodeFormContainer: document.getElementById('barcodeFormContainer'),
  registerFormContainer: document.getElementById('registerFormContainer'),
  barcodeLoginForm: document.getElementById('barcodeLoginForm'),
  barcodeInput: document.getElementById('barcodeInput'),
  btnSimulateScan: document.getElementById('btnSimulateScan'),

  // Form
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  modalUserForm: document.getElementById('modalUserForm'),

  // Header Bar
  navUserPanel: document.getElementById('navUserPanel'),
  navAvatar: document.getElementById('navAvatar'),
  navUserName: document.getElementById('navUserName'),
  navUserUnit: document.getElementById('navUserUnit'),
  navLogoutBtn: document.getElementById('navLogoutBtn'),

  // Dashboard
  heroAvatar: document.getElementById('heroAvatar'),
  heroUserName: document.getElementById('heroUserName'),
  heroUserId: document.getElementById('heroUserId'),
  heroUserUnit: document.getElementById('heroUserUnit'),
  heroUserRole: document.getElementById('heroUserRole'),
  roleInfoAlert: document.getElementById('roleInfoAlert'),
  roleInfoText: document.getElementById('roleInfoText'),
  roleInfoBadge: document.getElementById('roleInfoBadge'),
  btnLogout: document.getElementById('btnLogout'),
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),

  // Statistik
  statTotalUsers: document.getElementById('statTotalUsers'),
  statLabelTotal: document.getElementById('statLabelTotal'),
  statTotalUnits: document.getElementById('statTotalUnits'),
  statLabelUnit: document.getElementById('statLabelUnit'),
  statActiveStatus: document.getElementById('statActiveStatus'),

  // Tabel & Filter
  usersTableBody: document.getElementById('usersTableBody'),
  searchInput: document.getElementById('searchInput'),
  filterUnit: document.getElementById('filterUnit'),

  // Modal Dialog
  userModal: document.getElementById('userModal'),
  modalTitle: document.getElementById('modalTitle'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  modalCancelBtn: document.getElementById('modalCancelBtn'),
  modalRole: document.getElementById('modalRole'),
  modalUnit: document.getElementById('modalUnit'),

  // Toast & Login Inline Alert
  toastContainer: document.getElementById('toastContainer'),
  authMainTitle: document.getElementById('authMainTitle'),
  authMainSubtitle: document.getElementById('authMainSubtitle'),
  loginAlert: document.getElementById('loginAlert'),
  loginAlertTitle: document.getElementById('loginAlertTitle'),
  loginAlertMsg: document.getElementById('loginAlertMsg'),
  rememberMe: document.getElementById('rememberMe'),

  // Sidebar Navigator (Pojok Kiri Atas) & Halaman Modular
  btnToggleSidebar: document.getElementById('btnToggleSidebar'),
  dashboardSidebar: document.getElementById('dashboardSidebar'),
  sidebarAvatar: document.getElementById('sidebarAvatar'),
  sidebarUserName: document.getElementById('sidebarUserName'),
  sidebarUserRole: document.getElementById('sidebarUserRole'),
  sidebarLogoutBtn: document.getElementById('sidebarLogoutBtn'),
  menuCountUsers: document.getElementById('menuCountUsers'),
  rekapTableBody: document.getElementById('rekapTableBody'),
  unitsCardContainer: document.getElementById('unitsCardContainer'),
  cardProfileId: document.getElementById('cardProfileId'),
  cardProfileNama: document.getElementById('cardProfileNama'),
  cardProfileUnit: document.getElementById('cardProfileUnit'),
  cardProfileRole: document.getElementById('cardProfileRole'),
  profileForm: document.getElementById('profileForm'),
  profileNama: document.getElementById('profileNama'),
  profileNewPw: document.getElementById('profileNewPw'),

  // Bilah Atas (Top Bar Widgets, Notifikasi, Helpdesk)
  topbarCenterWidgets: document.getElementById('topbarCenterWidgets'),
  topbarClockText: document.getElementById('topbarClockText'),
  btnTopbarNotif: document.getElementById('btnTopbarNotif'),
  notifBadgeDot: document.getElementById('notifBadgeDot'),
  notifDropdown: document.getElementById('notifDropdown'),
  btnCloseNotif: document.getElementById('btnCloseNotif'),
  btnTopbarHelp: document.getElementById('btnTopbarHelp'),
  helpdeskModal: document.getElementById('helpdeskModal'),
  helpdeskCloseBtn: document.getElementById('helpdeskCloseBtn'),
  helpdeskOkBtn: document.getElementById('helpdeskOkBtn'),

  // Halaman Laporan & Ekspor
  reportFilterUnit: document.getElementById('reportFilterUnit'),
  reportFilterRole: document.getElementById('reportFilterRole'),
  reportTableBody: document.getElementById('reportTableBody'),
  reportSummaryCount: document.getElementById('reportSummaryCount'),
  btnExportCsv: document.getElementById('btnExportCsv'),
  btnPrintReport: document.getElementById('btnPrintReport'),
  reportPrintTimestamp: document.getElementById('reportPrintTimestamp'),

  // Halaman Log Aktivitas (Audit Trail)
  auditSearchInput: document.getElementById('auditSearchInput'),
  auditTableBody: document.getElementById('auditTableBody'),
  btnClearAudit: document.getElementById('btnClearAudit')
};

// Deskripsi 11 Unit Kerja Resmi PU Pekerjaan Umum
const UNIT_DETAILS = {
  'Ditjen Bina Marga': 'Penyelenggaraan jalan nasional, jembatan strategis, dan konektivitas transportasi darat nasional.',
  'Ditjen Sumber Daya Air': 'Pengelolaan bendungan, irigasi lumbung pangan, pengendalian banjir, dan ketahanan air.',
  'Ditjen Cipta Karya': 'Pengembangan kawasan permukiman, air minum SPAM, sanitasi, dan tata bangunan negara.',
  'Ditjen Perumahan': 'Penyediaan rumah susun, rumah khusus, bantuan stimulan swadaya (BSPS), dan perumahan rakyat.',
  'Ditjen Bina Konstruksi': 'Pembinaan industri jasa konstruksi, sertifikasi tenaga ahli, dan rantai pasok material.',
  'Ditjen Pembiayaan Infrastruktur': 'Pengembangan investasi infrastruktur PU dan perumahan melalui skema KPBU.',
  'Sekretariat Jenderal': 'Koordinasi tugas, pembinaan administrasi, hukum, kepegawaian, organisasi, dan humas.',
  'Inspektorat Jenderal': 'Pengawasan intern, audit tata kelola pemerintahan yang bersih (WBK/WBBM), dan kepatuhan.',
  'Badan Pengembangan SDM (BPSDM)': 'Pendidikan, pelatihan, dan pengembangan kompetensi aparatur sipil negara PUPR.',
  'Balai Besar Pelaksanaan Jalan Nasional (BBPJN)': 'Unit pelaksana teknis preservasi dan pembangunan jalan & jembatan di wilayah Indonesia.',
  'Balai Wilayah Sungai (BWS)': 'Unit pelaksana teknis konservasi dan pendayagunaan air di wilayah sungai/DAS.'
};

// Inline Alert Helper
function showLoginAlert(title, message) {
  if (elements.loginAlert) {
    if (elements.loginAlertTitle) elements.loginAlertTitle.textContent = title;
    if (elements.loginAlertMsg) elements.loginAlertMsg.textContent = message;
    elements.loginAlert.classList.add('active');
  }
}

function hideLoginAlert() {
  if (elements.loginAlert) {
    elements.loginAlert.classList.remove('active');
  }
}

window.showHelpInfo = function () {
  showToast('Bantuan Akses', 'Gunakan kartu akun uji coba di panel sisi kiri atau hubungi Admin Unit kerja Anda.', 'info');
};

// Inisial Nama Pegawai
function getInitials(name) {
  if (!name) return 'P';
  const cleanName = name.replace(/^(Ir\.|Drs\.|Dr\.)\s*/i, '').trim();
  const parts = cleanName.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Format Tanggal
function formatDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Helper Status & Badge Laporan Kedinasan (3 Warna Indikator: Merah = Belum ACC, Kuning = Diproses, Hijau = Sudah ACC)
function getReportStatusInfo(status = '') {
  const s = String(status || '').toLowerCase();
  if (s.includes('selesai') || s.includes('disetujui') || s.includes('acc') || s.includes('sukses')) {
    return {
      category: 'acc',
      label: 'Sudah di-ACC',
      fullText: '✓ Disetujui (Sudah ACC)',
      colorHex: '#16A34A',
      badgeBg: '#DCFCE7',
      badgeBorder: '#16A34A',
      badgeText: '#166534',
      itemBg: '#F0FDF4',
      borderLeft: '#16A34A',
      icon: '✓'
    };
  } else if (s.includes('tindak') || s.includes('proses') || s.includes('sedang')) {
    return {
      category: 'proses',
      label: 'Sedang Diproses',
      fullText: '⏳ Sedang Diproses Bidang',
      colorHex: '#D97706',
      badgeBg: '#FEF3C7',
      badgeBorder: '#F59E0B',
      badgeText: '#92400E',
      itemBg: '#FFFBEB',
      borderLeft: '#F59E0B',
      icon: '⚙️'
    };
  } else {
    // Default: Belum ACC (Menunggu Verifikasi / Baru Masuk)
    return {
      category: 'belum',
      label: 'Belum di-ACC',
      fullText: 'Belum di-ACC (Menunggu Telaah)',
      colorHex: '#DC2626',
      badgeBg: '#FEE2E2',
      badgeBorder: '#EF4444',
      badgeText: '#991B1B',
      itemBg: '#FEF2F2',
      borderLeft: '#EF4444',
      icon: '⚠️'
    };
  }
}

function getReportStatusBadge(status) {
  const info = getReportStatusInfo(status);
  return `<span class="badge-role" style="background:${info.badgeBg}; color:${info.badgeText}; border:1px solid ${info.badgeBorder}; font-weight:800; font-size:0.75rem; padding:0.25rem 0.65rem; border-radius:4px; display:inline-flex; align-items:center; gap:0.25rem;">
    <span>${info.icon}</span> ${info.label}
  </span>`;
}

// Helper Badge Role (3 Peran: Super Admin, Bidang, Sakres)
function getRoleBadge(role) {
  if (role === ROLES.SUPER_ADMIN) {
    return `<span class="badge-role badge-role-super">Super Admin</span>`;
  } else if (role === ROLES.SAKRES) {
    return `<span class="badge-role" style="background:#7C3AED; color:#fff; font-weight:700;">Sakres (Sekretariat)</span>`;
  } else if (role === ROLES.BIDANG) {
    return `<span class="badge-role badge-role-admin">Admin Bidang</span>`;
  }
  return `<span class="badge-role badge-role-pic">${escapeHtml(role || 'Petugas')}</span>`;
}

// Notifikasi Sistem Toast
function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  
  // Tentukan warna khusus jika status notifikasi berupa ACC / Proses / Belum ACC
  let customStyle = '';
  if (type === 'belum_acc' || type === 'error' || type === 'danger') {
    customStyle = 'border-left: 4px solid #EF4444; background: #FEF2F2; color: #991B1B;';
  } else if (type === 'proses' || type === 'warning') {
    customStyle = 'border-left: 4px solid #F59E0B; background: #FFFBEB; color: #92400E;';
  } else if (type === 'acc' || type === 'success') {
    customStyle = 'border-left: 4px solid #10B981; background: #F0FDF4; color: #166534;';
  }

  toast.className = `toast-msg toast-${type}`;
  if (customStyle) {
    toast.style.cssText = customStyle;
  }
  toast.innerHTML = `
    <div class="toast-msg-title" style="font-weight:800;">${title}</div>
    <div class="toast-msg-desc" style="font-size:0.8rem;">${message}</div>
  `;

  if (elements.toastContainer) {
    elements.toastContainer.appendChild(toast);
  } else {
    document.body.appendChild(toast);
  }

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Isi Dropdown Pilihan Unit PUPR
function populateUnitOptions() {
  const selects = [
    document.getElementById('regUnit'),
    elements.modalUnit,
    elements.filterUnit
  ];

  selects.forEach((select) => {
    if (!select) return;
    const isFilter = select === elements.filterUnit;
    select.innerHTML = isFilter ? '<option value="">Semua Unit Kerja</option>' : '';

    DAFTAR_UNIT_PUPR.forEach((unit) => {
      const opt = document.createElement('option');
      opt.value = unit;
      opt.textContent = unit;
      select.appendChild(opt);
    });
  });
}

// Isi Dropdown Pilihan Role (3 Peran Resmi: Super Admin, Bidang, Sakres)
function populateRoleOptions(targetSelect, isSelfSuperAdmin = false) {
  if (!targetSelect) return;
  targetSelect.innerHTML = '';

  const options = [];
  if (isSelfSuperAdmin) {
    options.push(ROLES.SUPER_ADMIN);
  }
  options.push(ROLES.SAKRES);
  options.push(ROLES.BIDANG);

  options.forEach((role) => {
    const opt = document.createElement('option');
    opt.value = role;
    opt.textContent = role === ROLES.SAKRES ? 'Sakres (Sekretariat Surat Balasan)' : (role === ROLES.BIDANG ? 'Bidang (Pelaksana Teknis Unit)' : role);
    targetSelect.appendChild(opt);
  });
}

// Rekomendasi ID Berikutnya
function getNextId(role = ROLES.BIDANG) {
  const users = Storage.getUsers();
  let prefix = 'PUPR-';
  if (role === ROLES.SUPER_ADMIN) prefix = 'PUPR-SUP';
  else if (role === ROLES.SAKRES) prefix = 'PUPR-SAKRES';
  else prefix = 'PUPR-BDG-';

  const count = users.filter((u) => u.role === role).length + 1;
  return `${prefix}${String(count).padStart(2, '0')}`;
}

// Tab Switcher Login vs Barcode vs Daftar
function switchAuthTab(mode) {
  hideLoginAlert();
  if (elements.tabLogin) elements.tabLogin.classList.remove('active');
  if (elements.tabBarcode) elements.tabBarcode.classList.remove('active');
  if (elements.tabRegister) elements.tabRegister.classList.remove('active');

  if (elements.loginFormContainer) elements.loginFormContainer.style.display = 'none';
  if (elements.barcodeFormContainer) elements.barcodeFormContainer.style.display = 'none';
  if (elements.registerFormContainer) elements.registerFormContainer.style.display = 'none';

  if (mode === 'login') {
    if (elements.tabLogin) elements.tabLogin.classList.add('active');
    if (elements.loginFormContainer) elements.loginFormContainer.style.display = 'block';
    if (elements.authMainTitle) {
      elements.authMainTitle.textContent = 'Akses Pengguna';
      elements.authMainSubtitle.textContent = 'Silakan masuk menggunakan ID User / NIP dan Kata Sandi Anda';
    }
  } else if (mode === 'barcode') {
    if (elements.tabBarcode) elements.tabBarcode.classList.add('active');
    if (elements.barcodeFormContainer) elements.barcodeFormContainer.style.display = 'block';
    if (elements.authMainTitle) {
      elements.authMainTitle.textContent = 'Autentikasi Barcode Pegawai';
      elements.authMainSubtitle.textContent = 'Scan ID Card atau ketik kode barcode pegawai PU';
    }
    setTimeout(() => {
      if (elements.barcodeInput) elements.barcodeInput.focus();
    }, 100);
  } else {
    if (elements.tabRegister) elements.tabRegister.classList.add('active');
    if (elements.registerFormContainer) elements.registerFormContainer.style.display = 'block';
    if (elements.authMainTitle) {
      elements.authMainTitle.textContent = 'Pendaftaran Akun Baru';
      elements.authMainSubtitle.textContent = 'Daftarkan data pegawai dan tentukan unit kerja resmi PUPR';
    }

    // Populate role options di form registrasi
    const regRoleSelect = document.getElementById('regRole');
    if (regRoleSelect) {
      populateRoleOptions(regRoleSelect, false);
      const idInput = document.getElementById('regId');
      if (idInput && !idInput.value) {
        idInput.value = getNextId(regRoleSelect.value);
      }
    }
  }
}

// Pindah Tampilan Utama (Gateway vs Public vs Auth Pegawai vs Dashboard)
function showView(view) {
  // Sembunyikan semua section
  if (elements.gatewaySection) elements.gatewaySection.classList.remove('active');
  if (elements.publicPortalSection) elements.publicPortalSection.classList.remove('active');
  if (elements.authSection) elements.authSection.classList.remove('active');
  if (elements.dashboardSection) elements.dashboardSection.classList.remove('active');

  if (view === 'dashboard' && currentUser) {
    elements.dashboardSection.classList.add('active');

    // Tampilkan tombol toggle navigator di pojok kiri atas
    if (elements.btnToggleSidebar) {
      elements.btnToggleSidebar.style.display = 'inline-flex';
    }

    // Tampilkan widget jam & status server di topbar
    if (elements.topbarCenterWidgets) {
      elements.topbarCenterWidgets.style.display = 'flex';
    }

    // Tampilkan info user di header atas
    elements.navUserPanel.style.display = 'flex';
    elements.navAvatar.textContent = getInitials(currentUser.nama);
    elements.navUserName.textContent = currentUser.nama;
    elements.navUserUnit.textContent = `${currentUser.role} • ${currentUser.unit}`;

    // Tampilkan info user di kartu Sidebar
    if (elements.sidebarAvatar) elements.sidebarAvatar.textContent = getInitials(currentUser.nama);
    if (elements.sidebarUserName) elements.sidebarUserName.textContent = currentUser.nama;
    if (elements.sidebarUserRole) elements.sidebarUserRole.innerHTML = getRoleBadge(currentUser.role);

    // Tampilkan kartu sambutan hero
    elements.heroAvatar.textContent = getInitials(currentUser.nama);
    elements.heroUserName.textContent = currentUser.nama;
    elements.heroUserId.textContent = currentUser.id;
    elements.heroUserUnit.textContent = currentUser.unit;
    elements.heroUserRole.innerHTML = getRoleBadge(currentUser.role);

    // Konfigurasi Hak Akses 3 Peran: Super Admin, Bidang, Sakres
    const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
    const isSakres = currentUser.role === ROLES.SAKRES;

    if (isSuperAdmin) {
      elements.roleInfoText.innerHTML = `Anda masuk sebagai <strong>Super Admin</strong>. Wewenang penuh mengelola akun dinas, menentukan disposisi laporan masuk ke Bidang/Sakres, dan persetujuan akhir.`;
      elements.roleInfoBadge.innerHTML = `<span class="badge-role badge-role-super">Akses Penuh Super Admin</span>`;
      elements.btnOpenAddModal.style.display = 'inline-flex';
      elements.filterUnit.disabled = false;
      elements.filterUnit.value = ''; // Super Admin melihat semua unit
    } else if (isSakres) {
      elements.roleInfoText.innerHTML = `Anda masuk sebagai <strong>Sakres (Sekretariat Surat Balasan)</strong>. Wewenang memproses dan menerbitkan <strong>Surat Balasan Kedinasan Resmi &amp; QR Code Dokumen PDF</strong> untuk pelapor tamu.`;
      elements.roleInfoBadge.innerHTML = `<span class="badge-role" style="background:#7C3AED; color:#fff; font-weight:700;">Wewenang Sakres (Penerbit Surat Balasan)</span>`;
      elements.btnOpenAddModal.style.display = 'none';
      elements.filterUnit.value = '';
      elements.filterUnit.disabled = false;
    } else {
      // Bidang
      elements.roleInfoText.innerHTML = `Anda masuk sebagai <strong>Admin Bidang (${currentUser.unit})</strong>. Wewenang meninjau dan mengeksekusi disposisi laporan teknis sesuai unit kerja Anda.`;
      elements.roleInfoBadge.innerHTML = `<span class="badge-role badge-role-admin">Pelaksana Bidang: ${currentUser.unit}</span>`;
      elements.btnOpenAddModal.style.display = 'none';
      elements.filterUnit.value = currentUser.unit;
      elements.filterUnit.disabled = true;
    }

    // Perbarui badge jumlah total pegawai & laporan publik di menu navigator
    const allUsers = Storage.getUsers();
    if (elements.menuCountUsers) {
      elements.menuCountUsers.textContent = allUsers.length;
    }
    updateInboxBadge();
    updateResetRequestsBadge();

    // Buka LANGSUNG HALAMAN KOTAK MASUK DATA LAPORAN secara default saat admin/pegawai login
    switchSidebarPage('pageInboxPublic');
  } else if (view === 'auth') {
    // Portal Login Internal Pegawai
    if (elements.authSection) elements.authSection.classList.add('active');
    hideAuthenticatedWidgets();
    switchAuthTab('login');
  } else if (view === 'public') {
    // Portal Layanan Publik (Warga & Perusahaan)
    if (elements.publicPortalSection) elements.publicPortalSection.classList.add('active');
    hideAuthenticatedWidgets();
    renderPublicReportsTable();
  } else {
    // Default: Gerbang Pemilihan Portal (Gateway)
    if (elements.gatewaySection) elements.gatewaySection.classList.add('active');
    hideAuthenticatedWidgets();
  }
}

function hideAuthenticatedWidgets() {
  if (elements.navUserPanel) elements.navUserPanel.style.display = 'none';
  if (elements.btnToggleSidebar) elements.btnToggleSidebar.style.display = 'none';
  if (elements.topbarCenterWidgets) elements.topbarCenterWidgets.style.display = 'none';
  if (elements.notifDropdown) elements.notifDropdown.style.display = 'none';
}

// Beralih Halaman Melalui Menu Navigator Sidebar
window.switchSidebarPage = function (targetPageId) {
  // Update tombol menu aktif di sidebar
  document.querySelectorAll('.sidebar-menu-btn').forEach((btn) => {
    if (btn.getAttribute('data-page') === targetPageId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Tampilkan container konten yang sesuai
  document.querySelectorAll('.tab-page-content').forEach((page) => {
    if (page.id === targetPageId) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });

  // Render konten sesuai halaman
  if (targetPageId === 'pageDashboard') {
    renderDashboardTable();
    renderRekapTable();
  } else if (targetPageId === 'pageUsers') {
    renderDashboardTable();
  } else if (targetPageId === 'pageUnits') {
    renderUnitsGrid();
  } else if (targetPageId === 'pageReports') {
    renderReportsPage();
  } else if (targetPageId === 'pageAudit') {
    renderAuditPage();
  } else if (targetPageId === 'pageInboxPublic') {
    renderInboxPublicPage();
  } else if (targetPageId === 'pageResetRequests') {
    renderResetRequestsTable();
  } else if (targetPageId === 'pageProfile') {
    renderProfilePage();
  }

  // Tutup sidebar drawer setelah opsi menu diklik
  if (elements.dashboardSidebar) {
    elements.dashboardSidebar.classList.remove('sidebar-open');
    elements.dashboardSidebar.classList.remove('mobile-open');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (backdrop) backdrop.classList.remove('active');
  }
};

// Render Halaman Laporan & Ekspor Data
function renderReportsPage() {
  if (!elements.reportTableBody) return;
  const allUsers = Storage.getUsers();

  // Inisialisasi pilihan unit
  if (elements.reportFilterUnit && elements.reportFilterUnit.options.length <= 1) {
    if (currentUser.role === ROLES.SUPER_ADMIN) {
      elements.reportFilterUnit.innerHTML = '<option value="">Semua Unit Kerja (11 Unit)</option>' +
        DAFTAR_UNIT_PUPR.map((u) => `<option value="${u}">${u}</option>`).join('');
      elements.reportFilterUnit.disabled = false;
    } else {
      elements.reportFilterUnit.innerHTML = `<option value="${currentUser.unit}">${currentUser.unit}</option>`;
      elements.reportFilterUnit.disabled = true;
    }
  }

  const selectedUnit = elements.reportFilterUnit ? elements.reportFilterUnit.value : '';
  const selectedRole = elements.reportFilterRole ? elements.reportFilterRole.value : '';

  let filtered = allUsers;
  if (selectedUnit) {
    filtered = filtered.filter((u) => u.unit === selectedUnit);
  } else if (currentUser.role !== ROLES.SUPER_ADMIN) {
    filtered = filtered.filter((u) => u.unit === currentUser.unit);
  }

  if (selectedRole) {
    filtered = filtered.filter((u) => u.role === selectedRole);
  }

  // Render Baris Tabel Laporan
  if (filtered.length === 0) {
    elements.reportTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">
          Tidak ada data pegawai yang sesuai dengan filter laporan yang dipilih.
        </td>
      </tr>
    `;
  } else {
    elements.reportTableBody.innerHTML = filtered.map((u, idx) => `
      <tr>
        <td><span style="font-weight:700; color:var(--text-muted);">${idx + 1}</span></td>
        <td><span class="id-badge">${u.id}</span></td>
        <td><span style="font-weight:700; color:var(--pupr-navy);">${u.nama}</span></td>
        <td>${u.unit}</td>
        <td>${getRoleBadge(u.role)}</td>
        <td><span class="badge-role badge-role-pic" style="background:#DCFCE7; color:#166534;">Aktif Kedinasan</span></td>
      </tr>
    `).join('');
  }

  if (elements.reportSummaryCount) {
    elements.reportSummaryCount.innerHTML = `Total data siap cetak: <strong>${filtered.length}</strong> pegawai`;
  }
}

// Unduh Laporan Format CSV / Excel
window.exportReportCsv = function () {
  const allUsers = Storage.getUsers();
  const selectedUnit = elements.reportFilterUnit ? elements.reportFilterUnit.value : '';
  const selectedRole = elements.reportFilterRole ? elements.reportFilterRole.value : '';

  let filtered = allUsers;
  if (selectedUnit) {
    filtered = filtered.filter((u) => u.unit === selectedUnit);
  } else if (currentUser.role !== ROLES.SUPER_ADMIN) {
    filtered = filtered.filter((u) => u.unit === currentUser.unit);
  }
  if (selectedRole) {
    filtered = filtered.filter((u) => u.role === selectedRole);
  }

  if (filtered.length === 0) {
    showToast('Ekspor Dibatalkan', 'Tidak ada data pegawai yang tersedia untuk diekspor.', 'error');
    return;
  }

  // Format CSV dengan UTF-8 BOM untuk kompatibilitas Excel
  let csvContent = '\uFEFF';
  csvContent += '"No","ID User / NIP","Nama Lengkap Pegawai","Unit Kerja / Ditjen","Tingkat Peran","Status Akun","Tanggal Terdaftar"\r\n';

  filtered.forEach((u, idx) => {
    const row = [
      idx + 1,
      `"${u.id.replace(/"/g, '""')}"`,
      `"${u.nama.replace(/"/g, '""')}"`,
      `"${u.unit.replace(/"/g, '""')}"`,
      `"${(u.role || 'PIC').replace(/"/g, '""')}"`,
      '"Aktif Kedinasan"',
      `"${(u.createdAt || '-').replace(/"/g, '""')}"`
    ];
    csvContent += row.join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  downloadLink.href = url;
  downloadLink.download = `Laporan_Data_Pegawai_PUPR_${dateStr}.csv`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);

  showToast('Ekspor Berhasil', `Laporan ${filtered.length} data pegawai berhasil diunduh (format CSV/Excel).`, 'success');
  Storage.addAuditLog(currentUser.id, currentUser.nama, currentUser.role, 'Ekspor Data CSV', `Mengunduh laporan rekapitulasi data ${filtered.length} pegawai`, currentUser.unit);
};

// Cetak Laporan Kedinasan Resmi
window.printReport = function () {
  const printTimestamp = document.getElementById('reportPrintTimestamp');
  if (printTimestamp && currentUser) {
    const now = new Date();
    printTimestamp.textContent = `Dicetak pada: ${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} pukul ${now.toLocaleTimeString('id-ID')} WIB oleh ${currentUser.nama} (${currentUser.role} • ${currentUser.unit})`;
  }
  window.print();
};

// Render Halaman Log Aktivitas (Audit Trail)
function renderAuditPage() {
  if (!elements.auditTableBody) return;
  const logs = Storage.getAuditLogs();
  const query = elements.auditSearchInput ? elements.auditSearchInput.value.toLowerCase().trim() : '';

  let filtered = logs;
  if (query) {
    filtered = filtered.filter((log) =>
      log.actorId.toLowerCase().includes(query) ||
      log.actorName.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      log.unit.toLowerCase().includes(query)
    );
  }

  // Tampilkan tombol bersihkan log jika Super Admin
  if (elements.btnClearAudit) {
    elements.btnClearAudit.style.display = (currentUser && currentUser.role === ROLES.SUPER_ADMIN) ? 'inline-flex' : 'none';
  }

  if (filtered.length === 0) {
    elements.auditTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
          Tidak ada catatan aktivitas kedinasan yang ditemukan.
        </td>
      </tr>
    `;
    return;
  }

  elements.auditTableBody.innerHTML = filtered.map((log) => `
    <tr>
      <td style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${log.time}</td>
      <td>
        <div style="font-weight:700; color:var(--pupr-navy);">${log.actorName}</div>
        <div style="font-size:0.75rem; color:var(--text-secondary);">${log.actorId}</div>
      </td>
      <td>${getRoleBadge(log.role)}</td>
      <td><span style="font-weight:700; color:#0F172A;">${log.action}</span></td>
      <td style="font-size:0.8rem; color:var(--text-secondary); max-width:280px;">${log.details}</td>
      <td style="font-size:0.78rem;">${log.unit}</td>
      <td><span class="badge-role badge-role-pic" style="background:#DCFCE7; color:#166534;">${log.status || 'Sukses'}</span></td>
    </tr>
  `).join('');
}

// Inisialisasi Jam Kedinasan Realtime (WIB)
function initClock() {
  function update() {
    if (!elements.topbarClockText) return;
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = days[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    elements.topbarClockText.textContent = `${day}, ${date} ${month} ${year} • ${h}:${m}:${s} WIB`;
  }
  update();
  setInterval(update, 1000);
}

// Modal Layanan Bantuan (Helpdesk)
window.openHelpdeskModal = function () {
  if (elements.helpdeskModal) elements.helpdeskModal.classList.add('active');
};
window.closeHelpdeskModal = function () {
  if (elements.helpdeskModal) elements.helpdeskModal.classList.remove('active');
};

// Dropdown Notifikasi Kedinasan: Khusus Daftar Laporan Masuk
window.toggleNotifDropdown = function (e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  const isCurrentlyOpen = dropdown.style.display === 'block';
  if (isCurrentlyOpen) {
    dropdown.style.display = 'none';
  } else {
    renderNotifList();
    dropdown.style.display = 'block';
  }
};

window.closeNotifDropdown = function (e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const dropdown = document.getElementById('notifDropdown');
  if (dropdown) dropdown.style.display = 'none';
};

// Render Khusus Laporan Masuk di Dropdown Notifikasi
window.renderNotifList = function () {
  const container = document.getElementById('notifListContainer');
  if (!container) return;

  const reports = Storage.getPublicReports();
  if (reports.length === 0) {
    container.innerHTML = `
      <div style="padding:1.5rem; text-align:center; color:#64748B; font-size:0.8rem;">
        Tidak ada laporan masuk dari tamu.
      </div>
    `;
    return;
  }

  // Tampilkan 8 laporan masuk terbaru dengan 3 warna indikator status:
  // - Merah: Belum di-ACC
  // - Kuning: Sedang Diproses
  // - Hijau: Sudah di-ACC
  const latestReports = reports.slice(0, 8);
  container.innerHTML = latestReports.map((r) => {
    const sInfo = getReportStatusInfo(r.status);
    return `
      <div class="notif-item" style="cursor:pointer; padding:0.75rem 0.9rem; border-bottom:1px solid #E2E8F0; background:${sInfo.itemBg}; border-left:4px solid ${sInfo.borderLeft}; transition:background 0.2s;" 
        onclick="bukaLaporanDariNotif('${escapeHtml(r.ticket)}')">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:3px;">
          <strong style="font-size:0.78rem; color:#153E75; font-family:monospace;">${escapeHtml(r.ticket)}</strong>
          <span style="font-size:0.68rem; color:#64748B; font-weight:600;">${escapeHtml(r.date)}</span>
        </div>
        <div class="notif-title" style="font-size:0.8rem; font-weight:700; color:#1E293B; margin-bottom:2px;">
          ${escapeHtml(r.subject)}
        </div>
        <div style="font-size:0.72rem; color:#475569;">
          Pelapor: <strong>${escapeHtml(r.reporterName)}</strong> (${escapeHtml(r.originAgency || 'Masyarakat/Tamu')})
        </div>
        <div style="margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.65rem; background:#E2E8F0; padding:2px 6px; border-radius:3px; color:#334155; font-weight:600;">
            ${escapeHtml(r.serviceType || 'Laporan Tamu')}
          </span>
          <span style="font-size:0.68rem; font-weight:800; color:${sInfo.badgeText}; background:${sInfo.badgeBg}; border:1px solid ${sInfo.badgeBorder}; padding:2px 7px; border-radius:12px; display:inline-flex; align-items:center; gap:3px;">
            <span style="font-size:0.75rem;">${sInfo.icon}</span> ${sInfo.label}
          </span>
        </div>
      </div>
    `;
  }).join('');
};

window.bukaLaporanDariNotif = function (ticket) {
  closeNotifDropdown();
  switchSidebarPage('pageInboxPublic');
  const searchInput = document.getElementById('inboxSearchInput');
  if (searchInput) {
    searchInput.value = ticket;
    renderInboxPublicPage();
  }
};

// Toggle Buka/Tutup Sidebar Menu (Tombol di Pojok Kiri Atas)
window.toggleSidebar = function () {
  const sb = elements.dashboardSidebar || document.getElementById('dashboardSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sb) {
    const isOpen = sb.classList.toggle('sidebar-open');
    sb.classList.toggle('mobile-open', isOpen);
    if (backdrop) backdrop.classList.toggle('active', isOpen);
  }
};

// Render Rekapitulasi Pegawai per Unit Kerja (Di Halaman Beranda)
function renderRekapTable() {
  if (!elements.rekapTableBody) return;
  const allUsers = Storage.getUsers();

  elements.rekapTableBody.innerHTML = DAFTAR_UNIT_PUPR.map((unit) => {
    const unitUsers = allUsers.filter((u) => u.unit === unit);
    const count = unitUsers.length;
    const isUserUnit = currentUser && currentUser.unit === unit;

    return `
      <tr>
        <td>
          <div style="font-weight:700; color:var(--pupr-navy);">${unit}</div>
          <div style="font-size:0.75rem; color:#64748B;">${UNIT_DETAILS[unit] ? UNIT_DETAILS[unit].substring(0, 70) + '...' : ''}</div>
        </td>
        <td>
          <span class="id-badge">${count} Pegawai</span>
        </td>
        <td>
          ${isUserUnit ? '<span class="badge-unit">Unit Anda</span>' : '<span style="font-size:0.75rem; color:#64748B;">PU Pekerjaan Umum</span>'}
        </td>
        <td>
          <button type="button" class="btn-opsi" onclick="filterByUnitAndOpen('${unit}')">
            Buka Pegawai &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Buka Tabel Pegawai Terfilter pada Unit Tertentu
window.filterByUnitAndOpen = function (unitName) {
  if (elements.filterUnit) {
    if (currentUser.role === ROLES.SUPER_ADMIN) {
      elements.filterUnit.value = unitName;
    }
  }
  switchSidebarPage('pageUsers');
};

// Render Grid 11 Unit Kerja Resmi PU Pekerjaan Umum
function renderUnitsGrid() {
  if (!elements.unitsCardContainer) return;
  const allUsers = Storage.getUsers();

  elements.unitsCardContainer.innerHTML = DAFTAR_UNIT_PUPR.map((unit) => {
    const unitUsers = allUsers.filter((u) => u.unit === unit);
    const adminCount = unitUsers.filter((u) => u.role === ROLES.ADMIN_UNIT).length;
    const picCount = unitUsers.filter((u) => u.role === ROLES.PIC).length;

    return `
      <div class="unit-card-item">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.4rem;">
            <div class="unit-card-title">${unit}</div>
            <span class="badge-unit">${unitUsers.length} Staf</span>
          </div>
          <div class="unit-card-desc">${UNIT_DETAILS[unit] || 'Unit Kerja di Lingkungan PU (Pekerjaan Umum).'}</div>
        </div>

        <div class="unit-card-meta">
          <div>
            <span style="font-size:0.72rem; color:#64748B;">Admin: ${adminCount} &bull; PIC: ${picCount}</span>
          </div>
          <button type="button" class="btn-opsi" onclick="filterByUnitAndOpen('${unit}')">
            Lihat Staf &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Render Data di Halaman Profil Saya
function renderProfilePage() {
  if (!currentUser) return;
  if (elements.cardProfileId) elements.cardProfileId.textContent = currentUser.id;
  if (elements.cardProfileNama) elements.cardProfileNama.textContent = currentUser.nama;
  if (elements.cardProfileUnit) elements.cardProfileUnit.textContent = currentUser.unit;
  if (elements.cardProfileRole) elements.cardProfileRole.innerHTML = getRoleBadge(currentUser.role);

  if (elements.profileNama) elements.profileNama.value = currentUser.nama;
  if (elements.profileNewPw) elements.profileNewPw.value = '';
}

// Simpan Perubahan Profil Mandiri
function handleProfileSave(e) {
  e.preventDefault();
  const namaBaru = elements.profileNama ? elements.profileNama.value.trim() : '';
  const pwBaru = elements.profileNewPw ? elements.profileNewPw.value : '';

  if (!namaBaru) {
    showToast('Validasi', 'Nama lengkap tidak boleh kosong.', 'error');
    return;
  }

  let users = Storage.getUsers();
  users = users.map((u) => {
    if (u.id === currentUser.id) {
      const updated = { ...u, nama: namaBaru };
      if (pwBaru && pwBaru.length >= 6) {
        updated.pw = pwBaru;
      }
      return updated;
    }
    return u;
  });

  currentUser.nama = namaBaru;
  if (pwBaru && pwBaru.length >= 6) {
    currentUser.pw = pwBaru;
  }

  Storage.saveUsers(users);
  Storage.setSession(currentUser);

  // Perbarui tampilan antarmuka
  elements.navUserName.textContent = namaBaru;
  elements.heroUserName.textContent = namaBaru;
  if (elements.sidebarUserName) elements.sidebarUserName.textContent = namaBaru;
  renderProfilePage();

  showToast('Tersimpan', 'Profil akun Anda berhasil diperbarui.', 'success');
}

// Render Tabel & Statistik Sesuai Peran
function renderDashboardTable() {
  const allUsers = Storage.getUsers();
  const query = elements.searchInput.value.toLowerCase().trim();

  // Batasan Data Berdasarkan Peran (Role Scoping)
  let visibleUsers = allUsers;
  if (currentUser.role !== ROLES.SUPER_ADMIN) {
    // Admin Unit dan PIC hanya melihat user di unit kerja mereka
    visibleUsers = allUsers.filter((u) => u.unit === currentUser.unit);
  } else {
    // Super Admin bisa melihat semua, atau memfilter via dropdown
    const unitFilter = elements.filterUnit.value;
    if (unitFilter) {
      visibleUsers = allUsers.filter((u) => u.unit === unitFilter);
    }
  }

  // Filter teks pencarian
  const filtered = visibleUsers.filter((u) => {
    return (
      u.id.toLowerCase().includes(query) ||
      u.nama.toLowerCase().includes(query) ||
      u.unit.toLowerCase().includes(query) ||
      (u.role && u.role.toLowerCase().includes(query))
    );
  });

  // Statistik Dinamis
  if (currentUser.role === ROLES.SUPER_ADMIN) {
    const uniqueUnits = new Set(allUsers.map((u) => u.unit));
    elements.statTotalUsers.textContent = allUsers.length;
    elements.statLabelTotal.textContent = 'Total Pengguna (Semua Unit)';
    elements.statTotalUnits.textContent = uniqueUnits.size;
    elements.statLabelUnit.textContent = 'Jumlah Unit Kerja Terdaftar';
  } else {
    // Statistik unit spesifik
    const unitUsers = allUsers.filter((u) => u.unit === currentUser.unit);
    const picCount = unitUsers.filter((u) => u.role === ROLES.PIC).length;
    elements.statTotalUsers.textContent = unitUsers.length;
    elements.statLabelTotal.textContent = `Pegawai di ${currentUser.unit}`;
    elements.statTotalUnits.textContent = picCount;
    elements.statLabelUnit.textContent = `Jumlah PIC di Unit Anda`;
  }

  elements.statActiveStatus.textContent = `${currentUser.role} (Online)`;

  // Render Baris Tabel
  if (filtered.length === 0) {
    elements.usersTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: #64748B;">
          Tidak ada data pegawai yang sesuai dengan pencarian atau hak akses Anda.
        </td>
      </tr>
    `;
    return;
  }

  elements.usersTableBody.innerHTML = filtered
    .map((user) => {
      const isSelf = currentUser && currentUser.id === user.id;

      // Hak Akses Tombol Aksi:
      // - Super Admin: Wewenang Penuh (bisa ubah & hapus siapa pun kecuali diri sendiri)
      // - Yang Bukan Super Admin (Admin Unit / PIC): Hanya Mode Lihat (Read-Only), tidak bisa mengubah fitur/data orang lain
      let canEdit = false;
      let canDelete = false;

      if (currentUser.role === ROLES.SUPER_ADMIN) {
        canEdit = true;
        canDelete = !isSelf;
      } else if (isSelf) {
        // Bukan super admin hanya dapat mengubah password/profilnya sendiri
        canEdit = true;
        canDelete = false;
      }

      let actionHtml = '';
      if (canEdit || canDelete) {
        actionHtml = `
          <div class="table-opsi">
            ${canEdit ? `<button type="button" class="btn-opsi" onclick="openEditModal('${user.id}')">Ubah</button>` : ''}
            ${currentUser.role === ROLES.SUPER_ADMIN && !isSelf ? `
              <button type="button" class="btn-opsi" onclick="bantuResetPassword('${user.id}')" style="background:#B91C1C; color:#fff; border-color:#B91C1C;" title="Bantu reset password jika admin/pegawai lupa sandi">
                🔑 Reset Sandi
              </button>
            ` : ''}
            ${canDelete ? `<button type="button" class="btn-opsi btn-hapus" onclick="handleDelete('${user.id}')">Hapus</button>` : ''}
            ${isSelf ? `<span style="font-size: 0.75rem; color: #0F294A; font-weight: 600; padding: 0.35rem 0.5rem;">Akun Anda</span>` : ''}
          </div>
        `;
      } else {
        actionHtml = `<span style="font-size: 0.75rem; color: #94A3B8;">Hanya Lihat</span>`;
      }

      return `
        <tr>
          <td><span class="id-badge">${user.id}</span></td>
          <td>
            <div class="pegawai-nama">${user.nama}</div>
            <div style="font-size: 0.75rem; color: #64748B;">Terdaftar: ${user.createdAt || '-'}</div>
          </td>
          <td><span class="pegawai-unit">${user.unit}</span></td>
          <td>${getRoleBadge(user.role || ROLES.PIC)}</td>
          <td>
            <span class="table-pw-toggle" onclick="toggleTablePw(this, '${user.pw}')" title="Klik untuk mengintip password">••••••••</span>
          </td>
          <td>${actionHtml}</td>
        </tr>
      `;
    })
    .join('');
}

// Intip Password di Baris Tabel
window.toggleTablePw = function (spanEl, actualPw) {
  if (spanEl.textContent === '••••••••') {
    spanEl.textContent = actualPw;
    spanEl.style.color = '#0F294A';
    spanEl.style.fontWeight = 'bold';
    setTimeout(() => {
      spanEl.textContent = '••••••••';
      spanEl.style.color = '';
      spanEl.style.fontWeight = '';
    }, 4000);
  } else {
    spanEl.textContent = '••••••••';
    spanEl.style.color = '';
    spanEl.style.fontWeight = '';
  }
};

// Autentikasi: Login
function handleLogin(e) {
  e.preventDefault();
  const id = document.getElementById('loginId').value.trim();
  const pw = document.getElementById('loginPw').value;

  if (!id || !pw) {
    showLoginAlert('Formulir Belum Lengkap', 'Silakan masukkan ID User / NIP dan Kata Sandi Anda.');
    showToast('Validasi', 'Mohon masukkan ID User dan Kata Sandi.', 'error');
    return;
  }

  const users = Storage.getUsers();
  const match = users.find(
    (u) => u.id.toLowerCase() === id.toLowerCase() && u.pw === pw
  );

  if (match) {
    sessionStorage.removeItem('pupr_explicit_logout');
    hideLoginAlert();
    currentUser = match;
    Storage.setSession(match);

    // Simpan Remember ID jika dicentang
    if (elements.rememberMe && elements.rememberMe.checked) {
      localStorage.setItem('pupr_remembered_id', match.id);
    } else {
      localStorage.removeItem('pupr_remembered_id');
    }

    showToast('Berhasil Masuk', `Selamat datang, ${match.nama} (${match.role || 'Pegawai'}).`, 'success');
    showView('dashboard');
    elements.loginForm.reset();
  } else {
    showLoginAlert('Akses Ditolak', 'ID User atau Kata Sandi tidak sesuai. Silakan periksa kembali atau gunakan akun demo di panel kiri.');
    showToast('Gagal Masuk', 'ID User atau Kata Sandi tidak sesuai.', 'error');
  }
}

// Autentikasi: Login via Barcode Scanner
function handleBarcodeLogin(e) {
  if (e) e.preventDefault();
  const rawCode = elements.barcodeInput ? elements.barcodeInput.value.trim() : '';

  if (!rawCode) {
    showLoginAlert('Barcode Kosong', 'Silakan scan kartu pegawai atau masukkan kode ID.');
    showToast('Validasi Barcode', 'Arahkan scanner atau masukkan kode barcode pegawai.', 'error');
    return;
  }

  const users = Storage.getUsers();
  // Cari kecocokan ID persis atau case-insensitive
  const match = users.find((u) => u.id.toLowerCase() === rawCode.toLowerCase());

  if (match) {
    sessionStorage.removeItem('pupr_explicit_logout');
    hideLoginAlert();
    currentUser = match;
    Storage.setSession(match);
    Storage.addAuditLog(match.id, match.nama, match.role, 'Login via Barcode ID', 'Autentikasi cepat via scanner fisik kartu pegawai', match.unit);

    showToast('Barcode Terverifikasi', `Selamat datang, ${match.nama} (${match.role || 'Pegawai'}). Masuk via Barcode ID.`, 'success');
    showView('dashboard');
    if (elements.barcodeLoginForm) elements.barcodeLoginForm.reset();
  } else {
    showLoginAlert('Kartu Tidak Dikenali', `Kode Barcode "${rawCode}" belum terdaftar dalam sistem pegawai PU.`);
    showToast('Gagal Scan', `Kartu/Barcode "${rawCode}" tidak ditemukan.`, 'error');
    if (elements.barcodeInput) {
      elements.barcodeInput.select();
    }
  }
}

// Autentikasi: Registrasi
function handleRegister(e) {
  e.preventDefault();
  const id = document.getElementById('regId').value.trim().toUpperCase();
  const nama = document.getElementById('regNama').value.trim();
  const pw = document.getElementById('regPw').value;
  const unit = document.getElementById('regUnit').value;
  const role = document.getElementById('regRole') ? document.getElementById('regRole').value : ROLES.PIC;

  if (!id || !nama || !pw || !unit) {
    showToast('Validasi', 'Seluruh kolom formulir wajib diisi.', 'error');
    return;
  }

  const users = Storage.getUsers();
  if (users.some((u) => u.id.toUpperCase() === id)) {
    showToast('Peringatan', `ID User ${id} sudah terdaftar dalam sistem.`, 'error');
    return;
  }

  const newUser = {
    id,
    nama,
    pw,
    unit,
    role,
    createdAt: formatDate()
  };

  users.push(newUser);
  Storage.saveUsers(users);

  showToast('Registrasi Berhasil', `Akun ${nama} (${role}) berhasil didaftarkan. Silakan login.`, 'success');
  elements.registerForm.reset();

  document.getElementById('loginId').value = id;
  switchAuthTab('login');
}

// Logout
function handleLogout() {
  currentUser = null;
  Storage.clearSession();
  sessionStorage.setItem('pupr_explicit_logout', 'true');
  showToast('Keluar', 'Sesi telah diakhiri.', 'info');
  showView('auth');
}

// Coba Demo Akun Cepat (Berdasarkan Role)
window.fillDemo = function (id, pw) {
  hideLoginAlert();
  const loginIdInput = document.getElementById('loginId');
  const loginPwInput = document.getElementById('loginPw');
  if (loginIdInput) loginIdInput.value = id;
  if (loginPwInput) loginPwInput.value = pw;
  showToast('Akun Dipilih', `ID ${id} dimasukkan ke form login. Klik tombol Masuk ke Portal PU.`, 'info');
  const submitBtn = document.getElementById('btnSubmitLogin');
  if (submitBtn) {
    submitBtn.focus();
  }
};

// Reset Demo Data
window.resetDemoData = function () {
  if (confirm('Kembalikan seluruh data pengguna ke data uji coba bawaan?')) {
    Storage.resetAll();
    showToast('Reset Berhasil', 'Data pengguna telah dikembalikan ke kondisi awal bawaan.', 'success');
    if (currentUser) {
      showView('dashboard');
    } else {
      switchAuthTab('login');
    }
  }
};

// Modal Tambah Pegawai
function openAddModal() {
  if (currentUser.role !== ROLES.SUPER_ADMIN) {
    showToast('Akses Ditolak', 'Hanya Super Admin yang berwenang untuk menambah user baru.', 'error');
    return;
  }

  editingUserId = null;
  elements.modalTitle.textContent = 'Tambah Pegawai / User Baru';
  elements.modalUserForm.reset();

  const idInput = document.getElementById('modalId');
  idInput.readOnly = false;

  // Konfigurasi dropdown role pada modal sesuai hak akses
  const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
  populateRoleOptions(elements.modalRole, isSuperAdmin);

  // Jika Admin Unit, kunci unit ke unit kerja Admin Unit yang sedang login
  if (!isSuperAdmin) {
    elements.modalUnit.value = currentUser.unit;
    elements.modalUnit.disabled = true;
  } else {
    elements.modalUnit.disabled = false;
  }

  idInput.value = getNextId(elements.modalRole.value);
  elements.userModal.classList.add('active');
}

// Modal Ubah Pegawai
window.openEditModal = function (userId) {
  const users = Storage.getUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  // Cek otorisasi edit: Hanya Super Admin atau Akun Sendiri
  if (currentUser.role !== ROLES.SUPER_ADMIN && currentUser.id !== userId) {
    showToast('Akses Ditolak', 'Hanya Super Admin yang berwenang mengubah data pegawai lain.', 'error');
    return;
  }

  editingUserId = userId;
  elements.modalTitle.textContent = `Ubah Data Pegawai: ${user.id}`;

  const idInput = document.getElementById('modalId');
  idInput.value = user.id;
  idInput.readOnly = true;

  document.getElementById('modalNama').value = user.nama;
  document.getElementById('modalPw').value = user.pw;

  const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
  populateRoleOptions(elements.modalRole, isSuperAdmin || user.role === ROLES.SUPER_ADMIN);
  elements.modalRole.value = user.role || ROLES.PIC;

  // Kunci kontrol jika tidak berwenang
  if (currentUser.role === ROLES.PIC) {
    elements.modalRole.disabled = true;
    elements.modalUnit.disabled = true;
  } else if (currentUser.role === ROLES.ADMIN_UNIT) {
    elements.modalRole.disabled = false;
    elements.modalUnit.disabled = true;
  } else {
    elements.modalRole.disabled = false;
    elements.modalUnit.disabled = false;
  }

  elements.modalUnit.value = user.unit;
  elements.userModal.classList.add('active');
};

function closeModal() {
  elements.userModal.classList.remove('active');
  editingUserId = null;
  elements.modalRole.disabled = false;
  elements.modalUnit.disabled = false;
  elements.modalUserForm.reset();
}

function handleSaveModal(e) {
  e.preventDefault();
  const id = document.getElementById('modalId').value.trim().toUpperCase();
  const nama = document.getElementById('modalNama').value.trim();
  const pw = document.getElementById('modalPw').value;

  // Baca unit & role dengan aman meskipun elemen disabled
  let users = Storage.getUsers();
  let existingUser = editingUserId ? users.find((u) => u.id === editingUserId) : null;

  let unit = elements.modalUnit.value;
  if (elements.modalUnit.disabled) {
    unit = existingUser ? existingUser.unit : currentUser.unit;
  }

  let role = elements.modalRole.value;
  if (elements.modalRole.disabled) {
    role = existingUser ? existingUser.role : ROLES.PIC;
  }

  if (!id || !nama || !pw || !unit || !role) {
    showToast('Validasi', 'Seluruh kolom wajib diisi.', 'error');
    return;
  }

  if (editingUserId) {
    users = users.map((u) => {
      if (u.id === editingUserId) {
        return { ...u, nama, pw, unit, role };
      }
      return u;
    });

    // Jika yang diubah adalah akun yang sedang login, update sesi
    if (currentUser && currentUser.id === editingUserId) {
      currentUser = { ...currentUser, nama, pw, unit, role };
      Storage.setSession(currentUser);
      elements.navUserName.textContent = nama;
      elements.navUserUnit.textContent = `${role} • ${unit}`;
      elements.heroUserName.textContent = nama;
      elements.heroUserUnit.textContent = unit;
      elements.heroUserRole.innerHTML = getRoleBadge(role);
    }

    Storage.saveUsers(users);
    showToast('Tersimpan', `Data pegawai ${id} telah diperbarui.`, 'success');
  } else {
    if (users.some((u) => u.id.toUpperCase() === id)) {
      showToast('Peringatan', `ID ${id} sudah terdaftar.`, 'error');
      return;
    }
    users.push({ id, nama, pw, unit, role, createdAt: formatDate() });
    Storage.saveUsers(users);
    showToast('Berhasil', `Pegawai ${nama} (${role}) berhasil ditambahkan.`, 'success');
  }

  closeModal();
  renderDashboardTable();
}

// Hapus User
window.handleDelete = function (userId) {
  const users = Storage.getUsers();
  const targetUser = users.find((u) => u.id === userId);
  if (!targetUser) return;

  if (currentUser.role !== ROLES.SUPER_ADMIN) {
    showToast('Akses Ditolak', 'Hanya Super Admin yang berwenang menghapus data pengguna.', 'error');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus data pegawai dengan ID ${userId} (${targetUser.nama})?`)) {
    let updatedUsers = users.filter((u) => u.id !== userId);
    Storage.saveUsers(updatedUsers);
    showToast('Terhapus', `Data pegawai ${userId} telah dihapus.`, 'info');
    renderDashboardTable();
  }
};

// Toggle Sembunyikan/Tampilkan Password
window.togglePw = function (inputId, btn) {
  const el = document.getElementById(inputId);
  if (!el) return;
  if (el.type === 'password') {
    el.type = 'text';
    btn.textContent = 'Sembunyikan';
  } else {
    el.type = 'password';
    btn.textContent = 'Tampilkan';
  }
};

// Event Listeners
function initEvents() {
  if (elements.tabLogin) elements.tabLogin.addEventListener('click', () => switchAuthTab('login'));
  if (elements.tabBarcode) elements.tabBarcode.addEventListener('click', () => switchAuthTab('barcode'));
  if (elements.tabRegister) elements.tabRegister.addEventListener('click', () => switchAuthTab('register'));

  if (elements.barcodeLoginForm) elements.barcodeLoginForm.addEventListener('submit', handleBarcodeLogin);

  // Tombol simulasi scan cepat contoh Super Admin
  if (elements.btnSimulateScan) {
    elements.btnSimulateScan.addEventListener('click', () => {
      if (elements.barcodeInput) {
        elements.barcodeInput.value = 'PUPR-SUP01';
        handleBarcodeLogin();
      }
    });
  }

  // Dukungan otomatis Scanner Fisik (Scanner USB/Bluetooth biasanya mengirimkan "Enter" saat scan selesai)
  if (elements.barcodeInput) {
    elements.barcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleBarcodeLogin();
      }
    });
  }

  if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
  if (elements.registerForm) elements.registerForm.addEventListener('submit', handleRegister);
  if (elements.modalUserForm) elements.modalUserForm.addEventListener('submit', handleSaveModal);

  if (elements.btnLogout) elements.btnLogout.addEventListener('click', handleLogout);
  if (elements.navLogoutBtn) elements.navLogoutBtn.addEventListener('click', handleLogout);

  if (elements.btnOpenAddModal) elements.btnOpenAddModal.addEventListener('click', openAddModal);
  if (elements.modalCloseBtn) elements.modalCloseBtn.addEventListener('click', closeModal);
  if (elements.modalCancelBtn) elements.modalCancelBtn.addEventListener('click', closeModal);

  if (elements.searchInput) elements.searchInput.addEventListener('input', renderDashboardTable);
  if (elements.filterUnit) elements.filterUnit.addEventListener('change', renderDashboardTable);

  // Navigasi Menu Sidebar
  document.querySelectorAll('.sidebar-menu-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetPage = btn.getAttribute('data-page');
      if (targetPage) switchSidebarPage(targetPage);
    });
  });

  // Tombol Toggle Sidebar (Pojok Kiri Atas)
  if (elements.btnToggleSidebar) {
    elements.btnToggleSidebar.addEventListener('click', toggleSidebar);
  }

  // Tombol Logout di Sidebar
  if (elements.sidebarLogoutBtn) {
    elements.sidebarLogoutBtn.addEventListener('click', handleLogout);
  }

  // Form Profil Akun Mandiri
  if (elements.profileForm) {
    elements.profileForm.addEventListener('submit', handleProfileSave);
  }

  // Update saran ID saat role modal berubah
  if (elements.modalRole) {
    elements.modalRole.addEventListener('change', () => {
      if (!editingUserId) {
        const idInput = document.getElementById('modalId');
        if (idInput) idInput.value = getNextId(elements.modalRole.value);
      }
    });
  }

  // Update saran ID saat role form registrasi berubah
  const regRoleSelect = document.getElementById('regRole');
  if (regRoleSelect) {
    regRoleSelect.addEventListener('change', () => {
      const regIdInput = document.getElementById('regId');
      if (regIdInput) regIdInput.value = getNextId(regRoleSelect.value);
    });
  }

  // Navigasi Gerbang (Gateway Selection)
  if (elements.btnGatewayEmployee) {
    elements.btnGatewayEmployee.addEventListener('click', () => showView('auth'));
  }
  if (elements.btnGatewayPublic) {
    elements.btnGatewayPublic.addEventListener('click', () => showView('public'));
  }
  if (elements.btnBackFromEmployee) {
    elements.btnBackFromEmployee.addEventListener('click', () => showView('gateway'));
  }
  if (elements.btnBackFromPublic) {
    elements.btnBackFromPublic.addEventListener('click', () => showView('gateway'));
  }

  // Tab Navigasi Portal Publik
  if (elements.tabPublicCreate) {
    elements.tabPublicCreate.addEventListener('click', () => switchPublicTab('create'));
  }
  if (elements.tabPublicTrack) {
    elements.tabPublicTrack.addEventListener('click', () => switchPublicTab('track'));
  }
  if (elements.tabPublicList) {
    elements.tabPublicList.addEventListener('click', () => {
      switchPublicTab('list');
      renderPublicReportsTable();
    });
  }

  // Submit Formulir Laporan Publik
  if (elements.publicReportForm) {
    elements.publicReportForm.addEventListener('submit', handlePublicReportSubmit);
  }

  // Pelacakan Tiket Publik
  if (elements.btnTrackTicket) {
    elements.btnTrackTicket.addEventListener('click', handleTrackTicket);
  }

  // Pencarian & Filter Kotak Masuk Laporan Publik (Admin & Staf)
  if (elements.inboxSearchInput) {
    elements.inboxSearchInput.addEventListener('input', renderInboxPublicPage);
  }
  if (elements.inboxFilterStatus) {
    elements.inboxFilterStatus.addEventListener('change', renderInboxPublicPage);
  }

  // Pilih Semua Checkbox di Kotak Masuk
  if (elements.checkAllInbox) {
    elements.checkAllInbox.addEventListener('change', (e) => {
      const checkboxes = document.querySelectorAll('.inbox-checkbox');
      checkboxes.forEach(cb => cb.checked = e.target.checked);
    });
  }

  // Tombol ACC / Setujui Terpilih (Batch)
  if (elements.btnBatchApproveInbox) {
    elements.btnBatchApproveInbox.addEventListener('click', handleBatchApproveInbox);
  }

  // Tombol Ekspor Rekap Laporan Masuk Publik
  if (elements.btnExportInboxPublic) {
    elements.btnExportInboxPublic.addEventListener('click', exportInboxPublicCsv);
  }
}

// Beralih Tab di Portal Publik
function switchPublicTab(tab) {
  const tabs = [
    { btn: elements.tabPublicCreate, content: elements.publicCreateContent },
    { btn: elements.tabPublicTrack, content: elements.publicTrackContent },
    { btn: elements.tabPublicList, content: elements.publicListContent }
  ];

  tabs.forEach(t => {
    if (t.btn) t.btn.classList.remove('active');
    if (t.content) t.content.classList.remove('active');
  });

  if (tab === 'create') {
    if (elements.tabPublicCreate) elements.tabPublicCreate.classList.add('active');
    if (elements.publicCreateContent) elements.publicCreateContent.classList.add('active');
  } else if (tab === 'track') {
    if (elements.tabPublicTrack) elements.tabPublicTrack.classList.add('active');
    if (elements.publicTrackContent) elements.publicTrackContent.classList.add('active');
  } else if (tab === 'list') {
    if (elements.tabPublicList) elements.tabPublicList.classList.add('active');
    if (elements.publicListContent) elements.publicListContent.classList.add('active');
  }
}

// Render Tabel Laporan Publik (Halaman Publik)
function renderPublicReportsTable() {
  const reports = Storage.getPublicReports();
  if (elements.publicReportTotalCount) {
    elements.publicReportTotalCount.textContent = reports.length;
  }

  if (!elements.publicReportTableBody) return;

  if (!Array.isArray(reports) || reports.length === 0) {
    elements.publicReportTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
          Belum ada permohonan atau laporan publik yang terdaftar.
        </td>
      </tr>
    `;
    return;
  }

  elements.publicReportTableBody.innerHTML = reports.map(raw => {
    const r = normalizeReport(raw) || raw;
    const statusBadge = getReportStatusBadge(r.status);

    return `
      <tr>
        <td><strong style="color:var(--pupr-navy);">${escapeHtml(r.ticket)}</strong></td>
        <td><span style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(r.date)}</span></td>
        <td>
          <div style="font-weight:700; color:var(--text-primary);">${escapeHtml(r.reporterName)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(r.originAgency || '-')} &bull; <span style="color:var(--pupr-navy);">${escapeHtml(r.gender || '')}</span></div>
        </td>
        <td><span style="font-size:0.8rem; font-weight:600; color:#0F294A;">${escapeHtml(r.applicantCategory || '-')}</span></td>
        <td><span class="badge-role" style="background:#F1F5F9; color:#334155; font-size:0.75rem;">${escapeHtml(r.serviceType || '-')}</span></td>
        <td style="max-width:200px; font-size:0.82rem; font-weight:600;">${escapeHtml(r.subject || '-')}</td>
        <td><span class="badge-unit">${escapeHtml(r.targetUnit || r.unit || 'Umum PUPR')}</span></td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

// Handler Submit Laporan Publik (Warga & Perusahaan)
function handlePublicReportSubmit(e) {
  e.preventDefault();

  const reporterName = document.getElementById('reportReporterName').value.trim();
  const contact = document.getElementById('reportContact').value.trim();
  const gender = document.getElementById('reportGender').value;
  const email = document.getElementById('reportEmail').value.trim();
  const originAgency = document.getElementById('reportOriginAgency').value.trim();
  const applicantCategory = document.getElementById('reportApplicantCategory').value;
  const serviceType = document.getElementById('reportServiceType').value;
  const subject = document.getElementById('reportSubject').value.trim();
  const location = document.getElementById('reportLocation').value.trim();
  const description = document.getElementById('reportDescription').value.trim();
  const surveyConsent = document.getElementById('reportSurveyConsent') ? document.getElementById('reportSurveyConsent').checked : false;

  if (!reporterName || !contact || !gender || !email || !originAgency || !applicantCategory || !serviceType || !subject || !location || !description) {
    showToast('Validasi', 'Mohon lengkapi seluruh kolom formulir yang bertanda bintang (*).', 'error');
    return;
  }

  // Tentukan otomatis unit disposisi berdasarkan kata kunci perihal & jenis layanan
  const targetUnit = getAutoAssignedUnit(serviceType, subject, description);

  // Buat nomor tiket unik
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const ticket = `PUPR-PUB-${randomNum}`;

  const now = new Date();
  const dateStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  const newReport = {
    ticket,
    date: dateStr,
    reporterName,
    contact,
    gender,
    email,
    originAgency,
    applicantCategory,
    serviceType,
    targetUnit,
    unit: targetUnit,
    subject,
    location,
    description,
    surveyConsent,
    status: 'Menunggu Verifikasi Dinas'
  };

  Storage.addPublicReport(newReport);

  // Catat ke Audit Log sistem
  Storage.addAuditLog(
    'PUBLIK',
    reporterName,
    applicantCategory,
    'Permohonan Masuk ke Staf/Admin',
    `${serviceType}: "${subject}" otomatis diteruskan ke staf & admin (${targetUnit})`,
    targetUnit
  );

  // Perbarui notifikasi dan badge kotak masuk admin
  updateInboxBadge();

  // Perbarui tabel publik & admin secara instan
  renderPublicReportsTable();
  renderInboxPublicPage();

  // Reset form
  elements.publicReportForm.reset();

  // Buka tab lacak dan tampilkan info tiket langsung
  switchPublicTab('track');
  if (elements.trackTicketInput) elements.trackTicketInput.value = ticket;
  showTicketResult(newReport, true);

  showToast('Permohonan Terkirim', `Laporan Anda berhasil dicatat dengan No. Tiket ${ticket} dan telah diteruskan ke Staf & Admin PUPR.`, 'success');
}

// Penentuan Unit Otomatis (Smart Dispatch ke Staf/Admin terkait)
function getAutoAssignedUnit(serviceType, subject, desc) {
  const text = (serviceType + ' ' + subject + ' ' + desc).toLowerCase();
  if (text.includes('jalan') || text.includes('jembatan') || text.includes('lubang') || text.includes('aspal') || text.includes('pantura') || text.includes('tol')) {
    return 'Ditjen Bina Marga';
  }
  if (text.includes('banjir') || text.includes('sungai') || text.includes('irigasi') || text.includes('tanggul') || text.includes('bendungan') || text.includes('danau')) {
    return 'Ditjen Sumber Daya Air';
  }
  if (text.includes('air') || text.includes('minum') || text.includes('sanitasi') || text.includes('gedung') || text.includes('spam') || text.includes('cipta karya')) {
    return 'Ditjen Cipta Karya';
  }
  if (text.includes('rumah') || text.includes('rusun') || text.includes('swadaya') || text.includes('hunian') || text.includes('perumahan')) {
    return 'Ditjen Perumahan';
  }
  if (text.includes('konstruksi') || text.includes('sertifikasi') || text.includes('ska') || text.includes('skk') || text.includes('bina konstruksi')) {
    return 'Ditjen Bina Konstruksi';
  }
  if (text.includes('aset') || text.includes('bmn') || text.includes('tanah') || text.includes('informasi') || text.includes('data')) {
    return 'Sekretariat Jenderal';
  }
  return 'Sekretariat Jenderal';
}

// Perbarui Badge Jumlah Laporan Publik di Sidebar & Notifikasi (Dinamis Sesuai 3 Status Warna)
function updateInboxBadge() {
  const reports = Storage.getPublicReports();
  const pendingCount = reports.filter(r => {
    const s = getReportStatusInfo(r.status).category;
    return s === 'belum';
  }).length;
  const prosesCount = reports.filter(r => {
    const s = getReportStatusInfo(r.status).category;
    return s === 'proses';
  }).length;
  const accCount = reports.filter(r => {
    const s = getReportStatusInfo(r.status).category;
    return s === 'acc';
  }).length;

  if (elements.menuCountInboxPublic) {
    elements.menuCountInboxPublic.textContent = reports.length + ' Laporan';
    elements.menuCountInboxPublic.title = `${pendingCount} Belum ACC (Merah), ${prosesCount} Sedang Proses (Kuning), ${accCount} Sudah ACC (Hijau)`;
    elements.menuCountInboxPublic.classList.add('notif-pulse');
  }

  // Update badge notif lonceng di topbar dengan warna status dominan:
  // Merah jika ada yang belum di-ACC, Kuning jika ada proses, Hijau jika semua sudah di-ACC
  const dot = elements.notifBadgeDot || document.getElementById('notifBadgeDot');
  if (dot) {
    dot.style.display = 'inline-flex';
    dot.textContent = reports.length;
    dot.classList.add('notif-pulse');
    if (pendingCount > 0) {
      dot.style.backgroundColor = '#EF4444'; // Merah: belum di-ACC
      dot.title = `${pendingCount} Laporan Belum di-ACC (Menunggu Telaah)`;
    } else if (prosesCount > 0) {
      dot.style.backgroundColor = '#F59E0B'; // Kuning: proses
      dot.title = `${prosesCount} Laporan Sedang Diproses Bidang`;
    } else {
      dot.style.backgroundColor = '#10B981'; // Hijau: semua ACC
      dot.title = `Semua (${accCount}) Laporan Sudah di-ACC`;
    }
  }
}

// Render Halaman Kotak Masuk Laporan Publik di Dashboard Admin/Staf
function renderInboxPublicPage() {
  if (!elements.inboxTableBody) return;

  let reports = Storage.getPublicReports();

  // Filter wewenang: Admin Unit / PIC melihat unitnya sendiri; Super Admin melihat semua
  if (currentUser && currentUser.role !== ROLES.SUPER_ADMIN) {
    reports = reports.filter(r => !r.targetUnit || r.targetUnit === currentUser.unit || r.unit === currentUser.unit);
  }

  // Filter pencarian
  const search = elements.inboxSearchInput ? elements.inboxSearchInput.value.trim().toLowerCase() : '';
  if (search) {
    reports = reports.filter(r =>
      (r.ticket && r.ticket.toLowerCase().includes(search)) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(search)) ||
      (r.originAgency && r.originAgency.toLowerCase().includes(search)) ||
      (r.subject && r.subject.toLowerCase().includes(search)) ||
      (r.location && r.location.toLowerCase().includes(search))
    );
  }

  // Filter status
  const statusFilter = elements.inboxFilterStatus ? elements.inboxFilterStatus.value : '';
  if (statusFilter) {
    reports = reports.filter(r => r.status === statusFilter);
  }

  if (reports.length === 0) {
    elements.inboxTableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
          Tidak ada laporan permohonan publik yang sesuai dengan filter atau unit kerja Anda.
        </td>
      </tr>
    `;
    return;
  }

  elements.inboxTableBody.innerHTML = reports.map(r => {
    const sInfo = getReportStatusInfo(r.status);
    const isApproved = sInfo.category === 'acc';
    const statusBadge = getReportStatusBadge(r.status);

    const isSuperAdmin = currentUser && currentUser.role === ROLES.SUPER_ADMIN;
    const currentUnit = r.targetUnit || r.unit || 'Belum Didisposisi';

    // Kolom Disposisi Unit: Hanya Super Admin yang berhak menentukan/mengubah disposisi ke Bidang
    let disposisiHtml = '';
    if (isSuperAdmin) {
      const optionsHtml = DAFTAR_UNIT_PUPR.map(u => `
        <option value="${escapeHtml(u)}" ${currentUnit === u ? 'selected' : ''}>${escapeHtml(u)}</option>
      `).join('');

      disposisiHtml = `
        <div style="min-width: 175px;">
          <select onchange="updatePublicReportDisposisi('${escapeHtml(r.ticket)}', this.value)" 
            class="form-control" 
            style="font-size:0.75rem; padding:0.3rem 0.45rem; font-weight:700; border-color:${currentUnit === 'Belum Didisposisi' ? '#EF4444' : '#0F294A'}; background:${currentUnit === 'Belum Didisposisi' ? '#FEF2F2' : '#EFF6FF'}; color:#0F294A; border-radius:4px;">
            <option value="Belum Didisposisi" ${currentUnit === 'Belum Didisposisi' ? 'selected' : ''}>⚠️ [Super Admin] Pilih Bidang Disposisi...</option>
            ${optionsHtml}
          </select>
          ${currentUnit === 'Belum Didisposisi' ? '<span style="font-size:0.68rem; color:#DC2626; font-weight:700; display:block; margin-top:2px;">Wajib didisposisi oleh Super Admin</span>' : '<span style="font-size:0.68rem; color:#059669; font-weight:700; display:block; margin-top:2px;">✓ Disposisi Terkirim ke Bidang</span>'}
        </div>
      `;
    } else {
      disposisiHtml = `
        <div>
          <span class="badge-unit">${escapeHtml(currentUnit)}</span>
          <div style="font-size:0.68rem; color:#64748B; margin-top:2px;">Disposisi dari Super Admin</div>
        </div>
      `;
    }

    // Status Penanganan Teknis oleh Bidang
    const isBidang = currentUser && currentUser.role === ROLES.BIDANG;
    const isDisposisiValid = currentUnit && currentUnit !== 'Belum Didisposisi';

    // Kolom Surat Balasan (Bisa dibuat oleh Bidang, Seker/Sakres, maupun Super Admin)
    const isSakres = currentUser && currentUser.role === ROLES.SAKRES;
    let balasanHtml = '';
    if (r.replyLetter) {
      balasanHtml = `
        <div style="text-align:center;">
          <span class="badge-role" style="background:#EDE9FE; color:#5B21B6; font-weight:700; font-size:0.7rem; display:inline-block; margin-bottom:4px;">
            ✓ Surat Balasan Terbit
          </span>
          <button type="button" class="btn-opsi" onclick="lihatSuratBalasan('${escapeHtml(r.ticket)}')" style="font-size:0.72rem; padding:0.25rem 0.5rem; background:#153E75; color:#fff; border:none; border-radius:4px;">
            📄 Lihat Surat / Berkas
          </button>
        </div>
      `;
    } else if (isSakres || isSuperAdmin || isBidang) {
      balasanHtml = `
        <div style="text-align:center;">
          <button type="button" class="btn-opsi" onclick="openModalSakres('${escapeHtml(r.ticket)}')" style="font-size:0.75rem; padding:0.35rem 0.65rem; background:#153E75; color:#fff; font-weight:700; border:none; border-radius:4px; box-shadow:0 2px 6px rgba(21,62,117,0.25);">
            📎 Unggah / Buat Balasan
          </button>
        </div>
      `;
    } else {
      balasanHtml = `<span style="font-size:0.75rem; color:#94A3B8;">Belum Dibalas</span>`;
    }

    return `
      <tr style="${isApproved ? 'background:#F0FDF4;' : ''}">
        <td style="text-align:center;">
          <input type="checkbox" class="inbox-checkbox" value="${escapeHtml(r.ticket)}" style="cursor:pointer; width:16px; height:16px; accent-color:#059669;">
        </td>
        <td><strong style="color:var(--pupr-navy); font-family:monospace; font-size:0.9rem;">${escapeHtml(r.ticket)}</strong></td>
        <td><span style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(r.date)}</span></td>
        <td>
          <div style="font-weight:700; color:var(--text-primary);">${escapeHtml(r.reporterName)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(r.originAgency || '-')}</div>
          <div style="font-size:0.72rem; color:#1E293B; margin-top:2px; display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
            <span>Telp: <strong>${escapeHtml(r.contact || '-')}</strong></span>
            ${r.contact && r.contact !== '-' ? `
              <a href="https://wa.me/${cleanPhoneForWa(r.contact)}?text=${encodeURIComponent('Halo Bapak/Ibu ' + r.reporterName + ', kami dari PU Pekerjaan Umum ingin menindaklanjuti laporan Anda dengan nomor tiket ' + r.ticket + '.')}" 
                target="_blank" 
                style="background:#25D366; color:#fff; text-decoration:none; padding:1px 6px; border-radius:3px; font-size:0.68rem; font-weight:700; display:inline-flex; align-items:center; gap:2px;" 
                title="Hubungi Pelapor via WhatsApp">
                💬 Chat WA
              </a>
            ` : ''}
          </div>
          <div style="font-size:0.7rem; color:#0369A1;">${escapeHtml(r.email || '-')}</div>
        </td>
        <td>
          <div style="font-size:0.8rem; font-weight:600; color:#0F294A;">${escapeHtml(r.serviceType || '-')}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${escapeHtml(r.applicantCategory || '-')}</div>
        </td>
        <td style="max-width:230px;">
          <div style="font-weight:700; font-size:0.83rem; color:var(--pupr-navy);">${escapeHtml(r.subject || '-')}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.2rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${escapeHtml(r.description || '-')}
          </div>
          ${r.hasOfficialLetter ? `
            <div style="margin-top:0.4rem;">
              <button type="button" onclick="bukaModalDataSuratMasukAdmin('${escapeHtml(r.ticket)}')" 
                style="background:#EFF6FF; border:1px solid #3B82F6; color:#1D4ED8; font-size:0.7rem; font-weight:700; padding:0.2rem 0.5rem; border-radius:4px; cursor:pointer; display:inline-flex; align-items:center; gap:0.25rem;">
                📑 Lihat Berkas Surat Masuk
              </button>
            </div>
          ` : `
            <div style="margin-top:0.3rem;">
              <span style="font-size:0.68rem; color:#64748B; background:#F1F5F9; padding:0.15rem 0.4rem; border-radius:3px;">Tanpa Berkas Surat (Laporan Langsung)</span>
            </div>
          `}
        </td>
        <td style="font-size:0.8rem;">${escapeHtml(r.location || '-')}</td>
        <td>${disposisiHtml}</td>
        <td>${statusBadge}</td>
        <td>${balasanHtml}</td>
        <td style="text-align:center;">
          ${isSuperAdmin ? `
            <div style="display:flex; flex-direction:column; gap:0.35rem; align-items:center;">
              <button type="button" 
                onclick="toggleAccSingle('${escapeHtml(r.ticket)}')" 
                class="btn-sm" 
                style="padding:0.3rem 0.65rem; font-size:0.75rem; font-weight:700; border-radius:4px; cursor:pointer; width:100%; ${isApproved ? 'background:#DC2626; color:#fff; border:none;' : 'background:#059669; color:#fff; border:none;'}"
                title="${isApproved ? 'Batalkan status ACC' : 'Setujui / ACC Laporan Ini'}">
                ${isApproved ? '✕ Batalkan ACC' : '✓ ACC Laporan'}
              </button>
              <select onchange="updatePublicReportStatus('${escapeHtml(r.ticket)}', this.value)" class="form-control" style="font-size:0.72rem; padding:0.25rem 0.4rem; border-color:#CBD5E1;">
                <option value="Menunggu Verifikasi Dinas" ${r.status === 'Menunggu Verifikasi Dinas' ? 'selected' : ''}>Menunggu</option>
                <option value="Sedang Ditindaklanjuti" ${r.status === 'Sedang Ditindaklanjuti' ? 'selected' : ''}>Tindaklanjuti Bidang</option>
                <option value="Selesai Ditangani" ${isApproved ? 'selected' : ''}>Selesai (ACC)</option>
              </select>
            </div>
          ` : (isBidang ? `
            <div style="display:flex; flex-direction:column; gap:0.3rem; align-items:center;">
              <button type="button" 
                onclick="updatePublicReportStatus('${escapeHtml(r.ticket)}', 'Sedang Ditindaklanjuti')" 
                class="btn-sm" 
                style="background:#0284C7; color:#fff; border:none; padding:0.25rem 0.5rem; font-size:0.72rem; border-radius:4px; font-weight:700; cursor:pointer;">
                🛠️ Tindak Lanjut Bidang
              </button>
              <span style="font-size:0.7rem; color:#64748B;">Bidang Pelaksana</span>
            </div>
          ` : `
            <span style="font-size:0.75rem; color:#94A3B8; font-weight:600;">Sakres (Penyusun Surat)</span>
          `)}
        </td>
      </tr>
    `;
  }).join('');
}

let uploadedFileSuratBase64 = null;
let uploadedFileSuratName = '';

window.toggleMetodeBalasan = function (val) {
  const areaKetik = document.getElementById('areaKetikNaskah');
  const areaUpload = document.getElementById('areaUploadDokumen');
  const txtIsi = document.getElementById('sakresIsiSurat');
  if (val === 'upload') {
    if (areaKetik) areaKetik.style.display = 'none';
    if (areaUpload) areaUpload.style.display = 'block';
    if (txtIsi) txtIsi.required = false;
  } else {
    if (areaKetik) areaKetik.style.display = 'block';
    if (areaUpload) areaUpload.style.display = 'none';
    if (txtIsi) txtIsi.required = true;
  }
};

window.handleFileSuratChange = function (input) {
  const file = input.files[0];
  if (!file) return;
  uploadedFileSuratName = file.name;
  const reader = new FileReader();
  reader.onload = function (e) {
    uploadedFileSuratBase64 = e.target.result;
    const info = document.getElementById('fileUploadInfo');
    const nameDisplay = document.getElementById('fileNameDisplay');
    if (info && nameDisplay) {
      nameDisplay.textContent = file.name + ' (' + Math.round(file.size / 1024) + ' KB)';
      info.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
};

// Buka Modal Penerbitan Surat Balasan (Bidang / Sakres)
window.openModalSakres = function (ticket) {
  const reports = Storage.getPublicReports();
  const target = reports.find(r => r.ticket === ticket);
  if (!target) return;

  const modal = document.getElementById('modalBalasanSakres');
  if (!modal) return;

  document.getElementById('sakresTargetTicket').value = target.ticket;
  document.getElementById('sakresDisplayTicket').textContent = target.ticket;
  document.getElementById('sakresDisplayReporter').textContent = target.reporterName;
  document.getElementById('sakresDisplayAgency').textContent = target.originAgency || '-';
  document.getElementById('sakresDisplaySubject').textContent = target.subject;

  // Reset upload state
  uploadedFileSuratBase64 = null;
  uploadedFileSuratName = '';
  const fileInput = document.getElementById('sakresFileSurat');
  if (fileInput) fileInput.value = '';
  const fileInfo = document.getElementById('fileUploadInfo');
  if (fileInfo) fileInfo.style.display = 'none';
  const radioKetik = document.querySelector('input[name="metodeBalasan"][value="ketik"]');
  if (radioKetik) radioKetik.checked = true;
  toggleMetodeBalasan('ketik');

  // Nilai bawaan jika belum ada balasan
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const roman = romanMonths[d.getMonth()];
  const randomNo = Math.floor(100 + Math.random() * 900);

  const unitUser = currentUser ? (currentUser.unit || currentUser.role) : 'Sekretariat / Sakres';
  const singkatanUnit = (currentUser && currentUser.unit && currentUser.unit.includes('Bina Marga')) ? 'BM' :
    ((currentUser && currentUser.unit && currentUser.unit.includes('Sumber Daya Air')) ? 'SDA' :
      ((currentUser && currentUser.unit && currentUser.unit.includes('Cipta Karya')) ? 'CK' : 'PU'));

  document.getElementById('sakresNomorSurat').value = target.replyLetter ? target.replyLetter.letterNo : `${randomNo}/PU-${singkatanUnit}/${roman}/${d.getFullYear()}`;
  document.getElementById('sakresPejabat').value = target.replyLetter ? target.replyLetter.officialName : (currentUser ? `${currentUser.nama} (${unitUser})` : 'Hj. Ratna Sari, S.Kom., M.M.');
  document.getElementById('sakresPerihalSurat').value = target.replyLetter ? target.replyLetter.subject : `Tanggapan Atas Laporan Infrastruktur: ${target.subject}`;
  document.getElementById('sakresIsiSurat').value = target.replyLetter ? target.replyLetter.content : `Menindaklanjuti pengaduan/laporan yang Saudara sampaikan melalui Portal PU dengan Nomor Registrasi ${target.ticket} mengenai "${target.subject}" pada lokasi "${target.location || '-'}", bersama ini kami dari ${unitUser} menyampaikan bahwa laporan telah diteliti dan diverifikasi teknis untuk penanganan prioritas.\n\nDemikian surat balasan ini kami sampaikan, atas perhatian dan laporan Saudara kami ucapkan terima kasih.`;

  modal.classList.add('active');
};

window.closeModalSakres = function () {
  const modal = document.getElementById('modalBalasanSakres');
  if (modal) modal.classList.remove('active');
};

// Simpan Surat Balasan (Bisa Upload atau Ketik Naskah)
window.handleSimpanSuratBalasan = function (e) {
  e.preventDefault();
  const ticket = document.getElementById('sakresTargetTicket').value;
  const nomorSurat = document.getElementById('sakresNomorSurat').value.trim();
  const pejabat = document.getElementById('sakresPejabat').value.trim();
  const perihal = document.getElementById('sakresPerihalSurat').value.trim();
  const metode = document.querySelector('input[name="metodeBalasan"]:checked') ? document.querySelector('input[name="metodeBalasan"]:checked').value : 'ketik';
  const isi = document.getElementById('sakresIsiSurat').value.trim();

  if (metode === 'upload' && !uploadedFileSuratBase64) {
    showToast('Validasi', 'Silakan pilih berkas file surat balasan yang hendak diunggah.', 'error');
    return;
  }
  if (metode === 'ketik' && !isi) {
    showToast('Validasi', 'Silakan tulis isi dokumen surat balasan.', 'error');
    return;
  }

  const reports = Storage.getPublicReports();
  const target = reports.find(r => r.ticket === ticket);
  if (!target) return;

  const nowStr = formatCurrentDateTime(false);
  const verificationData = encodeURIComponent(`PU REPUBLIK INDONESIA | No. Surat: ${nomorSurat} | Tiket: ${ticket} | Pengirim: ${pejabat} | Perihal: ${perihal} | Status: Resmi Terverifikasi PUSDATIN`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${verificationData}`;

  target.replyLetter = {
    letterNo: nomorSurat,
    officialName: pejabat,
    officialRole: (currentUser ? currentUser.unit : 'Bidang / Seker PU'),
    date: nowStr,
    subject: perihal,
    content: metode === 'upload' ? `[Dokumen Terlampir]: Berkas surat balasan resmi telah diunggah oleh ${pejabat}` : isi,
    method: metode,
    fileAttachment: uploadedFileSuratBase64,
    fileName: uploadedFileSuratName,
    barcodeUrl: qrUrl
  };

  target.status = 'Selesai Ditangani';
  localStorage.setItem('pupr_public_reports', JSON.stringify(reports));

  Storage.addAuditLog(
    currentUser ? currentUser.id : 'ADMIN',
    currentUser ? currentUser.nama : 'Petugas',
    currentUser ? currentUser.role : 'Bidang/Sakres',
    'Penerbitan Surat Balasan PU',
    `Menerbitkan Surat Balasan No. ${nomorSurat} (${metode === 'upload' ? 'Upload Berkas' : 'Ketik Naskah'}) untuk Tiket ${ticket}`,
    currentUser ? currentUser.unit : 'PU'
  );

  closeModalSakres();
  showToast('Surat Balasan Diterbitkan', `Surat balasan untuk tiket ${ticket} berhasil diterbitkan (${metode === 'upload' ? 'Berkas Diunggah' : 'Naskah Digital'}).`, 'success');
  renderInboxPublicPage();
  updateInboxBadge();
};

// Lihat Dokumen Surat Balasan PDF & QR Code di Layar
window.lihatSuratBalasan = function (ticket) {
  const reports = Storage.getPublicReports();
  const target = reports.find(r => r.ticket === ticket);
  if (!target || !target.replyLetter) {
    showToast('Belum Ada Balasan', 'Surat balasan resmi belum diterbitkan untuk tiket ini.', 'info');
    return;
  }

  const letter = target.replyLetter;
  const container = document.getElementById('contentSuratPdfPreview');
  if (!container) return;

  const isUploaded = letter.method === 'upload' && letter.fileAttachment;

  container.innerHTML = `
    <div style="background:#fff; border:2px solid #153E75; border-radius:8px; padding:1.5rem; font-family:'Times New Roman', serif; color:#000; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
      
      <!-- Kop Surat Resmi PU -->
      <div style="display:flex; align-items:center; gap:1rem; border-bottom:3px double #000; padding-bottom:0.75rem; margin-bottom:1.25rem;">
        <img src="logo-pu.webp" alt="Logo PU" style="width:52px; height:52px; object-fit:contain; border-radius:4px;">
        <div style="text-align:center; flex:1;">
          <div style="font-size:1.05rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">PU PEKERJAAN UMUM REPUBLIK INDONESIA</div>
          <div style="font-size:0.85rem; font-weight:700;">${escapeHtml(letter.officialRole || 'SEKRETARIAT &amp; BIDANG TEKNIS PU')}</div>
          <div style="font-size:0.72rem; font-family:sans-serif; color:#333; margin-top:2px;">Jl. Pattimura No. 20, Kebayoran Baru, Jakarta Selatan 12110 &bull; Telp. (021) 722844</div>
        </div>
      </div>

      <!-- Nomor Surat & Tanggal -->
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:1rem; font-family:sans-serif;">
        <div>
          <div>Nomor &nbsp; &nbsp;: <strong>${escapeHtml(letter.letterNo)}</strong></div>
          <div>Sifat &nbsp; &nbsp; &nbsp;: Penting / Resmi</div>
          <div>Lampiran : ${isUploaded ? '1 (Satu) Berkas Dokumen Terlampir' : '1 (Satu) Berkas Lembar Pengaduan'}</div>
          <div>Perihal &nbsp; : <strong>${escapeHtml(letter.subject)}</strong></div>
        </div>
        <div style="text-align:right;">
          <div>Jakarta, ${escapeHtml(letter.date ? letter.date.slice(0, 10) : '-')}</div>
          <div style="font-size:0.75rem; color:#153E75; font-weight:700; margin-top:0.25rem;">Tiket: ${escapeHtml(target.ticket)}</div>
        </div>
      </div>

      <!-- Tujuan Surat -->
      <div style="margin-bottom:1.25rem; font-size:0.85rem; font-family:sans-serif;">
        <div>Kepada Yth.</div>
        <div style="font-weight:700;">${escapeHtml(target.reporterName)}</div>
        <div>${escapeHtml(target.originAgency || 'Masyarakat / Tamu')}</div>
        <div>Di Tempat</div>
      </div>

      <!-- Isi / Lampiran Surat -->
      ${isUploaded ? `
        <div style="background:#F0F7FF; border:1px solid #BFDBFE; border-radius:8px; padding:1.25rem; margin-bottom:1.5rem; text-align:center; font-family:sans-serif;">
          <div style="font-size:1.5rem; margin-bottom:0.25rem;">📄</div>
          <div style="font-weight:700; font-size:0.95rem; color:#1E3A8A;">Berkas Dokumen Balasan Resmi Telah Diunggah</div>
          <div style="font-size:0.8rem; color:#475569; margin:0.25rem 0 0.85rem 0;">Nama Berkas: <strong>${escapeHtml(letter.fileName || 'Dokumen_Surat_Balasan.pdf')}</strong></div>
          <a href="${letter.fileAttachment}" download="${escapeHtml(letter.fileName || 'Surat_Balasan_PU.pdf')}" 
            style="display:inline-flex; align-items:center; gap:0.4rem; background:#153E75; color:#fff; text-decoration:none; padding:0.5rem 1.25rem; border-radius:6px; font-weight:700; font-size:0.85rem;">
            ⬇️ Unduh / Buka Dokumen Balasan Asli
          </a>
        </div>
      ` : `
        <div style="font-size:0.95rem; line-height:1.6; text-align:justify; margin-bottom:1.5rem; white-space:pre-line;">
          ${escapeHtml(letter.content)}
        </div>
      `}

      <!-- Footer Tanda Tangan & QR Barcode PDF Sah -->
      <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed #CBD5E1; padding-top:1rem; margin-top:1rem;">
        <div style="text-align:center; font-family:sans-serif;">
          <div style="font-size:0.7rem; color:#64748B; font-weight:700; margin-bottom:4px;">BARCODE VERIFIKASI PUSDATIN</div>
          <img src="${letter.barcodeUrl}" alt="QR Verifikasi" style="width:110px; height:110px; border:1px solid #CBD5E1; padding:3px; background:#fff; border-radius:6px; display:block; margin:0 auto;">
          <div style="font-size:0.65rem; color:#059669; font-weight:700; margin-top:3px;">✓ Dokumen Sah &amp; Terverifikasi</div>
        </div>
        <div style="text-align:center; font-family:sans-serif; min-width:200px;">
          <div style="font-size:0.78rem; font-weight:700; color:#333;">PU (PEKERJAAN UMUM) RI</div>
          <div style="font-size:0.72rem; color:#64748B; margin-bottom:2.5rem;">${escapeHtml(letter.officialRole || 'Pejabat Penandatangan')}</div>
          <div style="font-weight:800; font-size:0.85rem; border-bottom:1px solid #000; display:inline-block; padding-bottom:1px;">${escapeHtml(letter.officialName)}</div>
          <div style="font-size:0.7rem; color:#475569;">NIP. 19850412 201001 2 008</div>
        </div>
      </div>

    </div>
  `;

  const modal = document.getElementById('modalLihatSuratBalasan');
  if (modal) modal.classList.add('active');
};

window.closeModalLihatSurat = function () {
  const modal = document.getElementById('modalLihatSuratBalasan');
  if (modal) modal.classList.remove('active');
};

window.cetakSuratBalasan = function () {
  window.print();
};

// Modal Pratinjau Berkas Data Surat Masuk Tamu untuk Admin
window.bukaModalDataSuratMasukAdmin = function (ticket) {
  const reports = Storage.getPublicReports();
  const target = reports.find(r => r.ticket === ticket);
  if (!target) return;

  const data = target.letterData || {
    tglDiterima: target.date + ' WIB',
    tglSurat: target.date.slice(0, 10),
    noSurat: target.ticket,
    pengirim: `${target.reporterName} (${target.originAgency || '-'})`,
    perihal: target.subject,
    masukVia: target.serviceType || 'Portal Online Tamu',
    kontak: `${target.contact || '-'} / ${target.email || '-'}`
  };

  const container = document.getElementById('kontenLihatSuratBalasan');
  if (!container) return;

  container.innerHTML = `
    <div style="padding:1rem;">
      <div style="background:#0F294A; color:#fff; padding:0.75rem 1rem; border-radius:8px 8px 0 0; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-size:0.75rem; color:#FABE2C; font-weight:800; text-transform:uppercase;">BERKAS RESMI PERSURATAN TAMU</span>
          <h4 style="margin:2px 0 0 0; color:#fff; font-size:1.1rem;">Lembar Tanda Terima Surat Masuk</h4>
        </div>
        <span style="font-family:monospace; font-weight:800; background:rgba(255,255,255,0.15); padding:0.25rem 0.6rem; border-radius:4px;">
          ${escapeHtml(target.ticket)}
        </span>
      </div>

      <table style="width:100%; border-collapse:collapse; font-size:0.85rem; border:1px solid #CBD5E1; text-align:left;">
        <tbody>
          <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
            <th style="padding:0.65rem 1rem; color:#475569; width:35%;">TANGGAL DITERIMA</th>
            <td style="padding:0.65rem 1rem; font-weight:700; color:#0F294A;">${escapeHtml(data.tglDiterima)}</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0;">
            <th style="padding:0.65rem 1rem; color:#475569;">TANGGAL SURAT</th>
            <td style="padding:0.65rem 1rem; font-weight:600; color:#334155;">${escapeHtml(data.tglSurat)}</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
            <th style="padding:0.65rem 1rem; color:#475569;">NO SURAT</th>
            <td style="padding:0.65rem 1rem; font-weight:800; color:#0F294A; font-family:monospace;">${escapeHtml(data.noSurat)}</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0;">
            <th style="padding:0.65rem 1rem; color:#475569;">PENGIRIM</th>
            <td style="padding:0.65rem 1rem; font-weight:700; color:#0F294A;">${escapeHtml(data.pengirim)}</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0; background:#F8FAFC;">
            <th style="padding:0.65rem 1rem; color:#475569;">PERIHAL</th>
            <td style="padding:0.65rem 1rem; font-weight:700; color:#1E293B;">${escapeHtml(data.perihal)}</td>
          </tr>
          <tr style="border-bottom:1px solid #E2E8F0;">
            <th style="padding:0.65rem 1rem; color:#475569;">MASUK VIA</th>
            <td style="padding:0.65rem 1rem; font-weight:700; color:#0284C7;">${escapeHtml(data.masukVia)}</td>
          </tr>
          <tr style="background:#F8FAFC;">
            <th style="padding:0.65rem 1rem; color:#475569;">KONTAK / EMAIL PENGIRIM</th>
            <td style="padding:0.65rem 1rem; font-weight:600; color:#334155;">${escapeHtml(data.kontak)}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top:1rem; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:6px; padding:0.75rem 1rem; font-size:0.8rem; color:#1E40AF;">
        <strong>Catatan Disposisi:</strong> Laporan ini terverifikasi masuk dengan berkas surat resmi. Super Admin dapat langsung menentukan unit kerja Bidang penanganan teknis melalui tombol disposisi.
      </div>
    </div>
  `;

  const modal = document.getElementById('modalLihatSuratBalasan');
  if (modal) modal.classList.add('active');
};

// Handler Ubah Disposisi Unit oleh Super Admin
window.updatePublicReportDisposisi = function (ticket, newUnit) {
  if (!currentUser || currentUser.role !== ROLES.SUPER_ADMIN) {
    showToast('Akses Ditolak', 'Hanya Super Admin yang berwenang menentukan disposisi unit kerja.', 'error');
    renderInboxPublicPage();
    return;
  }

  const reports = Storage.getPublicReports();
  const target = reports.find(r => r.ticket === ticket);
  if (!target) return;

  const oldUnit = target.targetUnit || target.unit || 'Belum Didisposisi';
  target.targetUnit = newUnit;
  target.unit = newUnit;
  localStorage.setItem('pupr_public_reports', JSON.stringify(reports));

  Storage.addAuditLog(
    currentUser.id,
    currentUser.nama,
    currentUser.role,
    'Disposisi Laporan Masuk',
    `Tiket ${ticket} didisposisikan dari "${oldUnit}" ke unit "${newUnit}" oleh Super Admin`,
    newUnit
  );

  showToast('Disposisi Berhasil', `Tiket ${ticket} telah berhasil dialihkan ke ${newUnit}.`, 'success');
  renderInboxPublicPage();
  updateInboxBadge();
};

// Handler Toggle ACC Satuan
window.toggleAccSingle = function (ticket) {
  if (!currentUser || currentUser.role !== ROLES.SUPER_ADMIN) {
    showToast('Akses Ditolak', 'Hanya Super Admin yang berwenang menyetujui (ACC) atau membatalkan laporan.', 'error');
    return;
  }
  const reports = Storage.getPublicReports();
  const target = reports.find(r => r.ticket === ticket);
  if (!target) return;

  const willApprove = !(target.status.includes('Selesai') || target.status.includes('Disetujui'));
  target.status = willApprove ? 'Selesai Ditangani' : 'Menunggu Verifikasi Dinas';
  localStorage.setItem('pupr_public_reports', JSON.stringify(reports));

  Storage.addAuditLog(
    currentUser.id,
    currentUser.nama,
    currentUser.role,
    willApprove ? 'ACC Permohonan Publik' : 'Batal ACC Permohonan',
    `Tiket ${ticket} (${target.subject}) ${willApprove ? 'telah di-ACC dan Disetujui' : 'dikembalikan ke status Menunggu Verifikasi'}`,
    currentUser.unit
  );

  showToast(willApprove ? 'Laporan Di-ACC' : 'Status Dibatalkan', `Tiket ${ticket} ${willApprove ? 'berhasil disetujui (ACC).' : 'dikembalikan ke status Menunggu.'}`, willApprove ? 'success' : 'info');
  renderInboxPublicPage();
  updateInboxBadge();
};

// Handler Batch ACC (Setujui Semua yang Dicentang)
function handleBatchApproveInbox() {
  if (!currentUser || currentUser.role !== ROLES.SUPER_ADMIN) {
    showToast('Akses Ditolak', 'Hanya Super Admin yang berwenang melakukan Batch ACC.', 'error');
    return;
  }
  const selectedCheckboxes = document.querySelectorAll('.inbox-checkbox:checked');
  if (selectedCheckboxes.length === 0) {
    showToast('Pilih Laporan', 'Silakan centang minimal 1 laporan yang ingin Anda ACC / Setujui.', 'warning');
    return;
  }

  const selectedTickets = Array.from(selectedCheckboxes).map(cb => cb.value);
  const reports = Storage.getPublicReports();

  let approvedCount = 0;
  reports.forEach(r => {
    if (selectedTickets.includes(r.ticket)) {
      r.status = 'Selesai Ditangani';
      approvedCount++;
    }
  });

  localStorage.setItem('pupr_public_reports', JSON.stringify(reports));

  Storage.addAuditLog(
    currentUser.id,
    currentUser.nama,
    currentUser.role,
    'Batch ACC Laporan Masuk',
    `Menyetujui (ACC) sekaligus ${approvedCount} berkas permohonan publik: ${selectedTickets.join(', ')}`,
    currentUser.unit
  );

  showToast('Batch ACC Berhasil', `${approvedCount} laporan berhasil disetujui (ACC) secara bersamaan.`, 'success');
  if (elements.checkAllInbox) elements.checkAllInbox.checked = false;
  renderInboxPublicPage();
  updateInboxBadge();
}

// Ekspor Rekap Laporan Masuk Publik ke File CSV / Excel
function exportInboxPublicCsv() {
  const reports = Storage.getPublicReports();
  if (reports.length === 0) {
    showToast('Ekspor Dibatalkan', 'Tidak ada data laporan masuk yang dapat diunduh.', 'error');
    return;
  }

  let csvContent = '\uFEFF';
  csvContent += '"No. Tiket","Tanggal","Nama Pemohon","No. Handphone","Gender","Email","Asal Instansi","Kategori Pemohon","Jenis Layanan","Perihal","Lokasi","Disposisi Unit","Status Tindak Lanjut","Kesediaan Survei"\r\n';

  reports.forEach(r => {
    const row = [
      `"${(r.ticket || '').replace(/"/g, '""')}"`,
      `"${(r.date || '').replace(/"/g, '""')}"`,
      `"${(r.reporterName || '').replace(/"/g, '""')}"`,
      `"${(r.contact || '').replace(/"/g, '""')}"`,
      `"${(r.gender || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.originAgency || '').replace(/"/g, '""')}"`,
      `"${(r.applicantCategory || '').replace(/"/g, '""')}"`,
      `"${(r.serviceType || '').replace(/"/g, '""')}"`,
      `"${(r.subject || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.targetUnit || r.unit || '').replace(/"/g, '""')}"`,
      `"${(r.status || '').replace(/"/g, '""')}"`,
      `"${r.surveyConsent ? 'Bersedia' : 'Tidak Bersedia'}"`
    ];
    csvContent += row.join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Rekap_Laporan_Publik_PUPR_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Unduhan Berhasil', 'Rekapitulasi laporan permohonan publik berhasil diunduh.', 'success');
}

// Update Status Laporan dari Panel Admin / Staf (Dropdown)
window.updatePublicReportStatus = function (ticket, newStatus) {
  if (!currentUser || currentUser.role !== ROLES.SUPER_ADMIN) {
    showToast('Akses Ditolak', 'Hanya Super Admin yang berwenang mengubah status tindak lanjut laporan.', 'error');
    renderInboxPublicPage();
    return;
  }
  const reports = Storage.getPublicReports();
  const target = reports.find(r => r.ticket === ticket);
  if (!target) return;

  target.status = newStatus;
  localStorage.setItem('pupr_public_reports', JSON.stringify(reports));

  Storage.addAuditLog(
    currentUser.id,
    currentUser.nama,
    currentUser.role,
    'Update Status Laporan Publik',
    `Status tiket ${ticket} (${target.subject}) diubah menjadi "${newStatus}"`,
    currentUser.unit
  );

  showToast('Status Diperbarui', `Status laporan ${ticket} diubah menjadi: ${newStatus}`, 'success');
  renderInboxPublicPage();
  updateInboxBadge();
};

// Handler Pelacakan Tiket
function handleTrackTicket() {
  const query = elements.trackTicketInput ? elements.trackTicketInput.value.trim().toUpperCase() : '';
  if (!query) {
    showToast('Pencarian', 'Silakan masukkan nomor tiket laporan Anda.', 'warning');
    return;
  }

  const reports = Storage.getPublicReports();
  const found = reports.find(r => r.ticket.toUpperCase() === query);

  if (!found) {
    if (elements.trackResultArea) {
      elements.trackResultArea.style.display = 'block';
      elements.trackResultArea.innerHTML = `
        <div style="background:#FEF2F2; border:1px solid #F87171; border-radius:var(--radius-sm); padding:1.25rem; color:#991B1B;">
          <strong>Nomor Tiket "${escapeHtml(query)}" Tidak Ditemukan</strong>
          <p style="font-size:0.85rem; margin-top:0.35rem; color:#B91C1C;">
            Pastikan format nomor tiket benar (Contoh: PUPR-PUB-1001) atau periksa kembali tanda bukti permohonan Anda.
          </p>
        </div>
      `;
    }
    return;
  }

  showTicketResult(found, false);
}

function showTicketResult(r, isJustSubmitted) {
  if (!elements.trackResultArea) return;
  elements.trackResultArea.style.display = 'block';

  const sInfo = getReportStatusInfo(r.status);

  elements.trackResultArea.innerHTML = `
    <div style="border:2px solid ${sInfo.badgeBorder}; background:#F8FAFC; border-radius:var(--radius-md); padding:1.5rem; margin-top:1rem;">
      ${isJustSubmitted ? `
        <div style="background:#DCFCE7; color:#166534; padding:0.65rem 1rem; border-radius:var(--radius-sm); font-weight:700; font-size:0.88rem; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Permohonan / Laporan Berhasil Diterima oleh Sistem dan Langsung Diteruskan ke Admin/Staf PUPR
        </div>
      ` : ''}
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1rem;">
        <div>
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Nomor Tiket Resmi</span>
          <div style="font-size:1.4rem; font-weight:800; color:var(--pupr-navy);">${escapeHtml(r.ticket)}</div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Status Saat Ini</span>
          <div>${getReportStatusBadge(r.status)}</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1rem;">
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Nama Pemohon &amp; Gender</div>
          <div style="font-weight:700; color:var(--text-primary);">${escapeHtml(r.reporterName)} <span style="font-weight:400; color:var(--text-muted);">(${escapeHtml(r.gender || '-')})</span></div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Kontak &amp; Email</div>
          <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(r.contact)} &bull; ${escapeHtml(r.email || '-')}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Asal Instansi</div>
          <div style="font-weight:700; color:var(--pupr-navy);">${escapeHtml(r.originAgency || '-')}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Kategori Pemohon</div>
          <div style="font-weight:600; color:var(--text-primary); font-size:0.85rem;">${escapeHtml(r.applicantCategory || '-')}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Jenis Layanan Dimohon</div>
          <div style="font-weight:700; color:#0369A1;">${escapeHtml(r.serviceType || '-')}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Disposisi Petugas Unit</div>
          <div style="font-weight:700; color:var(--pupr-navy);">${escapeHtml(r.targetUnit || r.unit || 'Sekretariat Jenderal')}</div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Tanggal Pengajuan</div>
          <div style="font-weight:600; color:var(--text-primary);">${escapeHtml(r.date)} WIB</div>
        </div>
        <div>
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Kesediaan Koresponden Survei PU</div>
          <div style="font-weight:700; color:${r.surveyConsent ? '#166534' : '#991B1B'};">${r.surveyConsent ? '✓ Bersedia' : '✕ Tidak Bersedia'}</div>
        </div>
      </div>

      <div style="margin-bottom:0.75rem;">
        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Perihal</div>
        <div style="font-size:1rem; font-weight:700; color:var(--pupr-navy);">${escapeHtml(r.subject || '-')}</div>
      </div>

      <div style="margin-bottom:0.75rem;">
        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Lokasi / Obyek Infrastruktur Terkait</div>
        <div style="font-size:0.9rem; color:var(--text-primary);">${escapeHtml(r.location)}</div>
      </div>

      <div>
        <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">Uraian Isi Permohonan / Laporan</div>
        <div style="font-size:0.88rem; color:var(--text-secondary); line-height:1.6; background:#fff; padding:0.85rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); margin-top:0.35rem;">
          ${escapeHtml(r.description)}
        </div>
      </div>
    </div>
  `;
}

// Fungsi Masuk Cepat (Quick Login 1-Klik)
window.quickLogin = function (userId = 'PUPR-SUP01') {
  sessionStorage.removeItem('pupr_explicit_logout');
  const users = Storage.getUsers();
  const user = users.find((u) => u.id.toLowerCase() === userId.toLowerCase()) || users[0];
  if (user) {
    currentUser = user;
    Storage.setSession(user);
    showToast('Berhasil Masuk', `Selamat datang, ${user.nama} (${user.role}).`, 'success');
    showView('dashboard');
  }
};

// Inisialisasi Aplikasi
function initApp() {
  populateUnitOptions();
  initEvents();
  initClock();

  // Sinkronisasi otomatis data antar tab/jendela (Laporan tamu langsung masuk ke admin)
  window.addEventListener('storage', function (e) {
    if (e.key === 'pupr_public_reports') {
      updateInboxBadge();
      if (elements.inboxTableBody) renderInboxPublicPage();
    }
  });

  // Listener notifikasi topbar & helpdesk
  const btnNotif = document.getElementById('btnTopbarNotif');
  if (btnNotif) {
    btnNotif.onclick = function (e) {
      window.toggleNotifDropdown(e);
    };
  }
  const btnCloseNtf = document.getElementById('btnCloseNotif');
  if (btnCloseNtf) {
    btnCloseNtf.onclick = function (e) {
      window.closeNotifDropdown(e);
    };
  }

  // Tutup notifikasi jika klik di luar
  document.addEventListener('click', function (e) {
    const dropdown = document.getElementById('notifDropdown');
    const wrapper = document.querySelector('.topbar-notif-wrapper');
    if (dropdown && dropdown.style.display === 'block' && wrapper && !wrapper.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  if (elements.btnTopbarHelp) {
    elements.btnTopbarHelp.addEventListener('click', openHelpdeskModal);
  }
  if (elements.helpdeskCloseBtn) {
    elements.helpdeskCloseBtn.addEventListener('click', closeHelpdeskModal);
  }
  if (elements.helpdeskOkBtn) {
    elements.helpdeskOkBtn.addEventListener('click', closeHelpdeskModal);
  }

  // Muat Remember ID jika pernah disimpan
  const rememberedId = localStorage.getItem('pupr_remembered_id');
  if (rememberedId) {
    const loginIdInput = document.getElementById('loginId');
    if (loginIdInput) loginIdInput.value = rememberedId;
    if (elements.rememberMe) elements.rememberMe.checked = true;
  }

  // Halaman Khusus Tamu atau Warga Mandiri
  if (window.location.pathname.endsWith('tamu.html') || window.location.pathname.endsWith('warga.html')) {
    return;
  }

  // Cek apakah ada parameter login otomatis via barcode
  const urlParams = new URLSearchParams(window.location.search);
  const loginAsParam = urlParams.get('login_as');
  const users = Storage.getUsers();

  if (loginAsParam) {
    const matched = users.find((u) => u.id.toLowerCase() === loginAsParam.toLowerCase());
    if (matched) {
      currentUser = matched;
      Storage.setSession(matched);
      showView('dashboard');
      return;
    }
  }

  // Cek sesi login yang tersimpan
  const session = Storage.getSession();
  if (session) {
    const matched = users.find((u) => u.id === session.id);
    if (matched) {
      currentUser = matched;
      showView('dashboard');
      return;
    }
  }

  // Jika belum login, tampilkan form login bersih
  showView('auth');
}

// ==========================================
// FITUR BANTUAN LUPA KATA SANDI (SUPER ADMIN)
// ==========================================

window.openModalLupaPassword = function () {
  const modal = document.getElementById('modalLupaPassword');
  if (modal) modal.classList.add('active');
};

window.closeModalLupaPassword = function () {
  const modal = document.getElementById('modalLupaPassword');
  if (modal) modal.classList.remove('active');
};

window.handleLaporLupaPassword = function (e) {
  e.preventDefault();
  const idUser = document.getElementById('lupaIdUser').value.trim().toUpperCase();
  const nama = document.getElementById('lupaNama').value.trim();
  const unit = document.getElementById('lupaUnit').value;
  const catatan = document.getElementById('lupaCatatan').value.trim();

  const users = Storage.getUsers();
  const userAda = users.find(u => u.id.toUpperCase() === idUser);

  const reqItem = {
    id: 'REQ-RST-' + Math.floor(1000 + Math.random() * 9000),
    time: formatCurrentDateTime(true),
    userId: idUser,
    nama: nama,
    unit: unit,
    catatan: catatan || 'Lupa kata sandi akun',
    userFound: !!userAda,
    currentPassword: userAda ? userAda.pw : null,
    status: 'Menunggu Bantuan Super Admin'
  };

  Storage.addResetRequest(reqItem);
  Storage.addAuditLog('SISTEM', nama, 'Pegawai Lapor', 'Permohonan Lupa Sandi', `Permohonan reset sandi untuk akun ${idUser} (${nama})`, unit);

  closeModalLupaPassword();
  document.getElementById('formLaporLupaPassword').reset();

  showToast('Laporan Terkirim', `Permohonan Anda berhasil dikirim ke Super Admin PU. Hubungi Super Admin untuk menerima kata sandi baru.`, 'success');
  updateResetRequestsBadge();
};

window.updateResetRequestsBadge = function () {
  const reqs = Storage.getResetRequests().filter(r => r.status.includes('Menunggu'));
  const badge = document.getElementById('menuCountResetRequests');
  const menuBtn = document.getElementById('navMenuResetRequests');
  if (currentUser && currentUser.role === ROLES.SUPER_ADMIN) {
    if (menuBtn) menuBtn.style.display = 'flex';
    if (badge) {
      badge.textContent = `${reqs.length} Laporan`;
      badge.style.display = reqs.length > 0 ? 'inline-block' : 'none';
    }
  } else {
    if (menuBtn) menuBtn.style.display = 'none';
  }
};

window.renderResetRequestsTable = function () {
  const tbody = document.getElementById('resetRequestsTableBody');
  if (!tbody) return;
  const list = Storage.getResetRequests();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2rem; color:#64748B;">
          Tidak ada antrean laporan lupa kata sandi dari admin atau pegawai.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => {
    const isPending = item.status.includes('Menunggu');
    return `
      <tr style="${isPending ? 'background:#FFFBEB;' : ''}">
        <td style="font-size:0.78rem; color:#64748B;">${escapeHtml(item.time)}</td>
        <td><strong style="color:#153E75; font-family:monospace; font-size:0.9rem;">${escapeHtml(item.userId)}</strong></td>
        <td>
          <div style="font-weight:700; color:#1E293B;">${escapeHtml(item.nama)}</div>
          ${item.userFound ? '<span style="font-size:0.7rem; color:#059669; font-weight:700;">✓ Akun Terdaftar</span>' : '<span style="font-size:0.7rem; color:#DC2626; font-weight:700;">⚠ ID Tidak Ditemukan</span>'}
        </td>
        <td><span class="badge-unit">${escapeHtml(item.unit)}</span></td>
        <td style="font-size:0.8rem; color:#475569; max-width:200px;">${escapeHtml(item.catatan)}</td>
        <td>
          <span class="badge-role" style="${isPending ? 'background:#FEF3C7; color:#B45309;' : 'background:#DCFCE7; color:#166534;'} font-weight:700; font-size:0.75rem;">
            ${escapeHtml(item.status)}
          </span>
        </td>
        <td style="text-align:center;">
          ${isPending ? `
            <div style="display:flex; gap:0.4rem; justify-content:center; flex-wrap:wrap;">
              <button type="button" class="btn-sm" onclick="superAdminBantuReset('${escapeHtml(item.id)}', '${escapeHtml(item.userId)}')" 
                style="background:#153E75; color:#fff; border:none; border-radius:4px; padding:0.35rem 0.65rem; font-size:0.75rem; font-weight:700; cursor:pointer;">
                🔑 Beri Sandi Baru
              </button>
              <button type="button" class="btn-sm" onclick="superAdminTolakReset('${escapeHtml(item.id)}')" 
                style="background:#F1F5F9; color:#475569; border:1px solid #CBD5E1; border-radius:4px; padding:0.35rem 0.5rem; font-size:0.75rem; cursor:pointer;">
                ✕ Tolak
              </button>
            </div>
          ` : `
            <span style="font-size:0.75rem; color:#059669; font-weight:700;">✓ Selesai Dibantu</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
};

window.superAdminBantuReset = function (reqId, userId) {
  const users = Storage.getUsers();
  const targetUser = users.find(u => u.id.toUpperCase() === userId.toUpperCase());
  if (!targetUser) {
    showToast('Gagal', `Pegawai dengan ID ${userId} tidak ditemukan di sistem.`, 'error');
    return;
  }

  const newPw = prompt(`Masukkan kata sandi baru untuk ${targetUser.nama} (${userId}):`, 'pupr123');
  if (!newPw) return;

  if (newPw.length < 6) {
    showToast('Peringatan', 'Kata sandi minimal 6 karakter.', 'error');
    return;
  }

  targetUser.pw = newPw;
  Storage.saveUsers(users);

  // Update status laporan reset
  const reqs = Storage.getResetRequests();
  const targetReq = reqs.find(r => r.id === reqId);
  if (targetReq) {
    targetReq.status = `Selesai (Sandi baru disetel: ${newPw})`;
    Storage.saveResetRequests(reqs);
  }

  Storage.addAuditLog(
    currentUser.id,
    currentUser.nama,
    currentUser.role,
    'Reset Kata Sandi Pegawai',
    `Super Admin mereset kata sandi akun ${userId} (${targetUser.nama})`,
    targetUser.unit
  );

  showToast('Berhasil Direset', `Kata sandi akun ${userId} berhasil diubah menjadi: "${newPw}". Silakan berikan sandi ini ke pegawai.`, 'success');
  renderResetRequestsTable();
  updateResetRequestsBadge();
  renderDashboardTable();
};

window.superAdminTolakReset = function (reqId) {
  if (!confirm('Tolak permohonan reset sandi ini?')) return;
  const reqs = Storage.getResetRequests();
  const targetReq = reqs.find(r => r.id === reqId);
  if (targetReq) {
    targetReq.status = 'Ditolak Super Admin';
    Storage.saveResetRequests(reqs);
  }
  showToast('Ditolak', 'Permohonan reset kata sandi telah ditolak.', 'info');
  renderResetRequestsTable();
  updateResetRequestsBadge();
};

// Tombol Reset Langsung dari Tabel Pegawai
window.bantuResetPassword = function (userId) {
  if (!currentUser || currentUser.role !== ROLES.SUPER_ADMIN) {
    showToast('Akses Ditolak', 'Hanya Super Admin yang berwenang mereset kata sandi pegawai.', 'error');
    return;
  }
  const users = Storage.getUsers();
  const targetUser = users.find(u => u.id === userId);
  if (!targetUser) return;

  const sandiSaatIni = targetUser.pw;
  const konfirmasi = confirm(`Akun: ${targetUser.nama} (${targetUser.id})\nKata Sandi Saat Ini: "${sandiSaatIni}"\n\nApakah Anda ingin mengganti kata sandinya dengan yang baru?`);
  if (!konfirmasi) return;

  const newPw = prompt(`Ketikkan kata sandi baru untuk ${targetUser.nama}:`, 'pupr123');
  if (!newPw) return;

  if (newPw.length < 6) {
    showToast('Peringatan', 'Kata sandi minimal 6 karakter.', 'error');
    return;
  }

  targetUser.pw = newPw;
  Storage.saveUsers(users);

  Storage.addAuditLog(
    currentUser.id,
    currentUser.nama,
    currentUser.role,
    'Bantuan Reset Kata Sandi',
    `Super Admin mengganti kata sandi pegawai ${userId} (${targetUser.nama})`,
    targetUser.unit
  );

  showToast('Sandi Diperbarui', `Kata sandi ${targetUser.nama} berhasil diubah menjadi "${newPw}".`, 'success');
  renderDashboardTable();
};

document.addEventListener('DOMContentLoaded', initApp);

