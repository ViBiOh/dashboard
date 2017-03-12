/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import actions from '../actions';
import { debounceFetchContainersSaga } from './';

describe('Debounced FetchContainers Saga', () => {
  it('should start with a delay', () => {
    const iterator = debounceFetchContainersSaga();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      call(delay, 5555),
    );
  });

  it('should put fetchCOntainers action', () => {
    const iterator = debounceFetchContainersSaga();
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      put(actions.fetchContainers()),
    );
  });
});
