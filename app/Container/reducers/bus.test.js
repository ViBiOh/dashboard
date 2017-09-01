import test from 'ava';
import actions from '../actions';
import reducer from './bus';

test('should have a default falsy state', (t) => {
  t.deepEqual(reducer(undefined, { type: 'ON_CHANGE' }), false);
});

test('should set bus opened on open', (t) => {
  t.deepEqual(reducer(undefined, actions.busOpened()), true);
});

test('should set bus not opened on close', (t) => {
  t.deepEqual(reducer(true, actions.busClosed()), false);
});

test('should return current state otherwise', (t) => {
  t.deepEqual(reducer(true, { type: 'ON_CHANGE' }), true);
});
