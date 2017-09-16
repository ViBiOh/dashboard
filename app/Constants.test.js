import test from 'ava';
import sinon from 'sinon';
import funtch from 'funtch';
import { init, getApiUrl, getWsUrl, getAuthApiUrl, getGaId, getGithubOauthUrl } from './Constants';

test.beforeEach(() => {
  sinon.stub(funtch, 'get').callsFake(url =>
    Promise.resolve({
      url,
      API_URL: 'localhost',
      WS_URL: 'ws://localhost',
      AUTH_URL: 'localhost/oauth',
      GA_ID: 'UA-000000-01',
      GITHUB_OAUTH_CLIENT_ID: 'GITHUB_ID',
      GITHUB_OAUTH_STATE: 'GITHUB_STATE',
      GITHUB_REDIRECT_URI: 'localhost',
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

test.serial('should return GA_ID from context', (t) => {
  init();
  t.is(getGaId(), 'UA-000000-01');
});

test.serial('should return GitHub login URL with variables from env', (t) => {
  init();
  t.is(
    getGithubOauthUrl(),
    'http://github.com/login/oauth/authorize?client_id=GITHUB_ID&state=GITHUB_STATE&redirect_uri=localhost',
  );
});

test.serial(
  'should return GitHub login URL with current document.location if no redirect URI provided',
  (t) => {
    funtch.get.restore();
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

    return new Promise((resolve) => {
      init().then(() => {
        t.is(
          getGithubOauthUrl(),
          'http://github.com/login/oauth/authorize?client_id=GITHUB_ID&state=GITHUB_STATE&redirect_uri=null%2Fauth%2Fgithub',
        );
        resolve();
      });
    });
  },
);
