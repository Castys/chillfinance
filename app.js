// ===============================
// UTILITIES & HELPERS
// ===============================

const formatRupiah = (number) => {
  if (isNaN(number) || number === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

const getFormattedDate = () => {
  const today = new Date();
  const options = { weekday: "long", day: "numeric", month: "long" };
  return today.toLocaleDateString("id-ID", options);
};

const validateUsername = (username) => {
  if (!username) return [false, "Username tidak boleh kosong."];
  if (username.length < 3 || username.length > 32) {
    return [false, "Username harus 3–32 karakter."];
  }
  if (!/^[A-Za-z0-9_\-\s]+$/.test(username)) {
    return [
      false,
      "Username hanya boleh berisi huruf, angka, spasi, _ atau -.",
    ];
  }
  return [true, ""];
};

const validatePassword = (password) => {
  if (!password) return [false, "Password tidak boleh kosong."];
  if (password.length < 6) {
    return [false, "Password minimal 6 karakter."];
  }
  return [true, ""];
};

const parseNominal = (value) => {
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
};

// ===============================
// STORAGE MANAGEMENT (Struktur dari GitHub, Logic dari Gemini)
// ===============================

const DB_KEY = "chillFinanceDb_v2";
const SESSION_KEY = "chillFinanceUser_v2";

class StorageManager {
  static getDb() {
    const db = localStorage.getItem(DB_KEY);
    if (!db) {
      // Buat data demo jika DB kosong
      const demoDb = {
        users: {
          putra: {
            username: "Putra",
            password: "password123",
            saldo_utama: 1500000,
            targets: {
              "Laptop Baru": {
                target: 10000000,
                saldo: 2500000,
                status: "aktif",
                riwayat: [
                  [
                    new Date("2025-11-03T10:00:00").toISOString(),
                    "nabung",
                    2500000,
                    "Tabungan awal",
                  ],
                ],
                last_withdraw: null,
              },
              "Liburan Jepang": {
                target: 20000000,
                saldo: 500000,
                status: "aktif",
                riwayat: [
                  [
                    new Date("2025-11-08T14:30:00").toISOString(),
                    "nabung",
                    500000,
                    "Bonus",
                  ],
                ],
                last_withdraw: null,
              },
              "Dana Darurat": {
                target: 5000000,
                saldo: 5000000,
                status: "selesai",
                riwayat: [
                  [
                    new Date("2025-10-14T09:00:00").toISOString(),
                    "nabung",
                    5000000,
                    "Full",
                  ],
                ],
                last_withdraw: null,
              },
            },
            riwayat: [
              [
                new Date("2025-11-12T13:00:00").toISOString(),
                "nabung",
                2000000,
                "Gaji",
              ],
              [
                new Date("2025-11-13T10:15:00").toISOString(),
                "keluar",
                500000,
                "Bayar kos",
              ],
            ],
            created_at: new Date().toISOString(),
          },
        },
      };
      localStorage.setItem(DB_KEY, JSON.stringify(demoDb));
      console.log("Database demo untuk 'Putra' dibuat.");
      return demoDb;
    }
    return JSON.parse(db);
  }

  static saveDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  static getCurrentUserKey() {
    return sessionStorage.getItem(SESSION_KEY);
  }

  static setCurrentUserKey(username) {
    sessionStorage.setItem(SESSION_KEY, username.toLowerCase());
  }

  static getUserData() {
    const db = this.getDb();
    const userKey = this.getCurrentUserKey();
    if (!userKey || !db.users[userKey]) {
      return null;
    }
    return db.users[userKey];
  }

  static saveUserData(userData) {
    const db = this.getDb();
    const userKey = this.getCurrentUserKey();
    if (!userKey) return;

    db.users[userKey] = userData;
    this.saveDb(db);
  }

  static logoutUser() {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

// ===============================
// UI CONTROLS (Modal & Toast)
// ===============================

let toastTimeout;
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.remove("bg-green-500", "bg-red-500", "bg-yellow-500");

  if (type === "success") toast.classList.add("bg-green-500");
  else if (type === "error") toast.classList.add("bg-red-500");
  else if (type === "warning") toast.classList.add("bg-yellow-500");

  toast.classList.add("active");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("active"), 3000);
}

let confirmCallback = null;
function showConfirmModal(title, message, onConfirm) {
  document.getElementById("modal-confirm-title").textContent = title;
  document.getElementById("modal-confirm-message").textContent = message;
  confirmCallback = onConfirm;
  document.getElementById("modal-confirm")?.classList.add("active");
}

function hideConfirmModal() {
  document.getElementById("modal-confirm")?.classList.remove("active");
  confirmCallback = null;
}

document
  .getElementById("btn-confirm-cancel")
  ?.addEventListener("click", hideConfirmModal);
document.getElementById("btn-confirm-ok")?.addEventListener("click", () => {
  if (confirmCallback) confirmCallback();
  hideConfirmModal();
});

// ===============================
// STATE MANAGEMENT
// ===============================

let currentUser = StorageManager.getUserData();
let balanceVisible = true;

// ===============================
// PAGE NAVIGATION
// ===============================

function switchPage(pageId) {
  document.querySelectorAll(".auth-page").forEach((page) => {
    page.classList.remove("active");
  });
  document.getElementById(pageId)?.classList.add("active");
}

function switchNavPage(pageId) {
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

  // Update data saat pindah halaman
  if (pageId === "riwayat") renderRiwayat();
  if (pageId === "targets") renderTargets();
  if (pageId === "nabung") populateTargetSelects();
  if (pageId === "pengeluaran") populateTargetSelects();
}

// ===============================
// AUTH FUNCTIONS
// ===============================

document.getElementById("login-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const db = StorageManager.getDb();
  const user = db.users[username.toLowerCase()];

  if (!user || user.password !== password) {
    showToast("Username atau password salah.", "error");
    return;
  }

  StorageManager.setCurrentUserKey(username);
  currentUser = user;
  showApp();
  e.target.reset();
});

document.getElementById("register-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("register-confirm").value;

  document.getElementById("username-error").textContent = "";
  document.getElementById("password-error").textContent = "";
  document.getElementById("confirm-error").textContent = "";

  const [validUser, userMsg] = validateUsername(username);
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

  const [validPw, pwMsg] = validatePassword(password);
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

  showToast("✅ Registrasi berhasil! Silakan login.");
  switchPage("login-page");
  e.target.reset();
});

