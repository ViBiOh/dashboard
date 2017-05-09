import test from 'ava';
import sinon from 'sinon';
import { put } from 'redux-saga/effects';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { readStatsSaga } from './';

test('should call DockerService.stats with given id', (t) => {
  const statsSpy = sinon.stub(DockerService, 'stats').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readStatsSaga({ id: 'Test' });
  const value = iterator.next().value;
  DockerService.stats.restore();

  t.true(statsSpy.called);
  t.truthy(value.TAKE);
  t.truthy(value.TAKE.channel);
});

test('should addLog when content is in channel', (t) => {
  sinon.stub(DockerService, 'stats').callsFake(() => ({
    close: () => null,
  }));

  const iterator = readStatsSaga({ id: 'Test' });
  iterator.next();
  DockerService.stats.restore();

  t.deepEqual(iterator.next('content').value, put(actions.addStat('content')));
});

test('should close channel and websocket on error/cancel', (t) => {
  const close = sinon.spy();
  sinon.stub(DockerService, 'stats').callsFake(() => ({
    close,
  }));

  const iterator = readStatsSaga({ id: 'Test' });
  iterator.next();
  DockerService.stats.restore();
  try {
    iterator.throw(new Error('Error test'));
  } catch (e) {} // eslint-disable-line no-empty

  t.true(close.called);
});
