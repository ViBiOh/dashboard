import { combineReducers } from 'redux';
import throbber from './throbber';
import containers from './containers';
import error from './error';

const appReducers = combineReducers({
  throbber,
  containers,
  error,
});

export default appReducers;
