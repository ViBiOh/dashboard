import test from 'ava';
import reducer, { initialState } from './pending';

test('should have a default empty state', t => {
  t.deepEqual(reducer(undefined, { type: 'ON_CHANGE' }), initialState);
});

test('should return given state if action type does not match', t => {
  t.deepEqual(reducer(initialState, { type: 'ON_CHANGE' }), initialState);
});

test('should turn on pending if action type match pattern', t => {
  t.deepEqual(reducer(initialState, { type: 'ACTION_REQUEST' }), { ...initialState, ACTION: true });
});

test('should return given state if pattern match but pending not present', t => {
  t.deepEqual(reducer(initialState, { type: 'VALIDATE_SUCCEEDED' }), initialState);
});

test('should turn off pending if action type match pattern', t => {
  t.deepEqual(reducer({ ...initialState, ACTION: true }, { type: 'ACTION_SUCCEEDED' }), {
    ...initialState,
    ACTION: false,
  });
});
