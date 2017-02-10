import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
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
  routing: routerReducer,
});

export default appReducers;
