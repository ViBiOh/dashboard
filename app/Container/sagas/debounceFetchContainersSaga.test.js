import test from 'ava';
import { call, put } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import actions from '../actions';
import { debounceFetchContainersSaga } from './';

test('should start with a delay', (t) => {
  const iterator = debounceFetchContainersSaga();

  t.deepEqual(iterator.next().value, call(delay, 5555));
});

test('should put fetchContainers action', (t) => {
  const iterator = debounceFetchContainersSaga();
  iterator.next();

  t.deepEqual(iterator.next().value, put(actions.fetchContainers()));
});
