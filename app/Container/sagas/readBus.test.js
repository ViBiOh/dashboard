import test from 'ava';
import sinon from 'sinon';
import { put, fork, cancel } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { readBusSaga, writeBusSaga } from './';

test('should call DockerService.streamBus and fork a write saga', (t) => {
  const websocket = {
    close: () => null,
  };
  const busSpy = sinon.stub(DockerService, 'streamBus').callsFake(() => websocket);

  const iterator = readBusSaga({});
  const value = iterator.next().value;
  DockerService.streamBus.restore();

  t.true(busSpy.called);
  t.deepEqual(value, fork(writeBusSaga, websocket));
});

test('should wait for event from channel', (t) => {
  sinon.stub(DockerService, 'streamBus').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readBusSaga({});
  iterator.next();
  DockerService.streamBus.restore();

  t.truthy(iterator.next(createMockTask()).value.TAKE.channel);
});

test('should put bus opened event', (t) => {
  sinon.stub(DockerService, 'streamBus').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readBusSaga({});
  iterator.next();
  DockerService.streamBus.restore();

  iterator.next(createMockTask());

  t.deepEqual(iterator.next('ready').value, [put(actions.busOpened()), put(actions.openEvents())]);
});

test('should fetch containers if events', (t) => {
  sinon.stub(DockerService, 'streamBus').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readBusSaga({});
  iterator.next();
  DockerService.streamBus.restore();

  iterator.next(createMockTask());
  iterator.next('ready');
  iterator.next();

  t.deepEqual(iterator.next('events test').value, put(actions.fetchContainers()));
});

test('should add log if logs', (t) => {
  sinon.stub(DockerService, 'streamBus').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readBusSaga({});
  iterator.next();
  DockerService.streamBus.restore();

  iterator.next(createMockTask());
  iterator.next('ready');
  iterator.next();

  t.deepEqual(iterator.next('logs test').value, put(actions.addLog('test')));
});

test('should add stats if stats', (t) => {
  sinon.stub(DockerService, 'streamBus').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readBusSaga({});
  iterator.next();
  DockerService.streamBus.restore();

  iterator.next(createMockTask());
  iterator.next('ready');
  iterator.next();

  t.deepEqual(iterator.next('stats {"value": true}').value, put(actions.addStat({ value: true })));
});

test('should do nothing if unknown', (t) => {
  sinon.stub(DockerService, 'streamBus').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readBusSaga({});
  iterator.next();
  DockerService.streamBus.restore();

  iterator.next(createMockTask());
  iterator.next('ready');
  iterator.next();

  t.truthy(iterator.next('unknown start').value.TAKE.channel);
});

test('should graceful close fork and say stream ended', (t) => {
  sinon.stub(DockerService, 'streamBus').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readBusSaga({});
  iterator.next();
  DockerService.streamBus.restore();

  const task = createMockTask();
  iterator.next(task);
  iterator.next('ready');
  iterator.next();

  t.deepEqual(iterator.throw(new Error('test')).value, [cancel(task), put(actions.busClosed())]);
});
