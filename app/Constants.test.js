import test from 'ava';
import sinon from 'sinon';
import funtch from 'funtch';
import Constants from './Constants';

test.beforeEach(() => {
  sinon
    .stub(funtch, 'get')
    .callsFake(url => Promise.resolve({ url, API_URL: 'localhost', WS_URL: 'ws://localhost' }));
});

test.afterEach(() => {
  funtch.get.restore();
});

test.serial('should fetch data from /env', t =>
  Constants.init().then(({ url }) => {
    t.truthy(/env/i.test(url));
  }),
);

test.serial('should return API_URL from context', (t) => {
  Constants.init();
  t.is(Constants.getApiUrl(), 'localhost');
});

test.serial('should return WS_URL from context', (t) => {
  Constants.init();
  t.is(Constants.getWsUrl(), 'ws://localhost');
});
