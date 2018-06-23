import test from 'ava';
import { put } from 'redux-saga/effects';
import actions from '../actions';
import { refreshSaga } from '.';

test('should put open bus and fetchContaines', t => {
  const iterator = refreshSaga();

  t.deepEqual(iterator.next({}).value, [put(actions.openBus()), put(actions.fetchContainers())]);
});

test('should put error on failure', t => {
  const iterator = refreshSaga({});
  iterator.next();

  t.deepEqual(iterator.throw(new Error('Test')).value, put(actions.setError('Error: Test')));
});