function logout() {
  showConfirmModal("Logout", "Yakin ingin logout?", () => {
    StorageManager.logoutUser();
    currentUser = null;
    hideApp();
    switchPage("login-page");
    document.getElementById("login-form").reset();
    document.getElementById("register-form").reset();
    showToast("Logout berhasil.");
  });
}
document.getElementById("logout-btn")?.addEventListener("click", logout);

document
  .getElementById("btn-show-register")
  ?.addEventListener("click", () => switchPage("register-page"));
document
  .getElementById("btn-show-login")
  ?.addEventListener("click", () => switchPage("login-page"));

// ===============================
// APP DISPLAY FUNCTIONS
// ===============================

function showApp() {
  document.getElementById("auth-container").classList.add("hidden");
  document.getElementById("main-app").classList.remove("hidden");
  updateDashboard();
  setDateDisplay();
  updateUsername();
}

function hideApp() {
  document.getElementById("auth-container").classList.remove("hidden");
  document.getElementById("main-app").classList.add("hidden");
}

function setDateDisplay() {
  document.getElementById("date-display").textContent = getFormattedDate();
}

function updateUsername() {
  if (currentUser) {
    document.getElementById(
      "username-display"
    ).textContent = `Hi, ${currentUser.username}! 👋`;
  }
}

document.getElementById("btn-toggle-balance")?.addEventListener("click", () => {
  balanceVisible = !balanceVisible;
  updateBalance();
});

document
  .getElementById("btn-quick-nabung")
  ?.addEventListener("click", () => switchNavPage("nabung"));
document
  .getElementById("btn-quick-keluar")
  ?.addEventListener("click", () => switchNavPage("pengeluaran"));
