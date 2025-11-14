# Dokumentasi Arsitektur: ChillFinance-Gemini (Modular OOP)

## Gambaran Umum

Proyek ini telah direfaktor dari satu file `app.js` prosedural menjadi arsitektur **Modular Object-Oriented Programming (OOP)**.

Tujuannya adalah **Separation of Concerns (Pemisahan Tugas)**:

- Setiap file (modul) kini berisi satu `Class` (Kelas).
- Setiap `Class` memiliki satu tanggung jawab utama (misalnya: hanya mengurus UI, hanya mengurus Auth, hanya mengurus Target).
- Logika bisnis inti tidak diubah, hanya dipindahkan ke "rumah" yang lebih rapi.

---

## Alur Aplikasi (Cara Kerja)

Berikut adalah alur lengkap aplikasi dari awal hingga siap digunakan:

1.  **HTML Memuat:** Browser membuka `index.html`.
2.  **Modul Di-load:** `index.html` menemukan tag `<script type="module" src="js/main.js">` di bagian bawah. Ini adalah "pintu masuk" aplikasi.
3.  **`main.js` (Pintu Masuk):**
    - File ini meng-`import` kelas `App` dari `js/App.js`.
    - Ia menunggu _event_ `DOMContentLoaded` (memastikan semua HTML siap).
    - Setelah siap, ia membuat **satu instance** dari `App`: `const app = new App();`.
    - Ia menyimpan `app` ini ke `window.app` agar bisa di-debug di konsol.
    - Ia memanggil `app.init()` untuk "menyalakan" aplikasi.
4.  **`App.js` (Otak / Koordinator):**
    - `constructor()` dari `app` langsung berjalan. Di sinilah semua "Manajer" (seperti `UIManager`, `AuthManager`, `TargetManager`, dll.) dibuat sebagai _instance_ (`this.ui = new UIManager(this)`).
    - `app.init()` kemudian berjalan. Ia melakukan tiga hal:
      a. Memanggil `StorageManager.getDb()` untuk memastikan database ada.
      b. Memanggil `StorageManager.getUserData()` untuk memeriksa apakah pengguna sudah login.
      c. Memanggil `init()` pada **setiap Manajer** (`this.auth.init()`, `this.ui.init()`, dst.). Di sinilah semua _event listener_ (seperti `click` dan `submit`) didaftarkan ke elemen HTML.
      d. Ia menentukan halaman mana yang harus ditampilkan: Halaman Login (jika `currentUser` null) atau Halaman Dashboard (jika `currentUser` ada).
5.  **Aplikasi Siap (Event-Driven):**
    - Aplikasi sekarang "diam" dan menunggu interaksi pengguna.
    - **Contoh:** Saat pengguna menekan tombol "Login".
      a. `AuthManager` (yang sudah mendaftarkan _listener_ di `init()`) menangkap _event_ `submit` pada `#login-form`.
      b. `AuthManager.handleLogin()` berjalan.
      c. Ia memanggil `StorageManager.getUserData()` untuk validasi.
      d. Jika berhasil, ia memanggil `this.app.ui.showApp()` untuk berpindah halaman.
      e. `UIManager.showApp()` lalu memanggil `this.app.dashboard.updateDashboard()` untuk memastikan data di dashboard adalah data terbaru.

Semua bagian aplikasi bekerja dengan cara ini: `App` sebagai koordinator, dan `Manajer` saling "memanggil" melalui `this.app` untuk berkolaborasi.

---

## Struktur Direktori

```
chillfinance-gemini/
├── js/
│   ├── main.js              <-- Pintu Masuk Aplikasi
│   ├── App.js               <-- Otak / Koordinator Utama
│   ├── Utils.js             <-- Kumpulan fungsi (formatRupiah, dll)
│   ├── StorageManager.js    <-- Mengelola Local/Session Storage
│   ├── UIManager.js         <-- Mengelola DOM, Navigasi, Toast, Modal
│   ├── AuthManager.js       <-- Mengelola Login, Register, Logout
│   ├── DashboardManager.js  <-- Mengelola render halaman Dashboard
│   ├── TargetManager.js     <-- Mengelola logika & render halaman Target
│   ├── TransactionManager.js<-- Mengelola logika & form Nabung & Keluar
│   └── HistoryManager.js    <-- Mengelola logika & render halaman Riwayat
├── index.html               <-- Kerangka HTML (View)
└── README.md                <-- File ini
```

---

## Penjelasan File (Peran Masing-Masing)

### `index.html`

- **Peran:** Kerangka (Skeleton) / Tampilan (View).
- Berisi semua elemen HTML (div, button, form, input) yang dibutuhkan aplikasi.
- Tidak ada logika JavaScript di sini (semua _listener_ dipasang oleh JS).
- Tugas utamanya adalah memuat `js/main.js` sebagai `type="module"`.

### `js/main.js`

- **Peran:** Pintu Masuk (Entry Point).
- File ini adalah _satu-satunya_ file JS yang dipanggil langsung oleh `index.html`.
- Tugasnya hanya satu: Meng-`import` kelas `App`, membuat satu _instance_ darinya, dan memanggil `app.init()` saat dokumen siap.

