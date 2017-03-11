/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { put } from 'redux-saga/effects';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { readLogsSaga } from './';

describe('ReadLogs Saga', () => {
  it('should call DockerService.logs with given id', () => {
    const logsSpy = sinon.stub(DockerService, 'logs', () => ({
      close: () => null,
    }));

    const iterator = readLogsSaga({ id: 'Test' });
    const value = iterator.next().value;
    DockerService.logs.restore();

    expect(logsSpy.called).to.equal(true);
    expect(value).to.have.ownProperty('TAKE');
    expect(value.TAKE).to.have.ownProperty('channel');
  });

  it('should addLog when content is in channel', () => {
    sinon.stub(DockerService, 'logs');

    const iterator = readLogsSaga({ id: 'Test' });
    iterator.next();
    DockerService.logs.restore();

    expect(
      iterator.next('content').value,
    ).to.deep.equal(
      put(actions.addLog('content')),
    );
  });

  it('should close channel and websocket on error/cancel', () => {
    const close = sinon.spy();
    sinon.stub(DockerService, 'logs', () => ({
      close,
    }));

    const iterator = readLogsSaga({ id: 'Test' });
    iterator.next();
    DockerService.logs.restore();
    try {
      iterator.throw(new Error('Mocha test'));
    } catch (e) {} // eslint-disable-line no-empty

    expect(close.called).to.equal(true);
  });
});
