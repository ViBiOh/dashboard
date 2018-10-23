import test from 'ava';
import sinon from 'sinon';
import reducer, { initialState } from './error';

test('should have a default empty state', t => {
  t.is(reducer(undefined, { type: 'ON_CHANGE' }), initialState);
});

test('should store given error on defined action', t => {
  t.is(reducer(initialState, { type: 'SET_ERROR', error: 'invalid' }), 'invalid');
});

test('should store given error on pattern action type', t => {
  t.is(reducer(initialState, { type: 'REQUEST_FAILED', error: 'invalid' }), 'invalid');
});

test('should restore error on succeed', t => {
  t.is(reducer('invalid', { type: 'REQUEST_SUCCEEDED' }), initialState);
});

test('should report to rollbar on error', t => {
  global.Rollbar = {
    error: sinon.spy(),
  };

  reducer(initialState, { type: 'SET_ERROR', error: 'invalid' })
  t.is(global.Rollbar.error.calledWith('invalid'), true);

  delete global.Rollbar;
});
