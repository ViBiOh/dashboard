import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { routerMiddleware } from 'react-router-redux';
import appReducers from './Container/reducers';
import appSagas from './Container/sagas';
import history from './History';

const sagaMiddleware = createSagaMiddleware();

const appStore = createStore(
  appReducers,
  applyMiddleware(routerMiddleware(history), sagaMiddleware),
);

sagaMiddleware.run(appSagas);

export default appStore;
