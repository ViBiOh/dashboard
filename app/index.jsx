import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import appDockerDeploy from './Container/reducers';
import LoginContainer from './Container/LoginContainer';
import ContainersListContainer from './Container/ContainersListContainer';
import ContainerContainer from './Container/ContainerContainer';
import ComposeContainer from './Container/ComposeContainer';

import Main from './Presentational/Main/Main';

ReactDOM.render(
  <Provider store={createStore(appDockerDeploy)}>
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
