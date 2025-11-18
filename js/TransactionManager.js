import { Utils } from "./Utils.js";
import { StorageManager } from "./StorageManager.js";

// ===============================
// NABUNG & PENGELUARAN FUNCTIONS
// ===============================
export class TransactionManager {
  constructor(app) {
    this.app = app;
  }

  init() {
    // --- NABUNG ---
    document
      .getElementById("nabung-sumber")
      ?.addEventListener("change", (e) => {
        const targetGroup = document.getElementById("target-select-group");
        const targetSelect = document.getElementById("nabung-target");
        const isTarget = e.target.value === "target";

        targetGroup.classList.toggle("hidden", !isTarget);
        targetSelect.required = isTarget; // BUG FIX
      });

    document
      .getElementById("nabung-form")
      ?.addEventListener("submit", (e) => this.handleNabung(e));

    // --- PENGELUARAN (LOGIKA CANGGIH) ---
    document
      .getElementById("pengeluaran-sumber")
      ?.addEventListener("change", (e) =>
        this.handlePengeluaranSumberChange(e.target.value)
      );

    document
      .getElementById("pengeluaran-target")
      ?.addEventListener("change", (e) =>
        this.handlePengeluaranTargetChange(e.target.value)
      );

    document
      .getElementById("pengeluaran-form")
      ?.addEventListener("submit", (e) => this.handlePengeluaranSubmit(e));
  }

  // --- NABUNG ---

  handleNabung(e) {
    e.preventDefault();
    const sumber = document.getElementById("nabung-sumber").value;
    const jumlah = Utils.parseNominal(
      document.getElementById("nabung-jumlah").value
    );
    const catatan =
      document.getElementById("nabung-catatan").value.trim() || "-";
    const tgl = new Date().toISOString();
    const user = this.app.state.currentUser;

    if (sumber === "") {
      this.app.ui.showToast("Pilih sumber saldo dulu.", "error");
      return;
    }
    if (jumlah <= 0) {
      this.app.ui.showToast("Jumlah harus lebih dari 0", "error");
      return;
    }

    if (sumber === "utama") {
      user.saldo_utama += jumlah;
      user.riwayat.push([tgl, "nabung", jumlah, catatan]);
      this.app.ui.showToast(
        `✅ ${Utils.formatRupiah(jumlah)} ke Saldo Utama berhasil!`
      );
    } else {
      const targetName = document.getElementById("nabung-target").value;
      if (!targetName) {
        this.app.ui.showToast("❌ Pilih target terlebih dahulu.", "error");
        return;
      }

      const target = user.targets[targetName];
      if (target.status === "selesai") {
        this.app.ui.showToast(
          "❌ Target sudah selesai, tidak bisa menambah lagi.",
          "error"
        );
        return;
      }

      target.saldo += jumlah;
      target.riwayat.push([tgl, "nabung", jumlah, catatan]);

      if (target.saldo >= target.target) {
        target.saldo = target.target;
        target.status = "selesai";
        this.app.ui.showToast(`🎉 Target '${targetName}' telah tercapai!`);
      } else {
        this.app.ui.showToast(
          `✅ ${Utils.formatRupiah(jumlah)} ke target '${targetName}' berhasil!`
        );
      }
    }

    StorageManager.saveUserData(user);
    this.app.dashboard.updateDashboard();
    e.target.reset();
    document.getElementById("format-nabung").textContent = "";
    document.getElementById("catatan-count").textContent = "0/120";
    document.getElementById("target-select-group").classList.add("hidden");
    this.app.ui.switchNavPage("dashboard");
  }

  // --- PENGELUARAN ---

