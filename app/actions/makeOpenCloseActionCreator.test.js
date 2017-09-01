import test from 'ava';
import { makeOpenCloseActionCreator } from './';

test('should return action type', (t) => {
  const busActions = makeOpenCloseActionCreator('channel');
  t.is(busActions.OPEN_CHANNEL, 'OPEN_CHANNEL');
  t.is(busActions.CLOSE_CHANNEL, 'CLOSE_CHANNEL');
  t.is(busActions.CHANNEL_OPENED, 'CHANNEL_OPENED');
  t.is(busActions.CHANNEL_CLOSED, 'CHANNEL_CLOSED');
});

test('should return action creator', (t) => {
  const busActions = makeOpenCloseActionCreator('channel');
  t.deepEqual(busActions.openChannel(), {
    type: 'OPEN_CHANNEL',
  });
  t.deepEqual(busActions.closeChannel(), {
    type: 'CLOSE_CHANNEL',
  });
  t.deepEqual(busActions.channelOpened(), {
    type: 'CHANNEL_OPENED',
  });
  t.deepEqual(busActions.channelClosed(), {
    type: 'CHANNEL_CLOSED',
  });
});
