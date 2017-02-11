/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import { composeSucceeded, composeFailed, fetchContainers } from '../actions';
import { composeSaga } from './';

describe('Compose Saga', () => {
  it('should call DockerService.create with given name and file', () => {
    const iterator = composeSaga({
      name: 'Test',
      file: 'File of test',
    });

    expect(
      iterator.next().value,
    ).to.deep.equal(
      call(DockerService.create, 'Test', 'File of test'),
    );
  });

  it('should put success, fetch containers and redirect to home after API call', () => {
    const iterator = composeSaga({});
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal([
      put(composeSucceeded()),
      put(fetchContainers()),
      put(push('/')),
    ]);
  });

  xit('should put error on failure', () => {
    const iterator = composeSaga({});

    expect(
      iterator.throw({ content: 'Test error' }).value,
    ).to.deep.equal(
      put(composeFailed('Test error')),
    );
  });
});
