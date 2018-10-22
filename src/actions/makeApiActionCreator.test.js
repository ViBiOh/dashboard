import test from 'ava';
import { makeApiActionCreator } from './index';

test('should return action type', t => {
  const apiActions = makeApiActionCreator('fetch', ['payload'], ['response']);
  t.is(apiActions.FETCH, 'FETCH');
  t.is(apiActions.FETCH_REQUEST, 'FETCH_REQUEST');
  t.is(apiActions.FETCH_SUCCEEDED, 'FETCH_SUCCEEDED');
  t.is(apiActions.FETCH_FAILED, 'FETCH_FAILED');
});

test('should return action creator', t => {
  const apiActions = makeApiActionCreator('fetch', ['payload'], ['response']);
  t.deepEqual(apiActions.fetch('id'), { type: 'FETCH_REQUEST', payload: 'id' });
  t.deepEqual(apiActions.fetchSucceeded('valid'), {
    type: 'FETCH_SUCCEEDED',
    response: 'valid',
  });
  t.deepEqual(apiActions.fetchFailed(new Error('hi')), {
    type: 'FETCH_FAILED',
    error: new Error('hi'),
  });
});
