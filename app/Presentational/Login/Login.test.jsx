/* eslint-disable import/no-extraneous-dependencies */
/* eslint-env mocha */
import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { shallow, mount } from 'enzyme';
import Login from './Login';

describe('Login', () => {
  it('should render into a span', () => {
    const wrapper = shallow(<Login onLogin={() => null} />);

    expect(wrapper.type()).to.equal('span');
  });

  it('should have a h2 title', () => {
    const wrapper = shallow(<Login onLogin={() => null} />);

    expect(wrapper.find('h2').text()).to.equal('Login');
  });

  it('should call given onLogin method', () => {
    const onLogin = sinon.spy();

    const wrapper = mount(<Login onLogin={onLogin} />);
    wrapper.find('ThrobberButton').simulate('click');

    expect(onLogin.called).to.equal(true);
  });
});
