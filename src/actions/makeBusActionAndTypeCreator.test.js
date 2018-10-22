import test from 'ava';
import { makeBusActionAndTypeCreator } from './index';

test('should return action type', t => {
  t.is(makeBusActionAndTypeCreator('OPEN_BUS', 'openBus').OPEN_BUS, 'OPEN_BUS');
});

test('should return action creator', t => {
  t.deepEqual(makeBusActionAndTypeCreator('OPEN_BUS', 'openBus').openBus(), {
    type: 'OPEN_BUS',
    streamName: undefined,
    payload: 'undefined undefined',
  });
});
