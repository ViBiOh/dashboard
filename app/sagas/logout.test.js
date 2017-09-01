/* eslint-disable import/no-extraneous-dependencies */
import test from 'ava';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import { STORAGE_KEY_AUTH } from '../Constants';
import localStorage from '../services/LocalStorage';
import actions from '../actions';
import { logoutSaga } from './';

test('should drop storage key, put success, close streams and redirect to login after API call', (t) => {
  const iterator = logoutSaga();

  t.deepEqual(iterator.next().value, [
    call([localStorage, localStorage.removeItem], STORAGE_KEY_AUTH),
    put(actions.logoutSucceeded()),
    put(actions.closeBus()),
    put(actions.setError('')),
    put(push('/login')),
  ]);
});

test('should put error on failure', (t) => {
  const iterator = logoutSaga();
  iterator.next();

  t.deepEqual(iterator.throw(new Error('Test')).value, put(actions.logoutFailed('Error: Test')));
});
