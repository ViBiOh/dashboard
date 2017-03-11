/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { push } from 'react-router-redux';
import actions from '../actions';
import { onErrorActions } from './';

describe('onErrorActions for Saga', () => {
  it('should not redirect on login', () => {
    expect(
      onErrorActions('logoutFailed', { toString: () => 'Mocha failed' }),
    ).to.deep.equal([
      actions.logoutFailed('Mocha failed'),
    ]);
  });

  it('should redirect to login if 401', () => {
    expect(
      onErrorActions('logoutFailed', { toString: () => 'Mocha failed', status: 401 }),
    ).to.deep.equal([
      push('/login'),
      actions.logoutFailed('Mocha failed'),
    ]);
  });
});