document
  .getElementById("btn-dash-lihat-semua")
  ?.addEventListener("click", () => switchNavPage("targets"));

// ===============================
// DASHBOARD FUNCTIONS
// ===============================

function updateDashboard() {
  if (!currentUser) return;
  updateBalance();
  updateAnalytics();
  renderDashboardTargets();
  populateTargetSelects();
}

function updateBalance() {
  const balanceElement = document.getElementById("balance-display");
  if (balanceVisible) {
    balanceElement.textContent = formatRupiah(currentUser.saldo_utama);
  } else {
    balanceElement.textContent = "••••••";
  }
}

function updateAnalytics() {
  let totalNabung = 0;
  let totalKeluar = 0;

  currentUser.riwayat.forEach((tx) => {
    if (tx[1] === "nabung") totalNabung += tx[2];
    if (tx[1] === "keluar") totalKeluar += tx[2];
  });

  Object.values(currentUser.targets).forEach((target) => {
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
    formatRupiah(totalNabung);
  document.getElementById("total-keluar").textContent =
    formatRupiah(totalKeluar);
  document.getElementById("rasio-keluar").textContent = rasio.toFixed(1) + "%";
  statusEl.textContent = status;
}

function renderDashboardTargets() {
  const container = document.getElementById("dashboard-targets");
  const targets = currentUser.targets;

  if (Object.keys(targets).length === 0) {
    container.innerHTML =
      '<p class="text-gray-400 text-center py-4">Belum ada target tabungan.</p>';
    return;
  }
  container.innerHTML = Object.entries(targets)
    .slice(0, 3)
    .map(([name, target]) => createTargetElement(name, target, false)) // false = jangan tampilkan tombol hapus
    .join("");
}

// ===============================
// TARGET FUNCTIONS
// ===============================

function populateTargetSelects() {
  const activeTargets = Object.entries(currentUser.targets)
    .filter(([_, t]) => t.status !== "selesai")
    .map(([name, _]) => name);

  const allTargetsWithSaldo = Object.entries(currentUser.targets)
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
  const allTargetNames = Object.keys(currentUser.targets);
  riwayatSelect.innerHTML =
    allTargetNames.length === 0
      ? '<option value="">Belum ada target</option>'
      : allTargetNames
          .map((name) => `<option value="${name}">${name}</option>`)
          .join("");
}

document.getElementById("add-target-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("target-name").value.trim();
  const nominal = parseNominal(document.getElementById("target-nominal").value);

  if (!name) {
    showToast("Nama target tidak boleh kosong.", "error");
    return;
  }
  if (nominal <= 0) {
    showToast("Nominal target harus lebih dari 0.", "error");
    return;
  }
  if (
    Object.keys(currentUser.targets).some(
      (n) => n.toLowerCase() === name.toLowerCase()
    )
  ) {
    showToast("❌ Target dengan nama tersebut sudah ada.", "error");
    return;
  }

  currentUser.targets[name] = {
    target: nominal,
    saldo: 0,
    status: "aktif",
    riwayat: [],
    last_withdraw: null,
  };

  StorageManager.saveUserData(currentUser);
  showToast(`✅ Target '${name}' berhasil dibuat!`);
  e.target.reset();
  document.getElementById("format-target").textContent = "";
  renderTargets();
  updateDashboard();
});

function renderTargets() {
  const container = document.getElementById("targets-list");
  if (!container) return;

  if (Object.keys(currentUser.targets).length === 0) {
    container.innerHTML =
      '<p class="text-gray-400 text-center py-4">Belum ada target.</p>';
    return;
  }

  container.innerHTML = Object.entries(currentUser.targets)
    .map(([name, target]) => createTargetElement(name, target, true)) // true = tampilkan tombol hapus
    .join("");

  container.querySelectorAll(".btn-delete-target").forEach((button) => {
    button.addEventListener("click", (e) => {
      const targetName = e.currentTarget.dataset.targetName;
      deleteTarget(targetName);
    });
  });
}

function createTargetElement(name, target, showDeleteButton) {
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
                        <p class="text-sm text-gray-400">${formatRupiah(
                          target.saldo
                        )} / ${formatRupiah(target.target)}</p>
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

// Logic "Pindah Saldo" (dari Gemini)
function deleteTarget(targetName) {
  const tdata = currentUser.targets[targetName];
  if (!tdata) return;
  const saldoTarget = tdata.saldo;

  if (saldoTarget > 0) {
    showConfirmModal(
      "Pindahkan Saldo & Hapus Target?",
      `Target '${targetName}' memiliki saldo ${formatRupiah(
        saldoTarget
      )}. Saldo ini akan dipindahkan ke Saldo Utama sebelum target dihapus. Lanjutkan?`,
      () => {
        currentUser.saldo_utama += saldoTarget;
        currentUser.riwayat.push([
          new Date().toISOString(),
          "nabung",
          saldoTarget,
          `Transfer dari target: ${targetName}`,
        ]);
        delete currentUser.targets[targetName];
        StorageManager.saveUserData(currentUser);
        showToast(
          `Saldo ${formatRupiah(saldoTarget)} dipindahkan & target dihapus.`
        );
        renderTargets();
        updateDashboard();
      }
    );
  } else {
    showConfirmModal(
      "Hapus Target",
      `Yakin hapus target '${targetName}'? Target ini tidak memiliki saldo.`,
      () => {
        delete currentUser.targets[targetName];
        StorageManager.saveUserData(currentUser);
        showToast(`Target '${targetName}' dihapus.`);
        renderTargets();
        updateDashboard();
      }
    );
  }
}

// ===============================
// NABUNG FUNCTIONS
// ===============================

document.getElementById("nabung-sumber")?.addEventListener("change", (e) => {
  const targetGroup = document.getElementById("target-select-group");
  const targetSelect = document.getElementById("nabung-target");
  const isTarget = e.target.value === "target";

  targetGroup.classList.toggle("hidden", !isTarget);
  targetSelect.required = isTarget; // BUG FIX
});

document.getElementById("nabung-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const sumber = document.getElementById("nabung-sumber").value;
  const jumlah = parseNominal(document.getElementById("nabung-jumlah").value);
  const catatan = document.getElementById("nabung-catatan").value.trim() || "-";
  const tgl = new Date().toISOString();

  if (sumber === "") {
    showToast("Pilih sumber saldo dulu.", "error");
    return;
  }
  if (jumlah <= 0) {
    showToast("Jumlah harus lebih dari 0", "error");
    return;
  }

  if (sumber === "utama") {
    currentUser.saldo_utama += jumlah;
    currentUser.riwayat.push([tgl, "nabung", jumlah, catatan]);
    showToast(`✅ ${formatRupiah(jumlah)} ke Saldo Utama berhasil!`);
  } else {
    const targetName = document.getElementById("nabung-target").value;
    if (!targetName) {
      showToast("❌ Pilih target terlebih dahulu.", "error");
      return;
    }

    const target = currentUser.targets[targetName];
    if (target.status === "selesai") {
      showToast("❌ Target sudah selesai, tidak bisa menambah lagi.", "error");
      return;
    }

    target.saldo += jumlah;
    target.riwayat.push([tgl, "nabung", jumlah, catatan]);

    if (target.saldo >= target.target) {
      target.saldo = target.target;
      target.status = "selesai";
      showToast(`🎉 Target '${targetName}' telah tercapai!`);
    } else {
      showToast(
        `✅ ${formatRupiah(jumlah)} ke target '${targetName}' berhasil!`
      );
    }
  }

  StorageManager.saveUserData(currentUser);
  updateDashboard();
  e.target.reset();
  document.getElementById("format-nabung").textContent = "";
  document.getElementById("catatan-count").textContent = "0/120";
  document.getElementById("target-select-group").classList.add("hidden");
  switchNavPage("dashboard");
});

// ===============================
// PENGELUARAN FUNCTIONS (Logika Canggih dari Gemini)
// ===============================

document
  .getElementById("pengeluaran-sumber")
  ?.addEventListener("change", (e) => {
    const targetGroup = document.getElementById("pengeluaran-target-group");
    const targetSelect = document.getElementById("pengeluaran-target");
    const jumlahWrapper = document.getElementById("pengeluaran-jumlah-wrapper");
    const infoEl = document.getElementById("pengeluaran-target-info");
    const submitButton = document.querySelector(
      "#pengeluaran-form button[type=submit]"
    );
    const sumber = e.target.value;
    const isTarget = sumber === "target";

    targetGroup.classList.toggle("hidden", !isTarget);
    targetSelect.required = isTarget; // BUG FIX

    jumlahWrapper.classList.toggle("hidden", isTarget);
    document.getElementById("pengeluaran-jumlah").required = sumber === "utama";

    if (sumber === "utama") {
      infoEl.classList.add("hidden");
      submitButton.disabled = false;
    } else if (isTarget) {
      const targetName = document.getElementById("pengeluaran-target").value;
      if (targetName) {
        updatePengeluaranTargetInfo(targetName);
      } else {
        infoEl.classList.add("hidden");
        submitButton.disabled = true;
      }
    } else {
      infoEl.classList.add("hidden");
      submitButton.disabled = false;
    }
  });

document
  .getElementById("pengeluaran-target")
  ?.addEventListener("change", (e) => {
    const targetName = e.target.value;
    if (targetName) {
      updatePengeluaranTargetInfo(targetName);
    } else {
      document
        .getElementById("pengeluaran-target-info")
        .classList.add("hidden");
      document.querySelector(
        "#pengeluaran-form button[type=submit]"
      ).disabled = true;
    }
  });

function updatePengeluaranTargetInfo(targetName) {
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

  const tdata = currentUser.targets[targetName];
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

  const max_tarik = Math.floor(tdata.saldo * 0.3);
  if (max_tarik <= 0) {
    bisaTarik = false;
    infoWarningEl.textContent = `❌ Saldo target tidak cukup untuk ditarik (Rp 0).`;
    infoWarningEl.classList.remove("hidden");
  }

  infoJumlahEl.textContent = `Akan ditarik: ${formatRupiah(max_tarik)} (30%)`;
  submitButton.disabled = !bisaTarik;
}

document.getElementById("pengeluaran-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const sumber = document.getElementById("pengeluaran-sumber").value;
  const catatan = document.getElementById("pengeluaran-catatan").value.trim();
  const tgl = new Date().toISOString();

  if (sumber === "") {
    showToast("Pilih sumber saldo dulu.", "error");
    return;
  }
  if (!catatan) {
    showToast("Catatan pengeluaran wajib diisi.", "error");
    return;
  }

  if (sumber === "utama") {
    const jumlah = parseNominal(
      document.getElementById("pengeluaran-jumlah").value
    );
    if (jumlah <= 0) {
      showToast("Jumlah pengeluaran harus lebih dari 0", "error");
      return;
    }
    if (jumlah > currentUser.saldo_utama) {
      showToast("Saldo utama tidak cukup!", "error");
      return;
    }

    currentUser.saldo_utama -= jumlah;
    currentUser.riwayat.push([tgl, "keluar", jumlah, catatan]);
    showToast(`✅ Pengeluaran ${formatRupiah(jumlah)} dicatat.`);
  } else {
    const targetName = document.getElementById("pengeluaran-target").value;
    if (!targetName) {
      showToast("❌ Pilih target terlebih dahulu.", "error");
      return;
    }

    const tdata = currentUser.targets[targetName];
    const now = new Date();
    if (tdata.last_withdraw) {
      const diffDays = Math.ceil(
        (now - new Date(tdata.last_withdraw)) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 365) {
        showToast("Penarikan dari target ini belum 1 tahun.", "error");
        return;
      }
    }
    const max_tarik = Math.floor(tdata.saldo * 0.3);
    if (max_tarik <= 0) {
      showToast("Saldo target tidak cukup untuk ditarik.", "error");
      return;
    }

    tdata.saldo -= max_tarik;
    tdata.last_withdraw = tgl;
    tdata.riwayat.push([tgl, "keluar", max_tarik, catatan]);
    if (tdata.status === "selesai") tdata.status = "aktif";

    showToast(
      `✅ Penarikan 30% (${formatRupiah(
        max_tarik
      )}) dari '${targetName}' berhasil.`
    );
  }

  StorageManager.saveUserData(currentUser);
  updateDashboard();
  e.target.reset();
  document.getElementById("format-pengeluaran").textContent = "";
  document.getElementById("pengeluaran-catatan-count").textContent = "0/120";
  document.getElementById("pengeluaran-target-group").classList.add("hidden");
  document
    .getElementById("pengeluaran-jumlah-wrapper")
    .classList.remove("hidden");
  switchNavPage("dashboard");
});

