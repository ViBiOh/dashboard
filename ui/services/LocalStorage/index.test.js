import test from 'ava';
import { LocalStorage } from './';

test('should determine localStorage not available on error', (t) => {
  global.localStorage = {
    setItem: () => {
      throw new Error('Test');
    },
  };

  t.false(new LocalStorage().isEnabled());
});

test('should determine localStorage not available on error', (t) => {
  global.localStorage = {
    setItem: () => null,
    removeItem: () => {
      throw new Error('Test');
    },
  };

  t.false(new LocalStorage().isEnabled());
});

test('should determine localStorage is available if all success', (t) => {
  global.localStorage = {
    setItem: () => null,
    removeItem: () => null,
  };

  t.true(new LocalStorage().isEnabled());
});

test('should use cached value for isEnabled', (t) => {
  let count = 0;
  global.localStorage = {
    setItem: () => {
      count += 1;
      return undefined;
    },
    removeItem: () => null,
  };

  const localStorage = new LocalStorage();

  t.true(localStorage.isEnabled());
  t.true(localStorage.isEnabled());
  t.is(count, 1);
});

test('should return asked key from global localStorage', (t) => {
  global.localStorage = {
    setItem: () => null,
    removeItem: () => null,
    getItem: () => 'Test',
  };

  t.is(new LocalStorage().getItem('test'), 'Test');
});

test('should set key to global localStorage', (t) => {
  const localStorage = {};
  global.localStorage = {
    setItem: (key, value) => {
      localStorage[key] = value;
      return undefined;
    },
    removeItem: () => null,
    getItem: () => 'Test',
  };

  new LocalStorage().setItem('test', 'value');
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

  new LocalStorage().removeItem('test');
  t.deepEqual(localStorage, { remain: 'value' });
});

test('should return asked key from proxyfied localStorage', (t) => {
  global.localStorage = {
    setItem: () => {
      throw new Error('Test');
    },
  };

  const localStorage = new LocalStorage();
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

  const localStorage = new LocalStorage();

  localStorage.setItem('test', 'value');
  t.is(localStorage.storage.test, 'value');
});

test('should remove key to proxyfied localStorage', (t) => {
  global.localStorage = {
    setItem: () => {
      throw new Error('Test');
    },
  };

  const localStorage = new LocalStorage();
  localStorage.storage = {
    test: 'value',
    remain: 'value',
  };

  localStorage.removeItem('test');
  t.deepEqual(localStorage.storage, { remain: 'value' });
});
