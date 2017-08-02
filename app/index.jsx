import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Route from 'react-router-dom/Route';
import Router from 'react-router-dom/Router';
import Switch from 'react-router-dom/Switch';
import actions from './Container/actions';
import Constants from './Constants';
import appStore from './Store';
import history from './History';
import Main from './Presentational/Main/Main';
import ContainersListContainer from './Container/ContainersListContainer';
import LoginContainer from './Container/LoginContainer';
import ComposeContainer from './Container/ComposeContainer';
import ContainerContainer from './Container/ContainerContainer';

Constants.init().then(() => {
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

  appStore.dispatch(actions.info());
});
