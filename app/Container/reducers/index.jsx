import { combineReducers } from 'redux';
import containers from './containers';
import container from './container';
import error from './error';

const appReducers = combineReducers({
  containers,
  container,
  error,
});

export default appReducers;
