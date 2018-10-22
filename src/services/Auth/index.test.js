import test from 'ava';
import sinon from 'sinon';
import funtch from 'funtch';
import btoa from '../../utils/btoa';
import Auth from './index';

test.beforeEach(() => {
  function send(url, auth, method, content) {
    return Promise.resolve({
      url,
      auth,
      content,
      method,
    });
  }

  const fetch = (url, auth) => ({
    get: () => send(url, auth, 'get'),
    post: body => send(url, auth, 'post', body),
    put: body => send(url, auth, 'put', body),
    delete: () => send(url, auth, 'delete'),
  });

  sinon.stub(funtch, 'url').callsFake(url => ({
    error: () => ({
      ...fetch(url),
      auth: auth => ({
        ...fetch(url, auth),
        error: () => fetch(url, auth),
      }),
    }),
  }));
});

test.afterEach(() => {
  funtch.url.restore();
});

test.serial('should forge request to get github access token', t =>
  Auth.getGithubAccessToken('state', 'code').then(({ url }) => {
    t.is(url, 'undefined/login/github?state=state&code=code');
  }),
);

test.serial('should basicLogin with given username and password', t =>
  Auth.basicLogin('admin', 'password').then(result => {
    t.is(result, `Basic ${btoa('admin:password')}`);
  }),
);