// ===============================
// RIWAYAT FUNCTIONS (Logika Grouping dari Gemini V2)
// ===============================

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    const tabId = btn.getAttribute("data-tab");
    document.getElementById(tabId).classList.add("active");

    if (tabId === "target-history") {
      renderTargetRiwayat();
    } else if (tabId === "utama-history") {
      renderUtamaRiwayat();
    } else if (tabId === "semua-history") {
      renderSemuaRiwayat();
    }
  });
});

function renderRiwayat() {
  populateTargetSelects();

  const tabSemua = document.querySelector(".tab-btn[data-tab='semua-history']");
  const tabUtama = document.querySelector(".tab-btn[data-tab='utama-history']");
  const tabTarget = document.querySelector(
    ".tab-btn[data-tab='target-history']"
  );
  const contentSemua = document.getElementById("semua-history");
  const contentUtama = document.getElementById("utama-history");
  const contentTarget = document.getElementById("target-history");

  if (tabSemua) tabSemua.classList.add("active");
  if (contentSemua) contentSemua.classList.add("active");
  if (tabUtama) tabUtama.classList.remove("active");
  if (contentUtama) contentUtama.classList.remove("active");
  if (tabTarget) tabTarget.classList.remove("active");
  if (contentTarget) contentTarget.classList.remove("active");

  renderSemuaRiwayat();
}

