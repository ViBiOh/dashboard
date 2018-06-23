import test from 'ava';
import { push } from 'react-router-redux';
import actions from '../actions';
import { onErrorAction } from '.';

test('should not redirect on login', t => {
  t.deepEqual(
    onErrorAction('logoutFailed', { toString: () => 'Test failed' }),
    actions.logoutFailed('Test failed'),
  );
});

test('should redirect to login if 401', t => {
  t.deepEqual(
    onErrorAction('logoutFailed', {
      toString: () => 'Test failed',
      status: 401,
    }),
    push('/login?redirect=about%3Ablank'),
  );
});

test('should redirect to login if no auth', t => {
  t.deepEqual(
    onErrorAction('logoutFailed', {
      toString: () => 'Test failed',
      noAuth: true,
    }),
    push('/login?redirect=about%3Ablank'),
  );
});
