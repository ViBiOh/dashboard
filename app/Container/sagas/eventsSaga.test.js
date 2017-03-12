/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { fork, take, cancel } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import actions from '../actions';
import { eventsSaga, readEventsSaga } from './';

describe('Events Saga', () => {
  it('should fork reading', () => {
    const iterator = eventsSaga();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      fork(readEventsSaga),
    );
  });

  it('should wait for close signal', () => {
    const iterator = eventsSaga();
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      take(actions.CLOSE_EVENTS),
    );
  });

  it('should cancel forked task', () => {
    const mockTask = createMockTask();
    const iterator = eventsSaga();
    iterator.next();
    iterator.next(mockTask);

    expect(
      iterator.next().value,
    ).to.deep.equal(
      cancel(mockTask),
    );
  });
});
