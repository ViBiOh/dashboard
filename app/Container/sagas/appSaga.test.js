/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { takeLatest } from 'redux-saga/effects';
import actions from '../actions';
import appSaga, { loginSaga } from './';

describe('App Saga', () => {
  it('should take latest LOGIN request', () => {
    const iterator = appSaga();

    expect(iterator.next().value).to.deep.equal(takeLatest(actions.LOGIN, loginSaga));
  });
});
