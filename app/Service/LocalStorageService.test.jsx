/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { LocalStorageService } from './LocalStorageService';

describe('LocalStorageService', () => {
  it('should determine localStorage not available on error', () => {
    global.localStorage = {
      setItem: () => {
        throw new Error('Test');
      },
    };

    expect(new LocalStorageService().isEnabled()).to.equal(false);
  });

  it('should determine localStorage not available on error', () => {
    global.localStorage = {
      setItem: () => null,
      removeItem: () => {
        throw new Error('Test');
      },
    };

    expect(new LocalStorageService().isEnabled()).to.equal(false);
  });

  it('should determine localStorage is available if all success', () => {
    global.localStorage = {
      setItem: () => null,
      removeItem: () => null,
    };

    expect(new LocalStorageService().isEnabled()).to.equal(true);
  });

  it('should use cached value for isEnabled', () => {
    let count = 0;
    global.localStorage = {
      setItem: () => (count += 1),
      removeItem: () => null,
    };

    const localStorageService = new LocalStorageService();

    expect(localStorageService.isEnabled()).to.equal(true);
    expect(localStorageService.isEnabled()).to.equal(true);
    expect(count).to.be.eql(1);
  });

  it('should return asked key from global localStorage', () => {
    global.localStorage = {
      setItem: () => null,
      removeItem: () => null,
      getItem: () => 'Test',
    };

    expect(new LocalStorageService().getItem('test')).to.be.eql('Test');
  });

  it('should set key to global localStorage', () => {
    const localStorage = {};
    global.localStorage = {
      setItem: (key, value) => (localStorage[key] = value),
      removeItem: () => null,
      getItem: () => 'Test',
    };

    new LocalStorageService().setItem('test', 'value');
    expect(localStorage.test).to.be.eql('value');
  });

  it('should set key to global localStorage', () => {
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
    expect(localStorage).to.be.eql({ remain: 'value' });
  });

  it('should return asked key from proxyfied localStorage', () => {
    global.localStorage = {
      setItem: () => {
        throw new Error('Test');
      },
    };

    const localStorage = new LocalStorageService();
    localStorage.storage = {
      test: 'Test',
    };

    expect(localStorage.getItem('test')).to.be.eql('Test');
  });

  it('should set key to proxyfied localStorage', () => {
    global.localStorage = {
      setItem: () => {
        throw new Error('Test');
      },
    };

    const localStorage = new LocalStorageService();

    localStorage.setItem('test', 'value');
    expect(localStorage.storage.test).to.be.eql('value');
  });

  it('should remove key to proxyfied localStorage', () => {
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
    expect(localStorage.storage).to.be.eql({ remain: 'value' });
  });
});
