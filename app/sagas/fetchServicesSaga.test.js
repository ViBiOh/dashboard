import test from 'ava';
import { call, put } from 'redux-saga/effects';
import Docker from '../services/Docker';
import actions from '../actions';
import { fetchServicesSaga } from './';

test('should call Docker.services', (t) => {
  const iterator = fetchServicesSaga();

  t.deepEqual(iterator.next().value, call(Docker.services));
});

test('should put success after API call', (t) => {
  const iterator = fetchServicesSaga();
  iterator.next();

  t.deepEqual(iterator.next().value, put(actions.fetchServicesSucceeded()));
});

test('should put error on failure', (t) => {
  const iterator = fetchServicesSaga();
  iterator.next();

  t.deepEqual(
    iterator.throw(new Error('Test')).value,
    put(actions.fetchServicesFailed('Error: Test')),
  );
});
