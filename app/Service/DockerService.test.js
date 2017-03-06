/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Fetch from 'js-fetch';
import btoa from '../Tools/btoa';
import localStorageService from './LocalStorageService';
import DockerService, { authStorage } from './DockerService';

describe('DockerService', () => {
  let data;

  beforeEach(() => {
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

    sinon.stub(localStorageService, 'isEnabled', () => false);
    sinon.stub(Fetch, 'url', url => ({
      auth: auth => ({
        ...fetch(url, auth),
        error: () => fetch(url, auth),
      }),
    }));
  });

  afterEach(() => {
    Fetch.url.restore();
    localStorageService.isEnabled.restore();
  });

  it('should determine if already logged', () => {
    sinon.stub(localStorageService, 'getItem', () => 'token');

    expect(DockerService.isLogged()).to.equal(true);
    localStorageService.getItem.restore();
  });

  it('should determine if not already logged', () => {
    sinon.stub(localStorageService, 'getItem', () => '');

    expect(DockerService.isLogged()).to.equal(false);
    localStorageService.getItem.restore();
  });

  it('should login with given username and password', () =>
    DockerService.login('admin', 'password').then((result) => {
      expect(result.url).to.match(/auth$/);
      expect(result.auth).to.eql(`Basic ${btoa('admin:password')}`);
    }));

  it('should store token in localStorage on login', () => {
    const setItemSpy = sinon.spy(localStorageService, 'setItem');

    return DockerService.login('admin', 'password').then(() => {
      localStorageService.setItem.restore();
      expect(setItemSpy.calledWith(authStorage, `Basic ${btoa('admin:password')}`)).to.equal(true);
    });
  });

  it('should drop stored token from localStorage on logout', () => {
    const removeItemSpy = sinon.spy(localStorageService, 'removeItem');

    return DockerService.logout().then(() => {
      localStorageService.removeItem.restore();
      expect(removeItemSpy.calledWith(authStorage)).to.equal(true);
    });
  });

  it('should list containers with auth', () => {
    const getItemSpy = sinon.spy(localStorageService, 'getItem');

    return DockerService.containers().then(() => {
      localStorageService.getItem.restore();
      expect(getItemSpy.calledWith(authStorage)).to.equal(true);
    });
  });

  it('should return results when listing containers', () => {
    data = {
      results: [{
        id: 1,
      }],
    };

    return DockerService.containers().then(value => expect(value).to.be.eql([{ id: 1 }]));
  });

  it('should create container with given args', () =>
    DockerService.create('test', 'composeFileContent').then((result) => {
      expect(result.url).to.match(/containers\/test\/$/);
      expect(result.content).to.equal('composeFileContent');
    }),
  );

  describe('should call API with auth', () => {
    let getItemSpy;

    beforeEach(() => {
      getItemSpy = sinon.spy(localStorageService, 'getItem');
    });

    afterEach(() => {
      localStorageService.getItem.restore();
    });

    [
      { method: 'infos', args: ['test'], httpMethod: 'get', url: /containers\/test\/$/ },
      {
        method: 'create',
        args: [
          'test',
          'composeFileContent',
        ],
        httpMethod: 'post',
        url: /containers\/test\/$/,
      },
      { method: 'start', args: ['test'], httpMethod: 'post', url: /containers\/test\/start$/ },
      { method: 'stop', args: ['test'], httpMethod: 'post', url: /containers\/test\/stop$/ },
      { method: 'restart', args: ['test'], httpMethod: 'post', url: /containers\/test\/restart$/ },
      { method: 'delete', args: ['test'], httpMethod: 'delete', url: /containers\/test\/$/ },
    ].forEach((param) => {
      it(`for ${param.method}`, () => DockerService[param.method].apply(null, param.args)
        .then((result) => {
          expect(result.method).to.eql(param.httpMethod);
          expect(result.url).to.match(param.url);
          expect(getItemSpy.calledWith(authStorage)).to.equal(true);
        }),
      );
    });
  });
});
