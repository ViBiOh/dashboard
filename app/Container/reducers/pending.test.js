import test from 'ava';
import reducer from './pending';

test('should have a default empty state', (t) => {
  t.deepEqual(reducer(undefined, { type: 'ON_CHANGE' }), {});
});

test('should return given state if action type does not match', (t) => {
  t.deepEqual(reducer({ ACTION: true }, { type: 'ON_CHANGE' }), { ACTION: true });
});

test('should turn on pending if action type match pattern', (t) => {
  t.deepEqual(reducer({}, { type: 'ACTION_REQUEST' }), { ACTION: true });
});

test('should return given state if pattern match but pending not present', (t) => {
  t.deepEqual(reducer({ ACTION: true }, { type: 'VALIDATE_SUCCEEDED' }), { ACTION: true });
});

test('should turn off pending if action type match pattern', (t) => {
  t.deepEqual(reducer({ ACTION: true }, { type: 'ACTION_SUCCEEDED' }), { ACTION: false });
});
