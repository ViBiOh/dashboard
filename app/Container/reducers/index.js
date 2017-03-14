import { combineReducers } from 'redux';
import containers from './containers';
import container from './container';
import logs from './logs';
import pending from './pending';
import error from './error';

const appReducers = combineReducers({
  containers,
  container,
  logs,
  pending,
  error,
});

/**
 * App's reducers.
 */
export default appReducers;
