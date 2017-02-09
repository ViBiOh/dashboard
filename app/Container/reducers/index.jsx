import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import containers from './containers';
import container from './container';
import loginPending from './loginPending';
import error from './error';

const appReducers = combineReducers({
  containers,
  container,
  loginPending,
  error,
  routing: routerReducer,
});

export default appReducers;
