import test from 'ava';
import { call, put, all } from 'redux-saga/effects';
import { STORAGE_KEY_AUTH } from '../Constants';
import Auth from '../services/Auth';
import localStorage from '../services/LocalStorage';
import actions from '../actions';
import { loginSaga } from './index';

test('should call Auth.login with given username and password', t => {
  const iterator = loginSaga({
    username: 'Test',
    password: 'secret',
  });

  t.deepEqual(iterator.next().value, call(Auth.basicLogin, 'Test', 'secret'));
});

test('should put success, info, open event stream and go home after API call', t => {
  const iterator = loginSaga({});
  iterator.next();

  t.deepEqual(
    iterator.next('Basic hash').value,
    all([
      call([localStorage, localStorage.setItem], STORAGE_KEY_AUTH, 'Basic hash'),
      put(actions.loginSucceeded()),
      put(actions.refresh()),
      put(actions.goHome()),
    ]),
  );
});

test('should put error on failure', t => {
  const iterator = loginSaga({});
  iterator.next();

  const err = new Error('Test');

  t.deepEqual(iterator.throw(err).value, put(actions.loginFailed(err)));
});
