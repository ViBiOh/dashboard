import test from 'ava';
import { call, take } from 'redux-saga/effects';
import actions from '../actions';
import { writeBusSaga } from './';

test('should wait for write action', (t) => {
  const iterator = writeBusSaga();

  t.deepEqual(
    iterator.next().value,
    take([
      actions.OPEN_EVENTS,
      actions.OPEN_LOGS,
      actions.OPEN_STATS,
      actions.CLOSE_EVENTS,
      actions.CLOSE_LOGS,
      actions.CLOSE_STATS,
    ]),
  );
});

test('should send received payload', (t) => {
  const send = () => null;

  const iterator = writeBusSaga({ send });
  iterator.next();

  t.deepEqual(iterator.next({ payload: 'test' }).value, call(send, 'test'));
});

test('should graceful close', (t) => {
  const send = () => null;

  const iterator = writeBusSaga({ send });
  iterator.next();

  t.deepEqual(iterator.throw(new Error('test')).value, [
    call(send, actions.closeEvents().payload),
    call(send, actions.closeLogs().payload),
    call(send, actions.closeStats().payload),
  ]);
});
