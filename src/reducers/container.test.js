import test from 'ava';
import actions from 'actions';
import reducer, { initialState } from './container';

test('should have a default null state', t => {
  t.deepEqual(reducer(undefined, { type: 'ON_CHANGE' }), initialState);
});

test('should store container on fetch end', t => {
  t.deepEqual(
    reducer(initialState, actions.fetchContainerSucceeded({ id: 'test', name: 'vibioh/dasboard' })),
    { id: 'test', name: 'vibioh/dasboard' },
  );
});

test('should reset to default state on error', t => {
  t.deepEqual(
    reducer({ id: 'test', name: 'vibioh/dasboard' }, actions.fetchContainerFailed()),
    initialState,
  );
});
