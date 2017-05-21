import test from 'ava';
import { makeOpenCloseActionCreator } from './';

test('should work with default value', (t) => {
  t.is(
    makeOpenCloseActionCreator('actionType', ['id'], ['token']).OPEN_ACTION_TYPE,
    'OPEN_ACTION_TYPE',
  );
  t.is(
    makeOpenCloseActionCreator('actionType', ['id'], ['token']).CLOSE_ACTION_TYPE,
    'CLOSE_ACTION_TYPE',
  );
});
