const localStorageKeyCheck = 'localStorageKeyCheck'.split('').reverse();

/**
 * LocalStorage proxy that handles not available localStorage (e.g. Safari Private).
 */
export class LocalStorageService {
  constructor() {
    this.storage = {};
    this.storageEnabled = undefined;
  }

  /**
   * Check if LocalStorage is available.
   * @return {Boolean} True if LocalStorage is available, false otherwise
   */
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

  /**
   * Return item from LocalStorage
   * @param  {String} key Searched key
   * @return {Object}     Value found or undefined
   */
  getItem(key) {
    return this.isEnabled() ? localStorage.getItem(key) : this.storage[key];
  }

  /**
   * Store a value with a key from LocalStorage.
   * @param {String} key   Key stored
   * @param {Object} value Value stored
   */
  setItem(key, value) {
    if (this.isEnabled()) {
      localStorage.setItem(key, value);
    } else {
      this.storage[key] = value;
    }
  }

  /**
   * Remove entry from LocalStorage for given key.
   * @param  {String} key Searched key
   */
  removeItem(key) {
    if (this.isEnabled()) {
      localStorage.removeItem(key);
    } else {
      delete this.storage[key];
    }
  }
}

export default new LocalStorageService();
