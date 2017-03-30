import test from 'ava';
import { fork, take, cancel } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import actions from '../actions';
import { eventsSaga, readEventsSaga } from './';

test('should fork reading', (t) => {
  const iterator = eventsSaga();

  t.deepEqual(iterator.next().value, fork(readEventsSaga));
});

test('should wait for close signal', (t) => {
  const iterator = eventsSaga();
  iterator.next();

  t.deepEqual(iterator.next().value, take(actions.CLOSE_EVENTS));
});

test('should cancel forked task', (t) => {
  const mockTask = createMockTask();
  const iterator = eventsSaga();
  iterator.next();
  iterator.next(mockTask);

  t.deepEqual(iterator.next().value, cancel(mockTask));
});
