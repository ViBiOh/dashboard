import test from 'ava';
import { makeActionAndTypeCreator } from './';

test('should work with default value', (t) => {
  t.is(makeActionAndTypeCreator('ACTION_TYPE', 'actionType').ACTION_TYPE, 'ACTION_TYPE');
});
