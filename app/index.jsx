import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route, Switch } from 'react-router-dom';
import actions from './Container/actions';
import appStore from './Store';
import history from './History';
import Main from './Presentational/Main/Main';
import ContainersListContainer from './Container/ContainersListContainer';
import LoginContainer from './Container/LoginContainer';
import ComposeContainer from './Container/ComposeContainer';
import ContainerContainer from './Container/ContainerContainer';

ReactDOM.render(
  <Provider store={appStore}>
    <Router history={history}>
      <Main>
        <Route exact path="/" component={ContainersListContainer} />
        <Route path="/login" component={LoginContainer} />
        <Switch>
          <Route path="/containers/New" component={ComposeContainer} />
          <Route path="/containers/:containerId" component={ContainerContainer} />
        </Switch>
      </Main>
    </Router>
  </Provider>,
  document.getElementById('root'),
);

appStore.dispatch(actions.fetchContainers());
appStore.dispatch(actions.openEvents());
