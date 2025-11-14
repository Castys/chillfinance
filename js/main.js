import { App } from "./App.js";

// ===============================
// INITIALIZE APP
// ===============================

// Buat instance App
const app = new App();

// PENTING:
// Agar bisa diakses dari mana saja (termasuk untuk debugging)
// kita ekspos 'app' ke object 'window' global.
// Ini TIDAK WAJIB jika HTML Anda tidak punya inline 'onclick'
// TAPI INI POLA YANG BAIK untuk debugging.
// Kita akan tetap gunakan ini untuk konsistensi.
window.app = app;

// Jalankan inisialisasi aplikasi saat dokumen siap
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
