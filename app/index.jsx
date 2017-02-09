import React from 'react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import { routerMiddleware } from 'react-router-redux';

import appReducers from './Container/reducers';
import appSaga from './Container/sagas';
import LoginContainer from './Container/LoginContainer';
import ContainersListContainer from './Container/ContainersListContainer';
import ContainerContainer from './Container/ContainerContainer';
import ComposeContainer from './Container/ComposeContainer';

import Main from './Presentational/Main/Main';

const sagaMiddleware = createSagaMiddleware();
const appStore = createStore(
  appReducers,
  applyMiddleware(routerMiddleware(browserHistory)),
  applyMiddleware(sagaMiddleware),
);

sagaMiddleware.run(appSaga);

ReactDOM.render(
  <Provider store={appStore}>
    <Router history={browserHistory}>
      <Route path="/" component={Main}>
        <IndexRoute component={ContainersListContainer} />
        <Route path="/login" component={LoginContainer} />
        <Route path="/containers/New" component={ComposeContainer} />
        <Route path="/containers/:containerId" component={ContainerContainer} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('root'),
);
