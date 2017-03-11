/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { actionContainerSaga } from './';

describe('ActionContainer Saga', () => {
  it('should call DockerService service from given name with given id', () => {
    const iterator = actionContainerSaga({
      action: 'start',
      id: 'test',
    });

    expect(
      iterator.next().value,
    ).to.deep.equal(
      call(DockerService.start, 'test'),
    );
  });

  it('should put success after API call', () => {
    const iterator = actionContainerSaga({
      action: 'start',
    });
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      put(actions.actionContainerSucceeded()),
    );
  });

  it('should put fetch container after API call', () => {
    const iterator = actionContainerSaga({
      action: 'start',
      id: 'test',
    });
    iterator.next();
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      put(actions.fetchContainer('test')),
    );
  });

  it('should go home after delete API call', () => {
    const iterator = actionContainerSaga({
      action: 'delete',
      id: 'test',
    });
    iterator.next();
    iterator.next();

    expect(
      iterator.next().value,
    ).to.deep.equal(
      put(push('/')),
    );
  });

  it('should put error on failure', () => {
    const iterator = actionContainerSaga({
      action: 'delete',
      id: 'test',
    });
    iterator.next();

    expect(
      iterator.throw(new Error('Test')).value,
    ).to.deep.equal([
      put(actions.actionContainerFailed('Error: Test')),
    ]);
  });
});
