import test from 'ava';
import sinon from 'sinon';
import { fork, cancel } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import DockerService from '../../Service/DockerService';
import { readEventsSaga, debounceFetchContainersSaga } from './';

test('should call DockerService.events', (t) => {
  const eventsSpy = sinon.stub(DockerService, 'events').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readEventsSaga();
  const value = iterator.next().value;
  DockerService.events.restore();

  t.true(eventsSpy.called);
  t.truthy(value.TAKE);
  t.truthy(value.TAKE.channel);
});

test('should fork debounced fetch containers when content is in channel', (t) => {
  sinon.stub(DockerService, 'events');

  const iterator = readEventsSaga({ id: 'Test' });
  iterator.next();
  DockerService.events.restore();

  t.deepEqual(iterator.next('content').value, fork(debounceFetchContainersSaga));
});

test('should cancel task before forking a new one when content is in channel', (t) => {
  sinon.stub(DockerService, 'events');
  const mockTask = createMockTask();

  const iterator = readEventsSaga({ id: 'Test' });
  iterator.next();
  DockerService.events.restore();
  iterator.next();
  iterator.next(mockTask);

  t.deepEqual(iterator.next().value, cancel(mockTask));
});

test('should close channel and websocket on error/cancel', (t) => {
  const close = sinon.spy();
  sinon.stub(DockerService, 'events').callsFake(() => ({
    close,
  }));

  const iterator = readEventsSaga();
  iterator.next();
  DockerService.events.restore();
  try {
    iterator.throw(new Error('Error test'));
  } catch (e) {} // eslint-disable-line no-empty

  t.true(close.called);
});
