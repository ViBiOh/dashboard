/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import Fetch from 'js-fetch';
import btoa from '../Tools/btoa';
import DockerService from './DockerService';

describe('DockerService', () => {
  beforeEach(() => {
    sinon.stub(Fetch, 'url', urlValue => ({
      auth: auth => ({
        get: () => Promise.resolve({
          urlValue,
          auth,
        }),
      }),
    }));
  });

  afterEach(() => {
    Fetch.url.restore();
  });

  it('should login with given username and password', () =>
    DockerService.login('admin', 'password').then((result) => {
      expect(result.urlValue).to.match(/auth$/);
      expect(result.auth).to.eql(`Basic ${btoa('admin:password')}`);
    }));
});
