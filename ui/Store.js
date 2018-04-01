import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { routerMiddleware } from 'react-router-redux';
import appReducers from './reducers';
import appSagas from './sagas';
import history from './History';

/**
 * ReduxSaga configuration.
 * @type {Object}
 */
const sagaMiddleware = createSagaMiddleware();

/**
 * Redux store.
 * @type {Object}
 */
const appStore = createStore(
  appReducers,
  applyMiddleware(routerMiddleware(history), sagaMiddleware),
);

sagaMiddleware.run(appSagas);

/**
 * Redux's store of application.
 */
export default appStore;
