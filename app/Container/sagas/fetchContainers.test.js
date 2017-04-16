import test from 'ava';
import { call, put } from 'redux-saga/effects';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { fetchContainersSaga } from './';

test('should call DockerService.containers', (t) => {
  const iterator = fetchContainersSaga();

  t.deepEqual(iterator.next().value, call(DockerService.containers));
});

test('should put success after API call', (t) => {
  const iterator = fetchContainersSaga();
  iterator.next();

  t.deepEqual(iterator.next().value, put(actions.fetchContainersSucceeded()));
});

test('should put error on failure', (t) => {
  const iterator = fetchContainersSaga();
  iterator.next();

  t.deepEqual(iterator.throw(new Error('Test')).value, [
    put(actions.fetchContainersFailed('Error: Test')),
  ]);
});
