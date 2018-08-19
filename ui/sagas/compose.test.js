import test from 'ava';
import { call, put, all } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import Docker from '../services/Docker';
import actions from '../actions';
import { composeSaga } from '.';

test('should call Docker.containerCreate with given name and file', t => {
  const iterator = composeSaga({
    name: 'Test',
    file: 'File of test',
  });

  t.deepEqual(iterator.next().value, call(Docker.containerCreate, 'Test', 'File of test'));
});

test('should put success and redirect to home after API call', t => {
  const iterator = composeSaga({
    name: 'Test',
    file: 'File of test',
  });
  iterator.next();

  t.deepEqual(iterator.next().value, all([put(actions.composeSucceeded()), put(push('/'))]));
});

test('should put error on failure', t => {
  const iterator = composeSaga({});
  iterator.next({});

  t.deepEqual(iterator.throw(new Error('Test')).value, put(actions.composeFailed('Error: Test')));
});