  handlePengeluaranSumberChange(sumber) {
    const targetGroup = document.getElementById("pengeluaran-target-group");
    const targetSelect = document.getElementById("pengeluaran-target");
    const jumlahWrapper = document.getElementById("pengeluaran-jumlah-wrapper");
    const infoEl = document.getElementById("pengeluaran-target-info");
    const submitButton = document.querySelector(
      "#pengeluaran-form button[type=submit]"
    );
    const isTarget = sumber === "target";

    targetGroup.classList.toggle("hidden", !isTarget);
    targetSelect.required = isTarget; // BUG FIX

    // --- PERUBAHAN 1 ---
    // Input jumlah sekarang selalu terlihat, tidak peduli sumbernya
    jumlahWrapper.classList.remove("hidden");
    document.getElementById("pengeluaran-jumlah").required = true;
    // --- SELESAI PERUBAHAN 1 ---

    if (sumber === "utama") {
      infoEl.classList.add("hidden");
      submitButton.disabled = false;
    } else if (isTarget) {
      const targetName = document.getElementById("pengeluaran-target").value;
      if (targetName) {
        this.updatePengeluaranTargetInfo(targetName);
      } else {
        infoEl.classList.add("hidden");
        submitButton.disabled = true;
      }
    } else {
      infoEl.classList.add("hidden");
      submitButton.disabled = false;
    }
  }

  handlePengeluaranTargetChange(targetName) {
    if (targetName) {
      this.updatePengeluaranTargetInfo(targetName);
    } else {
      document
        .getElementById("pengeluaran-target-info")
        .classList.add("hidden");
      document.querySelector(
        "#pengeluaran-form button[type=submit]"
      ).disabled = true;
    }
  }

  updatePengeluaranTargetInfo(targetName) {
    const infoEl = document.getElementById("pengeluaran-target-info");
    const infoJumlahEl = document.getElementById(
      "pengeluaran-target-info-jumlah"
    );
    const infoWarningEl = document.getElementById(
      "pengeluaran-target-info-warning"
    );
    const submitButton = document.querySelector(
      "#pengeluaran-form button[type=submit]"
    );
    const user = this.app.state.currentUser;
    const tdata = user.targets[targetName];

    if (!tdata) {
      infoEl.classList.add("hidden");
      submitButton.disabled = true;
      return;
    }

    infoEl.classList.remove("hidden");
    infoWarningEl.classList.add("hidden");
    submitButton.disabled = false;

    const now = new Date();
    let bisaTarik = true;
    if (tdata.last_withdraw) {
      const lastWd = new Date(tdata.last_withdraw);
      const diffTime = Math.abs(now - lastWd);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 365) {
        bisaTarik = false;
        const sisaHari = 365 - diffDays;
        const nextDate = new Date(lastWd.setDate(lastWd.getDate() + 365));
        infoWarningEl.textContent = `❌ Anda baru bisa menarik lagi dalam ${sisaHari} hari (setelah ${nextDate.toLocaleDateString(
          "id-ID"
        )}).`;
        infoWarningEl.classList.remove("hidden");
      }
    }

    // --- PERUBAHAN 2 ---
    // Logika ini tetap menghitung 30%, tapi...
    const max_tarik = Math.floor(tdata.saldo * 0.3);
    if (max_tarik <= 0) {
      bisaTarik = false;
      infoWarningEl.textContent = `❌ Saldo target tidak cukup untuk ditarik (Rp 0).`;
      infoWarningEl.classList.remove("hidden");
    }

    // ...teksnya diubah untuk memberitahu batas *maksimal*, bukan jumlah *pasti*
    infoJumlahEl.textContent = `Maks. penarikan: ${Utils.formatRupiah(
      max_tarik
    )} (30%)`;
    // --- SELESAI PERUBAHAN 2 ---

