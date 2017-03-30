import test from 'ava';
import { push } from 'react-router-redux';
import actions from '../actions';
import { onErrorActions } from './';

test('should not redirect on login', (t) => {
  t.deepEqual(onErrorActions('logoutFailed', { toString: () => 'Mocha failed' }), [
    actions.logoutFailed('Mocha failed'),
  ]);
});

test('should redirect to login if 401', (t) => {
  t.deepEqual(onErrorActions('logoutFailed', { toString: () => 'Mocha failed', status: 401 }), [
    push('/login'),
    actions.logoutFailed('Mocha failed'),
  ]);
});
