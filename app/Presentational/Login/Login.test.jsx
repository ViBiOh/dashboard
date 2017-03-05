/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { mount } from 'enzyme';
import Login from './Login';

describe('Login', () => {
  let wrapper;
  let onLogin;

  beforeEach(() => {
    onLogin = sinon.spy();
    wrapper = mount(<Login onLogin={onLogin} />);
  });

  it('should render into a span', () => {
    expect(wrapper.find('span').length).to.be.at.least(1);
  });

  it('should have a h2 title', () => {
    expect(wrapper.find('h2').text()).to.equal('Login');
  });

  it('should call given onLogin method', () => {
    wrapper.find('ThrobberButton').simulate('click');

    expect(onLogin.called).to.equal(true);
  });

  it('should call submit on enter key down', () => {
    wrapper.find('input').at(0).simulate('keyDown', { keyCode: 13 });

    expect(onLogin.called).to.equal(true);
  });

  it('should not call submit on other key down', () => {
    wrapper.find('input').at(1).simulate('keyDown', { keyCode: 10 });

    expect(onLogin.called).to.equal(false);
  });
});
