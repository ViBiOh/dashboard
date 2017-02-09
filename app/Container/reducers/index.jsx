import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import containers from './containers';
import container from './container';
import error from './error';

const appReducers = combineReducers({
  containers,
  container,
  error,
  routing: routerReducer,
});

export default appReducers;
