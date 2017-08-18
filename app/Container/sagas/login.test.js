import test from 'ava';
import { call, put } from 'redux-saga/effects';
import { STORAGE_KEY_AUTH } from '../../Constants';
import AuthService from '../../Service/AuthService';
import localStorageService from '../../Service/LocalStorageService';
import actions from '../actions';
import { loginSaga } from './';

test('should call AuthService.login with given username and password', (t) => {
  const iterator = loginSaga({
    username: 'Test',
    password: 'secret',
  });

  t.deepEqual(iterator.next().value, call(AuthService.basicLogin, 'Test', 'secret'));
});

test('should put success, info, open event stream and go home after API call', (t) => {
  const iterator = loginSaga({});
  iterator.next();

  t.deepEqual(iterator.next('Basic hash').value, [
    call([localStorageService, localStorageService.setItem], STORAGE_KEY_AUTH, 'Basic hash'),
    put(actions.loginSucceeded()),
    put(actions.info()),
    put(actions.goHome()),
  ]);
});

test('should put error on failure', (t) => {
  const iterator = loginSaga({});
  iterator.next();

  t.deepEqual(iterator.throw(new Error('Test')).value, put(actions.loginFailed('Error: Test')));
});
