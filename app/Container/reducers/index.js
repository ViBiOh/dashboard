import { combineReducers } from 'redux';
import infos from './infos';
import containers from './containers';
import container from './container';
import logs from './logs';
import stats from './stats';
import pending from './pending';
import error from './error';
import bus from './bus';
import filter from './filter';

const appReducers = combineReducers({
  bus,
  container,
  containers,
  error,
  filter,
  infos,
  logs,
  pending,
  stats,
});

/**
 * App's reducers.
 */
export default appReducers;
