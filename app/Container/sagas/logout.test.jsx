/* eslint-disable import/no-extraneous-dependencies */
import test from 'ava';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { logoutSaga } from './';

test('should call DockerService.logout', (t) => {
  const iterator = logoutSaga();

  t.deepEqual(iterator.next().value, call(DockerService.logout));
});

test('should put success, close streams and redirect to login after API call', (t) => {
  const iterator = logoutSaga();
  iterator.next();

  t.deepEqual(iterator.next().value, [
    put(actions.logoutSucceeded()),
    put(actions.closeEvents()),
    put(actions.closeLogs()),
    put(actions.closeStats()),
    put(actions.setError('')),
    put(push('/login')),
  ]);
});

test('should put error on failure', (t) => {
  const iterator = logoutSaga();
  iterator.next();

  t.deepEqual(iterator.throw(new Error('Test')).value, put(actions.logoutFailed('Error: Test')));
});