### `js/App.js`

- **Peran:** Otak / Koordinator Utama.
- Ini adalah file terpenting yang menyatukan semuanya.
- **State:** Menyimpan _state_ aplikasi (siapa `currentUser`, apakah `balanceVisible`).
- **Constructor:** Membuat _instance_ dari _semua_ kelas Manajer lain. Ia memberikan `this` (dirinya sendiri) ke setiap manajer agar mereka bisa saling berkomunikasi.
- **`init()`:** Mengatur urutan _startup_ aplikasi dan memanggil `init()` dari semua manajer.

### `js/Utils.js`

- **Peran:** Kotak Perkakas (Toolbox).
- Berisi `Class` statis dengan fungsi-fungsi bantuan murni yang tidak menyimpan _state_.
- Contoh: `formatRupiah()`, `validateUsername()`, `parseNominal()`, `getGroupDate()`.
- Bisa di-`import` dan dipakai oleh Manajer manapun.

### `js/StorageManager.js`

- **Peran:** Penjaga Database (Database Guard).
- Berisi `Class` statis yang bertanggung jawab untuk semua interaksi dengan `localStorage` (`DB_KEY`) dan `sessionStorage` (`SESSION_KEY`).
- Menyediakan _method_ seperti `getUserData()`, `saveUserData()`, `logoutUser()`.

### `js/UIManager.js`

- **Peran:** Manajer Interaksi Pengguna (UI Manager).
- Mengelola semua perubahan DOM yang _umum_ (tidak spesifik ke satu fitur).
- **Tanggung Jawab:**
  - Navigasi halaman (`switchPage`, `switchNavPage`).
  - Menampilkan/menyembunyikan aplikasi (`showApp`, `hideApp`).
  - Menampilkan _Toast_ (`showToast`) dan _Modal_ (`showConfirmModal`).
  - `init()`: Mendaftarkan _listener_ untuk tombol navigasi (`.nav-btn`), tombol modal, dan _helper_ input (format rupiah, penghitung karakter).

### `js/AuthManager.js`

- **Peran:** Manajer Autentikasi.
- Mengelola semua hal yang berkaitan dengan pengguna masuk atau keluar.
- **Tanggung Jawab:**
  - `init()`: Mendaftarkan _listener_ untuk `#login-form`, `#register-form`, dan `#logout-btn`.
  - Logika `handleLogin()`, `handleRegister()`, dan `handleLogout()`.
  - Memanggil `StorageManager` untuk menyimpan data dan `UIManager` untuk berpindah halaman.

### `js/DashboardManager.js`

- **Peran:** Manajer Halaman Dashboard.
- Bertanggung jawab _hanya_ untuk me-render data di halaman Dashboard.
- **Tanggung Jawab:**
  - `updateDashboard()`: Fungsi utama yang dipanggil untuk me-refresh data.
  - `updateBalance()`: Mengurus logika _toggle_ saldo terlihat/tersembunyi.
  - `updateAnalytics()`: Menghitung dan menampilkan total nabung, keluar, dan rasio.
  - `renderDashboardTargets()`: Menampilkan 3 target teratas.

### `js/TargetManager.js`

- **Peran:** Manajer Fitur Target.
- Mengelola semua logika di halaman "Target" dan logika terkait target lainnya.
- **Tanggung Jawab:**
  - `init()`: Mendaftarkan _listener_ untuk form `#add-target-form`.
  - Logika `handleAddTarget()` (membuat target baru).
  - Logika `renderTargets()` (me-render _semua_ target di halaman Target).
  - Logika `deleteTarget()` (termasuk logika **penting** memindahkan sisa saldo ke Saldo Utama).
  - `populateTargetSelects()`: Fungsi bantuan yang dipanggil oleh Manajer lain untuk mengisi daftar target di form.

### `js/TransactionManager.js`

- **Peran:** Manajer Transaksi (Nabung & Keluar).
- Mengelola logika bisnis paling kompleks di aplikasi ini.
- **Tanggung Jawab:**
  - `init()`: Mendaftarkan _listener_ untuk `#nabung-form` dan `#pengeluaran-form`.
  - Logika `handleNabung()`.
  - Logika `handlePengeluaranSubmit()` (untuk Saldo Utama).
  - Logika `updatePengeluaranTargetInfo()`: Logika canggih untuk penarikan target (validasi 1x/tahun, kalkulasi 30%).

### `js/HistoryManager.js`

- **Peran:** Manajer Halaman Riwayat.
- Mengelola tampilan data di halaman "Riwayat".
- **Tanggung Jawab:**
  - `init()`: Mendaftarkan _listener_ untuk tombol Tab (`.tab-btn`) dan _dropdown_ target (`#target-riwayat-selector`).
  - `renderGroupedHistory()`: Logika utama untuk mengelompokkan transaksi berdasarkan tanggal (misal: "Jumat, 14 November 2025").
  - `renderSemuaRiwayat()`, `renderUtamaRiwayat()`, `renderTargetRiwayat()`: Fungsi untuk memfilter dan menampilkan data sesuai tab yang aktif.
