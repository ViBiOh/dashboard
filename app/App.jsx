import React from 'react';
import Route from 'react-router-dom/Route';
import Router from 'react-router-dom/Router';
import Switch from 'react-router-dom/Switch';
import Main from './presentationals/Main';
import ContainersListContainer from './containers/ContainersListContainer';
import Login from './presentationals/Login';
import BasicAuthContainer from './containers/BasicAuthContainer';
import GithubAuthContainer from './containers/GithubAuthContainer';
import ComposeContainer from './containers/ComposeContainer';
import ContainerContainer from './containers/ContainerContainer';
import history from './History';

/**
 * Application wrapper.
 */
const App = () =>
  (<Router history={history}>
    <Main>
      <Route exact path="/" component={ContainersListContainer} />
      <Route path="/login" component={Login} />
      <Route path="/auth/basic" component={BasicAuthContainer} />
      <Route path="/auth/github" component={GithubAuthContainer} />
      <Switch>
        <Route path="/containers/New" component={ComposeContainer} />
        <Route path="/containers/:containerId" component={ContainerContainer} />
      </Switch>
    </Main>
  </Router>);

App.displayName = 'App';

export default App;
