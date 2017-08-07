import test from 'ava';
import sinon from 'sinon';
import funtch from 'funtch';
import { init, getApiUrl, getWsUrl, getAuthApiUrl, getGithubOauthUrl } from './Constants';

test.beforeEach(() => {
  sinon.stub(funtch, 'get').callsFake(url =>
    Promise.resolve({
      url,
      API_URL: 'localhost',
      WS_URL: 'ws://localhost',
      AUTH_URL: 'localhost/oauth',
      GITHUB_OAUTH_CLIENT_ID: 'GITHUB_ID',
      GITHUB_OAUTH_STATE: 'GITHUB_STATE',
    }),
  );
});

test.afterEach(() => {
  funtch.get.restore();
});

test.serial('should fetch data from /env', t =>
  init().then(({ url }) => {
    t.truthy(/env/i.test(url));
  }),
);

test.serial('should return API_URL from context', (t) => {
  init();
  t.is(getApiUrl(), 'localhost');
});

test.serial('should return WS_URL from context', (t) => {
  init();
  t.is(getWsUrl(), 'ws://localhost');
});

test.serial('should return AUTH_URL from context', (t) => {
  init();
  t.is(getAuthApiUrl(), 'localhost/oauth');
});

test.serial('should return GitHub login URL with variables from env', (t) => {
  init();
  t.is(
    getGithubOauthUrl(),
    'http://github.com/login/oauth/authorize?client_id=GITHUB_ID&state=GITHUB_STATE&redirect_uri=null/auth/github',
  );
});
