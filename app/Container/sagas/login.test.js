import test from 'ava';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { loginSaga } from './';

test('should call DockerService.login with given username and password', (t) => {
  const iterator = loginSaga({
    username: 'Test',
    password: 'secret',
  });

  t.deepEqual(iterator.next().value, call(DockerService.login, 'Test', 'secret'));
});

test('should put success, info, open event stream and go home after API call', (t) => {
  const iterator = loginSaga({});
  iterator.next();

  t.deepEqual(iterator.next().value, [
    put(actions.loginSucceeded()),
    put(actions.info()),
    put(push('/')),
  ]);
});

test('should put error on failure', (t) => {
  const iterator = loginSaga({});
  iterator.next();

  t.deepEqual(iterator.throw(new Error('Test')).value, put(actions.loginFailed('Error: Test')));
});
