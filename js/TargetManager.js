import { Utils } from "./Utils.js";
import { StorageManager } from "./StorageManager.js";

// ===============================
// TARGET FUNCTIONS
// ===============================
export class TargetManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    document
      .getElementById("add-target-form")
      ?.addEventListener("submit", (e) => this.handleAddTarget(e));
  }

  // Mengisi <select> di hal. Nabung, Pengeluaran, dan Riwayat
  populateTargetSelects() {
    const user = this.app.state.currentUser;
    if (!user) return;

    const activeTargets = Object.entries(user.targets)
      .filter(([_, t]) => t.status !== "selesai")
      .map(([name, _]) => name);

    const allTargetsWithSaldo = Object.entries(user.targets)
      .filter(([_, t]) => t.saldo > 0)
      .map(([name, _]) => name);

    const nabungSelect = document.getElementById("nabung-target");
    nabungSelect.innerHTML =
      '<option value="">Pilih target...</option>' +
      activeTargets
        .map((name) => `<option value="${name}">${name}</option>`)
        .join("");

    const pengeluaranSelect = document.getElementById("pengeluaran-target");
    pengeluaranSelect.innerHTML =
      '<option value="">Pilih target...</option>' +
      allTargetsWithSaldo
        .map((name) => `<option value="${name}">${name}</option>`)
        .join("");

    const riwayatSelect = document.getElementById("target-riwayat-selector");
    const allTargetNames = Object.keys(user.targets);
    riwayatSelect.innerHTML =
      allTargetNames.length === 0
        ? '<option value="">Belum ada target</option>'
        : allTargetNames
            .map((name) => `<option value="${name}">${name}</option>`)
            .join("");
  }

  handleAddTarget(e) {
    e.preventDefault();
    const name = document.getElementById("target-name").value.trim();
    const nominal = Utils.parseNominal(
      document.getElementById("target-nominal").value
    );
    const user = this.app.state.currentUser;

    if (!name) {
      this.app.ui.showToast("Nama target tidak boleh kosong.", "error");
      return;
    }
    if (nominal <= 0) {
      this.app.ui.showToast("Nominal target harus lebih dari 0.", "error");
      return;
    }
    if (
      Object.keys(user.targets).some(
        (n) => n.toLowerCase() === name.toLowerCase()
      )
    ) {
      this.app.ui.showToast(
        "❌ Target dengan nama tersebut sudah ada.",
        "error"
      );
      return;
    }

    user.targets[name] = {
      target: nominal,
      saldo: 0,
      status: "aktif",
      riwayat: [],
      last_withdraw: null,
    };

    StorageManager.saveUserData(user);
    this.app.ui.showToast(`✅ Target '${name}' berhasil dibuat!`);
    e.target.reset();
    document.getElementById("format-target").textContent = "";
    this.renderTargets();
    this.app.dashboard.updateDashboard();
  }

  renderTargets() {
    const container = document.getElementById("targets-list");
    if (!container) return;
    const user = this.app.state.currentUser;

    if (Object.keys(user.targets).length === 0) {
      container.innerHTML =
        '<p class="text-gray-400 text-center py-4">Belum ada target.</p>';
      return;
    }

    container.innerHTML = Object.entries(user.targets)
      .map(([name, target]) => this.createTargetElement(name, target, true)) // true = tampilkan tombol hapus
      .join("");

    // Tambahkan listener ke tombol hapus yang baru dibuat
    container.querySelectorAll(".btn-delete-target").forEach((button) => {
      button.addEventListener("click", (e) => {
        const targetName = e.currentTarget.dataset.targetName;
        this.deleteTarget(targetName);
      });
    });
  }

  // Helper untuk membuat elemen HTML target
  createTargetElement(name, target, showDeleteButton) {
    const percentage = Math.min(
      100,
      Math.round((target.saldo / target.target) * 100)
    );
    const isCompleted = target.saldo >= target.target;
    const statusClass = isCompleted ? "text-green-400" : "text-cyan-400";
    const barClass = isCompleted ? "bg-green-500" : "bg-cyan-500";

    const deleteButtonHTML = showDeleteButton
      ? `
          <button data-target-name="${name}" class="btn-delete-target flex-shrink-0 text-gray-500 hover:text-red-400 p-2 rounded-lg">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
      `
      : "";

    return `
          <div class="bg-gray-700 rounded-lg p-4 shadow flex items-center space-x-4">
              <div class="flex-grow">
                  <div class="flex justify-between items-start mb-2">
                      <div>
                          <p class="font-semibold text-white">${name}</p>
                          <p class="text-sm text-gray-400">${Utils.formatRupiah(
                            target.saldo
                          )} / ${Utils.formatRupiah(target.target)}</p>
                      </div>
                      <span class="text-sm font-bold ${statusClass}">${percentage}% ${
      isCompleted ? "🎉" : ""
    }</span>
                  </div>
                  <div class="w-full bg-gray-600 rounded-full h-2.5">
                      <div class="${barClass} h-2.5 rounded-full" style="width: ${percentage}%"></div>
                  </div>
              </div>
              ${deleteButtonHTML}
          </div>
      `;
  }

  // LOGIKA CANGGIH: Hapus Target (dengan Pindah Saldo)
  deleteTarget(targetName) {
    const user = this.app.state.currentUser;
    const tdata = user.targets[targetName];
    if (!tdata) return;
    const saldoTarget = tdata.saldo;

    if (saldoTarget > 0) {
      this.app.ui.showConfirmModal(
        "Pindahkan Saldo & Hapus Target?",
        `Target '${targetName}' memiliki saldo ${Utils.formatRupiah(
          saldoTarget
        )}. Saldo ini akan dipindahkan ke Saldo Utama sebelum target dihapus. Lanjutkan?`,
        () => {
          user.saldo_utama += saldoTarget;
          user.riwayat.push([
            new Date().toISOString(),
            "nabung",
            saldoTarget,
            `Transfer dari target: ${targetName}`,
          ]);
          delete user.targets[targetName];
          StorageManager.saveUserData(user);
          this.app.ui.showToast(
            `Saldo ${Utils.formatRupiah(
              saldoTarget
            )} dipindahkan & target dihapus.`
          );
          this.renderTargets();
          this.app.dashboard.updateDashboard();
        }
      );
    } else {
      this.app.ui.showConfirmModal(
        "Hapus Target",
        `Yakin hapus target '${targetName}'? Target ini tidak memiliki saldo.`,
        () => {
          delete user.targets[targetName];
          StorageManager.saveUserData(user);
          this.app.ui.showToast(`Target '${targetName}' dihapus.`);
          this.renderTargets();
          this.app.dashboard.updateDashboard();
        }
      );
    }
  }
}