// UI Item Riwayat (dari Gemini V2)
function createRiwayatElement([tanggal, tipe, jumlah, catatan]) {
  const isNabung = tipe === "nabung";
  const tgl = new Date(tanggal);
  const tglFormatted = tgl
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(".", ":");
  const subText = `${isNabung ? "Nabung" : "Keluar"} - ${tglFormatted}`;

  const iconBg = isNabung ? "bg-green-600" : "bg-red-600";
  const icon = isNabung ? "➕" : "➖";
  const amountClass = isNabung ? "text-green-400" : "text-red-400";
  const amountSign = isNabung ? "+" : "-";

  return `
        <div class="bg-gray-700 rounded-lg p-4 flex items-center space-x-4">
            <div class="flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center">
                <span class="text-white font-bold text-lg">${icon}</span>
            </div>
            <div class="flex-grow overflow-hidden mr-2">
                <p class="font-medium text-white truncate">${catatan}</p>
                <p class="text-sm text-gray-400">${subText}</p>
            </div>
            <p class="font-semibold text-lg ${amountClass} whitespace-nowrap">
                ${amountSign}${formatRupiah(jumlah)}
            </p>
        </div>
    `;
}

// Helper Grouping (dari Gemini V2)
function getGroupDate(date) {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Helper Render (dari Gemini V2)
function renderGroupedHistory(containerId, transactions) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML =
      '<p class="text-gray-400 text-center py-4">Belum ada riwayat transaksi.</p>';
    return;
  }

  const grouped = transactions.reduce((acc, tx) => {
    const dateKey = getGroupDate(tx[0]);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(tx);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(grouped).sort((a, b) => {
    const dateA = new Date(grouped[a][0][0]);
    const dateB = new Date(grouped[b][0][0]);
    return dateB - dateA;
  });

  let html = "";
  for (const dateKey of sortedDateKeys) {
    html += `<div class="mb-5">`;
    html += `<h4 class="text-sm font-semibold text-gray-300 mb-3 ml-1">${dateKey}</h4>`;
    html += `<div class="space-y-3">`;

    const sortedTxs = grouped[dateKey].sort(
      (a, b) => new Date(b[0]) - new Date(a[0])
    );

    html += sortedTxs.map(createRiwayatElement).join("");
    html += `</div></div>`;
  }

  container.innerHTML = html;
}

// Fungsi Render 'Semua' (dari Gemini V2)
function renderSemuaRiwayat() {
  let allTransactions = [...currentUser.riwayat];

  Object.keys(currentUser.targets).forEach((targetName) => {
    const target = currentUser.targets[targetName];
    const targetTxs = target.riwayat.map((tx) => {
      let [tanggal, tipe, jumlah, catatan] = tx;
      if (catatan.startsWith("Transfer dari target:")) {
        // Jangan duplikat, sudah ada di riwayat utama
      } else if (tipe === "nabung") {
        catatan = `${catatan} (Target: ${targetName})`;
      } else {
        // keluar
        catatan = `${catatan} (Target: ${targetName})`;
      }
      return [tanggal, tipe, jumlah, catatan];
    });
    // Filter Sisa
    const filteredTxs = targetTxs.filter(
      (tx) => !tx[3].startsWith("Transfer dari target:")
    );
    allTransactions.push(...filteredTxs);
  });

  allTransactions.sort((a, b) => new Date(b[0]) - new Date(a[0]));

  renderGroupedHistory("semua-riwayat", allTransactions);
}

// Fungsi Render 'Utama' (dari Gemini V2)
function renderUtamaRiwayat() {
  renderGroupedHistory("utama-riwayat", currentUser.riwayat);
}

// Fungsi Render 'Target' (dari Gemini V2)
function renderTargetRiwayat() {
  populateTargetSelects();
  const select = document.getElementById("target-riwayat-selector");
  if (select.options.length > 0 && select.options[0].value) {
    showTargetRiwayat(select.value);
  } else {
    document.getElementById("target-riwayat").innerHTML =
      '<p class="text-gray-400 text-center py-4">Belum ada target.</p>';
  }
}

document
  .getElementById("target-riwayat-selector")
  ?.addEventListener("change", (e) => {
    showTargetRiwayat(e.target.value);
  });

function showTargetRiwayat(targetName) {
  const target = currentUser.targets[targetName];
  const transactions = target && target.riwayat ? target.riwayat : [];
  const filteredTxs = transactions.filter(
    (tx) => !tx[3].startsWith("Transfer dari target:")
  );
  renderGroupedHistory("target-riwayat", filteredTxs);
}

// ===============================
// NAV BUTTON EVENT LISTENERS
// ===============================

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pageId = btn.getAttribute("data-page");
    switchNavPage(pageId);
  });
});

