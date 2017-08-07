import test from 'ava';
import sinon from 'sinon';
import funtch from 'funtch';
import { init, getApiUrl, getWsUrl, getOauthApiUrl, getGithubOauthUrl } from './Constants';

test.beforeEach(() => {
  sinon.stub(funtch, 'get').callsFake(url =>
    Promise.resolve({
      url,
      API_URL: 'localhost',
      WS_URL: 'ws://localhost',
      OAUTH_URL: 'ws://localhost/oauth',
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

test.serial('should return OAUTH_URL from context', (t) => {
  init();
  t.is(getOauthApiUrl(), 'ws://localhost/oauth');
});

test.serial('should return OAUTH_URL from context', (t) => {
  init();
  t.is(
    getGithubOauthUrl(),
    'http://github.com/login/oauth/authorize?client_id=GITHUB_ID&state=GITHUB_STATE&redirect_uri=null/auth/github',
  );
});
