import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';

import Main from './Main';
import Login from './Login/Login';
import Container from './Container/Containers';

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={Main}>
      <IndexRoute component={Container} />
      <Route path="login" component={Login} />
    </Route>
  </Router>,
  document.getElementById('root'),
);
