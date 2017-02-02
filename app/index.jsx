import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import Main from './Presentational/Main/Main';
import LoginContainer from './Container/LoginContainer';
import Containers from './Container/Containers/Containers';
import Container from './Container/Container/Container';
import ComposeContainer from './Container/ComposeContainer';

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={Main}>
      <IndexRoute component={Containers} />
      <Route path="/login" component={LoginContainer} />
      <Route path="/containers/New" component={ComposeContainer} />
      <Route path="/containers/:containerId" component={Container} />
    </Route>
  </Router>,
  document.getElementById('root'),
);
