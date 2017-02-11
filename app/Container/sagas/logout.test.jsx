/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import { logoutSucceeded, logoutFailed } from '../actions';
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

  it('should put success and redirect to login after API call', () => {
    const iterator = logoutSaga();
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal([
      put(logoutSucceeded()),
      put(push('/login')),
    ]);
  });

  xit('should put error on failure', () => {
    const iterator = logoutSaga();

    expect(
      iterator.throw({ content: 'Test error' }).value,
    ).to.deep.equal(
      put(logoutFailed('Test error')),
    );
  });
});
