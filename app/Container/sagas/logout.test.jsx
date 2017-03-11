/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { logoutSaga } from './';

describe('Logout Saga', () => {
  it('should call DockerService.logout', () => {
    const iterator = logoutSaga();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      call(DockerService.logout),
    );
  });

  it('should put success, close streams and redirect to login after API call', () => {
    const iterator = logoutSaga();
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal([
      put(actions.logoutSucceeded()),
      put(actions.closeEvents()),
      put(actions.closeLogs()),
      put(push('/login')),
    ]);
  });

  it('should put error on failure', () => {
    const iterator = logoutSaga();
    iterator.next();

    expect(
      iterator.throw(new Error('Test')).value,
    ).to.deep.equal([
      put(actions.logoutFailed('Error: Test')),
    ]);
  });
});
