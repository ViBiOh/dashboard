import test from 'ava';
import { put } from 'redux-saga/effects';
import { push } from 'react-router-redux';
import actions from '../actions';
import { changeFilterSaga } from './index';

test('should push empty history if no value', t => {
  const iterator = changeFilterSaga(actions.changeFilter(''));

  t.deepEqual(iterator.next().value, put(push({ search: '' })));
});

test('should push given search if value provided', t => {
  const iterator = changeFilterSaga(actions.changeFilter('test'));

  t.deepEqual(iterator.next().value, put(push({ search: '?filter=test' })));
});
