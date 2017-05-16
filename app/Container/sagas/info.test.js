import test from 'ava';
import { call, put } from 'redux-saga/effects';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { infoSaga } from './';

test('should call DockerService.info', (t) => {
  const iterator = infoSaga({});

  t.deepEqual(iterator.next().value, call(DockerService.info));
});

test('should put success after API call', (t) => {
  const iterator = infoSaga({});
  iterator.next();

  t.deepEqual(iterator.next().value, put(actions.infoSucceeded()));
});

test('should put error on failure', (t) => {
  const iterator = infoSaga({});
  iterator.next();

  t.deepEqual(iterator.throw(new Error('Test')).value, put(actions.infoFailed('Error: Test')));
});
