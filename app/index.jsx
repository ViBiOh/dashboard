import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import Main from './Main';
import Login from './Login/Login';
import Containers from './Container/Containers';
import Container from './Container/Container';
import ComposeForm from './Container/ComposeForm';

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={Main}>
      <IndexRoute component={Containers} />
      <Route path="/login" component={Login} />
      <Route path="/containers/New" component={ComposeForm} />
      <Route path="/containers/:containerId" component={Container} />
    </Route>
  </Router>,
  document.getElementById('root'),
);
