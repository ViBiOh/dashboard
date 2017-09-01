import test from 'ava';
import { put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import actions from '../actions';
import { goHomeSaga } from './';

test('should clear errors and redirect to root', (t) => {
  const iterator = goHomeSaga();

  t.deepEqual(iterator.next().value, [put(actions.setError('')), put(push('/'))]);
});
