/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import DockerService from '../../Service/DockerService';
import { fetchContainerSucceeded, fetchContainerFailed } from '../actions';
import { fetchContainerSaga } from './';

describe('FetchContainer Saga', () => {
  it('should call DockerService.infos with given id', () => {
    const iterator = fetchContainerSaga({
      id: 'test',
    });

    expect(
      iterator.next().value,
    ).to.deep.equal(
      call(DockerService.infos, 'test'),
    );
  });

  it('should put success after API call', () => {
    const iterator = fetchContainerSaga({});
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      put(fetchContainerSucceeded()),
    );
  });

  it('should put error on failure', () => {
    const iterator = fetchContainerSaga({});

    expect(
      iterator.throw(new Error('Test error' )).value,
    ).to.deep.equal(
      put(fetchContainerFailed('Test error')),
    );
  });
});
