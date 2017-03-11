/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
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
      put(actions.fetchContainersSucceeded()),
    );
  });

  it('should put error on failure', () => {
    const iterator = fetchContainersSaga();
    iterator.next();

    expect(
      iterator.throw(new Error('Test')).value,
    ).to.deep.equal([
      put(actions.fetchContainersFailed('Error: Test')),
    ]);
  });
});
