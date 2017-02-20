const localStorageKeyCheck = 'localStorageKeyCheck'.split('').reverse();

export class LocalStorageService {
  constructor() {
    this.storage = {};
    this.storageEnabled = undefined;
  }

  isEnabled() {
    if (typeof this.storageEnabled === 'undefined') {
      try {
        localStorage.setItem(localStorageKeyCheck, true);
        localStorage.removeItem(localStorageKeyCheck);
        this.storageEnabled = true;
      } catch (e) {
        this.storageEnabled = false;
      }
    }

    return this.storageEnabled;
  }

  getItem(key) {
    return this.isEnabled() ? localStorage.getItem(key) : this.storage[key];
  }

  setItem(key, value) {
    if (this.isEnabled()) {
      localStorage.setItem(key, value);
    } else {
      this.storage[key] = value;
    }
  }

  removeItem(key) {
    if (this.isEnabled()) {
      localStorage.removeItem(key);
    } else {
      delete this.storage[key];
    }
  }
}

export default new LocalStorageService();
