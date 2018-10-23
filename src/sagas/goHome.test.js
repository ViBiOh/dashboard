import test from 'ava';
import { put, all } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import actions from 'actions';
import { goHomeSaga } from './index';

test('should clear errors and redirect to root', t => {
  const iterator = goHomeSaga({ redirect: 'list' });

  t.deepEqual(iterator.next().value, all([put(actions.setError('')), put(push('/list'))]));
});
