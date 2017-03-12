/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { fork } from 'redux-saga/effects';
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
});
