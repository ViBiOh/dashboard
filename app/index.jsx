import React from 'react';
import ReactGA from 'react-ga';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import actions from './actions';
import { init, getGaId } from './Constants';
import appStore from './Store';
import App from './App';

init().then(() => {
  if (!/auth/.test(document.location.pathname)) {
    appStore.dispatch(actions.info());
  }

  const gaId = getGaId();
  if (gaId) {
    ReactGA.initialize(gaId);
    ReactGA.pageview(window.location.pathname + window.location.search);
  }

  ReactDOM.render(
    <Provider store={appStore}>
      <App />
    </Provider>,
    document.getElementById('root'),
  );
});