// ========================
//  HELPER INPUT NOMINAL
// ========================
function addNominalPreview(inputId, previewId) {
  document.getElementById(inputId)?.addEventListener("input", (e) => {
    const value = parseNominal(e.target.value);
    document.getElementById(previewId).textContent =
      value > 0 ? formatRupiah(value) : "";
  });
}
addNominalPreview("nabung-jumlah", "format-nabung");
addNominalPreview("pengeluaran-jumlah", "format-pengeluaran");
addNominalPreview("target-nominal", "format-target");

function addCharCounter(inputId, counterId, maxLength) {
  document.getElementById(inputId)?.addEventListener("input", (e) => {
    const count = e.target.value.length;
    document.getElementById(counterId).textContent = `${count}/${maxLength}`;
  });
}
addCharCounter("nabung-catatan", "catatan-count", 120);
addCharCounter("pengeluaran-catatan", "pengeluaran-catatan-count", 120);

// ===============================
// INITIALIZE APP
// ===============================

function initApp() {
  StorageManager.getDb(); // Panggil sekali untuk memastikan data demo ada jika DB kosong
  currentUser = StorageManager.getUserData();

  if (currentUser) {
    showApp();
    switchNavPage("dashboard");
  } else {
    hideApp();
    switchPage("login-page");
  }
}

document.addEventListener("DOMContentLoaded", initApp);
