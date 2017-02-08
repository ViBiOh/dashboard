import { combineReducers } from 'redux';
import throbber from './throbber';
import containers from './containers';
import container from './container';
import error from './error';

const appReducers = combineReducers({
  throbber,
  containers,
  container,
  error,
});

export default appReducers;
