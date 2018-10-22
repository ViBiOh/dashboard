import test from 'ava';
import sinon from 'sinon';
import funtch from 'funtch';
import { STORAGE_KEY_AUTH } from '../../Constants';
import localStorage from '../LocalStorage';
import Docker from './index';

let data;
let getItemSpy;

sinon.stub(localStorage, 'isEnabled').callsFake(() => false);

test.beforeEach(() => {
  data = null;

  function send(url, auth, method, content) {
    if (data) {
      return Promise.resolve(data);
    }

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

  getItemSpy = sinon.stub(localStorage, 'getItem').callsFake(() => 'token');

  sinon.stub(funtch, 'url').callsFake(url => ({
    error: () => ({
      auth: auth => ({
        ...fetch(url, auth),
        error: () => fetch(url, auth),
      }),
    }),
  }));
});

test.afterEach(() => {
  funtch.url.restore();
  localStorage.getItem.restore();
});

test.serial('should throw error if not auth find', t => {
  localStorage.getItem.restore();
  sinon.stub(localStorage, 'getItem').callsFake(() => '');

  const error = t.throws(() => Docker.containers());
  t.is(error.message, 'Authentification not find');
});

test.serial('should list containers with auth', t =>
  Docker.containers().then(() => {
    t.true(getItemSpy.calledWith(STORAGE_KEY_AUTH));
  }),
);

test.serial('should return results when listing containers', t => {
  data = {
    results: [
      {
        id: 1,
      },
    ],
  };

  return Docker.containers().then(value => t.deepEqual(value, [{ id: 1 }]));
});

test.serial('should create container with given args', t =>
  Docker.containerCreate('test', 'composeFileContent').then(result => {
    t.true(/deploy\/test\/$/.test(result.url));
    t.is(result.content, 'composeFileContent');
  }),
);

[
  {
    method: 'containerInfos',
    args: ['test'],
    httpMethod: 'get',
    url: /containers\/test\/$/,
  },
  {
    method: 'containerCreate',
    args: ['test', 'composeFileContent'],
    httpMethod: 'post',
    url: /deploy\/test\/$/,
  },
  {
    method: 'containerStart',
    args: ['test'],
    httpMethod: 'post',
    url: /containers\/test\/start$/,
  },
  {
    method: 'containerStop',
    args: ['test'],
    httpMethod: 'post',
    url: /containers\/test\/stop$/,
  },
  {
    method: 'containerRestart',
    args: ['test'],
    httpMethod: 'post',
    url: /containers\/test\/restart$/,
  },
  {
    method: 'containerDelete',
    args: ['test'],
    httpMethod: 'delete',
    url: /containers\/test\/$/,
  },
].forEach(param => {
  test.serial(`for ${param.method}`, t =>
    Docker[param.method].apply(null, param.args).then(result => {
      t.is(result.method, param.httpMethod);
      t.true(param.url.test(result.url));
      t.true(getItemSpy.calledWith(STORAGE_KEY_AUTH));
    }),
  );
});

test.serial('should send auth on streamBus opening', t => {
  const onMessage = sinon.spy();
  const wsSend = sinon.spy();

  global.WebSocket = () => ({
    send: wsSend,
    onmessage: onMessage,
  });

  Docker.streamBus(onMessage).onopen();

  t.true(wsSend.calledWith('token'));
  t.true(getItemSpy.calledWith(STORAGE_KEY_AUTH));
});

test.serial('should call onMessage callback for streamBus', t => {
  const onMessage = sinon.spy();
  const wsSend = sinon.spy();

  global.WebSocket = () => ({
    send: wsSend,
    onmessage: onMessage,
  });

  Docker.streamBus(onMessage).onmessage({ data: 'test' });

  t.true(onMessage.calledWith('test'));
});
