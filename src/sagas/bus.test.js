import test from 'ava';
import { cancel, fork, take } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import actions from 'actions';
import { busSaga, readBusSaga } from './index';

test('should fork read listener', t => {
  const iterator = busSaga({});

  t.deepEqual(iterator.next().value, fork(readBusSaga, {}));
});

test('should wait for close action', t => {
  const iterator = busSaga({});
  iterator.next();

  t.deepEqual(iterator.next().value, take(actions.CLOSE_BUS));
});

test('should cancel on CLOSE', t => {
  const iterator = busSaga({});
  iterator.next();

  const task = createMockTask();
  iterator.next(task);

  t.deepEqual(iterator.next().value, cancel(task));
});
