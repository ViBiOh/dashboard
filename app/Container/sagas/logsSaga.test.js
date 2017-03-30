import test from 'ava';
import { fork, take, cancel } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import actions from '../actions';
import { logsSaga, readLogsSaga } from './';

test('should fork reading', (t) => {
  const iterator = logsSaga({ id: 'Test' });

  t.deepEqual(iterator.next().value, fork(readLogsSaga, { id: 'Test' }));
});

test('should wait for close signal', (t) => {
  const iterator = logsSaga({ id: 'Test' });
  iterator.next();

  t.deepEqual(iterator.next().value, take(actions.CLOSE_LOGS));
});

test('should cancel forked task', (t) => {
  const mockTask = createMockTask();
  const iterator = logsSaga({ id: 'Test' });
  iterator.next();
  iterator.next(mockTask);

  t.deepEqual(iterator.next().value, cancel(mockTask));
});
