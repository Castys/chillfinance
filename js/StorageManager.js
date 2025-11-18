// ===============================
// STORAGE MANAGEMENT
// ===============================

const DB_KEY = "chillFinanceDb_v2";
const SESSION_KEY = "chillFinanceUser_v2";

export class StorageManager {
  static getDb() {
    const db = localStorage.getItem(DB_KEY);
    if (!db) {
      const emptyDb = {
        users: {}, // Database pengguna kosong
      };
      localStorage.setItem(DB_KEY, JSON.stringify(emptyDb));
      console.log("Database kosong baru dibuat.");
      return emptyDb;
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
