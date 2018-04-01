import test from 'ava';
import actions from '../actions';
import reducer from './container';

test('should have a default null state', (t) => {
  t.deepEqual(reducer(undefined, { type: 'ON_CHANGE' }), null);
});

test('should store container on fetch end', (t) => {
  t.deepEqual(
    reducer(undefined, actions.fetchContainerSucceeded({ id: 'test', name: 'vibioh/dasboard' })),
    { id: 'test', name: 'vibioh/dasboard' },
  );
});

test('should set bus not opened on close', (t) => {
  t.deepEqual(
    reducer({ id: 'test', name: 'vibioh/dasboard' }, actions.fetchContainerFailed()),
    null,
  );
});
