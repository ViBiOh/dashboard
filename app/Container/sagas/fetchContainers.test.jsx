/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import DockerService from '../../Service/DockerService';
import { fetchContainersSucceeded, fetchContainersFailed } from '../actions';
import { fetchContainersSaga } from './';

describe('FetchContainers Saga', () => {
  it('should call DockerService.containers', () => {
    const iterator = fetchContainersSaga();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      call(DockerService.containers),
    );
  });

  it('should put success after API call', () => {
    const iterator = fetchContainersSaga();
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      put(fetchContainersSucceeded()),
    );
  });

  xit('should put error on failure', () => {
    const iterator = fetchContainersSaga();

    expect(
      iterator.throw({ content: 'Test error' }).value,
    ).to.deep.equal(
      put(fetchContainersFailed('Test error')),
    );
  });
});
