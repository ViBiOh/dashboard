import test from 'ava';
import { makeBusActionCreator } from './';

test('should return action type', (t) => {
  const busActions = makeBusActionCreator('stream');
  t.is(busActions.OPEN_STREAM, 'OPEN_STREAM');
  t.is(busActions.CLOSE_STREAM, 'CLOSE_STREAM');
});

test('should return action creator', (t) => {
  const busActions = makeBusActionCreator('stream');
  t.deepEqual(busActions.openStream('id'), {
    type: 'OPEN_STREAM',
    streamName: 'stream',
    payload: 'stream start id',
  });
  t.deepEqual(busActions.openStream(), {
    type: 'OPEN_STREAM',
    streamName: 'stream',
    payload: 'stream start',
  });

  t.deepEqual(busActions.closeStream('id'), {
    type: 'CLOSE_STREAM',
    streamName: 'stream',
    payload: 'stream stop id',
  });
  t.deepEqual(busActions.closeStream(), {
    type: 'CLOSE_STREAM',
    streamName: 'stream',
    payload: 'stream stop',
  });
});
