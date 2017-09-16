import test from 'ava';
import sinon from 'sinon';
import React from 'react';
import { mount } from 'enzyme';
import BasicAuth from './';

function defaultProps() {
  return {
    onLogin: () => null,
  };
}

test('should render as a span', (t) => {
  const wrapper = mount(<BasicAuth {...defaultProps()} />);

  t.true(wrapper.find('span').length >= 1);
});

test('should call given onLogin method', (t) => {
  const onLogin = sinon.spy();
  const wrapper = mount(<BasicAuth {...defaultProps()} onLogin={onLogin} />);

  wrapper.find('ThrobberButton').simulate('click');

  t.true(onLogin.called);
});

test('should call submit on enter key down', (t) => {
  const onLogin = sinon.spy();
  const wrapper = mount(<BasicAuth {...defaultProps()} onLogin={onLogin} />);

  wrapper
    .find('input')
    .at(0)
    .simulate('keyDown', { keyCode: 13 });

  t.true(onLogin.called);
});

test('should not call submit on other key down', (t) => {
  const onLogin = sinon.spy();
  const wrapper = mount(<BasicAuth {...defaultProps()} onLogin={onLogin} />);

  wrapper
    .find('input')
    .at(1)
    .simulate('keyDown', { keyCode: 10 });

  t.false(onLogin.called);
});
