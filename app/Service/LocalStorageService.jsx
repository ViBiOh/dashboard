let storageEnabled;
const storage = {};

const LocalStorage = {
  isEnabled: () => {
    if (typeof storageEnabled === 'undefined') {
      try {
        localStorage.setItem('test', true);
        localStorage.removeItem('test');
      } catch (e) {
        storageEnabled = false;
      }
    }

    return storageEnabled;
  },
  getItem: key => (LocalStorage.isEnabled() ? localStorage.getItem(key) : storage[key]),
  setItem: (key, value) => {
    if (LocalStorage.isEnabled()) {
      localStorage.setItem(key, value);
    } else {
      storage[key] = value;
    }
  },
  removeItem: (key) => {
    if (LocalStorage.isEnabled()) {
      localStorage.removeItem(key);
    } else {
      delete storage[key];
    }
  },
};

export default LocalStorage;
