/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import { loginSucceeded, loginFailed } from '../actions';
import { loginSaga } from './';

describe('Login Saga', () => {
  it('should call DockerService.login with given username and password', () => {
    const iterator = loginSaga({
      username: 'Test',
      password: 'secret',
    });

    expect(
      iterator.next().value,
    ).to.deep.equal(
      call(DockerService.login, 'Test', 'secret'),
    );
  });

  it('should put success and redirect to home after API call', () => {
    const iterator = loginSaga({});
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal([
      put(loginSucceeded()),
      put(push('/')),
    ]);
  });

  xit('should put error on failure', () => {
    const iterator = loginSaga({});

    expect(
      iterator.throw({ content: 'Test error' }).value,
    ).to.deep.equal(
      put(loginFailed('Test error')),
    );
  });
});
