import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import actions from './actions';
import { init } from './Constants';
import appStore from './Store';
import App from './App';

init().then(() => {
  if (!/auth/.test(document.location.pathname)) {
    appStore.dispatch(actions.refresh());
  }

  ReactDOM.render(
    <Provider store={appStore}>
      <App />
    </Provider>,
    document.getElementById('root'),
  );
});
