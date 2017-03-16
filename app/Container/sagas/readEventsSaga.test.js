/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import { fork, cancel } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import DockerService from '../../Service/DockerService';
import { readEventsSaga, debounceFetchContainersSaga } from './';

describe('ReadEvents Saga', () => {
  it('should call DockerService.events', () => {
    const eventsSpy = sinon.stub(DockerService, 'events').callsFake(() => ({
      close: () => null,
    }));

    const iterator = readEventsSaga();
    const value = iterator.next().value;
    DockerService.events.restore();

    expect(eventsSpy.called).to.equal(true);
    expect(value).to.have.ownProperty('TAKE');
    expect(value.TAKE).to.have.ownProperty('channel');
  });

  it('should fork debounced fetch containers when content is in channel', () => {
    sinon.stub(DockerService, 'events');

    const iterator = readEventsSaga({ id: 'Test' });
    iterator.next();
    DockerService.events.restore();

    expect(
      iterator.next('content').value,
    ).to.deep.equal(
      fork(debounceFetchContainersSaga),
    );
  });

  it('should cancel task before forking a new one when content is in channel', () => {
    sinon.stub(DockerService, 'events');
    const mockTask = createMockTask();

    const iterator = readEventsSaga({ id: 'Test' });
    iterator.next();
    DockerService.events.restore();
    iterator.next();
    iterator.next(mockTask);

    expect(
      iterator.next().value,
    ).to.deep.equal(
      cancel(mockTask),
    );
  });

  it('should close channel and websocket on error/cancel', () => {
    const close = sinon.spy();
    sinon.stub(DockerService, 'events').callsFake(() => ({
      close,
    }));

    const iterator = readEventsSaga();
    iterator.next();
    DockerService.events.restore();
    try {
      iterator.throw(new Error('Mocha test'));
    } catch (e) {} // eslint-disable-line no-empty

    expect(close.called).to.equal(true);
  });
});
