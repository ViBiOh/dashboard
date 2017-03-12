/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { fork, take, cancel } from 'redux-saga/effects';
import { createMockTask } from 'redux-saga/utils';
import actions from '../actions';
import { logsSaga, readLogsSaga } from './';

describe('Logs Saga', () => {
  it('should fork reading', () => {
    const iterator = logsSaga({ id: 'Test' });

    expect(
      iterator.next().value,
    ).to.deep.equal(
      fork(readLogsSaga, { id: 'Test' }),
    );
  });

  it('should wait for close signal', () => {
    const iterator = logsSaga({ id: 'Test' });
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      take(actions.CLOSE_LOGS),
    );
  });

  it('should cancel forked task', () => {
    const mockTask = createMockTask();
    const iterator = logsSaga({ id: 'Test' });
    iterator.next();
    iterator.next(mockTask);

    expect(
      iterator.next().value,
    ).to.deep.equal(
      cancel(mockTask),
    );
  });
});
