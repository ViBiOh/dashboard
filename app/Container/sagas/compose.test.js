import test from 'ava';
import { call, put, select } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import DockerService from '../../Service/DockerService';
import actions from '../actions';
import { composeSaga } from './';

test('should read compose value from state', (t) => {
  const iterator = composeSaga();

  t.deepEqual(iterator.next().value, select());
});

test('should call DockerService.containerCreate with given name and file', (t) => {
  const iterator = composeSaga();
  iterator.next();

  t.deepEqual(
    iterator.next({
      compose: {
        name: 'Test',
        file: 'File of test',
      },
    }).value,
    call(DockerService.containerCreate, 'Test', 'File of test'),
  );
});

test('should put success and redirect to home after API call', (t) => {
  const iterator = composeSaga({});
  iterator.next();
  iterator.next({
    compose: {
      name: 'Test',
      file: 'File of test',
    },
  });

  t.deepEqual(iterator.next().value, [put(actions.composeSucceeded()), put(push('/'))]);
});

test('should put error on failure', (t) => {
  const iterator = composeSaga({});
  iterator.next({});

  t.deepEqual(iterator.throw(new Error('Test')).value, put(actions.composeFailed('Error: Test')));
});
