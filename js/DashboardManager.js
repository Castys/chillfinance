import { Utils } from "./Utils.js";

// ===============================
// DASHBOARD FUNCTIONS
// ===============================
export class DashboardManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    // Tidak ada listener khusus dashboard,
    // semua di-handle UIManager (quick actions, toggle balance)
  }

  updateDashboard() {
    if (!this.app.state.currentUser) return;
    this.updateBalance();
    this.updateAnalytics();
    this.renderDashboardTargets();
    this.app.targets.populateTargetSelects(); // Pastikan select di-update
  }

  updateBalance() {
    const balanceElement = document.getElementById("balance-display");
    const iconOpen = document.getElementById("icon-eye-open");
    const iconClosed = document.getElementById("icon-eye-closed");

    if (this.app.state.balanceVisible) {
      // Tampilkan Saldo & Ikon Mata Terbuka
      balanceElement.textContent = Utils.formatRupiah(
        this.app.state.currentUser.saldo_utama
      );
      iconOpen.classList.remove("hidden");
      iconClosed.classList.add("hidden");
    } else {
      // Sembunyikan Saldo & Tampilkan Ikon Mata Tertutup
      balanceElement.textContent = "••••••";
      iconOpen.classList.add("hidden");
      iconClosed.classList.remove("hidden");
    }
  }

  updateAnalytics() {
    const user = this.app.state.currentUser;
    let totalNabung = 0;
    let totalKeluar = 0;

    user.riwayat.forEach((tx) => {
      if (tx[1] === "nabung") totalNabung += tx[2];
      if (tx[1] === "keluar") totalKeluar += tx[2];
    });

    Object.values(user.targets).forEach((target) => {
      target.riwayat?.forEach((tx) => {
        if (tx[1] === "nabung") totalNabung += tx[2];
        if (tx[1] === "keluar") totalKeluar += tx[2];
      });
    });

    const rasio = totalNabung > 0 ? (totalKeluar / totalNabung) * 100 : 0;
    let status = "-";
    let statusEl = document.getElementById("status-keuangan");
    statusEl.className = "text-lg font-bold text-white";

    if (totalNabung > 0) {
      if (rasio < 30) {
        status = "Dompet Sehat 😎";
        statusEl.className = "text-lg font-bold text-green-400";
      } else if (rasio <= 60) {
        status = "Cukup Stabil 🙂";
        statusEl.className = "text-lg font-bold text-yellow-400";
      } else {
        status = "Agak Boros 😭";
        statusEl.className = "text-lg font-bold text-red-400";
      }
    }

    document.getElementById("total-nabung").textContent =
      Utils.formatRupiah(totalNabung);
    document.getElementById("total-keluar").textContent =
      Utils.formatRupiah(totalKeluar);
    document.getElementById("rasio-keluar").textContent =
      rasio.toFixed(1) + "%";
    statusEl.textContent = status;
  }

  renderDashboardTargets() {
    const container = document.getElementById("dashboard-targets");
    const targets = this.app.state.currentUser.targets;

    if (Object.keys(targets).length === 0) {
      container.innerHTML =
        '<p class="text-gray-400 text-center py-4">Belum ada target tabungan.</p>';
      return;
    }
    container.innerHTML = Object.entries(targets)
      .slice(0, 3)
      .map(([name, target]) =>
        this.app.targets.createTargetElement(name, target, false)
      ) // Panggil helper dari TargetManager
      .join("");
  }
}
