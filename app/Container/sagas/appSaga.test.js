import test from 'ava';
import { takeLatest } from 'redux-saga/effects';
import actions from '../actions';
import appSaga, { loginSaga } from './';

test('should take latest LOGIN request', (t) => {
  const iterator = appSaga();

  t.deepEqual(iterator.next().value, takeLatest(actions.LOGIN, loginSaga));
});
