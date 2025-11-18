// ===============================
// UTILITIES & HELPERS
// ===============================
export class Utils {
  static formatRupiah(number) {
    if (isNaN(number) || number === null) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  }

  static getFormattedDate() {
    const today = new Date();
    const options = { weekday: "long", day: "numeric", month: "long" };
    return today.toLocaleDateString("id-ID", options);
  }

  static validateUsername(username) {
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
  }

  static validatePassword(password) {
    if (!password) return [false, "Password tidak boleh kosong."];
    if (password.length < 6) {
      return [false, "Password minimal 6 karakter."];
    }
    return [true, ""];
  }

  static parseNominal(value) {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  }

  // Helper Grouping Riwayat
  static getGroupDate(date) {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}
