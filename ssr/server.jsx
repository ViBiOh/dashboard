import Express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducers from '../app/Container/reducers';
import App from '../app/App';

function renderFullPage(html, preloadedState) {
  return `
    <!doctype html>
    <html>
      <head>
        <title>Dashboard</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
        </script>
        <script src="/static/app.css?v={{version}}"></script>
      </body>
    </html>
  `;
}

function handleRender(req, res) {
  const store = createStore(reducers);

  const html = renderToString(
    <Provider store={store}>
      <App />
    </Provider>,
  );

  // Grab the initial state from our Redux store
  const preloadedState = store.getState();

  // Send the rendered page back to the client
  res.send(renderFullPage(html, preloadedState));
}

const app = Express();
const port = 3000;
app.use('/static', Express.static('static'));
app.use(handleRender);
app.listen(port);
