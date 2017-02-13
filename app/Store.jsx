import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';
import createSagaMiddleware from 'redux-saga';
import { browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';
import appReducers from './Container/reducers';
import appSaga from './Container/sagas';

const sagaMiddleware = createSagaMiddleware();

const appStore = createStore(
  appReducers,
  composeWithDevTools(
    applyMiddleware(routerMiddleware(browserHistory)),
    applyMiddleware(sagaMiddleware),
  ),
);

sagaMiddleware.run(appSaga);

export default appStore;
