import { Utils } from "./Utils.js";
import { StorageManager } from "./StorageManager.js";

// ===============================
// AUTH FUNCTIONS
// ===============================
export class AuthManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    document
      .getElementById("login-form")
      ?.addEventListener("submit", (e) => this.handleLogin(e));
    document
      .getElementById("register-form")
      ?.addEventListener("submit", (e) => this.handleRegister(e));
    document
      .getElementById("logout-btn")
      ?.addEventListener("click", () => this.handleLogout());
  }

  handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const db = StorageManager.getDb();
    const user = db.users[username.toLowerCase()];

    if (!user || user.password !== password) {
      this.app.ui.showToast("Username atau password salah.", "error");
      return;
    }

    StorageManager.setCurrentUserKey(username);
    this.app.state.currentUser = user;
    this.app.ui.showApp();
    e.target.reset();
  }

  handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm").value;

    document.getElementById("username-error").textContent = "";
    document.getElementById("password-error").textContent = "";
    document.getElementById("confirm-error").textContent = "";

    const [validUser, userMsg] = Utils.validateUsername(username);
    if (!validUser) {
      document.getElementById("username-error").textContent = userMsg;
      return;
    }

    const db = StorageManager.getDb();
    if (db.users[username.toLowerCase()]) {
      document.getElementById("username-error").textContent =
        "Username sudah terdaftar.";
      return;
    }

    const [validPw, pwMsg] = Utils.validatePassword(password);
    if (!validPw) {
      document.getElementById("password-error").textContent = pwMsg;
      return;
    }

    if (password !== confirmPassword) {
      document.getElementById("confirm-error").textContent =
        "Password tidak cocok.";
      return;
    }

    db.users[username.toLowerCase()] = {
      username: username,
      password: password,
      saldo_utama: 0,
      targets: {},
      riwayat: [],
      created_at: new Date().toISOString(),
    };
    StorageManager.saveDb(db);

    this.app.ui.showToast("✅ Registrasi berhasil! Silakan login.");
    this.app.ui.switchPage("login-page");
    e.target.reset();
  }

  handleLogout() {
    this.app.ui.showConfirmModal("Logout", "Yakin ingin logout?", () => {
      StorageManager.logoutUser();
      this.app.state.currentUser = null;
      this.app.ui.hideApp();
      this.app.ui.switchPage("login-page");
      document.getElementById("login-form").reset();
      document.getElementById("register-form").reset();
      this.app.ui.showToast("Logout berhasil.");
    });
  }
}