    submitButton.disabled = !bisaTarik;
  }

  handlePengeluaranSubmit(e) {
    e.preventDefault();
    const sumber = document.getElementById("pengeluaran-sumber").value;
    const catatan = document.getElementById("pengeluaran-catatan").value.trim();
    const tgl = new Date().toISOString();
    const user = this.app.state.currentUser;

    if (sumber === "") {
      this.app.ui.showToast("Pilih sumber saldo dulu.", "error");
      return;
    }
    if (!catatan) {
      this.app.ui.showToast("Catatan pengeluaran wajib diisi.", "error");
      return;
    }

    // --- PERUBAHAN 3.A ---
    // Ambil 'jumlah' di luar blok IF, karena sekarang dipakai di kedua kondisi
    const jumlah = Utils.parseNominal(
      document.getElementById("pengeluaran-jumlah").value
    );
    if (jumlah <= 0) {
      this.app.ui.showToast("Jumlah pengeluaran harus lebih dari 0", "error");
      return;
    }
    // --- SELESAI PERUBAHAN 3.A ---

    if (sumber === "utama") {
      // Validasi 'jumlah <= 0' sudah dilakukan di atas
      if (jumlah > user.saldo_utama) {
        this.app.ui.showToast("Saldo utama tidak cukup!", "error");
        return;
      }

      user.saldo_utama -= jumlah;
      user.riwayat.push([tgl, "keluar", jumlah, catatan]);
      this.app.ui.showToast(
        `✅ Pengeluaran ${Utils.formatRupiah(jumlah)} dicatat.`
      );
    } else {
      // sumber === 'target'
      const targetName = document.getElementById("pengeluaran-target").value;
      if (!targetName) {
        this.app.ui.showToast("❌ Pilih target terlebih dahulu.", "error");
        return;
      }

      const tdata = user.targets[targetName];
      const now = new Date();

      // (Validasi 1 tahun tetap ada)
      if (tdata.last_withdraw) {
        const diffDays = Math.ceil(
          (now - new Date(tdata.last_withdraw)) / (1000 * 60 * 60 * 24)
        );
        if (diffDays < 365) {
          this.app.ui.showToast(
            "Penarikan dari target ini belum 1 tahun.",
            "error"
          );
          return;
        }
      }

      // --- PERUBAHAN 3.B ---
      // Hitung batas 30%
      const max_tarik = Math.floor(tdata.saldo * 0.3);

      if (tdata.saldo <= 0 || max_tarik <= 0) {
        this.app.ui.showToast(
          "Saldo target tidak cukup untuk ditarik.",
          "error"
        );
        return;
      }

      // Validasi BARU: Cek jika jumlah input melebihi batas 30%
      if (jumlah > max_tarik) {
        this.app.ui.showToast(
          `❌ Penarikan (${Utils.formatRupiah(
            jumlah
          )}) melebihi batas 30% (${Utils.formatRupiah(max_tarik)}).`,
          "error"
        );
        return;
      }

      // Validasi BARU: Cek jika jumlah input melebihi total saldo target
      // (Meskipun sudah dicakup max_tarik, ini validasi keamanan ganda)
      if (jumlah > tdata.saldo) {
        this.app.ui.showToast(
          "Saldo target tidak cukup untuk penarikan ini.",
          "error"
        );
        return;
      }

      // Gunakan 'jumlah' (input pengguna) BUKAN 'max_tarik'
      tdata.saldo -= jumlah;
      tdata.last_withdraw = tgl;
      tdata.riwayat.push([tgl, "keluar", jumlah, catatan]);
      if (tdata.status === "selesai") tdata.status = "aktif"; // Status kembali aktif

      this.app.ui.showToast(
        `✅ Penarikan ${Utils.formatRupiah(
          jumlah // <-- Gunakan 'jumlah'
        )} dari '${targetName}' berhasil.`
      );
      // --- SELESAI PERUBAHAN 3.B ---
    }

    StorageManager.saveUserData(user);
    this.app.dashboard.updateDashboard();
    e.target.reset();
    document.getElementById("format-pengeluaran").textContent = "";
    document.getElementById("pengeluaran-catatan-count").textContent = "0/120";
    document.getElementById("pengeluaran-target-group").classList.add("hidden");

    // Pastikan wrapper jumlah tetap terlihat (meskipun sudah di-handle oleh handlePengeluaranSumberChange)
    document
      .getElementById("pengeluaran-jumlah-wrapper")
      .classList.remove("hidden");

    this.app.ui.switchNavPage("dashboard");
  }
}
