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

    expect(new LocalStorageService().isEnabled()).to.be.false;
  });

  it('should determine localStorage not available on error', () => {
    global.localStorage = {
      setItem: () => null,
      removeItem: () => {
        throw new Error('Test');
      },
    };

    expect(new LocalStorageService().isEnabled()).to.be.false;
  });

  it('should determine localStorage is available if all success', () => {
    global.localStorage = {
      setItem: () => null,
      removeItem: () => null,
    };

    expect(new LocalStorageService().isEnabled()).to.be.true;
  });
});
