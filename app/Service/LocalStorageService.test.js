import test from 'ava';
import { LocalStorageService } from './LocalStorageService';

test('should determine localStorage not available on error', (t) => {
  global.localStorage = {
    setItem: () => {
      throw new Error('Test');
    },
  };

  t.is(new LocalStorageService().isEnabled(), false);
});

test('should determine localStorage not available on error', (t) => {
  global.localStorage = {
    setItem: () => null,
    removeItem: () => {
      throw new Error('Test');
    },
  };

  t.is(new LocalStorageService().isEnabled(), false);
});

test('should determine localStorage is available if all success', (t) => {
  global.localStorage = {
    setItem: () => null,
    removeItem: () => null,
  };

  t.is(new LocalStorageService().isEnabled(), true);
});

test('should use cached value for isEnabled', (t) => {
  let count = 0;
  global.localStorage = {
    setItem: () => (count += 1),
    removeItem: () => null,
  };

  const localStorageService = new LocalStorageService();

  t.is(localStorageService.isEnabled(), true);
  t.is(localStorageService.isEnabled(), true);
  t.is(count, 1);
});

test('should return asked key from global localStorage', (t) => {
  global.localStorage = {
    setItem: () => null,
    removeItem: () => null,
    getItem: () => 'Test',
  };

  t.is(new LocalStorageService().getItem('test'), 'Test');
});

test('should set key to global localStorage', (t) => {
  const localStorage = {};
  global.localStorage = {
    setItem: (key, value) => (localStorage[key] = value),
    removeItem: () => null,
    getItem: () => 'Test',
  };

  new LocalStorageService().setItem('test', 'value');
  t.is(localStorage.test, 'value');
});

test('should remove key to global localStorage', (t) => {
  const localStorage = {
    test: 'value',
    remain: 'value',
  };
  global.localStorage = {
    setItem: () => null,
    removeItem: key => delete localStorage[key],
    getItem: () => null,
  };

  new LocalStorageService().removeItem('test');
  t.deepEqual(localStorage, { remain: 'value' });
});

test('should return asked key from proxyfied localStorage', (t) => {
  global.localStorage = {
    setItem: () => {
      throw new Error('Test');
    },
  };

  const localStorage = new LocalStorageService();
  localStorage.storage = {
    test: 'Test',
  };

  t.is(localStorage.getItem('test'), 'Test');
});

test('should set key to proxyfied localStorage', (t) => {
  global.localStorage = {
    setItem: () => {
      throw new Error('Test');
    },
  };

  const localStorage = new LocalStorageService();

  localStorage.setItem('test', 'value');
  t.is(localStorage.storage.test, 'value');
});

test('should remove key to proxyfied localStorage', (t) => {
  global.localStorage = {
    setItem: () => {
      throw new Error('Test');
    },
  };

  const localStorage = new LocalStorageService();
  localStorage.storage = {
    test: 'value',
    remain: 'value',
  };

  localStorage.removeItem('test');
  t.deepEqual(localStorage.storage, { remain: 'value' });
});
