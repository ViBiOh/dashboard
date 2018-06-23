import test from 'ava';
import { call, put } from 'redux-saga/effects';
import Docker from '../services/Docker';
import actions from '../actions';
import { fetchContainerSaga } from '.';

test('should call Docker.containerInfos with given id', t => {
  const iterator = fetchContainerSaga({
    id: 'test',
  });

  t.deepEqual(iterator.next().value, call(Docker.containerInfos, 'test'));
});

test('should put success after API call', t => {
  const iterator = fetchContainerSaga({});
  iterator.next();

  t.deepEqual(iterator.next().value, put(actions.fetchContainerSucceeded()));
});

test('should put error on failure', t => {
  const iterator = fetchContainerSaga({});
  iterator.next();

  t.deepEqual(
    iterator.throw(new Error('Test')).value,
    put(actions.fetchContainerFailed('Error: Test')),
  );
});
