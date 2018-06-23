import test from 'ava';
import { call, put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import Docker from '../services/Docker';
import actions from '../actions';
import { actionContainerSaga } from '.';

test('should call Docker service from given name with given id', t => {
  const iterator = actionContainerSaga({
    action: 'containerStart',
    id: 'test',
  });

  t.deepEqual(iterator.next().value, call(Docker.containerStart, 'test'));
});

test('should put success after API call', t => {
  const iterator = actionContainerSaga({
    action: 'containerStart',
  });
  iterator.next();

  t.deepEqual(iterator.next().value, put(actions.actionContainerSucceeded()));
});

test('should put fetch container after API call', t => {
  const iterator = actionContainerSaga({
    action: 'containerStart',
    id: 'test',
  });
  iterator.next();
  iterator.next();

  t.deepEqual(iterator.next().value, put(actions.fetchContainer('test')));
});

test('should go home after delete API call', t => {
  const iterator = actionContainerSaga({
    action: 'containerDelete',
    id: 'test',
  });
  iterator.next();
  iterator.next();

  t.deepEqual(iterator.next().value, put(push('/')));
});

test('should put error on failure', t => {
  const iterator = actionContainerSaga({
    action: 'containerDelete',
    id: 'test',
  });
  iterator.next();

  t.deepEqual(
    iterator.throw(new Error('Test')).value,
    put(actions.actionContainerFailed('Error: Test')),
  );
});
