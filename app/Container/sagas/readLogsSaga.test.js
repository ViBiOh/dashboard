import test from 'ava';
import sinon from 'sinon';
import { put } from 'redux-saga/effects';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { readLogsSaga } from './';

test('should call DockerService.logs with given id', (t) => {
  const logsSpy = sinon.stub(DockerService, 'containerLogs').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readLogsSaga({ id: 'Test' });
  const value = iterator.next().value;
  DockerService.containerLogs.restore();

  t.true(logsSpy.called);
  t.truthy(value.TAKE);
  t.truthy(value.TAKE.channel);
});

test('should addLog when content is in channel', (t) => {
  sinon.stub(DockerService, 'containerLogs');

  const iterator = readLogsSaga({ id: 'Test' });
  iterator.next();
  DockerService.containerLogs.restore();

  t.deepEqual(iterator.next('content').value, put(actions.addLog('content')));
});

test('should close channel and websocket on error/cancel', (t) => {
  const close = sinon.spy();
  sinon.stub(DockerService, 'containerLogs').callsFake(() => ({
    close,
  }));

  const iterator = readLogsSaga({ id: 'Test' });
  iterator.next();
  DockerService.containerLogs.restore();
  try {
    iterator.throw(new Error('Error test'));
  } catch (e) {} // eslint-disable-line no-empty

  t.true(close.called);
});
