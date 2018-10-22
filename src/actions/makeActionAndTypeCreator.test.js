import test from 'ava';
import { makeActionAndTypeCreator } from './index';

test('should return action type', t => {
  t.is(makeActionAndTypeCreator('ACTION_TYPE', 'actionType').ACTION_TYPE, 'ACTION_TYPE');
});

test('should return action creator', t => {
  t.deepEqual(
    makeActionAndTypeCreator('ACTION_TYPE', 'actionType', ['payload']).actionType('content'),
    {
      type: 'ACTION_TYPE',
      payload: 'content',
    },
  );
});
