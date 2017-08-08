import test from 'ava';
import sinon from 'sinon';
import funtch from 'funtch';
import OauthService from './OauthService';

test.beforeEach(() => {
  sinon.stub(funtch, 'url').callsFake(url => ({
    error: () => ({
      get: () =>
        Promise.resolve({
          url,
        }),
    }),
  }));
});

test.afterEach(() => {
  funtch.url.restore();
});

test.serial('should forge request to get github access token', t =>
  OauthService.getGithubAccessToken('state', 'code').then(({ url }) => {
    t.is(url, 'undefined/token/github?state=state&code=code');
  }),
);
