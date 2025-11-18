import { Utils } from "./Utils.js";

// ===============================
// UI CONTROLS (Modal, Toast, Nav)
// ===============================
export class UIManager {
  constructor(app) {
    this.app = app;
    this.toastTimeout = null;
    this.confirmCallback = null;
  }

  init() {
    // Navigasi Halaman Utama
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pageId = btn.getAttribute("data-page");
        this.switchNavPage(pageId);
      });
    });

    // Navigasi Auth
    document
      .getElementById("btn-show-register")
      ?.addEventListener("click", () => this.switchPage("register-page"));
    document
      .getElementById("btn-show-login")
      ?.addEventListener("click", () => this.switchPage("login-page"));

    // Tombol Modal
    document
      .getElementById("btn-confirm-cancel")
      ?.addEventListener("click", () => this.hideConfirmModal());
    document.getElementById("btn-confirm-ok")?.addEventListener("click", () => {
      if (this.confirmCallback) this.confirmCallback();
      this.hideConfirmModal();
    });

    // Quick Actions Dashboard
    document
      .getElementById("btn-quick-nabung")
      ?.addEventListener("click", () => this.switchNavPage("nabung"));
    document
      .getElementById("btn-quick-keluar")
      ?.addEventListener("click", () => this.switchNavPage("pengeluaran"));
    document
      .getElementById("btn-dash-lihat-semua")
      ?.addEventListener("click", () => this.switchNavPage("targets"));

    // Balance Toggle
    document
      .getElementById("btn-toggle-balance")
      ?.addEventListener("click", () => {
        this.app.state.balanceVisible = !this.app.state.balanceVisible;
        this.app.dashboard.updateBalance();
      });

    // Pasang Helper Input
    this.addNominalPreview("nabung-jumlah", "format-nabung");
    this.addNominalPreview("pengeluaran-jumlah", "format-pengeluaran");
    this.addNominalPreview("target-nominal", "format-target");

    this.addCharCounter("nabung-catatan", "catatan-count", 120);
    this.addCharCounter(
      "pengeluaran-catatan",
      "pengeluaran-catatan-count",
      120
    );
  }

  showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.remove("bg-green-500", "bg-red-500", "bg-yellow-500");

    if (type === "success") toast.classList.add("bg-green-500");
    else if (type === "error") toast.classList.add("bg-red-500");
    else if (type === "warning") toast.classList.add("bg-yellow-500");

    toast.classList.add("active");
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(
      () => toast.classList.remove("active"),
      3000
    );
  }

  showConfirmModal(title, message, onConfirm) {
    document.getElementById("modal-confirm-title").textContent = title;
    document.getElementById("modal-confirm-message").textContent = message;
    this.confirmCallback = onConfirm;
    document.getElementById("modal-confirm")?.classList.add("active");
  }

  hideConfirmModal() {
    document.getElementById("modal-confirm")?.classList.remove("active");
    this.confirmCallback = null;
  }

  switchPage(pageId) {
    document.querySelectorAll(".auth-page").forEach((page) => {
      page.classList.remove("active");
    });
    document.getElementById(pageId)?.classList.add("active");
  }

  switchNavPage(pageId) {
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
    });
    document.getElementById(pageId)?.classList.add("active");

    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`.nav-btn[data-page="${pageId}"]`)
      ?.classList.add("active");

    // Panggil render/update manager terkait
    if (pageId === "riwayat") this.app.history.renderRiwayat();
    if (pageId === "targets") this.app.targets.showTargetList(); // PERUBAHAN DI SINI
    if (pageId === "nabung") this.app.targets.populateTargetSelects();
    if (pageId === "pengeluaran") this.app.targets.populateTargetSelects();
  }

  showApp() {
    document.getElementById("auth-container").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    this.app.dashboard.updateDashboard();
    this.setDateDisplay();
    this.updateUsername();
  }

  hideApp() {
    document.getElementById("auth-container").classList.remove("hidden");
    document.getElementById("main-app").classList.add("hidden");
  }

  setDateDisplay() {
    document.getElementById("date-display").textContent =
      Utils.getFormattedDate();
  }

  updateUsername() {
    if (this.app.state.currentUser) {
      document.getElementById(
        "username-display"
      ).textContent = `Hi, ${this.app.state.currentUser.username}! 👋`;
    }
  }

  // ========================
  //  HELPER INPUT
  // ========================
  addNominalPreview(inputId, previewId) {
    document.getElementById(inputId)?.addEventListener("input", (e) => {
      const value = Utils.parseNominal(e.target.value);
      document.getElementById(previewId).textContent =
        value > 0 ? Utils.formatRupiah(value) : "";
    });
  }

  addCharCounter(inputId, counterId, maxLength) {
    document.getElementById(inputId)?.addEventListener("input", (e) => {
      const count = e.target.value.length;
      document.getElementById(counterId).textContent = `${count}/${maxLength}`;
    });
  }
}
