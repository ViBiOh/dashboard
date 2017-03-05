/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { mount } from 'enzyme';
import Compose from './Compose';

describe('Compose', () => {
  let wrapper;
  let onCompose;
  let onBack;

  beforeEach(() => {
    onCompose = sinon.spy();
    onBack = sinon.spy();
    wrapper = mount(<Compose onCompose={onCompose} onBack={onBack} />);
  });

  it('should render into a span', () => {
    expect(wrapper.find('span').length).to.be.at.least(1);
  });

  it('should have a h2 title', () => {
    expect(wrapper.find('h2').text()).to.equal('Create an app');
  });

  it('should call given onCompose method', () => {
    wrapper.find('ThrobberButton').simulate('click');

    expect(onCompose.called).to.equal(true);
  });

  it('should call submit on enter key down', () => {
    wrapper.find('input').simulate('keyDown', { keyCode: 13 });

    expect(onCompose.called).to.equal(true);
  });

  it('should not call submit on other key down', () => {
    wrapper.find('textarea').simulate('keyDown', { keyCode: 10 });

    expect(onCompose.called).to.equal(false);
  });
});
