import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import appReducers from './Container/reducers';
import appSaga from './Container/sagas';

const sagaMiddleware = createSagaMiddleware();

const appStore = createStore(
  appReducers,
  applyMiddleware(routerMiddleware(browserHistory), sagaMiddleware)),
);

sagaMiddleware.run(appSaga);

export default appStore;
