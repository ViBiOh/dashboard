import { combineReducers } from 'redux';
import infos from './infos';
import containers from './containers';
import container from './container';
import logs from './logs';
import stats from './stats';
import pending from './pending';
import error from './error';
import bus from './bus';

const appReducers = combineReducers({
  infos,
  containers,
  container,
  logs,
  stats,
  pending,
  error,
  bus,
});

/**
 * App's reducers.
 */
export default appReducers;
